"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, AlertCircle, ExternalLink, ChevronLeft, ChevronRight, CheckCircle, XCircle, GitBranch } from "lucide-react"
import { ArticleDetailResponse, ArticleResult } from "@/lib/api/types"
import { getArticleByNodeId } from "@/lib/api/services/searchService"
import { LogoLoader } from "@/components/ui/Logo"

interface ArticleDetailsModalProps {
    article: ArticleResult | ArticleDetailResponse | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onArticleChange?: (article: ArticleResult | ArticleDetailResponse) => void
}

export function ArticleDetailsModal({ article, isOpen, onOpenChange, onArticleChange }: ArticleDetailsModalProps) {
    const router = useRouter()
    const [currentArticle, setCurrentArticle] = useState<ArticleResult | ArticleDetailResponse | null>(article)
    const [versionLoading, setVersionLoading] = useState(false)
    const [versionError, setVersionError] = useState<string | null>(null)

    // Update internal state when prop changes
    useEffect(() => {
        if (article) {
            setCurrentArticle(article)
            setVersionError(null)
        }
    }, [article])

    const handleVersionNavigation = async (nodeId: string) => {
        setVersionLoading(true)
        setVersionError(null)

        try {
            const articleDetail = await getArticleByNodeId(nodeId)
            setCurrentArticle(articleDetail)
            onArticleChange?.(articleDetail)
        } catch (err: any) {
            setVersionError(err.message || 'Error al cargar la versión del artículo')
            console.error('Error fetching article version:', err)
        } finally {
            setVersionLoading(false)
        }
    }

    const handleOpenSource = () => {
        if (currentArticle) {
            const id = 'article_id' in currentArticle ? currentArticle.article_id : currentArticle.node_id
            router.push(`/document/${id}`)
        }
    }

    if (!currentArticle) return null

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] md:max-w-[80vw] h-[90vh] md:h-[85vh] flex flex-col p-3 md:p-6">
                <DialogHeader className="space-y-2">
                    {/* Badges - hidden on mobile for cleaner look */}
                    <div className="hidden md:flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline" className="gap-1">
                            <BookOpen className="w-3 h-3" />
                            Artículo
                        </Badge>

                        {currentArticle.fecha_caducidad === null && currentArticle.fecha_vigencia && (
                            <Badge className="gap-1 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200/50 shadow-none">
                                <CheckCircle className="w-3 h-3" />
                                Vigente
                            </Badge>
                        )}
                        {currentArticle.fecha_caducidad !== null && (
                            <Badge variant="outline" className="gap-1 bg-red-500/10 text-red-700 hover:bg-red-500/20 border-red-200/50 shadow-none">
                                <XCircle className="w-3 h-3" />
                                No vigente
                            </Badge>
                        )}

                        {(currentArticle.previous_version_id || currentArticle.next_version_id) && (
                            <Badge variant="secondary" className="gap-1">
                                <GitBranch className="w-3 h-3" />
                                Múltiples versiones
                            </Badge>
                        )}
                    </div>

                    {/* Mobile: Simple status indicator */}
                    <div className="flex md:hidden items-center gap-2">
                        {currentArticle.fecha_caducidad === null && currentArticle.fecha_vigencia ? (
                            <Badge className="gap-1 bg-emerald-500/10 text-emerald-700 text-xs">
                                <CheckCircle className="w-3 h-3" />
                                Vigente
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="gap-1 bg-red-500/10 text-red-700 text-xs">
                                <XCircle className="w-3 h-3" />
                                No vigente
                            </Badge>
                        )}
                    </div>

                    <DialogTitle className="text-lg md:text-2xl font-display leading-tight">
                        {currentArticle.normativa_title} - {currentArticle.article_number}
                    </DialogTitle>

                    {(currentArticle.fecha_vigencia || currentArticle.fecha_caducidad) && (
                        <DialogDescription className="text-xs md:text-sm">
                            {currentArticle.fecha_vigencia && (
                                <span>Vigencia: {currentArticle.fecha_vigencia}</span>
                            )}
                            {currentArticle.fecha_caducidad && (
                                <span className="ml-2 md:ml-4">Caducidad: {currentArticle.fecha_caducidad}</span>
                            )}
                        </DialogDescription>
                    )}
                </DialogHeader>

                {versionError && (
                    <div className="flex items-start gap-2 px-3 md:px-4 py-2 md:py-3 bg-destructive/10 border border-destructive/20 rounded-md">
                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                        <p className="text-xs md:text-sm text-destructive">{versionError}</p>
                    </div>
                )}

                <div className="flex-1 overflow-auto mt-3 md:mt-4">
                    {versionLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <LogoLoader text="Cargando versión..." />
                        </div>
                    ) : (
                        <p className="text-sm md:text-base leading-relaxed font-mono whitespace-pre-wrap">
                            {currentArticle.article_text}
                        </p>
                    )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-stretch sm:items-center gap-2 md:gap-3 mt-3 md:mt-4 pt-3 md:pt-4 border-t">
                    <div className="flex gap-2">
                        {currentArticle.previous_version_id && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVersionNavigation(currentArticle.previous_version_id!)}
                                disabled={versionLoading}
                                className="gap-1 md:gap-2 text-xs md:text-sm flex-1 sm:flex-none"
                            >
                                <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
                                <span className="hidden sm:inline">Versión anterior</span>
                                <span className="sm:hidden">Anterior</span>
                            </Button>
                        )}
                        {currentArticle.next_version_id && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVersionNavigation(currentArticle.next_version_id!)}
                                disabled={versionLoading}
                                className="gap-1 md:gap-2 text-xs md:text-sm flex-1 sm:flex-none"
                            >
                                <span className="hidden sm:inline">Versión posterior</span>
                                <span className="sm:hidden">Posterior</span>
                                <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 sm:flex-none text-xs md:text-sm"
                        >
                            Cerrar
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleOpenSource}
                            className="gap-1 md:gap-2 flex-1 sm:flex-none text-xs md:text-sm"
                        >
                            <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="hidden sm:inline">Abrir fuente</span>
                            <span className="sm:hidden">Abrir</span>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
