import { getModifiedItemData } from '@/features/character/items.ts';
import BaseCard from '../BaseCard.tsx'
import ApparelContent from '@/app/tabs/inv/cards/apparel/ApparelContent.tsx'
import { CharacterItem } from '@/types';
import { useInventoryActions } from '@/app/tabs/inv/hooks/useInventoryActions.ts';
import { useCharacter } from '@/app/contexts/CharacterContext.tsx';
import { isType } from '@/features/item/utils.ts';
import { canEquipApparel } from '@/features/character/items.ts';

/**
 * Apparel card component with armor stats and equip functionality
 * Uses BaseCard with ApparelContent renderer
 */
interface ApparelCardProps {
    characterItem: CharacterItem,
}
function ApparelCard({ characterItem }: Readonly<ApparelCardProps>) {
    const { character } = useCharacter()
    const itemData = getModifiedItemData(characterItem, character.perks)
    const {equipItem} = useInventoryActions()

    if (!isType(itemData, 'apparel')) {
        console.error(`Apparel data not found for ID: ${characterItem.id}`)
        return null
    }
    const isRobotPart = itemData.CATEGORY === 'robotPart'

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
                },
                isDisabled: item =>
                    (isRobotPart && character.origin.isRobot) ||
                    (!('equipped' in item && item.equipped) &&
                        !canEquipApparel(itemData, {
                            origin: character.origin,
                            perks: character.perks,
                            traits: character.traits,
                        })),
            }}
            characterItem={characterItem}
            contentRenderer={ApparelContent}
            className="apparel-card"
        />
    )
}

export default ApparelCard
