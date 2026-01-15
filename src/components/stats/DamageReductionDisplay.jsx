import React from 'react'
import { useI18n } from '../../hooks/useI18n.js'
import { useCharacter } from '../../contexts/CharacterContext.jsx'
import { BODY_PARTS, MR_HANDY_PARTS } from '../../js/constants.js'

/**
 * Component to display damage reduction stats by body part
 * Shows physical, energy, and radiation resistance for each body part
 * For Mr Handy, shows robot-specific parts (sensors, body, arms, propulsors)
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

    // Get body parts to display based on origin
    const getBodyPartsToDisplay = () => {
        if (character?.origin === 'mrHandy') {
            // Mr Handy has 4 robot parts with unique locations
            return [
                { key: MR_HANDY_PARTS.SENSORS, className: 'leftArm', drKey: 'robotOptics' },      // Top-left position
                { key: MR_HANDY_PARTS.BODY, className: 'rightArm', drKey: 'robotBody' },          // Top-right position
                { key: MR_HANDY_PARTS.ARMS, className: 'leftLeg', drKey: 'robotArms' },           // Bottom-left position
                { key: MR_HANDY_PARTS.PROPULSORS, className: 'rightLeg', drKey: 'robotThrusters' } // Bottom-right position
            ]
        }

        // Standard humanoid body parts
        return Object.values(BODY_PARTS).map(part => ({
            key: part,
            className: part,
            drKey: part
        }))
    }

    const bodyParts = getBodyPartsToDisplay()
    const isMrHandy = character?.origin === 'mrHandy'

    return (
        <div className={`activeApparel l-spaceAround ${isMrHandy ? 'activeApparel--mrhandy' : ''}`}>
            {bodyParts.map(({ key, className, drKey }) => (
                <div key={key} className={`apparel-stat ${className}`}>
                    <div>{t(key)}</div>
                    <div className="row l-centered">
                        <span>{t('physical')}:</span>
                        <span>
                            {formatDR(damageReduction[drKey]?.physical)}
                        </span>
                    </div>
                    <div className="row l-centered">
                        <span>{t('energy')}:</span>
                        <span>
                            {formatDR(damageReduction[drKey]?.energy)}
                        </span>
                    </div>
                    <div className="row l-centered">
                        <span>{t('radiation')}:</span>
                        <span>
                            {formatDR(damageReduction[drKey]?.radiation)}
                        </span>
                    </div>
                </div>
            ))}
            <div className={`apparel-vaultboy themed-svg ${isMrHandy ? 'apparel-mrhandy' : ''}`} data-icon={characterIcon}></div>
        </div>
    )
}

export default DamageReductionDisplay

