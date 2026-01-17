import i18next, { PostProcessorModule } from 'i18next';
import {initReactI18next} from 'react-i18next'

import enTranslations from '@/locales/en.json'
import itTranslations from '@/locales/it.json'


export const LANGUAGES = {
    'it': "Italiano",
    'en': "English"
} as const
export type Language = keyof typeof LANGUAGES
export const DEFAULT_LANGUAGE: Language = 'it'


const variationProcessor: PostProcessorModule = {
    type: 'postProcessor',
    name: 'variationAppend',
    process: (value, _, options) => {
        // Handle variation appending
        const variation = options["variation"]
        return variation && typeof variation  === "string" ?
            `${value} (${variation})`
            : value;
    }
};

i18next
    .use(variationProcessor)
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
        postProcess: variationProcessor.name
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
    // TODO not sure it should be handled like this...
    //       more likely that i18n-react has a different way
    await i18next.changeLanguage(language)

    // Update localStorage
    localStorage.setItem('language', language)

    console.log(`Language changed to: ${language}`);

    return language
}
