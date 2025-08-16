import { useState, useEffect } from 'react'
import { t } from '../js/i18n.js'
import i18next from 'i18next'

/**
 * React hook for i18n translations
 * Automatically re-renders components when language changes
 */
export function useI18n() {
    const [, setUpdateCounter] = useState(0)

    useEffect(() => {
        const handleLanguageChange = () => {
            // Force component re-render when language changes by incrementing counter
            setUpdateCounter(prev => prev + 1)
        }

        const handleInitialized = () => {
            setUpdateCounter(prev => prev + 1)
        }

        // Listen for i18next events
        i18next.on('languageChanged', handleLanguageChange)
        i18next.on('initialized', handleInitialized)

        // Check if already initialized
        if (i18next.isInitialized) {
            setUpdateCounter(prev => prev + 1)
        }

        return () => {
            i18next.off('languageChanged', handleLanguageChange)
            i18next.off('initialized', handleInitialized)
        }
    }, [])

    // Return a safe translation function
    return (key, options = {}) => {
        if (!i18next.isInitialized) {
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
