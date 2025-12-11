import React, { useState, useEffect } from 'react'
import BootScreen from './components/BootScreen.jsx'
import MainApp from './components/MainApp.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { PopupProvider } from './contexts/PopupContext.jsx'
import { CharacterProvider } from './contexts/CharacterContext.jsx'
import { TooltipProvider } from './contexts/TooltipContext.jsx'
import i18next from "i18next";
import enTranslations from "./locales/en.json";
import itTranslations from "./locales/it.json";

// Inner App component that has access to popup and character contexts
function AppContent() {
    const [version] = useState(window.PROJECT_VERSION || 'DEV')
    // Show boot screen only in production (when version doesn't contain BUILD_VERSION)
    const [showBootScreen, setShowBootScreen] = useState(!version.includes('BUILD_VERSION'))

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

    // Initialize i18n and global systems
    const [i18nReady, setI18nReady] = useState(false)
    useEffect(() => {
        const initializeLanguage = async () => {
            try {
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

                setI18nReady(true)
                console.log(`i18n initialized with language: ${initialLanguage}`);
            } catch (error) {
                console.error('Failed to initialize languages:', error)
                // Set ready anyway to prevent blocking
                setI18nReady(true)
            }
        }
        initializeLanguage()
    }, [])

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