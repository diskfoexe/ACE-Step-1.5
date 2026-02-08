import { create } from 'zustand'

export const useAppStore = create((set, get) => ({
    // Service state
    isServiceInitialized: false,
    serviceStatus: 'Not initialized',

    // Active tab
    activeTab: 'generation',

    // Language
    language: 'en',

    // Actions
    setServiceInitialized: (status, message) => set({
        isServiceInitialized: status,
        serviceStatus: message,
    }),

    setActiveTab: (tab) => set({ activeTab: tab }),

    setLanguage: (lang) => set({ language: lang }),
}))
