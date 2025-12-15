"use client"

/**
 * Chat Tour
 * 
 * Contextual onboarding tour for the chat page.
 * Highlights key UI elements with tooltips.
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { SpotlightOverlay, SpotlightStep } from './SpotlightOverlay';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAuth } from '@/context/AuthContext';

const CHAT_TOUR_STEPS: SpotlightStep[] = [
    {
        target: '[data-tour-id="chat-input"]',
        title: '💬 Escribe tu consulta',
        content: 'Puedes hacer preguntas, pedir aclaraciones o solicitar explicaciones sobre cualquier tema legal. El asistente te responderá con citas de fuentes.',
        placement: 'top',
    },
    {
        target: '[data-tour-id="quality-selector"]',
        title: '⭐ Ajusta la calidad',
        content: 'Elige el nivel de calidad: Mid → Alto → MAX. Mayor nivel significa más fuentes consultadas. Estamos en beta, así que prueba cualquiera.',
        placement: 'top',
    },
    {
        target: '[data-tour-id="send-button"]',
        title: '📤 Envía tu mensaje',
        content: '¡Listo! Haz clic aquí o presiona Enter para enviar tu consulta. Las respuestas incluirán citas verificables.',
        placement: 'left',
    },
];

export function ChatTour() {
    const pathname = usePathname();
    const { isAuthenticated } = useAuth();
    const {
        isLoaded,
        activeTour,
        hasSeenChatTour,
        startTour,
        nextStep,
        prevStep,
        completeTour
    } = useOnboarding();

    const isActive = activeTour.tourId === 'chat';
    const isOnChatPage = pathname === '/chat' || pathname?.startsWith('/chat/');

    // Auto-start tour for authenticated users who haven't seen it (only on chat pages)
    useEffect(() => {
        // Wait for localStorage to be loaded
        if (!isLoaded) return;

        if (isAuthenticated && !hasSeenChatTour && !activeTour.tourId && isOnChatPage) {
            // Delay to ensure elements are rendered
            const timer = setTimeout(() => {
                startTour('chat');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isLoaded, isAuthenticated, hasSeenChatTour, activeTour.tourId, startTour, isOnChatPage]);

    const handleComplete = () => {
        completeTour('chat');
    };

    // Only render if on chat page
    if (!isOnChatPage) return null;

    return (
        <SpotlightOverlay
            steps={CHAT_TOUR_STEPS}
            isActive={isActive}
            currentStep={activeTour.currentStep}
            onNext={nextStep}
            onPrev={prevStep}
            onComplete={handleComplete}
            canSkip={false}
        />
    );
}
