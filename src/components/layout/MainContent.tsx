"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/context/SidebarContext"

interface MainContentProps {
    children: ReactNode
}

/**
 * Main content wrapper that responds to sidebar collapse state
 * Handles dynamic margin adjustment and contains the sticky header
 */
export function MainContent({ children }: MainContentProps) {
    const { isCollapsed } = useSidebar()

    return (
        <div
            className={cn(
                "flex-1 flex flex-col min-h-screen overflow-hidden",
                "transition-[margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                "ml-0",
                // On desktop, adjust margin based on sidebar collapse state
                isCollapsed ? "lg:ml-16" : "lg:ml-72"
            )}
        >
            {children}
        </div>
    )
}
