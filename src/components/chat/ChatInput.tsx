"use client"

import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CornerDownLeft, Paperclip, Image, FileText } from "lucide-react"

interface ChatInputProps {
    onSendMessage: (message: string) => void
    message: string
    setMessage: (message: string) => void
}

export function ChatInput({ onSendMessage, message, setMessage }: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

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

    return (
        <div className="flex flex-col border border-border rounded-2xl shadow-lg bg-card focus-within:ring-1 focus-within:ring-ring transition-all">
            <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu consulta legal aquí..."
                className="min-h-[60px] max-h-[200px] w-[calc(100%-1.5rem)] mx-3 mt-3 resize-none border-0 shadow-none focus-visible:ring-0 bg-muted/50 rounded-xl p-4 text-foreground placeholder:text-muted-foreground overflow-y-auto font-mono"
            />

            <div className="flex items-center justify-between p-2 pl-3">
                <div className="flex items-center gap-1">
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files?.length) {
                                console.log("File selected:", e.target.files[0].name)
                                // TODO: Implement actual file upload
                            }
                        }}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-muted/50 transition-colors"
                        onClick={() => document.getElementById("file-upload")?.click()}
                    >
                        <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-muted/50 transition-colors"
                        onClick={() => document.getElementById("file-upload")?.click()}
                    >
                        <Image className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-muted/50 transition-colors"
                        onClick={() => document.getElementById("file-upload")?.click()}
                    >
                        <FileText className="h-4 w-4" />
                    </Button>
                </div>

                <Button
                    onClick={handleSend}
                    disabled={!message.trim()}
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-sm font-medium transition-all hover:bg-accent/10 hover:text-accent"
                >
                    Mandar
                    <CornerDownLeft className="w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
    )
}
