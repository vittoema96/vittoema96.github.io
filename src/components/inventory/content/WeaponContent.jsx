import React from 'react'
import Tag from '../../common/Tag.jsx'
import { useCharacter } from '../../../contexts/CharacterContext.jsx'
import { useI18n } from '../../../hooks/useI18n.js'
import { SKILL_TO_SPECIAL_MAP } from '../../../js/constants.js'

/**
 * Weapon-specific content renderer
 * Displays weapon stats, ammo info, and effect/quality tags
 */
function WeaponContent({ characterItem, itemData }) {
    const { character } = useCharacter()
    const t = useI18n()
    
    const weaponObj = itemData

    // Calculate weapon stats
    const skillValue = character.skills[weaponObj.TYPE] || 0
    const specialValue = character.special[SKILL_TO_SPECIAL_MAP[weaponObj.TYPE]] || 5
    const targetNumber = skillValue + specialValue
    const critThreshold = Math.max(skillValue, 1)

    // Check if weapon is gatling (uses 10 ammo per shot)
    const isGatling = (weaponObj.QUALITIES || []).includes('qualityGatling')
    const ammoPerShot = isGatling ? 10 : 1

    // Get ammo count
    const getAmmoCount = () => {
        if (weaponObj.AMMO_TYPE === 'na') return '-'
        if (weaponObj.AMMO_TYPE === 'self') return characterItem.quantity
        
        // Find ammo in character items
        const ammoItem = character.items?.find(item => item.id === weaponObj.AMMO_TYPE)
        return ammoItem ? ammoItem.quantity : 0
    }

    // Check if weapon has enough ammo to attack
    const hasEnoughAmmo = () => {
        if (weaponObj.AMMO_TYPE === 'na') return true // Melee weapons don't need ammo
        
        const currentAmmo = getAmmoCount()
        if (typeof currentAmmo === 'string') return false // '-' case
        
        return currentAmmo >= ammoPerShot
    }

    return (
        <section>
            <div className="row l-spaceBetween">
                <section>
                    <div className="card-stat">
                        <div className="js-cardWeapon-skill">{t(weaponObj.TYPE)}</div>
                        <div className="row l-centered">
                            <span>{t('target')}:</span>
                            <span className="js-cardWeapon-target">{targetNumber}</span>
                        </div>
                        <div className="row l-centered">
                            <span>{t('crit')}:</span>
                            <span className="js-cardWeapon-crit">{critThreshold}</span>
                        </div>
                    </div>
                    <div className="card-stat">
                        <div className="js-cardWeapon-ammoType">
                            {t(weaponObj.AMMO_TYPE === 'self' ? 'quantity' : weaponObj.AMMO_TYPE)}
                        </div>
                        <div 
                            className="js-cardWeapon-ammoCount"
                            style={{ 
                                color: hasEnoughAmmo() ? 'var(--primary-color)' : 'var(--failure-color)' 
                            }}
                        >
                            {getAmmoCount()}
                            {weaponObj.AMMO_TYPE !== 'na' && ammoPerShot > 1 && (
                                <span style={{ fontSize: '0.8em', opacity: 0.8 }}>
                                    {' '}(-{ammoPerShot})
                                </span>
                            )}
                        </div>
                    </div>
                </section>

                <div className="card-weapon-image themed-svg" data-icon={weaponObj.TYPE}></div>

                <section>
                    <div className="card-stat">
                        <div>{t('damageLabel')}</div>
                        <div className="js-cardWeapon-damageRating">{weaponObj.DAMAGE_RATING}</div>
                        <div className="js-cardWeapon-damageType">{t(weaponObj.DAMAGE_TYPE)}</div>
                    </div>
                    <div className="card-stat">
                        <div>{t('fireRateLabel')}</div>
                        <div className="js-cardWeapon-fireRate">{weaponObj.FIRE_RATE}</div>
                    </div>
                    <div className="card-stat">
                        <div>{t('rangeLabel')}</div>
                        <div className="js-cardWeapon-range">{t(`${weaponObj.RANGE}Full`)}</div>
                    </div>
                </section>
            </div>

            {/* Tags container for effects and qualities */}
            <div className="tags-container">
                {weaponObj.EFFECTS?.map((effect, index) => {
                    const [langId, effectOpt] = effect.split(' ')
                    return (
                        <Tag key={`effect-${index}`} tooltipId={`${langId}Description`}>
                            {t(langId) + (effectOpt ? ' ' + t(effectOpt) : '')}
                        </Tag>
                    )
                })}

                {weaponObj.QUALITIES?.map((quality, index) => {
                    const [langId, qualityOpt] = quality.split(' ')
                    return (
                        <Tag key={`quality-${index}`} tooltipId={`${langId}Description`} isEmpty={true}>
                            {t(langId) + (qualityOpt ? ' ' + t(qualityOpt) : '')}
                        </Tag>
                    )
                })}
            </div>
        </section>
    )
}

export default WeaponContent
