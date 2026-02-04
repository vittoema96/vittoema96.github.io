export const THEMES = {
    'theme-fallout-3': 'Fallout 3',
    'theme-fallout-new-vegas': 'Fallout New Vegas',
    'theme-old-world-blues': 'Old World Blues',
    'theme-dead-money': 'Dead Money',
    'theme-the-institute': 'The Institute',
    'theme-the-kings': 'The Kings',
} as const
export type Theme = keyof typeof THEMES
export const DEFAULT_THEME: Theme = 'theme-fallout-3'

/** Checks if a string is a valid Theme */
export const isTheme = (value: string | null): value is Theme => {
    return !!value && Object.keys(THEMES).includes(value);
}


/**
 * Get the current theme from localStorage or default
 */
export const getCurrentTheme = (): Theme => {
    const saved = localStorage.getItem('theme')
    return isTheme(saved) ? saved : DEFAULT_THEME
}

/**
 * Apply theme to document body, update PWA meta tag, and save to localStorage
 */
export const applyTheme = (theme: Theme | null = null) => {
    theme = theme || getCurrentTheme()

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

    console.log(`Theme changed to: ${theme}`);

    return theme
}
