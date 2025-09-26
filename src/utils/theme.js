/**
 * Theme management utilities
 * Centralized theme logic to avoid duplication
 */

const VALID_THEMES = ['theme-fallout-3', 'theme-fallout-new-vegas']
const DEFAULT_THEME = VALID_THEMES[0]

/**
 * Get the current theme from localStorage or default
 * @returns {string} Current theme name
 */
export const getCurrentTheme = () => {
    const saved = localStorage.getItem('theme')
    return VALID_THEMES.includes(saved) ? saved : DEFAULT_THEME
}

/**
 * Apply theme to document body and update PWA meta tag
 * @param {string} themeName - Theme to apply (optional, uses current if not provided)
 */
export const applyTheme = (themeName = null) => {
    const theme = themeName || getCurrentTheme()
    
    // Apply theme class to body
    document.body.className = theme
    
    // Update PWA meta tag color
    const computedStyle = getComputedStyle(document.body)
    const primaryColor = computedStyle.getPropertyValue('--primary-color')
    const metaTag = document.querySelector('meta[name="theme-color"]')
    if (metaTag) {
        metaTag.setAttribute('content', primaryColor)
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme)
    
    return theme
}

/**
 * Change theme and apply it
 * @param {string} newTheme - New theme to apply
 */
export const changeTheme = (newTheme = null) => {
    const theme = newTheme || getCurrentTheme()
    return applyTheme(theme)
}

/**
 * Get list of available themes
 * @returns {string[]} Array of theme names
 */
export const getAvailableThemes = () => {
    return [...VALID_THEMES]
}
