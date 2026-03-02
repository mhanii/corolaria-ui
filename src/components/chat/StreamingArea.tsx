"use client"

import { useState, useRef, useEffect, forwardRef, useImperativeHandle, memo } from "react"
import { ChatBubble } from "./ChatBubble"
import { StatusIndicator } from "./StatusIndicator"
import { StreamStatusEvent, CitationResponse, ArtifactSummary } from "@/lib/api"

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
    const [displayedContent, setDisplayedContent] = useState("")
    const fullContentRef = useRef("")
    const displayedLengthRef = useRef(0)
    const [streamingStatus, setStreamingStatus] = useState<StreamStatusEvent | null>(null)
    const [streamingCitations, setStreamingCitations] = useState<CitationResponse[]>([])
    const [streamingArtifacts, setStreamingArtifacts] = useState<ArtifactSummary[]>([])
    const [isTyping, setIsTyping] = useState(false)
    const [isStreaming, setIsStreaming] = useState(false)

    useImperativeHandle(ref, () => ({
        setContent: (content) => {
            fullContentRef.current = content
            // Snap to full content if we aren't actively streaming
            if (!isStreaming) {
                setDisplayedContent(content)
                displayedLengthRef.current = content.length
            }
        },
        setStatus: setStreamingStatus,
        setCitations: setStreamingCitations,
        setArtifacts: (artifacts) => setStreamingArtifacts([...artifacts]),
        setTyping: setIsTyping,
        setStreaming: setIsStreaming,
        reset: () => {
            fullContentRef.current = ""
            displayedLengthRef.current = 0
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
    // Why rAF chaining instead of setInterval:
    // setInterval(33ms) fires on a fixed clock regardless of whether React finished rendering.
    // ReactMarkdown re-parses the entire markdown string on every render — for growing content
    // this takes 30–80ms, longer than the 33ms interval. When the next tick fires before React
    // commits, React 18 batches both setState calls into ONE render, doubling the visible jump
    // (e.g. 25 chars × 2 = 50 chars = ~10 words appearing at once).
    //
    // rAF chaining: schedule the next frame only AFTER the current callback returns. React
    // processes setState, commits DOM, browser paints, THEN the next rAF fires.
    // Result: exactly one setState per paint — no batching across frames.
    useEffect(() => {
        if (!isStreaming) {
            setDisplayedContent(fullContentRef.current)
            displayedLengthRef.current = fullContentRef.current.length
            return
        }

        let rafId: number

        const tick = () => {
            const target = fullContentRef.current
            const pos = displayedLengthRef.current

            if (pos >= target.length) {
                // Nothing new yet — keep polling for incoming chunks
                rafId = requestAnimationFrame(tick)
                return
            }

            // Dynamic step: scale with backlog but cap for word-level granularity
            // lag=200 → ceil(200/15)=14, capped at 10 → ~1.5 words per frame
            // lag=50  → ceil(50/15)=4            → ~0.5 words per frame
            // lag=10  → 1 char per frame (finishing touches)
            const remaining = target.length - pos
            const step = Math.max(1, Math.min(10, Math.ceil(remaining / 15)))

            let endPos = Math.min(pos + step, target.length)

            // Snap forward to the next word boundary (space, newline, or end-of-string)
            // so the user always sees complete words, never a word cut mid-character
            while (endPos < target.length && target[endPos] !== ' ' && target[endPos] !== '\n') {
                endPos++
            }

            displayedLengthRef.current = endPos
            setDisplayedContent(target.slice(0, endPos))

            rafId = requestAnimationFrame(tick)
        }

        rafId = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(rafId)
    }, [isStreaming])

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
