"use client"

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from "react"

interface SidebarContextType {
    isOpen: boolean
    isCollapsed: boolean
    toggle: () => void
    open: () => void
    close: () => void
    toggleCollapse: () => void
    collapse: () => void
    expand: () => void
    refreshTrigger: number
    triggerRefresh: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const isMobileViewport = () => typeof window !== "undefined" && window.innerWidth < 1024

    const toggle = useCallback(() => {
        if (isMobileViewport()) {
            setIsCollapsed(false)
        }
        setIsOpen(prev => !prev)
    }, [])
    const open = useCallback(() => {
        if (isMobileViewport()) {
            setIsCollapsed(false)
        }
        setIsOpen(true)
    }, [])
    const close = useCallback(() => setIsOpen(false), [])
    const toggleCollapse = useCallback(() => {
        if (isMobileViewport()) {
            setIsCollapsed(false)
            return
        }
        setIsCollapsed(prev => !prev)
    }, [])
    const collapse = useCallback(() => {
        if (isMobileViewport()) {
            setIsOpen(false)
            setIsCollapsed(false)
            return
        }
        setIsCollapsed(true)
    }, [])
    const expand = useCallback(() => setIsCollapsed(false), [])
    const triggerRefresh = useCallback(() => setRefreshTrigger(prev => prev + 1), [])

    const value = useMemo(() => ({
        isOpen, isCollapsed, toggle, open, close,
        toggleCollapse, collapse, expand,
        refreshTrigger, triggerRefresh
    }), [isOpen, isCollapsed, toggle, open, close, toggleCollapse, collapse, expand, refreshTrigger, triggerRefresh]);

    return (
        <SidebarContext.Provider value={value}>
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
