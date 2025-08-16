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
    const { derivedStats } = useCharacter()
    const damageReduction = derivedStats.locationsDR || {}

    return (
        <div className="activeApparel l-spaceAround">
            {Object.values(BODY_PARTS).map(bodyPart => (
                <div key={bodyPart} className={`apparel-stat ${bodyPart}`}>
                    <div>{t(bodyPart)}</div>
                    <div className="row l-centered">
                        <span>{t('physical')}:</span>
                        <span>
                            {damageReduction[bodyPart]?.physical || 0}
                        </span>
                    </div>
                    <div className="row l-centered">
                        <span>{t('energy')}:</span>
                        <span>
                            {damageReduction[bodyPart]?.energy || 0}
                        </span>
                    </div>
                    <div className="row l-centered">
                        <span>{t('radiation')}:</span>
                        <span>
                            {damageReduction[bodyPart]?.radiation || 0}
                        </span>
                    </div>
                </div>
            ))}
            <div className="apparel-vaultboy themed-svg" data-icon="vaultboy-open-arms"></div>
        </div>
    )
}

export default DamageReductionDisplay

