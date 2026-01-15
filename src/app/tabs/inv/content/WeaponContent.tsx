import Tag from '@/components/Tag.tsx'
import { useCharacter } from '@/contexts/CharacterContext.tsx'
import { useTranslation } from 'react-i18next'
import { getWeaponAmmoCount, getWeaponAmmoPerShot, hasEnoughAmmo, calculateWeaponStats } from '@/utils/weaponUtils.ts'
import {useGameDatabase} from "@/hooks/useGameDatabase.ts";

/**
 * Weapon-specific content renderer
 * Displays weapon stats, ammo info, and effect/quality tags
 */
function WeaponContent({ characterItem }) {
    const { t } = useTranslation()
    const { character } = useCharacter()

    const dataManager = useGameDatabase()
    const weaponObj = dataManager.getItem(characterItem.id)

    // Calculate weapon stats using utility
    const { skillValue, targetNumber } = calculateWeaponStats(
        character,
        weaponObj
    )
    const critThreshold = Math.max(skillValue, 1)

    // Use weapon utilities
    const ammoPerShot = getWeaponAmmoPerShot(weaponObj)
    const getAmmoCount = () => getWeaponAmmoCount(weaponObj, character)
    const checkHasEnoughAmmo = () => hasEnoughAmmo(weaponObj, character)

    return (
        <section>
            <div className="row l-spaceBetween">
                <section>
                    <div className="card-stat">
                        <div className="js-cardWeapon-skill">{t(weaponObj.CATEGORY)}</div>
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
                                color: checkHasEnoughAmmo() ? 'var(--primary-color)' : 'var(--failure-color)'
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

                <div className="card-weapon-image themed-svg" data-icon={weaponObj.CATEGORY}></div>

                <section>
                    <div className="card-stat">
                        <div>{t('damageLabel')}</div>
                        <div className="js-cardWeapon-damageRating">{weaponObj.DAMAGE_RATING}d6</div>
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
                    const [langId, effectOpt] = effect.split(':')
                    return (
                        <Tag key={`effect-${index}`} tooltipId={`${langId}Description`}>
                            {t(langId) + (effectOpt ? ' ' + effectOpt : '')}
                        </Tag>
                    )
                })}

                {weaponObj.QUALITIES?.map((quality, index) => {
                    const [langId, qualityOpt] = quality.split(':')
                    return (
                        <Tag key={`quality-${index}`} tooltipId={`${langId}Description`} isEmpty={true}>
                            {t(langId) + (qualityOpt ? ' ' + qualityOpt : '')}
                        </Tag>
                    )
                })}
            </div>
        </section>
    )
}

export default WeaponContent
