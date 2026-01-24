import BaseCard from '../BaseCard.tsx'
import ApparelContent from '@/app/tabs/inv/cards/apparel/ApparelContent.tsx'
import {getGameDatabase, getModifiedItemData } from "@/hooks/getGameDatabase.ts"
import { CharacterItem } from '@/types';
import { useInventoryActions } from '@/app/tabs/inv/hooks/useInventoryActions.ts';

/**
 * Apparel card component with armor stats and equip functionality
 * Uses BaseCard with ApparelContent renderer
 */
interface ApparelCardProps {
    characterItem: CharacterItem,
}
function ApparelCard({ characterItem }: Readonly<ApparelCardProps>) {
    const dataManager = getGameDatabase()
    const itemData = getModifiedItemData(characterItem)
    const {equipItem} = useInventoryActions()

    if (!dataManager.isType(itemData, 'apparel')) {
        console.error(`Apparel data not found for ID: ${characterItem.id}`)
        return null
    }

    return (
        <BaseCard
            action={{
                icon: "armor",
                onClick: () => equipItem(characterItem),
                isChecked: (item) => item.equipped === true,
                // TODO isDisabled for non origin compatible apparel
            }}
            characterItem={characterItem}
            contentRenderer={ApparelContent}
            className="apparel-card"
        />
    )
}

export default ApparelCard
