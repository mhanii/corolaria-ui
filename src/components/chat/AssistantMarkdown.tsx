"use client"

import { memo, useMemo } from "react"
import ReactMarkdown, { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { CitationResponse } from "@/lib/api/types"
import { createIdToCitationMap } from "@/lib/citationUtils"

const MarkdownComponents: Components = {
    p: ({ children, ...props }) => <p className="mb-4 last:mb-0 text-lg leading-relaxed" {...props}>{children}</p>,
    li: ({ children, ...props }) => <li className="text-lg leading-relaxed pl-2" {...props}>{children}</li>,
    h1: ({ children, ...props }) => <h1 className="text-4xl font-bold mb-4 mt-6" {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 className="text-3xl font-bold mb-3 mt-5" {...props}>{children}</h2>,
    h3: ({ children, ...props }) => <h3 className="text-2xl font-semibold mb-3 mt-4" {...props}>{children}</h3>,
    h4: ({ children, ...props }) => <h4 className="text-xl font-semibold mb-2 mt-3" {...props}>{children}</h4>,
    td: ({ children, ...props }) => <td className="border border-border px-4 py-2" {...props}>{children}</td>,
    th: ({ children, ...props }) => <th className="border border-border bg-muted px-4 py-2 text-left font-semibold" {...props}>{children}</th>,
    blockquote: ({ children, ...props }) => <blockquote className="border-l-4 border-accent/40 pl-4 py-2 my-4 italic bg-muted/30 rounded-r" {...props}>{children}</blockquote>,
    strong: ({ children, ...props }) => <strong className="font-bold" {...props}>{children}</strong>,
    em: ({ children, ...props }) => <em className="italic" {...props}>{children}</em>,
    ul: ({ children, ...props }) => <ul className="list-disc ml-6 mb-4 space-y-2" {...props}>{children}</ul>,
    ol: ({ children, ...props }) => <ol className="list-decimal ml-6 mb-4 space-y-2" {...props}>{children}</ol>,
    code: ({ className, children, ...props }) => {
        const { inline } = props as any
        return inline
            ? <code className="bg-muted px-2 py-1 rounded text-sm font-mono" {...props}>{children}</code>
            : <code className="block bg-muted p-4 rounded-lg my-4 text-sm font-mono overflow-x-auto" {...props}>{children}</code>
    },
    pre: ({ children, ...props }) => <pre className="my-4" {...props}>{children}</pre>,
    hr: ({ ...props }) => <hr className="my-6 border-border" {...props} />,
    table: ({ children, ...props }) => <div className="overflow-x-auto my-4"><table className="w-full border-collapse" {...props}>{children}</table></div>,
}

interface AssistantMarkdownProps {
    content: string
    citations: CitationResponse[]
    isStreaming: boolean
}

export const AssistantMarkdown = memo(function AssistantMarkdown({
    content,
    citations,
    isStreaming
}: AssistantMarkdownProps) {
    const processedContent = useMemo(() => {
        if (!content) return isStreaming ? '<span class="streaming-cursor"></span>' : '';
        let text = content.replace(/<cite id=["']?(\d+)["']?>([\s\S]*?)<\/cite>/g, (match, id, text) => {
            return `[${text}](#citation-${id})`
        })

        if (isStreaming) {
            text += ' <span class="streaming-cursor"></span>'
        }

        return text;
    }, [content, isStreaming]);

    const idCitationMap = useMemo(() => createIdToCitationMap(citations), [citations]);

    const components = useMemo(() => ({
        ...MarkdownComponents,
        a: ({ children, href, ...props }: any) => {
            const { node, ...rest } = props
            if (href && href.startsWith('#citation-')) {
                const idString = href.replace('#citation-', '')
                const id = parseInt(idString, 10)
                if (!isNaN(id)) {
                    const citation = idCitationMap.get(id)
                    if (citation) {
                        if (!citation.normativa_id) {
                            return <span className="text-accent font-medium" title="Enlace no disponible">{children}</span>
                        }
                        return (
                            <a
                                href={`https://boe.es/buscar/act.php?id=${citation.normativa_id}#art${citation.article_number}`}
                                className="text-accent hover:underline font-medium inline-flex items-center gap-0.5"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title={`${citation.display_text}\n${citation.normativa_title}`}
                            >
                                {children}
                            </a>
                        )
                    }
                }
            }
            return (
                <a href={href} className="text-accent hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...rest}>
                    {children}
                </a>
            )
        }
    }), [idCitationMap]);

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={components as any}
        >
            {processedContent}
        </ReactMarkdown>
    )
})
