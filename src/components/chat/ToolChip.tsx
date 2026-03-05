"use client"

import { memo, useState } from "react"
import { Loader2, ChevronRight, AlertTriangle } from "lucide-react"
import { StreamStatusEvent } from "@/lib/api/types"
import { cn } from "@/lib/utils"

/** Map internal tool names to user-facing Spanish labels.
 *  Uses .includes() so it catches backend name variations. */
export function getToolFriendlyLabel(tool: string): string {
    const t = tool.toLowerCase()

    // Document generation
    if (t.includes('document') || t.includes('create_legal')) return 'Generación de documento'
    // Fast / quick search
    if (t.includes('fast_research') || t.includes('rag') || t.includes('semantic') || t.includes('add_to_context')) return 'Búsqueda rápida'
    // Deep / legal research
    if (t.includes('deep_research') || t.includes('legal_research')) return 'Búsqueda profunda'
    // Internet / web
    if (t.includes('internet') || t.includes('web_search')) return 'Búsqueda en internet'
    // Research flow steps
    if (t.includes('research_step')) return 'Paso de investigación'

    return 'Herramienta'
}

/** Keep the old export name for any callers still using it. */
export const formatToolName = getToolFriendlyLabel

/* ─── Live tool chip (shown while streaming) ─── */

export const ToolChip = memo(function ToolChip({ status, isStatic = false }: { status: StreamStatusEvent, isStatic?: boolean }) {
    const [expanded, setExpanded] = useState(false)

    const isResearchStep = status.tool === 'research_step_done' || status.phase === 'research_step_done'
    const isError = status.phase === 'tool_error'
    const isDone = status.phase === 'tool_end' || status.status === 'completed' || isStatic
    const toolKey = status.tool || (isResearchStep ? 'research_step_done' : 'unknown')
    const friendlyLabel = getToolFriendlyLabel(toolKey)
    const detail = status.message || (isDone ? 'Completado' : 'Procesando...')
    const isLoading = !isDone && !isError

    return (
        <div className="w-full py-0.5 pl-1">
            <button
                type="button"
                onClick={() => setExpanded(prev => !prev)}
                className={cn(
                    "flex items-center gap-1.5 text-xs transition-colors group cursor-pointer",
                    "select-none",
                    isError
                        ? "text-destructive/70 hover:text-destructive"
                        : "text-muted-foreground/70 hover:text-muted-foreground"
                )}
            >
                {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                ) : isError ? (
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                ) : (
                    <ChevronRight className={cn(
                        "w-3 h-3 shrink-0 transition-transform duration-150",
                        expanded && "rotate-90"
                    )} />
                )}
                <span className="font-medium">{friendlyLabel}</span>
            </button>

            {expanded && (
                <div className={cn(
                    "ml-[18px] mt-0.5 text-[11px] leading-snug",
                    isError ? "text-destructive/60" : "text-muted-foreground/60"
                )}>
                    {detail}
                </div>
            )}
        </div>
    )
})

/* ─── Static / persisted tool indicator (rendered from chat history) ─── */

export const StaticToolIndicator = memo(function StaticToolIndicator({ label, toolName }: { label: string, toolName: string }) {
    const [expanded, setExpanded] = useState(false)
    const isError = label.startsWith('Error:')
    const friendlyLabel = getToolFriendlyLabel(toolName)

    return (
        <div className="w-full py-0.5 pl-1">
            <button
                type="button"
                onClick={() => setExpanded(prev => !prev)}
                className={cn(
                    "flex items-center gap-1.5 text-xs transition-colors group cursor-pointer",
                    "select-none",
                    isError
                        ? "text-destructive/70 hover:text-destructive"
                        : "text-muted-foreground/70 hover:text-muted-foreground"
                )}
            >
                {isError ? (
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                ) : (
                    <ChevronRight className={cn(
                        "w-3 h-3 shrink-0 transition-transform duration-150",
                        expanded && "rotate-90"
                    )} />
                )}
                <span className="font-medium">{friendlyLabel}</span>
            </button>

            {expanded && (
                <div className={cn(
                    "ml-[18px] mt-0.5 text-[11px] leading-snug",
                    isError ? "text-destructive/60" : "text-muted-foreground/60"
                )}>
                    {label}
                </div>
            )}
        </div>
    )
})
