import { useState, useEffect } from 'react'
import { changeLanguage as changeLanguageUtil } from '../js/i18n.js'

/**
 * React hook for language management
 * Provides reactive language state and change functions
 */
export const useLanguage = () => {
    const [currentLanguage, setCurrentLanguage] = useState(() => {
        const saved = localStorage.getItem('language')
        return ['it', 'en'].includes(saved) ? saved : 'it'
    })

    const changeLanguage = async (newLanguage = null) => {
        const language = newLanguage || currentLanguage
        
        // Update localStorage
        localStorage.setItem('language', language)
        
        // Use the i18n system to change language
        await changeLanguageUtil(language)
        
        // Update local state
        setCurrentLanguage(language)
        
        return language
    }

    // Listen for language changes from other sources
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'language') {
                const newLang = e.newValue
                if (['it', 'en'].includes(newLang)) {
                    setCurrentLanguage(newLang)
                }
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    return {
        currentLanguage,
        changeLanguage,
        availableLanguages: ['it', 'en']
    }
}
