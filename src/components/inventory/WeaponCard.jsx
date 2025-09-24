import React, { useState } from 'react'
import ItemCard from './ItemCard.jsx'
import { useCharacterData } from '../../hooks/useCharacterData.js'
import { useI18n } from '../../hooks/useI18n.js'
import { SKILL_TO_SPECIAL_MAP } from '../../js/constants.js'

/**
 * Weapon card component with weapon-specific stats and actions
 */
function WeaponCard({ characterItem, itemData, dataManager, onAttack }) {
    const { character } = useCharacterData()
    const t = useI18n()
    const [showTooltip, setShowTooltip] = useState(null)
    const [showDescription, setShowDescription] = useState(false)

    if (!itemData) {
        console.error(`Weapon data not found for ID: ${characterItem.id}`)
        return null
    }

    const weaponObj = itemData

    // Calculate weapon stats
    const skillValue = character.skills[weaponObj.TYPE] || 0
    const specialValue = character.special[SKILL_TO_SPECIAL_MAP[weaponObj.TYPE]] || 5
    const targetNumber = skillValue + specialValue
    const critThreshold = Math.max(skillValue, 1)

    // Get ammo count
    const getAmmoCount = () => {
        if (weaponObj.AMMO_TYPE === 'na') return '-'
        if (weaponObj.AMMO_TYPE === 'self') return characterItem.quantity
        
        // Find ammo in character items
        const ammoItem = character.items?.find(item => item.id === weaponObj.AMMO_TYPE)
        return ammoItem ? ammoItem.quantity : 0
    }

    const handleAttack = () => {
        if (onAttack) {
            onAttack(characterItem, weaponObj)
        } else {
            // Open D20 popup for weapon attack
            if (window.openD20Popup) {
                window.openD20Popup(weaponObj.TYPE, weaponObj.ID)
            }
        }
    }

    const handleTagClick = (tagId) => {
        setShowTooltip(showTooltip === tagId ? null : tagId)
    }

    const weaponContent = (
        <section>
            <div className="row l-spaceBetween">
                <section>
                    <div className="card-stat">
                        <div className="js-cardWeapon-skill">{t(weaponObj.TYPE)}</div>
                        <div className="row l-centered">
                            <span>{t('targetLabel')}</span>
                            <span className="js-cardWeapon-target">{targetNumber}</span>
                        </div>
                        <div className="row l-centered">
                            <span>{t('critLabel')}</span>
                            <span className="js-cardWeapon-crit">{critThreshold}</span>
                        </div>
                    </div>
                    <div className="card-stat">
                        <div className="js-cardWeapon-ammoType">
                            {t(weaponObj.AMMO_TYPE === 'self' ? 'quantity' : weaponObj.AMMO_TYPE)}
                        </div>
                        <div className="js-cardWeapon-ammoCount">{getAmmoCount()}</div>
                    </div>
                </section>
                
                <div className="js-cardWeapon-image themed-svg" data-icon={weaponObj.TYPE}></div>
                
                <section>
                    <div className="card-stat">
                        <div>{t('damageLabel')}</div>
                        <div className="js-cardWeapon-damageRating">{weaponObj.DAMAGE_RATING}</div>
                    </div>
                    <div className="card-stat">
                        <div>{t('damageTypeLabel')}</div>
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

            {/* Tags for effects and qualities */}
            <div className="tags-container" style={{ position: 'relative' }}>
                {weaponObj.EFFECTS?.map((effect, index) => {
                    const effectId = `effect-${index}`
                    return (
                        <span
                            key={effectId}
                            className="tag"
                            onClick={() => handleTagClick(effectId)}
                            style={{ cursor: 'pointer' }}
                        >
                            {t(effect)}
                        </span>
                    )
                })}
                {weaponObj.QUALITIES?.map((quality, index) => {
                    const qualityId = `quality-${index}`
                    return (
                        <span
                            key={qualityId}
                            className="tag tag-empty"
                            onClick={() => handleTagClick(qualityId)}
                            style={{ cursor: 'pointer' }}
                        >
                            {t(quality)}
                        </span>
                    )
                })}

                {/* Tooltip popup */}
                {showTooltip && (
                    <div
                        className="tag-tooltip"
                        style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: 'var(--secondary-color)',
                            color: 'var(--primary-color)',
                            border: 'var(--border-primary-thin)',
                            borderRadius: '4px',
                            padding: '0.5rem',
                            fontSize: '0.8rem',
                            maxWidth: '200px',
                            zIndex: 1000,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}
                        onClick={() => setShowTooltip(null)}
                    >
                        {showTooltip.startsWith('effect-') ? (
                            <span>{t(`${weaponObj.EFFECTS[parseInt(showTooltip.split('-')[1])].split(' ')[0]}Description`)}</span>
                        ) : (
                            <span>{t(`${weaponObj.QUALITIES[parseInt(showTooltip.split('-')[1])].split(' ')[0]}Description`)}</span>
                        )}
                    </div>
                )}
            </div>

            {/* Weapon Controls - Attack Button + Show Description */}
            <div className="row card-controls">
                <input
                    type="checkbox"
                    className="themed-svg button-card"
                    data-icon="attack"
                    checked={true}
                    onChange={handleAttack}
                />
                <button
                    className="description-toggle-button"
                    onClick={() => setShowDescription(prev => !prev)}
                >
                    {t('showDescription')}
                </button>
            </div>

            {/* Description Container */}
            <div className={`description-container ${showDescription ? 'expanded' : ''}`}>
                <div className="description">
                    <p>{itemData.DESCRIPTION?.split('. ').map(sentence => `${sentence}${sentence.endsWith('.') ? '' : '.'}`).join(' ')}</p>
                </div>
            </div>
        </section>
    )

    return (
        <ItemCard
            characterItem={characterItem}
            itemData={itemData}
            onAction={null}
            actionIcon="attack"
            actionType="attack"
            isEquipped={false}
            hideControls={true} // Hide default controls, we handle them in weaponContent
        >
            {weaponContent}
        </ItemCard>
    )
}

export default WeaponCard
