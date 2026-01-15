import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { applyTheme } from './hooks/useTheme.js'

import '@fortawesome/fontawesome-free/css/all.min.css'
import '@fontsource/fira-code'
import '@fontsource/roboto-mono'
import '@fontsource/share-tech-mono'
import './styles/styles.css'

// Apply theme before React renders
applyTheme()

// Create React root and render App with Strict Mode
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)