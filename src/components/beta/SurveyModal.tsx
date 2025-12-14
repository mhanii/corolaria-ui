"use client"

/**
 * Survey Modal
 * 
 * Wizard-style modal for completing surveys to refill tokens.
 * Shows one question at a time with "Siguiente" button for less overwhelming UX.
 */

import { useState, useEffect } from 'react';
import { Star, Loader2, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { getSurveyQuestions, submitSurvey } from '@/lib/api';
import { useBeta } from '@/context/BetaContext';

interface StarRatingProps {
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
}

function StarRating({ value, onChange, disabled }: StarRatingProps) {
    const [hovered, setHovered] = useState(0);

    return (
        <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={disabled}
                    className="p-2 transition-transform hover:scale-110 disabled:opacity-50"
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                >
                    <Star
                        className={`w-8 h-8 transition-colors ${star <= (hovered || value)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-muted-foreground'
                            }`}
                    />
                </button>
            ))}
        </div>
    );
}

export function SurveyModal() {
    const { surveyModalOpen, closeSurveyModal } = useBeta();

    const [questions, setQuestions] = useState<string[]>([]);
    const [responses, setResponses] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [tokensGranted, setTokensGranted] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Fetch questions on modal open
    useEffect(() => {
        if (surveyModalOpen) {
            setIsLoading(true);
            setIsSuccess(false);
            setError(null);
            setCurrentIndex(0);

            getSurveyQuestions()
                .then((data) => {
                    setQuestions(data.questions);
                    setResponses(new Array(data.questions.length).fill(''));
                })
                .catch((err) => {
                    console.error('Failed to fetch survey questions:', err);
                    setError('No se pudieron cargar las preguntas. Inténtelo de nuevo.');
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [surveyModalOpen]);

    const handleRatingChange = (value: number) => {
        const newResponses = [...responses];
        newResponses[currentIndex] = value.toString();
        setResponses(newResponses);
    };

    const handleTextChange = (value: string) => {
        const newResponses = [...responses];
        newResponses[currentIndex] = value;
        setResponses(newResponses);
    };

    const isCurrentAnswered = () => {
        // Rating questions (first 4) require a value, text question (last) is optional
        if (currentIndex < 4) return responses[currentIndex] !== '';
        return true; // Text question can be empty
    };

    const isLastQuestion = currentIndex === questions.length - 1;
    const isFirstQuestion = currentIndex === 0;

    const handleNext = () => {
        if (isLastQuestion) {
            handleSubmit();
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (!isFirstQuestion) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await submitSurvey(responses);
            setTokensGranted(result.tokens_granted);
            setIsSuccess(true);

            // Auto-close after showing success
            setTimeout(() => {
                closeSurveyModal(result.new_balance);
                // Reset state for next time
                setCurrentIndex(0);
                setResponses([]);
            }, 2000);
        } catch (err: any) {
            console.error('Failed to submit survey:', err);
            setError(err.message || 'Error al enviar las respuestas. Inténtelo de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            closeSurveyModal();
            setCurrentIndex(0);
        }
    };

    const currentQuestion = questions[currentIndex];
    const isRatingQuestion = currentIndex < 4;

    return (
        <Dialog open={surveyModalOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-display">
                        {isSuccess ? '¡Gracias por tu feedback!' : 'Encuesta de Satisfacción'}
                    </DialogTitle>
                    <DialogDescription>
                        {isSuccess
                            ? `Has recibido ${tokensGranted} tokens adicionales.`
                            : 'Responde estas preguntas para obtener más tokens.'}
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-accent" />
                    </div>
                ) : isSuccess ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                        <CheckCircle className="w-16 h-16 text-green-500" />
                        <p className="text-lg font-medium text-center">
                            +{tokensGranted} tokens añadidos
                        </p>
                    </div>
                ) : error ? (
                    <div className="py-8">
                        <p className="text-destructive text-center mb-4">{error}</p>
                        <div className="flex justify-center">
                            <Button onClick={() => window.location.reload()}>
                                Reintentar
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="py-4">
                        {/* Progress indicator */}
                        <div className="flex justify-center gap-2 mb-6">
                            {questions.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-2.5 h-2.5 rounded-full transition-colors ${idx === currentIndex
                                            ? 'bg-accent'
                                            : idx < currentIndex
                                                ? 'bg-accent/50'
                                                : 'bg-muted-foreground/30'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Current question */}
                        <div className="text-center space-y-6 min-h-[160px]">
                            <p className="text-sm text-muted-foreground">
                                Pregunta {currentIndex + 1} de {questions.length}
                            </p>
                            <p className="text-base font-medium leading-relaxed px-2">
                                {currentQuestion}
                            </p>

                            {isRatingQuestion ? (
                                <div className="py-4">
                                    <StarRating
                                        value={parseInt(responses[currentIndex]) || 0}
                                        onChange={handleRatingChange}
                                        disabled={isSubmitting}
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground mt-2 px-4">
                                        <span>Nada</span>
                                        <span>Mucho</span>
                                    </div>
                                </div>
                            ) : (
                                <textarea
                                    className="w-full min-h-[100px] p-3 rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
                                    placeholder="Tu opinión nos ayuda a mejorar... (opcional)"
                                    value={responses[currentIndex]}
                                    onChange={(e) => handleTextChange(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            )}
                        </div>

                        {/* Navigation buttons */}
                        <div className="flex justify-between items-center pt-6 border-t border-border mt-6">
                            <Button
                                variant="ghost"
                                onClick={handlePrevious}
                                disabled={isFirstQuestion || isSubmitting}
                                className="gap-1"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Anterior
                            </Button>

                            <Button
                                onClick={handleNext}
                                disabled={(isRatingQuestion && !isCurrentAnswered()) || isSubmitting}
                                className="gap-1"
                            >
                                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isLastQuestion ? (
                                    'Enviar'
                                ) : (
                                    <>
                                        Siguiente
                                        <ChevronRight className="w-4 h-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
