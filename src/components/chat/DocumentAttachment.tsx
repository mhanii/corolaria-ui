import { FileText } from "lucide-react"

interface DocumentAttachmentProps {
    documentName: string
}

export function DocumentAttachment({ documentName }: DocumentAttachmentProps) {
    return (
        <div className="flex items-center gap-3 p-3 mb-4 rounded-lg bg-card border shadow-sm max-w-md ml-auto">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-accent" />
            </div>
            <span className="text-sm font-medium truncate text-foreground" title={documentName}>
                {documentName}
            </span>
        </div>
    )
}
