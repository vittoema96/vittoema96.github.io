import React from 'react'

function StatDisplay({ character, updateCharacter }) {
    // Handle SPECIAL stat changes
    const handleSpecialChange = (statName, value) => {
        updateCharacter({
            special: {
                ...character.special,
                [statName]: parseInt(value)
            }
        })
    }

    const handleFieldChange = (field, value) => {
        updateCharacter({ [field]: value })
    }

    return (
        <div className="stat-display">
            {/* Character Basic Info */}
            <section className="character-info">
                <h2>Character Information</h2>

                <div className="form-group">
                    <label htmlFor="char-name">Name:</label>
                    <input
                        id="char-name"
                        type="text"
                        value={character.name || ''}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        placeholder="Enter character name"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="char-level">Level:</label>
                    <input
                        id="char-level"
                        type="number"
                        min="1"
                        max="50"
                        value={character.level}
                        onChange={(e) => handleFieldChange('level', parseInt(e.target.value))}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="char-origin">Origin:</label>
                    <select
                        id="char-origin"
                        value={character.origin || ''}
                        onChange={(e) => handleFieldChange('origin', e.target.value)}
                    >
                        <option value="">Select Origin</option>
                        <option value="vault-dweller">Vault Dweller</option>
                        <option value="wastelander">Wastelander</option>
                        <option value="ghoul">Ghoul</option>
                        {/* Add more origins as needed */}
                    </select>
                </div>
            </section>

            {/* SPECIAL Stats */}
            <section className="special-stats">
                <h2>S.P.E.C.I.A.L.</h2>

                {Object.entries(character.special).map(([statName, statValue]) => (
                    <div key={statName} className="stat-row">
                        <label htmlFor={`special-${statName}`}>
                            {statName.charAt(0).toUpperCase() + statName.slice(1)}:
                        </label>
                        <input
                            id={`special-${statName}`}
                            type="number"
                            min="1"
                            max="10"
                            value={statValue}
                            onChange={(e) => handleSpecialChange(statName, e.target.value)}
                        />
                        <span className="stat-value">{statValue}</span>
                    </div>
                ))}
            </section>

            {/* Current Stats */}
            <section className="current-stats">
                <h2>Current Status</h2>

                <div className="form-group">
                    <label htmlFor="current-hp">Hit Points:</label>
                    <input
                        id="current-hp"
                        type="number"
                        min="0"
                        value={character.currentHp}
                        onChange={(e) => handleFieldChange('currentHp', parseInt(e.target.value))}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="current-luck">Current Luck:</label>
                    <input
                        id="current-luck"
                        type="number"
                        min="0"
                        max="10"
                        value={character.currentLuck}
                        onChange={(e) => handleFieldChange('currentLuck', parseInt(e.target.value))}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="caps">Caps:</label>
                    <input
                        id="caps"
                        type="number"
                        min="0"
                        value={character.caps}
                        onChange={(e) => handleFieldChange('caps', parseInt(e.target.value))}
                    />
                </div>
            </section>
        </div>
    )
}

export default StatDisplay