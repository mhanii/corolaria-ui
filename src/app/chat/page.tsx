"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ChatBubble } from "@/components/chat/ChatBubble"
import { ChatInput } from "@/components/chat/ChatInput"
import { ChatTools } from "@/components/chat/ChatTools"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { FileText, Search, Scale, AlertCircle, Loader2, Coins } from "lucide-react"
import { sendChatMessage, getConversation, CitationResponse } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

interface Message {
    role: "user" | "assistant"
    content: string
    citations?: CitationResponse[]
}

export default function ChatPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const chatId = searchParams?.get('id')
    const { isAuthenticated, isLoading: isAuthLoading, user, updateTokenBalance } = useAuth()

    const [messages, setMessages] = useState<Message[]>([])

    const [isTyping, setIsTyping] = useState(false)
    const [inputMessage, setInputMessage] = useState("")
    const [conversationId, setConversationId] = useState<string | null>(chatId || null)
    const [error, setError] = useState<string | null>(null)
    const [insufficientTokens, setInsufficientTokens] = useState(false)
    const [collectorType, setCollectorType] = useState<'rag' | 'qrag' | 'pronto'>('rag')
    const scrollRef = useRef<HTMLDivElement>(null)

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

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

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

        try {
            // Call the real API
            const response = await sendChatMessage({
                message: content,
                conversation_id: conversationId,
                top_k: 5,
                // Only include collector_type for new conversations
                ...(conversationId === null && { collector_type: collectorType })
            })

            // Store conversation ID for follow-up messages
            if (response.conversation_id) {
                setConversationId(response.conversation_id)
            }

            // Decrement token balance locally (API already consumed the token)
            if (user && user.available_tokens > 0) {
                updateTokenBalance(user.available_tokens - 1)
            }

            // Add assistant response with citations
            const assistantMessage: Message = {
                role: "assistant",
                content: response.response,
                citations: response.citations
            }
            setMessages(prev => [...prev, assistantMessage])
        } catch (err: any) {
            console.error('Chat API error:', err)

            // Check for insufficient tokens (402 error)
            const isInsufficientTokens = err?.error === 'HttpError402' ||
                err?.details?.status === 402 ||
                err?.error === 'InsufficientTokens'

            if (isInsufficientTokens) {
                setInsufficientTokens(true)
                setError('No tienes tokens disponibles. Contacta al administrador para obtener más.')
                // Add specific message for token exhaustion
                const errorResponse: Message = {
                    role: "assistant",
                    content: "Lo siento, has agotado tus tokens de uso. Por favor, contacta al administrador para obtener más tokens y continuar usando el servicio."
                }
                setMessages(prev => [...prev, errorResponse])
            } else {
                // Display generic error to user
                const errorMessage = err?.message || 'No se pudo conectar con el servidor. Por favor, intenta de nuevo.'
                setError(errorMessage)

                // Also add error as an assistant message
                const errorResponse: Message = {
                    role: "assistant",
                    content: `Lo siento, hubo un problema: ${errorMessage}`
                }
                setMessages(prev => [...prev, errorResponse])
            }
        } finally {
            setIsTyping(false)
        }
    }

    const suggestions = [
        { icon: FileText, text: "Redactar un contrato de arrendamiento" },
        { icon: Search, text: "Buscar jurisprudencia sobre despidos" },
        { icon: Scale, text: "Analizar un documento legal" },
    ]

    // Show loading while checking auth
    if (isAuthLoading) {
        return (
            <div className="flex flex-col h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
                <p className="mt-4 text-muted-foreground">Cargando...</p>
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
            <ChatTools messages={messages} />

            <ScrollArea className="flex-1">
                <div className="space-y-6 px-6 py-6">
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
                            <h1 className="text-4xl font-display font-bold text-accent mb-3">
                                ¡Hola! Soy tu asistente legal de Coloraria
                            </h1>
                            <h2 className="text-2xl font-display font-semibold text-foreground mb-2">
                                ¿En qué puedo ayudarte hoy?
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                Selecciona una sugerencia o escribe tu consulta legal
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {suggestions.map((suggestion, idx) => (
                                    <Card
                                        key={idx}
                                        className="p-4 cursor-pointer hover:shadow-medium hover:border-accent transition-smooth group"
                                        onClick={() => handleSendMessage(suggestion.text)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-smooth">
                                                <suggestion.icon className="w-5 h-5 text-accent" />
                                            </div>
                                            <p className="text-sm font-medium text-foreground flex-1">
                                                {suggestion.text}
                                            </p>
                                        </div>
                                    </Card>
                                ))}
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
                            <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                                <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
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

                    {/* Scroll anchor */}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            <div className="p-6 pt-2 mt-auto shrink-0">
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
