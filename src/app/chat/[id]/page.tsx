"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChatBubble } from "@/components/chat/ChatBubble"
import { ChatInput } from "@/components/chat/ChatInput"
import { ChatTools } from "@/components/chat/ChatTools"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { FileText, Search, Scale, AlertCircle, Loader2, Coins } from "lucide-react"
import { streamChatMessage, sendChatMessage, deleteConversation, getConversation, CitationResponse } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useTypewriter } from "@/hooks/useTypewriter"
import { useSidebar } from "@/context/SidebarContext"
import { Logo, LogoLoader } from "@/components/ui/Logo"

interface Message {
    role: "user" | "assistant"
    content: string
    citations?: CitationResponse[]
}

export default function ChatWithIdPage() {
    const router = useRouter()
    const params = useParams()
    const chatId = params?.id as string | undefined
    const { isAuthenticated, isLoading: isAuthLoading, user, updateTokenBalance } = useAuth()
    const { triggerRefresh } = useSidebar()

    const [messages, setMessages] = useState<Message[]>([])

    const [isTyping, setIsTyping] = useState(false)
    const [isStreaming, setIsStreaming] = useState(false)
    const [streamingContent, setStreamingContent] = useState("")
    const [inputMessage, setInputMessage] = useState("")
    const [conversationId, setConversationId] = useState<string | null>(chatId || null)
    const [error, setError] = useState<string | null>(null)
    const [insufficientTokens, setInsufficientTokens] = useState(false)
    const [collectorType, setCollectorType] = useState<'rag' | 'qrag' | 'agent'>('rag')
    const scrollRef = useRef<HTMLDivElement>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    // Smooth typewriter effect for streaming content
    // Use raw streaming content directly (no typewriter effect)

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
    }, [chatId])

    // Auto-scroll to bottom when new messages arrive or streaming content updates
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, streamingContent])

    const loadConversation = async (id: string) => {
        try {
            setIsTyping(true)
            setError(null)
            const conversation = await getConversation(id)

            // Convert conversation messages to our Message format
            const loadedMessages: Message[] = conversation.messages.map(msg => ({
                role: msg.role,
                content: msg.content,
                citations: msg.citations
            }))

            if (loadedMessages.length > 0) {
                setMessages(loadedMessages)
                setConversationId(conversation.id)
            }
        } catch (err: any) {
            console.error('Failed to load conversation:', err)
            // Keep the default greeting if conversation fails to load
            setError(err?.message || 'No se pudo cargar la conversación')
        } finally {
            setIsTyping(false)
        }
    }

    const handleSendMessage = async (content: string) => {
        // Clear any previous error
        setError(null)

        // Add user message immediately
        const userMessage: Message = { role: "user", content }
        setMessages(prev => [...prev, userMessage])

        // Start loading state
        setIsTyping(true)
        setStreamingContent("")

        let accumulatedContent = ""
        let streamCitations: CitationResponse[] = []
        let streamFailed = false

        try {
            // Try streaming first
            const abortController = await streamChatMessage(
                {
                    message: content,
                    conversation_id: conversationId,
                    top_k: 5,
                    // Only include collector_type for new conversations
                    ...(conversationId === null && { collector_type: collectorType })
                },
                {
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
                    },
                    onDone: (newConversationId, executionTimeMs) => {
                        console.log(`Stream completed in ${executionTimeMs}ms`)

                        // Store conversation ID for follow-up messages
                        if (newConversationId) {
                            setConversationId(newConversationId)
                        }

                        // Decrement token balance locally (API already consumed the token)
                        if (user && user.available_tokens > 0) {
                            updateTokenBalance(user.available_tokens - 1)
                        }

                        // Add completed assistant message
                        const assistantMessage: Message = {
                            role: "assistant",
                            content: accumulatedContent,
                            citations: streamCitations
                        }
                        setMessages(prev => [...prev, assistantMessage])
                        setIsStreaming(false)
                        setStreamingContent("")
                    },
                    onError: (message, details) => {
                        console.error('Stream error:', message, details)
                        streamFailed = true

                        // Check for insufficient tokens (402 error)
                        const isTokenError = details?.status === 402

                        if (isTokenError) {
                            setInsufficientTokens(true)
                            setError('No tienes tokens disponibles. Contacta al administrador para obtener más.')
                            const errorResponse: Message = {
                                role: "assistant",
                                content: "Lo siento, has agotado tus tokens de uso. Por favor, contacta al administrador para obtener más tokens y continuar usando el servicio."
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
                    }
                }
            )

            abortControllerRef.current = abortController

        } catch (err: any) {
            console.error('Chat API error:', err)
            streamFailed = true

            // Fallback to non-streaming
            try {
                const response = await sendChatMessage({
                    message: content,
                    conversation_id: conversationId,
                    top_k: 5,
                    ...(conversationId === null && { collector_type: collectorType })
                })

                if (response.conversation_id) {
                    setConversationId(response.conversation_id)
                }

                if (user && user.available_tokens > 0) {
                    updateTokenBalance(user.available_tokens - 1)
                }

                const assistantMessage: Message = {
                    role: "assistant",
                    content: response.response,
                    citations: response.citations
                }
                setMessages(prev => [...prev, assistantMessage])
            } catch (fallbackErr: any) {
                const errorMessage = fallbackErr?.message || 'No se pudo conectar con el servidor. Por favor, intenta de nuevo.'
                setError(errorMessage)

                const errorResponse: Message = {
                    role: "assistant",
                    content: `Lo siento, hubo un problema: ${errorMessage}`
                }
                setMessages(prev => [...prev, errorResponse])
            } finally {
                setIsTyping(false)
                setIsStreaming(false)
                setStreamingContent("")
            }
        }
    }

    const handleDeleteConversation = async () => {
        try {
            if (conversationId) {
                await deleteConversation(conversationId)
                triggerRefresh() // Refresh sidebar list immediately
                // Redirect to new chat
                router.replace('/chat')
            }
        } catch (err) {
            console.error('Failed to delete conversation:', err)
        }
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
        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden max-w-5xl mx-auto w-full">
            {/* Chat Toolbar */}
            <ChatTools messages={messages} onDelete={handleDeleteConversation} />

            <ScrollArea className="flex-1">
                <div className="space-y-4 md:space-y-6 px-3 md:px-6 py-4 md:py-6">
                    {/* Insufficient tokens banner */}
                    {insufficientTokens && (
                        <div className="flex items-center gap-2 p-4 rounded-lg bg-accent/10 border border-accent/20 text-accent">
                            <Coins className="w-5 h-5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium">Sin tokens disponibles</p>
                                <p className="text-sm opacity-80">Contacta al administrador para obtener más tokens.</p>
                            </div>
                        </div>
                    )}

                    {/* Error banner */}
                    {error && !insufficientTokens && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Welcome message and suggestions - show only when no messages */}
                    {messages.length === 0 && !chatId && (
                        <div className="mb-6">
                            <h1 className="text-2xl md:text-4xl font-display font-bold text-accent mb-2 md:mb-3">
                                ¡Hola! Soy tu asistente legal de Athen
                            </h1>
                            <h2 className="text-xl md:text-2xl font-display font-semibold text-foreground mb-2">
                                ¿En qué puedo ayudarte hoy?
                            </h2>
                            <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
                                Selecciona una sugerencia o escribe tu consulta legal
                            </p>
                            {/* Desktop: Grid layout */}
                            <div className="hidden md:grid md:grid-cols-3 md:gap-3">
                                {suggestions.map((suggestion, idx) => (
                                    <Card
                                        key={idx}
                                        className="p-4 cursor-pointer hover:shadow-medium hover:border-accent transition-smooth group"
                                        onClick={() => handleSendMessage(suggestion.text)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-smooth flex-shrink-0">
                                                <suggestion.icon className="w-5 h-5 text-accent" />
                                            </div>
                                            <p className="text-sm font-medium text-foreground">
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
                    )}

                    {messages.map((message, idx) => (
                        <ChatBubble
                            key={idx}
                            role={message.role}
                            content={message.content}
                            citations={message.citations}
                            onEdit={setInputMessage}
                        />
                    ))}

                    {isTyping && (
                        <div className="flex gap-3 items-start">
                            <div className="flex-shrink-0">
                                <Logo size="md" animate />
                            </div>
                            <div className="flex-1 space-y-3 mt-1">
                                {/* Text with glowing shimmer effect */}
                                <p className="text-sm italic font-medium bg-gradient-to-r from-accent via-accent/60 to-accent bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                                    Analizando y buscando fuentes...
                                </p>
                                {/* Skeleton shimmer lines */}
                                <div className="space-y-2">
                                    <div className="h-4 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted rounded animate-shimmer bg-[length:200%_100%]" style={{ width: '90%' }}></div>
                                    <div className="h-4 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted rounded animate-shimmer bg-[length:200%_100%]" style={{ width: '75%' }}></div>
                                    <div className="h-4 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted rounded animate-shimmer bg-[length:200%_100%]" style={{ width: '85%' }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Streaming content display */}
                    {isStreaming && (
                        <ChatBubble
                            role="assistant"
                            content={streamingContent}
                            isStreaming={true}
                        />
                    )}

                    {/* Scroll anchor */}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            <div className="px-3 md:px-6 pb-4 md:pb-6 pt-2 mt-auto shrink-0">
                <ChatInput
                    onSendMessage={handleSendMessage}
                    message={inputMessage}
                    setMessage={setInputMessage}
                    collectorType={collectorType}
                    onCollectorTypeChange={setCollectorType}
                    isNewConversation={conversationId === null}
                />
            </div>
        </div>
    )
}
