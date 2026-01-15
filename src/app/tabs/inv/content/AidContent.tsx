import {getGameDatabase} from "@/hooks/getGameDatabase";

/**
 * Aid-specific content renderer
 * Displays consumable item effects and stats
 */
function AidContent({ characterItem }) {

    const dataManager = getGameDatabase()
    const itemData = dataManager.getItem(characterItem.id)
    if(!dataManager.isType(itemData, "aid"))
    { return null }
    const type = itemData.TYPE

    // Determine specific effect stats
    const getSpecificEffectStat = () => {
        if (itemData.HP_GAIN !== undefined) {
            return {
                label: 'HP',
                value: `+${itemData.HP_GAIN}`,
                key: 'HP_GAIN'
            }
        }
        if (itemData.DURATION !== undefined) {
            return {
                label: 'Duration',
                value: itemData.DURATION,
                key: 'DURATION'
            }
        }
        return null
    }

    const getSecondaryEffectStat = () => {
        if (itemData.RADIOACTIVE !== undefined) {
            return {
                label: 'Radioactive',
                value: itemData.RADIOACTIVE,
                key: 'RADIOACTIVE'
            }
        }
        if (itemData.ADDICTIVE !== undefined) {
            return {
                label: 'Addictive',
                value: itemData.ADDICTIVE,
                key: 'ADDICTIVE'
            }
        }
        return null
    }

    const specificEffect = getSpecificEffectStat()
    const secondaryEffect = getSecondaryEffectStat()

    return (
        <section>
            <div className="row l-spaceBetween">
                <div className="card-aid-image themed-svg" data-icon={type}></div>

                <span className="h5 js-cardAid-effect">{itemData.EFFECT}</span>

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
}

export default AidContent
