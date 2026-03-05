"use client"

import { useState, useEffect, useMemo, memo } from "react"
import { motion } from "framer-motion"
import { Loader2, ListTodo } from "lucide-react"
import { StreamStatusEvent } from "@/lib/api/types"
import { cn } from "@/lib/utils"

interface ResearchFlowProps {
    status: StreamStatusEvent
    plan: string[]
    isReplan: boolean
    visualStepIndex: number
    groupsPerPage?: number
    compact?: boolean
    progressByClusterOnly?: boolean
}

export const ResearchFlow = memo(function ResearchFlow({
    status,
    plan,
    isReplan,
    visualStepIndex,
    groupsPerPage,
    compact = false,
    progressByClusterOnly = true,
}: ResearchFlowProps) {
    const currentResults = status.results_count ?? status.evidence_count ?? 0
    const [latchedResults, setLatchedResults] = useState(0)
    const [isMobileViewport, setIsMobileViewport] = useState(false)

    // Latch the results count to prevent flickering
    useEffect(() => {
        if (currentResults > latchedResults) {
            setLatchedResults(currentResults)
        }
    }, [currentResults, latchedResults])

    useEffect(() => {
        const checkViewport = () => setIsMobileViewport(window.innerWidth < 768)
        checkViewport()
        window.addEventListener("resize", checkViewport)
        return () => window.removeEventListener("resize", checkViewport)
    }, [])

    const STEPS_PER_GROUP = 2 // 2 steps per cluster → more clusters from a short plan
    const GROUPS_PER_PAGE = groupsPerPage ?? (isMobileViewport ? 3 : 4)

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

    const startGroup = useMemo(() =>
        pageIndex * GROUPS_PER_PAGE,
        [pageIndex, GROUPS_PER_PAGE])

    const visibleGroups = useMemo(() =>
        groups.slice(startGroup, startGroup + GROUPS_PER_PAGE),
        [groups, startGroup, GROUPS_PER_PAGE])

    const activeGroupInPage = Math.max(0, activeGroupIndex - startGroup)
    const subStepProgress = Math.min(1, Math.max(0, ((visualStepIndex % STEPS_PER_GROUP) + 1) / STEPS_PER_GROUP))

    // Adaptive "Plug and Play" Structure
    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
        >
            <div className="p-4 md:p-5 rounded-2xl border border-border/60 bg-background/95 shadow-soft">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-md bg-muted text-accent border border-border/60">
                            <ListTodo className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-semibold tracking-tight text-foreground truncate">
                            {isReplan ? 'Refinando plan...' : 'Plan de investigación'}
                        </h3>
                    </div>
                    {latchedResults > 0 && (
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-semibold text-accent px-2 py-1 rounded-md bg-accent/10 border border-accent/20">
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

                <div className="relative">
                    <div className={cn("relative", compact ? "space-y-2" : "space-y-5")}>
                        {visibleGroups.map((groupSteps, index) => {
                            const absoluteGroupIndex = startGroup + index
                            const isCompleted = absoluteGroupIndex < activeGroupIndex
                            const isActive = absoluteGroupIndex === activeGroupIndex && status.phase !== 'research_reflection'
                            const isPending = !isCompleted && !isActive
                            const hasConnector = index < visibleGroups.length - 1
                            const connectorFill = progressByClusterOnly
                                ? (index < activeGroupInPage ? 1 : 0)
                                : index < activeGroupInPage
                                    ? 1
                                    : index === activeGroupInPage
                                        ? subStepProgress
                                        : 0

                            const subStepIndex = visualStepIndex % STEPS_PER_GROUP
                            const displayStepIndex = Math.min(1, subStepIndex)
                            const currentStepText = groupSteps[displayStepIndex] || groupSteps[0]

                            const displayText = isCompleted ? (groupSteps[1] || groupSteps[0]) : isActive ? currentStepText : groupSteps[0]

                            return (
                                <div
                                    key={absoluteGroupIndex}
                                    className={cn(
                                        "flex items-start gap-3 md:gap-4 transition-all duration-300 relative",
                                        compact ? "min-h-[1.85rem]" : "min-h-[2.4rem]"
                                    )}
                                >
                                    <div className="relative flex w-4 justify-center shrink-0 mt-0.5">
                                        <div className={cn(
                                            "h-3.5 w-3.5 rounded-full transition-all duration-500 bg-background border-2",
                                            isCompleted
                                                ? "border-accent bg-accent"
                                                : isActive
                                                    ? "border-accent scale-105"
                                                    : "border-border/70"
                                        )}
                                            style={isCompleted ? {
                                                boxShadow: '0 0 8px hsl(var(--accent) / 0.25)',
                                                backgroundColor: 'hsl(var(--accent) / 0.95)',
                                                borderColor: 'hsl(var(--accent) / 0.95)'
                                            } : isActive ? {
                                                boxShadow: '0 0 8px hsl(var(--accent) / 0.22)'
                                            } : {}}
                                        />

                                        {hasConnector && (
                                            <div className={cn(
                                                "absolute left-1/2 -translate-x-1/2 w-[2px] rounded-full bg-border/60 overflow-hidden",
                                                compact ? "top-[12px] h-[32px]" : "top-[15px] h-[34px]"
                                            )}>
                                                <motion.div
                                                    className="w-full rounded-full bg-accent origin-top"
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${connectorFill * 100}%` }}
                                                    transition={{ duration: 0.35, ease: "easeOut" }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className={cn(
                                        "flex-1 min-w-0",
                                        isCompleted ? "transition-opacity duration-500" : "",
                                        isPending ? "opacity-30" : "opacity-100"
                                    )}>
                                        <div className="flex flex-col gap-1">
                                            <span
                                                key={`${absoluteGroupIndex}-${displayText}`}
                                                title={displayText}
                                                className={cn(
                                                    "text-[12.5px] md:text-sm transition-colors duration-300 leading-snug block overflow-hidden pr-1",
                                                    isActive ? "text-foreground font-semibold" :
                                                        isCompleted ? "text-muted-foreground" : "text-muted-foreground/60"
                                                )}
                                                style={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                }}
                                            >
                                                {displayText}
                                            </span>
                                            {isActive && (
                                                <div className="flex items-center gap-1.5 text-[10px] text-accent font-semibold uppercase tracking-tight animate-in slide-in-from-top-1 fade-in duration-300">
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

                {groups.length > GROUPS_PER_PAGE && (
                    <div className="mt-4 text-[10px] text-muted-foreground/60 pl-7 font-medium border-t border-border/40 pt-3">
                        Mostrando grupos {startGroup + 1}-{Math.min(startGroup + GROUPS_PER_PAGE, groups.length)} de {groups.length}
                    </div>
                )}
            </div>
        </motion.div>
    )
})
