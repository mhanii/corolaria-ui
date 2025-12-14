"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchResults } from "@/components/search/SearchResults"
import { useSearch } from "@/hooks/useSearch"
import { useAuth } from "@/context/AuthContext"
import { LogoLoader } from "@/components/ui/Logo"

export default function BuscadorPage() {
    const router = useRouter()
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
    const {
        query,
        results,
        loading,
        error,
        hasSearched,
        performSearch,
        setQuery
    } = useSearch();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/login')
        }
    }, [isAuthenticated, isAuthLoading, router])

    const handleSearch = () => {
        if (query.trim()) {
            performSearch(query);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Show loading while checking auth
    if (isAuthLoading) {
        return (
            <div className="flex flex-col h-[calc(100vh-4rem)] items-center justify-center">
                <LogoLoader />
            </div>
        )
    }

    // Don't render if not authenticated (redirect will happen)
    if (!isAuthenticated) {
        return null
    }

    return (
        <div className="h-full flex flex-col max-w-7xl mx-auto">
            <div className="space-y-4 mb-4 md:mb-6 p-3 md:p-6">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="flex-1 relative" data-tour-id="search-input">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            placeholder="Buscar leyes, artículos, jurisprudencia..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="pl-10 h-12 text-base shadow-soft"
                            disabled={loading}
                        />
                    </div>
                    <Button
                        variant="default"
                        onClick={handleSearch}
                        disabled={loading || !query.trim()}
                        className="h-12 px-6"
                        data-tour-id="search-button"
                    >
                        Buscar
                    </Button>
                    <Button variant="outline" size="icon" className="h-12 w-12 shadow-soft hidden sm:flex">
                        <Filter className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex gap-2 sm:gap-3 flex-wrap">
                    <Select defaultValue="all">
                        <SelectTrigger className="w-full sm:w-40 shadow-soft">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los tipos</SelectItem>
                            <SelectItem value="ley">Leyes</SelectItem>
                            <SelectItem value="jurisprudencia">Jurisprudencia</SelectItem>
                            <SelectItem value="doctrina">Doctrina</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Hide category filter on mobile */}
                    <Select defaultValue="all-categories">
                        <SelectTrigger className="hidden sm:flex w-48 shadow-soft">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all-categories">Todas las categorías</SelectItem>
                            <SelectItem value="civil">Derecho Civil</SelectItem>
                            <SelectItem value="penal">Derecho Penal</SelectItem>
                            <SelectItem value="laboral">Derecho Laboral</SelectItem>
                            <SelectItem value="mercantil">Derecho Mercantil</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Hide sort filter on mobile */}
                    <Select defaultValue="relevance">
                        <SelectTrigger className="hidden sm:flex w-40 shadow-soft">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="relevance">Relevancia</SelectItem>
                            <SelectItem value="date">Fecha</SelectItem>
                            <SelectItem value="title">Título</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex-1 overflow-auto px-3 md:px-6 pb-4 md:pb-6">
                {hasSearched ? (
                    <SearchResults
                        results={results?.results || []}
                        loading={loading}
                        error={error}
                        query={query}
                    />
                ) : (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center text-muted-foreground">
                            <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p className="text-lg">Ingresa un término para comenzar la búsqueda</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

