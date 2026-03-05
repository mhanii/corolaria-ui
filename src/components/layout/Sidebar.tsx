"use client"

import { useState, useEffect, useCallback } from "react";
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { DirectoryDialog } from "@/components/sidebar/DirectoryDialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import {
    FileText, ChevronDown, ChevronRight, ChevronLeft, Plus,
    MessageSquare, Search, Folder, X, Trash2
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { uiConfig } from "@/config/uiConfig";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { getConversations, deleteConversation, ConversationSummary } from "@/lib/api";

// Static data — defined at module level so they're never recreated on render
const MAIN_NAV = [
    { name: "Buscador", href: "/buscador", icon: Search },
    { name: "Chat", href: "/chat", icon: MessageSquare },
]

const DIRECTORIES = [
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
]

const RECENT_SEARCHES = [
    { name: "Código Civil Art. 1254", type: "Ley", href: "/buscador" },
    { name: "Sentencia 123/2024", type: "Jurisprudencia", href: "/buscador" },
]

const SECTION_HEADING_CLASS = "text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70 group-hover:text-muted-foreground";

const groupConversationsByDate = (conversations: ConversationSummary[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setDate(lastMonth.getDate() - 30);

    const groups: { [key: string]: ConversationSummary[] } = {
        "Hoy": [],
        "Ayer": [],
        "Últimos 7 días": [],
        "Últimos 30 días": [],
        "Anteriores": []
    };

    conversations.forEach(conv => {
        // Fallback to created_at if updated_at is missing for some reason
        const dateString = conv.updated_at || conv.created_at;
        const date = new Date(dateString);
        if (date >= today) groups["Hoy"].push(conv);
        else if (date >= yesterday) groups["Ayer"].push(conv);
        else if (date >= lastWeek) groups["Últimos 7 días"].push(conv);
        else if (date >= lastMonth) groups["Últimos 30 días"].push(conv);
        else groups["Anteriores"].push(conv);
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
};

export function Sidebar() {
    const pathname = usePathname()
    const { isAuthenticated } = useAuth();
    const { isOpen, isCollapsed, close, toggleCollapse, refreshTrigger, triggerRefresh } = useSidebar();
    const [expandedSections, setExpandedSections] = useState<string[]>(["cases", "recentChats", "recentSearches"]);
    const [expandedDirectories, setExpandedDirectories] = useState<string[]>(["dir1"]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [chatToDelete, setChatToDelete] = useState<{ id: string; name: string } | null>(null);
    const { toast } = useToast();

    const [isMobileViewport, setIsMobileViewport] = useState(false);

    // Fetch conversations when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            fetchConversations();
        } else {
            setConversations([]);
        }
    }, [isAuthenticated, refreshTrigger]);

    useEffect(() => {
        const checkViewport = () => setIsMobileViewport(window.innerWidth < 1024);
        checkViewport();
        window.addEventListener("resize", checkViewport);
        return () => window.removeEventListener("resize", checkViewport);
    }, []);

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


    const toggleSection = useCallback((section: string) => {
        setExpandedSections(prev =>
            prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
        );
    }, []);

    const toggleDirectory = useCallback((dirId: string) => {
        setExpandedDirectories(prev =>
            prev.includes(dirId) ? prev.filter(d => d !== dirId) : [...prev, dirId]
        );
    }, []);

    const handleCreateDirectory = useCallback((name: string) => {
        toast({
            title: "Directorio creado",
            description: `"${name}" ha sido creado exitosamente.`,
        });
    }, [toast]);

    const handleDeleteClick = useCallback((e: React.MouseEvent, chat: ConversationSummary) => {
        e.preventDefault();
        e.stopPropagation();
        setChatToDelete({
            id: chat.id,
            name: chat.preview || 'Nueva conversación'
        });
        setIsDeleteDialogOpen(true);
    }, []);

    const confirmDeleteChat = useCallback(async () => {
        if (!chatToDelete) return;

        try {
            await deleteConversation(chatToDelete.id);
            toast({
                title: "Conversación eliminada",
                description: "La conversación ha sido eliminada exitosamente.",
            });

            // If we are currently on the deleted chat, navigate to new chat
            if (pathname === `/chat/${chatToDelete.id}`) {
                window.location.href = '/chat';
            }

            triggerRefresh();
        } catch (error) {
            console.error('Failed to delete conversation:', error);
            toast({
                title: "Error",
                description: "No se pudo eliminar la conversación.",
                variant: "destructive"
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setChatToDelete(null);
        }
    }, [chatToDelete, pathname, triggerRefresh, toast]);

    // (Static nav/directory data moved to module level — see MAIN_NAV, DIRECTORIES, RECENT_SEARCHES above)

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
                "fixed left-0 top-0 z-50 border-r border-border/70 bg-card/95 backdrop-blur-md flex flex-col h-app font-display shadow-soft",
                "transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                isCollapsed && !isMobileViewport ? "w-16" : "w-[88vw] max-w-80 lg:w-80",
                isOpen ? "translate-x-0" : "-translate-x-full",
                "lg:translate-x-0"
            )}>
                {/* Logo / Header Row */}
                <div className="border-b border-border/70 flex items-center px-3 h-16 pt-safe flex-shrink-0 bg-gradient-to-r from-background to-muted/20">
                    {isCollapsed && !isMobileViewport ? (
                        <button
                            onClick={toggleCollapse}
                            className="flex items-center justify-center h-10 w-10 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                            title="Expandir"
                        >
                            <Logo size="md" />
                        </button>
                    ) : (
                        <Link href="/" className="flex items-center">
                            <Logo size="md" />
                        </Link>
                    )}
                    <div
                        className={cn(
                            "ml-auto transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                            isCollapsed && !isMobileViewport ? "opacity-0 max-w-0 overflow-hidden" : "opacity-100 max-w-[100px]"
                        )}
                    >
                        <button
                            className="hidden lg:flex items-center justify-center h-8 w-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={toggleCollapse}
                            title="Contraer"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden h-8 w-8"
                            onClick={close}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Sidebar Content (fixed), only recent chats list scrolls */}
                <div className="flex-1 min-h-0 py-4 px-3 min-w-0 h-full flex flex-col overflow-hidden pb-safe">

                        {/* Main Navigation */}
                        <nav className="space-y-1 mb-4 min-w-0">
                            {MAIN_NAV.map((item, index) => (
                                <Link
                                    key={index}
                                    href={item.href}
                                    onClick={(e) => {
                                        if (item.href === '/chat' && pathname?.startsWith('/chat')) {
                                            e.preventDefault();
                                            if (pathname !== '/chat') {
                                                window.location.href = '/chat';
                                            }
                                        }
                                    }}
                                    className={cn(
                                        "relative flex items-center gap-3 rounded-xl px-3.5 h-11 transition-all duration-200 group min-w-0 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                                        pathname === item.href
                                            ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                                            : "border-transparent text-muted-foreground hover:bg-black/[0.02] dark:hover:bg-white/[0.02] hover:text-foreground hover:border-border/70"
                                    )}
                                    title={isCollapsed ? item.name : undefined}
                                >
                                    {pathname === item.href && !isCollapsed && (
                                        <span className="absolute left-1.5 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-primary/70" />
                                    )}
                                    <item.icon className={cn(
                                        "h-[18px] w-[18px] flex-shrink-0 transition-colors",
                                        pathname === item.href ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                    )} />
                                    <span className={cn(
                                        "text-[0.95rem] font-medium whitespace-nowrap overflow-hidden tracking-normal transition-all duration-300",
                                        isCollapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100"
                                    )}>
                                        {item.name}
                                    </span>
                                </Link>
                            ))}
                        </nav>

                        {!isCollapsed && <Separator className="my-3" />}

                        {/* Mis Casos */}
                        {!isCollapsed && uiConfig.sidebar.cases && (
                            <div className="mb-4 min-w-0">
                                <div className="flex items-center justify-between px-1 mb-2">
                                    <button
                                        onClick={() => toggleSection("cases")}
                                        className="flex items-center gap-1.5 group"
                                    >
                                        <span className={cn(SECTION_HEADING_CLASS, "transition-colors")}>
                                            Mis Casos
                                        </span>
                                        {expandedSections.includes("cases")
                                            ? <ChevronDown className="w-3 h-3 text-muted-foreground/60" />
                                            : <ChevronRight className="w-3 h-3 text-muted-foreground/60" />}
                                    </button>
                                    <button
                                        onClick={() => setDialogOpen(true)}
                                        className="p-1 rounded text-muted-foreground/60 hover:text-foreground hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all"
                                        title="Nuevo caso"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {expandedSections.includes("cases") && (
                                    <div className="space-y-0.5 min-w-0">
                                        {DIRECTORIES.map((directory) => (
                                            <div key={directory.id} className="min-w-0">
                                                <button
                                                    onClick={() => toggleDirectory(directory.id)}
                                                    className="flex items-center gap-2.5 w-full text-left px-2 py-2 rounded-sm hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all group h-10"
                                                >
                                                    <Folder className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                    <span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
                                                        {directory.name}
                                                    </span>
                                                    {expandedDirectories.includes(directory.id)
                                                        ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                                        : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                                                </button>

                                                {expandedDirectories.includes(directory.id) && (
                                                    <div className="ml-4 pl-3 border-l border-border/50 mt-0.5 space-y-0.5 min-w-0">
                                                        {directory.chats.map((chat) => (
                                                            <Link
                                                                key={chat.id}
                                                                href={`/chat/${encodeURIComponent(chat.id)}`}
                                                                className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all group h-10"
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-foreground truncate w-[210px] sm:w-[240px] lg:w-[275px] group-hover:text-primary transition-colors">
                                                                        {chat.name}
                                                                    </p>
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

                        {!isCollapsed && uiConfig.sidebar.cases && <Separator className="my-3" />}

                        {/* Chats Recientes */}
                        {!isCollapsed && isAuthenticated && (
                            <div className="mb-4 min-w-0 flex flex-col flex-1 min-h-0">
                                <div className="flex items-center justify-between px-1 mb-2">
                                    <button
                                        onClick={() => toggleSection("recentChats")}
                                        className="flex items-center gap-1.5 group"
                                    >
                                        <span className="text-sm font-semibold tracking-normal text-muted-foreground/90 group-hover:text-foreground transition-colors">
                                            Chats recientes
                                        </span>
                                        {expandedSections.includes("recentChats")
                                            ? <ChevronDown className="w-3 h-3 text-muted-foreground/60" />
                                            : <ChevronRight className="w-3 h-3 text-muted-foreground/60" />}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (pathname !== '/chat') window.location.href = '/chat';
                                        }}
                                        className="p-1 rounded text-muted-foreground/60 hover:text-foreground hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all"
                                        title="Nuevo chat"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {expandedSections.includes("recentChats") && (
                                    <div className="min-w-0 relative flex-1 min-h-0">
                                        <ScrollArea className="h-full pr-1">
                                            <div className="space-y-3 min-w-0 pb-8">
                                                {isLoadingChats ? (
                                                    <div className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground min-w-0">
                                                        <Logo size="sm" animate />
                                                        <span className="animate-pulse">Cargando...</span>
                                                    </div>
                                                ) : conversations.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground px-2 py-1">
                                                        No hay chats recientes
                                                    </p>
                                                ) : (
                                                    groupConversationsByDate(conversations).map(([groupName, items]) => (
                                                        <div key={groupName} className="mb-3 min-w-0">
                                                            <p className="text-[0.85rem] italic font-medium tracking-normal text-muted-foreground/60 px-2 mb-2">
                                                                {groupName}
                                                            </p>
                                                            <div className="space-y-1.5 min-w-0">
                                                                {items.map((conv) => (
                                                                    <div key={conv.id} className="relative group min-w-0">
                                                                        {(() => {
                                                                            const chatPath = `/chat/${encodeURIComponent(conv.id)}`;
                                                                            const isActive = pathname === chatPath;
                                                                            return (
                                                                        <Link
                                                                            href={chatPath}
                                                                            className={cn(
                                                                                "flex items-start w-full text-left px-3 py-2.5 rounded-xl border transition-all duration-150 pr-10",
                                                                                isActive
                                                                                    ? "bg-primary/10 border-primary/30 opacity-100"
                                                                                    : "border-transparent bg-muted/10 hover:border-border/70 hover:bg-muted/25 opacity-65 hover:opacity-85"
                                                                            )}
                                                                        >
                                                                            <div className="min-w-0 w-full">
                                                                                <p className={cn(
                                                                                    "text-sm font-medium transition-colors truncate w-[210px] sm:w-[240px] lg:w-[275px]",
                                                                                    isActive ? "text-foreground" : "text-foreground/85 group-hover:text-foreground"
                                                                                )}>
                                                                                    {conv.preview || 'Nueva conversación'}
                                                                                </p>
                                                                                <p className={cn(
                                                                                    "text-[0.72rem] mt-0.5",
                                                                                    isActive ? "text-muted-foreground/90" : "text-muted-foreground/75"
                                                                                )}>
                                                                                    {conv.message_count} mensajes
                                                                                </p>
                                                                            </div>
                                                                        </Link>
                                                                            );
                                                                        })()}
                                                                        <button
                                                                            onClick={(e) => handleDeleteClick(e, conv)}
                                                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-150 z-10"
                                                                            title="Eliminar chat"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </ScrollArea>
                                        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card/95 to-transparent" />
                                    </div>
                                )}
                            </div>
                        )}

                        {!isCollapsed && isAuthenticated && <Separator className="my-3" />}

                        {/* Búsquedas Recientes */}
                        {!isCollapsed && uiConfig.sidebar.recentSearches && (
                            <div className="mb-4 min-w-0">
                                <button
                                    onClick={() => toggleSection("recentSearches")}
                                    className="flex items-center gap-1.5 px-1 mb-2 w-full group"
                                >
                                    <span className={cn(SECTION_HEADING_CLASS, "transition-colors flex-1 text-left")}>
                                        Búsquedas Recientes
                                    </span>
                                    {expandedSections.includes("recentSearches")
                                        ? <ChevronDown className="w-3 h-3 text-muted-foreground/60" />
                                        : <ChevronRight className="w-3 h-3 text-muted-foreground/60" />}
                                </button>

                                {expandedSections.includes("recentSearches") && (
                                    <div className="space-y-0.5 min-w-0">
                                        {RECENT_SEARCHES.map((item, idx) => (
                                            <Link
                                                key={idx}
                                                href={item.href}
                                                className="flex items-center gap-2.5 px-2 py-2 rounded-sm hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all group overflow-hidden h-11"
                                            >
                                                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground/80 truncate max-w-full group-hover:text-foreground transition-colors">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground/60 truncate max-w-full">{item.type}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {!isCollapsed && uiConfig.sidebar.recentSearches && <Separator className="my-3" />}

                        {/* Favoritos */}
                        {!isCollapsed && uiConfig.sidebar.favorites && (
                            <div className="mb-4 min-w-0">
                                <button
                                    onClick={() => toggleSection("favorites")}
                                    className="flex items-center gap-1.5 px-1 mb-2 w-full group"
                                >
                                    <span className={cn(SECTION_HEADING_CLASS, "transition-colors flex-1 text-left")}>
                                        Favoritos
                                    </span>
                                    {expandedSections.includes("favorites")
                                        ? <ChevronDown className="w-3 h-3 text-muted-foreground/60" />
                                        : <ChevronRight className="w-3 h-3 text-muted-foreground/60" />}
                                </button>

                                {expandedSections.includes("favorites") && (
                                    <p className="text-sm text-muted-foreground/60 px-2 py-1">
                                        No hay favoritos
                                    </p>
                                )}
                            </div>
                        )}
                </div>

                <DirectoryDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    onCreateDirectory={handleCreateDirectory}
                />

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>¿Eliminar conversación?</DialogTitle>
                            <DialogDescription>
                                Esta acción no se puede deshacer. Se eliminarán todos los mensajes de la conversación &quot;{chatToDelete?.name}&quot;.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <DialogClose asChild>
                                <Button variant="outline">Cancelar</Button>
                            </DialogClose>
                            <Button variant="destructive" onClick={confirmDeleteChat}>
                                Eliminar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </aside>
        </>
    );
}
