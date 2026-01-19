import BaseCard from '../BaseCard.tsx'
import AidContent from '@/app/tabs/inv/cards/aid/AidContent.tsx'
import { CharacterItem, Item } from '@/types';
import { getGameDatabase, getModifiedItemData } from '@/hooks/getGameDatabase.ts';

/**
 * Aid card component for consumable items (food, drinks, meds)
 * Uses BaseCard with AidContent renderer
 */
interface AidCardProps {
    characterItem: CharacterItem,
    onConsume?: (item: CharacterItem, data: Item) => void // TODO remove data from this
}
function AidCard({ characterItem, onConsume }: Readonly<AidCardProps>) {

    const dataManager = getGameDatabase();
    const itemData = dataManager.getItem(characterItem.id)
    if (!dataManager.isType(itemData, 'aid')) {
        console.error(`Aid data not found for ID: ${characterItem.id}`);
        return null;
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
