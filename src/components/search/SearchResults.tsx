"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { BookOpen, Loader2, AlertCircle, ExternalLink, ChevronLeft, ChevronRight, CheckCircle, XCircle, GitBranch } from "lucide-react"
import { ArticleResult, ArticleDetailResponse } from "@/lib/api/types"
import { getArticleByNodeId } from "@/lib/api/services/searchService"

interface SearchResultsProps {
    /** Search results from the API */
    results: ArticleResult[];

    /** Loading state */
    loading?: boolean;

    /** Error message */
    error?: string | null;

    /** Original query */
    query?: string;
}

export function SearchResults({ results, loading = false, error = null, query = '' }: SearchResultsProps) {
    const router = useRouter()
    const [selectedArticle, setSelectedArticle] = useState<ArticleResult | ArticleDetailResponse | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [versionLoading, setVersionLoading] = useState(false)
    const [versionError, setVersionError] = useState<string | null>(null)

    const handleResultClick = (article: ArticleResult) => {
        setSelectedArticle(article)
        setDialogOpen(true)
        setVersionError(null)
    }

    const handleVersionNavigation = async (nodeId: string) => {
        setVersionLoading(true)
        setVersionError(null)

        try {
            const articleDetail = await getArticleByNodeId(nodeId)
            setSelectedArticle(articleDetail)
        } catch (err: any) {
            setVersionError(err.message || 'Error al cargar la versión del artículo')
            console.error('Error fetching article version:', err)
        } finally {
            setVersionLoading(false)
        }
    }

    const handleOpenSource = () => {
        if (selectedArticle) {
            // Handle both ArticleResult (has article_id) and ArticleDetailResponse (has node_id)
            const id = 'article_id' in selectedArticle ? selectedArticle.article_id : selectedArticle.node_id
            router.push(`/document/${id}`)
        }
    }

    // Loading state
    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-accent" />
                        <p className="text-muted-foreground">Buscando resultados...</p>
                    </div>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="space-y-4">
                <Card className="border-destructive/50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-destructive mb-1">Error en la búsqueda</h3>
                                <p className="text-sm text-muted-foreground">{error}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Empty results
    if (results.length === 0) {
        return (
            <div className="space-y-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-8">
                            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                            <h3 className="font-semibold mb-2">No se encontraron resultados</h3>
                            <p className="text-sm text-muted-foreground">
                                {query ? `No hay resultados para "${query}"` : 'Intenta con otros términos de búsqueda'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                    {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
                </p>
            </div>
            {results.map((result) => {
                // Convert score from 0-1 scale to percentage
                const relevancePercentage = Math.round(result.score * 100);

                // Format context path for display
                const contextDisplay = result.context_path
                    .map(ctx => `${ctx.type} ${ctx.name}`)
                    .join(' › ');

                return (
                    <Card
                        key={result.article_id}
                        className="shadow-soft hover:shadow-medium transition-smooth cursor-pointer group"
                        onClick={() => handleResultClick(result)}
                    >
                        <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {/* Article type badge - first */}
                                        <Badge variant="outline" className="gap-1">
                                            <BookOpen className="w-3 h-3" />
                                            Artículo
                                        </Badge>

                                        {/* Vigencia status badge - after article type */}
                                        {result.fecha_caducidad === null && result.fecha_vigencia && (
                                            <Badge className="gap-1 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200/50 shadow-none">
                                                <CheckCircle className="w-3 h-3" />
                                                Vigente
                                            </Badge>
                                        )}
                                        {result.fecha_caducidad !== null && (
                                            <Badge variant="outline" className="gap-1 bg-red-500/10 text-red-700 hover:bg-red-500/20 border-red-200/50 shadow-none">
                                                <XCircle className="w-3 h-3" />
                                                No vigente
                                            </Badge>
                                        )}

                                        {/* Multiple versions indicator */}
                                        {(result.previous_version_id || result.next_version_id) && (
                                            <Badge variant="secondary" className="gap-1">
                                                <GitBranch className="w-3 h-3" />
                                                Múltiples versiones
                                            </Badge>
                                        )}
                                    </div>
                                    <CardTitle className="group-hover:text-accent transition-smooth font-display">
                                        {result.normativa_title} - {result.article_number}
                                    </CardTitle>
                                    {contextDisplay && (
                                        <CardDescription className="text-xs">
                                            {contextDisplay}
                                        </CardDescription>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-accent">
                                        {relevancePercentage}%
                                    </div>
                                    <div className="text-xs text-muted-foreground">relevancia</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                <p className="text-sm text-foreground/80 leading-relaxed font-mono whitespace-pre-wrap line-clamp-3">
                                    {result.article_text}
                                </p>
                                {/* Gradient fade overlay */}
                                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                            </div>
                        </CardContent>
                    </Card>
                );
            })}

            {/* Article Detail Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-[80vw] h-[85vh] flex flex-col">
                    {selectedArticle && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    {/* Article type badge - first */}
                                    <Badge variant="outline" className="gap-1">
                                        <BookOpen className="w-3 h-3" />
                                        Artículo
                                    </Badge>

                                    {/* Vigencia status badge - after article type */}
                                    {selectedArticle.fecha_caducidad === null && selectedArticle.fecha_vigencia && (
                                        <Badge className="gap-1 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200/50 shadow-none">
                                            <CheckCircle className="w-3 h-3" />
                                            Vigente
                                        </Badge>
                                    )}
                                    {selectedArticle.fecha_caducidad !== null && (
                                        <Badge variant="outline" className="gap-1 bg-red-500/10 text-red-700 hover:bg-red-500/20 border-red-200/50 shadow-none">
                                            <XCircle className="w-3 h-3" />
                                            No vigente
                                        </Badge>
                                    )}

                                    {/* Multiple versions indicator */}
                                    {(selectedArticle.previous_version_id || selectedArticle.next_version_id) && (
                                        <Badge variant="secondary" className="gap-1">
                                            <GitBranch className="w-3 h-3" />
                                            Múltiples versiones
                                        </Badge>
                                    )}

                                    {selectedArticle.context_path && selectedArticle.context_path.length > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                            {selectedArticle.context_path
                                                .map(ctx => `${ctx.type} ${ctx.name}`)
                                                .join(' › ')}
                                        </Badge>
                                    )}
                                </div>
                                <DialogTitle className="text-2xl font-display">
                                    {selectedArticle.normativa_title} - {selectedArticle.article_number}
                                </DialogTitle>

                                {/* Date information */}
                                {(selectedArticle.fecha_vigencia || selectedArticle.fecha_caducidad) && (
                                    <DialogDescription>
                                        {selectedArticle.fecha_vigencia && (
                                            <span>Vigencia desde: {selectedArticle.fecha_vigencia}</span>
                                        )}
                                        {selectedArticle.fecha_caducidad && (
                                            <span className="ml-4">Caducidad: {selectedArticle.fecha_caducidad}</span>
                                        )}
                                    </DialogDescription>
                                )}
                            </DialogHeader>

                            {/* Version error message */}
                            {versionError && (
                                <div className="flex items-start gap-2 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-md">
                                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                                    <p className="text-sm text-destructive">{versionError}</p>
                                </div>
                            )}

                            <div className="flex-1 overflow-auto mt-4">
                                {versionLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-accent" />
                                    </div>
                                ) : (
                                    <p className="text-base leading-relaxed font-mono whitespace-pre-wrap">
                                        {selectedArticle.article_text}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-between items-center gap-3 mt-4 pt-4 border-t">
                                {/* Version navigation buttons */}
                                <div className="flex gap-2">
                                    {selectedArticle.previous_version_id && (
                                        <Button
                                            variant="outline"
                                            onClick={() => handleVersionNavigation(selectedArticle.previous_version_id!)}
                                            disabled={versionLoading}
                                            className="gap-2"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            Versión anterior
                                        </Button>
                                    )}
                                    {selectedArticle.next_version_id && (
                                        <Button
                                            variant="outline"
                                            onClick={() => handleVersionNavigation(selectedArticle.next_version_id!)}
                                            disabled={versionLoading}
                                            className="gap-2"
                                        >
                                            Versión posterior
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>

                                {/* Dialog action buttons */}
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setDialogOpen(false)}
                                    >
                                        Cerrar
                                    </Button>
                                    <Button
                                        onClick={handleOpenSource}
                                        className="gap-2"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Abrir fuente
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
