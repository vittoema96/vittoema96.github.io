import { useTranslation } from 'react-i18next'
import { useCharacter } from '@/contexts/CharacterContext'
import {ORIGINS} from "@/utils/characterSheet";
import {GenericBodyPart} from "@/types";

/**
 * Component to display damage reduction stats by body part
 * Shows physical, energy, and radiation resistance for each body part
 * For Mr Handy, shows robot-specific parts (robotPartSensors, body, arms, propulsors)
 */
function DamageReductionDisplay() {
    const { t } = useTranslation()
    const { character } = useCharacter()
    const damageReduction = character.locationsDR

    const characterIcon = character.origin.characterSvg

    // Helper function to format DR value (show "Immune" for Infinity)
    const formatDR = (value: number) => {
        if (value === Infinity) {return t('immune')}
        return value
    }


    // Get body parts to display based on origin
    const getBodyPartsToDisplay = (): { key: GenericBodyPart; className: string }[] => {

        const isMrHandy = character.origin === ORIGINS.MR_HANDY
        if(isMrHandy){
            // TODO handle other type of robots when introduced
            // Mr Handy has 4 robot parts with unique locations
            return [
                { key: 'robotPartSensors', className: 'leftArm' },      // Top-left position
                { key: 'robotPartBody', className: 'rightArm' },          // Top-right position
                { key: 'robotPartArms', className: 'leftLeg' },           // Bottom-left position
                { key: 'robotPartThrusters', className: 'rightLeg' } // Bottom-right position
            ]
        }

        return Array.from(character.origin.bodyParts, part => ({
            key: part,
            className: part
        }))
    }

    const bodyParts = getBodyPartsToDisplay()
    const isMrHandy = character.origin === ORIGINS.MR_HANDY

    return (
        <div className={`activeApparel l-spaceAround ${isMrHandy ? 'activeApparel--mrhandy' : ''}`}>
            {bodyParts.map(({ key, className }) => (
                <div key={key} className={`apparel-stat ${className}`}>
                    <div>{t(key)}</div>
                    <div className="row l-centered">
                        <span>{t('physical')}:</span>
                        <span>
                            {formatDR(damageReduction[key].physical)}
                        </span>
                    </div>
                    <div className="row l-centered">
                        <span>{t('energy')}:</span>
                        <span>
                            {formatDR(damageReduction[key].energy)}
                        </span>
                    </div>
                    <div className="row l-centered">
                        <span>{t('radiation')}:</span>
                        <span>
                            {formatDR(damageReduction[key].radiation)}
                        </span>
                    </div>
                </div>
            ))}
            <div className={`apparel-vaultboy themed-svg ${isMrHandy ? 'apparel-mrhandy' : ''}`} data-icon={characterIcon}></div>
        </div>
    )
}

export default DamageReductionDisplay

