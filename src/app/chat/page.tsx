"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChatBubble } from "@/components/chat/ChatBubble"
import { ChatInput } from "@/components/chat/ChatInput"
import { ChatTools } from "@/components/chat/ChatTools"
import { DocumentAttachment } from "@/components/chat/DocumentAttachment"
import { ArtifactView } from "@/components/chat/ArtifactView"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Search, Scale, AlertCircle, Coins, Sparkles } from "lucide-react"
import { streamChatMessage, sendChatMessage, deleteConversation, CitationResponse, ArtifactSummary, StreamStatusEvent } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useBeta } from "@/context/BetaContext"
import { useSidebar } from "@/context/SidebarContext"
import { Logo, LogoLoader } from "@/components/ui/Logo"
import { cn } from "@/lib/utils"
import { StatusIndicator } from "@/components/chat/StatusIndicator"

interface Message {
    role: "user" | "assistant"
    content: string
    citations?: CitationResponse[]
    document_name?: string | null
    artifacts?: ArtifactSummary[] | null
}

export default function ChatPage() {
    const router = useRouter()
    const { isAuthenticated, isLoading: isAuthLoading, user, updateTokenBalance } = useAuth()
    const { testModeEnabled, openSurveyModal, setIsBusy } = useBeta()
    const { triggerRefresh, collapse: collapseSidebar } = useSidebar()

    const [messages, setMessages] = useState<Message[]>([])

    const [streamingCitations, setStreamingCitations] = useState<CitationResponse[]>([])
    const [streamingArtifacts, setStreamingArtifacts] = useState<ArtifactSummary[]>([])

    const [streamingStatus, setStreamingStatus] = useState<StreamStatusEvent | null>(null)
    const [isPlanViewActive, setIsPlanViewActive] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const [isStreaming, setIsStreaming] = useState(false)
    const [streamingContent, setStreamingContent] = useState("")
    const [inputMessage, setInputMessage] = useState("")
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [insufficientTokens, setInsufficientTokens] = useState(false)
    const [collectorType, setCollectorType] = useState<'rag' | 'qrag' | 'agent' | 'matrix' | 'research'>('matrix')
    const scrollRef = useRef<HTMLDivElement>(null)
    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const lastUserMessageRef = useRef<HTMLDivElement>(null)
    const abortControllerRef = useRef<AbortController | null>(null)
    const [dynamicMinHeight, setDynamicMinHeight] = useState<string | number>('auto')

    // Artifact state
    const [viewArtifactId, setViewArtifactId] = useState<string | null>(null)
    const [viewArtifactTitle, setViewArtifactTitle] = useState("")
    const [isArtifactViewOpen, setIsArtifactViewOpen] = useState(false)

    // Use raw streaming content directly (no typewriter effect)

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/login')
        }
    }, [isAuthenticated, isAuthLoading, router])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }

        // Calculate dynamic height when typing or streaming starts
        if ((isTyping || isStreaming) && scrollAreaRef.current && lastUserMessageRef.current) {
            // Use requestAnimationFrame to ensure DOM is updated and layout is calculated
            requestAnimationFrame(() => {
                if (scrollAreaRef.current && lastUserMessageRef.current) {
                    const scrollArea = scrollAreaRef.current;
                    // Try to get the actual viewport if it's a Radix ScrollArea
                    const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
                    const containerHeight = (viewport || scrollArea).clientHeight;

                    const messageElement = lastUserMessageRef.current;
                    const messageHeight = messageElement.offsetHeight;

                    const parent = messageElement.parentElement;
                    if (parent) {
                        const style = window.getComputedStyle(parent);
                        const pb = parseFloat(style.paddingBottom);

                        // Measure gap from message margin-top (standard in space-y)
                        const messageStyle = window.getComputedStyle(messageElement);
                        const gap = parseFloat(messageStyle.marginTop) || (window.innerWidth >= 768 ? 24 : 16);

                        // We account for:
                        // 1. Gap between user message and assistant bubble
                        // 2. Gap between assistant bubble and the scroll anchor div (which is a separate child)
                        // 3. Container's padding bottom
                        // 4. Extra top margin (pseudomargin) to not hit the top edge
                        const topPadding = 16;
                        const totalOffset = gap * 2 + pb + topPadding;

                        const calculatedHeight = Math.max(200, containerHeight - messageHeight - totalOffset);
                        setDynamicMinHeight(`${calculatedHeight}px`);
                    }
                }
            });

            // Force scroll to bottom when expansion starts
            // Small timeout to allow state update and DOM repaint
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        } else if (!isTyping && !isStreaming) {
            setDynamicMinHeight('auto');
        }
    }, [messages, isTyping, isStreaming])

    useEffect(() => {
        if (insufficientTokens && user && user.available_tokens > 0) {
            setInsufficientTokens(false)
            setError(null)
        }
    }, [user, insufficientTokens])

    // Cleanup: ensure we release the busy state when leaving the page
    useEffect(() => {
        return () => {
            setIsBusy(false)
        }
    }, [setIsBusy])

    const handleSendMessage = async (content: string, file?: File | null) => {
        // Clear any previous error
        setError(null)

        // Add user message immediately with optimistic document name
        const userMessage: Message = {
            role: "user",
            content,
            document_name: file ? file.name : null
        }
        setMessages(prev => [...prev, userMessage])

        // Start loading state
        setIsTyping(true)
        setIsPlanViewActive(false)
        setStreamingContent("")
        setStreamingStatus(null)
        setIsBusy(true)

        let accumulatedContent = ""
        let streamCitations: CitationResponse[] = []
        const streamArtifacts: ArtifactSummary[] = []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let streamMetadata: Record<string, any> = {}

        try {
            // Try streaming first
            const abortController = await streamChatMessage(
                {
                    message: content,
                    conversation_id: conversationId,
                    file: file,
                    top_k: 5,
                    // Only include collector_type for new conversations
                    ...(conversationId === null && { collector_type: collectorType })
                },
                {
                    onStatus: (status) => {
                        if (status.phase === 'research_plan_ready') {
                            setIsPlanViewActive(true)
                        }
                        setStreamingStatus(status)
                    },
                    onChunk: (chunk) => {
                        // Hide loading skeleton once first chunk arrives
                        if (!accumulatedContent) {
                            setIsTyping(false)
                            setIsStreaming(true)
                        }
                        accumulatedContent += chunk
                        setStreamingContent(accumulatedContent)
                    },
                    onCitations: (citations) => {
                        streamCitations = citations
                        setStreamingCitations(citations)
                    },
                    onArtifact: (artifact, autoOpen) => {
                        streamArtifacts.push(artifact)
                        if (autoOpen) {
                            openArtifact(artifact.id, artifact.title)
                        }
                        setStreamingArtifacts(prev => [...prev, artifact])
                    },
                    onMetadata: (metadata) => {
                        // Merge metadata
                        streamMetadata = { ...streamMetadata, ...metadata }

                        if (metadata.document_name) {
                            // Update the last message (which is the user message we just sent) with confirmed document name
                            setMessages(prev => {
                                const newMessages = [...prev]
                                const lastIndex = newMessages.length - 1
                                // Ensure we are updating a user message
                                if (lastIndex >= 0 && newMessages[lastIndex].role === 'user') {
                                    newMessages[lastIndex] = {
                                        ...newMessages[lastIndex],
                                        document_name: metadata.document_name
                                    }
                                } else {
                                    // Fallback: search backwards for the last user message
                                    const lastUserIndex = newMessages.findLastIndex(m => m.role === 'user');
                                    if (lastUserIndex >= 0) {
                                        newMessages[lastUserIndex] = {
                                            ...newMessages[lastUserIndex],
                                            document_name: metadata.document_name
                                        }
                                    }
                                }
                                return newMessages
                            })
                        }
                    },
                    onDone: (newConversationId, executionTimeMs) => {
                        console.log(`Stream completed in ${executionTimeMs}ms`)

                        // Store conversation ID and silently update URL without reload
                        if (newConversationId && !conversationId) {
                            setConversationId(newConversationId)
                            // Use history API to update URL without triggering a router navigation
                            window.history.replaceState({}, '', `/chat/${newConversationId}`)
                        }

                        // Decrement token balance locally (API already consumed the token)
                        if (user && user.available_tokens > 0) {
                            updateTokenBalance(user.available_tokens - 1)
                        }

                        // Add completed assistant message
                        const assistantMessage: Message = {
                            role: "assistant",
                            content: accumulatedContent,
                            citations: streamCitations,
                            artifacts: streamMetadata.created_documents || streamArtifacts
                        }
                        setMessages(prev => [...prev, assistantMessage])
                        setIsStreaming(false)
                        setStreamingContent("")
                        setStreamingCitations([])
                        setStreamingArtifacts([])
                        setStreamingStatus(null)
                        setIsBusy(false)
                    },
                    onError: (message, details) => {
                        console.error('Stream error:', message, details)

                        // Check for insufficient tokens (402 error)
                        const isTokenError = details?.status === 402

                        if (isTokenError) {
                            setInsufficientTokens(true)

                            // In test mode, show survey modal for token refill
                            if (testModeEnabled) {
                                openSurveyModal()
                                setError('Te has quedado sin tokens. Completa la encuesta para obtener más.')
                            } else {
                                setError('No tienes tokens disponibles. Contacta al administrador para obtener más.')
                            }

                            const errorResponse: Message = {
                                role: "assistant",
                                content: testModeEnabled
                                    ? "Has agotado tus tokens de uso. Completa la encuesta para obtener 10 tokens adicionales."
                                    : "Lo siento, has agotado tus tokens de uso. Por favor, contacta al administrador para obtener más tokens y continuar usando el servicio."
                            }
                            setMessages(prev => [...prev, errorResponse])
                        } else {
                            setError(message)
                            const errorResponse: Message = {
                                role: "assistant",
                                content: `Lo siento, hubo un problema: ${message}`
                            }
                            setMessages(prev => [...prev, errorResponse])
                        }

                        setIsTyping(false)
                        setIsStreaming(false)
                        setStreamingContent("")
                        setStreamingCitations([])
                        setStreamingArtifacts([])
                        setStreamingStatus(null)
                        setIsBusy(false)
                    }
                }
            )

            abortControllerRef.current = abortController

        } catch (err: unknown) {
            console.error('Chat API error:', err)

            // Fallback to non-streaming
            try {
                const response = await sendChatMessage({
                    message: content,
                    conversation_id: conversationId,
                    file: file,
                    top_k: 5,
                    ...(conversationId === null && { collector_type: collectorType })
                })

                if (response.conversation_id && !conversationId) {
                    setConversationId(response.conversation_id)
                    router.replace(`/chat/${response.conversation_id}`, { scroll: false })
                }

                if (response.document_name) {
                    // Update the last user message with confirmed document name
                    setMessages(prev => {
                        const newMessages = [...prev]
                        // Identify the message we just sent. It should be the last one if we haven't added assistant response yet.
                        // Actually, we added user message at start. So it is the last message in `prev` before we add assistant message.
                        const lastUserIndex = newMessages.findLastIndex(m => m.role === 'user');
                        if (lastUserIndex >= 0) {
                            newMessages[lastUserIndex] = {
                                ...newMessages[lastUserIndex],
                                document_name: response.document_name
                            }
                        }
                        return newMessages
                    })
                }


                if (user && user.available_tokens > 0) {
                    updateTokenBalance(user.available_tokens - 1)
                }

                const assistantMessage: Message = {
                    role: "assistant",
                    content: response.response,
                    citations: response.citations,
                    // Note: non-streaming also handled if we update response types later
                }
                setMessages(prev => [...prev, assistantMessage])

            } catch (fallbackErr: unknown) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const error = fallbackErr as any;
                // Check for 402 error in fallback
                if (error?.status === 402) {
                    setInsufficientTokens(true)
                    if (testModeEnabled) {
                        openSurveyModal()
                    }
                }

                const errorMessage = error?.message || 'No se pudo conectar con el servidor. Por favor, intenta de nuevo.'
                setError(errorMessage)

                const errorResponse: Message = {
                    role: "assistant",
                    content: `Lo siento, hubo un problema: ${errorMessage}`
                }
                setMessages(prev => [...prev, errorResponse])
                setStreamingStatus(null)
            } finally {
                setIsTyping(false)
                setIsStreaming(false)
                setStreamingContent("")
                setStreamingCitations([])
                setStreamingArtifacts([])
                setStreamingStatus(null)
                setIsBusy(false)
            }
        }
    }

    const handleDeleteConversation = async () => {
        try {
            if (conversationId) {
                await deleteConversation(conversationId)
                triggerRefresh() // Refresh sidebar list immediately
            }

            // Allow clearing even if not persisted yet (just clears UI)
            setMessages([])
            setConversationId(null)
            setInputMessage("")
            setStreamingContent("")
            setInsufficientTokens(false)
            setError(null)
            // Reset URL silently
            window.history.replaceState({}, '', '/chat')

        } catch (err) {
            console.error('Failed to delete conversation:', err)
            // Error handling could be improved but console is fine for now
        }
    }

    // Handle refill button click
    const handleRefillClick = () => {
        if (testModeEnabled) {
            openSurveyModal()
        }
    }

    const openArtifact = (id: string, title: string) => {
        collapseSidebar() // Auto collapse desktop sidebar (or close mobile)
        setViewArtifactId(id)
        setViewArtifactTitle(title)
        setIsArtifactViewOpen(true)
    }

    const suggestions = [
        { icon: Search, text: "¿Qué dice la ley sobre el despido improcedente?" },
        { icon: Scale, text: "Explícame los derechos de los inquilinos" },
        { icon: FileText, text: "¿Cuál es la diferencia entre denuncia y querella?" },
    ]

    // Show loading while checking auth
    if (isAuthLoading) {
        return (
            <div className="flex flex-col h-[calc(100vh-4rem)] items-center justify-center">
                <LogoLoader />
            </div>
        )
    }

    // Don't render if not authenticated (redirect will happen)
    if (!isAuthenticated) {
        return null
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden w-full">
            <div className={cn(
                "flex flex-col h-full transition-all duration-300 ease-in-out",
                isArtifactViewOpen ? "w-1/2 border-r border-border" : "w-full max-w-5xl mx-auto"
            )}>
                {messages.length > 0 && (
                    <ChatTools
                        messages={messages}
                        onDelete={handleDeleteConversation}
                    />
                )}

                {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center w-full pb-20">
                        <div className="w-full space-y-8 px-4 md:px-6 flex flex-col items-center">
                            <div className="text-center space-y-6 mb-8">


                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient bg-300% leading-tight px-4">
                                    ¿En qué puedo ayudarte hoy?
                                </h1>
                            </div>

                            <div className="w-full">
                                <ChatInput
                                    onSendMessage={handleSendMessage}
                                    message={inputMessage}
                                    setMessage={setInputMessage}
                                    collectorType={collectorType}
                                    onCollectorTypeChange={setCollectorType}
                                    isNewConversation={true}
                                />
                            </div>

                            {/* Desktop: Grid layout */}
                            <div className="hidden md:grid md:grid-cols-3 gap-3 w-full">
                                {suggestions.map((suggestion, idx) => (
                                    <Card
                                        key={idx}
                                        className="p-4 cursor-pointer hover:shadow-md hover:border-accent/50 transition-all duration-300 group bg-card/50"
                                        onClick={() => handleSendMessage(suggestion.text)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors flex-shrink-0">
                                                <suggestion.icon className="w-5 h-5 text-accent" />
                                            </div>
                                            <p className="text-sm font-medium text-foreground leading-tight">
                                                {suggestion.text}
                                            </p>
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            {/* Mobile: 2+1 grid layout with consistent box sizes */}
                            <div className="md:hidden flex flex-col gap-2 w-full">
                                <div className="grid grid-cols-2 gap-2">
                                    {suggestions.slice(0, 2).map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            className="flex items-center gap-2 px-3 py-2.5 h-14 rounded-lg border border-border bg-card/50 hover:bg-accent/10 hover:border-accent/50 transition-all text-left"
                                            onClick={() => handleSendMessage(suggestion.text)}
                                        >
                                            <suggestion.icon className="w-4 h-4 text-accent flex-shrink-0" />
                                            <span className="text-xs font-medium text-foreground line-clamp-2">{suggestion.text}</span>
                                        </button>
                                    ))}
                                </div>
                                {/* Centered third suggestion */}
                                <div className="flex justify-center">
                                    {(() => {
                                        const ThirdIcon = suggestions[2].icon;
                                        return (
                                            <button
                                                className="flex items-center gap-2 px-3 py-2.5 h-14 w-1/2 rounded-lg border border-border bg-card/50 hover:bg-accent/10 hover:border-accent/50 transition-all text-left justify-center"
                                                onClick={() => handleSendMessage(suggestions[2].text)}
                                            >
                                                <ThirdIcon className="w-4 h-4 text-accent flex-shrink-0" />
                                                <span className="text-xs font-medium text-foreground line-clamp-2">{suggestions[2].text}</span>
                                            </button>
                                        );
                                    })()}
                                </div>
                            </div>

                        </div>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="flex-1" ref={scrollAreaRef}>
                            <div className="space-y-4 md:space-y-6 px-3 md:px-6 py-4 md:py-6">
                                {/* Insufficient tokens banner */}
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
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleRefillClick}
                                                className="gap-1"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                                Obtener tokens
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {/* Error banner */}
                                {error && !insufficientTokens && (
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {messages.map((message, idx) => {
                                    return (
                                        <div
                                            key={idx}
                                            className="flex flex-col w-full"
                                            ref={idx === messages.length - 1 && message.role === 'user' ? lastUserMessageRef : null}
                                        >
                                            {message.document_name && (
                                                <DocumentAttachment documentName={message.document_name} />
                                            )}
                                            <ChatBubble
                                                role={message.role}
                                                content={message.content}
                                                citations={message.citations}
                                                onEdit={setInputMessage}
                                                messageIndex={idx}
                                                conversationId={conversationId ?? undefined}
                                                testModeEnabled={testModeEnabled}
                                                artifacts={message.artifacts}
                                                onArtifactClick={openArtifact}
                                            />
                                        </div>
                                    );
                                })}

                                {(isTyping || isStreaming) && (
                                    <div className="flex flex-col w-full">
                                        <ChatBubble
                                            role="assistant"
                                            content={streamingContent}
                                            citations={streamingCitations}
                                            isStreaming={isStreaming}
                                            isTyping={isTyping && !isStreaming}
                                            artifacts={streamingArtifacts}
                                            onArtifactClick={openArtifact}
                                            status={streamingStatus}
                                            onComplete={() => setIsPlanViewActive(false)}
                                            minHeight={dynamicMinHeight}
                                        />
                                    </div>
                                )}

                                {/* Scroll anchor */}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>

                        <div className="px-3 md:px-6 pb-4 md:pb-6 pt-2 mt-auto shrink-0 animate-chat-descend">
                            <ChatInput
                                onSendMessage={handleSendMessage}
                                message={inputMessage}
                                setMessage={setInputMessage}
                                collectorType={collectorType}
                                onCollectorTypeChange={setCollectorType}
                                isNewConversation={conversationId === null}
                            />
                        </div>
                    </>
                )}

                {/* Closing the chat column div */}
            </div>

            <ArtifactView
                artifactId={viewArtifactId}
                isOpen={isArtifactViewOpen}
                onClose={() => setIsArtifactViewOpen(false)}
                title={viewArtifactTitle}
                className={cn(
                    "w-1/2 transition-all duration-300 ease-in-out bg-background",
                    !isArtifactViewOpen && "hidden w-0"
                )}
            />
        </div>
    )
}
