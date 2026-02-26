/**
 * Chat Service
 * 
 * API service layer for chat-related endpoints.
 * Provides type-safe methods for chat operations.
 */

import { buildApiUrl, API_BASE_URL } from '../config';
import { post, get, del } from '../client';
import {
    ChatRequest,
    ChatResponse,
    ConversationResponse,
    ConversationListResponse,
    DeleteResponse,
    StreamEvent,
    StreamStatusEvent,
    StreamToolEvent,
    StreamChatCallbacks,
    CitationResponse,
} from '../types';

/**
 * Send a chat message and receive AI response with citations
 * 
 * @param request - Chat request with message and optional conversation_id
 * @returns Promise with AI response and citations
 * 
 * @throws {ErrorResponse} If the request fails
 * 
 * @example
 * ```ts
 * const response = await sendChatMessage({
 *   message: '¿Qué dice el artículo 14?',
 *   conversation_id: 'abc123',
 *   top_k: 5
 * });
 * ```
 */
export async function sendChatMessage(
    request: ChatRequest
): Promise<ChatResponse> {
    // Validate request before sending
    if (!request.message || request.message.trim().length === 0) {
        throw {
            error: 'ValidationError',
            message: 'El mensaje no puede estar vacío',
            details: { field: 'message' }
        };
    }

    // Construct FormData
    const formData = new FormData();
    formData.append('message', request.message.trim());

    if (request.conversation_id) {
        formData.append('conversation_id', request.conversation_id);
    }

    formData.append('top_k', (request.top_k || 5).toString());

    if (request.mode) {
        formData.append('mode', request.mode);
    }

    if (request.file) {
        formData.append('file', request.file);
    }

    const endpoint = buildApiUrl('chat');
    // Note: Do NOT set Content-Type header manually for FormData; axios/browser will handle it
    return await post<ChatResponse>(endpoint, formData, {
        headers: {
            'Content-Type': undefined
        }
    });
}

/**
 * Get conversation history by ID
 * 
 * @param conversationId - Unique conversation identifier
 * @returns Promise with conversation history
 * 
 * @throws {ErrorResponse} If the conversation is not found
 * 
 * @example
 * ```ts
 * const conversation = await getConversation('abc123');
 * console.log(conversation.messages);
 * ```
 */
export async function getConversation(
    conversationId: string
): Promise<ConversationResponse> {
    if (!conversationId || conversationId.trim().length === 0) {
        throw {
            error: 'ValidationError',
            message: 'El ID de conversación no puede estar vacío',
            details: { field: 'conversationId' }
        };
    }

    const endpoint = buildApiUrl(`chat/${conversationId}`);
    return await get<ConversationResponse>(endpoint);
}

/**
 * Delete a conversation
 * 
 * @param conversationId - Unique conversation identifier
 * @returns Promise with delete status
 * 
 * @throws {ErrorResponse} If the conversation is not found
 * 
 * @example
 * ```ts
 * const result = await deleteConversation('abc123');
 * if (result.success) {
 *   console.log('Conversation deleted');
 * }
 * ```
 */
export async function deleteConversation(
    conversationId: string
): Promise<DeleteResponse> {
    if (!conversationId || conversationId.trim().length === 0) {
        throw {
            error: 'ValidationError',
            message: 'El ID de conversación no puede estar vacío',
            details: { field: 'conversationId' }
        };
    }

    const endpoint = buildApiUrl(`chat/${conversationId}`);
    return await del<DeleteResponse>(endpoint);
}

/**
 * Clear all messages from a conversation
 * 
 * @param conversationId - Unique conversation identifier
 * @returns Promise with clear status
 * 
 * @throws {ErrorResponse} If the conversation is not found
 * 
 * @example
 * ```ts
 * const result = await clearConversation('abc123');
 * if (result.success) {
 *   console.log('Conversation cleared');
 * }
 * ```
 */
export async function clearConversation(
    conversationId: string
): Promise<DeleteResponse> {
    if (!conversationId || conversationId.trim().length === 0) {
        throw {
            error: 'ValidationError',
            message: 'El ID de conversación no puede estar vacío',
            details: { field: 'conversationId' }
        };
    }

    const endpoint = buildApiUrl(`chat/${conversationId}/clear`);
    return await post<DeleteResponse>(endpoint);
}

/**
 * Get list of all conversations for the authenticated user
 * 
 * @returns Promise with list of conversation summaries
 * 
 * @throws {ErrorResponse} If not authenticated
 * 
 * @example
 * ```ts
 * const result = await getConversations();
 * console.log(result.conversations);
 * ```
 */
export async function getConversations(): Promise<ConversationListResponse> {
    const endpoint = buildApiUrl('conversations');
    return await get<ConversationListResponse>(endpoint);
}

/**
 * Stream a chat message and receive AI response with real-time updates
 * 
 * Uses Server-Sent Events (SSE) for streaming responses.
 * 
 * @param request - Chat request with message and optional conversation_id
 * @param callbacks - Callbacks for handling streaming events
 * @returns AbortController to cancel the stream
 * 
 * @example
 * ```ts
 * const controller = await streamChatMessage(
 *   { message: '¿Qué dice el artículo 14?' },
 *   {
 *     onChunk: (content) => updateMessage(content),
 *     onCitations: (citations) => setCitations(citations),
 *     onDone: (id, time) => console.log(`Done: ${id} in ${time}ms`),
 *     onError: (msg) => console.error(msg)
 *   }
 * );
 * // To cancel: controller.abort();
 * ```
 */
export async function streamChatMessage(
    request: ChatRequest,
    callbacks: StreamChatCallbacks
): Promise<AbortController> {
    // Validate request before sending
    if (!request.message || request.message.trim().length === 0) {
        callbacks.onError?.('El mensaje no puede estar vacío', { field: 'message' });
        return new AbortController();
    }

    // Construct FormData
    const formData = new FormData();
    formData.append('message', request.message.trim());

    if (request.conversation_id) {
        formData.append('conversation_id', request.conversation_id);
    }

    formData.append('top_k', (request.top_k || 5).toString());

    if (request.mode) {
        formData.append('mode', request.mode);
    }

    if (request.file) {
        formData.append('file', request.file);
    }

    const abortController = new AbortController();
    const endpoint = `${API_BASE_URL}/api/v1/chat/stream`;

    // Get token from localStorage
    let token: string | null = null;
    if (typeof window !== 'undefined') {
        token = localStorage.getItem('athen_access_token');
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                // Note: Do NOT set Content-Type; the browser must set it with the boundary for FormData
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: formData,
            signal: abortController.signal
        });

        if (!response.ok) {
            let errorMessage = 'Error en la solicitud';
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail?.message || errorData.message || errorMessage;
            } catch {
                // Ignore JSON parse error
            }
            callbacks.onError?.(errorMessage, { status: response.status });
            return abortController;
        }

        if (!response.body) {
            callbacks.onError?.('Streaming no soportado por el navegador');
            return abortController;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // Process the stream
        const processStream = async () => {
            try {
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });

                    // Process complete SSE events
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // Keep incomplete line in buffer

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data: StreamEvent = JSON.parse(line.slice(6));

                                switch (data.type) {
                                    case 'chunk':
                                        callbacks.onChunk?.(data.content);
                                        break;
                                    case 'citations':
                                        callbacks.onCitations?.(data.citations);
                                        break;
                                    case 'artifact':
                                        // Handle artifact event
                                        if (data.artifact_type === 'document') {
                                            callbacks.onArtifact?.(data.artifact, data.auto_open);
                                        }
                                        break;
                                    case 'metadata':
                                        // Pass the metadata (e.g. { document_name: ... })
                                        callbacks.onMetadata?.(data);
                                        break;
                                    case 'done':
                                        callbacks.onDone?.(data.conversation_id, data.execution_time_ms);
                                        break;
                                    case 'error':
                                        callbacks.onError?.(data.message, data.details);
                                        break;
                                    case 'status':
                                        callbacks.onStatus?.(data as StreamStatusEvent);
                                        break;
                                    case 'tool_start':
                                    case 'tool_end':
                                    case 'tool_error':
                                        callbacks.onStatus?.({
                                            ...(data as StreamToolEvent),
                                            type: 'status',
                                            phase: (data as any).type
                                        } as unknown as StreamStatusEvent);
                                        break;
                                }
                            } catch (parseError) {
                                console.warn('Failed to parse SSE event:', line);
                            }
                        }
                    }
                }
            } catch (error: any) {
                if (error.name === 'AbortError') {
                    // Stream was cancelled, not an error
                    return;
                }
                callbacks.onError?.(error.message || 'Error durante el streaming');
            }
        };

        // Start processing without awaiting (fire and forget)
        processStream();

    } catch (error: any) {
        if (error.name === 'AbortError') {
            // Stream was cancelled, not an error
            return abortController;
        }
        callbacks.onError?.(
            error.message || 'No se pudo conectar con el servidor',
            { originalError: error }
        );
    }

    return abortController;
}
