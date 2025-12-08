"use client"

/**
 * Auth Context
 * 
 * React context for managing authentication state across the app.
 * Provides user info, login/logout functions, and auth status.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    login as apiLogin,
    logout as apiLogout,
    getStoredUser,
    getStoredToken,
    getCurrentUser,
    updateStoredTokenBalance,
    UserInfo,
} from '@/lib/api';

interface AuthUser {
    id: string;
    username: string;
    available_tokens: number;
}

interface AuthContextType {
    /** Current user info or null if not authenticated */
    user: AuthUser | null;

    /** True if user is authenticated */
    isAuthenticated: boolean;

    /** True while checking authentication status */
    isLoading: boolean;

    /** Login function */
    login: (username: string, password: string) => Promise<void>;

    /** Logout function */
    logout: () => void;

    /** Refresh user info from API */
    refreshUser: () => Promise<void>;

    /** Update token balance locally */
    updateTokenBalance: (tokens: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing auth on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const storedUser = getStoredUser();
                const token = getStoredToken();

                if (storedUser && token) {
                    // Set stored user immediately for fast UI
                    setUser(storedUser);

                    // Optionally verify with API (background)
                    try {
                        const freshUser = await getCurrentUser();
                        setUser({
                            id: freshUser.id,
                            username: freshUser.username,
                            available_tokens: freshUser.available_tokens,
                        });
                    } catch {
                        // Token might be expired, will be handled by 401 interceptor
                    }
                }
            } catch (error) {
                console.error('Auth check failed:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = useCallback(async (username: string, password: string) => {
        const response = await apiLogin(username, password);
        setUser({
            id: response.user_id,
            username: response.username,
            available_tokens: response.available_tokens,
        });
    }, []);

    const logout = useCallback(() => {
        apiLogout();
        setUser(null);
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const freshUser = await getCurrentUser();
            setUser({
                id: freshUser.id,
                username: freshUser.username,
                available_tokens: freshUser.available_tokens,
            });
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    }, []);

    const updateTokenBalance = useCallback((tokens: number) => {
        setUser(prev => prev ? { ...prev, available_tokens: tokens } : null);
        updateStoredTokenBalance(tokens);
    }, []);

    const value: AuthContextType = {
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
        refreshUser,
        updateTokenBalance,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook to access authentication context
 * 
 * @returns Auth context with user, login, logout, etc.
 * @throws If used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

