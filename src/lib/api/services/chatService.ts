/**
 * Chat Service
 * 
 * API service layer for chat-related endpoints.
 * Provides type-safe methods for chat operations.
 */

import { buildApiUrl } from '../config';
import { post, get, del } from '../client';
import {
    ChatRequest,
    ChatResponse,
    ConversationResponse,
    ConversationListResponse,
    DeleteResponse,
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

    // Set defaults
    const chatRequest: ChatRequest = {
        message: request.message.trim(),
        conversation_id: request.conversation_id || null,
        top_k: request.top_k || 5,
        ...(request.collector_type && { collector_type: request.collector_type })
    };

    const endpoint = buildApiUrl('chat');
    return await post<ChatResponse, ChatRequest>(endpoint, chatRequest);
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
