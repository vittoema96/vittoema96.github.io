import React, { useState, useEffect, useLayoutEffect }  from 'react'
import ReactDOM from 'react-dom/client'

import '@fortawesome/fontawesome-free/css/all.min.css'
import '@fontsource/fira-code'
import '@fontsource/roboto-mono'
import '@fontsource/share-tech-mono'
import './styles/styles.css'

// Initialize i18n before anything else
import './i18n'
import { useTranslation } from 'react-i18next'

import { applyTheme } from '@/app/tabs/settings/utils/themeUtils'

import ErrorBoundary from "./ErrorBoundary";
import { CharacterProvider } from "@/contexts/CharacterContext";
import { TooltipProvider } from "@/contexts/TooltipContext";
import { PopupProvider } from "@/contexts/popup/PopupContext";
import BootScreen from "@/BootScreen";
import App from "@/app/App";
import {GameDatabase} from "@/services/GameDatabase";

// DEV ONLY
const FORCE_BOOT_SCREEN = false;


// Create React root and render Main
const rootElement = document.getElementById('root')! // ! as we are sure it exists
ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <Main />
    </React.StrictMode>
)

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
    // Check i18n initialization
    const { ready: i18nReady } = useTranslation(undefined, {useSuspense: false})

    // Apply theme before React renders
    useLayoutEffect(() => {
        applyTheme()
    }, []);


    // Boot screen logic
    const isProduction  = !__APP_VERSION__.includes('BUILD_VERSION') || FORCE_BOOT_SCREEN
    const [ showBootScreen, setShowBootScreen ] = useState(isProduction)
    useEffect(() => {
        if (!showBootScreen) {return}

        const timer = setTimeout(() => {
            setShowBootScreen(false)
        }, 6000)

        return () => clearTimeout(timer)
    }, [showBootScreen])

    // Initialize database
    const [isDbReady, setIsDbReady] = useState(false)
    useEffect(() => {
        // Start loading immediately on mount
        GameDatabase.init()
            .then(() => setIsDbReady(true))
            .catch((err) => console.error("FATAL: Failed to load GameDatabase", err));
    }, []);

    // Character Provider Ready state
    const [isCharacterReady, setIsCharacterReady] = useState(false)

    // Is everything ready?
    const isReady = i18nReady && isDbReady && isCharacterReady


    // TODO handling of ready state and bootscreen-while-loading should be improved
    return (
        <ErrorBoundary>
            {(!isReady || showBootScreen) && (
                <BootScreen/>
            )}
            {isDbReady && <CharacterProvider onReady={() => setIsCharacterReady(true)}>
                <TooltipProvider>
                    <PopupProvider>
                        <App/>
                    </PopupProvider>
                </TooltipProvider>
            </CharacterProvider>}
        </ErrorBoundary>
    )
}
