"use client"

import { useEffect, useState } from "react"
import { DocumentAttachment } from "@/components/chat/DocumentAttachment"
import { useTypewriter } from "@/hooks/useTypewriter"
import { cn } from "@/lib/utils"

const USER_PROMPT = "Este caso ocurrió en 2015. ¿Cómo afecta la legislación de entonces?"

const ASSISTANT_TEXT =
    "¡Entendido! Al tratarse de un caso de 2015, es fundamental aplicar la normativa vigente en el momento de los hechos. He localizado la legislación de aquel entonces y la he contrastado con el marco legal actual para identificar disposiciones transitorias o cambios que puedan afectar a tu estrategia legal."

type DemoPhase = "idle" | "document" | "user" | "assistant"

export function LegislativeVersioningDemo() {
    const [phase, setPhase] = useState<DemoPhase>("idle")
    const [reducedMotion, setReducedMotion] = useState(false)

    useEffect(() => {
        if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setReducedMotion(true)
        }
    }, [])

    const userTyped = useTypewriter(phase === "user" || phase === "assistant" ? USER_PROMPT : "", reducedMotion ? 5 : 15)
    const assistantTyped = useTypewriter(phase === "assistant" ? ASSISTANT_TEXT : "", reducedMotion ? 4 : 12)

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

            schedule(() => setPhase("document"), reducedMotion ? 200 : 500)
            schedule(() => setPhase("user"), reducedMotion ? 800 : 1500)
            schedule(() => setPhase("assistant"), reducedMotion ? 3000 : 5500)
            schedule(runCycle, reducedMotion ? 10000 : 15000)
        }

        runCycle()

        return () => {
            cancelled = true
            timers.forEach((t) => clearTimeout(t))
        }
    }, [reducedMotion])

    return (
        <div
            className={cn(
                "legislative-versioning-demo media-placeholder w-full max-w-full p-3.5 md:p-5 min-h-[20rem] sm:aspect-[16/10]",
                reducedMotion && "demo--reduced"
            )}
            role="img"
            aria-label="Demostración de control de versiones legislativo"
        >
            <div className="relative z-[2] mt-1.5 md:mt-2 space-y-3 min-w-0 w-full max-w-full overflow-x-hidden">
                <div
                    className={cn(
                        "transition-all duration-500",
                        phase === "idle" ? "opacity-0 translate-y-2 pointer-events-none" : "opacity-100 translate-y-0"
                    )}
                >
                    <DocumentAttachment documentName="Contrato_Prestacion_Servicios_2015.pdf" />
                </div>

                <div
                    className={cn(
                        "ml-auto max-w-[92%] sm:max-w-[88%] rounded-2xl bg-accent text-accent-foreground px-2.5 py-1.5 md:px-3.5 md:py-2.5 text-[11px] sm:text-[12px] md:text-[13.5px] leading-[1.35] md:leading-relaxed shadow-soft whitespace-normal break-words [overflow-wrap:anywhere] transition-all duration-500",
                        phase === "user" || phase === "assistant" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                    )}
                >
                    {userTyped}
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
