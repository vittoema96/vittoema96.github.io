import React from 'react'
import { useI18n } from '../../../hooks/useI18n.js'
import Tag from '../../common/Tag.jsx'

/**
 * Apparel-specific content renderer
 * Displays armor stats and protection areas
 */
function ApparelContent({ characterItem, itemData, side }) {
    const t = useI18n()

    const apparelObj = itemData

    return (
        <section>
            <div className="row l-spaceBetween">
                <section>
                    <div className="card-stat">
                        <div>{t('damageReduction')}</div>
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
                            <span className="js-cardApparel-radiation">{apparelObj.RADIATION_RES}</span>
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

            {/* Tags container for effects and qualities */}
            <div className="tags-container">
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

                {Array.isArray(apparelObj.QUALITIES) && apparelObj.QUALITIES.map((quality, index) => {
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

export default ApparelContent
