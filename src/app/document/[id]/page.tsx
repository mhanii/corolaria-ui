"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Calendar, BookOpen, Gavel, ArrowLeft, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock data with versions at article level
const MOCK_DOCUMENTS: Record<string, any> = {
    "1": {
        title: "Código Civil - Artículo 1254",
        type: "Ley",
        category: "Derecho Civil",
        date: "1889-07-24",
        articles: [
            {
                number: 1,
                title: "Disposiciones Generales",
                content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
            },
            {
                number: 2,
                title: "",
                highlighted: true,
                versions: [
                    {
                        id: "v2",
                        date: "2023-01-01",
                        label: "Vigente",
                        content: "El contrato existe desde que una o varias personas consienten en obligarse, respecto de otra u otras, a dar alguna cosa o prestar algún servicio. (Versión Actualizada)",
                    },
                    {
                        id: "v1",
                        date: "1889-07-24",
                        label: "Original",
                        content: "El contrato existe desde que una o varias personas consienten en obligarse, respecto de otra u otras, a dar alguna cosa o prestar algún servicio.",
                    }
                ]
            },
            {
                number: 3,
                title: "Obligaciones de las Partes",
                content: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."
            },
            {
                number: 4,
                title: "Disposiciones Finales",
                content: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
            },
        ]
    },
    "2": {
        title: "Sentencia del Tribunal Supremo 123/2024",
        type: "Jurisprudencia",
        category: "Derecho Laboral",
        date: "2024-03-10",
        articles: [
            {
                number: 1,
                title: "Fundamentos de Derecho",
                highlighted: true,
                versions: [
                    {
                        id: "v1",
                        date: "2024-03-10",
                        label: "Vigente",
                        content: "En materia de despidos improcedentes, la indemnización debe calcularse conforme a los días efectivamente trabajados...",
                    }
                ]
            }
        ]
    },
    "3": {
        title: "Ley de Propiedad Horizontal - Art. 9",
        type: "Ley",
        category: "Derecho Inmobiliario",
        date: "2023-11-20",
        articles: [
            {
                number: 1,
                title: "Obligaciones de los propietarios",
                highlighted: true,
                versions: [
                    {
                        id: "v1",
                        date: "2023-11-20",
                        label: "Vigente",
                        content: "Los elementos comunes del edificio, su conservación, entretenimiento y todas las atenciones que exijan el servicio...",
                    }
                ]
            }
        ]
    },
}

export default function DocumentPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string
    const document = MOCK_DOCUMENTS[id]

    // State to track selected version for each article
    // Key: article number, Value: version id
    const [articleVersions, setArticleVersions] = useState<Record<number, string>>({})

    if (!document) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Documento no encontrado</h2>
                <Button onClick={() => router.back()}>Volver</Button>
            </div>
        )
    }

    const getArticleContent = (article: any) => {
        if (!article.versions) return article.content

        const selectedVersionId = articleVersions[article.number] || article.versions[0].id
        const selectedVersion = article.versions.find((v: any) => v.id === selectedVersionId) || article.versions[0]
        return selectedVersion.content
    }

    const getArticleVersion = (article: any) => {
        if (!article.versions) return null
        const selectedVersionId = articleVersions[article.number] || article.versions[0].id
        return article.versions.find((v: any) => v.id === selectedVersionId) || article.versions[0]
    }

    return (
        <div className="h-full flex flex-col w-[90%] mx-auto bg-background">
            {/* Header Section */}
            <div className="border-b border-border p-6 bg-muted/30">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mb-4 pl-0 gap-1.5 text-sm font-medium transition-all hover:bg-accent/10 hover:text-accent"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Volver a resultados
                        </Button>

                        <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="text-xs uppercase tracking-wide">
                                {document.type === "Ley" ? (
                                    <><BookOpen className="w-3 h-3 mr-1" />{document.type}</>
                                ) : (
                                    <><Gavel className="w-3 h-3 mr-1" />{document.type}</>
                                )}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">{document.category}</Badge>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">{document.title}</h2>

                        <div className="flex items-center gap-4 mt-4">
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(document.date).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <ScrollArea className="flex-1">
                <div className="p-8 pb-20">
                    {document.articles.map((article: any, idx: number) => {
                        const currentVersion = getArticleVersion(article)

                        return (
                            <div key={idx}>
                                {/* Article content */}
                                <div
                                    className={
                                        article.highlighted
                                            ? "p-6 bg-accent/5 rounded mb-6"
                                            : "mb-6"
                                    }
                                    id={`articulo-${article.number}`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-lg font-bold text-foreground">
                                            Artículo {article.number}
                                            {article.title && ` - ${article.title}`}
                                        </h3>

                                        {/* Article Version Selector */}
                                        {article.versions && article.versions.length > 1 && (
                                            <div className="flex items-center gap-2">
                                                <Badge variant={currentVersion.label === "Vigente" ? "default" : "secondary"}>
                                                    {currentVersion.label}
                                                </Badge>
                                                <Select
                                                    value={currentVersion.id}
                                                    onValueChange={(value) => setArticleVersions(prev => ({
                                                        ...prev,
                                                        [article.number]: value
                                                    }))}
                                                >
                                                    <SelectTrigger className="w-[180px] h-8 text-xs">
                                                        <History className="w-3 h-3 mr-2" />
                                                        <SelectValue placeholder="Versión" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {article.versions.map((version: any) => (
                                                            <SelectItem key={version.id} value={version.id}>
                                                                {version.date} ({version.label})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-sm leading-relaxed text-foreground/90 space-y-3 font-mono">
                                        {getArticleContent(article).split('\n').map((paragraph: string, pIdx: number) => (
                                            paragraph.trim() && (
                                                <p key={pIdx} className="indent-8">
                                                    {paragraph}
                                                </p>
                                            )
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>
        </div>
    )
}
