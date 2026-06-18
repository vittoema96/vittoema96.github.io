import i18next, { PostProcessorModule } from 'i18next';
import {initReactI18next} from 'react-i18next'

import enTranslations from '@/locales/en.json'
import itTranslations from '@/locales/it.json'
import { UISettingsManager, DEFAULT_LANGUAGE, type Language } from '@/styles/UISettingsManager'


/**
 * i18next post-processor that appends a "(variation)" suffix to translated strings.
 *
 * When a translation call includes `{ variation: "some text" }` in its options,
 * the output becomes `"Translated value (some text)"`.
 * Used for item/perk variants where the base name is shared but a qualifier is needed
 * (e.g. "Laser Rifle (Scoped)", "Stimpak (Super)").
 */
const variationProcessor: PostProcessorModule = {
    type: 'postProcessor',
    name: 'variationAppend',
    process: (value, _, options) => {
        const variation = options["variation"]
        return variation && typeof variation === "string"
            ? `${value} (${variation})`
            : value
    },
}

const initialLanguage = UISettingsManager.getCurrentLanguage()

// Set <html lang="…"> early so screen-readers / crawlers see the right locale
document.documentElement.lang = initialLanguage

i18next
    .use(variationProcessor)
    .use(initReactI18next)
    .init({
        lng: initialLanguage,
        fallbackLng: DEFAULT_LANGUAGE,
        debug: false,

        resources: {
            en: { translation: enTranslations },
            it: { translation: itTranslations },
        },

        interpolation: {
            escapeValue: false,
        },
        postProcess: variationProcessor.name,
    })


export const changeLanguage = async (newLanguage: Language | null = null) => {
    const language = newLanguage || UISettingsManager.getCurrentLanguage()

    document.documentElement.lang = language
    await i18next.changeLanguage(language)
    UISettingsManager.saveLanguage(language)

    return language
}
