import { useState } from "react";
import { Search, Filter, BookOpen, Gavel, FileText, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentViewer } from "@/components/DocumentViewer";

export const SearchTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState < any > (null);

  const results = [
    {
      title: "Código Civil - Artículo 1254",
      type: "Ley",
      category: "Derecho Civil",
      date: "Vigente desde 1889",
      excerpt: "El contrato existe desde que una o varias personas consienten en obligarse, respecto de otra u otras, a dar alguna cosa o prestar algún servicio.",
      relevance: 98,
    },
    {
      title: "Sentencia del Tribunal Supremo 123/2024",
      type: "Jurisprudencia",
      category: "Derecho Laboral",
      date: "2024-02-10",
      excerpt: "En materia de despidos improcedentes, la indemnización debe calcularse conforme a los días efectivamente trabajados...",
      relevance: 88,
    },
    {
      title: "Ley de Propiedad Horizontal - Art. 9",
      type: "Ley",
      category: "Derecho Inmobiliario",
      date: "2023-11-20",
      excerpt: "Los elementos comunes del edificio, su conservación, entretenimiento y todas las atenciones que exijan el servicio...",
      relevance: 82,
    },
  ];

  const handleResultClick = (result: any) => {
    setSelectedDocument({
      ...result,
      highlightedArticle: result.excerpt
    });
    setViewerOpen(true);
  };

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto">
      {/* Search Header */}
      <div className="space-y-4 mb-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar leyes, artículos, jurisprudencia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base shadow-soft"
            />
          </div>
          <Button variant="outline" size="icon" className="h-12 w-12 shadow-soft">
            <Filter className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Select defaultValue="all">
            <SelectTrigger className="w-40 shadow-soft">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="ley">Leyes</SelectItem>
              <SelectItem value="jurisprudencia">Jurisprudencia</SelectItem>
              <SelectItem value="doctrina">Doctrina</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all-categories">
            <SelectTrigger className="w-48 shadow-soft">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-categories">Todas las categorías</SelectItem>
              <SelectItem value="civil">Derecho Civil</SelectItem>
              <SelectItem value="penal">Derecho Penal</SelectItem>
              <SelectItem value="laboral">Derecho Laboral</SelectItem>
              <SelectItem value="mercantil">Derecho Mercantil</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="relevance">
            <SelectTrigger className="w-40 shadow-soft">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevancia</SelectItem>
              <SelectItem value="date">Fecha</SelectItem>
              <SelectItem value="title">Título</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto space-y-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {results.length} resultados encontrados
          </p>
        </div>

        {results.map((result, idx) => (
          <Card
            key={idx}
            className="shadow-soft hover:shadow-medium transition-smooth cursor-pointer group"
            onClick={() => handleResultClick(result)}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="gap-1">
                      {result.type === "Ley" ? (
                        <BookOpen className="w-3 h-3" />
                      ) : (
                        <Gavel className="w-3 h-3" />
                      )}
                      {result.type}
                    </Badge>
                    <Badge variant="secondary">{result.category}</Badge>
                  </div>
                  <CardTitle className="group-hover:text-accent transition-smooth">
                    {result.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 text-xs">
                    <Calendar className="w-3 h-3" />
                    {new Date(result.date).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-accent">{result.relevance}%</div>
                  <div className="text-xs text-muted-foreground">relevancia</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {result.excerpt}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <DocumentViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        document={selectedDocument}
      />
    </div>
  );
};
