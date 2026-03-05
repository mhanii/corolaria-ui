"use client"

import { useEffect, useMemo, useState } from "react"
import { ResearchFlow } from "@/components/chat/ResearchFlow"
import { StreamStatusEvent } from "@/lib/api/types"
import { cn } from "@/lib/utils"

const PLAN_STEPS = [
  "Delimitar alcance legal y supuestos clave",
  "Identificar normativa estatal y autonómica aplicable",
  "Recuperar jurisprudencia reciente de tribunales superiores",
  "Priorizar sentencias por afinidad fáctica",
  "Cruzar doctrina administrativa y criterios técnicos",
  "Detectar contradicciones y puntos de riesgo",
  "Agrupar hallazgos en líneas argumentales",
  "Asignar peso probatorio por fuente",
  "Redactar conclusiones provisionales",
  "Preparar recomendación estratégica final",
] as const

const USER_PROMPT =
  "Necesito una búsqueda profunda sobre responsabilidad de administradores en insolvencia inminente y criterios recientes del TS."

const STEP_TICK_MS = 6000
const RESULT_TICK_MS = 300
const HOLD_FINAL_MS = 1000
const TARGET_RESULTS = 150

function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) return

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onChange = () => setReducedMotion(mediaQuery.matches)

    onChange()
    mediaQuery.addEventListener("change", onChange)

    return () => mediaQuery.removeEventListener("change", onChange)
  }, [])

  return reducedMotion
}

export function DeepResearchDemo() {
  const reducedMotion = useReducedMotion()
  const [isMobileViewport, setIsMobileViewport] = useState(false)

  const [showUserMessage, setShowUserMessage] = useState(false)
  const [hasPlanStarted, setHasPlanStarted] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [resultCount, setResultCount] = useState(0)

  useEffect(() => {
    const checkViewport = () => setIsMobileViewport(window.innerWidth < 640)
    checkViewport()
    window.addEventListener("resize", checkViewport)
    return () => window.removeEventListener("resize", checkViewport)
  }, [])

  useEffect(() => {
    let cancelled = false
    let stepTimeout: ReturnType<typeof setTimeout> | null = null
    let resultTimeout: ReturnType<typeof setTimeout> | null = null
    let holdTimeout: ReturnType<typeof setTimeout> | null = null
    let startTimeout: ReturnType<typeof setTimeout> | null = null
    let planCompleted = false

    const clearTimers = () => {
      if (stepTimeout) clearTimeout(stepTimeout)
      if (resultTimeout) clearTimeout(resultTimeout)
      if (holdTimeout) clearTimeout(holdTimeout)
      if (startTimeout) clearTimeout(startTimeout)
      stepTimeout = null
      resultTimeout = null
      holdTimeout = null
      startTimeout = null
    }

    const resetScene = () => {
      if (cancelled) return
      clearTimers()
      setStepIndex(0)
      setResultCount(0)
      planCompleted = false
      runCycle()
    }

    const beginResultCounter = () => {
      let current = 0
      const tick = () => {
        if (cancelled) return

        const next = Math.min(TARGET_RESULTS, current + (current < 80 ? 4 : 2))
        current = next
        setResultCount(next)

        if (next >= TARGET_RESULTS) {
          holdTimeout = setTimeout(resetScene, reducedMotion ? 1400 : HOLD_FINAL_MS)
          return
        }
        resultTimeout = setTimeout(tick, reducedMotion ? 260 : RESULT_TICK_MS)
      }
      tick()
    }

    const runCycle = () => {
      setShowUserMessage(true)

      startTimeout = setTimeout(() => {
        if (cancelled) return

        setHasPlanStarted(true)
        setStepIndex(0)

        const stepTick = () => {
          if (cancelled || planCompleted) return
          setStepIndex((prev) => {
            if (prev >= PLAN_STEPS.length - 1) {
              planCompleted = true
              beginResultCounter()
              return prev
            }
            return prev + 1
          })
          if (!planCompleted) {
            stepTimeout = setTimeout(stepTick, reducedMotion ? 3000 : STEP_TICK_MS)
          }
        }

        stepTimeout = setTimeout(stepTick, reducedMotion ? 3000 : STEP_TICK_MS)
      }, reducedMotion ? 300 : 1200)
    }

    runCycle()

    return () => {
      cancelled = true
      clearTimers()
    }
  }, [reducedMotion])

  const status: StreamStatusEvent | null = useMemo(() => {
    if (!hasPlanStarted) return null

    return {
      type: "status",
      phase: "research_step_done",
      message: "Plan de investigación listo.",
      step_index: stepIndex,
      plan: [...PLAN_STEPS],
      results_count: resultCount,
    }
  }, [hasPlanStarted, resultCount, stepIndex])

  return (
    <div
      className={cn(
        "deep-research-demo media-placeholder w-full max-w-full p-3.5 md:p-5 min-h-[20rem] sm:aspect-[16/10]",
        reducedMotion && "deep-research-demo--reduced"
      )}
      role="img"
      aria-label="Demostración simulada de búsqueda profunda con plan de investigación y 150+ hallazgos"
    >
      <div className="relative z-[2] mt-1.5 md:mt-2 space-y-1.5 md:space-y-2 min-w-0 w-full max-w-full overflow-x-hidden">
        {showUserMessage && (
          <div className="ml-auto max-w-[92%] sm:max-w-[88%] rounded-2xl bg-accent text-accent-foreground px-2.5 py-1.5 md:px-3.5 md:py-2.5 text-[11px] sm:text-[12px] md:text-[13.5px] leading-[1.35] md:leading-relaxed shadow-soft whitespace-normal break-words [overflow-wrap:anywhere]">
            {USER_PROMPT}
          </div>
        )}

        {status && (
          <div className="deep-research-demo__status w-full max-w-full overflow-visible md:overflow-hidden">
            <div
              className={cn(
                "origin-top-left w-full max-w-full",
                isMobileViewport ? "scale-100" : "scale-[0.82]"
              )}
            >
              <ResearchFlow
                status={status}
                plan={[...PLAN_STEPS]}
                isReplan={false}
                visualStepIndex={stepIndex}
                groupsPerPage={isMobileViewport ? 3 : 5}
                compact
                progressByClusterOnly
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
