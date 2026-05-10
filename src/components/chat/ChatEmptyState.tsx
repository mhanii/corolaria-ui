import { forwardRef } from "react"
import { Card } from "@/components/ui/card"
import { ChatInput, type ChatInputHandle } from "./ChatInput"
import { Search, Scale, FileText } from "lucide-react"

interface ChatEmptyStateProps {
    onSendMessage: (content: string, file?: File | null) => Promise<void>
    mode: 'workflow' | 'agent'
    onModeChange: (mode: 'workflow' | 'agent') => void
}

const suggestions = [
    { icon: Search, text: "¿Qué dice la ley sobre el despido improcedente?" },
    { icon: Scale, text: "Explícame los derechos de los inquilinos" },
    { icon: FileText, text: "¿Cuál es la diferencia entre denuncia y querella?" },
]

export const ChatEmptyState = forwardRef<ChatInputHandle, ChatEmptyStateProps>(
    function ChatEmptyState({ onSendMessage, mode, onModeChange }, ref) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center w-full pb-20">
                <div className="w-full space-y-8 px-4 md:px-6 flex flex-col items-center">
                    <div className="text-center space-y-6 mb-8">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient leading-tight px-4">
                            ¿En qué puedo ayudarte hoy?
                        </h1>
                    </div>

                    <div className="w-full mb-8">
                        <ChatInput
                            ref={ref}
                            onSendMessage={onSendMessage}
                            mode={mode}
                            onModeChange={onModeChange}
                            isNewConversation={true}
                        />
                    </div>

                    {/* Desktop: Grid layout */}
                    <div className="hidden md:grid md:grid-cols-3 gap-3 w-full">
                        {suggestions.map((suggestion, idx) => (
                            <Card
                                key={idx}
                                className="p-4 cursor-pointer hover:shadow-md hover:border-accent/50 transition-all duration-300 group bg-card/50"
                                onClick={() => onSendMessage(suggestion.text)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors flex-shrink-0">
                                        <suggestion.icon className="w-5 h-5 text-accent" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground leading-tight">
                                        {suggestion.text}
                                    </p>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Mobile: 2+1 grid layout with consistent box sizes */}
                    <div className="md:hidden flex flex-col gap-2 w-full">
                        <div className="grid grid-cols-2 gap-2">
                            {suggestions.slice(0, 2).map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    className="flex items-center gap-2 px-3 py-2.5 h-14 rounded-lg border border-border bg-card/50 hover:bg-accent/10 hover:border-accent/50 transition-all text-left"
                                    onClick={() => onSendMessage(suggestion.text)}
                                >
                                    <suggestion.icon className="w-4 h-4 text-accent flex-shrink-0" />
                                    <span className="text-xs font-medium text-foreground line-clamp-2">{suggestion.text}</span>
                                </button>
                            ))}
                        </div>
                        {/* Centered third suggestion */}
                        <div className="flex justify-center">
                            {(() => {
                                const ThirdIcon = suggestions[2].icon;
                                return (
                                    <button
                                        className="flex items-center gap-2 px-3 py-2.5 h-14 w-1/2 rounded-lg border border-border bg-card/50 hover:bg-accent/10 hover:border-accent/50 transition-all text-left justify-center"
                                        onClick={() => onSendMessage(suggestions[2].text)}
                                    >
                                        <ThirdIcon className="w-4 h-4 text-accent flex-shrink-0" />
                                        <span className="text-xs font-medium text-foreground line-clamp-2">{suggestions[2].text}</span>
                                    </button>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
)
