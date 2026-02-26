"use client"

import { useState, useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { get } from "@/lib/api/client"
import { buildApiUrl } from "@/lib/api/config"
import { Loader2, AlertCircle, X, Copy, Download, Code, Eye, FileText, FileJson, FileType, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react"
import { cn } from "@/lib/utils"
// Import download libraries
import { saveAs } from "file-saver"
import { Document as DocxDocument, Packer, Paragraph, TextRun } from "docx"
import jsPDF from "jspdf"
import dynamic from "next/dynamic"

// Dynamically import PdfRenderer to avoid SSR issues (DOMMatrix not defined)
const PdfRenderer = dynamic(() => import("./PdfRenderer"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-[500px] w-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    )
})

interface ArtifactViewProps {
    artifactId: string | null
    isOpen?: boolean // Kept for interface compatibility but controlled by parent
    onClose: () => void
    title?: string
    className?: string
}

interface DocumentContent {
    id: string
    title: string
    current_version: {
        content: string
    }

}

// Simple Singleton Cache
const pdfCache = {
    content: null as string | null,
    url: null as string | null
}

export function ArtifactView({ artifactId, isOpen, onClose, title, className }: ArtifactViewProps) {
    const [content, setContent] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [docTitle, setDocTitle] = useState<string>(title || "")
    const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview')

    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [numPages, setNumPages] = useState<number>(0)
    const [pageNumber, setPageNumber] = useState<number>(1)
    const [scale, setScale] = useState<number>(1.5)

    const generatePdfDocument = (content: string): jsPDF => {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        })

        // Set font to Times New Roman
        doc.setFont("times", "normal")

        const pageWidth = 210
        const pageHeight = 297
        const margin = 20
        const contentWidth = pageWidth - (margin * 2)
        let y = margin

        const lineHeight = 5 // mm

        const lines = content.split('\n')

        const checkPageBreak = (height: number) => {
            if (y + height > pageHeight - margin) {
                doc.addPage()
                y = margin
                return true
            }
            return false
        }

        lines.forEach(line => {
            const trimmed = line.trim()

            if (trimmed.startsWith('# ')) {
                doc.setFont("times", "bold")
                doc.setFontSize(24)
                const text = trimmed.substring(2)
                const splitText = doc.splitTextToSize(text, contentWidth)
                checkPageBreak(splitText.length * 10 + 5)
                doc.text(splitText, margin, y + 8) // adjustment for baseline
                y += (splitText.length * 10) + 5
            } else if (trimmed.startsWith('## ')) {
                doc.setFont("times", "bold")
                doc.setFontSize(18)
                const text = trimmed.substring(3)
                const splitText = doc.splitTextToSize(text, contentWidth)
                checkPageBreak(splitText.length * 8 + 4)
                doc.text(splitText, margin, y + 6)
                y += (splitText.length * 8) + 4
            } else if (trimmed.startsWith('### ')) {
                doc.setFont("times", "bold")
                doc.setFontSize(14)
                const text = trimmed.substring(4)
                const splitText = doc.splitTextToSize(text, contentWidth)
                checkPageBreak(splitText.length * 7 + 3)
                doc.text(splitText, margin, y + 5)
                y += (splitText.length * 7) + 3
            } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                doc.setFont("times", "normal")
                doc.setFontSize(11)
                const text = "• " + trimmed.substring(2)
                const splitText = doc.splitTextToSize(text, contentWidth - 5)
                checkPageBreak(splitText.length * lineHeight)
                doc.text(splitText, margin + 5, y + 4)
                y += (splitText.length * lineHeight)
            } else if (trimmed === '') {
                y += 3
            } else {
                doc.setFont("times", "normal")
                doc.setFontSize(11)
                // Simple paragraph handling
                const splitText = doc.splitTextToSize(trimmed, contentWidth)
                checkPageBreak(splitText.length * lineHeight)
                doc.text(splitText, margin, y + 4)
                y += (splitText.length * lineHeight)
            }
        })

        return doc
    }

    // Generate PDF Blob URL when content changes (debounced)
    useEffect(() => {
        if (!content) return

        // Check cache first
        if (pdfCache.content === content && pdfCache.url) {
            setPdfUrl(pdfCache.url)
            return
        }

        const timer = setTimeout(() => {
            try {
                const doc = generatePdfDocument(content)
                const blob = doc.output('blob')
                const url = URL.createObjectURL(blob)

                // Cleanup old cache if exists and is different
                if (pdfCache.url && pdfCache.url !== url) {
                    URL.revokeObjectURL(pdfCache.url)
                }

                // Update cache
                pdfCache.content = content
                pdfCache.url = url

                setPdfUrl(url)
                setPageNumber(1) // Reset to page 1 on new content
            } catch (e) {
                console.error("Failed to generate PDF preview", e)
            }
        }, 500) // Debounce 500ms

        return () => clearTimeout(timer)
    }, [content])

    // Note: We deliberately removed the cleanup useEffect that revokes on unmount,
    // because we want to keep the URL in the global cache for reuse.

    useEffect(() => {
        if (artifactId) {
            loadDocument(artifactId)
        }
    }, [artifactId])

    // Update local title if prop changes
    useEffect(() => {
        if (title) setDocTitle(title)
    }, [title])

    const loadDocument = async (id: string) => {
        try {
            setLoading(true)
            setError(null)
            const endpoint = buildApiUrl(`documents/${id}`)
            const data = await get<DocumentContent>(endpoint)
            setContent(data.current_version.content)
            if (!title) setDocTitle(data.title)
        } catch (err: any) {
            console.error("Failed to load document:", err)
            setError(err.message || "No se pudo cargar el documento")
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = () => {
        if (content) {
            navigator.clipboard.writeText(content)
            // Could add toast here
        }
    }

    const handleDownload = async (format: 'md' | 'pdf' | 'docx') => {
        if (!content) return

        const fileName = docTitle || "documento"

        try {
            if (format === 'md') {
                const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
                saveAs(blob, `${fileName}.md`)
            } else if (format === 'docx') {
                // Better DOCX generation
                const sections = []
                const lines = content.split('\n')
                const currentList: any[] = []

                // transform markdown lines to docx paragraphs
                const kids: any[] = []

                lines.forEach(line => {
                    const trimmed = line.trim()

                    if (trimmed.startsWith('# ')) {
                        kids.push(new DocxDocument({
                            /* this part is slightly wrong in logic, kept from original but fixed type import */
                        } as any))
                        // Correction: recreating the logic properly
                        /* 
                           Logic was:
                           if heading... push new Paragraph
                         */
                    }
                    // The previous logic was simpler, let's just reuse the structure but fix the type import
                })

                // Re-implementing the loop cleanly to avoid the "any" mess from my thought process
                const docxLines = content.split('\n')
                const docxChildren: any[] = []

                docxLines.forEach(line => {
                    const trimmed = line.trim()
                    if (trimmed.startsWith('# ')) {
                        docxChildren.push(new Paragraph({
                            text: trimmed.substring(2),
                            heading: "Heading1",
                            spacing: { before: 240, after: 120 }
                        }))
                    } else if (trimmed.startsWith('## ')) {
                        docxChildren.push(new Paragraph({
                            text: trimmed.substring(3),
                            heading: "Heading2",
                            spacing: { before: 240, after: 120 }
                        }))
                    } else if (trimmed.startsWith('### ')) {
                        docxChildren.push(new Paragraph({
                            text: trimmed.substring(4),
                            heading: "Heading3",
                            spacing: { before: 240, after: 120 }
                        }))
                    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                        docxChildren.push(new Paragraph({
                            children: [new TextRun(trimmed.substring(2))],
                            bullet: { level: 0 }
                        }))
                    } else if (/^\d+\./.test(trimmed)) {
                        const text = trimmed.replace(/^\d+\.\s*/, '')
                        docxChildren.push(new Paragraph({
                            children: [new TextRun(text)],
                            numbering: { reference: "default-numbering", level: 0 }
                        }))
                    } else if (trimmed === '') {
                        docxChildren.push(new Paragraph({ text: "" }))
                    } else {
                        docxChildren.push(new Paragraph({
                            children: [new TextRun(line)],
                            spacing: { after: 120 }
                        }))
                    }
                })

                const doc = new DocxDocument({
                    sections: [{
                        properties: {},
                        children: docxChildren
                    }]
                })
                const blob = await Packer.toBlob(doc)
                saveAs(blob, `${fileName}.docx`)
            } else if (format === 'pdf') {
                const doc = generatePdfDocument(content)
                doc.save(`${fileName}.pdf`)
            }
        } catch (error) {
            console.error("Download failed:", error)
        }
    }



    if (!artifactId) return null

    return (
        <div className={cn("flex flex-col h-full bg-background border-l border-border", className)}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 gap-4 h-14 shrink-0">
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                    {/* View Toggle */}
                    <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border/50 shrink-0">
                        <button
                            onClick={() => setViewMode('preview')}
                            className={cn(
                                "flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium transition-all",
                                viewMode === 'preview'
                                    ? "bg-background text-foreground shadow-sm border border-border/50"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                            title="Vista previa"
                        >
                            <Eye className="w-3.5 h-3.5 mr-1.5" />
                            Vista previa
                        </button>
                        <button
                            onClick={() => setViewMode('code')}
                            className={cn(
                                "flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium transition-all",
                                viewMode === 'code'
                                    ? "bg-background text-foreground shadow-sm border border-border/50"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                            title="Código Markdown"
                        >
                            <Code className="w-3.5 h-3.5 mr-1.5" />
                            Código
                        </button>
                    </div>

                    <Separator orientation="vertical" className="h-6 mx-1" />

                    {/* Title */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="p-1 rounded bg-muted/30">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <h2 className="text-sm font-medium truncate" title={docTitle}>
                            {docTitle || "Documento"}
                        </h2>
                        <span className="text-xs text-muted-foreground shrink-0 opacity-50">· {viewMode === 'preview' ? 'Vista previa' : 'Código'}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleCopy} title="Copiar contenido">
                        <Copy className="w-4 h-4 text-muted-foreground" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Descargar">
                                <Download className="w-4 h-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownload('md')}>
                                <FileText className="w-4 h-4 mr-2" />
                                Markdown (.md)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload('docx')}>
                                <FileText className="w-4 h-4 mr-2" />
                                Word (.docx)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload('pdf')}>
                                <FileType className="w-4 h-4 mr-2" />
                                PDF (.pdf)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={onClose} title="Cerrar">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative bg-muted/30">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-accent" />
                    </div>
                ) : error ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-destructive p-6 text-center">
                        <AlertCircle className="w-10 h-10 mb-3 opacity-50" />
                        <p>{error}</p>
                    </div>
                ) : (
                    <div className="h-full flex flex-col">
                        {/* Custom PDF Controls Toolbar (Only in preview mode) */}
                        {viewMode === 'preview' && pdfUrl && (
                            <div className="flex items-center justify-center p-2 gap-2 border-b border-border/5 bg-background/50 backdrop-blur-sm z-10">
                                {/* Zoom Controls Only */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setScale(prev => Math.max(prev - 0.1, 0.5))}
                                    title="Reducir"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                </Button>

                                <span className="text-xs text-muted-foreground font-medium min-w-[40px] text-center">
                                    {Math.round(scale * 100)}%
                                </span>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setScale(prev => Math.min(prev + 0.1, 2.0))}
                                    title="Ampliar"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                </Button>

                                <Separator orientation="vertical" className="h-4 mx-2" />

                                <span className="text-xs text-muted-foreground font-medium text-center">
                                    {numPages || '-'} páginas
                                </span>
                            </div>
                        )}

                        <ScrollArea className="flex-1 w-full bg-muted/30">
                            <div className="flex flex-col items-center py-8 px-4 min-h-full">
                                {viewMode === 'preview' ? (
                                    <div className="min-h-[500px]">
                                        {pdfUrl ? (
                                            <PdfRenderer
                                                url={pdfUrl}
                                                scale={scale}
                                                onLoadSuccess={(num) => setNumPages(num)}
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-[500px] w-full">
                                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-full max-w-5xl mx-auto">
                                        <pre className="p-4 rounded-lg bg-muted/30 font-mono text-sm overflow-auto whitespace-pre-wrap break-all border border-border/50">
                                            {content || ""}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </div>
        </div >
    )
}
