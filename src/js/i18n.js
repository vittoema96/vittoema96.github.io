/**
 * Internationalization system using i18next
 */
import i18next from 'i18next';

/**
 * Standard i18next translation function
 * @param {string} key - Translation key
 * @param {Object} options - i18next options (interpolation, etc.)
 * @returns {string} Translated text
 */
export const t = (key, options = {}) => i18next.t(key, options);
