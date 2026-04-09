import BaseCard from '../BaseCard.tsx'
import OtherContent from '@/features/inv/cards/ammo/OtherContent.tsx'
import { CharacterItem, CustomItem } from '@/types';
import { getGameDatabase } from '@/hooks/getGameDatabase.ts';

/**
 * Other/Ammo card component
 * Handles both database items (ammo, misc) and custom items
 */
interface OtherCardProps {
    characterItem: CharacterItem | CustomItem;
}

function OtherCard({ characterItem }: Readonly<OtherCardProps>) {

    const dataManager = getGameDatabase()
    if("id" in characterItem){
        const itemData = dataManager.getItem(characterItem.id)
        if (!dataManager.isType(itemData, 'ammo') && !dataManager.isType(itemData, 'other')) {
            console.error(`Ammo/Other item data not found for ID: ${characterItem.id}`);
            return null;
        }
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
