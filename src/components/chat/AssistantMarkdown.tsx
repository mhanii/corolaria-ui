"use client"

import { memo, useMemo, useRef, useCallback, useState } from "react"
import ReactMarkdown, { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeRaw from 'rehype-raw'
import { CitationResponse } from "@/lib/api/types"
import { createIdToCitationMap } from "@/lib/citationUtils"
import { Copy, Check } from "lucide-react"

const CodeBlock = ({ children, ...props }: any) => {
    const [copied, setCopied] = useState(false)
    const preRef = useRef<HTMLPreElement>(null)

    const handleCopy = useCallback(() => {
        const text = preRef.current?.innerText || ''
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }, [])

    return (
        <div className="relative group my-4 rounded-xl overflow-hidden border border-border/50 bg-muted shadow-soft">
            <button
                onClick={handleCopy}
                className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-lg bg-background/80 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all text-xs border border-border/50 shadow-sm backdrop-blur-sm"
                aria-label="Copiar código"
            >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <pre ref={preRef} className="p-4 overflow-x-auto text-sm font-mono leading-relaxed" {...props}>{children}</pre>
        </div>
    )
}

const MarkdownComponents: Components = {
    p: ({ children, ...props }) => <p className="mb-3 md:mb-4 last:mb-0 text-[clamp(0.86rem,2.2vw,1rem)] leading-relaxed" {...props}>{children}</p>,
    li: ({ children, ...props }) => <li className="text-[clamp(0.86rem,2.2vw,1rem)] leading-relaxed pl-2" {...props}>{children}</li>,
    h1: ({ children, ...props }) => <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 mt-5 md:mt-6 tracking-tight" {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2.5 md:mb-3 mt-4 md:mt-5 tracking-tight" {...props}>{children}</h2>,
    h3: ({ children, ...props }) => <h3 className="text-lg md:text-xl lg:text-2xl font-semibold mb-2.5 md:mb-3 mt-3.5 md:mt-4 tracking-tight" {...props}>{children}</h3>,
    h4: ({ children, ...props }) => <h4 className="text-base md:text-lg lg:text-xl font-semibold mb-2 mt-3 tracking-tight" {...props}>{children}</h4>,
    td: ({ children, ...props }) => <td className="border border-border px-4 py-2" {...props}>{children}</td>,
    th: ({ children, ...props }) => <th className="border border-border bg-muted px-4 py-2 text-left font-semibold" {...props}>{children}</th>,
    blockquote: ({ children, ...props }) => <blockquote className="border-l-[3px] border-accent/40 pl-4 py-2 my-4 italic bg-muted/30 rounded-r-lg" {...props}>{children}</blockquote>,
    strong: ({ children, ...props }) => <strong className="font-semibold text-foreground" {...props}>{children}</strong>,
    em: ({ children, ...props }) => <em className="italic text-foreground/90" {...props}>{children}</em>,
    ul: ({ children, ...props }) => <ul className="list-disc ml-6 mb-4 space-y-2" {...props}>{children}</ul>,
    ol: ({ children, ...props }) => <ol className="list-decimal ml-6 mb-4 space-y-2" {...props}>{children}</ol>,
    code: ({ className, children, ...props }) => {
        const { inline } = props as any
        return inline
            ? <code className="bg-muted/80 px-1.5 py-0.5 rounded-md text-sm font-mono border border-border/40" {...props}>{children}</code>
            : <code className="text-sm font-mono" {...props}>{children}</code>
    },
    pre: CodeBlock,
    hr: ({ ...props }) => <hr className="my-6 border-border/60" {...props} />,
    table: ({ children, ...props }) => <div className="overflow-x-auto my-4 rounded-lg border border-border/50"><table className="w-full border-collapse" {...props}>{children}</table></div>,
}

const remarkPluginsList = [remarkGfm, remarkBreaks]
const rehypePluginsList = [rehypeRaw]

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
        if (!content) return '';

        const normalizedContent = content.replace(/<cite key=["']?(\d+)["']?>([\s\S]*?)<\/cite>/g, (_, id, inner) => {
            return `<cite id="${id}">${inner}</cite>`
        })

        let text = normalizedContent.replace(/<cite id=["']?(\d+)["']?>([\s\S]*?)<\/cite>/g, (match, id, text) => {
            return `[${text}](#citation-${id})`
        })

        // Handle Latin text in << >> or « » only outside of code blocks/spans
        const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g);
        text = parts.map((part, i) => {
            if (i % 2 === 0) {
                // Normalize markers to « » and wrap in highlight-italic span
                return part.replace(/(?:<<|«)([\s\S]*?)(?:>>|»)/g, '<span class="highlight-italic">«$1»</span>');
            }
            return part;
        }).join('');

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
            remarkPlugins={remarkPluginsList}
            rehypePlugins={rehypePluginsList}
            components={components as any}
        >
            {processedContent}
        </ReactMarkdown>
    )
})
