import Tag from '@/components/Tag.tsx'
import { useCharacter } from '@/contexts/CharacterContext.tsx'
import { useTranslation } from 'react-i18next'
import { getWeaponAmmoCount, getWeaponAmmoPerShot, hasEnoughAmmo } from '@/app/tabs/inv/utils/weaponUtils.ts'
import {getGameDatabase, getModifiedItemData } from "@/hooks/getGameDatabase.ts";
import { CharacterItem } from '@/types';
import { SKILL_TO_SPECIAL_MAP } from '@/utils/characterSheet.ts';
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
    const targetNumber = character.special[SKILL_TO_SPECIAL_MAP[itemData.CATEGORY]] + skillValue

    const critThreshold = character.specialties.includes(itemData.CATEGORY) ? Math.max(skillValue, 1) : 1

    // Use weapon utilities
    const ammoPerShot = getWeaponAmmoPerShot(itemData)
    const getAmmoCount = () => getWeaponAmmoCount(itemData, character)
    const checkHasEnoughAmmo = () => hasEnoughAmmo(itemData, character)


    let damageRating = `${itemData.DAMAGE_RATING}`
    const damageBonus = itemData.CATEGORY === 'energyWeapons' ? character.perks.filter(p => p === 'perkLaserCommander').length : 0
    if(damageBonus > 0){
        damageRating = `(${damageRating}+${damageBonus})`
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
                        <i className="fas fa-burst" title={t('damageLabel')}></i>
                        <div className="card-stat-compact__values">
                            <div>{damageRating}d6</div>
                            <div style={{ fontSize: '0.7em' }}>{t(itemData.DAMAGE_TYPE)}</div>
                        </div>
                    </div>
                    <div className="card-stat-compact">
                        <div className="card-stat-compact__icon-group" title={t('fireRateLabel')}>
                            <i className="mdi mdi-bullet"></i>
                            <i className="fas fa-plus"></i>
                        </div>
                        <div className="card-stat-compact__value">{itemData.FIRE_RATE}</div>
                    </div>
                    <div className="card-stat-compact">
                        <i className="fas fa-arrows-left-right" title={t('rangeLabel')}></i>
                        <div className="card-stat-compact__value">{t(`${itemData.RANGE}Full`)}</div>
                    </div>
                </div>

                {/* Column 4 - Action Buttons */}
                {actionButtons}
            </div>

            {/* Tags container for effects and qualities - Compact */}
            {(itemData.EFFECTS?.length > 0 || itemData.QUALITIES?.length > 0) && (
                <div className="tags-container tags-container--compact">
                    {/* Intrinsic EFFECTS (from base item) */}
                    {itemData.EFFECTS?.map((effect) => {
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

                    {itemData.QUALITIES?.map((effect) => {
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
            )}
        </>
    )
}

export default WeaponContent
