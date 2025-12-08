export const uiConfig = {
    sidebar: {
        cases: false,           // "Mis casos"
        recentChats: false,     // "Chats recientes"
        recentSearches: false,  // "Busquedas recientes"
        favorites: false,       // "Favoritos"
    },
    header: {
        notifications: false,   // "Notifications" icon
        settings: true,        // "Settings" icon
    },
    editor: {
        aiFeatures: false,      // "Ai related stuff" (Toolbar button, Editor Sidebar content, AI Assistant popup)
    }
} as const;

export type UIConfig = typeof uiConfig;
