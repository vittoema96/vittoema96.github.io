import React from 'react'
import { t } from 'i18next'
import Tag from '../../common/Tag.jsx'

/**
 * Apparel-specific content renderer
 * Displays armor stats and protection areas
 */
function ApparelContent({ characterItem, itemData, side }) {

    const apparelObj = itemData
    const isRobotPart = characterItem?.type === 'robotParts'

    return (
        <section>
            <div className="row l-spaceBetween">
                <section>
                    <div className="card-stat">
                        <div>{t('damageReductionFull')}</div>
                        <div className="row l-centered">
                            <span>{t('physical')}:</span>
                            <span className="js-cardApparel-physical">{apparelObj.PHYSICAL_RES}</span>
                        </div>
                        <div className="row l-centered">
                            <span>{t('energy')}:</span>
                            <span className="js-cardApparel-energy">{apparelObj.ENERGY_RES}</span>
                        </div>
                        <div className="row l-centered">
                            <span>{t('radiation')}:</span>
                            <span className="js-cardApparel-radiation">
                                {isRobotPart ? t('immune') : apparelObj.RADIATION_RES}
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
                        {apparelObj.LOCATIONS_COVERED?.map((location, index) => {
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
                {Array.isArray(apparelObj.EFFECTS) && apparelObj.EFFECTS.map((effect, index) => {
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
                {Array.isArray(apparelObj.QUALITIES) && apparelObj.QUALITIES.map((quality, index) => {
                    const [langId, qualityOpt] = quality.split(':')
                    return (
                        <Tag key={`quality-${index}`} tooltipId={`${langId}Description`} isEmpty={true}>
                            {t(langId) + (qualityOpt ? ' ' + qualityOpt : '')}
                        </Tag>
                    )
                })}

                {/* MOD_NAMES (names of applied mods) */}
                {Array.isArray(apparelObj.MOD_NAMES) && apparelObj.MOD_NAMES.map((modId, index) => {
                    return (
                        <Tag key={`mod-name-${index}`} tooltipId={`${modId}Description`} isMod={true}>
                            {t(modId)}
                        </Tag>
                    )
                })}

                {/* MOD_EFFECTS (effects added by mods via effectAdd/qualityAdd) */}
                {Array.isArray(apparelObj.MOD_EFFECTS) && apparelObj.MOD_EFFECTS.map((effect, index) => {
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
