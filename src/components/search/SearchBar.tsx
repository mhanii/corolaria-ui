'use client';

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2 } from "lucide-react"

interface SearchBarProps {
    /** Callback when search is submitted */
    onSearch: (query: string) => void;

    /** Current loading state */
    loading?: boolean;

    /** Initial query value */
    initialQuery?: string;
}

export function SearchBar({ onSearch, loading = false, initialQuery = '' }: SearchBarProps) {
    const [query, setQuery] = useState(initialQuery);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex w-full max-w-3xl items-center space-x-2">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Buscar leyes, artículos, jurisprudencia..."
                    className="pl-10 h-12 text-lg shadow-sm"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                />
            </div>
            <Button
                type="submit"
                size="lg"
                className="h-12 px-8"
                disabled={loading || !query.trim()}
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Buscando...
                    </>
                ) : (
                    'Buscar'
                )}
            </Button>
        </form>
    )
}
