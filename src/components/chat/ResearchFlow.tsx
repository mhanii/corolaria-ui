"use client"

import { useState, useEffect, useMemo, memo } from "react"
import { motion } from "framer-motion"
import { Loader2, Sparkles } from "lucide-react"
import { StreamStatusEvent } from "@/lib/api/types"
import { cn } from "@/lib/utils"

interface ResearchFlowProps {
    status: StreamStatusEvent
    plan: string[]
    isReplan: boolean
    visualStepIndex: number
}

export const ResearchFlow = memo(function ResearchFlow({
    status,
    plan,
    isReplan,
    visualStepIndex,
}: ResearchFlowProps) {
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


    // Adaptive "Plug and Play" Structure
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

                            const subStepIndex = visualStepIndex % STEPS_PER_GROUP
                            const displayStepIndex = Math.min(1, subStepIndex)
                            const currentStepText = groupSteps[displayStepIndex] || groupSteps[0]

                            const displayText = isCompleted ? (groupSteps[1] || groupSteps[0]) : isActive ? currentStepText : groupSteps[0]

                            return (
                                <div
                                    key={absoluteGroupIndex}
                                    className="flex items-start gap-4 md:gap-6 transition-all duration-500 min-h-[1.5rem]"
                                >
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

                                    <div className={cn(
                                        "flex-1 min-w-0 my-auto",
                                        isCompleted ? "transition-opacity duration-500" : "",
                                        isPending ? "opacity-30" : "opacity-100"
                                    )}>
                                        <div className="flex flex-col gap-1">
                                            <span
                                                key={`${absoluteGroupIndex}-${displayText}`}
                                                className={cn(
                                                    "text-sm transition-colors duration-300 font-sans leading-snug block",
                                                    isActive ? "text-foreground font-semibold" :
                                                        isCompleted ? "text-muted-foreground" : "text-muted-foreground/60"
                                                )}
                                            >
                                                {displayText}
                                            </span>
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

                {groups.length > GROUPS_PER_PAGE && (
                    <div className="mt-6 text-[10px] text-muted-foreground/50 pl-8 font-medium border-t border-border/30 pt-4">
                        Mostrando grupos {startGroup + 1}-{Math.min(startGroup + GROUPS_PER_PAGE, groups.length)} de {groups.length}
                    </div>
                )}
            </div>
        </motion.div>
    )
})
