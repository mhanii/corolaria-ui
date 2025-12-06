/**
 * useSearch Hook
 * 
 * Custom React hook for managing search state and operations.
 * Provides a clean interface for components to perform searches.
 */

'use client';

import { useState, useCallback } from 'react';
import {
    semanticSearch,
    SemanticSearchRequest,
    SemanticSearchResponse,
    ErrorResponse,
} from '@/lib/api';

/**
 * Search state interface
 */
interface SearchState {
    /** Current search query */
    query: string;

    /** Search results */
    results: SemanticSearchResponse | null;

    /** Loading state */
    loading: boolean;

    /** Error message if search failed */
    error: string | null;

    /** Whether a search has been performed */
    hasSearched: boolean;
}

/**
 * Hook return type
 */
interface UseSearchReturn extends SearchState {
    /** Perform a search */
    performSearch: (query: string, options?: Partial<SemanticSearchRequest>) => Promise<void>;

    /** Reset search state */
    resetSearch: () => void;

    /** Clear only the error */
    clearError: () => void;

    /** Set query without triggering search */
    setQuery: (query: string) => void;
}

/**
 * Custom hook for semantic search functionality
 * 
 * @example
 * ```tsx
 * const { performSearch, results, loading, error } = useSearch();
 * 
 * const handleSearch = async () => {
 *   await performSearch('libertad de expresión', { top_k: 20 });
 * };
 * ```
 */
export function useSearch(): UseSearchReturn {
    const [state, setState] = useState<SearchState>({
        query: '',
        results: null,
        loading: false,
        error: null,
        hasSearched: false,
    });

    /**
     * Perform a semantic search
     */
    const performSearch = useCallback(async (
        query: string,
        options?: Partial<SemanticSearchRequest>
    ) => {
        // Validate query
        if (!query || query.trim().length === 0) {
            setState(prev => ({
                ...prev,
                error: 'Por favor ingresa un término de búsqueda',
            }));
            return;
        }

        // Set loading state
        setState(prev => ({
            ...prev,
            query,
            loading: true,
            error: null,
        }));

        try {
            // Perform the search
            const response = await semanticSearch({
                query,
                ...options,
            });

            // Update state with results
            setState(prev => ({
                ...prev,
                results: response,
                loading: false,
                hasSearched: true,
            }));
        } catch (err) {
            // Handle errors
            const errorResponse = err as ErrorResponse;
            setState(prev => ({
                ...prev,
                error: errorResponse.message || 'Error al realizar la búsqueda',
                loading: false,
                hasSearched: true,
            }));
        }
    }, []);

    /**
     * Reset all search state
     */
    const resetSearch = useCallback(() => {
        setState({
            query: '',
            results: null,
            loading: false,
            error: null,
            hasSearched: false,
        });
    }, []);

    /**
     * Clear only the error message
     */
    const clearError = useCallback(() => {
        setState(prev => ({
            ...prev,
            error: null,
        }));
    }, []);

    /**
     * Set query without triggering search
     */
    const setQuery = useCallback((query: string) => {
        setState(prev => ({
            ...prev,
            query,
        }));
    }, []);

    return {
        ...state,
        performSearch,
        resetSearch,
        clearError,
        setQuery,
    };
}
