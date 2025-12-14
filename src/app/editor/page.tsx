'use client'

import { EditorToolbar } from "@/components/editor/EditorToolbar"
import { EditorContent } from "@/components/editor/EditorContent"
import { EditorSidebar } from "@/components/editor/EditorSidebar"
import { useEditor } from "@/hooks/useEditor"
import { useState, useEffect } from "react"
import { Monitor, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function EditorPage() {
    const { editor, isSaving, saveContent, exportToPDF, exportToDOCX } = useEditor()
    const [showAI, setShowAI] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Show mobile not supported message
    if (isMobile) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] px-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
                    <Monitor className="w-8 h-8 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-display font-bold text-foreground mb-3">
                    Editor no disponible
                </h1>
                <p className="text-muted-foreground mb-6 max-w-sm">
                    El editor de documentos requiere una pantalla más grande. Por favor, accede desde un ordenador para usar esta función.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/chat">
                        <Button className="w-full">
                            Ir al Chat
                        </Button>
                    </Link>
                    <Link href="/buscador">
                        <Button variant="outline" className="w-full">
                            Ir al Buscador
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <EditorToolbar
                editor={editor}
                onSave={() => saveContent()}
                onAIAssistant={() => setShowAI(!showAI)}
                onExportPDF={exportToPDF}
                onExportDOCX={exportToDOCX}
                isSaving={isSaving}
            />
            <div className="flex flex-1 overflow-hidden">
                <EditorContent
                    editor={editor}
                    showAI={showAI}
                    onCloseAI={() => setShowAI(false)}
                />
                <EditorSidebar />
            </div>
        </div>
    )
}
