/**
 * Internationalization system using i18next
 */
import i18next from 'i18next';
import enTranslations from '../locales/en.json';
import itTranslations from '../locales/it.json';

export async function initI18n() {
    // Translation files are imported as modules

    // Get saved language or default to Italian
    const savedLanguage = localStorage.getItem('language');
    const initialLanguage = ['it', 'en'].includes(savedLanguage) ? savedLanguage : 'it';

    await i18next.init({
        lng: initialLanguage,
        fallbackLng: 'it',
        debug: false,

        resources: {
            en: { translation: enTranslations },
            it: { translation: itTranslations },
        },

        interpolation: {
            escapeValue: false,
        },
    });

    // Set up automatic DOM updates when language changes
    i18next.on('languageChanged', () => {
        updateDOM();
    });

    // Initial DOM update
    updateDOM();

    console.log(`i18n initialized with language: ${initialLanguage}`);
}

/**
 * Change the current language
 * @param {string} language - Language code ('en' or 'it')
 */
export async function changeLanguage(language) {
    if (!['it', 'en'].includes(language)) {
        console.warn(`Unsupported language: ${language}`);
        return;
    }

    // Show warning for English (like your original code)
    if (language === 'en') {
        const confirmed = confirm(
            'Are you sure you want to change to English language?\nThis language is currently poorly supported.\n\n' +
                'Sei sicuro di voler cambiare la lingua a Inglese?\nQuesta lingua è attualmente scarsamente supportata.'
        );
        if (!confirmed) {
            return;
        }
    }

    await i18next.changeLanguage(language);

    // Update language selector
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.value = language;
    }

    // Update document language
    document.documentElement.lang = language;

    // Save to localStorage
    localStorage.setItem('language', language);

    console.log(`Language changed to: ${language}`);
}

/**
 * Standard i18next translation function
 * @param {string} key - Translation key
 * @param {Object} options - i18next options (interpolation, etc.)
 * @returns {string} Translated text
 */
export const t = (key, options = {}) => i18next.t(key, options);

/**
 * Update DOM elements with i18next data attributes
 */
export const updateDOM = () => {
    // Handle elements with data-i18n attribute
    const elementsWithI18n = document.querySelectorAll('[data-i18n]');

    elementsWithI18n.forEach(element => {
        const key = element.dataset.i18n;
        const options = {};

        // Handle interpolation from data-i18n-options
        if (element.dataset.i18nOptions) {
            try {
                Object.assign(options, JSON.parse(element.dataset.i18nOptions));
            } catch {
                console.warn('Invalid i18n options:', element.dataset.i18nOptions);
            }
        }

        // Handle different content types
        if (element.dataset.i18nTarget === 'placeholder') {
            element.placeholder = t(key, options);
        } else if (element.dataset.i18nTarget === 'title') {
            element.title = t(key, options);
        } else if (element.dataset.i18nTarget === 'html') {
            element.innerHTML = t(key, options);
        } else {
            // Default: update text content
            element.textContent = t(key, options);
        }
    });
};