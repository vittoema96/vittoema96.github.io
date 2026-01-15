import { useTranslation } from 'react-i18next'
import Tag from '@/components/Tag'
import {getGameDatabase} from "@/hooks/getGameDatabase";

/**
 * Apparel-specific content renderer
 * Displays armor stats and protection areas
 */
function ApparelContent({ characterItem, side }) {
    const { t } = useTranslation()

    const dataManager = getGameDatabase()
    const itemData = dataManager.getItem(characterItem.id)
    if(!dataManager.isType(itemData, "apparel")) { return null }

    const isRobotPart = itemData.CATEGORY === 'robotPart'

    return (
        <section>
            <div className="row l-spaceBetween">
                <section>
                    <div className="card-stat">
                        <div>{t('damageReductionFull')}</div>
                        <div className="row l-centered">
                            <span>{t('physical')}:</span>
                            <span className="js-cardApparel-physical">{itemData.PHYSICAL_RES}</span>
                        </div>
                        <div className="row l-centered">
                            <span>{t('energy')}:</span>
                            <span className="js-cardApparel-energy">{itemData.ENERGY_RES}</span>
                        </div>
                        <div className="row l-centered">
                            <span>{t('radiation')}:</span>
                            <span className="js-cardApparel-radiation">
                                {isRobotPart ? t('immune') : itemData.RADIATION_RES}
                            </span>
                        </div>
                    </div>
                </section>

                <div
                    className="themed-svg js-cardApparel-image"
                    style={{
                        textAlign: 'center',
                        padding: '2rem 0.5rem',
                        color: 'var(--secondary-color)'
                    }}
                >
                    Work In Progress
                </div>

                <section>
                    <div className="card-stat js-cardApparel-protects">
                        <div>{t('protects')}</div>
                        {itemData.LOCATIONS_COVERED?.map((location, index) => {
                            let locationText = t(location)

                            // Handle side variations for arms and legs
                            if ((location === 'arm' || location === 'leg') && side) {
                                locationText = t(location, { side: ` (${t(side)})` })
                            }

                            return (
                                <div key={index}>
                                    {locationText}
                                </div>
                            )
                        })}
                    </div>
                </section>
            </div>

            {/* Tags container for effects, qualities, and mod effects */}
            <div className="tags-container">
                {/* Intrinsic EFFECTS (from base item) */}
                {Array.isArray(itemData.EFFECTS) && itemData.EFFECTS.map((effect, index) => {
                    const [langId, effectOpt] = effect.split(':')
                    // For special effects, try to translate the value (e.g., "strAgi" -> "FOR o AGI")
                    // If it's a number, keep it as is. If it's a string, try to translate it.
                    let displayValue = effectOpt
                    if (effectOpt && isNaN(effectOpt)) {
                        // Try to translate as "special<Value>" (e.g., "specialStrAgi")
                        const specialKey = `special${effectOpt.charAt(0).toUpperCase() + effectOpt.slice(1)}`
                        const translated = t(specialKey)
                        // Only use translation if it's different from the key (meaning it was found)
                        displayValue = translated !== specialKey ? translated : effectOpt
                    }
                    return (
                        <Tag key={`effect-${index}`} tooltipId={`${langId}Description`}>
                            {t(langId) + (displayValue ? ' ' + displayValue : '')}
                        </Tag>
                    )
                })}

                {/* QUALITIES (from base item) */}
                {Array.isArray(itemData.QUALITIES) && itemData.QUALITIES.map((quality, index) => {
                    const [langId, qualityOpt] = quality.split(':')
                    return (
                        <Tag key={`quality-${index}`} tooltipId={`${langId}Description`} isEmpty={true}>
                            {t(langId) + (qualityOpt ? ' ' + qualityOpt : '')}
                        </Tag>
                    )
                })}

                {/* MOD_NAMES (names of applied mods) */}
                {Array.isArray(itemData.MOD_NAMES) && itemData.MOD_NAMES.map((modId, index) => {
                    return (
                        <Tag key={`mod-name-${index}`} tooltipId={`${modId}Description`} isMod={true}>
                            {t(modId)}
                        </Tag>
                    )
                })}

                {/* MOD_EFFECTS (effects added by mods via effectAdd/qualityAdd) */}
                {Array.isArray(itemData.MOD_EFFECTS) && itemData.MOD_EFFECTS.map((effect, index) => {
                    const [langId, effectOpt] = effect.split(':')
                    return (
                        <Tag key={`mod-effect-${index}`} tooltipId={`${langId}Description`} isMod={true}>
                            {t(langId) + (effectOpt ? ' ' + effectOpt : '')}
                        </Tag>
                    )
                })}
            </div>
        </section>
    )
}

export default ApparelContent
