"use client"

import { Copy, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/Logo"
import { CitationResponse, ArticleDetailResponse, ArticleResult, ArtifactSummary } from "@/lib/api/types"
import { getArticleByNodeId } from "@/lib/api/services/searchService"
import { ArticleDetailsModal } from "@/components/common/ArticleDetailsModal"
import { FeedbackButtons } from "@/components/beta"
import { useState, memo } from "react"

import { AssistantMarkdown } from "@/components/chat/AssistantMarkdown"
import { CitationList } from "@/components/chat/CitationList"

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

    return (
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

            {role === "assistant" && !isTyping && (
                <CitationList citations={citations} onCitationClick={handleCitationClick} />
            )}

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
