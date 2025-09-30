import React, { useState, useEffect } from 'react'
import BootScreen from './components/BootScreen.jsx'
import MainApp from './components/MainApp.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { initI18n } from './js/i18n.js'
import { PopupProvider, usePopup } from './contexts/PopupContext.jsx'
import { CharacterProvider } from './contexts/CharacterContext.jsx'
import { TooltipProvider } from './contexts/TooltipContext.jsx'

// Inner App component that has access to popup and character contexts
function AppContent() {
    const [version] = useState(window.PROJECT_VERSION || 'DEV')
    // Show boot screen only in production (when version doesn't contain BUILD_VERSION)
    const [showBootScreen, setShowBootScreen] = useState(!version.includes('BUILD_VERSION'))
    const [i18nReady, setI18nReady] = useState(false)

    // Character data now managed by CharacterProvider

    // Initialize i18n and global systems
    useEffect(() => {
        const initializeSystems = async () => {
            try {
                // Initialize i18n first
                await initI18n()
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

    // Boot screen
    useEffect(() => {
        if (version === 'DEV') {
            return
        }

        const timer = setTimeout(() => {
            setShowBootScreen(false)
        }, 6000)

        return () => clearTimeout(timer)
    }, [version])

    // Don't render until i18n is loaded (character loading handled by CharacterProvider)
    if (!i18nReady) {
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
            {!showBootScreen && <MainApp />}
        </div>
    )
}

// Main App component with providers and error boundary
function App() {
    return (
        <ErrorBoundary>
            <CharacterProvider>
                <TooltipProvider>
                    <PopupProvider>
                        <AppContent />
                    </PopupProvider>
                </TooltipProvider>
            </CharacterProvider>
        </ErrorBoundary>
    )
}

export default App