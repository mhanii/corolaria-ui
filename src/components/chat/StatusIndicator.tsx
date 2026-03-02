"use client"

import { useState, useEffect, memo } from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { StreamStatusEvent } from "@/lib/api/types"
import { cn } from "@/lib/utils"

import { ResearchFlow } from "./ResearchFlow"
import { ToolChip, StaticToolIndicator } from "./ToolChip"

export { StaticToolIndicator }

interface StatusIndicatorProps {
    status: StreamStatusEvent | null
    className?: string
    onComplete?: () => void
}

export const StatusIndicator = memo(function StatusIndicator({ status, className, onComplete }: StatusIndicatorProps) {
    const [cachedPlan, setCachedPlan] = useState<string[]>([])
    const [isReplan, setIsReplan] = useState(false)
    const [visualStepIndex, setVisualStepIndex] = useState(-1)
    const [planFinished, setPlanFinished] = useState(false)

    const targetStepIndex = status?.step_index ?? -1
    const phase = status?.phase ?? ""

    const WAIT_PLAN_DISPLAY = process.env.NEXT_PUBLIC_WAIT_PLAN_DISPLAY === 'true'

    const isResearchPhase = [
        'research_plan_ready',
        'research_step_done',
        'research_reflection',
        'research_agent_start'
    ].includes(phase)
    void isResearchPhase

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
            setCachedPlan(status.plan)
            setIsReplan(!!status.is_replan)
            setPlanFinished(false)
            if (!status.is_replan) {
                setVisualStepIndex(0)
            }
        }
    }, [phase, status?.plan, status?.is_replan])

    // 2. Manage visual progression (1s cadence relative to backend)
    useEffect(() => {
        if (cachedPlan.length === 0 || planFinished) return

        if (visualStepIndex >= cachedPlan.length - 1) {
            if (isGenerationPhase) {
                setPlanFinished(true)
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

    // 3. Signal completion exactly once when planFinished triggers
    useEffect(() => {
        if (planFinished) {
            onComplete?.()
        }
    }, [planFinished, onComplete])

    if (!status) return null

    const showPlan = cachedPlan.length > 0 && !planFinished

    if (phase === 'document_creation_started' || phase === 'document_creation_completed') {
        if (!showPlan) {
            return (
                <div className="w-full py-1">
                    <LoadingArtifactChip />
                </div>
            )
        }
        return null
    }

    const isEndPhase = phase.endsWith('_end') || phase.includes('completed')
    if (isEndPhase && !showPlan) return null

    const effectiveStatus = (showPlan && isGenerationPhase)
        ? { ...status, phase: 'research_step_done' }
        : status

    return (
        <div className={cn("w-full py-1", className)}>
            {showPlan && (
                <ResearchFlow
                    key="research-flow"
                    status={effectiveStatus}
                    plan={cachedPlan}
                    isReplan={isReplan}
                    visualStepIndex={visualStepIndex}
                />
            )}

            {isToolPhase && phase === 'tool_start' && (
                <ToolChip key={`tool-active-${status.tool}`} status={status} />
            )}

            {phase === 'research_step_done' && status.status === 'running' && !showPlan && (
                <ToolChip key="research-active" status={{ ...status, tool: 'research_step_done' }} />
            )}

            {!showPlan && !isToolPhase && (
                <GenericStatus key="generic-status" status={effectiveStatus} />
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
            <div className="flex text-left font-sans rounded-lg overflow-hidden w-full px-4 bg-card/50">
                <div className="flex flex-1 align-start justify-between w-full py-4">
                    <div className="flex flex-1 gap-4 min-w-0">
                        <div className="flex items-center w-[60px] relative shrink-0">
                            <div className="absolute top-0 left-0 flex flex-1 overflow-hidden w-[56px] h-[72px] rounded-xl bg-gradient-to-b from-background to-background/0 pt-4 items-start justify-center shadow-sm">
                                <Loader2 className="w-6 h-6 text-accent animate-spin" />
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
                        <div className="h-9 w-[5rem] bg-muted/20 rounded-md" />
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

function getPhaseLabel(phase: string): string {
    switch (phase) {
        case 'context_collection_start': return 'Analizando contexto para la consulta...';
        case 'context_collection_end': return 'Contexto identificado.';
        case 'research_agent_start': return 'Iniciando investigación profunda...';
        case 'research_agent_end': return 'Investigación finalizada.';
        case 'generate_start': return 'Sintetizando y redactando respuesta...';
        case 'generate_end': return 'Respuesta generada.';
        case 'document_creation_started': return 'Redactando borrador del documento...';
        case 'document_creation_completed': return 'Documento generado con éxito.';
        case 'document_creation_failed': return 'Error al generar documento.';
        case 'research_reflection': return 'Evaluando hallazgos...';
        case 'research_step_done': return 'Paso de investigación completado.';
        case 'research_plan_ready': return 'Plan de investigación listo.';
        case 'tool_start': return 'Usando herramienta...';
        case 'tool_end': return 'Herramienta completada.';
        case 'tool_error': return 'Error en herramienta.';
        default: return 'Procesando...';
    }
}

function GenericStatus({ status }: { status: StreamStatusEvent }) {
    const label = status.message || getPhaseLabel(status.phase)

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2"
        >
            <p className={cn(
                "text-sm italic font-medium",
                "bg-gradient-to-r from-accent via-accent/60 to-accent bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]"
            )}>
                {label}
            </p>

            {(status.phase === 'context_collection_start' || status.phase === 'research_agent_start') && (
                <div className="space-y-2 opacity-30">
                    <div className="h-3 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted rounded animate-shimmer bg-[length:200%_100%]" style={{ width: '90%' }}></div>
                    <div className="h-3 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted rounded animate-shimmer bg-[length:200%_100%]" style={{ width: '75%' }}></div>
                </div>
            )}
        </motion.div>
    )
}
