import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, FileText, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function EditorSidebar() {
    return (
        <div className="w-80 border-l bg-card hidden xl:flex flex-col">
            <div className="p-4 border-b flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-semibold">Asistente de Redacción</span>
            </div>
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                Análisis Legal
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">El documento cumple con los requisitos básicos de la LAU. Se detectan 2 posibles mejoras.</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-500" />
                                Plantillas Sugeridas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" size="sm" className="w-full justify-start text-xs h-auto py-2">Cláusula Antimorosidad</Button>
                            <Button variant="outline" size="sm" className="w-full justify-start text-xs h-auto py-2">Inventario de Muebles</Button>
                        </CardContent>
                    </Card>
                </div>
            </ScrollArea>
            <div className="p-4 border-t">
                <Button className="w-full">Generar Borrador</Button>
            </div>
        </div>
    )
}
