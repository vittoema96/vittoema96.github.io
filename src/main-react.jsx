import React, { useState, useEffect }  from 'react'
import ReactDOM from 'react-dom/client'
import { applyTheme } from './hooks/useTheme.js'
import i18next from "i18next";

import '@fortawesome/fontawesome-free/css/all.min.css'
import '@fontsource/fira-code'
import '@fontsource/roboto-mono'
import '@fontsource/share-tech-mono'
import './styles/styles.css'
import enTranslations from "./locales/en.json";
import itTranslations from "./locales/it.json";
import ErrorBoundary from "./ErrorBoundary.jsx";
import {CharacterProvider} from "./contexts/CharacterContext.jsx";
import {TooltipProvider} from "./contexts/TooltipContext.jsx";
import {PopupProvider} from "./contexts/PopupContext.jsx";
import BootScreen from "./BootScreen.jsx";
import App from "./app/App.jsx";

// Apply theme before React renders
applyTheme()


// Get version from Vite's define and decide if we're in production (to show boot screen)
const VERSION = globalThis.PROJECT_VERSION
const IS_PRODUCTION  = !VERSION.includes('BUILD_VERSION')


// Create React root and render Main
ReactDOM.createRoot(document.getElementById('root')).render(
    <Main />
)


/**
 * Initialize i18n translation engine
 * @returns {Promise<void>}
 */
async function initializeTranslationEngine(){
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

        console.log(`i18n initialized with language: ${initialLanguage}`);
    } catch (error) {
        console.error('Failed to initialize languages:', error)
    }
}

/**
 * Main entry point for React app
 * Handles:
 * <ul>
 *     <li> i18n initialization (aka translations) </li>
 *     <li> Boot screen </li>
 *     <li>
 *         Global context providers
 *         <ul>
 *             <li> CharacterProvider: provides character data </li>
 *             <li> TooltipProvider: provide tooltip management </li>
 *             <li> PopupProvider: provides popup management </li>
 *         </ul>
 *     </li>
 *     <li> Error boundary: catches and handles React errors </li>
 * </ul>
 */
function Main() {

    // Initialize translation engine
    const [i18nReady, setI18nReady] = useState(false)
    useEffect(() => {
        initializeTranslationEngine().then(() => setI18nReady(true))
    }, [])


    // Boot screen logic
    const [showBootScreen, setShowBootScreen] = useState(IS_PRODUCTION)
    useEffect(() => {
        if (!showBootScreen) return

        const timer = setTimeout(() => {
            setShowBootScreen(false)
        }, 6000)

        return () => clearTimeout(timer)
    }, [showBootScreen])


    return (
        <React.StrictMode>
            <ErrorBoundary>
                {/* Boot Screen - shows first */}
                <BootScreen version={VERSION} isVisible={showBootScreen}/>

                {/* Main App - shows after boot screen finishes */}
                {
                    !showBootScreen &&
                    i18nReady &&
                    <CharacterProvider>
                        <TooltipProvider>
                            <PopupProvider>
                                <App />
                            </PopupProvider>
                        </TooltipProvider>
                    </CharacterProvider>
                }
            </ErrorBoundary>
        </React.StrictMode>
    )
}