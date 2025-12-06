/**
 * Search Service
 * 
 * API service layer for search-related endpoints.
 * Provides type-safe methods for semantic search operations.
 */

import { buildApiUrl } from '../config';
import { post, get } from '../client';
import {
    SemanticSearchRequest,
    SemanticSearchResponse,
    ArticleDetailResponse,
    ArticleVersionsResponse,
} from '../types';

/**
 * Perform semantic search for legal articles
 * 
 * @param request - Search request parameters
 * @returns Promise with search results
 * 
 * @throws {ErrorResponse} If the search fails or validation errors occur
 * 
 * @example
 * ```ts
 * const results = await semanticSearch({
 *   query: 'libertad de expresión',
 *   top_k: 10
 * });
 * ```
 */
export async function semanticSearch(
    request: SemanticSearchRequest
): Promise<SemanticSearchResponse> {
    // Validate request before sending
    if (!request.query || request.query.trim().length === 0) {
        throw {
            error: 'ValidationError',
            message: 'La consulta de búsqueda no puede estar vacía',
            details: { field: 'query' }
        };
    }

    // Set defaults
    const searchRequest: SemanticSearchRequest = {
        query: request.query.trim(),
        top_k: request.top_k || 10,
        index_name: request.index_name || 'article_embeddings',
    };

    // Make the API request
    const endpoint = buildApiUrl('search/semantic');
    return await post<SemanticSearchResponse, SemanticSearchRequest>(
        endpoint,
        searchRequest
    );
}

/**
 * Get an article by its node ID
 * 
 * @param nodeId - The unique node identifier for the article
 * @returns Promise with article details
 * 
 * @throws {ErrorResponse} If the article is not found or retrieval fails
 * 
 * @example
 * ```ts
 * const article = await getArticleByNodeId('123');
 * ```
 */
export async function getArticleByNodeId(
    nodeId: string
): Promise<ArticleDetailResponse> {
    if (!nodeId || nodeId.trim().length === 0) {
        throw {
            error: 'ValidationError',
            message: 'El ID del artículo no puede estar vacío',
            details: { field: 'nodeId' }
        };
    }

    const endpoint = buildApiUrl(`article/${nodeId}`);
    return await get<ArticleDetailResponse>(endpoint);
}

/**
 * Get all versions of an article
 * 
 * @param nodeId - The unique node identifier for any version of the article
 * @returns Promise with all versions of the article
 * 
 * @throws {ErrorResponse} If the article is not found or retrieval fails
 * 
 * @example
 * ```ts
 * const versions = await getArticleVersions('123');
 * console.log(`Found ${versions.total_versions} versions`);
 * ```
 */
export async function getArticleVersions(
    nodeId: string
): Promise<ArticleVersionsResponse> {
    if (!nodeId || nodeId.trim().length === 0) {
        throw {
            error: 'ValidationError',
            message: 'El ID del artículo no puede estar vacío',
            details: { field: 'nodeId' }
        };
    }

    const endpoint = buildApiUrl(`article/${nodeId}/versions`);
    return await get<ArticleVersionsResponse>(endpoint);
}
