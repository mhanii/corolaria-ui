"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface DirectoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreateDirectory: (name: string) => void
}

export function DirectoryDialog({ open, onOpenChange, onCreateDirectory }: DirectoryDialogProps) {
    const [directoryName, setDirectoryName] = useState("")

    const handleCreate = () => {
        if (directoryName.trim()) {
            onCreateDirectory(directoryName.trim())
            setDirectoryName("")
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Directorio</DialogTitle>
                    <DialogDescription>
                        Ingresa un nombre para el nuevo directorio donde organizarás tus chats.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Input
                        id="name"
                        placeholder="Nombre del directorio..."
                        value={directoryName}
                        onChange={(e) => setDirectoryName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleCreate()
                            }
                        }}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleCreate} disabled={!directoryName.trim()}>
                        Crear
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
