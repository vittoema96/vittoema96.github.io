import BaseCard from '../BaseCard.tsx'
import OtherContent from '@/app/tabs/inv/cards/ammo/OtherContent.tsx'
import { CharacterItem, CustomItem } from '@/types';
import { allItems } from '@/data';
import { isType } from '@/features/item/itemUtils.ts';

/**
 * Other/Ammo card component
 * Handles both database items (ammo, misc) and custom items
 */
interface OtherCardProps {
    characterItem: CharacterItem | CustomItem;
}

function OtherCard({ characterItem }: Readonly<OtherCardProps>) {

    if("id" in characterItem){
        const itemData = allItems[characterItem.id]
        if (!isType(itemData, 'ammo') && !isType(itemData, 'other')) {
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
