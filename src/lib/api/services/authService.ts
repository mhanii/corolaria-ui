/**
 * Auth Service
 * 
 * API service layer for authentication endpoints.
 * Handles login, logout, token storage, and user info retrieval.
 */

import { buildApiUrl } from '../config';
import { post, get } from '../client';
import {
    LoginRequest,
    TokenResponse,
    UserInfo,
} from '../types';

// Storage keys
const TOKEN_KEY = 'athen_access_token';
const USER_KEY = 'athen_user';

/**
 * Login with username and password
 * 
 * @param username - User's username
 * @param password - User's password
 * @returns Promise with token response
 * 
 * @example
 * ```ts
 * const result = await login('testuser', 'password123');
 * console.log(result.access_token);
 * ```
 */
export async function login(
    username: string,
    password: string
): Promise<TokenResponse> {
    // Validate inputs
    if (!username || username.trim().length < 3) {
        throw {
            error: 'ValidationError',
            message: 'El nombre de usuario debe tener al menos 3 caracteres',
            details: { field: 'username' }
        };
    }

    if (!password || password.length < 6) {
        throw {
            error: 'ValidationError',
            message: 'La contraseña debe tener al menos 6 caracteres',
            details: { field: 'password' }
        };
    }

    const request: LoginRequest = {
        username: username.trim(),
        password: password,
    };

    const endpoint = buildApiUrl('auth/login');
    const response = await post<TokenResponse, LoginRequest>(endpoint, request);

    // Store token and user info
    storeCredentials(response);

    return response;
}

/**
 * Store credentials in localStorage
 */
function storeCredentials(response: TokenResponse): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem(TOKEN_KEY, response.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify({
        id: response.user_id,
        username: response.username,
        available_tokens: response.available_tokens,
    }));
}

/**
 * Logout - clear stored credentials
 */
export function logout(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

/**
 * Get stored access token
 * 
 * @returns JWT token or null if not logged in
 */
export function getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get stored user info (from localStorage, not from API)
 * 
 * @returns Stored user info or null
 */
export function getStoredUser(): { id: string; username: string; available_tokens: number } | null {
    if (typeof window === 'undefined') return null;

    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;

    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
}

/**
 * Update stored user token balance
 */
export function updateStoredTokenBalance(available_tokens: number): void {
    if (typeof window === 'undefined') return;

    const user = getStoredUser();
    if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify({
            ...user,
            available_tokens,
        }));
    }
}

/**
 * Check if user is authenticated (has stored token)
 * 
 * @returns true if user has a stored token
 */
export function isAuthenticated(): boolean {
    return getStoredToken() !== null;
}

/**
 * Get current user info from API
 * 
 * @returns Promise with user info
 * @throws If not authenticated or token expired
 */
export async function getCurrentUser(): Promise<UserInfo> {
    const endpoint = buildApiUrl('auth/me');
    const userInfo = await get<UserInfo>(endpoint);

    // Update stored token balance
    updateStoredTokenBalance(userInfo.available_tokens);

    return userInfo;
}

