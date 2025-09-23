import { useState, useEffect } from 'react'
import { t } from '../js/i18n.js'
import i18next from 'i18next'

/**
 * React hook for i18n translations
 * Automatically re-renders components when language changes
 */
export function useI18n() {
    const [isReady, setIsReady] = useState(i18next.isInitialized)

    useEffect(() => {
        const handleLanguageChange = () => {
            // Force component re-render when language changes
            setIsReady(true)
        }

        const handleInitialized = () => {
            setIsReady(true)
        }

        // Listen for i18next events
        i18next.on('languageChanged', handleLanguageChange)
        i18next.on('initialized', handleInitialized)

        // Check if already initialized
        if (i18next.isInitialized) {
            setIsReady(true)
        }

        return () => {
            i18next.off('languageChanged', handleLanguageChange)
            i18next.off('initialized', handleInitialized)
        }
    }, [])

    // Return a safe translation function
    return (key, options = {}) => {
        if (!isReady || !i18next.isInitialized) {
            // Return a fallback while i18n is loading
            return key
        }

        const translation = t(key, options)
        // If translation is empty or same as key, return the key as fallback
        return translation || key
    }
}

/**
 * React hook for getting current language
 */
export function useCurrentLanguage() {
    const [language, setLanguage] = useState(i18next.language || 'it')

    useEffect(() => {
        const handleLanguageChange = (lng) => {
            setLanguage(lng)
        }

        i18next.on('languageChanged', handleLanguageChange)

        return () => {
            i18next.off('languageChanged', handleLanguageChange)
        }
    }, [])

    return language
}
