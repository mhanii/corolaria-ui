"use client"

import { Copy, Edit, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { StatusIndicator } from "@/components/chat/StatusIndicator"
import { Logo } from "@/components/ui/Logo"
import { CitationResponse, ArticleDetailResponse, ArticleResult, ArtifactSummary, StreamStatusEvent } from "@/lib/api/types"
import { getArticleByNodeId } from "@/lib/api/services/searchService"
import { ArticleDetailsModal } from "@/components/common/ArticleDetailsModal"
import { ArtifactChip } from "@/components/chat/ArtifactChip"
import { FeedbackButtons } from "@/components/beta"
import { useState, useMemo } from "react"
// import { useRouter } from "next/navigation"
import ReactMarkdown, { Components } from 'react-markdown'
import { motion, AnimatePresence } from "framer-motion"
import remarkGfm from 'remark-gfm'
import { createIdToCitationMap } from "@/lib/citationUtils"

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
    /** Artifacts (generated documents) */
    artifacts?: ArtifactSummary[] | null
    /** Callback when an artifact is clicked */
    onArtifactClick?: (artifactId: string, title: string) => void
    /** Streaming status for document generation indicator */
    status?: StreamStatusEvent | null
    /** Called when a phase (e.g. plan) is complete */
    onComplete?: () => void
    /** Whether the assistant is currently 'thinking' or preparing response */
    isTyping?: boolean
    /** Dynamic min-height to reserve space and push user message to top */
    minHeight?: string | number
}

/**
 * Process markdown content:
 * 1. Convert <cite id="N">text</cite> to [text](#citation-N)
 * 2. Render markdown with custom component for 'a' tags
 */
function processMarkdownWithCitations(
    content: string,
    citations: CitationResponse[],
    onCitationClick: (articleId: string) => void,
    isStreaming: boolean = false
) {
    // Create map of ID -> Citation
    const idCitationMap = createIdToCitationMap(citations)

    // Pre-process content: Convert XML tags to Markdown links
    // <cite id="123">Some Text</cite>  -->  [Some Text](#citation-123)
    let processedContent = content;
    if (content) {
        // Regex to capture id and content
        // Note: We use a replacement function to handle the groups
        // Regex to capture id and content, handling optional quotes for the id attribute
        // matches <cite id="1">, <cite id='1'>, or <cite id=1>
        processedContent = content.replace(/<cite id=["']?(\d+)["']?>([\s\S]*?)<\/cite>/g, (match, id, text) => {
            return `[${text}](#citation-${id})`
        })
    }

    const components: Components = {
        // Intercept links to render citations
        a: ({ children, href, ...props }) => {
            // Clean up props to avoid passing invalid attributes to DOM
            const { node, ...rest } = props as any

            // Check if this is a citation link
            if (href && href.startsWith('#citation-')) {
                const idString = href.replace('#citation-', '')
                const id = parseInt(idString, 10)

                if (!isNaN(id)) {
                    const citation = idCitationMap.get(id)
                    if (citation) {
                        if (!citation.normativa_id) {
                            // Fallback if no normative ID for BOE link
                            return (
                                <span className="text-accent font-medium" title="Enlace no disponible">
                                    {children}
                                </span>
                            )
                        }

                        return (
                            <a
                                href={`https://boe.es/buscar/act.php?id=${citation.normativa_id}#art${citation.article_number}`}
                                className="text-accent hover:underline font-medium inline-flex items-center gap-0.5"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                    e.stopPropagation()
                                }}
                                title={`${citation.display_text}\n${citation.normativa_title}`}
                            >
                                {children}
                            </a>
                        )
                    }
                }
            }

            // Standard link fallback
            return (
                <a
                    href={href}
                    className="text-accent hover:underline font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...rest}
                >
                    {children}
                </a>
            )
        },

        // Standard markdown components styling
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

    return (
        <>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={components}
            >
                {processedContent}
            </ReactMarkdown>
            {isStreaming && (
                <span className="inline-block ml-0.5 text-accent font-normal whitespace-pre"> </span>
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
    artifacts,
    onArtifactClick,
    status,
    onComplete,
    isTyping = false,
    minHeight,
}: ChatBubbleProps) {
    // const router = useRouter()
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
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "flex flex-col max-w-[95%] min-w-0 group",
                role === "user" ? "ml-auto items-end" : "mr-auto items-start",
                isTyping && "w-full"
            )}
            style={{ minHeight: isTyping ? minHeight : undefined }}
        >
            <div
                className={cn(
                    "rounded-2xl px-3 py-2.5 transition-all duration-300",
                    role === "user"
                        ? "bg-accent text-accent-foreground font-medium shadow-soft text-lg"
                        : "text-foreground",
                    isTyping && "w-full bg-muted/20 border border-dashed border-muted-foreground/20 min-h-[100px] flex items-center justify-center"
                )}
            >
                {isTyping ? (
                    <div className="flex flex-col items-center gap-4 w-full py-8">
                        <Logo animate size="lg" />
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-sm text-muted-foreground animate-pulse font-medium">
                                Procesando tu consulta...
                            </span>
                            {status && (
                                <StatusIndicator
                                    status={status}
                                    onComplete={() => onComplete?.()}
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={cn(
                        "break-words [overflow-wrap:anywhere]",
                        role === "assistant" && "text-foreground",
                        role === "user" && "whitespace-pre-wrap leading-relaxed"
                    )}>
                        {renderedContent}
                    </div>
                )}
            </div>

            {/* Artifacts (Documents) & Status (Generation) */}
            {role === "assistant" && !isTyping && (
                <div className="w-full">
                    {/* Status indicator inside bubble flow */}
                    {status?.phase?.startsWith('document_creation') && (
                        <div className="mt-2 ml-14">
                            <StatusIndicator
                                status={status}
                                onComplete={() => onComplete?.()}
                            />
                        </div>
                    )}

                    {/* Final artifact chips */}
                    {artifacts && artifacts.length > 0 && (
                        <div className="mt-2">
                            {artifacts.map((artifact) => (
                                <ArtifactChip
                                    key={artifact.id}
                                    id={artifact.id}
                                    title={artifact.title}
                                    onClick={() => onArtifactClick?.(artifact.id, artifact.title)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
            {/* ... rest of the component remains similar ... */}
            {/* Action buttons for assistant messages - shown on hover */}
            {role === "assistant" && !isTyping && (
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
        </motion.div>
    )
}
