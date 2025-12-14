/**
 * API Configuration
 * 
 * Centralized configuration for API endpoints and versioning.
 * Uses environment variables to allow easy switching between development and production.
 */

/**
 * Base URL for the API.
 * Reads from NEXT_PUBLIC_API_URL environment variable.
 * Falls back to localhost:8000 for development if not set.
 */
// Use window.location.hostname in the browser to support access from other devices (e.g. mobile)
// This assumes the backend is running on the same host but port 8000
const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (typeof window !== 'undefined') {
        return `http://${window.location.hostname}:8000`;
    }
    return 'http://localhost:8000';
};

export const API_BASE_URL = getBaseUrl();

/**
 * API version prefix.
 * Currently using v1, can be updated for future API versions.
 */
export const API_VERSION = 'v1';

/**
 * Request timeout in milliseconds.
 * Requests will fail if they take longer than this.
 */
export const API_TIMEOUT = 30000; // 30 seconds

/**
 * Build a full API endpoint URL.
 * 
 * @param path - The endpoint path (e.g., '/search/semantic')
 * @returns Full URL for the endpoint
 * 
 * @example
 * ```ts
 * buildApiUrl('/search/semantic') 
 * // Returns: 'http://localhost:8000/api/v1/search/semantic'
 * ```
 */
export function buildApiUrl(path: string): string {
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${API_BASE_URL}/api/${API_VERSION}/${cleanPath}`;
}

/**
 * Check if we're in development mode
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Enable API request logging in development
 */
export const enableApiLogging = isDevelopment;
