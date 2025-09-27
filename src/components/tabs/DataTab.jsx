import React from 'react'
import { useI18n } from '../../hooks/useI18n.js'
import { useCharacter } from '../../contexts/CharacterContext.jsx'

function DataTab() {
    const t = useI18n()
    const { character, updateCharacter } = useCharacter()
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
                <label className="h2" htmlFor="pg_name">
                    {t('name')}:
                </label>
                <input
                    id="pg_name"
                    type="text"
                    placeholder={t('namePlaceholder')}
                    value={character.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                />
            </div>

            {/* Character Level */}
            <div className="row l-distributed l-firstSmall">
                <label className="h4" htmlFor="level">
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
                <label className="h4" htmlFor="origin">
                    {t('origin')}:
                </label>
                <select
                    id="origin"
                    value={character.origin || 'none'}
                    onChange={(e) => handleFieldChange('origin', e.target.value === 'none' ? undefined : e.target.value)}
                >
                    <option value="none" disabled hidden></option>
                    <option value="vaultDweller">{t('vaultDweller')}</option>
                    <option value="ghoul">{t('ghoul')}</option>
                    <option value="survivor">{t('survivor')}</option>
                    <option value="mrHandy">{t('mrHandy')}</option>
                    <option value="brotherhoodInitiate">{t('brotherhoodInitiate')}</option>
                    <option value="superMutant">{t('superMutant')}</option>
                </select>
            </div>

            {/* Character Background */}
            <div className="row l-distributed l-firstSmall">
                <label className="h4" htmlFor="character-background">
                    Background:
                </label>
                <textarea
                    id="character-background"
                    rows="7"
                    placeholder={t('backgroundPlaceholder')}
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