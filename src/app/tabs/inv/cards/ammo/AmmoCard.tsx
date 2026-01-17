import BaseCard from '../BaseCard.tsx'
import AmmoContent from '@/app/tabs/inv/cards/ammo/AmmoContent.tsx'
import { CharacterItem } from '@/types';
import { getGameDatabase } from '@/hooks/getGameDatabase.ts';

/**
 * Ammo card component - now uses BaseCard with AmmoContent renderer
 * Eliminates code duplication and provides consistent card behavior
 */
interface AmmoCardProps {
    characterItem: CharacterItem,
    onSell: (item: CharacterItem) => void,
    onDelete: (item: CharacterItem) => void
}
function AmmoCard({ characterItem, onSell, onDelete }: Readonly<AmmoCardProps>) {
    const dataManager = getGameDatabase()
    const itemData = dataManager.getItem(characterItem.id)
    if (!dataManager.isType(itemData, 'other') || itemData.CATEGORY !== 'ammo') {
        console.error(`Ammo data not found for ID: ${characterItem.id}`);
        return null;
    }

    // Custom sell/delete handlers if provided
    const handleSell = onSell ? () => onSell(characterItem) : undefined
    const handleDelete = onDelete ? () => onDelete(characterItem) : undefined

    return (
        <BaseCard
            characterItem={characterItem}
            contentRenderer={AmmoContent}
            onAction={() => {}} // Ammo doesn't have primary actions
            // TODO these are not even relevant...
            actionIcon={null}
            actionType={null}
            isEquipped={false}
            disabled={true}
            hideControls={true} // Ammo only has sell/delete via overlay
            className="ammo-card"
            customSellHandler={handleSell}
            customDeleteHandler={handleDelete}
        />
    )
}

export default AmmoCard
