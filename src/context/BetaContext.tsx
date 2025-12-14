"use client"

/**
 * Beta Context
 * 
 * React context for managing beta test mode state across the app.
 * Provides test mode status and survey modal controls.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getBetaStatus } from '@/lib/api';
import { useAuth } from './AuthContext';

interface BetaContextType {
    /** Whether test mode is enabled for this user */
    testModeEnabled: boolean;

    /** Current token balance (synced with auth) */
    availableTokens: number;

    /** Whether user needs to complete survey for refill */
    requiresRefill: boolean;

    /** Number of surveys completed */
    surveysCompleted: number;

    /** Whether survey modal is open */
    surveyModalOpen: boolean;

    /** Loading state for beta status */
    isLoading: boolean;

    /** Refresh beta status from API */
    refreshStatus: () => Promise<void>;

    /** Open survey modal */
    openSurveyModal: () => void;

    /** Close survey modal and optionally update tokens */
    closeSurveyModal: (newBalance?: number) => void;
}

const BetaContext = createContext<BetaContextType | undefined>(undefined);

interface BetaProviderProps {
    children: React.ReactNode;
}

export function BetaProvider({ children }: BetaProviderProps) {
    const { user, isAuthenticated, updateTokenBalance } = useAuth();

    // Beta state
    const [testModeEnabled, setTestModeEnabled] = useState(false);
    const [requiresRefill, setRequiresRefill] = useState(false);
    const [surveysCompleted, setSurveysCompleted] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [surveyModalOpen, setSurveyModalOpen] = useState(false);

    // Fetch beta status on auth change
    const refreshStatus = useCallback(async () => {
        if (!isAuthenticated) {
            setTestModeEnabled(false);
            setRequiresRefill(false);
            setSurveysCompleted(0);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const status = await getBetaStatus();
            setTestModeEnabled(status.test_mode_enabled);
            setRequiresRefill(status.requires_refill);
            setSurveysCompleted(status.surveys_completed);

            // Sync token balance
            if (status.available_tokens !== user?.available_tokens) {
                updateTokenBalance(status.available_tokens);
            }

            // Note: Survey modal is NOT auto-opened here
            // It only opens when user tries to send a prompt with 0 tokens
            // This gives them time to read the last response before being prompted
        } catch (error) {
            console.error('Failed to fetch beta status:', error);
            // Assume not in test mode on error
            setTestModeEnabled(false);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, user?.available_tokens, updateTokenBalance]);

    // Initial fetch
    useEffect(() => {
        refreshStatus();
    }, [refreshStatus]);

    const openSurveyModal = useCallback(() => {
        setSurveyModalOpen(true);
    }, []);

    const closeSurveyModal = useCallback((newBalance?: number) => {
        setSurveyModalOpen(false);
        if (newBalance !== undefined) {
            updateTokenBalance(newBalance);
            setRequiresRefill(false);
        }
    }, [updateTokenBalance]);

    const value: BetaContextType = {
        testModeEnabled,
        availableTokens: user?.available_tokens ?? 0,
        requiresRefill,
        surveysCompleted,
        surveyModalOpen,
        isLoading,
        refreshStatus,
        openSurveyModal,
        closeSurveyModal,
    };

    return (
        <BetaContext.Provider value={value}>
            {children}
        </BetaContext.Provider>
    );
}

/**
 * Hook to access beta test mode context
 * 
 * @returns Beta context with test mode state and controls
 * @throws If used outside of BetaProvider
 */
export function useBeta(): BetaContextType {
    const context = useContext(BetaContext);
    if (context === undefined) {
        throw new Error('useBeta must be used within a BetaProvider');
    }
    return context;
}
