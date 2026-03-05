"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChatBubble } from "@/components/chat/ChatBubble"
import { ChatInput, type ChatInputHandle } from "@/components/chat/ChatInput"
import { ChatTools } from "@/components/chat/ChatTools"
import { DocumentAttachment } from "@/components/chat/DocumentAttachment"
import { ArtifactView } from "@/components/chat/ArtifactView"
import { ArtifactChip } from "@/components/chat/ArtifactChip"
import { StreamingArea, type StreamingAreaHandle } from "@/components/chat/StreamingArea"
import { Button } from "@/components/ui/button"
import { Coins, AlertCircle, Sparkles } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useSidebar } from "@/context/SidebarContext"
import { LogoLoader } from "@/components/ui/Logo"
import { cn } from "@/lib/utils"
import { StaticToolIndicator } from "@/components/chat/StatusIndicator"
import { useChatStream } from "@/hooks/useChatStream"

export default function ChatWithIdPage() {
    const router = useRouter()
    const params = useParams()
    const chatId = params?.id as string | undefined

    const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
    const { collapse: collapseSidebar } = useSidebar()

    const scrollRef = useRef<HTMLDivElement>(null)
    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const lastUserMessageRef = useRef<HTMLDivElement>(null)
    const chatInputRef = useRef<ChatInputHandle>(null)
    const streamingAreaRef = useRef<StreamingAreaHandle>(null)

    const [dynamicMinHeight, setDynamicMinHeight] = useState<string | number>('auto')
    const [isMobileViewport, setIsMobileViewport] = useState(false)
    const scrollRestoreRef = useRef(0)

    // Artifact state
    const [viewArtifactId, setViewArtifactId] = useState<string | null>(null)
    const [viewArtifactTitle, setViewArtifactTitle] = useState("")
    const [isArtifactViewOpen, setIsArtifactViewOpen] = useState(false)

    const openArtifact = useCallback((id: string, title: string) => {
        if (isMobileViewport && scrollAreaRef.current) {
            scrollRestoreRef.current = scrollAreaRef.current.scrollTop
        }
        collapseSidebar()
        setViewArtifactId(id)
        setViewArtifactTitle(title)
        setIsArtifactViewOpen(true)
    }, [collapseSidebar, isMobileViewport])

    const handleCloseArtifact = useCallback(() => {
        setIsArtifactViewOpen(false)
        if (isMobileViewport && scrollAreaRef.current) {
            requestAnimationFrame(() => {
                if (scrollAreaRef.current) {
                    scrollAreaRef.current.scrollTop = scrollRestoreRef.current
                }
            })
        }
    }, [isMobileViewport])
    const noop = useCallback(() => { }, [])

    const {
        messages,
        isTyping,
        isStreaming,
        error,
        insufficientTokens,
        mode,
        setMode,
        isLoadingConversation,
        loadConversation,
        handleSendMessage,
        handleDeleteConversation,
        testModeEnabled,
        openSurveyModal,
        conversationId
    } = useChatStream({
        initialConversationId: chatId || null,
        streamingAreaRef,
        onArtifactOpen: openArtifact,
    })

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/login')
        }
    }, [isAuthenticated, isAuthLoading, router])

    // Load existing conversation if chatId is provided
    useEffect(() => {
        if (chatId) {
            loadConversation(chatId)
        }
    }, [chatId, loadConversation])

    useEffect(() => {
        const updateViewport = () => setIsMobileViewport(window.innerWidth < 1024)
        updateViewport()
        window.addEventListener("resize", updateViewport)
        return () => window.removeEventListener("resize", updateViewport)
    }, [])

    useEffect(() => {
        if (!scrollRef.current) return;
        const behavior = (isTyping || isStreaming) ? 'instant' : 'smooth';
        scrollRef.current.scrollIntoView({ behavior });

        if ((isTyping || isStreaming) && scrollAreaRef.current && lastUserMessageRef.current) {
            requestAnimationFrame(() => {
                if (scrollAreaRef.current && lastUserMessageRef.current) {
                    const scrollArea = scrollAreaRef.current;
                    const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
                    const containerHeight = (viewport || scrollArea).clientHeight;

                    const messageElement = lastUserMessageRef.current;
                    const messageHeight = messageElement.offsetHeight;

                    const parent = messageElement.parentElement;
                    if (parent) {
                        const style = window.getComputedStyle(parent);
                        const pb = parseFloat(style.paddingBottom);
                        const messageStyle = window.getComputedStyle(messageElement);
                        const gap = parseFloat(messageStyle.marginTop) || (window.innerWidth >= 768 ? 24 : 16);
                        const topPadding = 16;
                        const totalOffset = gap * 2 + pb + topPadding;
                        const calculatedHeight = Math.max(200, containerHeight - messageHeight - totalOffset);
                        setDynamicMinHeight(`${calculatedHeight}px`);
                    }
                }
            });

            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth' });
                }
            }, 100);
        }
    }, [messages, isTyping, isStreaming])

    if (isAuthLoading || isLoadingConversation) {
        return (
            <div className="flex flex-col h-app-frame items-center justify-center w-full">
                <LogoLoader />
            </div>
        )
    }

    if (!isAuthenticated) return null

    return (
        <div className="flex h-app-frame overflow-hidden w-full">
            <div className={cn(
                "flex flex-col h-full transition-all duration-300 ease-in-out",
                !isMobileViewport && isArtifactViewOpen ? "w-1/2 border-r border-border" : "w-full max-w-5xl mx-auto"
            )}>
                {/* Note: The user requested to visually remove the ChatTools bar (Export, Save, History, Delete) from the main UI.
                    The functionality hooks remain available in `useChatStream` for future integration if needed. */}

                <div ref={scrollAreaRef} className="flex-1 overflow-y-auto scroll-touch">
                    <div className="space-y-4 md:space-y-6 px-3 md:px-6 py-4 md:py-6 relative pb-10">
                        {insufficientTokens && (
                            <div className="flex items-center gap-2 p-4 rounded-lg bg-accent/10 border border-accent/20 text-accent">
                                <Coins className="w-5 h-5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="font-medium">Sin tokens disponibles</p>
                                    <p className="text-sm opacity-80">
                                        {testModeEnabled
                                            ? 'Completa una encuesta para obtener más tokens.'
                                            : 'Contacta al administrador para obtener más tokens.'}
                                    </p>
                                </div>
                                {testModeEnabled && (
                                    <Button variant="outline" size="sm" onClick={openSurveyModal} className="gap-1">
                                        <Sparkles className="w-4 h-4" />
                                        Obtener tokens
                                    </Button>
                                )}
                            </div>
                        )}

                        {error && !insufficientTokens && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {messages.map((message, idx) => {
                            const isLatestAssistant = idx === messages.length - 1 && message.role === 'assistant';
                            const isLastMsg = idx === messages.length - 1 && !isTyping && !isStreaming;
                            const heightForLatest = isLatestAssistant && !isTyping && !isStreaming ? dynamicMinHeight : undefined;

                            if (message.role === 'assistant' && !message.content?.trim() && messages[idx + 1]?.role === 'tool') {
                                return null;
                            }

                            return (
                                <div
                                    key={idx}
                                    className={cn(
                                        "flex flex-col w-full",
                                        message.role === 'tool' && "!mt-0.5 !mb-0.5",
                                        message.role === 'tool' && messages[idx - 1]?.role !== 'tool' && "!mt-3 md:!mt-4",
                                        message.role !== 'tool' && messages[idx - 1]?.role === 'tool' && "!mt-3 md:!mt-4",
                                    )}
                                    ref={idx === messages.length - 1 && message.role === 'user' ? lastUserMessageRef : null}
                                >
                                    {message.document_name && (
                                        <DocumentAttachment documentName={message.document_name} />
                                    )}
                                    {message.role === 'tool' && message.tool_summary ? (
                                        message.tool_summary.artifact ? (
                                            <ArtifactChip
                                                id={message.tool_summary.artifact.id}
                                                title={message.tool_summary.artifact.title}
                                                onClick={() => openArtifact(message.tool_summary!.artifact!.id, message.tool_summary!.artifact!.title)}
                                            />
                                        ) : (
                                            <StaticToolIndicator
                                                label={message.tool_summary.label}
                                                toolName={message.tool_summary.tool_name}
                                            />
                                        )
                                    ) : (
                                        <ChatBubble
                                            role={message.role as "user" | "assistant" | "system"}
                                            content={message.content}
                                            citations={message.citations}
                                            onEdit={(content) => chatInputRef.current?.setValue(content)}
                                            messageIndex={idx}
                                            conversationId={conversationId ?? undefined}
                                            testModeEnabled={testModeEnabled}
                                            artifacts={message.artifacts}
                                            onArtifactClick={openArtifact}
                                            minHeight={heightForLatest}
                                            isLast={isLastMsg && message.role === 'assistant'}
                                        />
                                    )}
                                </div>
                            );
                        })}

                        <StreamingArea
                            ref={streamingAreaRef}
                            onArtifactClick={openArtifact}
                            onStatusComplete={noop}
                            dynamicMinHeight={dynamicMinHeight}
                        />

                        <div ref={scrollRef} />
                    </div>
                </div>

                <div className="px-3 md:px-6 pb-safe md:pb-6 pt-2 mt-auto shrink-0 bg-background/95">
                    <ChatInput
                        ref={chatInputRef}
                        onSendMessage={handleSendMessage}
                        mode={mode}
                        onModeChange={setMode}
                        isNewConversation={conversationId === null}
                    />
                </div>
            </div>

            <ArtifactView
                artifactId={viewArtifactId}
                isOpen={isArtifactViewOpen}
                onClose={handleCloseArtifact}
                title={viewArtifactTitle}
                isMobileFullscreen={isMobileViewport}
                className={cn(
                    "transition-all duration-300 ease-in-out bg-background",
                    isMobileViewport
                        ? (isArtifactViewOpen ? "fixed inset-0 z-[70] w-full" : "hidden")
                        : (isArtifactViewOpen ? "w-1/2" : "hidden w-0")
                )}
            />
        </div>
    )
}
