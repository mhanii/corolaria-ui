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
}

/**
 * Schema for citation in response
 */
export interface CitationResponse {
    /** Citation number [1], [2], etc. */
    index: number;

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

