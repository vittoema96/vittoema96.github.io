import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UISettingsManager, Theme, THEMES, DISPLAY_EFFECTS, type DisplayEffect, type Language, LANGUAGES } from '@/services/UISettingsManager.ts';
import { usePopup } from '@/app/contexts/PopupContext.tsx';
import { useCharacter } from '@/app/contexts/CharacterContext';
import { changeLanguage } from '@/locales/i18n.ts';

const useDisplayEffectsState = () => {
    const [ displayEffects, setDisplayEffects ] = useState<DisplayEffect>(() => UISettingsManager.getCurrentDisplayEffect())

    useEffect(() => {
        UISettingsManager.setDisplayEffect(displayEffects)
    }, [displayEffects])

    return [displayEffects, setDisplayEffects] as const
}

function SettingsTab() {
    const { t } = useTranslation()

    const [currentTheme, setCurrentTheme] = useState(UISettingsManager.getCurrentTheme);
    const [currentLanguage, setCurrentLanguage] = useState(UISettingsManager.getCurrentLanguage);
    const [displayEffects, setDisplayEffects] = useDisplayEffectsState();

    const { showAlert, showConfirm } = usePopup();

    // Read clean store actions and state from Context
    const {
        setActiveSlot,
        activeSlot,
        slots,
        deleteSlot,
        importSlot
    } = useCharacter();

    /** Fired when user changes Language in selector */
    const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLang = e.target.value as Language
        await changeLanguage(newLang)
        setCurrentLanguage(newLang)
    }

    /** Fired when user changes Theme in selector */
    const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTheme = e.target.value as Theme;
        setCurrentTheme(UISettingsManager.setTheme(newTheme));
    };

    /** Delete a character from a slot using Zustand store action */
    const handleDeleteSlot = (slotIndex: number) => {
        const slot = slots[slotIndex];
        const characterName = slot?.name || `Slot ${slotIndex + 1}`;

        showConfirm(
            `${t('confirmDeleteCharacter')}\n${t('name')}: ${characterName}`,
            () => {
                deleteSlot(slotIndex);
            }
        );
    };

    /** Export a character from a specific slot */
    const handleExportSlot = (slotIndex: number) => {
        const character = slots[slotIndex];
        if (!character) {
            showAlert(t('noCharacterInSlot'));
            return;
        }

        const dataStr = JSON.stringify(character, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `character_${character.name || 'unnamed'}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    /** Import a character to a specific slot using Zustand store action */
    const handleImportToSlot = (slotIndex: number, file: File) => {
        file.text()
            .then((text) => {
                const rawData = JSON.parse(text);
                importSlot(slotIndex, rawData);
                showAlert(t('characterImportSuccess'));
            })
            .catch((err) => {
                const errorMsg = `${t('importFailed')}: ${err.message}`;
                showAlert(errorMsg);
            });
    };

    /** Fired when user clicks Reset Memory */
    const handleResetMemory = () => {
        const confirmAction = () => {
            for(const key in localStorage){
                if(key.startsWith('PB3K')){
                    localStorage.removeItem(key);
                }
            }
            // Reload page to re-initialize clean default application state
            window.location.reload();
        };

        showConfirm(t('confirmDeleteCharacter'), confirmAction);
    };

    return (
        <section className="tabContent">
            <span className="h3">{t('settings')}</span>

            <div className="row l-distributed">
                <div className="stack">
                    <label htmlFor="language-select">{t('language')}:</label>
                    <select id="language-select" value={currentLanguage} onChange={handleLanguageChange}>
                        {Object.entries(LANGUAGES).map(([lang, label]) => (
                            <option key={lang} value={lang}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="stack">
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
                <div className="row l-spaceAround">
                    {DISPLAY_EFFECTS.map((val) => (
                        <div className="row" key={val} style={{ width: 'unset' }}>
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
                {slots.map((slot, index) => (
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
                        {/* Radio button for active selection (always enabled) */}
                        <input
                            type="radio"
                            name="activeCharacter"
                            checked={activeSlot === index}
                            onChange={() => setActiveSlot(index)}
                        />

                        <div className="stack no-gap" style={{ flex: 1, minWidth: '130px' }}>
                            <span className="h4">
                                {!slot ? `--- ${t('emptySlot')} ---` : slot.name ?? 'Unnamed'}
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
                                    className="icon-m"
                                    style={{
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        display: 'flex',
                                    }}
                                    title={t('export')}
                                >
                                    <i className="fas fa-download"></i>
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
                                    <i className="fas fa-trash"></i>
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
                            <i className="fas fa-upload"></i>
                        </label>
                        <input
                            id={`import-slot-${index}`}
                            type="file"
                            accept=".json,application/json"
                            className="hidden"
                            onChange={(e) => {
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

export default SettingsTab;
