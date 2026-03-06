"use client"

import { useEffect, useMemo, useState } from "react"
import { ToolChip } from "@/components/chat/ToolChip"
import { useTypewriter } from "@/hooks/useTypewriter"
import { StreamStatusEvent } from "@/lib/api/types"
import { cn } from "@/lib/utils"

const USER_PROMPT =
  "Actúa en modo abogado para este caso: verifica hechos, encuentra normas y sentencias comparables, contrasta criterios y define estrategia con riesgos."

const PIPELINE_STEPS = [
  "Legislación",
  "Doctrina",
  "Sentencias Similares",
  "Comparar",
  "Analizar Relaciones",
  "Generar Respuesta",
] as const

type Scene = "idle" | "user" | "tools_running" | "tools_done" | "transition" | "pipeline"

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

export function LawyerModeDemo() {
  const reducedMotion = useReducedMotion()
  const [scene, setScene] = useState<Scene>("idle")
  const [pipelineIndex, setPipelineIndex] = useState(-1)

  const userTyped = useTypewriter(scene !== "idle" ? USER_PROMPT : "", reducedMotion ? 5 : 13)

  useEffect(() => {
    let cancelled = false
    const timers: Array<ReturnType<typeof setTimeout>> = []

    const schedule = (fn: () => void, delay: number) => {
      const t = setTimeout(() => {
        if (!cancelled) fn()
      }, delay)
      timers.push(t)
    }

    const runCycle = () => {
      if (cancelled) return

      setScene("idle")
      setPipelineIndex(-1)

      schedule(() => setScene("user"), reducedMotion ? 220 : 450)
      schedule(() => setScene("tools_running"), reducedMotion ? 760 : 1400)
      schedule(() => setScene("tools_done"), reducedMotion ? 1800 : 3200)
      schedule(() => setScene("transition"), reducedMotion ? 2300 : 4200)




      schedule(runCycle, reducedMotion ? 5000 : 7000)
    }

    runCycle()

    return () => {
      cancelled = true
      timers.forEach((t) => clearTimeout(t))
    }
  }, [reducedMotion])

  const toolStatuses = useMemo<StreamStatusEvent[]>(() => {
    if (scene !== "tools_running" && scene !== "tools_done" && scene !== "transition") return []

    const completed = scene === "tools_done" || scene === "transition"

    return [
      {
        type: "status",
        phase: completed ? "tool_end" : "tool_start",
        tool: "deep_research_normativa",
        status: completed ? "completed" : "running",
        message: completed ? "Legislación localizada" : "Buscando legislación relevante",
      },
      {
        type: "status",
        phase: completed ? "tool_end" : "tool_start",
        tool: "web_search_doctrina",
        status: completed ? "completed" : "running",
        message: completed ? "Doctrina contrastada" : "Buscando doctrina y criterios",
      },
      {
        type: "status",
        phase: completed ? "tool_end" : "tool_start",
        tool: "deep_research_similar_cases",
        status: completed ? "completed" : "running",
        message: completed ? "Sentencias similares encontradas" : "Buscando sentencias similares",
      },
    ]
  }, [scene])

  const showConversation = scene === "user" || scene === "tools_running" || scene === "tools_done"
  const fadingConversation = scene === "transition"
  const showPipeline = scene === "pipeline"

  return (
    <div
      className={cn(
        "lawyer-mode-demo media-placeholder w-full max-w-full p-3.5 md:p-5 min-h-[20rem] sm:aspect-[16/10]",
        reducedMotion && "lawyer-mode-demo--reduced"
      )}
      role="img"
      aria-label="Demostración abstracta de modo abogado con tool calls y pipeline de análisis jurídico"
    >
      <div className="relative z-[2] mt-1.5 md:mt-2 space-y-2.5 min-w-0 w-full max-w-full overflow-x-hidden">
        {(showConversation || fadingConversation) && (
          <div
            className={cn(
              "space-y-2.5 transition-all duration-500",
              fadingConversation ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
            )}
          >
            <div className="ml-auto max-w-[92%] sm:max-w-[88%] rounded-2xl bg-accent text-accent-foreground px-2.5 py-1.5 md:px-3.5 md:py-2.5 text-[11px] sm:text-[12px] md:text-[13.5px] leading-[1.35] md:leading-relaxed shadow-soft whitespace-normal break-words [overflow-wrap:anywhere]">
              {userTyped}
            </div>

            <div className="space-y-1">
              {toolStatuses.map((status, idx) => (
                <div key={`${status.tool}-${idx}`} className="rounded-xl border border-border/70 bg-background/70 px-2 py-1">
                  <ToolChip status={status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
