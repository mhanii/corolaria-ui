"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CitationResponse } from "@/lib/api/types"

interface CitationListProps {
    citations: CitationResponse[]
    onCitationClick: (articleId: string) => void
}

export function CitationList({ citations, onCitationClick }: CitationListProps) {
    const [showCitations, setShowCitations] = useState(false)

    if (citations.length === 0) return null

    return (
        <div className="mt-2 w-full">
            <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs text-muted-foreground hover:text-accent hover:bg-accent/10 px-2 h-7"
                onClick={() => setShowCitations(!showCitations)}
            >
                {showCitations ? (
                    <ChevronUp className="h-3 w-3" />
                ) : (
                    <ChevronDown className="h-3 w-3" />
                )}
                {citations.length} {citations.length === 1 ? 'fuente' : 'fuentes'}
            </Button>

            {showCitations && (
                <div className="mt-2 space-y-2 max-w-full overflow-hidden">
                    {citations.map((citation, arrayIndex) => {
                        const displayIndex = arrayIndex + 1
                        return (
                            <div
                                key={citation.cite_key}
                                className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 border text-xs cursor-pointer hover:bg-muted/80 transition-colors max-w-full overflow-hidden"
                                onClick={() => onCitationClick(citation.article_id)}
                            >
                                <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded bg-accent/20 text-foreground/75 font-semibold text-[10px]">
                                    {displayIndex}
                                </span>
                                <div className="flex-1 min-w-0 overflow-hidden">
                                    <p className="font-medium text-foreground truncate">
                                        {citation.article_number}
                                    </p>
                                    <p className="text-muted-foreground truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
                                        {citation.normativa_title}
                                    </p>
                                    {citation.article_path && (
                                        <p className="text-muted-foreground/70 truncate text-[10px] max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
                                            {citation.article_path}
                                        </p>
                                    )}
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent/10 text-foreground/75">
                                        {Math.round(citation.score * 100)}%
                                    </span>
                                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
