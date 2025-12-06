export interface Font {
    name: string
    displayName: string
    category: 'serif' | 'sans-serif' | 'monospace'
    googleFont?: boolean
}

export const AVAILABLE_FONTS: Font[] = [
    // System Fonts
    { name: 'Arial', displayName: 'Arial', category: 'sans-serif' },
    { name: 'Times New Roman', displayName: 'Times New Roman', category: 'serif' },
    { name: 'Courier New', displayName: 'Courier New', category: 'monospace' },

    // Google Fonts - Professional Legal Document Fonts
    { name: 'Inter', displayName: 'Inter', category: 'sans-serif', googleFont: true },
    { name: 'Roboto', displayName: 'Roboto', category: 'sans-serif', googleFont: true },
    { name: 'Merriweather', displayName: 'Merriweather', category: 'serif', googleFont: true },
    { name: 'Playfair Display', displayName: 'Playfair Display', category: 'serif', googleFont: true },
    { name: 'Lora', displayName: 'Lora', category: 'serif', googleFont: true },
    { name: 'Crimson Text', displayName: 'Crimson Text', category: 'serif', googleFont: true },
    { name: 'Source Sans 3', displayName: 'Source Sans 3', category: 'sans-serif', googleFont: true },
    { name: 'Libre Baskerville', displayName: 'Libre Baskerville', category: 'serif', googleFont: true },
]

export const FONT_SIZES = [
    { value: '12px', label: '12' },
    { value: '14px', label: '14' },
    { value: '16px', label: '16' },
    { value: '18px', label: '18' },
    { value: '20px', label: '20' },
    { value: '24px', label: '24' },
    { value: '28px', label: '28' },
    { value: '32px', label: '32' },
    { value: '36px', label: '36' },
]

export const PRESET_COLORS = [
    { name: 'Black', value: '#000000' },
    { name: 'Dark Gray', value: '#374151' },
    { name: 'Gray', value: '#6B7280' },
    { name: 'Primary', value: 'hsl(221, 45%, 22%)' },
    { name: 'Accent', value: 'hsl(35, 40%, 50%)' },
    { name: 'Success', value: 'hsl(174, 42%, 45%)' },
    { name: 'Red', value: '#DC2626' },
    { name: 'Orange', value: '#EA580C' },
    { name: 'Yellow', value: '#D97706' },
    { name: 'Green', value: '#059669' },
    { name: 'Blue', value: '#2563EB' },
    { name: 'Purple', value: '#7C3AED' },
]
