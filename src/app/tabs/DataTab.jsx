import React, { useState, useEffect } from 'react'
import { t } from 'i18next'
import { useCharacter } from '../../contexts/CharacterContext.jsx'

function DataTab() {
    const { character, updateCharacter } = useCharacter()
    const [ levelInput, setLevelInput ] = useState(character.level)

    // Update levelInput when character.level changes (e.g., when loading a character)
    useEffect(() => {
        setLevelInput(character.level)
    }, [character.level])

    const handleFieldChange = (field, value) => {
        // Special handling for origin change to mrHandy
        if (field === 'origin' && value === 'mrHandy') {
            // Unequip all apparel items
            const updatedItems = character.items?.map(item => {
                const itemType = item.type
                const isApparel = ['clothing', 'headgear', 'outfit'].includes(itemType) || itemType.endsWith('Armor')

                if (isApparel && item.equipped) {
                    return { ...item, equipped: false }
                }
                return item
            }) || []

            updateCharacter({
                [field]: value,
                items: updatedItems
            })
        } else {
            updateCharacter({ [field]: value })
        }
    }

    const handleLevelChange = (e) => {
        const value = e.target.value
        // Allow empty string temporarily
        if (value === '') {
            setLevelInput('')
            return
        }

        const numValue = parseInt(value)
        if (!isNaN(numValue) && numValue >= 1) {
            setLevelInput(numValue)
            updateCharacter({ level: numValue })
        }
    }

    const handleLevelBlur = () => {
        // On blur, if empty or invalid, restore previous value
        if (levelInput === '' || levelInput < 1) {
            setLevelInput(character.level)
        }
    }

    return (
        <section className="tabContent">
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
                    value={levelInput}
                    onChange={handleLevelChange}
                    onBlur={handleLevelBlur}
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