'use client'

import { Editor } from '@tiptap/react'
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Undo, Redo, Save, FileDown, Sparkles, Check, FileText
} from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FontSelector } from './FontSelector'
import { ColorPicker } from './ColorPicker'
import { cn } from '@/lib/utils'
import { uiConfig } from '@/config/uiConfig'

interface EditorToolbarProps {
    editor: Editor | null
    onSave: () => void
    onAIAssistant: () => void
    onExportPDF: () => Promise<void>
    onExportDOCX: () => Promise<void>
    isSaving: boolean
}

export function EditorToolbar({ editor, onSave, onAIAssistant, onExportPDF, onExportDOCX, isSaving }: EditorToolbarProps) {
    if (!editor) {
        return null
    }

    const setHeading = (level: number) => {
        if (level === 0) {
            editor.chain().focus().setParagraph().run()
        } else {
            editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run()
        }
    }

    const getActiveHeading = () => {
        if (editor.isActive('heading', { level: 1 })) return '1'
        if (editor.isActive('heading', { level: 2 })) return '2'
        if (editor.isActive('heading', { level: 3 })) return '3'
        return '0'
    }

    return (
        <div className="flex items-center gap-1 p-2 border-b bg-card flex-wrap">
            {/* Heading Selector */}
            <Select value={getActiveHeading()} onValueChange={(val) => setHeading(Number(val))}>
                <SelectTrigger className="w-[100px] h-8 text-xs">
                    <SelectValue placeholder="Texto" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="0">Normal</SelectItem>
                    <SelectItem value="1" className="text-2xl font-bold">Título 1</SelectItem>
                    <SelectItem value="2" className="text-xl font-bold">Título 2</SelectItem>
                    <SelectItem value="3" className="text-lg font-bold">Título 3</SelectItem>
                </SelectContent>
            </Select>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Font Selector */}
            <FontSelector editor={editor} />

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                >
                    <Undo className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                >
                    <Redo className="h-4 w-4" />
                </Button>
            </div>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Text Formatting */}
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive('bold') && "bg-accent text-accent-foreground")}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <Bold className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive('italic') && "bg-accent text-accent-foreground")}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <Italic className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive('underline') && "bg-accent text-accent-foreground")}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                    <Underline className="h-4 w-4" />
                </Button>
            </div>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Color Picker */}
            <ColorPicker editor={editor} />

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Text Alignment */}
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive({ textAlign: 'left' }) && "bg-accent text-accent-foreground")}
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                >
                    <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive({ textAlign: 'center' }) && "bg-accent text-accent-foreground")}
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                >
                    <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive({ textAlign: 'right' }) && "bg-accent text-accent-foreground")}
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                >
                    <AlignRight className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive({ textAlign: 'justify' }) && "bg-accent text-accent-foreground")}
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                >
                    <AlignJustify className="h-4 w-4" />
                </Button>
            </div>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Lists */}
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive('bulletList') && "bg-accent text-accent-foreground")}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    <List className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive('orderedList') && "bg-accent text-accent-foreground")}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    <ListOrdered className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1" />

            {/* AI Assistant */}
            {uiConfig.editor.aiFeatures && (
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-accent/30 hover:bg-accent/10"
                    onClick={onAIAssistant}
                >
                    <Sparkles className="h-4 w-4 text-accent" />
                    <span className="hidden sm:inline">IA</span>
                </Button>
            )}

            {/* Save Button */}
            <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={onSave}
                disabled={isSaving}
            >
                {isSaving ? (
                    <Check className="h-4 w-4 text-success" />
                ) : (
                    <Save className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{isSaving ? 'Guardado' : 'Guardar'}</span>
            </Button>

            {/* Export Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="sm" className="gap-2">
                        <FileDown className="h-4 w-4" />
                        <span className="hidden sm:inline">Exportar</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onExportPDF}>
                        <FileText className="h-4 w-4 mr-2" />
                        Exportar como PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onExportDOCX}>
                        <FileText className="h-4 w-4 mr-2" />
                        Exportar como DOCX
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

