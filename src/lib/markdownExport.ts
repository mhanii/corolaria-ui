import jsPDF from "jspdf"
import { Document as DocxDocument, Packer, Paragraph, TextRun } from "docx"

/**
 * Generates a jsPDF document from a raw Markdown string.
 */
export function generatePdfDocument(content: string): jsPDF {
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

/**
 * Generates a DOCX Blob from a raw Markdown string.
 */
export async function generateDocxBlob(content: string): Promise<Blob> {
    const docxChildren: any[] = []
    const docxLines = content.split('\n')

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

    return await Packer.toBlob(doc)
}
