import { useState, useEffect } from 'react'

const VALID_THEMES = ['theme-fallout-3', 'theme-fallout-new-vegas']
const DEFAULT_THEME = VALID_THEMES[0]

/**
 * Get the current theme from localStorage or default
 */
const getCurrentTheme = () => {
    const saved = localStorage.getItem('theme')
    return VALID_THEMES.includes(saved) ? saved : DEFAULT_THEME
}

/**
 * Apply theme to document body, update PWA meta tag, and save to localStorage
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
 * React hook for theme management
 * Provides reactive theme state and change functions
 */
export const useTheme = () => {
    const [currentTheme, setCurrentTheme] = useState(getCurrentTheme())

    const changeTheme = (newTheme = null) => {
        const appliedTheme = applyTheme(newTheme)
        setCurrentTheme(appliedTheme)
        return appliedTheme
    }

    // Listen for theme changes from other sources (like settings)
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'theme') {
                setCurrentTheme(getCurrentTheme())
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    return {
        currentTheme,
        changeTheme,
        availableThemes: [...VALID_THEMES]
    }
}
