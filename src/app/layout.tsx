import type { Metadata } from "next";
import "./globals.css";
import { Inter, Crimson_Pro } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const crimsonPro = Crimson_Pro({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Athen - Copiloto Legal",
  description: "Asistente legal inteligente para abogados.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { BetaProvider } from "@/context/BetaContext";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { AppShell } from "@/components/layout/AppShell";
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
                  <AppShell>{children}</AppShell>
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
