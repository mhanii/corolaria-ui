"use client"

import { cn } from "@/lib/utils"

interface LogoProps {
    size?: "sm" | "md" | "lg" | "xl" | "2xl"
    className?: string
    animate?: boolean
}

const sizeMap = {
    sm: 24,
    md: 32,
    lg: 48,
    xl: 64,
    "2xl": 96,
}

/**
 * Athen Logo component
 * @param size - Size of the logo (sm, md, lg, xl, 2xl)
 * @param className - Additional classes
 * @param animate - Whether to show the loading pulse animation
 */
export function Logo({ size = "md", className, animate = false }: LogoProps) {
    const dimensions = sizeMap[size]

    return (
        <div
            className={cn(
                "relative flex-shrink-0",
                animate && "animate-logo-pulse",
                className
            )}
            style={{ width: dimensions, height: dimensions }}
        >
            <img
                src="/logo.png"
                alt="Athen Logo"
                width={dimensions}
                height={dimensions}
                className={cn(
                    "object-contain w-full h-full",
                    animate && "drop-shadow-[0_0_8px_rgba(var(--accent),0.5)]"
                )}
            />
        </div>
    )
}

interface LogoLoaderProps {
    text?: string
    size?: "sm" | "md" | "lg" | "xl"
    className?: string
}

/**
 * Loading state component with animated logo
 * @param text - Loading text to display (default: "Cargando...")
 * @param size - Size of the logo
 * @param className - Additional classes
 */
export function LogoLoader({ text = "Cargando...", size = "lg", className }: LogoLoaderProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
            <Logo size={size} animate />
            <p className="text-muted-foreground animate-pulse">{text}</p>
        </div>
    )
}
