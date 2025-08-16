import React from 'react'
import { useI18n } from '../../../hooks/useI18n.js'

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

            {/* Tags container for future effects/qualities */}
            <div className="tags-container">
                {/* TODO: Add apparel effects/qualities if they exist */}
            </div>
        </section>
    )
}

export default ApparelContent
