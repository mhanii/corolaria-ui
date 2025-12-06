'use client'

import { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { PRESET_COLORS } from '@/lib/fonts'
import { Palette } from 'lucide-react'

interface ColorPickerProps {
    editor: Editor | null
}

export function ColorPicker({ editor }: ColorPickerProps) {
    if (!editor) return null

    const currentColor = editor.getAttributes('textStyle').color || '#000000'

    const handleColorChange = (color: string) => {
        editor.chain().focus().setColor(color).run()
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                    <Palette className="h-4 w-4" />
                    <div
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded"
                        style={{ backgroundColor: currentColor }}
                    />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
                <div className="space-y-3">
                    <h4 className="font-medium text-sm">Color de texto</h4>
                    <div className="grid grid-cols-6 gap-2">
                        {PRESET_COLORS.map((color) => (
                            <button
                                key={color.value}
                                className="w-8 h-8 rounded border-2 border-border hover:scale-110 transition-transform"
                                style={{ backgroundColor: color.value }}
                                onClick={() => handleColorChange(color.value)}
                                title={color.name}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t">
                        <label className="text-xs text-muted-foreground">Personalizado:</label>
                        <input
                            type="color"
                            value={currentColor}
                            onChange={(e) => handleColorChange(e.target.value)}
                            className="w-12 h-8 rounded border cursor-pointer"
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
