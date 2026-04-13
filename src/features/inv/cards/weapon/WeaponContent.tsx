import Tag from '@/components/Tag.tsx'
import { useCharacter } from '@/contexts/CharacterContext.tsx'
import { useTranslation } from 'react-i18next'
import { getWeaponAmmoCount, getWeaponAmmoPerShot, hasEnoughAmmo } from '@/features/inv/utils/weaponUtils.ts'
import {getGameDatabase, getModifiedItemData } from "@/hooks/getGameDatabase.ts";
import { CharacterItem } from '@/types';
import { getSpecialFromSkill } from '@/services/character/utils.ts';
import React from 'react';

/**
 * Weapon-specific content renderer
 * Displays weapon stats, ammo info, and effect/quality tags
 */
interface WeaponContentProps {
    characterItem: CharacterItem
    actionButtons?: React.ReactNode
}
function WeaponContent({ characterItem, actionButtons }: Readonly<WeaponContentProps>) {
    const { t } = useTranslation()
    const { character } = useCharacter()

    const dataManager = getGameDatabase()
    const itemData = getModifiedItemData(characterItem)

    if (!dataManager.isType(itemData, 'weapon')) {
        console.error(`Weapon data not found for ID: ${characterItem.id}`)
        return null;
    }

    const skillValue = character.skills[itemData.CATEGORY]
    const targetNumber = character.special[getSpecialFromSkill(itemData.CATEGORY)] + skillValue

    const critThreshold = character.specialties.includes(itemData.CATEGORY) ? Math.max(skillValue, 1) : 1

    // Use weapon utilities
    const ammoPerShot = getWeaponAmmoPerShot(itemData)
    const getAmmoCount = () => getWeaponAmmoCount(itemData, character)
    const checkHasEnoughAmmo = () => hasEnoughAmmo(itemData, character)

    // TODO should unify logic with D6Popup
    let damageRating = `${itemData.DAMAGE_RATING}`
    const laserCommanderBonus = itemData.CATEGORY === 'energyWeapons' ? character.perks.filter(p => p === 'perkLaserCommander').length : 0
    const gruntBonus = [
        'weaponCombatRifle', 'weaponAssaultRifle',
        'weaponFragmentationGrenade', 'weaponCombatKnife',
        // TODO all these machine gun types? it says generically "machine guns"
        'weaponMachineGun', 'weaponLightMachineGun', 'weapon50caMachineGun'
    ].includes(itemData.ID) && character.traits.includes("traitGrunt") ? 1 : 0
    if(laserCommanderBonus+gruntBonus > 0){
        damageRating = `(${damageRating}+${laserCommanderBonus+gruntBonus})`
    }

    let fireRate = `${itemData.FIRE_RATE}`
    if(
        character.traits.includes("traitTriggerDiscipline")
        && ['smallGuns', 'energyWeapons'].includes(itemData.CATEGORY)
        && Number(itemData.FIRE_RATE) > 0
    ) {
        fireRate = `(${fireRate}-1)`
    }

    return (
        <>
            <div className="card-weapon-stats card-weapon-stats--4col">
                {/* Column 1 - Skill & Ammo */}
                <div className="card-weapon-stats__column">
                    <div className="card-stat-compact">
                        <i className="fas fa-bullseye" title={t(itemData.CATEGORY)}></i>
                        <div className="card-stat-compact__values">
                            <div style={{ fontSize: '0.65em', opacity: 0.8 }}>
                                {t(itemData.CATEGORY)}
                            </div>
                            <div title={t('target')}>
                                <i className="fas fa-crosshairs"></i> {targetNumber}
                            </div>
                            <div title={t('crit')}>
                                <i className="fas fa-location-crosshairs"></i> {critThreshold}
                            </div>
                        </div>
                    </div>
                    <div className="card-stat-compact">
                        <i className="mdi mdi-ammunition" title={t(itemData.AMMO_TYPE === 'self' ? 'quantity' : itemData.AMMO_TYPE)}></i>
                        <div className="card-stat-compact__values">
                            {itemData.AMMO_TYPE !== 'na' && (
                                <div style={{ fontSize: '0.65em', opacity: 0.8 }}>
                                    {t(itemData.AMMO_TYPE === 'self' ? 'quantity' : itemData.AMMO_TYPE)}
                                </div>
                            )}
                            <div
                                className="card-stat-compact__value"
                                style={{
                                    color: checkHasEnoughAmmo() ? 'var(--primary-color)' : 'var(--failure-color)'
                                }}
                            >
                                {itemData.AMMO_TYPE === 'na' ? '-' : getAmmoCount()}
                                {itemData.AMMO_TYPE !== 'na' && ammoPerShot > 1 && (
                                    <span style={{ fontSize: '0.7em', opacity: 0.7 }}>
                                        {' '}(-{ammoPerShot})
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 2 - Weapon Icon */}
                <div className="card-weapon-image--compact themed-svg" data-icon={itemData.CATEGORY}></div>

                {/* Column 3 - Damage, Fire Rate, Range */}
                <div className="card-weapon-stats__column">
                    <div className="card-stat-compact">
                        <i className="fas fa-burst" title={t('damage')}></i>
                        <div className="card-stat-compact__values">
                            <div>{damageRating}d6</div>
                            <div style={{ fontSize: '0.7em' }}>{itemData.DAMAGE_TYPES.map(dt => t(dt)).join(', ')}</div> {/* TODO check the formatting when multiple */}
                        </div>
                    </div>
                    <div className="card-stat-compact">
                        <div className="card-stat-compact__icon-group" title={t('fireRate')}>
                            <i className="mdi mdi-bullet"></i>
                            <i className="fas fa-plus"></i>
                        </div>
                        <div className="card-stat-compact__value">{fireRate}</div>
                    </div>
                    <div className="card-stat-compact">
                        <i className="fas fa-arrows-left-right" title={t('range')}></i>
                        <div className="card-stat-compact__values">
                            <div>{t(`${itemData.RANGE}Full`)}</div>
                            <div style={{ fontSize: '0.7em' }}>
                                {itemData.RANGE === 'rangeR' && '1 sq'}
                                {itemData.RANGE === 'rangeC' && '1-6 sq'}
                                {itemData.RANGE === 'rangeM' && '7-12 sq'}
                                {itemData.RANGE === 'rangeL' && '13-20 sq'}
                                {itemData.RANGE === 'rangeE' && '21+ sq'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 4 - Action Buttons */}
                {actionButtons}
            </div>

            {/* Tags container for effects and qualities - Compact */}
            {(itemData.EFFECTS.length > 0 || itemData.QUALITIES.length > 0) && <>
                <hr/>
                <div className="tags-container">
                    {/* Intrinsic EFFECTS (from base item) */}
                    {itemData.EFFECTS.map((effect) => {
                        const [effectType, effectOpt] = effect.split(':');
                        let displayValue = t(effectOpt!)
                        if (displayValue) {
                            displayValue = ` ${displayValue}`;
                        }
                        const displayText = `${t(effectType!)}${displayValue}`;
                        return (
                            <Tag key={effect} tooltipId={`${effectType}Description`}>
                                {displayText}
                            </Tag>
                        );
                    })}

                    {itemData.QUALITIES.map((effect) => {
                        const [qualityType, qualityOpt] = effect.split(':');
                        let displayValue = t(qualityOpt!)
                        if (displayValue) {
                            displayValue = ` ${displayValue}`;
                        }
                        const displayText = `${t(qualityType!)}${displayValue}`;
                        return (
                            <Tag key={effect}
                                 isEmpty={true}
                                 tooltipId={`${qualityType}Description`}>
                                {displayText}
                            </Tag>
                        );
                    })}
                </div>
            </>}
        </>
    )
}

export default WeaponContent
