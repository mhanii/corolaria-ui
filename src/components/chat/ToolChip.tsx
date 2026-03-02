"use client"

import { memo } from "react"
import { Loader2, Sparkles, Wrench, AlertTriangle, CheckCircle2, Globe, Scale } from "lucide-react"
import { StreamStatusEvent } from "@/lib/api/types"
import { cn } from "@/lib/utils"

export function formatToolName(tool: string): string {
    return tool
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
}

export const ToolChip = memo(function ToolChip({ status, isStatic = false }: { status: StreamStatusEvent, isStatic?: boolean }) {
    // If it's a research step pretending to be a tool
    if (status.tool === 'research_step_done' || status.phase === 'research_step_done') {
        const isDone = status.status === 'completed' || isStatic;

        return (
            <div className="flex items-center gap-2 py-1 w-full">
                <div className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-lg border text-sm w-full relative overflow-hidden",
                    isDone ? "border-accent/10 bg-accent/5 text-foreground opacity-80" : "border-accent/30 bg-accent/10 text-foreground shadow-sm"
                )}>
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
            </div>
        );
    }

    const toolLabel = status.tool ? formatToolName(status.tool) : 'Herramienta'
    const isError = status.phase === 'tool_error'
    const isDone = status.phase === 'tool_end' || isStatic
    const isInternet = status.tool === 'internet_search' || status.tool === 'web_search'
    const isLegal = status.tool === 'legal_research' || status.tool === 'semantic_search'
    const count = status.results_count ?? status.evidence_count ?? 0

    return (
        <div className="flex items-center gap-2 py-1 w-full">
            <div className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium w-full relative overflow-hidden",
                isError
                    ? "border-destructive/30 bg-destructive/5 text-destructive"
                    : isDone
                        ? "border-accent/30 bg-accent/5 text-accent"
                        : "border-accent/20 bg-accent/5 text-foreground shadow-[0_0_15px_rgba(59,130,246,0.1)]"
            )}>
                {!isError && !isDone && (
                    <div className="absolute top-0 bottom-0 left-[-100%] w-[200%] bg-gradient-to-r from-transparent via-accent/10 to-transparent animate-[shimmer_2s_infinite]" />
                )}

                <div className={cn(
                    "p-1.5 rounded-lg flex items-center justify-center relative z-10 shrink-0",
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
                        <Scale className="w-4 h-4 animate-bounce relative z-10" style={{ animationDuration: '2s' }} />
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
                        <span className="text-[10.5px] text-muted-foreground mt-0.5 leading-none font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                            {count} {count === 1 ? 'hallazgo' : 'hallazgos'} recuperados
                        </span>
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
        </div>
    )
})

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
