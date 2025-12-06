import { useState, useRef } from "react";
import { FileText, FolderOpen, Star, Clock, ChevronDown, ChevronRight, Plus, MessageSquare, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export const Sidebar = () => {
    const [expandedSections, setExpandedSections] = useState < string[] > (["recentChats", "recentSearches", "cases"]);
    const fileInputRef = useRef < HTMLInputElement > (null);
    const { toast } = useToast();

    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
        );
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            toast({
                title: "Documentos agregados",
                description: `${files.length} archivo(s) agregado(s) a Mis Casos`,
            });
        }
    };

    const recentChats = [
        { name: "Consulta sobre despido laboral", type: "Chat" },
        { name: "Arrendamiento urbano dudas", type: "Chat" },
    ];

    const recentSearches = [
        { name: "Código Civil Art. 1254", type: "Ley" },
        { name: "Sentencia 123/2024", type: "Jurisprudencia" },
    ];

    const cases = [
        { name: "López vs. Inmobiliaria SA", status: "Activo" },
        { name: "Divorcio García", status: "En revisión" },
        { name: "Reclamación Pérez", status: "Pendiente" },
    ];

    return (
        <aside className="w-72 border-r border-border bg-card/30 backdrop-blur-sm flex flex-col">
            <div className="p-4 border-b border-border">
                <Button className="w-full justify-start gap-2 gradient-primary shadow-accent hover:opacity-90 transition-smooth">
                    <Plus className="w-4 h-4" />
                    Nuevo Documento
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                    {/* Recientes - Chats */}
                    <div>
                        <button
                            onClick={() => toggleSection("recentChats")}
                            className="flex items-center justify-between w-full text-sm font-medium text-foreground hover:text-accent transition-smooth mb-2"
                        >
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Chats Recientes
                            </div>
                            {expandedSections.includes("recentChats") ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </button>

                        {expandedSections.includes("recentChats") && (
                            <div className="space-y-1 ml-6">
                                {recentChats.map((item, idx) => (
                                    <button
                                        key={idx}
                                        className="flex items-start gap-2 w-full text-left p-2 rounded-lg hover:bg-muted transition-smooth group"
                                    >
                                        <MessageSquare className="w-4 h-4 text-muted-foreground group-hover:text-accent flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate group-hover:text-accent">
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{item.type}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Recientes - Búsquedas */}
                    <div>
                        <button
                            onClick={() => toggleSection("recentSearches")}
                            className="flex items-center justify-between w-full text-sm font-medium text-foreground hover:text-accent transition-smooth mb-2"
                        >
                            <div className="flex items-center gap-2">
                                <Search className="w-4 h-4" />
                                Búsquedas Recientes
                            </div>
                            {expandedSections.includes("recentSearches") ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </button>

                        {expandedSections.includes("recentSearches") && (
                            <div className="space-y-1 ml-6">
                                {recentSearches.map((item, idx) => (
                                    <button
                                        key={idx}
                                        className="flex items-start gap-2 w-full text-left p-2 rounded-lg hover:bg-muted transition-smooth group"
                                    >
                                        <FileText className="w-4 h-4 text-muted-foreground group-hover:text-accent flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate group-hover:text-accent">
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{item.type}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Casos */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <button
                                onClick={() => toggleSection("cases")}
                                className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent transition-smooth"
                            >
                                <FolderOpen className="w-4 h-4" />
                                Mis Casos
                                {expandedSections.includes("cases") ? (
                                    <ChevronDown className="w-4 h-4" />
                                ) : (
                                    <ChevronRight className="w-4 h-4" />
                                )}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-muted-foreground hover:text-accent transition-smooth"
                            >
                                <Upload className="w-4 h-4" />
                            </button>
                        </div>

                        {expandedSections.includes("cases") && (
                            <div className="space-y-1 ml-6">
                                {cases.map((caseItem, idx) => (
                                    <button
                                        key={idx}
                                        className="flex items-start gap-2 w-full text-left p-2 rounded-lg hover:bg-muted transition-smooth group"
                                    >
                                        <FolderOpen className="w-4 h-4 text-muted-foreground group-hover:text-accent flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate group-hover:text-accent">
                                                {caseItem.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{caseItem.status}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Favoritos */}
                    <div>
                        <button
                            onClick={() => toggleSection("favorites")}
                            className="flex items-center justify-between w-full text-sm font-medium text-foreground hover:text-accent transition-smooth mb-2"
                        >
                            <div className="flex items-center gap-2">
                                <Star className="w-4 h-4" />
                                Favoritos
                            </div>
                            {expandedSections.includes("favorites") ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </button>

                        {expandedSections.includes("favorites") && (
                            <div className="ml-6 text-sm text-muted-foreground py-2">
                                No hay favoritos
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>
        </aside>
    );
};
