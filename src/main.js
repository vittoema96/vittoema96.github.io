// Main entry point for Vite bundling
// Load external dependencies and make them globally available
import Papa from 'papaparse';
import Panzoom from '@panzoom/panzoom';

// Import Font Awesome CSS (self-hosted, no CDN dependency)
import '@fortawesome/fontawesome-free/css/all.min.css';

// Import Google Fonts (self-hosted, no CDN dependency)
import '@fontsource/fira-code';
import '@fontsource/roboto-mono';
import '@fontsource/share-tech-mono';

// Make libraries globally available (simple approach)
window.Papa = Papa;
window.Panzoom = Panzoom;

// Import our ES6 modules
import './js/constants.js'; // Game constants
import './js/gameRules.js'; // Game logic
import './js/characterRepository.js'; // Data persistence
import './js/character.js'; // Character model
import './js/i18n.js'; // Modern i18n system
import './js/display.js'; // Display system
import './js/popup.js'; // Popup system
import './js/app.js'; // App initialization

// All JavaScript files are now ES6 modules - no dynamic loading needed
console.log('All JavaScript files have been converted to ES6 modules! 🎉');
