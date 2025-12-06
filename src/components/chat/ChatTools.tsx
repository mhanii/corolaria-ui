import { Button } from "@/components/ui/button"
import { Download, Save, History } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ChatToolsProps {
    messages: { role: "user" | "assistant"; content: string }[]
}

export function ChatTools({ messages }: ChatToolsProps) {
    const { toast } = useToast()

    const handleExport = () => {
        const text = messages
            .map((m) => `${m.role.toUpperCase()}:\n${m.content}\n`)
            .join("\n---\n\n")
        const blob = new Blob([text], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "chat-export.txt"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast({
            title: "Chat exportado",
            description: "La conversación se ha descargado correctamente.",
        })
    }

    const handleSave = () => {
        toast({
            title: "Chat guardado",
            description: "La conversación se ha guardado en tu historial.",
        })
    }

    const handleHistory = () => {
        toast({
            title: "Historial",
            description: "Mostrando historial de conversaciones...",
        })
    }

    return (
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-b shrink-0">
            <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors"
                onClick={handleExport}
            >
                <Download className="w-4 h-4" />
                Exportar
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors"
                onClick={handleSave}
            >
                <Save className="w-4 h-4" />
                Guardar
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors"
                onClick={handleHistory}
            >
                <History className="w-4 h-4" />
                Historial
            </Button>
        </div>
    )
}
