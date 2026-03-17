import { useTranslation } from 'react-i18next'
import {getGameDatabase} from "@/hooks/getGameDatabase.ts"
import { useCharacter } from '@/contexts/CharacterContext.tsx'
import {ApparelItem, CharacterItem, GenericBodyPart} from "@/types";
import {mapItemLocations} from "@/utils/bodyLocations.ts";

/**
 * Component to display equipped apparel items
 * Shows which items are currently equipped on each body part
 */
function EquippedApparel() {
    const { t } = useTranslation()
    const dataManager = getGameDatabase()
    const { character } = useCharacter()
    const equippedItems = character.items.filter(item => item.equipped)


    // Group equipped items by body part
    const itemsByBodyPart: Partial<Record<GenericBodyPart, { item: CharacterItem; itemData: ApparelItem; }[]>> = {}
    character.origin.bodyParts.forEach(part => {
        itemsByBodyPart[part] = []
    })

    equippedItems.forEach(item => {
        const itemData = dataManager.getItem(item.id)
        if(!dataManager.isType(itemData, "apparel")){ return }

        const locations = mapItemLocations(itemData.LOCATIONS_COVERED, item.variation)

        // Add item to each location it covers
        locations.forEach(loc => {
            if (itemsByBodyPart[loc]) {
                itemsByBodyPart[loc].push({ item, itemData })
            }
        })
    })

    // Only show if there are equipped items
    const hasEquippedItems = Object.values(itemsByBodyPart).some(items => items.length > 0)

    if (!hasEquippedItems) {
        return null
    }

    return (
        <div className="equipped-apparel section-label">
            <div className="equipped-apparel__grid">
                {Array.from(character.origin.bodyParts, bodyPart => {
                    const items = itemsByBodyPart[bodyPart]
                    if (!items?.length) {return null}

                    return (
                        <div key={bodyPart} className="equipped-apparel__slot">
                            <span className="equipped-apparel__slot-label">{t(bodyPart)}</span>
                            <div className="equipped-apparel__slot-items">
                                {items.map(({ item, itemData }) => {
                                    let displayName = t(itemData.ID)
                                    if (item.variation) {
                                        displayName += ` (${t(item.variation)})`
                                    }
                                    return (
                                        <div key={`${itemData.ID}_${item.variation}`} className="equipped-apparel__item">
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

