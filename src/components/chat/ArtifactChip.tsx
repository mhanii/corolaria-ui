import { FileText, Download } from "lucide-react"

interface ArtifactChipProps {
    id: string
    title: string
    onClick?: () => void
}

export function ArtifactChip({ id, title, onClick }: ArtifactChipProps) {
    return (
        <div className="mt-3 mb-1 w-full">
            <div
                className="flex text-left font-sans rounded-lg overflow-hidden border transition duration-300 w-full hover:bg-background/50 px-4 border-border/40 hover:border-border cursor-pointer group/artifact-block bg-card/50"
                role="button"
                tabIndex={0}
                aria-label="Preview contents"
                onClick={onClick}
            >
                <div className="flex flex-1 align-start justify-between w-full py-4">
                    <div className="flex flex-1 gap-4 min-w-0">
                        {/* Icon Container */}
                        <div className="flex items-center w-[60px] relative shrink-0">
                            <div className="absolute top-0 left-0 flex flex-1 overflow-hidden w-[56px] h-[72px] rounded-xl border border-border/60 select-none scale-[1] group-hover/artifact-block:scale-[1.035] -rotate-[0.1rad] group-hover/artifact-block:-rotate-[0.065rad] duration-300 ease-out transition-transform backface-hidden will-change-transform bg-gradient-to-b from-background to-background/0 pt-4 items-start justify-center shadow-sm">
                                <FileText className="w-6 h-6 text-muted-foreground" />
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="flex flex-col justify-center gap-1 min-w-0 flex-1">
                            <div className="leading-tight text-base font-semibold text-foreground line-clamp-1">
                                {title}
                            </div>
                            <div className="text-sm line-clamp-1 text-muted-foreground transition-opacity duration-200">
                                Documento <span className="opacity-50">·</span> MD
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex min-w-0 items-center justify-center gap-2 shrink-0">
                        <button
                            className="inline-flex items-center justify-center relative shrink-0 select-none font-medium border relative overflow-hidden transition duration-100 h-9 px-4 rounded-md min-w-[5rem] active:scale-[0.985] whitespace-nowrap text-sm bg-background hover:bg-muted text-foreground border-border shadow-sm z-10"
                            type="button"
                            aria-label="Descargar"
                            onClick={(e) => {
                                e.stopPropagation();
                                // Add download logic here if needed
                            }}
                        >
                            Descargar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
