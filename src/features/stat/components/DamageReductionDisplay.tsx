import { useTranslation } from 'react-i18next'
import { useCharacter } from '@/contexts/CharacterContext'
import {ORIGINS} from "@/utils/characterSheet";
import { DamageType, GenericBodyPart } from '@/types';

/**
 * Component to display damage reduction stats by body part
 * Shows physical, energy, and radiation resistance for each body part
 * For Mr Handy, shows robot-specific parts (robotPartSensors, body, arms, propulsors)
 */
function DamageReductionDisplay() {
    const { t } = useTranslation()
    const { character } = useCharacter()
    const characterIcon = character.origin.characterSvg

    const isMrHandy = character.origin === ORIGINS.MR_HANDY

    // Get body parts to display based on origin
    const getBodyPartsToDisplay = (): { key: GenericBodyPart; className: string }[] => {

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

    return (
        <div className={`activeApparel row l-spaceAround ${isMrHandy ? 'activeApparel--mrhandy' : ''}`}>
            { bodyParts.map(({ key, className }) => (
                <div key={key} className={`apparel-stat ${className}`}>
                    <div>{t(key)}</div>
                    <div className="row no-gap">
                        <DREntry locationKey={key} damageType="physical"/>
                        <DREntry locationKey={key} damageType="energy"/>
                        <DREntry locationKey={key} damageType="radiation"/>
                    </div>
                </div>
            )) }
            <div className={`apparel-vaultboy themed-svg ${isMrHandy ? 'apparel-mrhandy' : ''}`} data-icon={characterIcon}></div>
        </div>
    )
}

const DREntry = (
    { locationKey, damageType }: { locationKey: GenericBodyPart, damageType: DamageType }
    ) => {
        const { t } = useTranslation()
        const { character } = useCharacter()
        const damageReduction = character.locationsDR

        let toughnessBonus = 0;
        if (damageType === "physical" && character.perks.includes('perkToughness')) {
            toughnessBonus = 1;
        }
        // Helper function to format DR value (show "Immune" for Infinity)
        const formatDR = (value: number) => {
            if (value === Infinity) {return t('immune')}
            return value + toughnessBonus
        }

        const getIcon = (damageType: DamageType) => {
            switch(damageType){
                case 'physical':
                    return 'fa-shield-halved'
                case 'energy':
                    return 'fa-bolt'
                case 'radiation':
                    return 'fa-radiation'
            }
        }

        return (
            <div className="stack no-gap l-centered"
                 style={{
                     padding: 'var(--space-xs) var(--space-s) 0 var(--space-s)',
                     border: 'var(--border-primary-thin)',
                     flex: 1
                }}>
                <i className={`fas ${getIcon(damageType)}`} title={t(damageType)}
                    style={{ fontSize: '0.6rem' }}></i>
                <span style={{ fontSize: '0.7rem' }}>
                    {(() => {
                        const val = damageReduction[locationKey][damageType]
                        return val === Infinity
                            ? (<i className="fas fa-infinity" aria-label={t('immune')} title={t('immune')} />)
                            : formatDR(val)
                    })()}
                </span>
            </div>
        )
    }

export default DamageReductionDisplay

