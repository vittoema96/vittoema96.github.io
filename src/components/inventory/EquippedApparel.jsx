import React from 'react'
import { useI18n } from '../../hooks/useI18n.js'
import { useDataManager } from '../../hooks/useDataManager.js'
import { BODY_PARTS } from '../../js/constants.js'

/**
 * Component to display equipped apparel items
 * Shows which items are currently equipped on each body part
 */
function EquippedApparel({ equippedItems }) {
    const t = useI18n()
    const dataManager = useDataManager()

    // Group equipped items by body part
    const itemsByBodyPart = {}
    Object.values(BODY_PARTS).forEach(part => {
        itemsByBodyPart[part] = []
    })

    equippedItems.forEach(item => {
        const [itemId, side] = item.id.split('_')
        const itemData = dataManager.getItem(itemId)
        if (!itemData || !itemData.LOCATIONS_COVERED) return

        // Get locations this item covers
        const locations = []
        for (const location of itemData.LOCATIONS_COVERED) {
            if (location === 'arm') {
                // Handle side-specific arms (singular - for individual armor pieces)
                if (side === 'left') {
                    locations.push('leftArm')
                } else if (side === 'right') {
                    locations.push('rightArm')
                } else {
                    locations.push('leftArm', 'rightArm')
                }
            } else if (location === 'arms') {
                // Handle both arms (plural - for clothing/outfits)
                locations.push('leftArm', 'rightArm')
            } else if (location === 'leg') {
                // Handle side-specific legs (singular - for individual armor pieces)
                if (side === 'left') {
                    locations.push('leftLeg')
                } else if (side === 'right') {
                    locations.push('rightLeg')
                } else {
                    locations.push('leftLeg', 'rightLeg')
                }
            } else if (location === 'legs') {
                // Handle both legs (plural - for clothing/outfits)
                locations.push('leftLeg', 'rightLeg')
            } else if (location === 'torso') {
                locations.push('torso')
            } else if (location === 'head') {
                locations.push('head')
            } else {
                locations.push(location)
            }
        }

        // Add item to each location it covers
        locations.forEach(loc => {
            if (itemsByBodyPart[loc]) {
                itemsByBodyPart[loc].push({ item, itemData, side })
            }
        })
    })

    // Only show if there are equipped items
    const hasEquippedItems = Object.values(itemsByBodyPart).some(items => items.length > 0)

    if (!hasEquippedItems) {
        return null
    }

    return (
        <div className="equipped-apparel">
            <div className="equipped-apparel__grid">
                {Object.values(BODY_PARTS).map(bodyPart => {
                    const items = itemsByBodyPart[bodyPart]
                    if (items.length === 0) return null

                    return (
                        <div key={bodyPart} className="equipped-apparel__slot">
                            <span className="equipped-apparel__slot-label">{t(bodyPart)}</span>
                            <div className="equipped-apparel__slot-items">
                                {items.map(({ item, itemData, side }, index) => {
                                    let displayName = t(itemData.ID)
                                    if (side) {
                                        displayName += ` (${t(side)})`
                                    }
                                    return (
                                        <div key={index} className="equipped-apparel__item">
                                            {displayName}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default EquippedApparel

