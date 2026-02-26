"use client"

import { useState, useRef, useEffect, forwardRef, useImperativeHandle, memo } from "react"
import { ChatBubble } from "./ChatBubble"
import { StatusIndicator } from "./StatusIndicator"
import { StreamStatusEvent, CitationResponse, ArtifactSummary } from "@/lib/api"
import { cn } from "@/lib/utils"

export interface StreamingAreaHandle {
    setContent: (content: string) => void
    setStatus: (status: StreamStatusEvent | null) => void
    setCitations: (citations: CitationResponse[]) => void
    setArtifacts: (artifacts: ArtifactSummary[]) => void
    setTyping: (isTyping: boolean) => void
    setStreaming: (isStreaming: boolean) => void
    reset: () => void
}

interface StreamingAreaProps {
    onArtifactClick: (id: string, title: string) => void
    onStatusComplete: () => void
    dynamicMinHeight: string | number
}

export const StreamingArea = memo(forwardRef<StreamingAreaHandle, StreamingAreaProps>(function StreamingArea({
    onArtifactClick,
    onStatusComplete,
    dynamicMinHeight
}, ref) {
    const [streamingContent, setStreamingContent] = useState("")
    const [streamingStatus, setStreamingStatus] = useState<StreamStatusEvent | null>(null)
    const [streamingCitations, setStreamingCitations] = useState<CitationResponse[]>([])
    const [streamingArtifacts, setStreamingArtifacts] = useState<ArtifactSummary[]>([])
    const [isTyping, setIsTyping] = useState(false)
    const [isStreaming, setIsStreaming] = useState(false)

    // Smooth Interpolation Logic
    const fullContentRef = useRef("")
    const displayedContentRef = useRef("")
    const isStreamingRef = useRef(false) // Synchronous state to fix race conditions
    const animationFrameRef = useRef<number | null>(null)
    const lastUpdateRef = useRef<number>(0)

    // Smooth typing effect
    useEffect(() => {
        if (!isStreaming) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            // Ensure final content is displayed
            setStreamingContent(fullContentRef.current);
            displayedContentRef.current = fullContentRef.current;
            return;
        }

        const animate = (time: number) => {
            if (!lastUpdateRef.current) lastUpdateRef.current = time;
            const timeSinceLast = time - lastUpdateRef.current;

            // Speed calculation: Catch up quickly if we are far behind. 
            // 40-word chunks are ~240 chars.
            const remainingChars = fullContentRef.current.length - displayedContentRef.current.length;

            if (remainingChars > 0) {
                // Determine how many characters to add in this frame
                // Baseline: ~120 chars/sec (0.12 chars/ms)
                // High throughput: Scale up to ~600 chars/sec (0.6 chars/ms) for large bursts
                let charsPerMs = 0.12;
                if (remainingChars > 400) charsPerMs = 0.8;      // Extreme burst
                else if (remainingChars > 150) charsPerMs = 0.4; // Large burst
                else if (remainingChars > 50) charsPerMs = 0.2;  // Medium burst

                const countToAdd = Math.floor(timeSinceLast * charsPerMs);

                // Update UI only if we have chars to add AND at least ~25ms have passed (~40fps).
                // This balance provides buttery flow while keeping CPU usage low.
                if (countToAdd >= 1 && timeSinceLast >= 25) {
                    const nextLength = Math.min(
                        displayedContentRef.current.length + countToAdd,
                        fullContentRef.current.length
                    );

                    const nextContent = fullContentRef.current.slice(0, nextLength);
                    displayedContentRef.current = nextContent;
                    setStreamingContent(nextContent);
                    lastUpdateRef.current = time;
                }
            } else {
                lastUpdateRef.current = time;
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isStreaming]);

    useImperativeHandle(ref, () => ({
        setContent: (content) => {
            fullContentRef.current = content;
            // Use synchronous isStreamingRef to determine if we should interpolate
            if (!isStreamingRef.current) {
                displayedContentRef.current = content;
                setStreamingContent(content);
            }
        },
        setStatus: setStreamingStatus,
        setCitations: setStreamingCitations,
        setArtifacts: (artifacts) => setStreamingArtifacts([...artifacts]),
        setTyping: setIsTyping,
        setStreaming: (val) => {
            isStreamingRef.current = val;
            setIsStreaming(val);
        },
        reset: () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            isStreamingRef.current = false
            fullContentRef.current = ""
            displayedContentRef.current = ""
            setStreamingContent("")
            setStreamingStatus(null)
            setStreamingCitations([])
            setStreamingArtifacts([])
            setIsTyping(false)
            setIsStreaming(false)
        }
    }))

    const isDocumentTool = streamingStatus?.tool === 'create_legal_document' || streamingStatus?.phase?.startsWith('document_creation');
    const hasToolRunning = streamingStatus && !isDocumentTool &&
        ['tool_start', 'research_plan_ready', 'research_step_done', 'context_collection_start'].includes(streamingStatus.phase);
    const shouldShowStreamingBubble = (isTyping || isStreaming) && (streamingContent.length > 0 || !hasToolRunning);

    if (!isTyping && !isStreaming && !streamingStatus) return null;

    return (
        <div className="flex flex-col w-full gap-4">
            {/* Inline StatusIndicator */}
            {streamingStatus && (
                <div className="flex flex-col w-full">
                    <StatusIndicator
                        status={streamingStatus}
                        onComplete={onStatusComplete}
                    />
                </div>
            )}

            {shouldShowStreamingBubble && (
                <div className={cn(
                    "flex flex-col w-full",
                    !isStreaming && "transition-all duration-300"
                )}>
                    <ChatBubble
                        role="assistant"
                        content={streamingContent}
                        citations={streamingCitations}
                        isStreaming={isStreaming}
                        isTyping={isTyping && !isStreaming}
                        artifacts={streamingArtifacts}
                        onArtifactClick={onArtifactClick}
                        minHeight={dynamicMinHeight}
                        isLast
                    />
                </div>
            )}
        </div>
    )
}))
