import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

import '@fortawesome/fontawesome-free/css/all.min.css';
import '@fontsource/share-tech-mono';
// Fira Code: bundled specifically for the bootscreen ASCII art.
// Confirmed to render Block Elements (█) and Box Drawing (╔═║╗) at uniform width on Android.
import '@fontsource/fira-code';

import './styles/index.css';

import './i18n';

import { UISettingsManager } from '@/styles/UISettingsManager';

import ErrorBoundary from './ErrorBoundary';
import { CharacterProvider } from '@/contexts/CharacterContext';
import { TooltipProvider } from '@/contexts/TooltipContext';
import { PopupProvider } from '@/contexts/popup/PopupContext';
import BootScreen, { useBootScreen } from '@/BootScreen';
import App from '@/app/App';
import { GameDatabase } from '@/services/GameDatabase';
import UpdatePrompt from '@/components/UpdatePrompt';

// Apply appearance settings as early as possible to avoid flicker.
UISettingsManager.applyAll();

// ─── Boot Screen ──────────────────────────────────────────────────────────────

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * Root component — orchestrates startup sequence:
 * - Boot screen (production only, timed)
 * - GameDatabase async init
 * - Global context providers (Character, Tooltip, Popup)
 * - Error boundary
 */
function Main() {
    const showBootScreen = useBootScreen();

    // Database initialization
    const [isDbReady, setIsDbReady] = useState(false);
    useEffect(() => {
        GameDatabase.init()
            .then(() => setIsDbReady(true))
            .catch(err => console.error('FATAL: Failed to load GameDatabase', err));
    }, []);

    return (
        <ErrorBoundary> {/* Handles errors in the entire app */}
            {(!isDbReady || showBootScreen) && <BootScreen />}
            {isDbReady && (
                <CharacterProvider> {/* Handles Character, used almost everywhere */}
                    <TooltipProvider> {/* Handles tooltips, also needed inside Popups */}
                        <PopupProvider> {/* Handles Popups, used in the App */}
                            <App />
                        </PopupProvider>
                    </TooltipProvider>
                </CharacterProvider>
            )}
            <UpdatePrompt />
        </ErrorBoundary>
    );
}

// ─── Render ───────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Main />
    </React.StrictMode>,
);
