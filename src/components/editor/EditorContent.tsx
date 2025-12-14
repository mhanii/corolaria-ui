'use client'

import { EditorContent as TiptapEditorContent } from '@tiptap/react'
import { Editor } from '@tiptap/react'
import { AIAssistant } from './AIAssistant'
import { uiConfig } from "@/config/uiConfig"
import { LogoLoader } from "@/components/ui/Logo"

interface EditorContentProps {
    editor: Editor | null
    showAI: boolean
    onCloseAI: () => void
}

export function EditorContent({ editor, showAI, onCloseAI }: EditorContentProps) {
    if (!editor) {
        return <div className="flex-1 bg-muted/20 p-8 overflow-y-auto flex items-center justify-center">
            <LogoLoader text="Cargando editor..." />
        </div>
    }

    return (
        <>
            <div className="flex-1 bg-muted/20 p-8 overflow-y-auto max-h-[85vh]">
                <div className="max-w-[850px] min-h-[1000px] mx-auto bg-white dark:bg-card shadow-sm border p-12">
                    <TiptapEditorContent
                        editor={editor}
                        className="tiptap-editor outline-none"
                    />
                </div>
            </div>

            {uiConfig.editor.aiFeatures && (
                <AIAssistant
                    isOpen={showAI}
                    onClose={onCloseAI}
                    editorContent={editor.getHTML()}
                />
            )}
        </>
    )
}
