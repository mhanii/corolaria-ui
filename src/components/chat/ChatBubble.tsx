"use client"

import { ThumbsUp, ThumbsDown, Copy, Flag, Edit, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CitationResponse } from "@/lib/api/types"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
 * Process markdown content and replace citation markers with clickable elements
 */
function processMarkdownWithCitations(
    content: string,
    citations: CitationResponse[],
    indexMap: Map<number, number>,
    onCitationClick: (articleId: string) => void
) {
    // Create a map of original indices to citations
    const citationByOriginalIndex = new Map(citations.map(c => [c.index, c]))

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                // Custom rendering for text to handle citation markers
                p: ({ children, ...props }) => {
                    const processChildren = (child: any): any => {
                        if (typeof child === 'string') {
                            // Split by citation markers like [1], [2], etc.
                            const parts = child.split(/(\[\d+\])/g)
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
                                return part
                            })
                        }
                        return child
                    }

                    const processedChildren = Array.isArray(children)
                        ? children.map(processChildren)
                        : processChildren(children)

                    return <p className="mb-4 text-base leading-relaxed" {...props}>{processedChildren}</p>
                },
                // Enhanced styling for markdown elements to look modern
                h1: ({ children, ...props }) => <h1 className="text-4xl font-bold mb-4 mt-6" {...props}>{children}</h1>,
                h2: ({ children, ...props }) => <h2 className="text-3xl font-bold mb-3 mt-5" {...props}>{children}</h2>,
                h3: ({ children, ...props }) => <h3 className="text-2xl font-semibold mb-3 mt-4" {...props}>{children}</h3>,
                h4: ({ children, ...props }) => <h4 className="text-xl font-semibold mb-2 mt-3" {...props}>{children}</h4>,
                ul: ({ children, ...props }) => <ul className="list-disc ml-6 mb-4 space-y-2" {...props}>{children}</ul>,
                ol: ({ children, ...props }) => <ol className="list-decimal ml-6 mb-4 space-y-2" {...props}>{children}</ol>,
                li: ({ children, ...props }) => <li className="text-base leading-relaxed pl-2" {...props}>{children}</li>,
                code: ({ inline, children, ...props }: any) =>
                    inline
                        ? <code className="bg-muted px-2 py-1 rounded text-sm font-mono" {...props}>{children}</code>
                        : <code className="block bg-muted p-4 rounded-lg my-4 text-sm font-mono overflow-x-auto" {...props}>{children}</code>,
                pre: ({ children, ...props }) => <pre className="my-4" {...props}>{children}</pre>,
                strong: ({ children, ...props }) => <strong className="font-bold" {...props}>{children}</strong>,
                em: ({ children, ...props }) => <em className="italic" {...props}>{children}</em>,
                a: ({ children, href, ...props }) => <a href={href} className="text-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>,
                blockquote: ({ children, ...props }) => <blockquote className="border-l-4 border-accent/40 pl-4 py-2 my-4 italic bg-muted/30 rounded-r" {...props}>{children}</blockquote>,
                hr: ({ ...props }) => <hr className="my-6 border-border" {...props} />,
                table: ({ children, ...props }) => <div className="overflow-x-auto my-4"><table className="w-full border-collapse" {...props}>{children}</table></div>,
                th: ({ children, ...props }) => <th className="border border-border bg-muted px-4 py-2 text-left font-semibold" {...props}>{children}</th>,
                td: ({ children, ...props }) => <td className="border border-border px-4 py-2" {...props}>{children}</td>,
            }}
        >
            {content}
        </ReactMarkdown>
    )
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

    // Render content - markdown for assistant, plain text for user
    const renderedContent = useMemo(() => {
        if (role === "assistant") {
            if (hasCitations) {
                return processMarkdownWithCitations(content, citations, indexMap, handleCitationClick)
            }
            // Still render as markdown even without citations
            return (
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        p: ({ children, ...props }) => <p className="mb-4 text-base leading-relaxed" {...props}>{children}</p>,
                        h1: ({ children, ...props }) => <h1 className="text-4xl font-bold mb-4 mt-6" {...props}>{children}</h1>,
                        h2: ({ children, ...props }) => <h2 className="text-3xl font-bold mb-3 mt-5" {...props}>{children}</h2>,
                        h3: ({ children, ...props }) => <h3 className="text-2xl font-semibold mb-3 mt-4" {...props}>{children}</h3>,
                        h4: ({ children, ...props }) => <h4 className="text-xl font-semibold mb-2 mt-3" {...props}>{children}</h4>,
                        ul: ({ children, ...props }) => <ul className="list-disc ml-6 mb-4 space-y-2" {...props}>{children}</ul>,
                        ol: ({ children, ...props }) => <ol className="list-decimal ml-6 mb-4 space-y-2" {...props}>{children}</ol>,
                        li: ({ children, ...props }) => <li className="text-base leading-relaxed pl-2" {...props}>{children}</li>,
                        code: ({ inline, children, ...props }: any) =>
                            inline
                                ? <code className="bg-muted px-2 py-1 rounded text-sm font-mono" {...props}>{children}</code>
                                : <code className="block bg-muted p-4 rounded-lg my-4 text-sm font-mono overflow-x-auto" {...props}>{children}</code>,
                        pre: ({ children, ...props }) => <pre className="my-4" {...props}>{children}</pre>,
                        strong: ({ children, ...props }) => <strong className="font-bold" {...props}>{children}</strong>,
                        em: ({ children, ...props }) => <em className="italic" {...props}>{children}</em>,
                        a: ({ children, href, ...props }) => <a href={href} className="text-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>,
                        blockquote: ({ children, ...props }) => <blockquote className="border-l-4 border-accent/40 pl-4 py-2 my-4 italic bg-muted/30 rounded-r" {...props}>{children}</blockquote>,
                        hr: ({ ...props }) => <hr className="my-6 border-border" {...props} />,
                        table: ({ children, ...props }) => <div className="overflow-x-auto my-4"><table className="w-full border-collapse" {...props}>{children}</table></div>,
                        th: ({ children, ...props }) => <th className="border border-border bg-muted px-4 py-2 text-left font-semibold" {...props}>{children}</th>,
                        td: ({ children, ...props }) => <td className="border border-border px-4 py-2" {...props}>{children}</td>,
                    }}
                >
                    {content}
                </ReactMarkdown>
            )
        }
        return content
    }, [content, citations, role, hasCitations, indexMap])

    return (
        <div className={cn(
            "flex flex-col max-w-[85%] min-w-0 group",
            role === "user" ? "ml-auto items-end" : "mr-auto items-start"
        )}>
            <div
                className={cn(
                    "rounded-2xl px-3 py-2.5 shadow-soft",
                    role === "user"
                        ? "bg-accent text-accent-foreground/90 font-medium"
                        : "bg-card border"
                )}
            >
                <div className={cn(
                    "break-words [overflow-wrap:anywhere]",
                    role === "assistant" && "text-accent",
                    role === "user" && "whitespace-pre-wrap text-base leading-relaxed"
                )}>
                    {renderedContent}
                </div>
            </div>

            {/* Citations section for assistant messages */}
            {role === "assistant" && hasCitations && (
                <div className="mt-2 w-full">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs text-muted-foreground hover:text-accent hover:bg-accent/10 px-2 h-7"
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
