import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Inter, Crimson_Pro } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const crimsonPro = Crimson_Pro({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Coloraria - Copiloto Legal",
  description: "Asistente legal inteligente para abogados.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

import { Header } from "@/components/layout/Header";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { BetaProvider } from "@/context/BetaContext";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { MainContent } from "@/components/layout/MainContent";
import { SurveyModal } from "@/components/beta";
import { ChatTour, SearchTour } from "@/components/onboarding";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${crimsonPro.variable}`} suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>
            <BetaProvider>
              <OnboardingProvider>
                <SidebarProvider>
                  <div className="flex min-h-screen">
                    <Sidebar />
                    <MainContent>
                      <Header />
                      <main className="flex-1 overflow-y-auto bg-muted/10 pt-16">
                        {children}
                      </main>
                    </MainContent>
                  </div>
                  <Toaster />
                  {/* Global Beta Modals */}
                  <SurveyModal />
                  {/* Contextual Onboarding Tours */}
                  <ChatTour />
                  <SearchTour />
                </SidebarProvider>
              </OnboardingProvider>
            </BetaProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
