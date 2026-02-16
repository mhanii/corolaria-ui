"use client"

import { useState, useEffect, useRef } from "react" // Fixed imports
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
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Loader2, AlertCircle, X, Copy, Download, Code, Eye, FileText, FileJson, FileType } from "lucide-react" // Added icons
import { cn } from "@/lib/utils"
// Import download libraries
import { saveAs } from "file-saver"
import { Document, Packer, Paragraph, TextRun } from "docx"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

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

export function ArtifactView({ artifactId, isOpen, onClose, title, className }: ArtifactViewProps) {
    const [content, setContent] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [docTitle, setDocTitle] = useState<string>(title || "")
    const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview')

    const contentRef = useRef<HTMLDivElement>(null)

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
                let currentList: any[] = []

                // transform markdown lines to docx paragraphs
                const kids: any[] = []

                lines.forEach(line => {
                    const trimmed = line.trim()

                    if (trimmed.startsWith('# ')) {
                        kids.push(new Paragraph({
                            text: trimmed.substring(2),
                            heading: "Heading1",
                            spacing: { before: 240, after: 120 }
                        }))
                    } else if (trimmed.startsWith('## ')) {
                        kids.push(new Paragraph({
                            text: trimmed.substring(3),
                            heading: "Heading2",
                            spacing: { before: 240, after: 120 }
                        }))
                    } else if (trimmed.startsWith('### ')) {
                        kids.push(new Paragraph({
                            text: trimmed.substring(4),
                            heading: "Heading3",
                            spacing: { before: 240, after: 120 }
                        }))
                    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                        kids.push(new Paragraph({
                            children: [new TextRun(trimmed.substring(2))],
                            bullet: { level: 0 }
                        }))
                    } else if (/^\d+\./.test(trimmed)) {
                        const text = trimmed.replace(/^\d+\.\s*/, '')
                        kids.push(new Paragraph({
                            children: [new TextRun(text)],
                            numbering: {
                                reference: "default-numbering",
                                level: 0
                            }
                        }))
                    } else if (trimmed === '') {
                        kids.push(new Paragraph({ text: "" }))
                    } else {
                        kids.push(new Paragraph({
                            children: [new TextRun(line)],
                            spacing: { after: 120 }
                        }))
                    }
                })

                const doc = new Document({
                    sections: [{
                        properties: {},
                        children: kids
                    }]
                })
                const blob = await Packer.toBlob(doc)
                saveAs(blob, `${fileName}.docx`)
            } else if (format === 'pdf') {
                // Use browser print for best quality
                const printContent = document.createElement('iframe');
                printContent.style.position = 'fixed';
                printContent.style.right = '0';
                printContent.style.bottom = '0';
                printContent.style.width = '0';
                printContent.style.height = '0';
                printContent.style.border = '0';
                document.body.appendChild(printContent);

                const doc = printContent.contentWindow?.document;
                if (doc) {
                    doc.open();
                    // Inject print styles and content
                    doc.write(`
                       <html>
                       <head>
                           <title>${fileName}</title>
                           <style>
                               @page { margin: 20mm; size: A4; }
                               body { font-family: "Times New Roman", Times, serif; color: black; line-height: 1.5; }
                               h1, h2, h3 { font-weight: bold; margin-top: 1em; margin-bottom: 0.5em; page-break-after: avoid; }
                               h1 { font-size: 24pt; border-bottom: 2px solid black; }
                               h2 { font-size: 18pt; border-bottom: 1px solid #ddd; }
                               h3 { font-size: 14pt; }
                               p { margin-bottom: 1em; text-align: justify; }
                               ul, ol { margin-bottom: 1em; padding-left: 2em; }
                               li { margin-bottom: 0.5em; }
                               blockquote { border-left: 4px solid #ccc; padding-left: 1em; margin: 1em 0; font-style: italic; }
                               code { font-family: monospace; background: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-size: 0.9em; }
                               pre { background: #f5f5f5; padding: 1em; overflow-x: auto; border: 1px solid #ddd; page-break-inside: avoid; }
                               table { width: 100%; border-collapse: collapse; margin-bottom: 1em; }
                               th, td { border: 1px solid black; padding: 8px; text-align: left; }
                               th { background-color: #f2f2f2; }
                           </style>
                       </head>
                       <body>
                           <div class="prose">
                               <!-- We can parse markdown again here or just copy innerHTML if we had it clean, 
                                    but react-markdown renders to the DOM. 
                                    We should grab the rendered innerHTML from our ref. -->
                               ${contentRef.current?.innerHTML || content} 
                           </div>
                       </body>
                       </html>
                   `);
                    doc.close();

                    // Wait for images etc
                    setTimeout(() => {
                        printContent.contentWindow?.focus();
                        printContent.contentWindow?.print();
                        // Remove iframe after print dialog closes (simulated delay, or leave it)
                        setTimeout(() => {
                            document.body.removeChild(printContent);
                        }, 2000);
                    }, 500);
                }
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
                    <ScrollArea className="h-full w-full">
                        <div className="flex flex-col items-center py-8 px-4 min-h-full">
                            {viewMode === 'preview' ? (
                                <div
                                    ref={contentRef}
                                    className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black shadow-lg border border-border/20 p-[20mm] mx-auto rounded-sm print:shadow-none print:border-0 print:m-0 print:p-0 print:w-full"
                                    style={{ fontFamily: '"Times New Roman", Times, serif' }}
                                >
                                    <div className="prose prose-sm md:prose-base max-w-none prose-headings:font-serif prose-p:font-serif prose-li:font-serif text-black">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mt-2 mb-6 text-black leading-tight border-b-2 border-black pb-2" {...props} />,
                                                h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-6 mb-4 text-black leading-snug" {...props} />,
                                                h3: ({ node, ...props }) => <h3 className="text-xl font-bold mt-5 mb-3 text-black" {...props} />,
                                                p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-justify text-black" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-1 text-black" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-1 text-black" {...props} />,
                                                li: ({ node, ...props }) => <li className="leading-relaxed pl-1" {...props} />,
                                                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-black/30 pl-4 italic text-black/80 my-4" {...props} />,
                                                code: ({ node, inline, className, children, ...props }: any) => {
                                                    const match = /language-(\w+)/.exec(className || '')
                                                    return !inline ? (
                                                        <div className="relative my-4 rounded border border-gray-300 bg-gray-50 not-prose font-sans">
                                                            <div className="p-3 overflow-x-auto">
                                                                <code className={cn("font-mono text-xs md:text-sm text-black", className)} {...props}>
                                                                    {children}
                                                                </code>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-black border border-gray-200" {...props}>
                                                            {children}
                                                        </code>
                                                    )
                                                },
                                                table: ({ node, ...props }) => <div className="my-6 w-full overflow-y-auto border border-black"><table className="w-full text-sm border-collapse" {...props} /></div>,
                                                th: ({ node, ...props }) => <th className="border border-black px-3 py-2 text-left font-bold bg-gray-100 text-black" {...props} />,
                                                td: ({ node, ...props }) => <td className="border border-black px-3 py-2 text-left text-black" {...props} />,
                                                a: ({ node, ...props }) => <a className="text-blue-700 underline font-medium" target="_blank" rel="noreferrer" {...props} />,
                                                hr: ({ node, ...props }) => <hr className="my-8 border-black" {...props} />
                                            }}
                                        >
                                            {content || ""}
                                        </ReactMarkdown>
                                    </div>
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
                )}
            </div>
        </div>
    )
}
