'use client'

import { useEditor as useTiptapEditor, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { FontFamily } from '@tiptap/extension-font-family'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import CharacterCount from '@tiptap/extension-character-count'
import { useEffect, useState } from 'react'
import { exportToPDF, exportToDOCX } from '@/lib/ExportUtils'

const STORAGE_KEY = 'athen-editor-content'

const defaultContent = `
<h1>Contrato de Arrendamiento de Vivienda</h1>
<p>En Madrid, a 26 de Noviembre de 2025.</p>
<h2>REUNIDOS</h2>
<p>De una parte, D. Juan Pérez, mayor de edad, con DNI... en adelante el ARRENDADOR.</p>
<p>Y de otra, Dña. María García, mayor de edad, con DNI... en adelante el ARRENDATARIO.</p>
<h2>EXPONEN</h2>
<p>Que ambas partes se reconocen capacidad legal suficiente para el otorgamiento del presente contrato...</p>
`.trim()

export function useEditor() {
    const [isSaving, setIsSaving] = useState(false)

    const editor = useTiptapEditor({
        immediatelyRender: false, // Required for Next.js SSR to avoid hydration mismatches
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4, 5, 6],
                },
            }),
            Underline,
            TextStyle,
            FontFamily.configure({
                types: ['textStyle'],
            }),
            Color.configure({
                types: ['textStyle'],
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                alignments: ['left', 'center', 'right', 'justify'],
            }),
            Placeholder.configure({
                placeholder: 'Comienza a escribir tu documento legal...',
            }),
            Highlight.configure({
                multicolor: true,
            }),
            Typography,
            CharacterCount,
        ],
        content: defaultContent, // Use default content initially
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none max-w-none',
            },
        },
        onUpdate: ({ editor }) => {
            // Auto-save on content change (debounced)
            if (typeof window !== 'undefined') {
                const timeoutId = setTimeout(() => {
                    saveContent(editor)
                }, 1000) // Save after 1 second of inactivity

                return () => clearTimeout(timeoutId)
            }
        },
    })

    // Load saved content after mount (client-side only)
    useEffect(() => {
        if (editor && typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                console.log('📂 Content loaded from localStorage')
                editor.commands.setContent(saved)
            }
        }
    }, [editor])

    const saveContent = (editorInstance?: Editor | null) => {
        const activeEditor = editorInstance || editor
        if (!activeEditor) return

        setIsSaving(true)
        const content = activeEditor.getHTML()

        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, content)
            console.log('💾 Content saved to localStorage')
        }

        setTimeout(() => setIsSaving(false), 500)
    }

    const clearContent = () => {
        if (editor) {
            editor.commands.setContent(defaultContent)
            saveContent(editor)
        }
    }

    const handleExportToPDF = async () => {
        try {
            await exportToPDF(editor, 'documento.pdf')
        } catch (error) {
            console.error('Failed to export PDF:', error)
        }
    }

    const handleExportToDOCX = async () => {
        try {
            await exportToDOCX(editor, 'documento.docx')
        } catch (error) {
            console.error('Failed to export DOCX:', error)
        }
    }

    return {
        editor,
        isSaving,
        saveContent,
        clearContent,
        exportToPDF: handleExportToPDF,
        exportToDOCX: handleExportToDOCX,
    }
}
