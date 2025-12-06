"use client"

import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchResults } from "@/components/search/SearchResults"
import { useSearch } from "@/hooks/useSearch"

export default function BuscadorPage() {
    const {
        query,
        results,
        loading,
        error,
        hasSearched,
        performSearch,
        setQuery
    } = useSearch();

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

    return (
        <div className="h-full flex flex-col max-w-7xl mx-auto">
            <div className="space-y-4 mb-6 p-6">
                <div className="flex gap-3">
                    <div className="flex-1 relative">
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
                    >
                        Buscar
                    </Button>
                    <Button variant="outline" size="icon" className="h-12 w-12 shadow-soft">
                        <Filter className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex gap-3 flex-wrap">
                    <Select defaultValue="all">
                        <SelectTrigger className="w-40 shadow-soft">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los tipos</SelectItem>
                            <SelectItem value="ley">Leyes</SelectItem>
                            <SelectItem value="jurisprudencia">Jurisprudencia</SelectItem>
                            <SelectItem value="doctrina">Doctrina</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select defaultValue="all-categories">
                        <SelectTrigger className="w-48 shadow-soft">
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

                    <Select defaultValue="relevance">
                        <SelectTrigger className="w-40 shadow-soft">
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

            <div className="flex-1 overflow-auto px-6 pb-6">
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
