"use client"

import { useState, useEffect } from "react";
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { DirectoryDialog } from "@/components/sidebar/DirectoryDialog";
import {
    FileText, FolderOpen, Star, ChevronDown, ChevronRight, Plus,
    MessageSquare, Search, Upload, LayoutDashboard, Scale, Folder, Sparkles, Loader2
} from "lucide-react";
import { uiConfig } from "@/config/uiConfig";
import { useAuth } from "@/context/AuthContext";
import { getConversations, ConversationSummary } from "@/lib/api";

export function Sidebar() {
    const pathname = usePathname()
    const { isAuthenticated } = useAuth();
    const [expandedSections, setExpandedSections] = useState<string[]>(["cases", "recentChats", "recentSearches"]);
    const [expandedDirectories, setExpandedDirectories] = useState<string[]>(["dir1"]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const { toast } = useToast();

    // Fetch conversations when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            fetchConversations();
        } else {
            setConversations([]);
        }
    }, [isAuthenticated]);

    const fetchConversations = async () => {
        try {
            setIsLoadingChats(true);
            const response = await getConversations();
            setConversations(response.conversations);
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setIsLoadingChats(false);
        }
    };


    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
        );
    };

    const toggleDirectory = (dirId: string) => {
        setExpandedDirectories(prev =>
            prev.includes(dirId) ? prev.filter(d => d !== dirId) : [...prev, dirId]
        );
    };

    const handleCreateDirectory = (name: string) => {
        toast({
            title: "Directorio creado",
            description: `"${name}" ha sido creado exitosamente.`,
        });
    };

    const mainNav = [
        { name: "Inicio", href: "/", icon: LayoutDashboard },
        { name: "Buscador", href: "/buscador", icon: Search },
        { name: "Chat", href: "/chat", icon: MessageSquare },
        { name: "Editor", href: "/editor", icon: FileText },
    ]

    const directories = [
        {
            id: "dir1",
            name: "Casos Laborales",
            chats: [
                { id: "1", name: "Despido improcedente", preview: "Consulta sobre indemnización..." },
                { id: "2", name: "Horas extras", preview: "Reclamación de horas..." },
            ]
        },
        {
            id: "dir2",
            name: "Derecho Civil",
            chats: [
                { id: "3", name: "Arrendamiento", preview: "Contrato de alquiler..." },
            ]
        },
    ];

    const recentChats = [
        { name: "Consulta despido", type: "Chat", href: "/chat" },
        { name: "Arrendamiento dudas", type: "Chat", href: "/chat" },
    ];

    const recentSearches = [
        { name: "Código Civil Art. 1254", type: "Ley", href: "/buscador" },
        { name: "Sentencia 123/2024", type: "Jurisprudencia", href: "/buscador" },
    ];

    return (
        <aside className="fixed left-0 top-0 z-40 w-72 border-r border-border bg-card flex flex-col h-screen overflow-hidden">
            {/* Logo Section */}
            <div className="p-6 border-b border-border">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-smooth">
                        <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold font-display text-foreground group-hover:text-primary transition-smooth">Coloraria</h2>
                        <p className="text-xs text-muted-foreground">Asistente Legal IA</p>
                    </div>
                </Link>
            </div>

            <ScrollArea className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">

                    {/* Main Navigation */}
                    <nav className="grid gap-1">
                        {mainNav.map((item, index) => (
                            <Link
                                key={index}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-smooth hover:bg-muted",
                                    pathname === item.href ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    <Separator />

                    {/* Mis Casos - with directory structure */}
                    {uiConfig.sidebar.cases && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <button
                                    onClick={() => toggleSection("cases")}
                                    className="flex items-center gap-2 text-base font-medium text-foreground hover:text-foreground/80 transition-smooth"
                                >
                                    <FolderOpen className="w-5 h-5" />
                                    Mis Casos
                                    {expandedSections.includes("cases") ? (
                                        <ChevronDown className="w-4 h-4" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setDialogOpen(true)}
                                    className="text-muted-foreground hover:text-foreground transition-smooth"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            {expandedSections.includes("cases") && (
                                <div className="space-y-1 ml-2">
                                    {directories.map((directory) => (
                                        <div key={directory.id}>
                                            <button
                                                onClick={() => toggleDirectory(directory.id)}
                                                className="flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-muted transition-smooth group"
                                            >
                                                <Folder className="w-4 h-4 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
                                                <span className="text-base font-medium text-foreground truncate group-hover:text-foreground/80 flex-1">
                                                    {directory.name}
                                                </span>
                                                {expandedDirectories.includes(directory.id) ? (
                                                    <ChevronDown className="w-4 h-4" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4" />
                                                )}
                                            </button>

                                            {expandedDirectories.includes(directory.id) && (
                                                <div className="ml-6 space-y-1 mt-1">
                                                    {directory.chats.map((chat) => (
                                                        <Link
                                                            key={chat.id}
                                                            href={`/chat?id=${encodeURIComponent(chat.name)}`}
                                                            className="flex items-start gap-2 w-full text-left p-2 rounded-lg hover:bg-muted transition-smooth group"
                                                        >
                                                            <MessageSquare className="w-4 h-4 text-muted-foreground group-hover:text-foreground flex-shrink-0 mt-0.5" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-base font-medium text-foreground truncate group-hover:text-foreground/80">
                                                                    {chat.name}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground truncate">{chat.preview}</p>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {uiConfig.sidebar.cases && <Separator />}

                    {/* Recientes - Chats (only show when authenticated) */}
                    {isAuthenticated && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <button
                                    onClick={() => toggleSection("recentChats")}
                                    className="flex items-center gap-2 text-base font-medium text-foreground hover:text-foreground/80 transition-smooth"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                    Chats Recientes
                                    {expandedSections.includes("recentChats") ? (
                                        <ChevronDown className="w-4 h-4" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4" />
                                    )}
                                </button>
                                <Link href="/chat" className="text-muted-foreground hover:text-foreground transition-smooth">
                                    <Plus className="w-5 h-5" />
                                </Link>
                            </div>

                            {expandedSections.includes("recentChats") && (
                                <div className="space-y-1 ml-6">
                                    {isLoadingChats ? (
                                        <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Cargando...
                                        </div>
                                    ) : conversations.length === 0 ? (
                                        <div className="text-sm text-muted-foreground p-2">
                                            No hay chats recientes
                                        </div>
                                    ) : (
                                        conversations.slice(0, 10).map((conv) => (
                                            <Link
                                                key={conv.id}
                                                href={`/chat?id=${encodeURIComponent(conv.id)}`}
                                                className="flex items-start gap-2 w-full text-left p-2 rounded-lg hover:bg-muted transition-smooth group"
                                            >
                                                <MessageSquare className="w-4 h-4 text-muted-foreground group-hover:text-foreground flex-shrink-0 mt-0.5" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-base font-medium text-foreground truncate group-hover:text-foreground/80 max-w-[180px]">
                                                        {conv.preview || 'Nueva conversación'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {conv.message_count} mensajes
                                                    </p>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {isAuthenticated && <Separator />}

                    {/* Recientes - Búsquedas */}
                    {uiConfig.sidebar.recentSearches && (
                        <div>
                            <button
                                onClick={() => toggleSection("recentSearches")}
                                className="flex items-center justify-between w-full text-base font-medium text-foreground hover:text-foreground/80 transition-smooth mb-2"
                            >
                                <div className="flex items-center gap-2">
                                    <Search className="w-5 h-5" />
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
                                        <Link
                                            key={idx}
                                            href={item.href}
                                            className="flex items-start gap-2 w-full text-left p-2 rounded-lg hover:bg-muted transition-smooth group"
                                        >
                                            <FileText className="w-4 h-4 text-muted-foreground group-hover:text-foreground flex-shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-base font-medium text-foreground truncate group-hover:text-foreground/80">
                                                    {item.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">{item.type}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {uiConfig.sidebar.recentSearches && <Separator />}

                    {/* Favoritos */}
                    {uiConfig.sidebar.favorites && (
                        <div>
                            <button
                                onClick={() => toggleSection("favorites")}
                                className="flex items-center justify-between w-full text-base font-medium text-foreground hover:text-foreground/80 transition-smooth mb-2"
                            >
                                <div className="flex items-center gap-2">
                                    <Star className="w-5 h-5" />
                                    Favoritos
                                </div>
                                {expandedSections.includes("favorites") ? (
                                    <ChevronDown className="w-4 h-4" />
                                ) : (
                                    <ChevronRight className="w-4 h-4" />
                                )}
                            </button>

                            {expandedSections.includes("favorites") && (
                                <div className="ml-6 text-base text-muted-foreground py-2">
                                    No hay favoritos
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </ScrollArea>

            <DirectoryDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onCreateDirectory={handleCreateDirectory}
            />
        </aside>
    );
}
