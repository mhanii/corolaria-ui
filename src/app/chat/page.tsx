"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { ChatBubble } from "@/components/chat/ChatBubble"
import { ChatInput } from "@/components/chat/ChatInput"
import { ChatTools } from "@/components/chat/ChatTools"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { FileText, Search, Scale, AlertCircle, Loader2 } from "lucide-react"
import { sendChatMessage, getConversation, CitationResponse } from "@/lib/api"

interface Message {
    role: "user" | "assistant"
    content: string
    citations?: CitationResponse[]
}

export default function ChatPage() {
    const searchParams = useSearchParams()
    const chatId = searchParams?.get('id')

    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: chatId
                ? `Has abierto el chat: ${chatId}. ¿En qué puedo ayudarte?`
                : "¡Hola! Soy tu asistente legal de Coloraria. ¿En qué puedo ayudarte hoy?",
        }
    ])

    const [isTyping, setIsTyping] = useState(false)
    const [inputMessage, setInputMessage] = useState("")
    const [conversationId, setConversationId] = useState<string | null>(chatId || null)
    const [error, setError] = useState<string | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

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
                top_k: 5
            })

            // Store conversation ID for follow-up messages
            if (response.conversation_id) {
                setConversationId(response.conversation_id)
            }

            // Add assistant response with citations
            const assistantMessage: Message = {
                role: "assistant",
                content: response.response,
                citations: response.citations
            }
            setMessages(prev => [...prev, assistantMessage])

        } catch (err: any) {
            console.error('Chat error:', err)

            // Show error message
            const errorMessage = err?.message || 'Ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.'
            setError(errorMessage)

            // Add an error message from the assistant
            const errorResponse: Message = {
                role: "assistant",
                content: `Lo siento, hubo un problema: ${errorMessage}`
            }
            setMessages(prev => [...prev, errorResponse])
        } finally {
            setIsTyping(false)
        }
    }

    const suggestions = [
        { icon: FileText, text: "Redactar un contrato de arrendamiento" },
        { icon: Search, text: "Buscar jurisprudencia sobre despidos" },
        { icon: Scale, text: "Analizar un documento legal" },
    ]

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden max-w-5xl mx-auto w-full">
            {/* Chat Toolbar */}
            <ChatTools messages={messages} />

            <ScrollArea className="flex-1">
                <div className="space-y-6 px-6 py-6">
                    {/* Error banner */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {messages.length === 1 && !chatId && (
                        <div className="mb-6">
                            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                                ¿Cómo puedo asistirte?
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
                        <div className="flex gap-3 items-center">
                            <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
                                <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
                            </div>
                            <div className="text-sm text-muted-foreground italic">
                                Analizando y buscando fuentes...
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
                />
            </div>
        </div>
    )
}
