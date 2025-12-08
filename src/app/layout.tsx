import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Inter, Crimson_Pro } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const crimsonPro = Crimson_Pro({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Coloraria - Copiloto Legal",
  description: "Asistente legal inteligente para abogados.",
};

import { Header } from "@/components/layout/Header";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${crimsonPro.variable}`} suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <AuthProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden ml-72">
              <Header />
              <main className="flex-1 overflow-y-auto bg-muted/10">
                {children}
              </main>
            </div>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

