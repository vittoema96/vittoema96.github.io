/**
 * Main entrypoint of the whole App/PWA
 * - Loads fonts & styles
 * - Applies saved settings
 * - Creates DOM Root element
 */

import React from 'react';
import ReactDOM from 'react-dom/client';

import '@fortawesome/fontawesome-free/css/all.min.css';
import '@fontsource/share-tech-mono';
// Fira Code: bundled specifically for the bootscreen ASCII art. Confirmed to render Block Elements (█) and Box Drawing (╔═║╗) at uniform width on Android.
import '@fontsource/fira-code';

import './styles/index.css';
import './locales/i18n';

import { UISettingsManager } from '@/services/UISettingsManager';
import { Root } from './Root';

// Apply appearance settings as early as possible to avoid flicker.
UISettingsManager.applyAll();

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Missing React root element');
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <Root />
    </React.StrictMode>,
);
