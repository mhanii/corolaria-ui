/**
 * API Index
 * 
 * Central export point for all API-related modules.
 * Import from this file to access API functionality.
 */

// Configuration
export { API_BASE_URL, API_VERSION, buildApiUrl } from './config';

// Types
export type {
    SemanticSearchRequest,
    SemanticSearchResponse,
    ArticleResult,
    ContextPathElement,
    ErrorResponse,
    ApiState,
    // Chat types
    ChatRequest,
    ChatResponse,
    CitationResponse,
    ConversationResponse,
    ConversationMessageResponse,
    DeleteResponse,
} from './types';

// HTTP Client
export { default as apiClient, get, post, put, del } from './client';

// Services
export { semanticSearch } from './services/searchService';
export {
    sendChatMessage,
    getConversation,
    deleteConversation,
    clearConversation,
} from './services/chatService';
