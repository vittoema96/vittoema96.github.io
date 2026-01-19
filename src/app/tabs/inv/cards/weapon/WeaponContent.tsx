import Tag from '@/components/Tag.tsx'
import { useCharacter } from '@/contexts/CharacterContext.tsx'
import { useTranslation } from 'react-i18next'
import { getWeaponAmmoCount, getWeaponAmmoPerShot, hasEnoughAmmo } from '@/app/tabs/inv/utils/weaponUtils.ts'
import {getGameDatabase, getModifiedItemData } from "@/hooks/getGameDatabase.ts";
import { CharacterItem } from '@/types';
import { SKILL_TO_SPECIAL_MAP } from '@/utils/characterSheet.ts';

/**
 * Weapon-specific content renderer
 * Displays weapon stats, ammo info, and effect/quality tags
 */
interface WeaponContentProps {
    characterItem: CharacterItem
}
function WeaponContent({ characterItem }: Readonly<WeaponContentProps>) {
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

    return (
        <section>
            <div className="row l-spaceBetween">
                <section>
                    <div className="card-stat">
                        <div className="js-cardWeapon-skill">{t(itemData.CATEGORY)}</div>
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
                            {/*TODO check this. may not be relevant anymore */}
                            {t(itemData.AMMO_TYPE === 'self' ? 'quantity' : itemData.AMMO_TYPE)}
                        </div>
                        <div
                            className="js-cardWeapon-ammoCount"
                            style={{
                                color: checkHasEnoughAmmo() ? 'var(--primary-color)' : 'var(--failure-color)'
                            }}
                        >
                            {getAmmoCount()}
                            {/*TODO check this. may not be relevant anymore */}
                            {itemData.AMMO_TYPE !== 'na' && ammoPerShot > 1 && (
                                <span style={{ fontSize: '0.8em', opacity: 0.8 }}>
                                    {' '}(-{ammoPerShot})
                                </span>
                            )}
                        </div>
                    </div>
                </section>

                <div className="card-weapon-image themed-svg" data-icon={itemData.CATEGORY}></div>

                <section>
                    <div className="card-stat">
                        <div>{t('damageLabel')}</div>
                        <div className="js-cardWeapon-damageRating">{itemData.DAMAGE_RATING}d6</div>
                        <div className="js-cardWeapon-damageType">{t(itemData.DAMAGE_TYPE)}</div>
                    </div>
                    <div className="card-stat">
                        <div>{t('fireRateLabel')}</div>
                        <div className="js-cardWeapon-fireRate">{itemData.FIRE_RATE}</div>
                    </div>
                    <div className="card-stat">
                        <div>{t('rangeLabel')}</div>
                        <div className="js-cardWeapon-range">{t(`${itemData.RANGE}Full`)}</div>
                    </div>
                </section>
            </div>

            {/* Tags container for effects and qualities */}
            <div className="tags-container">
                {/* Intrinsic EFFECTS (from base item) */}
                {itemData.EFFECTS?.map((effect) => {
                    const [effectType, effectOpt] = effect.split(':');
                    // If it's a number, keep it as is. If it's a string, try to translate it.
                    let displayValue = t(effectOpt!) // undefined or number = itself, translatable gets translated
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
                    // If it's a number, keep it as is. If it's a string, try to translate it.
                    let displayValue = t(qualityOpt!) // undefined or number = itself, translatable gets translated
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

                {/* MOD_NAMES (names of applied mods) */}
                {/* TODO mod names not cool here, but could be added somewhere
                characterItem.mods.map((modId) => {
                    return (
                        <Tag
                            key={modId}
                            tooltipId={`${modId}Description`}
                            isMod={true}
                        >
                            {t(modId)}
                        </Tag>
                    );
                }) */}
            </div>
        </section>
    )
}

export default WeaponContent
