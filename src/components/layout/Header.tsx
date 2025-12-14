"use client"

import { Bell, Settings, User, LogOut, Coins, Menu, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
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
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/context/ThemeContext";

export function Header() {
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuth();
    const { toggle, isCollapsed } = useSidebar();
    const { theme, toggleTheme } = useTheme();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <header
            className={`fixed top-0 right-0 z-40 h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 transition-[left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] left-0 ${isCollapsed ? 'lg:left-16' : 'lg:left-72'}`}
        >
            <div className="flex items-center gap-3">
                {/* Hamburger menu - mobile only */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden h-9 w-9"
                    onClick={toggle}
                >
                    <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-display font-bold text-foreground">Athen</h1>
            </div>

            <div className="flex items-center gap-1 md:gap-2">
                {/* Token Balance Badge - Show when authenticated */}
                {isAuthenticated && user && (
                    <div className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-accent/10 text-accent text-xs md:text-sm font-medium">
                        <Coins className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span>{user.available_tokens.toLocaleString()}</span>
                        <span className="hidden sm:inline">tokens</span>
                    </div>
                )}

                {/* Theme Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="relative"
                    aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {theme === 'dark' ? (
                        <Sun className="w-5 h-5 transition-transform duration-200" />
                    ) : (
                        <Moon className="w-5 h-5 transition-transform duration-200" />
                    )}
                </Button>

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

