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
        let researchItemCount = 0
        let hadPlanView = false
        let streamMetadata: Record<string, any> = {}

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
                        if (status.phase === 'research_plan_ready') {
                            hadPlanView = true
                        }

                        if (status.phase === 'research_step_done' && status.status === 'completed') {
                            const stepCount = status.results_count ?? status.evidence_count ?? 0;
                            researchItemCount += stepCount;

                            if (!hadPlanView) {
                                setMessages(prev => {
                                    const existingIdx = prev.findIndex(m =>
                                        m.role === 'tool' && m.tool_summary?.tool_name === 'research_step_done'
                                    );
                                    const label = `Buscó ${researchItemCount} artículos`;
                                    if (existingIdx >= 0) {
                                        const updated = [...prev];
                                        updated[existingIdx] = {
                                            ...updated[existingIdx],
                                            tool_summary: { tool_name: 'research_step_done', label }
                                        };
                                        return updated;
                                    }
                                    return [...prev, {
                                        role: 'tool',
                                        content: '',
                                        tool_summary: { tool_name: 'research_step_done', label }
                                    }];
                                });
                            }
                        }

                        if (status.phase === 'generate_start' && hadPlanView && researchItemCount > 0) {
                            setMessages(prev => {
                                const exists = prev.some(m =>
                                    m.role === 'tool' && m.tool_summary?.tool_name === 'research_consolidated'
                                );
                                if (exists) return prev;
                                return [...prev, {
                                    role: 'tool',
                                    content: '',
                                    tool_summary: {
                                        tool_name: 'research_consolidated',
                                        label: `Investigación completada · ${researchItemCount} hallazgos`
                                    }
                                }];
                            });
                        }

                        const isCompletedTool = status.phase === 'tool_end';
                        const isErrorAction = status.phase === 'tool_error';

                        if ((isCompletedTool || isErrorAction) && status.tool !== 'create_legal_document') {
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

                        const assistantMessage: Message = {
                            role: "assistant",
                            content: accumulatedContent,
                            citations: streamCitations,
                        }

                        setMessages(prev => {
                            const existingArtifactIds = new Set(
                                prev.filter(m => m.role === 'tool' && m.tool_summary?.artifact?.id)
                                    .map(m => m.tool_summary!.artifact!.id)
                            );
                            const newArtifactMsgs = artifactToolMessages.filter(
                                m => !existingArtifactIds.has(m.tool_summary!.artifact!.id)
                            );
                            return [...prev, ...newArtifactMsgs, assistantMessage];
                        })

                        setIsStreaming(false)
                        setIsTyping(false)
                        streamingAreaRef.current?.reset()
                        setIsBusy(false)
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
