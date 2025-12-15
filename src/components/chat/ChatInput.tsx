"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CornerDownLeft, Paperclip } from "lucide-react"

interface ChatInputProps {
    onSendMessage: (message: string) => void
    message: string
    setMessage: (message: string) => void
    collectorType?: 'rag' | 'qrag' | 'agent'
    onCollectorTypeChange?: (type: 'rag' | 'qrag' | 'agent') => void
    isNewConversation?: boolean
}

export function ChatInput({
    onSendMessage,
    message,
    setMessage,
    collectorType = 'rag',
    onCollectorTypeChange,
    isNewConversation = false
}: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [isQualityExpanded, setIsQualityExpanded] = useState(false)

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [message])

    const handleSend = () => {
        if (message.trim()) {
            onSendMessage(message.trim())
            setMessage("")
            // Reset height
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto"
            }
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const getCollectorLabel = (type: 'rag' | 'qrag' | 'agent') => {
        switch (type) {
            case 'rag':
                return 'Mid'
            case 'qrag':
                return 'Alto'
            case 'agent':
                return 'MAX'
        }
    }

    return (
        <div className="flex flex-col border border-border rounded-2xl shadow-lg bg-card focus-within:ring-1 focus-within:ring-ring transition-all">
            <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu consulta legal aquí..."
                className="min-h-[50px] md:min-h-[60px] max-h-[150px] md:max-h-[200px] w-[calc(100%-1rem)] md:w-[calc(100%-1.5rem)] mx-2 md:mx-3 mt-2 md:mt-3 resize-none border-0 shadow-none focus-visible:ring-0 bg-muted/50 rounded-xl p-3 md:p-4 text-sm md:text-base text-foreground placeholder:text-muted-foreground overflow-y-auto font-mono"
                data-tour-id="chat-input"
            />


            <div className="flex items-center justify-between p-2 pl-2 md:pl-3">
                <div className="flex items-center gap-2">
                    {/* File attachment button - disabled with tooltip */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground/50 cursor-not-allowed"
                                    disabled
                                >
                                    <Paperclip className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <p>Disponible pronto</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* Quality Selector - Expandable */}
                    {isNewConversation && onCollectorTypeChange && (
                        <div
                            data-tour-id="quality-selector"
                            className={`flex items-center overflow-hidden bg-muted/30 border border-border/50 rounded-lg transition-all duration-500 ease-in-out ${isQualityExpanded ? "max-w-[350px]" : "max-w-[140px]"}`}
                        >
                            <div className="p-1 w-full h-full flex items-center">
                                {!isQualityExpanded ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsQualityExpanded(true)}
                                        className="h-7 text-xs font-medium text-muted-foreground hover:text-accent hover:bg-muted/50 transition-colors px-2 w-full justify-start md:justify-center whitespace-nowrap"
                                    >
                                        Calidad: {getCollectorLabel(collectorType)}
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-300">
                                        <span className="text-xs font-medium text-muted-foreground ml-2 mr-1 whitespace-nowrap">Calidad:</span>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => { onCollectorTypeChange('rag'); setIsQualityExpanded(false); }}
                                            className={`h-7 px-2 text-xs transition-colors ${collectorType === 'rag' ? 'bg-accent/20 text-accent hover:bg-accent/40 hover:text-accent' : 'hover:bg-muted hover:text-accent text-muted-foreground'}`}
                                        >
                                            Mid
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => { onCollectorTypeChange('qrag'); setIsQualityExpanded(false); }}
                                            className={`h-7 px-2 text-xs transition-colors ${collectorType === 'qrag' ? 'bg-accent/20 text-accent hover:bg-accent/40 hover:text-accent' : 'hover:bg-muted hover:text-accent text-muted-foreground'}`}
                                        >
                                            Alto
                                        </Button>

                                        {/* MAX option with gradient */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => { onCollectorTypeChange('agent'); setIsQualityExpanded(false); }}
                                            className={`h-7 px-2 text-xs font-bold transition-colors ${collectorType === 'agent' ? 'bg-accent/20 hover:bg-accent/40' : 'hover:bg-muted hover:text-accent'}`}
                                        >
                                            <span className="inline-block bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text !text-transparent">
                                                MAX
                                            </span>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <Button
                    onClick={handleSend}
                    disabled={!message.trim()}
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-sm font-medium transition-all hover:bg-accent/10 hover:text-accent"
                    data-tour-id="send-button"
                >
                    Mandar
                    <CornerDownLeft className="w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
    )
}
