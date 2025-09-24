import React from 'react'
import ItemCard from './ItemCard.jsx'
import { useI18n } from '../../hooks/useI18n.js'

/**
 * Aid card component for consumable items (food, drinks, meds)
 */
function AidCard({ characterItem, itemData, onConsume }) {
    const t = useI18n()

    if (!itemData) {
        console.error(`Aid data not found for ID: ${characterItem.id}`)
        return null
    }

    const aidObj = itemData
    const type = characterItem.type

    const handleConsume = () => {
        if (onConsume) {
            onConsume(characterItem, aidObj)
        } else {
            // TODO: Implement consume functionality
            console.log('Consume aid:', characterItem.id)
        }
    }

    // Determine specific effect stats
    const getSpecificEffectStat = () => {
        if (aidObj.HP_GAIN !== undefined) {
            return {
                label: 'HP',
                value: `+${aidObj.HP_GAIN}`,
                key: 'HP_GAIN'
            }
        }
        if (aidObj.DURATION !== undefined) {
            return {
                label: 'Duration',
                value: aidObj.DURATION,
                key: 'DURATION'
            }
        }
        return null
    }

    const getSecondaryEffectStat = () => {
        if (aidObj.RADIOACTIVE !== undefined) {
            return {
                label: 'Radioactive',
                value: aidObj.RADIOACTIVE,
                key: 'RADIOACTIVE'
            }
        }
        if (aidObj.ADDICTIVE !== undefined) {
            return {
                label: 'Addictive',
                value: aidObj.ADDICTIVE,
                key: 'ADDICTIVE'
            }
        }
        return null
    }

    const specificEffect = getSpecificEffectStat()
    const secondaryEffect = getSecondaryEffectStat()

    const aidContent = (
        <section>
            <div className="row l-spaceBetween">
                <div className="js-cardAid-image themed-svg" data-icon={type}></div>
                
                <span className="h5 js-cardAid-effect">{aidObj.EFFECT}</span>
                
                <section>
                    {specificEffect && (
                        <div className="js-cardAid-hpStat card-stat">
                            <div className="js-cardAid-specificEffect">{specificEffect.label}</div>
                            <div className="js-cardAid-specificEffectVal">{specificEffect.value}</div>
                        </div>
                    )}
                    
                    {secondaryEffect && (
                        <div className="card-stat">
                            <div className="js-cardAid-specificEffect2">{secondaryEffect.label}</div>
                            <div className="js-cardAid-specificEffectVal2">{secondaryEffect.value}</div>
                        </div>
                    )}
                </section>
            </div>
        </section>
    )

    return (
        <ItemCard
            characterItem={characterItem}
            itemData={itemData}
            onAction={handleConsume}
            actionIcon="aid"
            actionType="consume"
            disabled={true} // TODO: Enable when consume functionality is implemented
        >
            {aidContent}
        </ItemCard>
    )
}

export default AidCard
