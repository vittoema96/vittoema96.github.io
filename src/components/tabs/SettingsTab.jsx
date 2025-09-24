import React, { useRef, useEffect } from 'react'
import { changeLanguage } from '../../js/i18n.js'
import { useI18n } from '../../hooks/useI18n.js'

function SettingsTab({ downloadCharacter, uploadCharacter, resetCharacter }) {
    const fileInputRef = useRef(null)
    const languageSelectRef = useRef(null)
    const themeSelectRef = useRef(null)
    const t = useI18n()

    // Initialize selectors with saved values on mount
    useEffect(() => {
        // Set language selector to saved value
        const savedLanguage = localStorage.getItem('language') || 'it'
        if (languageSelectRef.current) {
            languageSelectRef.current.value = savedLanguage
        }

        // Set theme selector to saved value
        const savedTheme = localStorage.getItem('theme') || 'theme-fallout-3'
        if (themeSelectRef.current) {
            themeSelectRef.current.value = savedTheme
        }
    }, [])

    const handleLanguageChange = async (e) => {
        const newLang = e.target.value
        localStorage.setItem('language', newLang)

        // Use the same logic as original - call changeLanguage without parameter to use saved value
        if (window.changeLanguage) {
            window.changeLanguage(newLang)
        } else {
            // Fallback to direct i18n function
            await changeLanguage(newLang)
        }
    }

    const handleThemeChange = (e) => {
        const newTheme = e.target.value
        localStorage.setItem('theme', newTheme)

        // Call global changeTheme function
        if (window.changeTheme) {
            window.changeTheme()
        }
    }

    const handleImportClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            uploadCharacter(file)
                .then(() => {
                    // Use global alertPopup if available, otherwise use alert
                    if (window.alertPopup) {
                        window.alertPopup(t('characterImportSuccess'))
                    } else {
                        alert(t('characterImportSuccess'))
                    }
                })
                .catch(err => {
                    const errorMsg = `${t('importFailed')}: ${err.message}`
                    if (window.alertPopup) {
                        window.alertPopup(errorMsg)
                    } else {
                        alert(errorMsg)
                    }
                })
        }
        // Reset file input
        e.target.value = ''
    }

    const handleResetMemory = () => {
        // Use global confirmPopup if available, otherwise use confirm
        const confirmAction = () => {
            resetCharacter()
            // Clear all localStorage (like original)
            localStorage.clear()

            // Add a small delay to ensure the confirm dialog has fully closed
            setTimeout(() => {
                if (window.alertPopup) {
                    window.alertPopup(t('localDataWiped'))
                } else {
                    alert(t('localDataWiped'))
                }
            }, 500)

            // Re-apply theme and language after reset
            if (window.changeTheme) window.changeTheme()
            if (window.changeLanguage) window.changeLanguage()
        }

        if (window.confirmPopup) {
            window.confirmPopup('deleteCharacterAlert', confirmAction)
        } else {
            if (confirm(t('confirmDeleteCharacter'))) {
                confirmAction()
            }
        }
    }

    return (
        <section id="settings-tabContent" className="tabContent">
            <span className="h3">{t('settings')}</span>

            {/* Language Selection */}
            <label htmlFor="language-select">{t('language')}:</label>
            <select
                id="language-select"
                ref={languageSelectRef}
                onChange={handleLanguageChange}
            >
                <option value="en">English</option>
                <option value="it">Italiano</option>
            </select>

            <hr />

            {/* Theme Selection */}
            <label htmlFor="theme-select">{t('theme')}:</label>
            <select
                id="theme-select"
                ref={themeSelectRef}
                onChange={handleThemeChange}>
                <option value="theme-fallout-3">Fallout 3</option>
                <option value="theme-fallout-new-vegas">Fallout New Vegas</option>
            </select>

            <hr />

            {/* Character Import/Export */}
            <div className="row l-spaceAround">
                <button id="button-downloadPG" onClick={downloadCharacter}>
                    {t('downloadPG')}
                </button>
                <button id="button-importPG" onClick={handleImportClick}>
                    {t('importPG')}
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
                {t('resetMemory')}
            </button>


        </section>
    )
}

export default SettingsTab