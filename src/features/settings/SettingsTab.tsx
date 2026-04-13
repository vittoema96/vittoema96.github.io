import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'
import { getCurrentTheme, applyTheme, Theme, THEMES } from '@/styles/theme/themeUtils'
import { usePopup } from '@/contexts/popup/PopupContext'
import { useCharacter } from '@/contexts/CharacterContext'
import {changeLanguage, getCurrentLanguage, Language, LANGUAGES} from "@/i18n"
import { SaveSlotManager, CharacterSlotInfo } from '@/services/SaveSlotManager.ts'

const DISPLAY_EFFECTS = ['on', 'noFlicker', 'off'] as const
type DisplayEffect = (typeof DISPLAY_EFFECTS)[number]
type Settings = {
    CRT_effect?: DisplayEffect
}

const SETTINGS_KEY = 'PB3K_settings'
const loadSettings = (): Settings => JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}')

export const applyDisplayEffect = (val?: DisplayEffect) => {
    val ??= loadSettings().CRT_effect ?? 'on'
    document.body.dataset['crt'] = val
};

const useSettings = () => {
    const [ settings, setSettings ] = useState<Settings>(() => loadSettings())

    useEffect(() => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    }, [settings])

    return [settings, setSettings] as const
}

const useDisplayEffectsState = () => {

    const [settings, setSettings ] = useSettings()

    const [ displayEffects, setDisplayEffects ] = useState<DisplayEffect>(() => {
        return settings.CRT_effect ?? 'on'
    })

    useEffect(() => {
        setSettings({
            ...settings,
            CRT_effect: displayEffects
        })
        applyDisplayEffect(displayEffects)
    }, [displayEffects])

    return [displayEffects, setDisplayEffects] as const
}

function SettingsTab() {
    const { t } = useTranslation()

    const [ currentTheme, setCurrentTheme ] = useState(getCurrentTheme)
    const [ currentLanguage, setCurrentLanguage ] = useState(getCurrentLanguage)
    const [ displayEffects, setDisplayEffects ] = useDisplayEffectsState()
    const [ characterSlots, setCharacterSlots ] = useState<(CharacterSlotInfo | null)[]>(() => SaveSlotManager.getAllSlots())

    const { showAlert, showConfirm } = usePopup()
    const { rawCharacter, resetCharacter, switchToSlot, activeSlot } = useCharacter()

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

    /** Refresh character slots list */
    const refreshSlots = () => {
        setCharacterSlots(SaveSlotManager.getAllSlots())
    }

    useEffect(() => {
        refreshSlots()
    }, [rawCharacter])

    /** Switch to a different character slot */
    const handleSwitchSlot = (slotIndex: number) => {
        switchToSlot(slotIndex)
    }

    /** Delete a character from a slot */
    const handleDeleteSlot = (slotIndex: number) => {
        const slot = characterSlots[slotIndex]
        const characterName = slot?.name || `Slot ${slotIndex + 1}`

        showConfirm(
            `${t('confirmDeleteCharacter')}\n${t("name")}: ${characterName}`,
            () => {
                SaveSlotManager.clearSlot(slotIndex)
                refreshSlots()
                // If we deleted the active slot, switch to slot 0
                // TODO why? we can stay on the current slot...
                if (slotIndex === activeSlot) {
                    handleSwitchSlot(0)
                }
            }
        )
    }

    /** Export a character from a specific slot */
    const handleExportSlot = (slotIndex: number) => {
        const character = SaveSlotManager.loadFromSlot(slotIndex)
        if (!character) {
            showAlert(t('noCharacterInSlot'))
            return
        }

        const dataStr = JSON.stringify(character, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)

        const link = document.createElement('a')
        link.href = url
        link.download = `character_${character.name || 'unnamed'}_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
    }

    /** Import a character to a specific slot */
    const handleImportToSlot = (slotIndex: number, file: File) => {
        file.text()
            .then(text => {
                const rawData = JSON.parse(text)
                SaveSlotManager.saveToSlot(slotIndex, rawData)
                refreshSlots()
                showAlert(t('characterImportSuccess'))
            })
            .catch(err => {
                const errorMsg = `${t('importFailed')}: ${err.message}`
                showAlert(errorMsg)
            })
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
            refreshSlots()
        }

        showConfirm(t('confirmDeleteCharacter'), confirmAction)
    }

    return (
        <section className="tabContent">
            <span className="h3">{t('settings')}</span>

            <div className={"row l-distributed"}>
                <div className={"stack"}>
                    {/* Language Selection */}
                    <label htmlFor="language-select">{t('language')}:</label>
                    <select id="language-select" value={currentLanguage} onChange={handleLanguageChange}>
                        {Object.entries(LANGUAGES).map(([lang, label]) => (
                            <option key={lang} value={lang}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className={"stack"}>
                    {/* Theme Selection */}
                    <label htmlFor="theme-select">{t('theme')}:</label>
                    <select id="theme-select" value={currentTheme} onChange={handleThemeChange}>
                        {Object.entries(THEMES).map(([lang, label]) => (
                            <option key={lang} value={lang}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>


            <fieldset>
                <legend>{t('crtDisplayEffects')}</legend>
                <div className={'row l-spaceAround'}>
                    {DISPLAY_EFFECTS.map(val => (
                        <div className={"row"} key={val} style={{width: 'unset'}}>
                            <input
                                type="radio"
                                id={`crtDisplayEffects_${val}`}
                                name="crtDisplayEffects"
                                value={val}
                                checked={displayEffects === val}
                                onChange={() => setDisplayEffects(val)}
                            />
                            <label htmlFor={`crtDisplayEffects_${val}`}>{t(val)}</label>
                        </div>
                    ))}
                </div>
            </fieldset>

            <hr />

            {/* Character Slots Management */}
            <span className="h4">{t('characters')}</span>
            <div className="stack">
                {characterSlots.map((slot, index) => (
                    <div
                        key={index}
                        className="row"
                        style={{
                            padding: 'var(--space-m)',
                            border:
                                activeSlot === index
                                    ? 'var(--border-primary-thick)'
                                    : 'var(--border-secondary-thin)',
                            borderRadius: '4px',
                            backgroundColor:
                                activeSlot === index ? 'var(--secondary-color)' : 'transparent',
                        }}
                    >
                        {/* Radio button for active selection */}
                        <input
                            type="radio"
                            name="activeCharacter"
                            checked={activeSlot === index}
                            onChange={() => handleSwitchSlot(index)}
                        />

                        <div className={'stack no-gap'} style={{ flex: 1, minWidth: '130px' }}>
                            <span className="h4">
                                {slot ? slot.name : `--- ${t('emptySlot')} ---`}
                            </span>
                            {slot && (
                                <>
                                    <span className="h5">{slot.origin ? t(slot.origin) : ''}</span>
                                    <span className="h5">{`Lv. ${slot.level}`}</span>
                                </>
                            )}
                        </div>

                        {slot && (
                            <>
                                {/* Export icon button */}
                                <button
                                    onClick={() => handleExportSlot(index)}
                                    className={'icon-m'}
                                    style={{
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        display: 'flex',
                                    }}
                                    title={t('export')}
                                >
                                    <i className="mdi mdi-download"></i>
                                </button>

                                {/* Delete icon button */}
                                <button
                                    onClick={() => handleDeleteSlot(index)}
                                    className="closeButton icon-m"
                                    style={{
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        display: 'flex',
                                        flex: 0,
                                    }}
                                    title={t('delete')}
                                >
                                    <i className="mdi mdi-delete"></i>
                                </button>
                            </>
                        )}

                        {/* Import icon button */}
                        <label
                            htmlFor={`import-slot-${index}`}
                            className="icon-m"
                            style={{
                                justifyContent: 'center',
                                alignItems: 'center',
                                display: 'inline-flex',

                                cursor: 'pointer',
                                border: 'var(--border-primary-thin)',
                                borderRadius: '4px',
                                backgroundColor: 'var(--button-background)',
                            }}
                            title={t('import')}
                        >
                            <i className="mdi mdi-upload"></i>
                        </label>
                        <input
                            id={`import-slot-${index}`}
                            type="file"
                            accept=".json,application/json"
                            className="hidden"
                            onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    handleImportToSlot(index, file);
                                }
                                e.target.value = '';
                            }}
                        />
                    </div>
                ))}
            </div>

            <hr />

            {/* Reset Memory */}
            <button onClick={handleResetMemory}>{t('resetMemory')}</button>
        </section>
    );
}

export default SettingsTab
