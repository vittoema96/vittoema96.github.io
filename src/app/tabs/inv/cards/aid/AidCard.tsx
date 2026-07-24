import BaseCard from '../BaseCard.tsx'
import AidContent from '@/app/tabs/inv/cards/aid/AidContent.tsx'
import { CharacterItem } from '@/types';
import { useInventoryActions } from '../../hooks/useInventoryActions.ts';
import { allItems } from '@/data';

import { isType } from '@/features/item/utils.ts';

/**
 * Aid card component for consumable items (food, drinks, meds)
 * Uses BaseCard with AidContent renderer
 */
interface AidCardProps {
    characterItem: CharacterItem,
}
function AidCard({ characterItem }: Readonly<AidCardProps>) {
    const {consumeItem} = useInventoryActions()
    const itemData = allItems[characterItem.id]
    if (!isType(itemData, 'aid')) {
        console.error(`Aid data not found for ID: ${characterItem.id}`);
        return null;
    }


    return (
        <BaseCard
            action={{
                icon: "aid",
                onClick: () => consumeItem(characterItem),
                isDisabled: () => true,
                isChecked: () => false
            }}
            characterItem={characterItem}
            contentRenderer={AidContent}
            className="aid-card"
        />
    )
}

export default AidCard
