// Set version in boot screen
import {initI18n} from "./js/i18n.js";

const versionBootLine = document.getElementById('appVersion');
versionBootLine.textContent = versionBootLine.textContent.replace(
    '{version}',
    PROJECT_VERSION.toUpperCase()
);

// Import Font Awesome CSS (self-hosted)
import '@fortawesome/fontawesome-free/css/all.min.css';

// Import Google Fonts (self-hosted)
import '@fontsource/fira-code';
import '@fontsource/roboto-mono';
import '@fontsource/share-tech-mono';

document.addEventListener('DOMContentLoaded', async () => {
    dataManager = new DataManager();
    await dataManager.loadAllData();

    cardFactory = new CardFactory();

    // Make globals available (simple and working approach)
    window.dataManager = dataManager;
    window.cardFactory = cardFactory;

    await initI18n();
    setCharacterData(Character.load());

    const mainDisplayInstance = new MainDisplay();
    setMainDisplay(mainDisplayInstance);

    initializePopups();
    characterData.dispatchAll();
});



// TODO fix entrypoint of app
import './js/constants.js'; // Game constants
import './js/gameRules.js'; // Game logic
import './js/characterRepository.js'; // Data persistence
import './js/character.js'; // Character model
import './js/i18n.js'; // Modern i18n system
import './js/display.js'; // Display system
import './js/popup.js'; // Popup system
import './js/app.js';
import {Character, characterData, setCharacterData} from "./js/character.js";
import {MainDisplay, setMainDisplay} from "./js/display.js";
import {initializePopups} from "./js/popup.js"; // App initialization
