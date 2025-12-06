import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, MessageSquare, FileText, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-subtle">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-8 pt-16 pb-12">
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Asistente Legal Inteligente
          </div>

          <h1 className="text-5xl md:text-6xl font-bold font-display bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
            Bienvenido a Coloraria
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Tu asistente legal potenciado por inteligencia artificial para búsqueda legal, consultas interactivas y redacción de documentos
          </p>

          <div className="flex gap-4 justify-center mt-8">
            <Link href="/chat">
              <Button size="lg" className="shadow-medium hover:shadow-strong transition-smooth bg-accent text-accent-foreground hover:bg-accent/90">
                Iniciar Chat
                <MessageSquare className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/buscador">
              <Button size="lg" variant="outline" className="shadow-soft hover:shadow-medium transition-smooth">
                Explorar Buscador
                <Search className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* About Section */}
        <div className="max-w-4xl mx-auto mb-16 p-8 rounded-lg bg-card shadow-soft">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">
            ¿Qué es Coloraria?
          </h2>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Coloraria es un asistente legal basado en inteligencia artificial diseñado para profesionales del derecho y estudiantes.
            Combina búsqueda semántica avanzada, conversación contextual con IA, y herramientas de redacción asistida para
            ayudarte a encontrar información legal, resolver consultas complejas y crear documentos jurídicos de alta calidad.
            Nuestra plataforma entiende el contexto legal español y te proporciona respuestas precisas y fundamentadas en la
            legislación vigente y jurisprudencia relevante.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-3 items-stretch">
          {/* Buscador Legal */}
          <Card className="group hover:shadow-medium transition-smooth cursor-pointer border-border hover:border-accent/50 overflow-hidden flex flex-col">
            <Link href="/buscador" className="block flex-1 flex flex-col">
              <div className="h-2 bg-gradient-accent opacity-0 group-hover:opacity-100 transition-smooth" />
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-smooth">
                  <Search className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="flex items-center gap-2 text-foreground group-hover:text-accent transition-smooth">
                  Buscador Legal
                </CardTitle>
                <CardDescription className="text-base">
                  Encuentra leyes, artículos y jurisprudencia con búsqueda semántica avanzada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Accede a una base de datos completa de legislación española. Utiliza búsqueda semántica para encontrar
                  artículos relevantes por concepto, no solo por palabras clave. Filtra por tipo de norma, relevancia,
                  y obtén resultados con contexto completo.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>Búsqueda por similitud semántica</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>Filtros avanzados por tipo y materia</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>Puntuaciones de relevancia</span>
                  </li>
                </ul>
                <Button className="w-full mt-4 group-hover:bg-accent group-hover:text-accent-foreground transition-smooth" variant="secondary">
                  Ir al Buscador
                </Button>
              </CardContent>
            </Link>
          </Card>

          {/* Chat Asistente */}
          <Card className="group hover:shadow-medium transition-smooth cursor-pointer border-border hover:border-accent/50 overflow-hidden flex flex-col">
            <Link href="/chat" className="block flex-1 flex flex-col">
              <div className="h-2 bg-gradient-accent opacity-0 group-hover:opacity-100 transition-smooth" />
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-smooth">
                  <MessageSquare className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="flex items-center gap-2 text-foreground group-hover:text-accent transition-smooth">
                  Chat Asistente
                </CardTitle>
                <CardDescription className="text-base">
                  Consulta tus dudas legales con nuestro asistente IA conversacional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Mantén conversaciones naturales sobre temas legales. El asistente entiende el contexto de tus consultas,
                  proporciona respuestas fundamentadas en legislación y jurisprudencia, y puede ayudarte a analizar casos
                  específicos con referencias legales precisas.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>Respuestas contextuales y fundamentadas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>Referencias a legislación vigente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>Análisis de casos prácticos</span>
                  </li>
                </ul>
                <Button className="w-full mt-4 group-hover:bg-accent group-hover:text-accent-foreground transition-smooth" variant="secondary">
                  Iniciar Chat
                </Button>
              </CardContent>
            </Link>
          </Card>

          {/* Editor de Documentos */}
          <Card className="group hover:shadow-medium transition-smooth cursor-pointer border-border hover:border-accent/50 overflow-hidden flex flex-col">
            <Link href="/editor" className="block flex-1 flex flex-col">
              <div className="h-2 bg-gradient-accent opacity-0 group-hover:opacity-100 transition-smooth" />
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-smooth">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="flex items-center gap-2 text-foreground group-hover:text-accent transition-smooth">
                  Editor de Documentos
                </CardTitle>
                <CardDescription className="text-base">
                  Redacta documentos legales con asistencia inteligente en tiempo real
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Crea documentos jurídicos de calidad con ayuda de IA. Obtén sugerencias inteligentes mientras escribes,
                  accede a plantillas profesionales, y mejora tu redacción con recomendaciones de lenguaje legal apropiado
                  y referencias normativas relevantes.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>Sugerencias inteligentes en tiempo real</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>Plantillas de documentos legales</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>Asistencia con terminología jurídica</span>
                  </li>
                </ul>
                <Button className="w-full mt-4 group-hover:bg-accent group-hover:text-accent-foreground transition-smooth" variant="secondary">
                  Abrir Editor
                </Button>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
