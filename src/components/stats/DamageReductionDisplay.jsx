import React from 'react'
import { useI18n } from '../../hooks/useI18n.js'
import { useCharacter } from '../../contexts/CharacterContext.jsx'
import { BODY_PARTS } from '../../js/constants.js'

/**
 * Component to display damage reduction stats by body part
 * Shows physical, energy, and radiation resistance for each body part
 */
function DamageReductionDisplay() {
    const t = useI18n()
    const { character, derivedStats } = useCharacter()
    const damageReduction = derivedStats.locationsDR || {}

    // Use origin-specific SVG icon
    const getCharacterIcon = () => {
        if (character?.origin === 'mrHandy') return 'mrHandy'
        if (character?.origin === 'ghoul') return 'ghoul'
        return 'vaultboy-open-arms'
    }
    const characterIcon = getCharacterIcon()

    // Helper function to format DR value (show "Immune" for Infinity)
    const formatDR = (value) => {
        if (value === Infinity) return t('immune')
        return value || 0
    }

    return (
        <div className="activeApparel l-spaceAround">
            {Object.values(BODY_PARTS).map(bodyPart => (
                <div key={bodyPart} className={`apparel-stat ${bodyPart}`}>
                    <div>{t(bodyPart)}</div>
                    <div className="row l-centered">
                        <span>{t('physical')}:</span>
                        <span>
                            {formatDR(damageReduction[bodyPart]?.physical)}
                        </span>
                    </div>
                    <div className="row l-centered">
                        <span>{t('energy')}:</span>
                        <span>
                            {formatDR(damageReduction[bodyPart]?.energy)}
                        </span>
                    </div>
                    <div className="row l-centered">
                        <span>{t('radiation')}:</span>
                        <span>
                            {formatDR(damageReduction[bodyPart]?.radiation)}
                        </span>
                    </div>
                </div>
            ))}
            <div className="apparel-vaultboy themed-svg" data-icon={characterIcon}></div>
        </div>
    )
}

export default DamageReductionDisplay

