"use client"

/**
 * Search Tour
 * 
 * Contextual onboarding tour for the buscador/search page.
 * Highlights key UI elements with tooltips.
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { SpotlightOverlay, SpotlightStep } from './SpotlightOverlay';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAuth } from '@/context/AuthContext';

const SEARCH_TOUR_STEPS: SpotlightStep[] = [
    {
        target: '[data-tour-id="search-input"]',
        title: '🔍 Búsqueda semántica',
        content: 'Escribe tu consulta como si hablaras con una persona. Funciona mejor con preguntas naturales como: "¿Qué derechos tienen los inquilinos?" o "Artículos que hablan de la protección de datos".',
        placement: 'bottom',
    },
    {
        target: '[data-tour-id="search-button"]',
        title: '▶️ Ejecuta la búsqueda',
        content: 'Haz clic aquí o presiona Enter para buscar. Los resultados se ordenan por relevancia.',
        placement: 'left',
    },
];

export function SearchTour() {
    const pathname = usePathname();
    const { isAuthenticated } = useAuth();
    const {
        isLoaded,
        activeTour,
        hasSeenSearchTour,
        startTour,
        nextStep,
        prevStep,
        completeTour
    } = useOnboarding();

    const isActive = activeTour.tourId === 'search';
    const isOnSearchPage = pathname === '/buscador';

    // Auto-start tour for authenticated users who haven't seen it (only on buscador page)
    useEffect(() => {
        // Wait for localStorage to be loaded
        if (!isLoaded) return;

        if (isAuthenticated && !hasSeenSearchTour && !activeTour.tourId && isOnSearchPage) {
            const timer = setTimeout(() => {
                startTour('search');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isLoaded, isAuthenticated, hasSeenSearchTour, activeTour.tourId, startTour, isOnSearchPage]);

    const handleComplete = () => {
        completeTour('search');
    };

    // Only render if on buscador page
    if (!isOnSearchPage) return null;

    return (
        <SpotlightOverlay
            steps={SEARCH_TOUR_STEPS}
            isActive={isActive}
            currentStep={activeTour.currentStep}
            onNext={nextStep}
            onPrev={prevStep}
            onComplete={handleComplete}
            canSkip={false}
        />
    );
}
