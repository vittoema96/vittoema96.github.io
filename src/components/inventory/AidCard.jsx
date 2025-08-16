import React from 'react'
import BaseCard from './BaseCard.jsx'
import AidContent from './content/AidContent.jsx'

/**
 * Aid card component for consumable items (food, drinks, meds)
 * Uses BaseCard with AidContent renderer
 */
function AidCard({ characterItem, itemData, onConsume }) {

    if (!itemData) {
        console.error(`Aid data not found for ID: ${characterItem.id}`)
        return null
    }

    const handleConsume = () => {
        if (onConsume) {
            onConsume(characterItem, itemData)
        } else {
            // TODO: Implement consume functionality
            console.log('Consume aid:', characterItem.id)
        }
    }

    return (
        <BaseCard
            characterItem={characterItem}
            itemData={itemData}
            contentRenderer={AidContent}
            onAction={handleConsume}
            actionIcon="aid"
            actionType="consume"
            disabled={true} // TODO: Enable when consume functionality is implemented
            className="aid-card"
        />
    )
}

export default AidCard
