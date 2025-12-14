import { useState, useEffect, useRef } from 'react';

/**
 * Hook to create a "typewriter" effect for streaming text
 * @param text The full text to display
 * @param speed Speed in ms per character (default 10ms)
 */
export function useTypewriter(text: string, speed: number = 8) {
    const [displayedText, setDisplayedText] = useState("");
    const currentTextRef = useRef(text);

    // Keep the current text ref in sync without triggering effect re-runs
    useEffect(() => {
        currentTextRef.current = text;

        // Handle reset for new messages immediately
        if (!text) {
            setDisplayedText("");
        }
    }, [text]);

    useEffect(() => {
        const interval = setInterval(() => {
            setDisplayedText((prev) => {
                const target = currentTextRef.current;

                // Optimization: if fully synced, do nothing
                if (prev === target) {
                    return prev;
                }

                // Handle external resets (e.g. switching chats)
                if (target.length === 0) {
                    return "";
                }

                // If displayed text is somehow longer than target (shouldn't happen normally), snap to target
                if (prev.length > target.length) {
                    return target;
                }

                // Calculate lag to implement adaptive speed
                const currentLength = prev.length;
                const targetLength = target.length;
                const lag = targetLength - currentLength;

                // Smooth stepping: never jump more than 2 chars for a fluid feel
                // Use 2 chars per tick when falling behind, otherwise 1
                const step = lag > 20 ? 2 : 1;

                return target.slice(0, currentLength + step);
            });
        }, speed);

        return () => clearInterval(interval);
    }, [speed]);

    return displayedText;
}
