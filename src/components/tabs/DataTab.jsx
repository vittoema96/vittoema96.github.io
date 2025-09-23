import React from 'react'

function DataTab({ character, updateCharacter }) {
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
                <label className="h2" htmlFor="pg_name" data-i18n="nameLabel">
                    Name:
                </label>
                <input
                    id="pg_name"
                    type="text"
                    data-i18n="namePlaceholder"
                    data-i18n-target="placeholder"
                    placeholder="Character Name"
                    value={character.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                />
            </div>

            {/* Character Level */}
            <div className="row l-distributed l-firstSmall">
                <label className="h4" htmlFor="level" data-i18n="levelLabel">
                    Level:
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
                <label className="h4" htmlFor="origin" data-i18n="originLabel">
                    Origin:
                </label>
                <select
                    id="origin"
                    value={character.origin || 'none'}
                    onChange={(e) => handleFieldChange('origin', e.target.value === 'none' ? undefined : e.target.value)}
                >
                    <option value="none" disabled hidden></option>
                    <option value="vaultDweller" data-i18n="vaultDweller">Vault Dweller</option>
                    <option value="ghoul" data-i18n="ghoul">Ghoul</option>
                    <option value="survivor" data-i18n="survivor">Survivor</option>
                    <option value="mrHandy" data-i18n="mrHandy">Mr. Handy</option>
                    <option value="brotherhoodInitiate" data-i18n="brotherhoodInitiate">Brotherhood Initiate</option>
                    <option value="superMutant" data-i18n="superMutant">Super Mutant</option>
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
                    data-i18n="backgroundPlaceholder"
                    data-i18n-target="placeholder"
                    placeholder="Write your background here..."
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