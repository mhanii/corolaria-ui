import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CornerDownLeft, Paperclip, FileText, X } from "lucide-react"

export interface ChatInputHandle {
    setValue: (value: string) => void
    focus: () => void
}

interface ChatInputProps {
    onSendMessage: (message: string, file?: File | null) => void
    mode?: 'workflow' | 'agent'
    onModeChange?: (mode: 'workflow' | 'agent') => void
    isNewConversation?: boolean
}

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(function ChatInput({
    onSendMessage,
    mode = 'agent',
    onModeChange,
    isNewConversation = false
}: ChatInputProps, ref) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [localMessage, setLocalMessage] = useState("")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isQualityExpanded, setIsQualityExpanded] = useState(false)

    useImperativeHandle(ref, () => ({
        setValue: (value: string) => {
            setLocalMessage(value)
        },
        focus: () => {
            textareaRef.current?.focus()
        }
    }))

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [localMessage])

    const handleSend = () => {
        if (localMessage.trim() || selectedFile) {
            onSendMessage(localMessage.trim(), selectedFile)
            setLocalMessage("")
            setSelectedFile(null)
            // Reset height
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto"
            }
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0])
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const getModeLabel = (m: 'workflow' | 'agent') => {
        switch (m) {
            case 'agent':
                return 'Agente'
            case 'workflow':
                return 'Investigación Profunda'
            default:
                return 'Agente'
        }
    }

    return (
        <div className="flex flex-col border border-border rounded-2xl shadow-lg bg-card focus-within:ring-1 focus-within:ring-ring transition-all overflow-hidden">
            {selectedFile && (
                <div className="flex items-center gap-2 px-3 py-2 bg-accent/5 border-b border-border text-xs text-accent font-medium animate-in slide-in-from-top-2 duration-200">
                    <FileText className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[160px] min-[380px]:max-w-[220px]">{selectedFile.name}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 ml-auto hover:bg-accent/10 hover:text-accent rounded-full"
                        onClick={() => setSelectedFile(null)}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}
            <Textarea
                ref={textareaRef}
                value={localMessage}
                onChange={(e) => setLocalMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu consulta legal aquí..."
                className="min-h-[56px] md:min-h-[60px] max-h-[160px] md:max-h-[200px] w-[calc(100%-1rem)] md:w-[calc(100%-1.5rem)] mx-2 md:mx-3 mt-2 md:mt-3 resize-none border-0 shadow-none focus-visible:ring-0 bg-muted/50 rounded-xl p-3 md:p-4 text-sm md:text-base text-foreground placeholder:text-muted-foreground overflow-y-auto"
                data-tour-id="chat-input"
            />


            <div className="flex items-end justify-between gap-2 p-2 pl-2 md:pl-3 pb-safe">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* File attachment button */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 text-muted-foreground hover:text-accent hover:bg-muted/50 transition-colors shrink-0"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Paperclip className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <p>Adjuntar PDF o DOCX</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,.docx"
                        className="hidden"
                    />

                    {/* Mode Selector — only shown for new conversations */}
                    {isNewConversation && onModeChange && (
                        <div
                            data-tour-id="quality-selector"
                            className={`flex items-center overflow-hidden bg-muted/30 border border-border/50 rounded-lg transition-all duration-300 ease-in-out min-w-0 ${isQualityExpanded ? "max-w-full min-[420px]:max-w-[360px]" : "max-w-[170px] min-[380px]:max-w-[190px]"}`}
                        >
                            <div className="p-1 w-full h-full flex items-center">
                                {!isQualityExpanded ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsQualityExpanded(true)}
                                        className="h-9 text-xs font-medium text-muted-foreground hover:text-accent hover:bg-muted/50 transition-colors px-2 w-full justify-start whitespace-nowrap"
                                    >
                                        Modo: {getModeLabel(mode)}
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-300 min-w-0">
                                        <span className="text-xs font-medium text-muted-foreground ml-2 mr-1 whitespace-nowrap hidden min-[400px]:inline">Modo:</span>

                                        {/* Agent — quick, reactive */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => { onModeChange('agent'); setIsQualityExpanded(false); }}
                                            className={`h-9 px-2 text-xs transition-colors whitespace-nowrap ${mode === 'agent' ? 'bg-accent/20 text-accent hover:bg-accent/40 hover:text-accent' : 'hover:bg-muted hover:text-accent text-muted-foreground'}`}
                                        >
                                            Agente
                                        </Button>

                                        {/* Workflow — deep research, gradient style */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => { onModeChange('workflow'); setIsQualityExpanded(false); }}
                                            className={`h-9 px-2 text-xs font-bold transition-colors whitespace-nowrap ${mode === 'workflow' ? 'bg-accent/20 hover:bg-accent/40' : 'hover:bg-muted hover:text-accent'}`}
                                        >
                                            <span className="inline-block bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text !text-transparent">
                                                <span className="hidden min-[460px]:inline">Investigación Profunda</span>
                                                <span className="min-[460px]:hidden">Profunda</span>
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
                    disabled={!localMessage.trim() && !selectedFile}
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 h-10 px-3 text-sm font-medium transition-all hover:bg-accent/10 hover:text-accent shrink-0"
                    data-tour-id="send-button"
                >
                    <span className="hidden min-[360px]:inline">Mandar</span>
                    <CornerDownLeft className="w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
    )
})
