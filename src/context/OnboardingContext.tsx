"use client"

/**
 * Onboarding Context
 * 
 * Manages tutorial and onboarding state for users.
 * Tracks which tours have been shown and controls spotlight tours.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

// localStorage keys
const STORAGE_KEYS = {
    WELCOME_SEEN: 'coloraria_onboarding_welcome',
    CHAT_TOUR_SEEN: 'coloraria_onboarding_chat',
    SEARCH_TOUR_SEEN: 'coloraria_onboarding_search',
} as const;

interface TourState {
    tourId: string | null;
    currentStep: number;
}

interface OnboardingContextType {
    /** Whether localStorage has been loaded */
    isLoaded: boolean;

    /** Whether user has seen the welcome */
    hasSeenWelcome: boolean;

    /** Whether user has seen the chat tour */
    hasSeenChatTour: boolean;

    /** Whether user has seen the search tour */
    hasSeenSearchTour: boolean;

    /** Currently active tour */
    activeTour: TourState;

    /** Start a specific tour */
    startTour: (tourId: string) => void;

    /** Move to next step in tour */
    nextStep: () => void;

    /** Move to previous step in tour */
    prevStep: () => void;

    /** End the current tour */
    endTour: () => void;

    /** Mark a tour as complete */
    completeTour: (tourId: string) => void;

    /** Reset all tours (for testing) */
    resetTours: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingProviderProps {
    children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
    const { isAuthenticated } = useAuth();

    // Loading state - prevent tours from triggering before localStorage is read
    const [isLoaded, setIsLoaded] = useState(false);

    // Tour completion state from localStorage (default false, will be loaded from storage)
    const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
    const [hasSeenChatTour, setHasSeenChatTour] = useState(false);
    const [hasSeenSearchTour, setHasSeenSearchTour] = useState(false);

    // Active tour state
    const [activeTour, setActiveTour] = useState<TourState>({
        tourId: null,
        currentStep: 0,
    });

    // Load state from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setHasSeenWelcome(localStorage.getItem(STORAGE_KEYS.WELCOME_SEEN) === 'true');
            setHasSeenChatTour(localStorage.getItem(STORAGE_KEYS.CHAT_TOUR_SEEN) === 'true');
            setHasSeenSearchTour(localStorage.getItem(STORAGE_KEYS.SEARCH_TOUR_SEEN) === 'true');
            setIsLoaded(true);
        }
    }, []);

    const startTour = useCallback((tourId: string) => {
        setActiveTour({ tourId, currentStep: 0 });
    }, []);

    const nextStep = useCallback(() => {
        setActiveTour(prev => ({
            ...prev,
            currentStep: prev.currentStep + 1,
        }));
    }, []);

    const prevStep = useCallback(() => {
        setActiveTour(prev => ({
            ...prev,
            currentStep: Math.max(0, prev.currentStep - 1),
        }));
    }, []);

    const endTour = useCallback(() => {
        setActiveTour({ tourId: null, currentStep: 0 });
    }, []);

    const completeTour = useCallback((tourId: string) => {
        // Mark as complete in localStorage
        switch (tourId) {
            case 'welcome':
                localStorage.setItem(STORAGE_KEYS.WELCOME_SEEN, 'true');
                setHasSeenWelcome(true);
                break;
            case 'chat':
                localStorage.setItem(STORAGE_KEYS.CHAT_TOUR_SEEN, 'true');
                setHasSeenChatTour(true);
                break;
            case 'search':
                localStorage.setItem(STORAGE_KEYS.SEARCH_TOUR_SEEN, 'true');
                setHasSeenSearchTour(true);
                break;
        }
        endTour();
    }, [endTour]);

    const resetTours = useCallback(() => {
        localStorage.removeItem(STORAGE_KEYS.WELCOME_SEEN);
        localStorage.removeItem(STORAGE_KEYS.CHAT_TOUR_SEEN);
        localStorage.removeItem(STORAGE_KEYS.SEARCH_TOUR_SEEN);
        setHasSeenWelcome(false);
        setHasSeenChatTour(false);
        setHasSeenSearchTour(false);
        setActiveTour({ tourId: null, currentStep: 0 });
    }, []);

    const value: OnboardingContextType = {
        isLoaded,
        hasSeenWelcome,
        hasSeenChatTour,
        hasSeenSearchTour,
        activeTour,
        startTour,
        nextStep,
        prevStep,
        endTour,
        completeTour,
        resetTours,
    };

    return (
        <OnboardingContext.Provider value={value}>
            {children}
        </OnboardingContext.Provider>
    );
}

/**
 * Hook to access onboarding context
 */
export function useOnboarding(): OnboardingContextType {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
}
