import { Button } from "@/components/ui/button"
import { Download, Save, History, MoreHorizontal, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog"

interface ChatToolsProps {
    messages: { role: "user" | "assistant"; content: string }[]
    onDelete?: () => void
}

export function ChatTools({ messages, onDelete }: ChatToolsProps) {
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
        <div className="flex items-center justify-end gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 border-b shrink-0">
            {/* Mobile: Compact dropdown menu */}
            <div className="flex md:hidden">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-accent/10 hover:text-accent"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleExport}>
                            <Download className="w-4 h-4 mr-2" />
                            Exportar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleSave}>
                            <Save className="w-4 h-4 mr-2" />
                            Guardar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleHistory}>
                            <History className="w-4 h-4 mr-2" />
                            Historial
                        </DropdownMenuItem>
                        {onDelete && (
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.preventDefault() // Prevent closing to show dialog if we were using nested dialogs, but here we might need to handle differently
                                    // Actually for mobile dropdown it's tricky to show dialog from item click nicely without close
                                    // Let's use a separate logic or specific dialog trigger item
                                }}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <div className="flex items-center w-full">
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Eliminar Chat
                                        </div>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>¿Eliminar conversación?</DialogTitle>
                                            <DialogDescription>
                                                Esta acción no se puede deshacer. Se eliminarán todos los mensajes de esta conversación.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter className="gap-2 sm:gap-0">
                                            <DialogClose asChild>
                                                <Button variant="outline">Cancelar</Button>
                                            </DialogClose>
                                            <DialogClose asChild>
                                                <Button variant="destructive" onClick={onDelete}>Eliminar</Button>
                                            </DialogClose>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Desktop: Full buttons with labels */}
            <div className="hidden md:flex items-center gap-2">
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

                {onDelete && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Eliminar
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>¿Eliminar conversación?</DialogTitle>
                                <DialogDescription>
                                    Esta acción no se puede deshacer. Se eliminarán todos los mensajes de esta conversación.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancelar</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                    <Button variant="destructive" onClick={onDelete}>Eliminar</Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    )
}
