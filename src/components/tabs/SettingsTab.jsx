import React, { useRef, useEffect } from 'react'
import { t } from 'i18next'
import { useTheme } from '../../hooks/useTheme.js'
import { useLanguage } from '../../hooks/useLanguage.js'
import { usePopup } from '../../contexts/PopupContext.jsx'
import { useCharacter } from '../../contexts/CharacterContext.jsx'

function SettingsTab() {
    const fileInputRef = useRef(null)
    const languageSelectRef = useRef(null)
    const themeSelectRef = useRef(null)
    const { currentTheme, changeTheme } = useTheme()
    const { currentLanguage, changeLanguage } = useLanguage()
    const { showAlert, showConfirm } = usePopup()
    const { downloadCharacter, uploadCharacter, resetCharacter } = useCharacter()

    // Initialize selectors with saved values on mount
    useEffect(() => {
        // Set language selector to current language
        if (languageSelectRef.current) {
            languageSelectRef.current.value = currentLanguage
        }

        // Set theme selector to current theme
        if (themeSelectRef.current) {
            themeSelectRef.current.value = currentTheme
        }
    }, [])

    const handleLanguageChange = async (e) => {
        const newLang = e.target.value
        await changeLanguage(newLang)
    }

    const handleThemeChange = (e) => {
        const newTheme = e.target.value
        changeTheme(newTheme)
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
                    showAlert(t('characterImportSuccess'))
                })
                .catch(err => {
                    const errorMsg = `${t('importFailed')}: ${err.message}`
                    showAlert(errorMsg)
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
                showAlert(t('localDataWiped'))
            }, 500)

            // Re-apply theme and language after reset
            changeTheme()
            changeLanguage()
        }

        showConfirm(t('confirmDeleteCharacter'), confirmAction)
    }

    return (
        <section className="tabContent">
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
                <button onClick={downloadCharacter}>
                    {t('downloadPG')}
                </button>
                <button onClick={handleImportClick}>
                    {t('importPG')}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleFileUpload}
                />
            </div>

            <hr />

            {/* Reset Memory */}
            <button onClick={handleResetMemory}>
                {t('resetMemory')}
            </button>


        </section>
    )
}

export default SettingsTab