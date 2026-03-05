"use client"

import { useState, useRef, useEffect, forwardRef, useImperativeHandle, memo } from "react"
import { ChatBubble } from "./ChatBubble"
import { StatusIndicator } from "./StatusIndicator"
import { ArtifactChip } from "./ArtifactChip"
import { StreamStatusEvent, CitationResponse, ArtifactSummary } from "@/lib/api"

export interface StreamingAreaHandle {
    setContent: (content: string) => void
    setStatus: (status: StreamStatusEvent | null) => void
    setCitations: (citations: CitationResponse[]) => void
    setArtifacts: (artifacts: ArtifactSummary[]) => void
    setTyping: (isTyping: boolean) => void
    setStreaming: (isStreaming: boolean) => void
    /** Signal that the backend stream is done; the interpolator will drain
     *  its remaining buffer and then invoke the callback. */
    completeStream: (onComplete: () => void) => void
    reset: () => void
}

interface StreamingAreaProps {
    onArtifactClick: (id: string, title: string) => void
    onStatusComplete: () => void
    dynamicMinHeight: string | number
    /** Milliseconds per word during interpolation. Default 30. Set to 0 to disable (instant). */
    wordQueueSpeedMs?: number
}

export const StreamingArea = memo(forwardRef<StreamingAreaHandle, StreamingAreaProps>(function StreamingArea({
    onArtifactClick,
    onStatusComplete,
    dynamicMinHeight,
    wordQueueSpeedMs = 40
}, ref) {
    const [displayedContent, setDisplayedContent] = useState("")
    const fullContentRef = useRef("")
    const displayedLengthRef = useRef(0)
    const [streamingStatus, setStreamingStatus] = useState<StreamStatusEvent | null>(null)
    const [streamingCitations, setStreamingCitations] = useState<CitationResponse[]>([])
    const [streamingArtifacts, setStreamingArtifacts] = useState<ArtifactSummary[]>([])
    const [isTyping, setIsTyping] = useState(false)
    const [isStreaming, setIsStreaming] = useState(false)

    // Completion callback: set by completeStream(), fired once the buffer is drained.
    const completeCallbackRef = useRef<(() => void) | null>(null)

    useImperativeHandle(ref, () => ({
        setContent: (content) => {
            fullContentRef.current = content
            // Snap to full content if we aren't actively streaming or interpolation is disabled
            if (!isStreaming || wordQueueSpeedMs === 0) {
                setDisplayedContent(content)
                displayedLengthRef.current = content.length
            }
        },
        setStatus: setStreamingStatus,
        setCitations: setStreamingCitations,
        setArtifacts: (artifacts) => setStreamingArtifacts([...artifacts]),
        setTyping: setIsTyping,
        setStreaming: setIsStreaming,
        completeStream: (onComplete) => {
            // If interpolation is disabled or buffer is already drained, fire immediately
            if (wordQueueSpeedMs === 0 || displayedLengthRef.current >= fullContentRef.current.length) {
                onComplete()
                return
            }
            // Otherwise, store callback — the rAF loop will call it once caught up
            completeCallbackRef.current = onComplete
        },
        reset: () => {
            fullContentRef.current = ""
            displayedLengthRef.current = 0
            completeCallbackRef.current = null
            setDisplayedContent("")
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
    const shouldShowStreamingBubble = (isTyping || isStreaming) && (displayedContent.length > 0 || !hasToolRunning);

    // Word-level text interpolator using requestAnimationFrame chaining.
    //
    // Uses a time-based accumulator: every frame we compute how many words
    // should have been revealed since the last frame based on wordQueueSpeedMs,
    // then advance to the next N word boundaries. This decouples reveal speed
    // from frame rate and chunk size.
    //
    // When completeStream() is called (backend done), the loop keeps running
    // at the same pace until the buffer is fully drained, then fires the
    // completion callback — eliminating the "freeze then snap" effect.
    useEffect(() => {
        if (!isStreaming) {
            setDisplayedContent(fullContentRef.current)
            displayedLengthRef.current = fullContentRef.current.length
            return
        }

        // Interpolation disabled — snap to full content every frame
        if (wordQueueSpeedMs === 0) {
            let rafId: number
            const passthrough = () => {
                const target = fullContentRef.current
                if (displayedLengthRef.current !== target.length) {
                    displayedLengthRef.current = target.length
                    setDisplayedContent(target)
                }
                // Check if we should complete
                if (completeCallbackRef.current && displayedLengthRef.current >= fullContentRef.current.length) {
                    const cb = completeCallbackRef.current
                    completeCallbackRef.current = null
                    cb()
                    return
                }
                rafId = requestAnimationFrame(passthrough)
            }
            rafId = requestAnimationFrame(passthrough)
            return () => cancelAnimationFrame(rafId)
        }

        let rafId: number
        let lastTimestamp = 0
        let wordDebt = 0 // fractional words owed from sub-interval frames

        const tick = (timestamp: number) => {
            if (lastTimestamp === 0) lastTimestamp = timestamp
            const elapsed = timestamp - lastTimestamp
            lastTimestamp = timestamp

            const target = fullContentRef.current
            let pos = displayedLengthRef.current

            if (pos >= target.length) {
                // Buffer drained — if stream is complete, fire callback
                if (completeCallbackRef.current) {
                    const cb = completeCallbackRef.current
                    completeCallbackRef.current = null
                    cb()
                    return
                }
                // Otherwise keep polling for new chunks
                rafId = requestAnimationFrame(tick)
                return
            }

            // Calculate how many words to reveal this frame
            // Double the speed if the backend stream is done (completeCallbackRef.current is set)
            const effectiveSpeed = completeCallbackRef.current ? wordQueueSpeedMs / 2 : wordQueueSpeedMs
            wordDebt += elapsed / effectiveSpeed

            const wordsThisFrame = Math.floor(wordDebt)
            if (wordsThisFrame <= 0) {
                rafId = requestAnimationFrame(tick)
                return
            }
            wordDebt -= wordsThisFrame

            // Advance pos by wordsThisFrame word boundaries
            let endPos = pos
            for (let w = 0; w < wordsThisFrame && endPos < target.length; w++) {
                // Skip current word chars
                while (endPos < target.length && target[endPos] !== ' ' && target[endPos] !== '\n') {
                    endPos++
                }
                // Skip whitespace to land at start of next word
                while (endPos < target.length && (target[endPos] === ' ' || target[endPos] === '\n')) {
                    endPos++
                }
            }

            if (endPos > pos) {
                displayedLengthRef.current = endPos
                setDisplayedContent(target.slice(0, endPos))
            }

            rafId = requestAnimationFrame(tick)
        }

        rafId = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(rafId)
    }, [isStreaming, wordQueueSpeedMs])

    if (!isTyping && !isStreaming && !streamingStatus) return null;

    return (
        <div className="flex flex-col w-full gap-4">
            {streamingStatus && (
                <div className="flex flex-col w-full">
                    <StatusIndicator
                        status={streamingStatus}
                        onComplete={onStatusComplete}
                    />
                </div>
            )}

            {streamingArtifacts.length > 0 && (
                <div className="flex flex-col w-full">
                    {streamingArtifacts.map((artifact) => (
                        <div key={artifact.id} className="mt-2 mb-2">
                            <ArtifactChip
                                id={artifact.id}
                                title={artifact.title}
                                onClick={() => onArtifactClick(artifact.id, artifact.title)}
                            />
                        </div>
                    ))}
                </div>
            )}

            {shouldShowStreamingBubble && (
                <div className="flex flex-col w-full">
                    <ChatBubble
                        role="assistant"
                        content={displayedContent}
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
