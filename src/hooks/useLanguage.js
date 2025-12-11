import {useState} from 'react'
import i18next from "i18next";


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

        if (!['it', 'en'].includes(language)) {
            console.warn(`Unsupported language: ${language}`);
            throw new Error(`Unsupported language: ${language}`);
        }
        
        // Update localStorage
        localStorage.setItem('language', language)
        
        // Use the i18n system to change language
        await i18next.changeLanguage(language)

        // Update language selector
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.value = language;
        }
        // Update document language
        document.documentElement.lang = language;
        
        // Update local state
        setCurrentLanguage(language)

        console.log(`Language changed to: ${language}`);
        
        return language
    }

    return {
        currentLanguage,
        changeLanguage,
        availableLanguages: ['it', 'en']
    }
}
