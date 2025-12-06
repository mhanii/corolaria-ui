import { Editor } from '@tiptap/react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'

/**
 * Export editor content as PDF
 * Uses html2canvas to capture the rendered content and jsPDF to create the PDF
 */
export async function exportToPDF(editor: Editor | null, fileName: string = 'documento.pdf') {
    if (!editor) {
        console.error('Editor instance is null')
        return
    }

    try {
        // Ensure filename has .pdf extension
        if (!fileName.toLowerCase().endsWith('.pdf')) {
            fileName += '.pdf'
        }

        // Get the editor element
        const editorElement = document.querySelector('.tiptap-editor') as HTMLElement
        if (!editorElement) {
            console.error('Editor element not found')
            return
        }

        // Create a clone for rendering to avoid affecting the actual editor
        const clone = editorElement.cloneNode(true) as HTMLElement
        clone.style.position = 'absolute'
        clone.style.left = '-9999px'
        clone.style.width = '210mm' // A4 width
        clone.style.padding = '20mm'
        clone.style.backgroundColor = 'white'
        document.body.appendChild(clone)

        // Capture the content as canvas
        const canvas = await html2canvas(clone, {
            scale: 2, // Higher quality
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        })

        // Remove the clone
        document.body.removeChild(clone)

        // Create PDF
        const imgWidth = 210 // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        const pdf = new jsPDF({
            orientation: imgHeight > imgWidth ? 'portrait' : 'portrait',
            unit: 'mm',
            format: 'a4'
        })

        const imgData = canvas.toDataURL('image/png')

        // Add image to PDF, handling multiple pages if needed
        let heightLeft = imgHeight
        let position = 0
        const pageHeight = 297 // A4 height in mm

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight

        while (heightLeft > 0) {
            position = heightLeft - imgHeight
            pdf.addPage()
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
            heightLeft -= pageHeight
        }

        // Save the PDF with explicit extension
        pdf.save(fileName)
        console.log(`✅ PDF exported successfully as ${fileName}`)
    } catch (error) {
        console.error('Error exporting to PDF:', error)
        throw error
    }
}

/**
 * Export editor content as DOCX
 * Parses the HTML content and converts it to DOCX format
 */
export async function exportToDOCX(editor: Editor | null, fileName: string = 'documento.docx') {
    if (!editor) {
        console.error('Editor instance is null')
        return
    }

    try {
        // Ensure filename has .docx extension
        if (!fileName.toLowerCase().endsWith('.docx')) {
            fileName += '.docx'
        }

        const html = editor.getHTML()
        const paragraphs = parseHTMLToDocx(html)

        const doc = new Document({
            sections: [{
                properties: {},
                children: paragraphs
            }]
        })

        const blob = await Packer.toBlob(doc)

        // Create blob with explicit MIME type for better browser compatibility
        const docxBlob = new Blob([blob], {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        })

        saveAs(docxBlob, fileName)
        console.log(`✅ DOCX exported successfully as ${fileName}`)
    } catch (error) {
        console.error('Error exporting to DOCX:', error)
        throw error
    }
}

/**
 * Parse HTML content to DOCX paragraphs
 */
function parseHTMLToDocx(html: string): Paragraph[] {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const paragraphs: Paragraph[] = []

    // Process each element in the body
    const processNode = (node: Node): TextRun[] => {
        const runs: TextRun[] = []

        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || ''
            if (text.trim()) {
                runs.push(new TextRun({ text }))
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement
            const text = element.textContent || ''

            if (!text.trim()) return runs

            const isBold = element.tagName === 'STRONG' || element.tagName === 'B'
            const isItalic = element.tagName === 'EM' || element.tagName === 'I'
            const isUnderline = element.tagName === 'U'

            // If it's a formatting element, apply the style
            if (isBold || isItalic || isUnderline) {
                Array.from(element.childNodes).forEach(child => {
                    const childRuns = processNode(child)
                    childRuns.forEach(run => {
                        runs.push(new TextRun({
                            text: run.text,
                            bold: isBold,
                            italics: isItalic,
                            underline: isUnderline ? {} : undefined
                        }))
                    })
                })
            } else {
                // For other elements, just get the text
                Array.from(element.childNodes).forEach(child => {
                    runs.push(...processNode(child))
                })
            }
        }

        return runs
    }

    // Process each top-level element
    Array.from(doc.body.children).forEach(element => {
        const tagName = element.tagName.toLowerCase()
        let paragraph: Paragraph | null = null
        const textRuns = processNode(element)

        // Get text alignment
        const style = (element as HTMLElement).style.textAlign ||
            (element as HTMLElement).getAttribute('style')?.match(/text-align:\s*(left|center|right|justify)/)?.[1]

        let alignment = AlignmentType.LEFT
        if (style === 'center') alignment = AlignmentType.CENTER
        else if (style === 'right') alignment = AlignmentType.RIGHT
        else if (style === 'justify') alignment = AlignmentType.JUSTIFIED

        // Handle headings
        if (tagName === 'h1') {
            paragraph = new Paragraph({
                text: element.textContent || '',
                heading: HeadingLevel.HEADING_1,
                alignment
            })
        } else if (tagName === 'h2') {
            paragraph = new Paragraph({
                text: element.textContent || '',
                heading: HeadingLevel.HEADING_2,
                alignment
            })
        } else if (tagName === 'h3') {
            paragraph = new Paragraph({
                text: element.textContent || '',
                heading: HeadingLevel.HEADING_3,
                alignment
            })
        } else if (tagName === 'p') {
            paragraph = new Paragraph({
                children: textRuns.length > 0 ? textRuns : [new TextRun(element.textContent || '')],
                alignment
            })
        } else if (tagName === 'ul' || tagName === 'ol') {
            // Handle lists
            const listItems = element.querySelectorAll('li')
            listItems.forEach((li, index) => {
                paragraphs.push(new Paragraph({
                    text: li.textContent || '',
                    bullet: tagName === 'ul' ? { level: 0 } : undefined,
                    numbering: tagName === 'ol' ? { reference: 'default-numbering', level: 0 } : undefined,
                    alignment
                }))
            })
            return // Skip adding the paragraph at the end
        }

        if (paragraph) {
            paragraphs.push(paragraph)
        }
    })

    // If no paragraphs were created, add at least one empty paragraph
    if (paragraphs.length === 0) {
        paragraphs.push(new Paragraph({ text: '' }))
    }

    return paragraphs
}
