import React, { useState, useEffect } from 'react'
import BootScreen from './components/BootScreen.jsx'
import MainApp from './components/MainApp.jsx'
import { useCharacterData } from './hooks/useCharacterData.js'
import { initI18n, changeLanguage } from './js/i18n.js'
import { PopupProvider, usePopup, setupGlobalPopupFunctions } from './contexts/PopupContext.jsx'

// Inner App component that has access to popup context
function AppContent() {
    const [version] = useState('DEV')
    const [showBootScreen, setShowBootScreen] = useState(version !== 'DEV')
    const [i18nReady, setI18nReady] = useState(false)
    const popupContext = usePopup()

    // Use the character persistence hook
    const {
        character,
        updateCharacter,
        resetCharacter,
        downloadCharacter,
        uploadCharacter,
        isLoading
    } = useCharacterData()

    // Initialize i18n and global systems
    useEffect(() => {
        const initializeSystems = async () => {
            try {
                // Initialize i18n first
                await initI18n()

                // Create changeTheme function
                const changeTheme = () => {
                    let value = localStorage.getItem('theme')
                    if (!['theme-fallout-3', 'theme-fallout-new-vegas'].includes(value)) {
                        value = 'theme-fallout-3'
                    }

                    document.body.className = value

                    // Update the meta tag for PWA
                    const computedStyle = getComputedStyle(document.body)
                    const primaryColor = computedStyle.getPropertyValue('--primary-color')
                    const metaTag = document.querySelector('meta[name="theme-color"]')
                    if (metaTag) {
                        metaTag.setAttribute('content', primaryColor)
                    }

                    localStorage.setItem('theme', value)
                }

                // Make global functions available for settings tab
                window.changeLanguage = changeLanguage
                window.changeTheme = changeTheme

                // All popups are now React components - no vanilla JS needed

                setI18nReady(true)
                console.log('Systems initialized successfully')
            } catch (error) {
                console.error('Failed to initialize systems:', error)
                // Set ready anyway to prevent blocking
                setI18nReady(true)
            }
        }

        initializeSystems()
    }, [])

    // Setup global popup functions after popup context is ready
    useEffect(() => {
        setupGlobalPopupFunctions(popupContext)
        console.log('React popup functions override vanilla ones')
    }, [popupContext])

    // No more vanilla JS initialization - everything is React now!

    // Boot screen timing - adjust based on your CSS animation duration
    useEffect(() => {
        // Skip boot screen timer in DEV mode
        if (version === 'DEV') {
            return
        }

        const timer = setTimeout(() => {
            setShowBootScreen(false)
        }, 6000) // Adjust this to match your boot animation timing

        return () => clearTimeout(timer)
    }, [version])

    // Don't render until character data and i18n are loaded
    if (isLoading || !i18nReady) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                color: '#afff03',
                fontFamily: 'monospace'
            }}>
                Loading...
            </div>
        )
    }

    return (
        <div>
            {/* Boot Screen - shows first */}
            <BootScreen version={version} isVisible={showBootScreen} />

            {/* Main App - shows after boot screen finishes */}
            {!showBootScreen && (
                <MainApp
                    character={character}
                    updateCharacter={updateCharacter}
                    resetCharacter={resetCharacter}
                    downloadCharacter={downloadCharacter}
                    uploadCharacter={uploadCharacter}
                />
            )}
        </div>
    )
}

// Main App component with popup provider
function App() {
    return (
        <PopupProvider>
            <AppContent />
        </PopupProvider>
    )
}

export default App