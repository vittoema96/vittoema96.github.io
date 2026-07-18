import React from 'react';
import ReactDOM from 'react-dom/client';

import '@fortawesome/fontawesome-free/css/all.min.css';
import '@fontsource/share-tech-mono';
// Fira Code: bundled specifically for the bootscreen ASCII art.
// Confirmed to render Block Elements (█) and Box Drawing (╔═║╗) at uniform width on Android.
import '@fontsource/fira-code';

import './styles/index.css';

import './i18n';

import { UISettingsManager } from '@/styles/UISettingsManager';

import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from './ErrorBoundary';
import { CharacterProvider } from '@/app/contexts/CharacterContext';
import { TooltipProvider } from '@/app/contexts/TooltipContext';
import { PopupProvider } from '@/app/contexts/PopupContext.tsx';
import BootScreen, { useBootScreen } from '@/BootScreen';
import App from '@/app/App';
import UpdatePrompt from '@/app/components/UpdatePrompt';

// Apply appearance settings as early as possible to avoid flicker.
UISettingsManager.applyAll();

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

    return (
        <ErrorBoundary fallbackRender={ErrorFallback}> {/* Handles errors in the entire app */}

            {(showBootScreen) && <BootScreen />}

            <CharacterProvider> {/* Handles Character, used almost everywhere */}
                <TooltipProvider> {/* Handles tooltips, also needed inside Popups */}
                    <PopupProvider> {/* Handles Popups, used in the App */}
                        <App />
                    </PopupProvider>
                </TooltipProvider>
            </CharacterProvider>

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
