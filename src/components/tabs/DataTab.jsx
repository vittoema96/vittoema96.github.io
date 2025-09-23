import React from 'react'
import { useI18n } from '../../hooks/useI18n.js'

function DataTab({ character, updateCharacter }) {
    const t = useI18n()
    const handleFieldChange = (field, value) => {
        updateCharacter({ [field]: value })
    }

    const handleLevelChange = (value) => {
        const numValue = Number(value)
        if (!numValue || numValue < 1) {
            return
        }
        updateCharacter({ level: numValue })
    }

    return (
        <section id="data-tabContent" className="tabContent">
            {/* Character Name */}
            <div className="row l-distributed l-firstSmall">
                <label className="h2" htmlFor="pg_name" data-i18n="name">
                    {t('name')}:
                </label>
                <input
                    id="pg_name"
                    type="text"
                    data-i18n="namePlaceholder"
                    data-i18n-target="placeholder"
                    placeholder={t('namePlaceholder')}
                    value={character.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                />
            </div>

            {/* Character Level */}
            <div className="row l-distributed l-firstSmall">
                <label className="h4" htmlFor="level" data-i18n="level">
                    {t('level')}:
                </label>
                <input
                    id="level"
                    type="number"
                    min="1"
                    step="1"
                    value={character.level}
                    onChange={(e) => handleLevelChange(e.target.value)}
                />
            </div>

            {/* Character Origin */}
            <div className="row l-distributed l-firstSmall">
                <label className="h4" htmlFor="origin" data-i18n="origin">
                    {t('origin')}:
                </label>
                <select
                    id="origin"
                    value={character.origin || 'none'}
                    onChange={(e) => handleFieldChange('origin', e.target.value === 'none' ? undefined : e.target.value)}
                >
                    <option value="none" disabled hidden></option>
                    <option value="vaultDweller" data-i18n="vaultDweller">{t('vaultDweller')}</option>
                    <option value="ghoul" data-i18n="ghoul">{t('ghoul')}</option>
                    <option value="survivor" data-i18n="survivor">{t('survivor')}</option>
                    <option value="mrHandy" data-i18n="mrHandy">{t('mrHandy')}</option>
                    <option value="brotherhoodInitiate" data-i18n="brotherhoodInitiate">{t('brotherhoodInitiate')}</option>
                    <option value="superMutant" data-i18n="superMutant">{t('superMutant')}</option>
                </select>
            </div>

            {/* Character Background */}
            <div className="row l-distributed l-firstSmall">
                <label className="h4" htmlFor="character-background">
                    {t('backgroundLabel') || 'Background'}:
                </label>
                <textarea
                    id="character-background"
                    rows="7"
                    data-i18n="backgroundPlaceholder"
                    data-i18n-target="placeholder"
                    placeholder={t('backgroundPlaceholder') || 'Write your background here...'}
                    value={character.background || ''}
                    onChange={(e) => handleFieldChange('background', e.target.value)}
                />
            </div>

            <br /><br /><br /><br />
            <span className="h1">WORK IN PROGRESS</span>
        </section>
    )
}

export default DataTab