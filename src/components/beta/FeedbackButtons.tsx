"use client"

/**
 * Feedback Buttons
 * 
 * Like/Dislike/Report buttons for assistant messages in beta test mode.
 */

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Flag, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { submitFeedback, FeedbackType } from '@/lib/api';

interface FeedbackButtonsProps {
    /** Message index (used as message_id) */
    messageIndex: number;
    /** Conversation ID */
    conversationId: string;
    /** Additional class names */
    className?: string;
}

export function FeedbackButtons({
    messageIndex,
    conversationId,
    className = '',
}: FeedbackButtonsProps) {
    const [submittedType, setSubmittedType] = useState<FeedbackType | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFeedback = async (type: FeedbackType) => {
        if (isSubmitting || submittedType) return;

        setIsSubmitting(true);
        try {
            await submitFeedback(messageIndex, conversationId, type);
            setSubmittedType(type);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // If feedback already submitted, show confirmation
    if (submittedType) {
        return (
            <div className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
                <Check className="w-3.5 h-3.5 text-green-500" />
                <span>
                    {submittedType === 'like' && 'Valoración positiva enviada'}
                    {submittedType === 'dislike' && 'Valoración negativa enviada'}
                    {submittedType === 'report' && 'Reporte enviado'}
                </span>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className={`flex items-center gap-0.5 ${className}`}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-green-500 hover:bg-green-500/10"
                            onClick={() => handleFeedback('like')}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <ThumbsUp className="w-3.5 h-3.5" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        <p>Respuesta útil</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10"
                            onClick={() => handleFeedback('dislike')}
                            disabled={isSubmitting}
                        >
                            <ThumbsDown className="w-3.5 h-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        <p>Respuesta no útil</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => handleFeedback('report')}
                            disabled={isSubmitting}
                        >
                            <Flag className="w-3.5 h-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        <p>Reportar problema</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}
