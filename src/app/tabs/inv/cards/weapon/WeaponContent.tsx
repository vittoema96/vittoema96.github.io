import Tag from '@/app/components/Tag.tsx'
import { useTranslation } from 'react-i18next'
import { CharacterItem } from '@/types';
import React from 'react';
import { Icon } from '@iconify/react';
import { useWeaponStats } from '@/features/character/hooks/useWeaponStats.ts';

/** Returns signed number */
const formatSignedNumber = (val: number): string => {
    return val > 0 ? `+${val}` : `${val}`;
};

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

    const weaponStats = useWeaponStats(characterItem)
    if (!weaponStats) {
        return null;
    }

    const {
        itemData,
        targetNumber,
        critThreshold,
        damageBonus,
        fireRateBonus,
        ammoCount,
        hasAmmo,
        ammoPerShot,
        legendaryMods
    } = weaponStats;


    const damageDisplay = damageBonus !== 0
        ? `(${itemData.DAMAGE_RATING}${formatSignedNumber(damageBonus)})`
        : `${itemData.DAMAGE_RATING}`;

    const fireRateDisplay = fireRateBonus !== 0
        ? `(${itemData.FIRE_RATE}${formatSignedNumber(fireRateBonus)})`
        : `${itemData.FIRE_RATE}`;

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
                        <Icon
                                icon="mdi:ammunition"
                                className="card-stat-compact__iconify"
                        />
                        <div className="card-stat-compact__values">
                            {itemData.AMMO_TYPE !== 'na' && (
                                <div style={{ fontSize: '0.65em', opacity: 0.8 }}>
                                    {t(itemData.AMMO_TYPE === 'self' ? 'quantity' : itemData.AMMO_TYPE)}
                                </div>
                            )}
                            <div
                                className="card-stat-compact__value"
                                style={{
                                    color: hasAmmo ? 'var(--primary-color)' : 'var(--failure-color)'
                                }}
                            >
                                {itemData.AMMO_TYPE === 'na' ? '-' : ammoCount}
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
                            <div>{damageDisplay}d6</div>
                            <div style={{ fontSize: '0.7em' }}>{itemData.DAMAGE_TYPES.map(dt => t(dt)).join(', ')}</div> {/* TODO check the formatting when multiple */}
                        </div>
                    </div>
                    <div className="card-stat-compact">
                        <div className="card-stat-compact__icon-group" title={t('fireRate')}>
                            <Icon icon="mdi:bullet" className="card-stat-compact__iconify card-stat-compact__iconify--group" />
                            <i className="fas fa-plus"></i>
                        </div>
                        <div className="card-stat-compact__value">{fireRateDisplay}</div>
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
            {(itemData.EFFECTS.length > 0 || itemData.QUALITIES.length > 0 || legendaryMods.length > 0) && <>
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
                        const [qualityType, qualityOpt] = effect.split(':')
                        const textParts = [t(qualityType!)]
                        if(qualityOpt){
                            textParts.push(t(qualityOpt))
                        }
                        return (
                            <Tag key={effect}
                                 isEmpty={true}
                                 tooltipId={`${qualityType}Description`}>
                                {textParts.join(' ')}
                            </Tag>
                        );
                    })}

                    {legendaryMods.map(effect => {
                        return (
                            <Tag key={effect}
                                 tooltipId={`${effect}Description`}
                                 color={'var(--warning-color)'}
                                 >
                                {t(effect)}
                            </Tag>
                        );
                    })}
                </div>
            </>}
        </>
    )
}

export default WeaponContent
