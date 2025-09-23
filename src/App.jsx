import React, { useState, useEffect } from 'react'
import BootScreen from './components/BootScreen.jsx'
import MainApp from './components/MainApp.jsx'
import { useCharacterData } from './hooks/useCharacterData.js'
import { initI18n, changeLanguage } from './js/i18n.js'

function App() {
    const [showBootScreen, setShowBootScreen] = useState(true)
    const [version] = useState('DEV')
    const [i18nReady, setI18nReady] = useState(false)

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

                // Initialize popup system if needed
                try {
                    const { initializePopups, alertPopup, confirmPopup } = await import('./js/popup.js')
                    await initializePopups()
                    window.alertPopup = alertPopup
                    window.confirmPopup = confirmPopup
                } catch (popupError) {
                    console.warn('Popup system not available:', popupError)
                }

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

    // Boot screen timing - adjust based on your CSS animation duration
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowBootScreen(false)
        }, 6000) // Adjust this to match your boot animation timing

        return () => clearTimeout(timer)
    }, [])

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

export default App