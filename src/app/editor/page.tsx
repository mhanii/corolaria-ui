'use client'

import { EditorToolbar } from "@/components/editor/EditorToolbar"
import { EditorContent } from "@/components/editor/EditorContent"
import { EditorSidebar } from "@/components/editor/EditorSidebar"
import { useEditor } from "@/hooks/useEditor"
import { useState } from "react"

export default function EditorPage() {
    const { editor, isSaving, saveContent, exportToPDF, exportToDOCX } = useEditor()
    const [showAI, setShowAI] = useState(false)

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
