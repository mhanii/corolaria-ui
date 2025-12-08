"use client"

import { Bell, Settings, User, LogOut, Coins } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { uiConfig } from "@/config/uiConfig";
import { useAuth } from "@/context/AuthContext";

export function Header() {
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuth();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
                <h1 className="text-xl font-display font-bold text-foreground">Coloraria</h1>
                <p className="text-xs text-muted-foreground">Asistente Legal Inteligente</p>
            </div>

            <div className="flex items-center gap-2">
                {/* Token Balance Badge - Show when authenticated */}
                {isAuthenticated && user && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium">
                        <Coins className="w-4 h-4" />
                        <span>{user.available_tokens.toLocaleString()} tokens</span>
                    </div>
                )}

                {uiConfig.header.notifications && (
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full" />
                    </Button>
                )}

                {uiConfig.header.settings && (
                    <Button variant="ghost" size="icon">
                        <Settings className="w-5 h-5" />
                    </Button>
                )}

                {isAuthenticated ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <User className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.username}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {user?.available_tokens.toLocaleString()} tokens disponibles
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Perfil</DropdownMenuItem>
                            <DropdownMenuItem>Configuración</DropdownMenuItem>
                            <DropdownMenuItem>Ayuda</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive cursor-pointer"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Cerrar Sesión
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Link href="/login">
                        <Button variant="outline" size="sm" className="gap-2">
                            <User className="w-4 h-4" />
                            Iniciar Sesión
                        </Button>
                    </Link>
                )}
            </div>
        </header>
    );
}

