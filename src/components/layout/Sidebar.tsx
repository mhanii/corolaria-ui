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
    FileText, FolderOpen, Star, ChevronDown, ChevronRight, ChevronLeft, Plus,
    MessageSquare, Search, Upload, LayoutDashboard, Scale, Folder, Loader2, X, PanelLeftClose, PanelLeft
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { uiConfig } from "@/config/uiConfig";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { getConversations, ConversationSummary } from "@/lib/api";

export function Sidebar() {
    const pathname = usePathname()
    const { isAuthenticated } = useAuth();
    const { isOpen, isCollapsed, close, toggleCollapse, refreshTrigger } = useSidebar();
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
    }, [isAuthenticated, refreshTrigger]);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        close();
    }, [pathname, close]);

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
        <>
            {/* Mobile Overlay Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={close}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed left-0 top-0 z-50 border-r border-border bg-card flex flex-col h-screen overflow-hidden",
                // Smooth transition for width
                "transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                // Width based on collapsed state
                isCollapsed ? "w-16" : "w-72",
                // Mobile: translate based on open state
                isOpen ? "translate-x-0" : "-translate-x-full",
                // Desktop: always visible
                "lg:translate-x-0"
            )}>
                {/* Logo Section */}
                <div className="border-b border-border flex items-center p-4 h-16">
                    {/* Logo - always on the left, clickable to expand when collapsed */}
                    {isCollapsed ? (
                        <button
                            onClick={toggleCollapse}
                            className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
                            title="Expandir"
                        >
                            <Logo size="md" />
                        </button>
                    ) : (
                        <Link href="/" className="flex items-center">
                            <Logo size="md" />
                        </Link>
                    )}
                    {/* Collapse button - desktop only, fades out when collapsed */}
                    <div
                        className={cn(
                            "ml-auto transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                            isCollapsed ? "opacity-0 max-w-0 overflow-hidden" : "opacity-100 max-w-[100px]"
                        )}
                    >
                        <button
                            className="hidden lg:flex items-center justify-center h-8 w-8 rounded-lg hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors"
                            onClick={toggleCollapse}
                            title="Contraer"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        {/* Close button - mobile only */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden h-8 w-8"
                            onClick={close}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="space-y-4 p-4">

                        {/* Main Navigation */}
                        <nav className="grid gap-1">
                            {mainNav.map((item, index) => (
                                <Link
                                    key={index}
                                    href={item.href}
                                    onClick={(e) => {
                                        // Only force refresh when clicking Chat from an existing chat (with ID)
                                        // If already on /chat (new chat), do nothing
                                        if (item.href === '/chat' && pathname?.startsWith('/chat')) {
                                            e.preventDefault();
                                            // Only reload if we're on a chat with an ID
                                            if (pathname !== '/chat') {
                                                window.location.href = '/chat';
                                            }
                                        }
                                    }}
                                    className={cn(
                                        "flex items-center rounded-lg hover:bg-muted px-3 h-10",
                                        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                                        pathname === item.href ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                                    )}
                                    title={isCollapsed ? item.name : undefined}
                                >
                                    <item.icon className="h-5 w-5 flex-shrink-0" />
                                    <span
                                        className={cn(
                                            "text-base font-medium whitespace-nowrap overflow-hidden ml-3",
                                            "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                                            isCollapsed ? "max-w-0 opacity-0 ml-0" : "max-w-[200px] opacity-100"
                                        )}
                                    >
                                        {item.name}
                                    </span>
                                </Link>
                            ))}
                        </nav>

                        {!isCollapsed && <Separator />}

                        {/* Mis Casos - with directory structure */}
                        {!isCollapsed && uiConfig.sidebar.cases && (
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
                                                                href={`/chat/${encodeURIComponent(chat.id)}`}
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

                        {!isCollapsed && uiConfig.sidebar.cases && <Separator />}

                        {/* Recientes - Chats (only show when authenticated) */}
                        {!isCollapsed && isAuthenticated && (
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
                                    <button
                                        onClick={() => {
                                            // Only navigate if we're on a chat with an ID
                                            // If already on /chat (new chat), do nothing
                                            if (pathname !== '/chat') {
                                                window.location.href = '/chat';
                                            }
                                        }}
                                        className="text-muted-foreground hover:text-foreground transition-smooth"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>

                                {expandedSections.includes("recentChats") && (
                                    <div className="space-y-1 ml-6">
                                        {isLoadingChats ? (
                                            <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                                                <Logo size="sm" animate />
                                                <span className="animate-pulse">Cargando...</span>
                                            </div>
                                        ) : conversations.length === 0 ? (
                                            <div className="text-sm text-muted-foreground p-2">
                                                No hay chats recientes
                                            </div>
                                        ) : (
                                            conversations.slice(0, 10).map((conv) => (
                                                <Link
                                                    key={conv.id}
                                                    href={`/chat/${encodeURIComponent(conv.id)}`}
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

                        {!isCollapsed && isAuthenticated && <Separator />}

                        {/* Recientes - Búsquedas */}
                        {!isCollapsed && uiConfig.sidebar.recentSearches && (
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

                        {!isCollapsed && uiConfig.sidebar.recentSearches && <Separator />}

                        {/* Favoritos */}
                        {!isCollapsed && uiConfig.sidebar.favorites && (
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
        </>
    );
}
