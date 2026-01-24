import BaseCard from '../BaseCard.tsx'
import AidContent from '@/app/tabs/inv/cards/aid/AidContent.tsx'
import { CharacterItem } from '@/types';
import { getGameDatabase } from '@/hooks/getGameDatabase.ts';
import { useInventoryActions } from '../../hooks/useInventoryActions.ts';

/**
 * Aid card component for consumable items (food, drinks, meds)
 * Uses BaseCard with AidContent renderer
 */
interface AidCardProps {
    characterItem: CharacterItem,
}
function AidCard({ characterItem }: Readonly<AidCardProps>) {
    const {consumeItem} = useInventoryActions()
    const dataManager = getGameDatabase();
    const itemData = dataManager.getItem(characterItem.id)
    if (!dataManager.isType(itemData, 'aid')) {
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
