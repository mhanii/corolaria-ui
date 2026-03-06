"use client"

import { useEffect, useMemo, useState } from "react"
import { ArtifactChip } from "@/components/chat/ArtifactChip"
import { ToolChip } from "@/components/chat/ToolChip"
import { useTypewriter } from "@/hooks/useTypewriter"
import { StreamStatusEvent } from "@/lib/api/types"
import { cn } from "@/lib/utils"

const USER_PROMPT =
  "Redacta una demanda de reclamación de cantidad por incumplimiento contractual entre empresas, incluyendo hechos, fundamentos y suplico."

const ASSISTANT_TEXT =
  "Claro, he creado un documento sobre reclamación de cantidad por incumplimiento contractual con estructura de hechos, fundamentos jurídicos y suplico. Ya está abierto en tu panel lateral y también puedes descargarlo en formato Markdown, DOCX o PDF."

const GENERATED_TITLE = "Demanda reclamación de cantidad - Borrador inicial.md"

type DemoPhase = "idle" | "user" | "tool" | "artifact_loading" | "artifact_ready" | "assistant"

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

export function DocumentGenerationDemo() {
  const reducedMotion = useReducedMotion()
  const [phase, setPhase] = useState<DemoPhase>("idle")

  const userTyped = useTypewriter(phase !== "idle" ? USER_PROMPT : "", reducedMotion ? 6 : 16)
  const assistantTyped = useTypewriter(phase === "assistant" ? ASSISTANT_TEXT : "", reducedMotion ? 5 : 16)

  useEffect(() => {
    let cancelled = false
    const timers: Array<ReturnType<typeof setTimeout>> = []

    const schedule = (fn: () => void, delay: number) => {
      const t = setTimeout(() => {
        if (cancelled) return
        fn()
      }, delay)
      timers.push(t)
    }

    const runCycle = () => {
      if (cancelled) return

      setPhase("idle")

      schedule(() => setPhase("user"), reducedMotion ? 250 : 500)
      schedule(() => setPhase("tool"), reducedMotion ? 850 : 1800)
      schedule(() => setPhase("artifact_loading"), reducedMotion ? 1300 : 2650)
      schedule(() => setPhase("artifact_ready"), reducedMotion ? 2800 : 6200)
      schedule(() => setPhase("assistant"), reducedMotion ? 3400 : 7200)
      schedule(runCycle, reducedMotion ? 9400 : 13500)
    }

    runCycle()

    return () => {
      cancelled = true
      timers.forEach((t) => clearTimeout(t))
    }
  }, [reducedMotion])

  const status = useMemo<StreamStatusEvent | null>(() => {
    if (phase === "idle" || phase === "user") return null
    const isCompleted = phase === "artifact_ready" || phase === "assistant"

    return {
      type: "status",
      phase: isCompleted ? "tool_end" : "tool_start",
      tool: "deep_research",
      status: isCompleted ? "completed" : "running",
      message: isCompleted
        ? "Herramienta completada: busqueda profunda"
        : "Ejecutando herramienta: busqueda profunda",
    }
  }, [phase])

  return (
    <div
      className={cn(
        "document-generation-demo media-placeholder w-full max-w-full p-3.5 md:p-5 min-h-[20rem] sm:aspect-[16/10]",
        reducedMotion && "document-generation-demo--reduced"
      )}
      role="img"
      aria-label="Demostración simulada de generación documental con input, tool call y artefacto"
    >
      <div className="relative z-[2] mt-1.5 md:mt-2 space-y-2.5 min-w-0 w-full max-w-full overflow-x-hidden">
        <div
          className={cn(
            "ml-auto max-w-[92%] sm:max-w-[88%] rounded-2xl bg-accent text-accent-foreground px-2.5 py-1.5 md:px-3.5 md:py-2.5 text-[11px] sm:text-[12px] md:text-[13.5px] leading-[1.35] md:leading-relaxed shadow-soft whitespace-normal break-words [overflow-wrap:anywhere] transition-all duration-500",
            phase === "idle" ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          )}
        >
          {userTyped}
        </div>

        <div
          className={cn(
            "transition-all duration-500",
            status ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
          )}
        >
          {status && (
            <div className="rounded-xl border border-border/70 bg-background/70 px-2 py-1">
              <ToolChip status={status} />
            </div>
          )}
        </div>

        <div
          className={cn(
            "transition-all duration-500",
            phase === "artifact_loading" || phase === "artifact_ready" || phase === "assistant"
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2 pointer-events-none"
          )}
        >
          {phase === "artifact_loading" ? (
            <LoadingArtifactChip />
          ) : phase === "artifact_ready" || phase === "assistant" ? (
            <ArtifactChip id="demo-artifact" title={GENERATED_TITLE} />
          ) : null}
        </div>

        <div
          className={cn(
            "max-w-[95%] rounded-2xl px-4 py-3 text-foreground text-[clamp(0.86rem,2.2vw,1rem)] leading-relaxed transition-all duration-500",
            phase === "assistant" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}
        >
          {assistantTyped}
        </div>
      </div>
    </div>
  )
}

function LoadingArtifactChip() {
  return (
    <div className="mt-3 mb-1 w-full">
      <div className="flex text-left font-sans rounded-lg overflow-hidden border border-border/50 dark:border-border/80 w-full px-4 bg-card/50 dark:bg-muted/55 shadow-soft">
        <div className="flex flex-1 align-start justify-between w-full py-4">
          <div className="flex flex-1 gap-4 min-w-0">
            <div className="flex items-center w-[60px] relative shrink-0">
              <div className="absolute top-0 left-0 flex flex-1 overflow-hidden w-[56px] h-[72px] rounded-xl border border-border/70 bg-gradient-to-b from-background to-background/0 dark:from-card/95 dark:to-card/30 pt-4 items-start justify-center shadow-soft">
                <svg
                  className="w-6 h-6 text-accent animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-2 min-w-0 flex-1">
              <div className="h-4 w-3/4 bg-muted/50 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-muted/30 rounded animate-pulse" />
              <p className="text-xs text-accent animate-pulse mt-1 font-medium">Redactando documento...</p>
            </div>
          </div>

          <div className="flex min-w-0 items-center justify-center gap-2 shrink-0">
            <div className="h-9 w-[5rem] bg-muted/25 dark:bg-card/65 rounded-md border border-border/40" />
          </div>
        </div>
      </div>
    </div>
  )
}
