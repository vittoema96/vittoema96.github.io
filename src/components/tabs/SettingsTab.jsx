import React, { useRef } from 'react'

function SettingsTab({ downloadCharacter, uploadCharacter, resetCharacter }) {
    const fileInputRef = useRef(null)

    const handleImportClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            uploadCharacter(file)
                .then(() => alert('Character imported successfully!'))
                .catch(err => alert(`Import failed: ${err.message}`))
        }
        // Reset file input
        e.target.value = ''
    }

    const handleResetMemory = () => {
        if (confirm('Are you really sure you want to DELETE YOUR CHARACTER and EVERY OTHER SAVED DATA?')) {
            resetCharacter()
            alert('Local data was wiped')
        }
    }

    return (
        <section id="settings-tabContent" className="tabContent">
            <span className="h3">Settings</span>

            {/* Language Selection */}
            <label data-i18n="language" htmlFor="language-select">Language:</label>
            <select id="language-select" onChange={(e) => window.changeLanguage?.(e.target.value)}>
                <option value="en">English</option>
                <option value="it">Italiano</option>
            </select>

            <hr />

            {/* Theme Selection */}
            <label data-i18n="theme" htmlFor="theme-select">Theme:</label>
            <select id="theme-select">
                <option value="theme-fallout-3">Fallout 3</option>
                <option value="theme-fallout-new-vegas">Fallout New Vegas</option>
            </select>

            <hr />

            {/* Character Import/Export */}
            <div className="row l-spaceAround">
                <button id="button-downloadPG" onClick={downloadCharacter}>
                    Download PG
                </button>
                <button id="button-importPG" onClick={handleImportClick}>
                    Import PG
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    id="input-importPG"
                    onChange={handleFileUpload}
                />
            </div>

            <hr />

            {/* Reset Memory */}
            <button id="reset-memory-button" onClick={handleResetMemory}>
                RESET MEMORY
            </button>
        </section>
    )
}

export default SettingsTab