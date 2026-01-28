import BaseCard from '../BaseCard.tsx'
import OtherContent from '@/app/tabs/inv/cards/ammo/OtherContent.tsx'
import { CharacterItem } from '@/types';
import { getGameDatabase } from '@/hooks/getGameDatabase.ts';

/**
 * Ammo card component - now uses BaseCard with AmmoContent renderer
 * Eliminates code duplication and provides consistent card behavior
 */
// TODO THIS SHOULD NEVER BE VISIBLE, WHY WE HAVE IT??
interface AmmoCardProps {
    characterItem: CharacterItem
}
function OtherCard({ characterItem }: Readonly<AmmoCardProps>) {
    const dataManager = getGameDatabase()
    const itemData = dataManager.getItem(characterItem.id)
    if (!dataManager.isType(itemData, 'other')) {
        console.error(`Other item data not found for ID: ${characterItem.id}`);
        return null;
    }

    return (
        <BaseCard
            action={undefined}
            characterItem={characterItem}
            contentRenderer={OtherContent}
            className="ammo-card"
        />
    );
}

export default OtherCard
