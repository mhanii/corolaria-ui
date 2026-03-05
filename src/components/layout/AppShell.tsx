"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { MainContent } from "@/components/layout/MainContent";
import { Header } from "@/components/layout/Header";
import { LogoLoader } from "@/components/ui/Logo";
import { useAuth } from "@/context/AuthContext";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  const isHome = pathname === "/";
  const isLogin = pathname?.startsWith("/login");

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && isHome) {
      router.replace("/chat");
      return;
    }

    if (!isAuthenticated && !isHome && !isLogin) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, isHome, isLogin, router]);

  if (isLoading) {
    return (
      <div className="min-h-app flex items-center justify-center bg-background">
        <LogoLoader text="Cargando..." size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || isLogin) {
    return (
      <div className="min-h-app">
        <Header />
        <main className="min-h-app-frame pt-16">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-app">
      <Sidebar />
      <MainContent>
        <Header />
        <main className="flex-1 overflow-y-auto scroll-touch bg-muted/10 pt-16">{children}</main>
      </MainContent>
    </div>
  );
}
