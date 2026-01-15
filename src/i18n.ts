import i18next from 'i18next'
import {initReactI18next} from 'react-i18next'

import enTranslations from '@/locales/en.json'
import itTranslations from '@/locales/it.json'


export const LANGUAGES = {
    'it': "Italiano",
    'en': "English"
} as const
export type Language = keyof typeof LANGUAGES
export const DEFAULT_LANGUAGE: Language = 'it'

i18next
    .use(initReactI18next)
    .init({
        lng: localStorage.getItem('language') ?? DEFAULT_LANGUAGE,
        fallbackLng: DEFAULT_LANGUAGE,
        debug: false,

        resources: {
            en: { translation: enTranslations },
            it: { translation: itTranslations },
        },

        interpolation: {
            escapeValue: false,
        },
    })

/** Checks if a string is a valid Language */
export const isLanguage = (value: string | null): value is Language => {
    return !!value && Object.keys(LANGUAGES).includes(value);
}


/**
 * Get the current Language from localStorage or default
 */
export const getCurrentLanguage = (): Language => {
    const saved = localStorage.getItem('language')
    return isLanguage(saved) ? saved : DEFAULT_LANGUAGE
}


export const changeLanguage = async (newLanguage: Language | null = null) => {
    const language = newLanguage || getCurrentLanguage()

    // Update document language
    document.documentElement.lang = language;

    // Use the i18n system to change language
    await i18next.changeLanguage(language)

    // Update localStorage
    localStorage.setItem('language', language)

    console.log(`Language changed to: ${language}`);

    return language
}
