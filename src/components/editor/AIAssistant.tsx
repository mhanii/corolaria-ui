'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, X, Loader2 } from 'lucide-react'
import { generateAISuggestion, type AISuggestion } from '@/lib/aiHelpers'

interface AIAssistantProps {
    isOpen: boolean
    onClose: () => void
    editorContent: string
}

export function AIAssistant({ isOpen, onClose, editorContent }: AIAssistantProps) {
    const [suggestion, setSuggestion] = useState<AISuggestion | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (isOpen && !suggestion) {
            loadSuggestion()
        }
    }, [isOpen])

    const loadSuggestion = async () => {
        setIsLoading(true)
        try {
            const newSuggestion = await generateAISuggestion(editorContent)
            setSuggestion(newSuggestion)
        } catch (error) {
            console.error('Error loading AI suggestion:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleRefresh = () => {
        setSuggestion(null)
        loadSuggestion()
    }

    if (!isOpen) return null

    return (
        <div className="fixed bottom-20 right-8 z-50 w-96 animate-in slide-in-from-bottom-5">
            <Card className="shadow-strong border-accent/20">
                <div className="flex items-center justify-between p-4 border-b bg-gradient-accent">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-white" />
                        <h3 className="font-semibold text-white">Asistente IA Athen</h3>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-white hover:bg-white/20"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="p-4 space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-accent" />
                            <span className="ml-2 text-sm text-muted-foreground">Analizando documento...</span>
                        </div>
                    ) : suggestion ? (
                        <>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-accent uppercase">
                                        {suggestion.type === 'improvement' && '✨ Mejora Sugerida'}
                                        {suggestion.type === 'grammar' && '📝 Gramática'}
                                        {suggestion.type === 'style' && '🎨 Estilo'}
                                        {suggestion.type === 'autocomplete' && '⚡ Autocompletar'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {Math.round(suggestion.confidence * 100)}% confianza
                                    </span>
                                </div>

                                <p className="text-sm text-foreground leading-relaxed">
                                    {suggestion.suggestion}
                                </p>

                                <p className="text-xs text-muted-foreground italic">
                                    {suggestion.explanation}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => {
                                        console.log('✅ AI suggestion accepted')
                                        onClose()
                                    }}
                                >
                                    Aceptar
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={handleRefresh}
                                >
                                    Otra sugerencia
                                </Button>
                            </div>
                        </>
                    ) : null}
                </div>

                <div className="px-4 pb-4">
                    <p className="text-xs text-muted-foreground text-center">
                        💡 Función de demostración. Conecta con OpenAI o Gemini para sugerencias reales.
                    </p>
                </div>
            </Card>
        </div>
    )
}
