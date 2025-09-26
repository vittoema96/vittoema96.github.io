import React from 'react'
import { useI18n } from '../../hooks/useI18n.js'
import { useOverlay } from '../../hooks/useOverlay.js'
import { useInventoryActions } from '../../hooks/useInventoryActions.js'

/**
 * Ammo card component - simpler than other items
 */
function AmmoCard({ characterItem, onSell, onDelete }) {
    const t = useI18n()
    const { sellItem, deleteItem } = useInventoryActions()
    const ammoId = characterItem.id
    const quantity = characterItem.quantity

    // Use overlay hook for sell/delete functionality
    const {
        showOverlay,
        handleHideOverlay,
        handleSell,
        handleDelete,
        longPressHandlers
    } = useOverlay(
        () => {
            if (onSell) {
                onSell(characterItem)
            } else {
                // Create fake itemData for ammo
                const itemData = { ID: ammoId, COST: 1 } // Default cost for ammo
                sellItem(characterItem, itemData)
            }
        },
        () => {
            if (onDelete) {
                onDelete(characterItem)
            } else {
                const itemData = { ID: ammoId }
                deleteItem(characterItem, itemData)
            }
        }
    )

    const handleCancelOverlay = () => {
        setShowOverlay(false)
    }

    return (
        <div
            className="ammo-card row"
            data-item-id={ammoId}
            {...longPressHandlers}
        >
            <span className="card-quantity ammo-quantity">
                <i>{quantity}x</i>
            </span>
            <span className="ammo-card-name">{t(ammoId)}</span>

            <div className={`card-overlay ${showOverlay ? '' : 'hidden'}`} onClick={handleHideOverlay}>
                <button
                    className="popup__button-confirm"
                    data-icon="caps"
                    onClick={handleSell}
                    title={t('sell')}
                >
                    <img src="img/svg/caps.svg" alt="Sell" />
                </button>
                <button
                    className="delete-button"
                    onClick={handleDelete}
                    title={t('delete')}
                >
                    <i className="fas fa-trash"></i>
                </button>
            </div>
        </div>
    )
}

export default AmmoCard
