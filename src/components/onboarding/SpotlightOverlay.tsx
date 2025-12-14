"use client"

/**
 * Spotlight Overlay
 * 
 * Interactive onboarding component that highlights UI elements with a spotlight
 * effect and shows contextual tooltips. Mobile-responsive design.
 */

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface SpotlightStep {
    /** Target element selector (e.g., '[data-tour-id="chat-input"]') */
    target: string;
    /** Tooltip title */
    title: string;
    /** Tooltip content */
    content: string;
    /** Tooltip position relative to target */
    placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface SpotlightOverlayProps {
    /** Array of tour steps */
    steps: SpotlightStep[];
    /** Whether the tour is active */
    isActive: boolean;
    /** Current step index */
    currentStep: number;
    /** Called when user clicks next */
    onNext: () => void;
    /** Called when user clicks previous */
    onPrev: () => void;
    /** Called when tour completes or is closed */
    onComplete: () => void;
    /** Whether user can skip the tour */
    canSkip?: boolean;
}

interface TargetRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

export function SpotlightOverlay({
    steps,
    isActive,
    currentStep,
    onNext,
    onPrev,
    onComplete,
    canSkip = false,
}: SpotlightOverlayProps) {
    const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
    const [mounted, setMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const step = steps[currentStep];
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === steps.length - 1;

    // Handle mounting for portal and detect mobile
    useEffect(() => {
        setMounted(true);
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => {
            setMounted(false);
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    // Fade in effect when spotlight becomes active
    useEffect(() => {
        if (isActive && targetRect) {
            const timer = setTimeout(() => setIsVisible(true), 50);
            return () => clearTimeout(timer);
        } else if (!isActive) {
            setIsVisible(false);
        }
    }, [isActive, targetRect]);

    // Find and track target element position
    const updateTargetRect = useCallback(() => {
        if (!step?.target) return;

        const element = document.querySelector(step.target);
        if (element) {
            const rect = element.getBoundingClientRect();
            setTargetRect({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
            });

            // Scroll element into view if needed
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            setTargetRect(null);
        }
    }, [step?.target]);

    // Update position on step change and window events
    useEffect(() => {
        if (!isActive) return;

        updateTargetRect();

        const timer = setTimeout(updateTargetRect, 100);

        window.addEventListener('resize', updateTargetRect);
        window.addEventListener('scroll', updateTargetRect, true);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateTargetRect);
            window.removeEventListener('scroll', updateTargetRect, true);
        };
    }, [isActive, updateTargetRect, currentStep]);

    // Don't render until we have a valid target rect
    if (!isActive || !mounted || !step || !targetRect) return null;

    // Calculate tooltip position - mobile uses bottom sheet style
    const getTooltipStyle = (): React.CSSProperties => {
        // On mobile, use a fixed bottom position like a bottom sheet
        if (isMobile) {
            return {
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                transform: 'none',
                maxWidth: 'none',
                borderRadius: '1rem 1rem 0 0',
            };
        }

        // Desktop: position relative to target
        const padding = 16;
        const placement = step.placement || 'bottom';
        const viewportWidth = window.innerWidth;
        const tooltipWidth = 320; // max-w-sm roughly

        // Calculate horizontal position, ensuring tooltip stays on screen
        let leftPos = targetRect.left + targetRect.width / 2;
        const minLeft = tooltipWidth / 2 + 16;
        const maxLeft = viewportWidth - tooltipWidth / 2 - 16;
        leftPos = Math.max(minLeft, Math.min(maxLeft, leftPos));

        switch (placement) {
            case 'top':
                return {
                    bottom: `calc(100% - ${targetRect.top - padding}px)`,
                    left: leftPos,
                    transform: 'translateX(-50%)',
                };
            case 'bottom':
                return {
                    top: targetRect.top + targetRect.height + padding,
                    left: leftPos,
                    transform: 'translateX(-50%)',
                };
            case 'left':
                return {
                    top: targetRect.top + targetRect.height / 2,
                    right: `calc(100% - ${targetRect.left - padding}px)`,
                    transform: 'translateY(-50%)',
                };
            case 'right':
                return {
                    top: targetRect.top + targetRect.height / 2,
                    left: targetRect.left + targetRect.width + padding,
                    transform: 'translateY(-50%)',
                };
            default:
                return {
                    top: targetRect.top + targetRect.height + padding,
                    left: leftPos,
                    transform: 'translateX(-50%)',
                };
        }
    };

    const overlay = (
        <div
            className="fixed inset-0 z-[9999] transition-opacity duration-300"
            style={{ opacity: isVisible ? 1 : 0 }}
            aria-modal="true"
        >
            {/* Dark overlay with spotlight cutout */}
            <svg
                className="absolute inset-0 w-full h-full"
                style={{ pointerEvents: 'none' }}
            >
                <defs>
                    <mask id="spotlight-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        <rect
                            x={targetRect.left - 8}
                            y={targetRect.top - 8}
                            width={targetRect.width + 16}
                            height={targetRect.height + 16}
                            rx="8"
                            fill="black"
                        />
                    </mask>
                </defs>
                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="rgba(0, 0, 0, 0.75)"
                    mask="url(#spotlight-mask)"
                />
            </svg>

            {/* Spotlight border highlight */}
            <div
                className="absolute border-2 border-primary rounded-lg pointer-events-none transition-all duration-300"
                style={{
                    top: targetRect.top - 8,
                    left: targetRect.left - 8,
                    width: targetRect.width + 16,
                    height: targetRect.height + 16,
                    boxShadow: '0 0 0 4px rgba(var(--primary), 0.3)',
                }}
            />

            {/* Tooltip - responsive design */}
            <div
                className={`absolute bg-card border border-border shadow-2xl z-10 transition-all duration-300 ${isMobile
                        ? 'p-4 pb-6'
                        : 'p-4 max-w-sm rounded-xl'
                    }`}
                style={getTooltipStyle()}
            >
                {/* Close button (if skippable) */}
                {canSkip && (
                    <button
                        onClick={onComplete}
                        className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors"
                        aria-label="Cerrar guía"
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                )}

                {/* Progress indicator */}
                <div className="flex gap-1.5 mb-3">
                    {steps.map((_, index) => (
                        <div
                            key={index}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${index <= currentStep
                                ? 'bg-primary'
                                : 'bg-muted'
                                }`}
                        />
                    ))}
                </div>

                {/* Content */}
                <h3 className={`font-semibold mb-2 ${isMobile ? 'text-lg' : 'text-base'}`}>
                    {step.title}
                </h3>
                <p className={`text-muted-foreground mb-4 ${isMobile ? 'text-base' : 'text-sm'}`}>
                    {step.content}
                </p>

                {/* Navigation - bigger touch targets on mobile */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                        {currentStep + 1} / {steps.length}
                    </span>

                    <div className="flex gap-2">
                        {!isFirstStep && (
                            <Button
                                variant="outline"
                                size={isMobile ? "default" : "sm"}
                                onClick={onPrev}
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Anterior
                            </Button>
                        )}

                        <Button
                            size={isMobile ? "default" : "sm"}
                            onClick={isLastStep ? onComplete : onNext}
                        >
                            {isLastStep ? '¡Entendido!' : 'Siguiente'}
                            {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(overlay, document.body);
}
