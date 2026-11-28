import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslations from '@/locales/en.json';
import itTranslations from '@/locales/it.json';
import {
    UISettingsManager,
    DEFAULT_LANGUAGE,
    type Language,
} from '@/services/UISettingsManager.ts';
import { weightProcessor, variationProcessor } from '@/locales/processors';

// Keep <html lang="…"> in sync on init, manual switch, and cross-tab updates.
i18next.on('languageChanged', (lng) => {
    document.documentElement.lang = lng;
});

await i18next
    .use(variationProcessor)
    .use(weightProcessor)
    .use(initReactI18next)
    .init({
        lng: UISettingsManager.getCurrentLanguage(),
        fallbackLng: DEFAULT_LANGUAGE,
        debug: false,

        resources: {
            en: { translation: enTranslations },
            it: { translation: itTranslations },
        },

        interpolation: {
            escapeValue: false,
        },
        postProcess: [variationProcessor.name, weightProcessor.name],
    });

let lastLanguage = UISettingsManager.getCurrentLanguage();
let lastWeightUnit = UISettingsManager.getCurrentWeightUnit();

// Re-render translated text when the weight unit changes, so descriptions update in place.
UISettingsManager.subscribe(() => {
    const currentLanguage = UISettingsManager.getCurrentLanguage();
    const currentWeightUnit = UISettingsManager.getCurrentWeightUnit();

    if (currentLanguage !== lastLanguage) {
        lastLanguage = currentLanguage;
        lastWeightUnit = currentWeightUnit;
        void i18next.changeLanguage(currentLanguage);
        return;
    }

    if (currentWeightUnit !== lastWeightUnit) {
        lastWeightUnit = currentWeightUnit;
        i18next.emit('languageChanged', i18next.language);
    }
});

export const changeLanguage = async (newLanguage: Language | null = null): Promise<Language> => {
    const language = newLanguage ?? UISettingsManager.getCurrentLanguage();

    lastLanguage = language;
    UISettingsManager.saveLanguage(language);
    await i18next.changeLanguage(language);

    return language;
};
