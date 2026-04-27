import BaseCard from '../BaseCard.tsx'
import ApparelContent from '@/features/inv/cards/apparel/ApparelContent.tsx'
import {getGameDatabase, getModifiedItemData } from "@/hooks/getGameDatabase.ts"
import { CharacterItem } from '@/types';
import { useInventoryActions } from '@/features/inv/hooks/useInventoryActions.ts';
import { useCharacter } from '@/contexts/CharacterContext.tsx';

/**
 * Apparel card component with armor stats and equip functionality
 * Uses BaseCard with ApparelContent renderer
 */
interface ApparelCardProps {
    characterItem: CharacterItem,
}
function ApparelCard({ characterItem }: Readonly<ApparelCardProps>) {
    const { character } = useCharacter()
    const dataManager = getGameDatabase()
    const itemData = getModifiedItemData(characterItem, character.perks)
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
                isChecked: (item) => {
                    return {
                        equipped: false,
                        ...item,
                    }.equipped;
                }
                // TODO isDisabled for non origin compatible apparel
            }}
            characterItem={characterItem}
            contentRenderer={ApparelContent}
            className="apparel-card"
        />
    )
}

export default ApparelCard
