import i18next, { PostProcessorModule } from 'i18next';
import {initReactI18next} from 'react-i18next'

import enTranslations from '@/locales/en.json'
import itTranslations from '@/locales/it.json'


export const LANGUAGES = {
    'it': "Italiano",
    'en': "English"
} as const
export type Language = keyof typeof LANGUAGES
export const DEFAULT_LANGUAGE: Language = 'en'


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


/** Checks if a string is a valid Language */
export const isLanguage = (value: string | null): value is Language => {
    return !!value && Object.keys(LANGUAGES).includes(value);
}

/**
 * Get the current Language from localStorage or default
 */
export const getCurrentLanguage = (): Language => {
    const saved = localStorage.getItem('language');
    if (isLanguage(saved)) { return saved }

    const browserLanguages = navigator.languages || [navigator.language];
    for (const lang of browserLanguages) {
        // convert 'en-US' to 'en'
        const shortLang = lang.split('-')[0] ?? DEFAULT_LANGUAGE;
        if (isLanguage(shortLang)) { return shortLang }
    }

    return DEFAULT_LANGUAGE;
};

/*
CHECKS THAT en.json and it.json have the same keys

const enKeys = Object.keys(enTranslations)
const itKeys = Object.keys(itTranslations)
const missingInIt = enKeys.filter(key => !itKeys.includes(key));
const missingInEn = itKeys.filter(key => !enKeys.includes(key));
console.log("Missing keys from it: ", missingInIt);
console.log("Missing keys from it: ", missingInEn);
*/

i18next
    .use(variationProcessor)
    .use(initReactI18next)
    .init({
        lng: getCurrentLanguage(),
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
