import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {getCurrentTheme, applyTheme, Theme, THEMES} from '@/utils/themeUtils.ts'
import { usePopup } from '@/contexts/popup/PopupContext.tsx'
import { useCharacter } from '@/contexts/CharacterContext.tsx'
import {changeLanguage, getCurrentLanguage, Language, LANGUAGES} from "@/i18n.ts";

function SettingsTab() {
    const { t } = useTranslation()
    const fileInputRef: React.RefObject<HTMLInputElement | null> = useRef(null)

    const [ currentTheme, setCurrentTheme ] = useState(getCurrentTheme)
    const [ currentLanguage, setCurrentLanguage ] = useState(getCurrentLanguage)

    const { showAlert, showConfirm } = usePopup()
    const { downloadCharacter, uploadCharacter, resetCharacter } = useCharacter()

    /** Fired when user changes Language in selector */
    const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLang = e.target.value as Language
        await changeLanguage(newLang)
        setCurrentLanguage(newLang)
    }

    /** Fired when user changes Theme in selector */
    const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTheme = e.target.value as Theme
        applyTheme(newTheme)
        setCurrentTheme(newTheme)
    }

    /** Fired when user clicks Import PG */
    const onImportClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
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

    /** Fired when user clicks Reset Memory */
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
            setCurrentTheme(applyTheme())
            changeLanguage().then(r => setCurrentLanguage(r))
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
                value={currentLanguage}
                onChange={handleLanguageChange}
            >
                {Object.entries(LANGUAGES).map(([lang, label]) => (
                    <option key={lang} value={lang}>
                        {label}
                    </option>
                ))}
            </select>

            <hr />

            {/* Theme Selection */}
            <label htmlFor="theme-select">{t('theme')}:</label>
            <select
                id="theme-select"
                value={currentTheme}
                onChange={handleThemeChange}>
                {Object.entries(THEMES).map(([lang, label]) => (
                    <option key={lang} value={lang}>
                        {label}
                    </option>
                ))}
            </select>

            <hr />

            {/* Character Import/Export */}
            <div className="row l-spaceAround">
                <button onClick={downloadCharacter}>
                    {t('downloadPG')}
                </button>
                <button onClick={onImportClick}>
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
