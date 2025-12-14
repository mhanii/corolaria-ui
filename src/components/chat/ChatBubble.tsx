"use client"

import { Copy, Edit, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CitationResponse, ArticleDetailResponse, ArticleResult } from "@/lib/api/types"
import { getArticleByNodeId } from "@/lib/api/services/searchService"
import { ArticleDetailsModal } from "@/components/common/ArticleDetailsModal"
import { FeedbackButtons } from "@/components/beta"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatBubbleProps {
    role: "user" | "assistant"
    content: string
    citations?: CitationResponse[]
    onEdit?: (content: string) => void
    isStreaming?: boolean
    /** Message index for feedback (required in test mode) */
    messageIndex?: number
    /** Conversation ID for feedback (required in test mode) */
    conversationId?: string
    /** Whether test mode is enabled for feedback buttons */
    testModeEnabled?: boolean
}



/**
 * Process markdown content and replace citation markers with clickable elements
 */
/**
 * Process markdown content and replace citation markers with clickable elements
 */
function processMarkdownWithCitations(
    content: string,
    citations: CitationResponse[],
    onCitationClick: (articleId: string) => void,
    isStreaming: boolean = false
) {
    // Create a map of cite_key to citations
    const citationMap = new Map(citations.map(c => [c.cite_key, c]))

    // Helper function to process text children and convert citation markers to buttons
    const processChildren = (child: any): any => {
        if (typeof child === 'string') {
            // Split by citation markers like [cite:key]Text[/cite]
            const parts = child.split(/(\[cite:[^\]]+\](?:[\s\S]+?)\[\/cite\])/g)
            return parts.map((part, idx) => {
                const match = part.match(/^\[cite:([^\]]+)\]([\s\S]+?)\[\/cite\]$/)
                if (match) {
                    const citeKey = match[1]
                    const displayText = match[2]
                    const citation = citationMap.get(citeKey)

                    if (citation) {
                        return (
                            <button
                                key={idx}
                                className="inline-flex items-center justify-center px-1.5 py-0 mx-0.5 text-[0.9rem] font-medium rounded bg-accent/10 text-foreground/75 hover:text-foreground hover:bg-accent/20 cursor-pointer transition-colors hover:underline hover:decoration-dotted underline-offset-4"
                                title={`${citation.normativa_title} - ${citation.article_path} (Click para abrir)`}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onCitationClick(citation.article_id)
                                }}
                            >
                                {displayText}
                            </button>
                        )
                    }
                    // Fallback if citation not found: show styled text
                    return (
                        <span
                            key={idx}
                            className="inline-flex items-center justify-center px-1.5 py-0 mx-0.5 text-[0.9rem] font-medium rounded bg-accent/10 text-foreground/75"
                        >
                            {displayText}
                        </span>
                    )
                }
                return part
            })
        }
        // Recursively process React elements that have children
        if (child && typeof child === 'object' && child.props && child.props.children) {
            return {
                ...child,
                props: {
                    ...child.props,
                    children: Array.isArray(child.props.children)
                        ? child.props.children.map(processChildren)
                        : processChildren(child.props.children)
                }
            }
        }
        return child
    }

    // Helper to process all children of an element
    const processAllChildren = (children: any) => {
        if (Array.isArray(children)) {
            return children.map(processChildren)
        }
        return processChildren(children)
    }

    return (
        <>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Apply citation processing to all text-containing elements
                    p: ({ children, ...props }) => (
                        <p className="mb-4 text-base leading-relaxed" {...props}>{processAllChildren(children)}</p>
                    ),
                    li: ({ children, ...props }) => (
                        <li className="text-base leading-relaxed pl-2" {...props}>{processAllChildren(children)}</li>
                    ),
                    h1: ({ children, ...props }) => (
                        <h1 className="text-4xl font-bold mb-4 mt-6" {...props}>{processAllChildren(children)}</h1>
                    ),
                    h2: ({ children, ...props }) => (
                        <h2 className="text-3xl font-bold mb-3 mt-5" {...props}>{processAllChildren(children)}</h2>
                    ),
                    h3: ({ children, ...props }) => (
                        <h3 className="text-2xl font-semibold mb-3 mt-4" {...props}>{processAllChildren(children)}</h3>
                    ),
                    h4: ({ children, ...props }) => (
                        <h4 className="text-xl font-semibold mb-2 mt-3" {...props}>{processAllChildren(children)}</h4>
                    ),
                    td: ({ children, ...props }) => (
                        <td className="border border-border px-4 py-2" {...props}>{processAllChildren(children)}</td>
                    ),
                    th: ({ children, ...props }) => (
                        <th className="border border-border bg-muted px-4 py-2 text-left font-semibold" {...props}>{processAllChildren(children)}</th>
                    ),
                    blockquote: ({ children, ...props }) => (
                        <blockquote className="border-l-4 border-accent/40 pl-4 py-2 my-4 italic bg-muted/30 rounded-r" {...props}>{processAllChildren(children)}</blockquote>
                    ),
                    strong: ({ children, ...props }) => (
                        <strong className="font-bold" {...props}>{processAllChildren(children)}</strong>
                    ),
                    em: ({ children, ...props }) => (
                        <em className="italic" {...props}>{processAllChildren(children)}</em>
                    ),
                    // Elements that don't need citation processing
                    ul: ({ children, ...props }) => <ul className="list-disc ml-6 mb-4 space-y-2" {...props}>{children}</ul>,
                    ol: ({ children, ...props }) => <ol className="list-decimal ml-6 mb-4 space-y-2" {...props}>{children}</ol>,
                    code: ({ inline, children, ...props }: any) =>
                        inline
                            ? <code className="bg-muted px-2 py-1 rounded text-sm font-mono" {...props}>{children}</code>
                            : <code className="block bg-muted p-4 rounded-lg my-4 text-sm font-mono overflow-x-auto" {...props}>{children}</code>,
                    pre: ({ children, ...props }) => <pre className="my-4" {...props}>{children}</pre>,
                    a: ({ children, href, ...props }) => <a href={href} className="text-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>,
                    hr: ({ ...props }) => <hr className="my-6 border-border" {...props} />,
                    table: ({ children, ...props }) => <div className="overflow-x-auto my-4"><table className="w-full border-collapse" {...props}>{children}</table></div>,
                }}
            >
                {content}
            </ReactMarkdown>
            {isStreaming && (
                <span className="inline-block ml-0.5 text-accent font-normal animate-blink">|</span>
            )}
        </>
    )
}

export function ChatBubble({
    role,
    content,
    citations = [],
    onEdit,
    isStreaming = false,
    messageIndex,
    conversationId,
    testModeEnabled = false,
}: ChatBubbleProps) {
    const router = useRouter()
    const [showCitations, setShowCitations] = useState(false)
    const [selectedArticle, setSelectedArticle] = useState<ArticleResult | ArticleDetailResponse | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)



    const handleAction = (action: string) => {
        if (action === "copy") {
            navigator.clipboard.writeText(content)
        } else if (action === "edit" && onEdit) {
            onEdit(content)
        }
    }

    const handleCitationClick = async (articleId: string) => {
        try {
            // First show the dialog with loading state if needed, or just fetch
            // We'll set a temporary object with just ID to trigger loading if we wanted, 
            // but for now let's fetch then show, or show empty then fill.
            // Better: fetch then show to avoid flickering empty modal, or show modal with valid loading state.
            // Since ArticleDetailsModal expects an article object, let's fetch first.

            // Actually, for better UX (immediate feedback), we might want to show a loader.
            // But ArticleDetailsModal requires an article object. 
            // Let's rely on the service to get data fast.
            const article = await getArticleByNodeId(articleId)
            setSelectedArticle(article)
            setDialogOpen(true)
        } catch (error) {
            console.error("Failed to load article details:", error)
            // Optionally show toast error
        }
    }

    const hasCitations = citations.length > 0

    // Render content - markdown for assistant, plain text for user
    // Always process citation markers from text for assistant messages
    const renderedContent = useMemo(() => {
        if (role === "assistant") {
            // Always process citations - the function will handle missing citations gracefully
            return processMarkdownWithCitations(content, citations, handleCitationClick, isStreaming)
        }
        return content
    }, [content, citations, role, isStreaming])

    return (
        <div className={cn(
            "flex flex-col max-w-[85%] min-w-0 group",
            role === "user" ? "ml-auto items-end" : "mr-auto items-start"
        )}>
            <div
                className={cn(
                    "rounded-2xl px-3 py-2.5 shadow-soft",
                    role === "user"
                        ? "bg-accent text-accent-foreground font-medium"
                        : "bg-card border"
                )}
            >
                <div className={cn(
                    "break-words [overflow-wrap:anywhere]",
                    role === "assistant" && "text-foreground",
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
                                const displayIndex = arrayIndex + 1
                                return (
                                    <div
                                        key={citation.cite_key}
                                        className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 border text-xs cursor-pointer hover:bg-muted/80 transition-colors"
                                        onClick={() => handleCitationClick(citation.article_id)}
                                    >
                                        <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded bg-accent/20 text-foreground/75 font-semibold text-[10px]">
                                            {/* We can use a hash or just the index+1 to show a number if desired, or maybe an icon */}
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
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent/10 text-foreground/75">
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
                    {/* Beta feedback buttons - only in test mode with required props */}
                    {testModeEnabled && messageIndex !== undefined && conversationId && (
                        <FeedbackButtons
                            messageIndex={messageIndex}
                            conversationId={conversationId}
                        />
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-muted/50"
                        onClick={() => handleAction("copy")}
                    >
                        <Copy className="h-3.5 w-3.5" />
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

            <ArticleDetailsModal
                article={selectedArticle}
                isOpen={dialogOpen}
                onOpenChange={setDialogOpen}
                onArticleChange={setSelectedArticle}
            />
        </div>
    )
}
