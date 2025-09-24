import React from 'react'
import ItemCard from './ItemCard.jsx'
import { useI18n } from '../../hooks/useI18n.js'

/**
 * Apparel card component with armor stats and equip functionality
 */
function ApparelCard({ characterItem, itemData, onEquip }) {
    const t = useI18n()

    if (!itemData) {
        console.error(`Apparel data not found for ID: ${characterItem.id}`)
        return null
    }

    const [apparelId, side] = characterItem.id.split('_')
    const apparelObj = itemData

    const handleEquip = () => {
        if (onEquip) {
            onEquip(characterItem, apparelObj)
        } else {
            // TODO: Implement equip functionality
            console.log('Equip apparel:', characterItem.id)
        }
    }

    const apparelContent = (
        <section>
            <div className="row l-spaceBetween">
                <section>
                    <div className="card-stat">
                        <div>{t('damageReduction')}</div>
                        <div className="row l-centered">
                            <span>{t('physicalLabel')}</span>
                            <span className="js-cardApparel-physical">{apparelObj.PHYSICAL_RES}</span>
                        </div>
                        <div className="row l-centered">
                            <span>{t('energyLabel')}</span>
                            <span className="js-cardApparel-energy">{apparelObj.ENERGY_RES}</span>
                        </div>
                        <div className="row l-centered">
                            <span>{t('radiationLabel')}</span>
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

    return (
        <ItemCard
            characterItem={characterItem}
            itemData={itemData}
            onAction={handleEquip}
            actionIcon="armor"
            actionType="equip"
            isEquipped={characterItem.equipped === true}
        >
            {apparelContent}
        </ItemCard>
    )
}

export default ApparelCard
