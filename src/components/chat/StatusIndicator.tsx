"use client"

import { useState, useEffect, useRef, memo } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { StreamStatusEvent } from "@/lib/api/types"
import { cn } from "@/lib/utils"

import { ResearchFlow } from "./ResearchFlow"
import { StaticToolIndicator } from "./ToolChip"

export { StaticToolIndicator }

interface StatusIndicatorProps {
    status: StreamStatusEvent | null
    className?: string
    onComplete?: () => void
}

/** Phases that contribute a single transient "fading" status label — no persistence. */
const TRANSIENT_PHASES = new Set([
    'tool_start',
    'research_agent_start',
    'research_step_done',
    'research_agent_end',
    'context_collection_start',
    'context_collection_end',
    'research_reflection',
    'generate_start',
])

export const StatusIndicator = memo(function StatusIndicator({ status, className, onComplete }: StatusIndicatorProps) {
    const [cachedPlan, setCachedPlan] = useState<string[]>([])
    const [isReplan, setIsReplan] = useState(false)
    const [visualStepIndex, setVisualStepIndex] = useState(-1)
    const [planFinished, setPlanFinished] = useState(false)

    // Track current transient message text + a unique key so AnimatePresence
    // can detect when the message changes and cross-fade.
    const [transientMsg, setTransientMsg] = useState<{ text: string; key: number } | null>(null)
    const transientKeyRef = useRef(0)

    const targetStepIndex = status?.step_index ?? -1
    const phase = status?.phase ?? ""

    const WAIT_PLAN_DISPLAY = process.env.NEXT_PUBLIC_WAIT_PLAN_DISPLAY === 'true'

    const isGenerationPhase = [
        'generate_start',
        'generate_end',
        'document_creation_started',
        'document_creation_completed'
    ].includes(phase)

    const isToolPhase = [
        'tool_start',
        'tool_end',
        'tool_error'
    ].includes(phase)

    // 1. Capture the plan and reset the finish latch
    useEffect(() => {
        if (phase === 'research_plan_ready' && status?.plan) {
            if (status.is_replan) {
                setCachedPlan(prev => {
                    if (prev.length === 0) return status.plan!;
                    const existingStr = prev.join('|');
                    const newSteps = status.plan!.filter(step => !existingStr.includes(step));
                    return [...prev, ...newSteps];
                });
                setPlanFinished(false) // replan reactivates the view
            } else {
                setCachedPlan(status.plan)
                setIsReplan(false)
                setPlanFinished(false)
                setVisualStepIndex(0)
            }
        }
    }, [phase, status?.plan, status?.is_replan])

    // 2. Manage visual progression for plan-based research flow
    useEffect(() => {
        if (cachedPlan.length === 0 || planFinished) return

        if (visualStepIndex >= cachedPlan.length - 1) {
            if (isGenerationPhase) {
                setPlanFinished(true)
            } else if (targetStepIndex >= cachedPlan.length) {
                // Backend has moved beyond our known plan steps — dynamically extend
                setCachedPlan(prev => [...prev, "Investigando en mayor profundidad..."])
            }
            return
        }

        const shouldAdvance = (visualStepIndex < targetStepIndex) || (isGenerationPhase && WAIT_PLAN_DISPLAY)

        if (shouldAdvance) {
            const timer = setTimeout(() => {
                setVisualStepIndex(prev => {
                    const next = prev + 1
                    if (next >= cachedPlan.length - 1 && isGenerationPhase) {
                        setPlanFinished(true)
                    }
                    return next
                })
            }, 400)
            return () => clearTimeout(timer)
        }
    }, [visualStepIndex, targetStepIndex, isGenerationPhase, WAIT_PLAN_DISPLAY, planFinished, cachedPlan.length])

    // 3. When generation starts, fast-forward visual step to the end then dismiss
    useEffect(() => {
        if (!isGenerationPhase || planFinished || cachedPlan.length === 0) return
        // Snap to last step immediately so all circles fill, then mark done shortly after
        setVisualStepIndex(cachedPlan.length - 1)
        const timer = setTimeout(() => setPlanFinished(true), 500)
        return () => clearTimeout(timer)
    }, [isGenerationPhase])

    // 3. Signal completion exactly once when planFinished triggers
    useEffect(() => {
        if (planFinished) {
            onComplete?.()
        }
    }, [planFinished, onComplete])

    // 4. Update transient message whenever a relevant phase arrives and
    //    there is no plan view active (plan view handles its own display).
    useEffect(() => {
        if (!status || cachedPlan.length > 0) return
        if (!TRANSIENT_PHASES.has(phase)) return

        const text = status.message || getPhaseLabel(phase)
        transientKeyRef.current += 1
        setTransientMsg({ text, key: transientKeyRef.current })
    }, [status, phase, cachedPlan.length])

    if (!status) return null

    const showPlan = cachedPlan.length > 0 && !planFinished

    if (phase === 'document_creation_started') {
        if (!showPlan) {
            return (
                <div className="w-full py-1">
                    <LoadingArtifactChip />
                </div>
            )
        }
        return null
    }

    // Suppress end phases unless there is a plan to wind down
    const isEndPhase = phase.endsWith('_end') || phase.includes('completed')
    if (isEndPhase && !showPlan) return null

    const effectiveStatus = (showPlan && isGenerationPhase)
        ? { ...status, phase: 'research_step_done' }
        : status

    return (
        <div className={cn("w-full py-1", className)}>
            {/* Plan-based research flow (unchanged) */}
            {showPlan && (
                <ResearchFlow
                    key="research-flow"
                    status={effectiveStatus}
                    plan={cachedPlan}
                    isReplan={isReplan}
                    visualStepIndex={visualStepIndex}
                />
            )}

            {/* When no plan: cross-fade a single status line instead of stacking */}
            {!showPlan && TRANSIENT_PHASES.has(phase) && (
                <AnimatePresence mode="wait">
                    {transientMsg && (
                        <motion.p
                            key={transientMsg.key}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.25 }}
                            className={cn(
                                "text-sm italic font-medium",
                                "bg-gradient-to-r from-accent via-accent/60 to-accent bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]"
                            )}
                        >
                            {transientMsg.text}
                        </motion.p>
                    )}
                </AnimatePresence>
            )}
        </div>
    )
})

function LoadingArtifactChip() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 mb-1 w-full"
        >
            <div className="flex text-left font-sans rounded-lg overflow-hidden border border-border/50 dark:border-border/80 w-full px-4 bg-card/50 dark:bg-muted/55 shadow-soft">
                <div className="flex flex-1 align-start justify-between w-full py-4">
                    <div className="flex flex-1 gap-4 min-w-0">
                        <div className="flex items-center w-[60px] relative shrink-0">
                            <div className="absolute top-0 left-0 flex flex-1 overflow-hidden w-[56px] h-[72px] rounded-xl border border-border/70 bg-gradient-to-b from-background to-background/0 dark:from-card/95 dark:to-card/30 pt-4 items-start justify-center shadow-soft">
                                <svg className="w-6 h-6 text-accent animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                            </div>
                        </div>

                        <div className="flex flex-col justify-center gap-2 min-w-0 flex-1">
                            <div className="h-4 w-3/4 bg-muted/50 rounded animate-pulse" />
                            <div className="h-3 w-1/2 bg-muted/30 rounded animate-pulse" />
                            <p className="text-xs text-accent animate-pulse mt-1 font-medium">
                                Redactando documento...
                            </p>
                        </div>
                    </div>

                    <div className="flex min-w-0 items-center justify-center gap-2 shrink-0">
                        <div className="h-9 w-[5rem] bg-muted/25 dark:bg-card/65 rounded-md border border-border/40" />
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

function getPhaseLabel(phase: string): string {
    switch (phase) {
        case 'context_collection_start': return 'Analizando contexto para la consulta...'
        case 'context_collection_end': return 'Contexto identificado.'
        case 'research_agent_start': return 'Iniciando búsqueda...'
        case 'research_agent_end': return 'Búsqueda finalizada.'
        case 'generate_start': return 'Sintetizando y redactando respuesta...'
        case 'generate_end': return 'Respuesta generada.'
        case 'document_creation_started': return 'Redactando borrador del documento...'
        case 'document_creation_completed': return 'Documento generado con éxito.'
        case 'document_creation_failed': return 'Error al generar documento.'
        case 'research_reflection': return 'Evaluando hallazgos...'
        case 'research_step_done': return 'Paso de investigación completado.'
        case 'research_plan_ready': return 'Plan de investigación listo.'
        case 'tool_start': return 'Usando herramienta...'
        case 'tool_end': return 'Herramienta completada.'
        case 'tool_error': return 'Error en herramienta.'
        default: return 'Procesando...'
    }
}
