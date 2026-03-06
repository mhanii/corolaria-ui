import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, FileText, Scale, Shield, Sparkles, Brain } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { DeepResearchDemo } from "@/components/home/DeepResearchDemo";

const CAPABILITIES = [
  {
    title: "Buscador legal",
    description:
      "Localiza normativa, jurisprudencia y doctrina con una búsqueda semántica enfocada en intención jurídica. Diseñado para acelerar la investigación sin perder precisión.",
    mediaLabel: "Tutorial rápido del buscador (GIF próximamente)",
    icon: Search,
  },
  {
    title: "Generación de documentos",
    description:
      "Elabora borradores profesionales a partir de instrucciones claras y contexto del caso. Mantén estructura jurídica consistente y lenguaje técnico adecuado.",
    mediaLabel: "Demostración de generación documental (GIF próximamente)",
    icon: FileText,
  },
  {
    title: "Búsqueda profunda y fundamentada",
    description:
      "Combinamos recuperación de evidencia entre miles y millones de documentos con respuestas fundamentadas y citas verificables para cada conclusión relevante.",
    mediaLabel: "Demostración de búsqueda profunda (GIF próximamente)",
    icon: Scale,
  },
  {
    title: "Modo abogado",
    description:
      "Asistencia orientada al flujo real de trabajo legal: contexto, trazabilidad y redacción argumentativa con foco en utilidad práctica para despachos y asesorías.",
    mediaLabel: "Demostración de modo abogado (GIF próximamente)",
    icon: Brain,
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background selection:bg-accent/20">
      <section className="relative overflow-hidden w-full pt-12 pb-14 md:pt-16 md:pb-16">
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[860px] h-[860px] bg-gradient-to-r from-primary/10 via-accent/15 to-primary/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 md:h-28 bg-gradient-to-b from-transparent to-background z-[1]" />

        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 relative z-10">
          <div className="rounded-[2rem] bg-gradient-to-br from-background/95 via-muted/20 to-background/90 p-7 md:p-12 lg:p-16">
            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-12 items-stretch">
              <div className="text-center lg:text-left lg:min-h-[500px] flex flex-col justify-between max-w-[38rem]">
                <div className="flex justify-center lg:justify-start group mb-5">
                  <div className="transform transition-transform duration-700 hover:scale-[1.03]">
                    <Logo size="3xl" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold font-display tracking-tight leading-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Bienvenid@ a Athen
                  </h1>
                  <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                    Plataforma de IA jurídica para investigación, redacción y estrategia legal.
                  </p>
                  <p className="text-sm md:text-base text-muted-foreground/90 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                    Diseñada para profesionales del derecho que necesitan respuestas fundamentadas, citas verificables y contexto útil para tomar decisiones con mayor seguridad.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-6">
                  <Link href="/chat">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto h-12 px-8 text-base font-medium rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-xl hover:shadow-foreground/20 transition-all duration-300"
                    >
                      Probar asistente
                      <Sparkles className="ml-2.5 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/buscador">
                    <Button
                      variant="ghost"
                      size="lg"
                      className="w-full sm:w-auto h-12 px-8 text-base font-medium rounded-full border border-border/60 bg-background/60 backdrop-blur-sm hover:bg-accent/10 hover:border-accent/30 transition-all duration-300"
                    >
                      Ir al buscador
                      <Search className="ml-2.5 h-4 w-4 text-accent" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div
                  className="media-placeholder media-placeholder--hero w-full aspect-video"
                  role="img"
                  aria-label="Video de demostración de la plataforma, disponible próximamente"
                >
                  <div className="media-placeholder__label">Video demo próximamente</div>
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-20 md:w-24 lg:w-28 bg-gradient-to-r from-background/70 via-background/40 to-transparent z-[2]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-4 py-16 sm:px-6 md:py-24">
        <div className="max-w-[82rem] mx-auto space-y-9 md:space-y-11">
          {CAPABILITIES.map((item, index) => {
            const Icon = item.icon;
            const mediaOnRight = index % 2 === 0;

            return (
              <article
                key={item.title}
                className="rounded-[2rem] border border-border/60 bg-card/70 px-5 py-6 shadow-soft backdrop-blur-sm sm:px-8 sm:py-9 md:px-12 md:py-11"
              >
                <div className="grid md:grid-cols-2 gap-7 md:gap-10 items-stretch">
                  <div className={(mediaOnRight ? "order-2" : "order-2 md:order-1") + " self-center"}>
                    {item.title === "Búsqueda profunda y fundamentada" ? (
                      <DeepResearchDemo />
                    ) : (
                      <div className="media-placeholder media-placeholder--card" role="img" aria-label={item.mediaLabel}>
                        <div className="media-placeholder__label">GIF tutorial próximamente</div>
                      </div>
                    )}
                  </div>

                  <div className={(mediaOnRight ? "order-1" : "order-1 md:order-2") + " relative min-h-[240px] md:min-h-[280px]"}>
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl border border-border/70 bg-background text-accent absolute top-0 left-0">
                      <Icon className="h-8 w-8" />
                    </div>
                    <div className="mt-20 h-[calc(100%-5rem)] flex flex-col justify-center">
                      <h3 className="text-2xl md:text-[1.8rem] font-medium text-foreground mb-3 font-display">
                        {item.title}
                      </h3>
                      <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="w-full border-t border-border/40 bg-muted/10 px-4 pb-20 pt-14 sm:px-6 md:pb-24 md:pt-16">
        <div className="max-w-5xl mx-auto grid gap-8 md:gap-6 md:grid-cols-3">
          <div className="flex flex-col items-center text-center gap-4 p-4">
            <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center border border-border/70">
              <Scale className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h4 className="font-medium text-foreground uppercase tracking-[0.15em] text-xs mb-2">
                Citas verificables
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cada respuesta puede apoyarse en referencias concretas para revisar origen, contexto y aplicabilidad jurídica.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center text-center gap-4 p-4">
            <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center border border-border/70">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h4 className="font-medium text-foreground uppercase tracking-[0.15em] text-xs mb-2">
                Cobertura a gran escala
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Recuperación y organización de información en repositorios extensos para reducir tiempos de análisis en asuntos complejos.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center text-center gap-4 p-4">
            <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center border border-border/70">
              <Shield className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h4 className="font-medium text-foreground uppercase tracking-[0.15em] text-xs mb-2">
                Contexto y trazabilidad
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Consolidamos contexto relevante del caso y de la conversación para respuestas más útiles y seguimiento de criterios aplicados.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
