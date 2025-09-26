import { useState, useEffect } from 'react'
import { getCurrentTheme, changeTheme as changeThemeUtil, getAvailableThemes } from '../utils/theme.js'

/**
 * React hook for theme management
 * Provides reactive theme state and change functions
 */
export const useTheme = () => {
    const [currentTheme, setCurrentTheme] = useState(getCurrentTheme())

    const changeTheme = (newTheme = null) => {
        const appliedTheme = changeThemeUtil(newTheme)
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
        availableThemes: getAvailableThemes()
    }
}
