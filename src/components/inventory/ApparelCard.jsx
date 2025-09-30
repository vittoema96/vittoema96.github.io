import React from 'react'
import BaseCard from './BaseCard.jsx'
import ApparelContent from './content/ApparelContent.jsx'

/**
 * Apparel card component with armor stats and equip functionality
 * Uses BaseCard with ApparelContent renderer
 */
function ApparelCard({ characterItem, itemData, onEquip }) {

    if (!itemData) {
        console.error(`Apparel data not found for ID: ${characterItem.id}`)
        return null
    }

    const handleEquip = () => {
        if (onEquip) {
            onEquip(characterItem, itemData)
        } else {
            // TODO: Implement equip functionality
            console.log('Equip apparel:', characterItem.id)
        }
    }

    return (
        <BaseCard
            characterItem={characterItem}
            itemData={itemData}
            contentRenderer={ApparelContent}
            onAction={handleEquip}
            actionIcon="armor"
            actionType="equip"
            isEquipped={characterItem.equipped === true}
            className="apparel-card"
        />
    )
}

export default ApparelCard
