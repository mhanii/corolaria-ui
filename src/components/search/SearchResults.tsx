"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArticleResult, ArticleDetailResponse } from "@/lib/api/types"
import { LogoLoader } from "@/components/ui/Logo"
import { ArticleDetailsModal } from "@/components/common/ArticleDetailsModal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { BookOpen, AlertCircle, CheckCircle, XCircle, GitBranch } from "lucide-react"

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

    const handleResultClick = (article: ArticleResult) => {
        setSelectedArticle(article)
        setDialogOpen(true)
    }



    // Loading state
    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-center py-12">
                    <LogoLoader text="Buscando resultados..." />
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
            {/* Article Detail Dialog */}
            <ArticleDetailsModal
                article={selectedArticle}
                isOpen={dialogOpen}
                onOpenChange={setDialogOpen}
                onArticleChange={setSelectedArticle}
            />
        </div>
    )
}
