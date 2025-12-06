'use client'

import { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { AVAILABLE_FONTS } from '@/lib/fonts'

interface FontSelectorProps {
    editor: Editor | null
}

export function FontSelector({ editor }: FontSelectorProps) {
    if (!editor) return null

    const currentFont = editor.getAttributes('textStyle').fontFamily || 'Inter'

    const handleFontChange = (fontName: string) => {
        editor.chain().focus().setFontFamily(fontName).run()
    }

    const fontsByCategory = {
        'sans-serif': AVAILABLE_FONTS.filter(f => f.category === 'sans-serif'),
        'serif': AVAILABLE_FONTS.filter(f => f.category === 'serif'),
        'monospace': AVAILABLE_FONTS.filter(f => f.category === 'monospace'),
    }

    return (
        <Select value={currentFont} onValueChange={handleFontChange}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Fuente" />
            </SelectTrigger>
            <SelectContent>
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                    Sans Serif
                </div>
                {fontsByCategory['sans-serif'].map((font) => (
                    <SelectItem
                        key={font.name}
                        value={font.name}
                        style={{ fontFamily: font.name }}
                    >
                        {font.displayName}
                    </SelectItem>
                ))}

                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-2">
                    Serif
                </div>
                {fontsByCategory['serif'].map((font) => (
                    <SelectItem
                        key={font.name}
                        value={font.name}
                        style={{ fontFamily: font.name }}
                    >
                        {font.displayName}
                    </SelectItem>
                ))}

                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-2">
                    Monospace
                </div>
                {fontsByCategory['monospace'].map((font) => (
                    <SelectItem
                        key={font.name}
                        value={font.name}
                        style={{ fontFamily: font.name }}
                    >
                        {font.displayName}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
