import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Import your existing CSS
import '@fortawesome/fontawesome-free/css/all.min.css'
import '@fontsource/fira-code'
import '@fontsource/roboto-mono'
import '@fontsource/share-tech-mono'
import './styles/styles.css'

const applyTheme = () => {
    let value = localStorage.getItem('theme');
    if (!['theme-fallout-3', 'theme-fallout-new-vegas'].includes(value)) {
        value = 'theme-fallout-3';
    }

    document.body.className = value;

    // Update the meta tag for PWA
    const computedStyle = getComputedStyle(document.body);
    const primaryColor = computedStyle.getPropertyValue('--primary-color');
    const metaTag = document.querySelector('meta[name="theme-color"]');
    if (metaTag) {
        metaTag.setAttribute('content', primaryColor);
    }

    localStorage.setItem('theme', value);
}

// Apply theme immediately (before React renders)
applyTheme()

// Create React root and render App
ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
)