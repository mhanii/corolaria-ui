"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Loader2, AlertCircle, X, Copy, Download, Code, Eye, FileText, FileType, ZoomIn, ZoomOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { saveAs } from "file-saver"
import { generatePdfDocument, generateDocxBlob } from "@/lib/markdownExport"
import { AssistantMarkdown } from "./AssistantMarkdown"

interface ArtifactViewProps {
    artifactId: string | null
    isOpen?: boolean
    onClose: () => void
    title?: string
    className?: string
    isMobileFullscreen?: boolean
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

// Removed getResponsiveDefaultScale as we are no longer using PDF renderer

export function ArtifactView({
    artifactId,
    isOpen,
    onClose,
    title,
    className,
    isMobileFullscreen = false,
}: ArtifactViewProps) {
    const [content, setContent] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [docTitle, setDocTitle] = useState<string>(title || "")
    const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview')

    const loadDocument = useCallback(async (id: string) => {
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
    }, [title])

    // Removed PDF generation effect and scale effect
    useEffect(() => {
        if (artifactId) {
            loadDocument(artifactId)
        }
    }, [artifactId, loadDocument])

    useEffect(() => {
        if (title) setDocTitle(title)
    }, [title])

    const handleCopy = useCallback(() => {
        if (content) {
            navigator.clipboard.writeText(content)
        }
    }, [content])

    const handleDownload = useCallback(async (format: 'md' | 'pdf' | 'docx') => {
        if (!content) return

        const fileName = docTitle || "documento"

        try {
            if (format === 'md') {
                const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
                saveAs(blob, `${fileName}.md`)
            } else if (format === 'docx') {
                const blob = await generateDocxBlob(content)
                saveAs(blob, `${fileName}.docx`)
            } else if (format === 'pdf') {
                const doc = generatePdfDocument(content)
                doc.save(`${fileName}.pdf`)
            }
        } catch (error) {
            console.error("Download failed:", error)
        }
    }, [content, docTitle])

    if (!artifactId) return null

    return (
        <div className={cn(
            "flex flex-col h-full bg-background border-l border-border",
            isMobileFullscreen && "border-l-0",
            className
        )}>
            <div className={cn(
                "flex items-center justify-between px-3 py-2 border-b border-border/50 gap-2 h-14 shrink-0 bg-background/95 backdrop-blur-sm",
                isMobileFullscreen && "sticky top-0 z-20 pt-safe"
            )}>
                <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                    <div className={cn(
                        "flex items-center bg-muted/50 p-1 rounded-lg border border-border/50 shrink-0",
                        isMobileFullscreen && "max-w-[170px] overflow-hidden"
                    )}>
                        <button
                            onClick={() => setViewMode('preview')}
                            className={cn(
                                "flex items-center justify-center h-8 px-2.5 md:px-3 rounded-md text-xs font-medium transition-all whitespace-nowrap",
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
                                "flex items-center justify-center h-8 px-2.5 md:px-3 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                                viewMode === 'code'
                                    ? "bg-background text-foreground shadow-sm border border-border/50"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                            title="Código Markdown"
                        >
                            <Code className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                            <span className={cn(isMobileFullscreen && "hidden min-[390px]:inline")}>Código</span>
                            <span className={cn("hidden", isMobileFullscreen && "inline min-[390px]:hidden")}>MD</span>
                        </button>
                    </div>

                    <Separator orientation="vertical" className="h-6 mx-1 hidden min-[420px]:block" />

                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="p-1 rounded bg-muted/30 hidden min-[360px]:block">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <h2 className="text-sm font-medium truncate" title={docTitle}>
                            {docTitle || "Documento"}
                        </h2>
                        <span className="text-xs text-muted-foreground shrink-0 opacity-50 hidden md:inline">· {viewMode === 'preview' ? 'Vista previa' : 'Código'}</span>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={handleCopy} title="Copiar contenido">
                        <Copy className="w-4 h-4 text-muted-foreground" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0" title="Descargar">
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

                    <Separator orientation="vertical" className="h-6 mx-1 hidden min-[360px]:block" />
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={onClose} title={isMobileFullscreen ? "Volver al chat" : "Cerrar"}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

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
                        {/* Removed PDF controls */}

                        <ScrollArea className="flex-1 w-full bg-muted/30 scroll-touch">
                            <div className={cn(
                                "flex flex-col items-start md:items-center px-4 min-h-full pb-safe",
                                isMobileFullscreen ? "py-4" : "py-8"
                            )}>
                                {viewMode === 'preview' ? (
                                    <div className="w-full max-w-4xl mx-auto bg-background p-8 md:p-12 shadow-sm rounded-xl border border-border/50 min-h-[500px]">
                                        <AssistantMarkdown
                                            content={content || ""}
                                            citations={[]}
                                            isStreaming={false}
                                        />
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
        </div>
    )
}
