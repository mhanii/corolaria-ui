"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

interface SidebarContextType {
    isOpen: boolean
    isCollapsed: boolean
    toggle: () => void
    open: () => void
    close: () => void
    toggleCollapse: () => void
    refreshTrigger: number
    triggerRefresh: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const toggle = useCallback(() => setIsOpen(prev => !prev), [])
    const open = useCallback(() => setIsOpen(true), [])
    const close = useCallback(() => setIsOpen(false), [])
    const toggleCollapse = useCallback(() => setIsCollapsed(prev => !prev), [])
    const triggerRefresh = useCallback(() => setRefreshTrigger(prev => prev + 1), [])

    return (
        <SidebarContext.Provider value={{ isOpen, isCollapsed, toggle, open, close, toggleCollapse, refreshTrigger, triggerRefresh }}>
            {children}
        </SidebarContext.Provider>
    )
}

export function useSidebar() {
    const context = useContext(SidebarContext)
    if (context === undefined) {
        throw new Error("useSidebar must be used within a SidebarProvider")
    }
    return context
}
