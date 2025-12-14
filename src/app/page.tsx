import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, MessageSquare, FileText, ArrowRight, Scale, Shield, Zap, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section - Bold & Welcoming */}
      <section className="relative overflow-hidden bg-gradient-subtle">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20 lg:py-28">
          <div className="text-center space-y-5 md:space-y-6">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              {/* Show xl on mobile, 2xl on desktop */}
              <div className="md:hidden">
                <Logo size="xl" />
              </div>
              <div className="hidden md:block">
                <Logo size="2xl" />
              </div>
            </div>

            {/* Main headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-display bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
              Bienvenido a Coloraria
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
              Tu asistente legal potenciado por inteligencia artificial para búsqueda legal, consultas interactivas y redacción de documentos
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 px-4 sm:px-0">
              <Link href="/chat" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto px-8 h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  Iniciar Chat
                  <MessageSquare className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/buscador" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto px-8 h-12 text-base font-medium"
                >
                  Explorar Buscador
                  <Search className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Elegant Grid */}
      <section className="border-t border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          {/* Section heading */}


          {/* Feature cards */}
          <div className="grid gap-6 md:gap-8 md:grid-cols-3">
            {/* Buscador */}
            <Link href="/buscador" className="group block">
              <div className="h-full p-6 md:p-8 rounded-2xl border border-border bg-card/50 hover:bg-card hover:border-accent/30 hover:shadow-lg transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                  <Search className="h-5 w-5 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                  Buscador Legal
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Búsqueda semántica en legislación española. Encuentra artículos por concepto, no solo palabras clave.
                </p>
              </div>
            </Link>

            {/* Chat */}
            <Link href="/chat" className="group block">
              <div className="h-full p-6 md:p-8 rounded-2xl border border-border bg-card/50 hover:bg-card hover:border-accent/30 hover:shadow-lg transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                  <MessageSquare className="h-5 w-5 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                  Asistente IA
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Consultas legales con respuestas fundamentadas. Análisis de casos con referencias precisas.
                </p>
              </div>
            </Link>

            {/* Editor */}
            <Link href="/editor" className="group block">
              <div className="h-full p-6 md:p-8 rounded-2xl border border-border bg-card/50 hover:bg-card hover:border-accent/30 hover:shadow-lg transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                  Editor de Documentos
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Redacción asistida con sugerencias inteligentes y plantillas profesionales.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section - Minimal */}
      <section className="border-t border-border/50 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="grid gap-6 md:gap-12 md:grid-cols-3 text-center">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <Scale className="h-5 w-5 text-accent" />
              </div>
              <p className="text-sm font-medium text-foreground">Legislación actualizada</p>
              <p className="text-xs text-muted-foreground">Base de datos española completa</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <Zap className="h-5 w-5 text-accent" />
              </div>
              <p className="text-sm font-medium text-foreground">Respuestas instantáneas</p>
              <p className="text-xs text-muted-foreground">Búsqueda semántica avanzada</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <Shield className="h-5 w-5 text-accent" />
              </div>
              <p className="text-sm font-medium text-foreground">Respuestas fundamentadas</p>
              <p className="text-xs text-muted-foreground">Siempre con referencias legales</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Clean */}
      <section className="border-t border-border/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 md:py-20 text-center">
          <h2 className="text-xl md:text-2xl font-display font-semibold text-foreground mb-4">
            Empieza a trabajar de forma más inteligente
          </h2>
          <p className="text-muted-foreground mb-6">
            Únete a profesionales que ya usan Coloraria para su práctica legal diaria.
          </p>
          <Link href="/chat">
            <Button size="lg" className="px-8">
              Comenzar ahora
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
