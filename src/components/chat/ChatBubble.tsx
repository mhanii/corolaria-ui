"use client"

import { Copy, Edit, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/Logo"
import { CitationResponse, ArticleDetailResponse, ArticleResult, ArtifactSummary } from "@/lib/api/types"
import { getArticleByNodeId } from "@/lib/api/services/searchService"
import { ArticleDetailsModal } from "@/components/common/ArticleDetailsModal"
import { ArtifactChip } from "@/components/chat/ArtifactChip"
import { FeedbackButtons } from "@/components/beta"
import { useState, useMemo, memo } from "react"
import ReactMarkdown, { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createIdToCitationMap } from "@/lib/citationUtils"

interface ChatBubbleProps {
    role: "user" | "assistant" | "system"
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
    /** Artifacts (generated documents) */
    artifacts?: ArtifactSummary[] | null
    /** Callback when an artifact is clicked */
    onArtifactClick?: (artifactId: string, title: string) => void
    /** Called when a phase (e.g. plan) is complete */
    onComplete?: () => void
    /** Whether the assistant is currently 'thinking' or preparing response */
    isTyping?: boolean
    /** Dynamic min-height to reserve space and push user message to top */
    minHeight?: string | number
    /** Whether this is the last message in the conversation (controls showing action buttons) */
    isLast?: boolean
}

// Standard markdown components styling - defined outside to be stable
const MarkdownComponents: Components = {
    p: ({ children, ...props }) => <p className="mb-4 last:mb-0 text-lg leading-relaxed" {...props}>{children}</p>,
    li: ({ children, ...props }) => <li className="text-lg leading-relaxed pl-2" {...props}>{children}</li>,
    h1: ({ children, ...props }) => <h1 className="text-4xl font-bold mb-4 mt-6" {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 className="text-3xl font-bold mb-3 mt-5" {...props}>{children}</h2>,
    h3: ({ children, ...props }) => <h3 className="text-2xl font-semibold mb-3 mt-4" {...props}>{children}</h3>,
    h4: ({ children, ...props }) => <h4 className="text-xl font-semibold mb-2 mt-3" {...props}>{children}</h4>,
    td: ({ children, ...props }) => <td className="border border-border px-4 py-2" {...props}>{children}</td>,
    th: ({ children, ...props }) => <th className="border border-border bg-muted px-4 py-2 text-left font-semibold" {...props}>{children}</th>,
    blockquote: ({ children, ...props }) => <blockquote className="border-l-4 border-accent/40 pl-4 py-2 my-4 italic bg-muted/30 rounded-r" {...props}>{children}</blockquote>,
    strong: ({ children, ...props }) => <strong className="font-bold" {...props}>{children}</strong>,
    em: ({ children, ...props }) => <em className="italic" {...props}>{children}</em>,
    ul: ({ children, ...props }) => <ul className="list-disc ml-6 mb-4 space-y-2" {...props}>{children}</ul>,
    ol: ({ children, ...props }) => <ol className="list-decimal ml-6 mb-4 space-y-2" {...props}>{children}</ol>,
    code: ({ className, children, ...props }) => {
        const { inline } = props as any
        return inline
            ? <code className="bg-muted px-2 py-1 rounded text-sm font-mono" {...props}>{children}</code>
            : <code className="block bg-muted p-4 rounded-lg my-4 text-sm font-mono overflow-x-auto" {...props}>{children}</code>
    },
    pre: ({ children, ...props }) => <pre className="my-4" {...props}>{children}</pre>,
    hr: ({ ...props }) => <hr className="my-6 border-border" {...props} />,
    table: ({ children, ...props }) => <div className="overflow-x-auto my-4"><table className="w-full border-collapse" {...props}>{children}</table></div>,
}

/**
 * Process markdown content:
 * 1. Convert <cite id="N">text</cite> to [text](#citation-N)
 * 2. Render markdown with custom component for 'a' tags
 */
const AssistantMarkdown = memo(function AssistantMarkdown({
    content,
    citations,
    isStreaming
}: {
    content: string,
    citations: CitationResponse[],
    isStreaming: boolean
}) {
    // 1. Memoize processed content (string replacements)
    const processedContent = useMemo(() => {
        if (!content) return "";
        return content.replace(/<cite id=["']?(\d+)["']?>([\s\S]*?)<\/cite>/g, (match, id, text) => {
            return `[${text}](#citation-${id})`
        })
    }, [content]);

    // 2. Create map of ID -> Citation (memoized)
    const idCitationMap = useMemo(() => createIdToCitationMap(citations), [citations]);

    // 3. Stabilize the 'a' component which depends on the citations map
    const components = useMemo(() => ({
        ...MarkdownComponents,
        a: ({ children, href, ...props }: any) => {
            const { node, ...rest } = props
            if (href && href.startsWith('#citation-')) {
                const idString = href.replace('#citation-', '')
                const id = parseInt(idString, 10)
                if (!isNaN(id)) {
                    const citation = idCitationMap.get(id)
                    if (citation) {
                        if (!citation.normativa_id) {
                            return <span className="text-accent font-medium" title="Enlace no disponible">{children}</span>
                        }
                        return (
                            <a
                                href={`https://boe.es/buscar/act.php?id=${citation.normativa_id}#art${citation.article_number}`}
                                className="text-accent hover:underline font-medium inline-flex items-center gap-0.5"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title={`${citation.display_text}\n${citation.normativa_title}`}
                            >
                                {children}
                            </a>
                        )
                    }
                }
            }
            return (
                <a href={href} className="text-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...rest}>
                    {children}
                </a>
            )
        }
    }), [idCitationMap]);

    return (
        <>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={components as any}
            >
                {processedContent}
            </ReactMarkdown>
            {/* CSS-only blinking cursor — no JS animation needed */}
            {isStreaming && (
                <span className="streaming-cursor" aria-hidden="true" />
            )}
        </>
    )
});

export const ChatBubble = memo(function ChatBubble({
    role,
    content,
    citations = [],
    onEdit,
    isStreaming = false,
    messageIndex,
    conversationId,
    testModeEnabled = false,
    artifacts,
    onArtifactClick,
    isTyping = false,
    minHeight,
    isLast = false,
}: ChatBubbleProps) {
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
            const article = await getArticleByNodeId(articleId)
            setSelectedArticle(article)
            setDialogOpen(true)
        } catch (error) {
            console.error("Failed to load article details:", error)
        }
    }

    const hasCitations = citations.length > 0

    return (
        // Plain div with CSS entry animation — no framer-motion layout tracking
        <div
            className={cn(
                "flex flex-col max-w-[95%] min-w-0 group animate-bubble-in",
                role === "user" ? "ml-auto items-end" : "mr-auto items-start",
                isTyping && "w-full"
            )}
            style={{ minHeight }}
        >
            <div
                className={cn(
                    "rounded-2xl px-4 py-3",
                    role === "user"
                        ? "bg-accent text-accent-foreground font-medium shadow-soft text-lg"
                        : "text-foreground",
                    isTyping && "w-full bg-accent/[0.03] border border-accent/10 min-h-[100px] flex items-start justify-start p-6 shadow-inner"
                )}
            >
                {isTyping && !isStreaming ? (
                    <div className="flex items-start gap-4 w-full">
                        <div className="mt-1 shrink-0">
                            <Logo animate size="sm" />
                        </div>
                        <div className="flex flex-col items-start gap-3 flex-1 w-full overflow-hidden">
                            <div className="flex flex-col gap-2 w-full">
                                <div className="h-4 bg-accent/10 rounded-full w-[40%] animate-pulse" />
                                <div className="h-4 bg-accent/5 rounded-full w-[80%] animate-pulse delay-75" />
                                <div className="h-4 bg-accent/5 rounded-full w-[60%] animate-pulse delay-150" />
                            </div>
                            <span className="text-xs text-accent/60 font-medium tracking-wide uppercase">
                                Generando respuesta legal...
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className={cn(
                            "break-words [overflow-wrap:anywhere] relative",
                            role === "assistant" && "text-foreground leading-relaxed",
                            role === "user" && "whitespace-pre-wrap leading-relaxed"
                        )}>
                            {role === "assistant" ? (
                                <AssistantMarkdown
                                    content={content}
                                    citations={citations}
                                    isStreaming={isStreaming}
                                />
                            ) : (
                                content
                            )}
                        </div>
                    </div>
                )}
            </div>


            {/* Citations section for assistant messages */}
            {role === "assistant" && !isTyping && hasCitations && (
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
                        <div className="mt-2 space-y-2 max-w-full overflow-hidden">
                            {citations.map((citation, arrayIndex) => {
                                const displayIndex = arrayIndex + 1
                                return (
                                    <div
                                        key={citation.cite_key}
                                        className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 border text-xs cursor-pointer hover:bg-muted/80 transition-colors max-w-full overflow-hidden"
                                        onClick={() => handleCitationClick(citation.article_id)}
                                    >
                                        <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded bg-accent/20 text-foreground/75 font-semibold text-[10px]">
                                            {displayIndex}
                                        </span>
                                        <div className="flex-1 min-w-0 overflow-hidden">
                                            <p className="font-medium text-foreground truncate">
                                                {citation.article_number}
                                            </p>
                                            <p className="text-muted-foreground truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
                                                {citation.normativa_title}
                                            </p>
                                            {citation.article_path && (
                                                <p className="text-muted-foreground/70 truncate text-[10px] max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
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

            {/* Action buttons for assistant messages - shown on hover, only on last message */}
            {role === "assistant" && !isTyping && isLast && (
                <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
})
