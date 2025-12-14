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
    // Auth types
    LoginRequest,
    TokenResponse,
    UserInfo,
    ConversationSummary,
    ConversationListResponse,
    // Streaming types
    StreamEvent,
    StreamChunkEvent,
    StreamCitationsEvent,
    StreamDoneEvent,
    StreamErrorEvent,
    StreamChatCallbacks,
    // Beta types
    TestModeStatusResponse,
    SurveyQuestionsResponse,
    SurveyRequest,
    SurveyResponse,
    FeedbackType,
    FeedbackRequest,
    FeedbackResponse,
    InsufficientTokensError,
} from './types';

// HTTP Client
export { default as apiClient, get, post, put, del } from './client';

// Services
export { semanticSearch } from './services/searchService';
export {
    sendChatMessage,
    streamChatMessage,
    getConversation,
    deleteConversation,
    clearConversation,
    getConversations,
} from './services/chatService';
export {
    login,
    logout,
    getStoredToken,
    getStoredUser,
    isAuthenticated,
    getCurrentUser,
    updateStoredTokenBalance,
} from './services/authService';
export {
    getBetaStatus,
    getSurveyQuestions,
    submitSurvey,
    submitFeedback,
} from './services/betaService';
