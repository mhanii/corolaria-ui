"use client"

import { useState } from "react"
import { Document, Page, pdfjs } from 'react-pdf'
import { Loader2 } from "lucide-react"

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfRendererProps {
    url: string
    scale: number
    onLoadSuccess: (numPages: number) => void
}

export default function PdfRenderer({ url, scale, onLoadSuccess }: PdfRendererProps) {
    const [numPages, setNumPages] = useState<number>(0)

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages)
        onLoadSuccess(numPages)
    }

    return (
        <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            }
            error={
                <div className="flex items-center justify-center p-12 text-destructive">
                    <p>Error al cargar PDF</p>
                </div>
            }
            className="inline-flex flex-col gap-6"
        >
            {Array.from(new Array(numPages), (el, index) => (
                <Page
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={false}
                    className="inline-block shadow-md border border-border/10 bg-white"
                />
            ))}
        </Document>
    )
}
