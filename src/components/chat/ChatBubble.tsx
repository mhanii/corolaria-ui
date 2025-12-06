"use client"

import { ThumbsUp, ThumbsDown, Copy, Flag, Edit, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CitationResponse } from "@/lib/api/types"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"

interface ChatBubbleProps {
    role: "user" | "assistant"
    content: string
    citations?: CitationResponse[]
    onEdit?: (content: string) => void
}

/**
 * Create a mapping from original citation indices to display indices (1-based)
 * This ensures citations are displayed as [1], [2], [3] regardless of their original index
 */
function createCitationIndexMap(citations: CitationResponse[]): Map<number, number> {
    const map = new Map<number, number>()
    citations.forEach((citation, arrayIndex) => {
        map.set(citation.index, arrayIndex + 1) // Display index starts at 1
    })
    return map
}

/**
 * Parse content and replace citation markers [n] with styled, clickable spans
 * Re-indexes citations to [1], [2], etc. based on their order in the citations array
 */
function renderContentWithCitations(
    content: string,
    citations: CitationResponse[],
    indexMap: Map<number, number>,
    onCitationClick: (articleId: string) => void
) {
    // Create a map of original indices to citations for quick lookup
    const citationByOriginalIndex = new Map(citations.map(c => [c.index, c]))

    // Split by citation markers like [1], [2], etc.
    const parts = content.split(/(\[\d+\])/g)

    return parts.map((part, idx) => {
        const match = part.match(/^\[(\d+)\]$/)
        if (match) {
            const originalIndex = parseInt(match[1], 10)
            const citation = citationByOriginalIndex.get(originalIndex)
            if (citation) {
                const displayIndex = indexMap.get(originalIndex) || originalIndex
                return (
                    <button
                        key={idx}
                        className="inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 text-xs font-semibold rounded bg-accent/20 text-accent hover:bg-accent/30 cursor-pointer transition-colors"
                        title={`${citation.article_number} - ${citation.normativa_title} (Click para abrir)`}
                        onClick={(e) => {
                            e.stopPropagation()
                            onCitationClick(citation.article_id)
                        }}
                    >
                        [{displayIndex}]
                    </button>
                )
            }
        }
        return <span key={idx}>{part}</span>
    })
}

export function ChatBubble({ role, content, citations = [], onEdit }: ChatBubbleProps) {
    const router = useRouter()
    const [showCitations, setShowCitations] = useState(false)

    // Create index mapping once
    const indexMap = useMemo(() => createCitationIndexMap(citations), [citations])

    const handleAction = (action: string) => {
        if (action === "copy") {
            navigator.clipboard.writeText(content)
        } else if (action === "edit" && onEdit) {
            onEdit(content)
        }
    }

    const handleCitationClick = (articleId: string) => {
        router.push(`/document/${articleId}`)
    }

    const hasCitations = citations.length > 0

    // Render content with styled citation markers for assistant messages
    const renderedContent = useMemo(() => {
        if (role === "assistant" && hasCitations) {
            return renderContentWithCitations(content, citations, indexMap, handleCitationClick)
        }
        return content
    }, [content, citations, role, hasCitations, indexMap])

    return (
        <div className={cn(
            "flex flex-col max-w-[80%] min-w-0 group",
            role === "user" ? "ml-auto items-end" : "mr-auto items-start"
        )}>
            <div
                className={cn(
                    "rounded-2xl px-4 py-3 text-sm shadow-soft",
                    role === "user"
                        ? "bg-accent text-accent-foreground/90 font-medium font-mono"
                        : "bg-card border font-mono"
                )}
            >
                <p className={cn(
                    "leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
                    role === "assistant" && "text-accent"
                )}>
                    {renderedContent}
                </p>
            </div>

            {/* Citations section for assistant messages */}
            {role === "assistant" && hasCitations && (
                <div className="mt-2 w-full">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs text-muted-foreground hover:text-accent px-2 h-7"
                        onClick={() => setShowCitations(!showCitations)}
                    >
                        {showCitations ? (
                            <ChevronUp className="h-3 w-3" />
                        ) : (
                            <ChevronDown className="h-3 w-3" />
                        )}
                        {citations.length} {citations.length === 1 ? 'fuente' : 'fuentes'}
                    </Button>

                    {showCitations && (
                        <div className="mt-2 space-y-2">
                            {citations.map((citation, arrayIndex) => {
                                const displayIndex = arrayIndex + 1 // Re-indexed to 1, 2, 3...
                                return (
                                    <div
                                        key={citation.index}
                                        className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 border text-xs cursor-pointer hover:bg-muted/80 transition-colors"
                                        onClick={() => handleCitationClick(citation.article_id)}
                                    >
                                        <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded bg-accent/20 text-accent font-semibold">
                                            {displayIndex}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-foreground truncate">
                                                {citation.article_number}
                                            </p>
                                            <p className="text-muted-foreground truncate">
                                                {citation.normativa_title}
                                            </p>
                                            {citation.article_path && (
                                                <p className="text-muted-foreground/70 truncate text-[10px]">
                                                    {citation.article_path}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0 flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                                                {Math.round(citation.score * 100)}%
                                            </span>
                                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Action buttons for assistant messages - shown on hover */}
            {role === "assistant" && (
                <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-muted/50"
                        onClick={() => handleAction("like")}
                    >
                        <ThumbsUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-muted/50"
                        onClick={() => handleAction("dislike")}
                    >
                        <ThumbsDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-muted/50"
                        onClick={() => handleAction("copy")}
                    >
                        <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-muted/50"
                        onClick={() => handleAction("report")}
                    >
                        <Flag className="h-3.5 w-3.5" />
                    </Button>
                </div>
            )}

            {/* Action buttons for user messages - shown on hover */}
            {role === "user" && (
                <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-muted/50"
                        onClick={() => handleAction("copy")}
                    >
                        <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-muted/50"
                        onClick={() => handleAction("edit")}
                    >
                        <Edit className="h-3.5 w-3.5" />
                    </Button>
                </div>
            )}
        </div>
    )
}
