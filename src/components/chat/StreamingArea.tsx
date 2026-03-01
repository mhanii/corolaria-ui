"use client"

import { useState, useRef, forwardRef, useImperativeHandle, memo } from "react"
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
    const [streamingContent, setStreamingContent] = useState("")
    const [streamingStatus, setStreamingStatus] = useState<StreamStatusEvent | null>(null)
    const [streamingCitations, setStreamingCitations] = useState<CitationResponse[]>([])
    const [streamingArtifacts, setStreamingArtifacts] = useState<ArtifactSummary[]>([])
    const [isTyping, setIsTyping] = useState(false)
    const [isStreaming, setIsStreaming] = useState(false)

    useImperativeHandle(ref, () => ({
        setContent: (content) => {
            setStreamingContent(content)
        },
        setStatus: setStreamingStatus,
        setCitations: setStreamingCitations,
        setArtifacts: (artifacts) => setStreamingArtifacts([...artifacts]),
        setTyping: setIsTyping,
        setStreaming: setIsStreaming,
        reset: () => {
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
