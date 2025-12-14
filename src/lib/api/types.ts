/**
 * API Type Definitions
 * 
 * TypeScript interfaces matching the Python Pydantic schemas from the backend.
 * These ensure type safety when communicating with the API.
 */

/**
 * Request schema for semantic search endpoint
 */
export interface SemanticSearchRequest {
    /** The search query text */
    query: string;

    /** Number of results to return (1-100) */
    top_k?: number;

    /** Vector index to use for search */
    index_name?: string;
}

/**
 * Context path element in the article hierarchy
 */
export interface ContextPathElement {
    /** Type of structural element (e.g., "Título", "Capítulo") */
    type: string;

    /** Name/identifier of the element */
    name: string;
}

/**
 * Individual article result from semantic search
 */
export interface ArticleResult {
    /** Unique identifier for the article */
    article_id: string;

    /** Article number (e.g., "Artículo 14") */
    article_number: string;

    /** Full text content of the article */
    article_text: string;

    /** Human-readable hierarchy path (e.g., "Título I, Capítulo Segundo") */
    article_path?: string;

    /** Similarity score (0-1, higher is better) */
    score: number;

    /** Title of the regulation containing this article */
    normativa_title: string;

    /** Unique identifier for the regulation */
    normativa_id: string;

    /** Publication date (ISO format or YYYYMMDD) */
    fecha_publicacion?: string | null;

    /** Validity start date (ISO format or YYYYMMDD) */
    fecha_vigencia?: string | null;

    /** Expiration date if superseded (ISO format or YYYYMMDD) */
    fecha_caducidad?: string | null;

    /** Node ID of the previous (older) version, if any */
    previous_version_id?: string | null;

    /** Node ID of the next (newer) version, if any */
    next_version_id?: string | null;

    /** Hierarchical context (e.g., Book > Title > Chapter) */
    context_path: ContextPathElement[];

    /** Additional metadata about the result */
    metadata: Record<string, any>;
}

/**
 * Response schema for semantic search endpoint
 */
export interface SemanticSearchResponse {
    /** The original query */
    query: string;

    /** List of matching articles */
    results: ArticleResult[];

    /** Total number of results returned */
    total_results: number;

    /** Search strategy used */
    strategy_used: string;

    /** Query execution time in milliseconds */
    execution_time_ms: number;
}

/**
 * Error response from the API
 */
export interface ErrorResponse {
    /** Error type or category */
    error: string;

    /** Human-readable error message */
    message: string;

    /** Additional error details */
    details?: Record<string, any>;
}

/**
 * API request state for UI components
 */
export interface ApiState<T> {
    /** Data returned from the API */
    data: T | null;

    /** Loading state */
    loading: boolean;

    /** Error message if request failed */
    error: string | null;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
    /** Response data */
    data: T;

    /** HTTP status code */
    status: number;

    /** Success flag */
    success: boolean;
}

/**
 * Detailed response for single article retrieval by node ID
 */
export interface ArticleDetailResponse {
    /** Unique node identifier */
    node_id: string;

    /** Article number (e.g., "Artículo 14") */
    article_number: string;

    /** Full text content of the article */
    article_text: string;

    /** Human-readable hierarchy path */
    article_path: string;

    /** Title of the regulation */
    normativa_title: string;

    /** Unique identifier for the regulation */
    normativa_id: string;

    /** Publication date */
    fecha_publicacion?: string | null;

    /** Validity start date */
    fecha_vigencia?: string | null;

    /** Expiration date if superseded */
    fecha_caducidad?: string | null;

    /** Node ID of previous version */
    previous_version_id?: string | null;

    /** Node ID of next version */
    next_version_id?: string | null;

    /** Hierarchical context */
    context_path: ContextPathElement[];
}

/**
 * Information about a single article version
 */
export interface ArticleVersionInfo {
    /** Unique node identifier for this version */
    node_id: string;

    /** Article number */
    article_number: string;

    /** Validity start date */
    fecha_vigencia?: string | null;

    /** Expiration date */
    fecha_caducidad?: string | null;

    /** Whether this is the current/latest version */
    is_current_version: boolean;

    /** Full text of this version */
    article_text: string;
}

/**
 * Response containing all versions of an article
 */
export interface ArticleVersionsResponse {
    /** Article number (e.g., "Artículo 14") */
    article_number: string;

    /** Title of the regulation */
    normativa_title: string;

    /** All versions ordered chronologically */
    versions: ArticleVersionInfo[];

    /** Total number of versions */
    total_versions: number;
}

/**
 * Request schema for chat endpoint
 */
export interface ChatRequest {
    /** The user's message or question */
    message: string;

    /** Optional conversation ID for multi-turn chat */
    conversation_id?: string | null;

    /** Number of sources to retrieve (1-20) */
    top_k?: number;

    /** Context retrieval strategy: 'rag', 'qrag', or 'agent' */
    collector_type?: 'rag' | 'qrag' | 'agent';
}

/**
 * Schema for citation in response
 */
export interface CitationResponse {
    /** Unique citation identifier (e.g., "art_14_ce_abc123") */
    cite_key: string;

    /** Text shown in the citation (e.g., "Artículo 14") */
    display_text: string;

    /** Unique article identifier */
    article_id: string;

    /** Article number (e.g., 'Artículo 14') */
    article_number: string;

    /** Title of the regulation */
    normativa_title: string;

    /** Hierarchical path (e.g., 'Título I') */
    article_path: string;

    /** Retrieval similarity score */
    score: number;
}

/**
 * Response schema for chat endpoint
 */
export interface ChatResponse {
    /** AI assistant's response with inline citations */
    response: string;

    /** Conversation ID for follow-up messages */
    conversation_id: string;

    /** List of citations referenced in the response */
    citations: CitationResponse[];

    /** Total processing time in milliseconds */
    execution_time_ms: number;
}

/**
 * Schema for a message in conversation history
 */
export interface ConversationMessageResponse {
    /** Message role: 'user' or 'assistant' */
    role: 'user' | 'assistant';

    /** Message content */
    content: string;

    /** Citations for assistant messages */
    citations: CitationResponse[];

    /** Message timestamp (ISO format) */
    timestamp: string;
}

/**
 * Response schema for conversation retrieval
 */
export interface ConversationResponse {
    /** Conversation ID */
    id: string;

    /** List of messages in the conversation */
    messages: ConversationMessageResponse[];

    /** Conversation creation time (ISO format) */
    created_at: string;

    /** Last update time (ISO format) */
    updated_at: string;
}

/**
 * Response schema for delete operations
 */
export interface DeleteResponse {
    /** Whether the operation succeeded */
    success: boolean;

    /** Status message */
    message: string;
}

// ============ Authentication Types ============

/**
 * Request schema for login endpoint
 */
export interface LoginRequest {
    /** Username (min 3 chars) */
    username: string;

    /** Password (min 6 chars) */
    password: string;
}

/**
 * Response schema for successful login
 */
export interface TokenResponse {
    /** JWT access token */
    access_token: string;

    /** Token type (always "bearer") */
    token_type: string;

    /** Token expiry in seconds */
    expires_in: number;

    /** User ID */
    user_id: string;

    /** Username */
    username: string;

    /** Remaining API call tokens */
    available_tokens: number;
}

/**
 * Response schema for user info
 */
export interface UserInfo {
    /** User ID */
    id: string;

    /** Username */
    username: string;

    /** Remaining API call tokens */
    available_tokens: number;

    /** Account creation date (ISO format) */
    created_at: string;
}

/**
 * Summary of a conversation for listing
 */
export interface ConversationSummary {
    /** Conversation ID */
    id: string;

    /** Creation timestamp (ISO format) */
    created_at: string;

    /** Last update timestamp (ISO format) */
    updated_at: string;

    /** Number of messages in conversation */
    message_count: number;

    /** Preview of first message */
    preview: string;
}

/**
 * Response for conversation list endpoint
 */
export interface ConversationListResponse {
    /** List of conversations */
    conversations: ConversationSummary[];

    /** Total number of conversations */
    total: number;
}

// ============ Streaming Types ============

/**
 * Streaming chunk event - partial response text
 */
export interface StreamChunkEvent {
    type: 'chunk';
    /** Partial response content */
    content: string;
}

/**
 * Streaming citations event - sent after text completes
 */
export interface StreamCitationsEvent {
    type: 'citations';
    /** List of citations referenced in the response */
    citations: CitationResponse[];
}

/**
 * Streaming done event - marks stream completion
 */
export interface StreamDoneEvent {
    type: 'done';
    /** Conversation ID for follow-up messages */
    conversation_id: string;
    /** Total processing time in milliseconds */
    execution_time_ms: number;
    /** Optional metadata */
    metadata?: Record<string, any>;
}

/**
 * Streaming error event
 */
export interface StreamErrorEvent {
    type: 'error';
    /** Error message */
    message: string;
    /** Additional error details */
    details?: Record<string, any>;
}

/**
 * Union type for all streaming events
 */
export type StreamEvent =
    | StreamChunkEvent
    | StreamCitationsEvent
    | StreamDoneEvent
    | StreamErrorEvent;

/**
 * Callbacks for streaming chat message
 */
export interface StreamChatCallbacks {
    /** Called for each content chunk */
    onChunk?: (content: string) => void;
    /** Called when citations are received */
    onCitations?: (citations: CitationResponse[]) => void;
    /** Called when stream completes successfully */
    onDone?: (conversationId: string, executionTimeMs: number) => void;
    /** Called when an error occurs */
    onError?: (message: string, details?: Record<string, any>) => void;
}

// ============ Beta Testing Types ============

/**
 * Response from beta status endpoint
 */
export interface TestModeStatusResponse {
    /** Whether test mode is enabled for this user */
    test_mode_enabled: boolean;
    /** Current token balance */
    available_tokens: number;
    /** Whether user needs to complete survey for refill */
    requires_refill: boolean;
    /** Number of surveys completed */
    surveys_completed: number;
}

/**
 * Survey questions response
 */
export interface SurveyQuestionsResponse {
    /** List of survey questions */
    questions: string[];
    /** Total number of questions */
    total_questions: number;
}

/**
 * Request to submit survey responses
 */
export interface SurveyRequest {
    /** Array of responses matching question order */
    responses: string[];
}

/**
 * Response after survey submission
 */
export interface SurveyResponse {
    /** Whether submission succeeded */
    success: boolean;
    /** Number of tokens granted */
    tokens_granted: number;
    /** New token balance after refill */
    new_balance: number;
    /** Confirmation message */
    message: string;
}

/**
 * Feedback type options
 */
export type FeedbackType = 'like' | 'dislike' | 'report';

/**
 * Request to submit message feedback
 */
export interface FeedbackRequest {
    /** ID of the message being rated */
    message_id: number;
    /** Conversation ID */
    conversation_id: string;
    /** Type of feedback */
    feedback_type: FeedbackType;
    /** Optional comment */
    comment?: string | null;
}

/**
 * Response after feedback submission
 */
export interface FeedbackResponse {
    /** Feedback record ID */
    id: string;
    /** Whether submission succeeded */
    success: boolean;
    /** Confirmation message */
    message: string;
}

/**
 * Error response for insufficient tokens (402)
 */
export interface InsufficientTokensError {
    /** Error type */
    error: 'InsufficientTokens';
    /** Error message */
    message: string;
    /** Flag indicating survey needed */
    requires_refill: boolean;
    /** Survey endpoint path */
    survey_endpoint: string;
}
