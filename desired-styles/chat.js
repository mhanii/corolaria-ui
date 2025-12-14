import { useState } from "react";
import { CornerDownLeft, Sparkles, FileText, Search, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Message = {
    role: "user" | "assistant";
    content: string;
};

export const ChatTab = () => {
    const [messages, setMessages] = useState < Message[] > ([
        {
            role: "assistant",
            content: "¡Hola! Soy tu asistente legal de Athen. ¿En qué puedo ayudarte hoy?",
        },
    ]);
    const [input, setInput] = useState("");

    const suggestions = [
        { icon: FileText, text: "Redactar un contrato de arrendamiento" },
        { icon: Search, text: "Buscar jurisprudencia sobre despidos" },
        { icon: Scale, text: "Analizar un documento legal" },
    ];

    const handleSend = () => {
        if (!input.trim()) return;

        setMessages([...messages, { role: "user", content: input }]);
        setInput("");

        // Simulate AI response
        setTimeout(() => {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Entiendo tu consulta. Déjame ayudarte con eso...",
                },
            ]);
        }, 1000);
    };

    return (
        <div className="h-full flex flex-col max-w-5xl mx-auto">
            {messages.length === 1 && (
                <div className="mb-6">
                    <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                        ¿Cómo puedo asistirte?
                    </h2>
                    <p className="text-muted-foreground mb-6">
                        Selecciona una sugerencia o escribe tu consulta legal
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {suggestions.map((suggestion, idx) => (
                            <Card
                                key={idx}
                                className="p-4 cursor-pointer hover:shadow-medium hover:border-accent transition-smooth group"
                                onClick={() => setInput(suggestion.text)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-smooth">
                                        <suggestion.icon className="w-5 h-5 text-accent" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground flex-1">
                                        {suggestion.text}
                                    </p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            <ScrollArea className="flex-1 pr-4">
                <div className="space-y-6">
                    {messages.map((message, idx) => (
                        <div
                            key={idx}
                            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"
                                }`}
                        >
                            {message.role === "assistant" && (
                                <Avatar className="w-8 h-8 bg-gradient-primary shadow-accent">
                                    <AvatarFallback className="bg-transparent text-primary-foreground">
                                        <Sparkles className="w-4 h-4" />
                                    </AvatarFallback>
                                </Avatar>
                            )}

                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-soft ${message.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-card border border-border"
                                    }`}
                            >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {message.content}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <div className="mt-6 relative">
                <Textarea
                    placeholder="Escribe tu consulta legal aquí..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    className="min-h-[80px] pr-32 resize-none shadow-soft"
                />
                <Button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    variant="ghost"
                    className="absolute bottom-3 right-3 gap-1.5 text-sm font-medium hover:bg-muted"
                >
                    Mandar
                    <CornerDownLeft className="w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
    );
};
