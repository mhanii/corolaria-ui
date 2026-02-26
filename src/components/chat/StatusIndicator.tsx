
"use client"

import { useState, useEffect, useMemo, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Sparkles, Wrench, AlertTriangle, CheckCircle2, Globe, Scale } from "lucide-react"
import { StreamStatusEvent } from "@/lib/api/types"
import { cn } from "@/lib/utils"

interface StatusIndicatorProps {
    status: StreamStatusEvent | null
    className?: string
    onComplete?: () => void
}

export const StatusIndicator = memo(function StatusIndicator({ status, className, onComplete }: StatusIndicatorProps) {
    const [cachedPlan, setCachedPlan] = useState<string[]>([])
    const [isReplan, setIsReplan] = useState(false)
    const [visualStepIndex, setVisualStepIndex] = useState(-1)
    const [planFinished, setPlanFinished] = useState(false) // latch: true only when plan finishes visual sequence

    const targetStepIndex = status?.step_index ?? -1
    const phase = status?.phase ?? ""

    const WAIT_PLAN_DISPLAY = process.env.NEXT_PUBLIC_WAIT_PLAN_DISPLAY === 'true'

    const isResearchPhase = [
        'research_plan_ready',
        'research_step_done',
        'research_reflection',
        'research_agent_start'
    ].includes(phase)
    void isResearchPhase; // Explicitly mark as used if not strictly needed

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

    // 2. Manage visual progression (1s cadence)
    useEffect(() => {
        if (cachedPlan.length === 0 || planFinished) return

        // If we reached the literal end of the plan
        if (visualStepIndex >= cachedPlan.length - 1) {
            // We only "finish" the plan view if the backend has also moved to generation
            if (isGenerationPhase) {
                setPlanFinished(true)
            }
            return
        }

        // Logic to advance:
        // - Advance if backend is ahead
        // - OR advance blindly if we ARE in generation phase AND WAIT_PLAN_DISPLAY is enabled
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
            }, 400) // 2000ms / 5 steps = 400ms cadence
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

    // Determine what to show: Plan takes priority until latch is released
    const showPlan = cachedPlan.length > 0 && !planFinished

    // Document creation chips are handled by ChatBubble outside the typing container
    if (phase === 'document_creation_started' || phase === 'document_creation_completed') {
        if (!showPlan) {
            return (
                <div className="w-full py-1">
                    <LoadingArtifactChip />
                </div>
            )
        }
        // If plan is still showing, don't render anything for document phases
        return null
    }

    // Suppress end/completed phases entirely (no "Documento generado con éxito" etc.)
    const isEndPhase = phase.endsWith('_end') || phase.includes('completed')
    if (isEndPhase && !showPlan) return null

    // Stabilize the status passed to children
    // If we are forcing the plan display during generation, we "mock" a research phase
    const effectiveStatus = (showPlan && isGenerationPhase)
        ? { ...status, phase: 'research_step_done' }
        : status

    return (
        <div className={cn("w-full py-1", className)}>
            {/* Research plan */}
            {showPlan && (
                <ResearchFlow
                    key="research-flow"
                    status={effectiveStatus}
                    plan={cachedPlan}
                    isReplan={isReplan}
                    visualStepIndex={visualStepIndex}
                />
            )}

            {/* Active Tool Chip */}
            <AnimatePresence mode="wait" initial={false}>
                {isToolPhase && phase === 'tool_start' && (
                    <ToolChip key={`tool-active-${status.tool}`} status={status} />
                )}
            </AnimatePresence>

            {/* Active Research Step */}
            <AnimatePresence mode="wait" initial={false}>
                {phase === 'research_step_done' && status.status === 'running' && !showPlan && (
                    <ToolChip key={`research-active`} status={{ ...status, tool: 'research_step_done' }} />
                )}
            </AnimatePresence>

            {/* Generic status only when no plan and no tool */}
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
                        {/* Icon Container with Spinner */}
                        <div className="flex items-center w-[60px] relative shrink-0">
                            <div className="absolute top-0 left-0 flex flex-1 overflow-hidden w-[56px] h-[72px] rounded-xl bg-gradient-to-b from-background to-background/0 pt-4 items-start justify-center shadow-sm">
                                <Loader2 className="w-6 h-6 text-accent animate-spin" />
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="flex flex-col justify-center gap-2 min-w-0 flex-1">
                            <div className="h-4 w-3/4 bg-muted/50 rounded animate-pulse" />
                            <div className="h-3 w-1/2 bg-muted/30 rounded animate-pulse" />
                            <p className="text-xs text-accent animate-pulse mt-1 font-medium">
                                Redactando documento...
                            </p>
                        </div>
                    </div>

                    {/* Disabled Button Placeholder */}
                    <div className="flex min-w-0 items-center justify-center gap-2 shrink-0">
                        <div className="h-9 w-[5rem] bg-muted/20 rounded-md" />
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

/**
 * Formats an internal tool name to a human-readable label.
 * e.g. "internet_search" → "Internet Search"
 */
function formatToolName(tool: string): string {
    return tool
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
}

function ToolChip({ status, isStatic = false }: { status: StreamStatusEvent, isStatic?: boolean }) {
    // If it's a research step pretending to be a tool
    if (status.tool === 'research_step_done' || status.phase === 'research_step_done') {
        const isDone = status.status === 'completed' || isStatic;
        const count = status.results_count ?? status.evidence_count ?? 0;

        return (
            <motion.div
                initial={isStatic ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={isStatic ? undefined : { opacity: 0, y: -4 }}
                className="flex items-center gap-2 py-1 w-full"
            >
                <div className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-lg border text-sm w-full relative overflow-hidden",
                    isDone ? "transition-all duration-300 border-accent/10 bg-accent/5 text-foreground opacity-80" : "border-accent/30 bg-accent/10 text-foreground shadow-sm"
                )}>
                    {/* Background scanning effect when running */}
                    {!isDone && (
                        <div className="absolute top-0 bottom-0 left-[-100%] w-[200%] bg-gradient-to-r from-transparent via-accent/10 to-transparent animate-[shimmer_2s_infinite]" />
                    )}

                    <div className={cn(
                        "p-1.5 rounded-md flex items-center justify-center relative z-10 shrink-0",
                        isDone ? "bg-accent/10 text-accent" : "bg-card border border-accent/30 text-accent shadow-inner"
                    )}>
                        {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        )}
                    </div>

                    <div className="flex flex-col flex-1 min-w-0 relative z-10 justify-center">
                        <span className={cn("truncate leading-tight", isDone ? "font-medium text-sm" : "font-semibold")}>
                            {status.message || (isDone ? "Paso completado" : "Procesando paso...")}
                        </span>
                    </div>
                </div>
            </motion.div>
        );
    }

    const toolLabel = status.tool ? formatToolName(status.tool) : 'Herramienta'
    const isError = status.phase === 'tool_error'
    const isDone = status.phase === 'tool_end' || isStatic
    const isInternet = status.tool === 'internet_search' || status.tool === 'web_search'
    const isLegal = status.tool === 'legal_research' || status.tool === 'semantic_search'
    const count = status.results_count ?? status.evidence_count ?? 0

    return (
        <motion.div
            initial={isStatic ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={isStatic ? undefined : { opacity: 0, y: -4 }}
            className="flex items-center gap-2 py-1 w-full"
        >
            <div className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium w-full relative overflow-hidden",
                isDone ? "transition-all duration-300" : "",
                isError
                    ? "border-destructive/30 bg-destructive/5 text-destructive"
                    : isDone
                        ? "border-accent/30 bg-accent/5 text-accent"
                        : "border-accent/20 bg-accent/5 text-foreground shadow-[0_0_15px_rgba(59,130,246,0.1)]"
            )}>
                {/* Background scanning effect when running */}
                {!isError && !isDone && (
                    <div className="absolute top-0 bottom-0 left-[-100%] w-[200%] bg-gradient-to-r from-transparent via-accent/10 to-transparent animate-[shimmer_2s_infinite]" />
                )}

                <div className={cn(
                    "p-1.5 rounded-lg flex items-center justify-center relative z-10 shrink-0 transition-colors duration-500",
                    isError ? "bg-destructive/10 text-destructive" : isDone ? "bg-accent/10 text-accent" : "bg-card border border-accent/20 text-accent shadow-inner shadow-accent/10"
                )}>
                    {isError ? (
                        <AlertTriangle className="w-4 h-4" />
                    ) : isDone ? (
                        <CheckCircle2 className="w-4 h-4" />
                    ) : isInternet ? (
                        <div className="relative">
                            <Globe className="w-4 h-4 animate-pulse relative z-10" />
                            <div className="absolute inset-0 border border-accent rounded-full animate-ping opacity-30" />
                        </div>
                    ) : isLegal ? (
                        <div className="relative">
                            <Scale className="w-4 h-4 animate-bounce relative z-10" style={{ animationDuration: '2s' }} />
                        </div>
                    ) : (
                        <Wrench className="w-4 h-4 animate-[spin_3s_linear_infinite]" />
                    )}
                </div>

                <div className="flex flex-col flex-1 min-w-0 relative z-10 justify-center">
                    <span className="truncate leading-tight font-semibold">
                        {isError
                            ? (status.message || `Error en ${toolLabel}${status.error_code ? ` (${status.error_code})` : ''}`)
                            : isDone
                                ? (status.message || `${toolLabel} completado`)
                                : (status.message || `Usando ${toolLabel}...`)}
                    </span>
                    {(!isError && !isDone && count > 0) && (
                        <motion.span
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="text-[10.5px] text-muted-foreground mt-0.5 leading-none font-medium flex items-center gap-1"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                            {count} {count === 1 ? 'hallazgo' : 'hallazgos'} recuperados
                        </motion.span>
                    )}
                </div>

                {!isError && !isDone && (
                    <div className="relative w-5 h-5 shrink-0 z-10 ml-auto flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-2 border-accent/20 border-b-accent animate-spin" style={{ animationDuration: '1.5s' }} />
                        <div className="absolute inset-1 rounded-full border border-accent/40 border-t-accent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }} />
                        <Sparkles className="w-2.5 h-2.5 text-accent animate-pulse" />
                    </div>
                )}
            </div>
        </motion.div>
    )
}

export const StaticToolIndicator = memo(function StaticToolIndicator({ label, toolName }: { label: string, toolName: string }) {
    const isInternet = toolName === 'internet_search' || toolName === 'web_search'
    const isLegal = toolName === 'legal_research' || toolName === 'semantic_search' || toolName === 'run_rag_query' || toolName === 'add_to_context'
    const isError = label.startsWith('Error:')
    const toolLabel = formatToolName(toolName);

    return (
        <div className="flex items-center w-full mx-2">
            <div className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all w-full relative overflow-hidden",
                isError
                    ? "border-destructive/20 bg-destructive/5 text-destructive shadow-[0_0_15px_rgba(239,68,68,0.05)]"
                    : "border-accent/20 bg-accent/5 text-accent shadow-[0_0_15px_rgba(59,130,246,0.05)]"
            )}>
                <div className={cn(
                    "p-1.5 rounded-lg flex items-center justify-center relative z-10 shrink-0 shadow-inner transition-colors duration-500",
                    isError
                        ? "bg-destructive/10 border border-destructive/20 text-destructive"
                        : "bg-card border border-accent/20 text-accent"
                )}>
                    {isError ? (
                        <AlertTriangle className="w-4 h-4 relative z-10" />
                    ) : isInternet ? (
                        <Globe className="w-4 h-4 relative z-10" />
                    ) : isLegal ? (
                        <Scale className="w-4 h-4 relative z-10" />
                    ) : (
                        <CheckCircle2 className="w-4 h-4 relative z-10" />
                    )}
                </div>
                <div className="flex flex-col flex-1 min-w-0 relative z-10 justify-center">
                    <span className="truncate leading-tight font-semibold text-[13px] opacity-70">
                        {toolLabel}
                    </span>
                    <span className="truncate leading-none font-medium mt-0.5">
                        {label}
                    </span>
                </div>
            </div>
        </div>
    )
})

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

const ResearchFlow = memo(function ResearchFlow({
    status,
    plan,
    isReplan,
    visualStepIndex,
}: {
    status: StreamStatusEvent,
    plan: string[],
    isReplan: boolean,
    visualStepIndex: number
}) {
    const currentResults = status.results_count ?? status.evidence_count ?? 0
    const [latchedResults, setLatchedResults] = useState(0)

    // Latch the results count to prevent flickering
    useEffect(() => {
        if (currentResults > latchedResults) {
            setLatchedResults(currentResults)
        }
    }, [currentResults, latchedResults])

    const STEPS_PER_GROUP = 5 // User requested 5 steps per cluster
    const GROUPS_PER_PAGE = 4 // User requested 4 visible clusters

    // Grouping logic: Chunk the plan into groups of STEPS_PER_GROUP
    const groups = useMemo(() => {
        const result = []
        for (let i = 0; i < plan.length; i += STEPS_PER_GROUP) {
            result.push(plan.slice(i, i + STEPS_PER_GROUP))
        }
        return result
    }, [plan, STEPS_PER_GROUP])

    // Detect which group is currently active
    const activeGroupIndex = Math.floor(visualStepIndex / STEPS_PER_GROUP)

    // Pagination logic based on groups
    const pageIndex = useMemo(() =>
        Math.floor(Math.max(0, activeGroupIndex) / GROUPS_PER_PAGE),
        [activeGroupIndex, GROUPS_PER_PAGE])

    const config = useMemo(() => ({
        circleSize: 14,
        barWidth: 4
    }), [])

    const barLeft = useMemo(() =>
        (config.circleSize / 2) - (config.barWidth / 2),
        [config.circleSize, config.barWidth])

    const startGroup = useMemo(() =>
        pageIndex * GROUPS_PER_PAGE,
        [pageIndex, GROUPS_PER_PAGE])

    const visibleGroups = useMemo(() =>
        groups.slice(startGroup, startGroup + GROUPS_PER_PAGE),
        [groups, startGroup, GROUPS_PER_PAGE])

    const progressHeight = useMemo(() => {
        if (visibleGroups.length <= 1) return "0%"
        // How many groups are fully or partially completed in the current page
        const groupInPage = Math.max(0, activeGroupIndex - startGroup)
        return `${Math.min(100, (groupInPage / (visibleGroups.length - 1)) * 100)}%`
    }, [activeGroupIndex, startGroup, visibleGroups.length])


    // Adaptive "Plug and Play" Structure from status-update.js
    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
        >
            <div className="p-4 md:p-6 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent/10 text-accent">
                            <Sparkles className={cn("w-4 h-4", status.phase !== 'research_reflection' && "animate-pulse")} />
                        </div>
                        <h3 className="text-sm font-medium text-foreground/90 font-sans">
                            {isReplan ? 'Refinando plan...' : 'Plan de investigación'}
                        </h3>
                    </div>
                    {latchedResults > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-accent px-2 py-1 rounded bg-accent/10 border border-accent/20">
                                {latchedResults} hallazgos
                            </span>
                        </div>
                    )}
                </div>

                {/* Reflection/Reasoning View */}
                {status.phase === 'research_reflection' && status.reasoning && (
                    <div className="bg-accent/5 border border-accent/10 rounded-lg p-4 mb-6">
                        <p className="text-[13px] text-foreground/80 leading-relaxed italic">
                            <span className="font-bold text-accent mr-2 uppercase text-[10px]">Reflexión:</span>
                            {status.reasoning}
                        </p>
                    </div>
                )}

                <div className="relative ml-2">
                    {/* The Track: Vertical line that connects the dots */}
                    {/* Background Track - shows where the research will go */}
                    <div
                        className="absolute top-2 bottom-2 rounded-full"
                        style={{
                            left: `${barLeft}px`,
                            width: `${config.barWidth}px`,
                            backgroundColor: 'hsla(39.5, 23.5%, 68.2%, 0.2)'
                        }}
                    />

                    {/* Filling Progress Bar - shows how much is done */}
                    <motion.div
                        className="absolute top-2 rounded-full origin-top"
                        style={{
                            left: `${barLeft}px`,
                            width: `${config.barWidth}px`,
                            backgroundColor: 'hsl(34.9, 71.7%, 76.5%)'
                        }}
                        initial={{ height: 0 }}
                        animate={{
                            height: progressHeight
                        }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                    />

                    <div className="space-y-7 relative">
                        {visibleGroups.map((groupSteps, index) => {
                            const absoluteGroupIndex = startGroup + index
                            const isCompleted = absoluteGroupIndex < activeGroupIndex
                            const isActive = absoluteGroupIndex === activeGroupIndex && status.phase !== 'research_reflection'
                            const isPending = !isCompleted && !isActive

                            // Within an active group, which actual step are we on?
                            const subStepIndex = visualStepIndex % STEPS_PER_GROUP

                            // Only display the first two steps of each cluster as requested
                            // Steps 0 -> label index 0, Steps 1-4 -> label index 1
                            const displayStepIndex = Math.min(1, subStepIndex)
                            const currentStepText = groupSteps[displayStepIndex] || groupSteps[0]

                            // Finished groups also show the 2nd step (most descriptive final state for that group)
                            const displayText = isCompleted ? (groupSteps[1] || groupSteps[0]) : isActive ? currentStepText : groupSteps[0]

                            return (
                                <div
                                    key={absoluteGroupIndex}
                                    className="flex items-start gap-4 md:gap-6 transition-all duration-500 min-h-[1.5rem]"
                                >
                                    {/* The Dot Indicator */}
                                    <div
                                        className="relative z-10 flex items-center justify-center my-auto shrink-0"
                                        style={{ width: `${config.circleSize}px`, height: `${config.circleSize}px` }}
                                    >
                                        <div className={cn(
                                            "w-full h-full rounded-full transition-all duration-700 bg-card border",
                                            isCompleted
                                                ? "border-accent bg-accent"
                                                : isActive
                                                    ? "border-accent scale-110"
                                                    : "border-border"
                                        )}
                                            style={isCompleted ? {
                                                boxShadow: '0 0 14px 0 hsla(34.9, 71.7%, 76.5%, 0.5), 0 0 4px 0 hsla(34.9, 71.7%, 76.5%, 0.3)',
                                                backgroundColor: 'hsl(34.9, 71.7%, 76.5%)',
                                                borderColor: 'hsl(34.9, 71.7%, 76.5%)'
                                            } : isActive ? {
                                                boxShadow: '0 0 15px var(--accent-shadow, rgba(59,130,246,0.2))'
                                            } : {}}
                                        />
                                    </div>

                                    {/* The Label */}
                                    <div className={cn(
                                        "flex-1 min-w-0 my-auto",
                                        isCompleted ? "transition-opacity duration-500" : "",
                                        isPending ? "opacity-30" : "opacity-100"
                                    )}>
                                        <div className="flex flex-col gap-1">
                                            <AnimatePresence mode="wait">
                                                <motion.span
                                                    key={`${absoluteGroupIndex}-${displayText}`}
                                                    initial={{ opacity: 0, y: 2 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -2 }}
                                                    transition={{ duration: 0.3 }}
                                                    className={cn(
                                                        "text-sm transition-colors duration-500 font-sans leading-snug block",
                                                        isActive ? "text-foreground font-semibold" :
                                                            isCompleted ? "text-muted-foreground" : "text-muted-foreground/60"
                                                    )}
                                                >
                                                    {displayText}
                                                </motion.span>
                                            </AnimatePresence>
                                            {isActive && (
                                                <div className="flex items-center gap-1.5 text-[10px] text-accent font-bold uppercase tracking-tight animate-in slide-in-from-top-1 fade-in duration-300">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    <span>Procesando {subStepIndex + 1}/{STEPS_PER_GROUP}...</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Pagination Indicator */}
                {groups.length > GROUPS_PER_PAGE && (
                    <div className="mt-6 text-[10px] text-muted-foreground/50 pl-8 font-medium border-t border-border/30 pt-4">
                        Mostrando grupos {startGroup + 1}-{Math.min(startGroup + GROUPS_PER_PAGE, groups.length)} de {groups.length}
                    </div>
                )}
            </div>
        </motion.div>
    )
})

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
