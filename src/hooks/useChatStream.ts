import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    streamChatMessage,
    sendChatMessage,
    deleteConversation,
    getConversation,
    CitationResponse,
    ArtifactSummary,
    StreamStatusEvent
} from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useBeta } from "@/context/BetaContext"
import { useSidebar } from "@/context/SidebarContext"
import type { StreamingAreaHandle } from "@/components/chat/StreamingArea"

export interface Message {
    role: "user" | "assistant" | "system" | "tool"
    content: string
    citations?: CitationResponse[]
    document_name?: string | null
    artifacts?: ArtifactSummary[] | null
    tool_summary?: {
        tool_name: string;
        label: string;
        artifact?: { type: string; id: string; title: string };
    }
}

interface UseChatStreamOptions {
    initialConversationId?: string | null
    streamingAreaRef: React.RefObject<StreamingAreaHandle | null>
    onArtifactOpen: (id: string, title: string) => void
    onConversationCreated?: (id: string) => void
}

export function useChatStream({
    initialConversationId = null,
    streamingAreaRef,
    onArtifactOpen,
    onConversationCreated
}: UseChatStreamOptions) {
    const router = useRouter()
    const { user, updateTokenBalance } = useAuth()
    const { testModeEnabled, openSurveyModal, setIsBusy } = useBeta()
    const { triggerRefresh } = useSidebar()

    const [messages, setMessages] = useState<Message[]>([])
    const [conversationId, setConversationId] = useState<string | null>(initialConversationId)
    const [isTyping, setIsTyping] = useState(false)
    const [isStreaming, setIsStreaming] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [insufficientTokens, setInsufficientTokens] = useState(false)
    const [mode, setMode] = useState<'workflow' | 'agent'>('agent')
    const [isLoadingConversation, setIsLoadingConversation] = useState(false)

    const abortControllerRef = useRef<AbortController | null>(null)
    const userRef = useRef(user)
    userRef.current = user

    useEffect(() => {
        if (insufficientTokens && user && user.available_tokens > 0) {
            setInsufficientTokens(false)
            setError(null)
        }
    }, [user, insufficientTokens])

    useEffect(() => {
        return () => {
            setIsBusy(false)
        }
    }, [setIsBusy])

    const loadConversation = useCallback(async (id: string) => {
        try {
            setIsLoadingConversation(true)
            setError(null)
            const conversation = await getConversation(id)

            const loadedMessages: Message[] = conversation.messages.map(msg => ({
                role: msg.role as any,
                content: msg.content,
                citations: msg.citations,
                document_name: msg.document_name,
                artifacts: msg.artifacts,
                tool_summary: msg.tool_summary,
            }))

            if (loadedMessages.length > 0) {
                setMessages(loadedMessages)
                setConversationId(conversation.id)
            }
        } catch (err: any) {
            console.error('Failed to load conversation:', err)
            setError(err?.message || 'No se pudo cargar la conversación')
        } finally {
            setIsLoadingConversation(false)
        }
    }, [])

    const handleDeleteConversation = useCallback(async () => {
        try {
            if (conversationId) {
                await deleteConversation(conversationId)
                triggerRefresh()
            }
            setMessages([])
            setConversationId(null)
            streamingAreaRef.current?.reset()
            setInsufficientTokens(false)
            setError(null)
            setIsTyping(false)
            setIsStreaming(false)
            router.replace('/chat')
        } catch (err) {
            console.error('Failed to delete conversation:', err)
        }
    }, [conversationId, router, triggerRefresh, streamingAreaRef])

    const handleSendMessage = useCallback(async (content: string, file?: File | null) => {
        setError(null)

        const userMessage: Message = {
            role: "user",
            content,
            document_name: file ? file.name : null
        }
        setMessages(prev => [...prev, userMessage])

        setIsTyping(true)
        setIsStreaming(false)
        streamingAreaRef.current?.reset()
        streamingAreaRef.current?.setTyping(true)
        setIsBusy(true)

        let accumulatedContent = ""
        let streamCitations: CitationResponse[] = []
        const streamArtifacts: ArtifactSummary[] = []
        let streamMetadata: Record<string, any> = {}

        const flushAccumulatedText = () => {
            if (accumulatedContent.trim().length > 0) {
                const textToFlush = accumulatedContent;
                setMessages(prev => [...prev, {
                    role: "assistant",
                    content: textToFlush,
                    citations: [...streamCitations],
                }]);
                accumulatedContent = "";
                streamingAreaRef.current?.setContent("");
            }
        };

        try {
            const abortController = await streamChatMessage(
                {
                    message: content,
                    conversation_id: conversationId,
                    file: file,
                    top_k: 5,
                    ...(conversationId === null && { mode })
                },
                {
                    onStatus: (status) => {
                        const isInterruptingPhase = [
                            'tool_start',
                            'research_plan_ready',
                            'context_collection_start',
                            'research_step_done',
                            'generate_start',
                            'research_reflection',
                            'research_agent_start'
                        ].includes(status.phase);

                        if (isInterruptingPhase) {
                            flushAccumulatedText();
                        }

                        const isCompletedTool = status.phase === 'tool_end';
                        const isErrorAction = status.phase === 'tool_error';

                        if ((isCompletedTool || isErrorAction) && !(isCompletedTool && status.tool === 'create_legal_document')) {
                            flushAccumulatedText();
                            setMessages(prev => {
                                const lastMessages = prev.slice(-5);
                                const isDuplicate = lastMessages.some(m =>
                                    m.role === 'tool' &&
                                    m.tool_summary?.tool_name === status.tool &&
                                    m.tool_summary?.label === (status.message || 'Paso completado')
                                );

                                if (isDuplicate) return prev;

                                const toolMessage: Message = {
                                    role: 'tool',
                                    content: '',
                                    tool_summary: {
                                        tool_name: status.tool || 'unknown',
                                        label: isErrorAction
                                            ? `Error: ${status.message || 'No se pudo completar'}`
                                            : (status.message || 'Paso completado')
                                    }
                                };
                                return [...prev, toolMessage];
                            });
                        }

                        streamingAreaRef.current?.setStatus(status)
                    },
                    onChunk: (chunk) => {
                        const isFirstChunk = !accumulatedContent;
                        if (isFirstChunk) {
                            setIsTyping(false)
                            setIsStreaming(true)
                            streamingAreaRef.current?.setTyping(false)
                            streamingAreaRef.current?.setStreaming(true)
                        }

                        accumulatedContent += chunk
                        streamingAreaRef.current?.setContent(accumulatedContent)
                    },
                    onCitations: (citations) => {
                        streamCitations = citations
                        streamingAreaRef.current?.setCitations(citations)
                    },
                    onArtifact: (artifact, autoOpen) => {
                        streamArtifacts.push(artifact)
                        if (autoOpen) {
                            onArtifactOpen(artifact.id, artifact.title)
                        }
                        streamingAreaRef.current?.setArtifacts(streamArtifacts)
                    },
                    onMetadata: (metadata) => {
                        streamMetadata = { ...streamMetadata, ...metadata }

                        if (metadata.document_name) {
                            setMessages(prev => {
                                const newMessages = [...prev]
                                const lastUserIndex = newMessages.findLastIndex(m => m.role === 'user');
                                if (lastUserIndex >= 0) {
                                    newMessages[lastUserIndex] = {
                                        ...newMessages[lastUserIndex],
                                        document_name: metadata.document_name
                                    }
                                }
                                return newMessages
                            })
                        }
                    },
                    onDone: (newConversationId, executionTimeMs) => {
                        console.log(`Stream completed in ${executionTimeMs}ms`)

                        if (newConversationId && !conversationId) {
                            setConversationId(newConversationId)
                            if (onConversationCreated) {
                                onConversationCreated(newConversationId)
                            } else {
                                window.history.replaceState({}, '', `/chat/${newConversationId}`)
                            }
                        }

                        // Finalization: push messages, reset streaming UI, update tokens.
                        // Wrapped in a callback so completeStream can drain first.
                        // updateTokenBalance lives here (not above) because it triggers
                        // AuthContext → BetaContext re-render cascade + API call, which
                        // would starve the rAF interpolation loop if fired immediately.
                        const finalize = () => {
                            if (userRef.current && userRef.current.available_tokens > 0) {
                                updateTokenBalance(userRef.current.available_tokens - 1)
                            }

                            const artifactToolMessages: Message[] = streamArtifacts
                                .map(a => ({
                                    role: 'tool' as const,
                                    content: '',
                                    tool_summary: {
                                        tool_name: 'create_legal_document',
                                        label: 'Documento creado',
                                        artifact: { type: 'document', id: a.id, title: a.title }
                                    }
                                }));

                            setMessages(prev => {
                                const existingArtifactIds = new Set(
                                    prev.filter(m => m.role === 'tool' && m.tool_summary?.artifact?.id)
                                        .map(m => m.tool_summary!.artifact!.id)
                                );
                                const newArtifactMsgs = artifactToolMessages.filter(
                                    m => !existingArtifactIds.has(m.tool_summary!.artifact!.id)
                                );

                                const finalMessages = [...prev, ...newArtifactMsgs];
                                if (accumulatedContent.trim().length > 0 || finalMessages.filter(m => m.role === 'assistant').length === 0) {
                                    finalMessages.push({
                                        role: "assistant",
                                        content: accumulatedContent,
                                        citations: streamCitations,
                                    });
                                }
                                return finalMessages;
                            })

                            setIsStreaming(false)
                            setIsTyping(false)
                            streamingAreaRef.current?.reset()
                            setIsBusy(false)
                        }

                        // Let the interpolator drain its remaining buffer before finalizing
                        if (streamingAreaRef.current?.completeStream) {
                            streamingAreaRef.current.completeStream(finalize)
                        } else {
                            finalize()
                        }
                    },
                    onError: (message, details) => {
                        console.error('Stream error:', message, details)

                        const isTokenError = details?.status === 402
                        if (isTokenError) {
                            setInsufficientTokens(true)

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
                        streamingAreaRef.current?.reset()
                        setIsBusy(false)
                    }
                }
            )

            abortControllerRef.current = abortController

        } catch (err: unknown) {
            console.error('Chat API error:', err)
            try {
                const response = await sendChatMessage({
                    message: content,
                    conversation_id: conversationId,
                    file: file,
                    top_k: 5,
                    ...(conversationId === null && { mode })
                })

                if (response.conversation_id && !conversationId) {
                    setConversationId(response.conversation_id)
                    if (onConversationCreated) {
                        onConversationCreated(response.conversation_id)
                    } else {
                        window.history.replaceState({}, '', `/chat/${response.conversation_id}`)
                    }
                }

                if (response.document_name) {
                    setMessages(prev => {
                        const newMessages = [...prev]
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

                if (userRef.current && userRef.current.available_tokens > 0) {
                    updateTokenBalance(userRef.current.available_tokens - 1)
                }

                const assistantMessage: Message = {
                    role: "assistant",
                    content: response.response,
                    citations: response.citations,
                }
                setMessages(prev => [...prev, assistantMessage])

            } catch (fallbackErr: any) {
                if (fallbackErr?.status === 402) {
                    setInsufficientTokens(true)
                    if (testModeEnabled) {
                        openSurveyModal()
                    }
                }
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
                streamingAreaRef.current?.reset()
                setIsBusy(false)
            }
        }
    }, [conversationId, mode, updateTokenBalance, testModeEnabled, openSurveyModal, setIsBusy, onArtifactOpen, streamingAreaRef, onConversationCreated])

    return {
        messages,
        conversationId,
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
        setInsufficientTokens,
        testModeEnabled,
        openSurveyModal
    }
}
