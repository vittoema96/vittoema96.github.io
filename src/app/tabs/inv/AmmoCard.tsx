import BaseCard from './BaseCard.tsx'
import AmmoContent from './content/AmmoContent.tsx'

/**
 * Ammo card component - now uses BaseCard with AmmoContent renderer
 * Eliminates code duplication and provides consistent card behavior
 */
function AmmoCard({ characterItem, itemData, onSell, onDelete }) {
    if (!itemData) {
        console.error(`Ammo data not found for ID: ${characterItem.id}`)
        return null
    }

    // Custom sell/delete handlers if provided
    const handleSell = onSell ? () => onSell(characterItem) : undefined
    const handleDelete = onDelete ? () => onDelete(characterItem) : undefined

    return (
        <BaseCard
            characterItem={characterItem}
            contentRenderer={AmmoContent}
            onAction={null} // Ammo doesn't have primary actions
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
