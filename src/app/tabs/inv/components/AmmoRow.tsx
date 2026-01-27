import { useTranslation } from 'react-i18next'
import { useOverlay } from '@/hooks/useOverlay.ts'
import { useInventoryActions } from '@/app/tabs/inv/hooks/useInventoryActions.ts'
import {getGameDatabase} from "@/hooks/getGameDatabase.ts"
import { CharacterItem } from '@/types';

/**
 * Simple one-line ammo display (no accordion)
 * Uses same style as InventoryRow but without expansion
 */
interface AmmoRowProps {
    characterItem: CharacterItem
}
function AmmoRow({ characterItem }: Readonly<AmmoRowProps>) {
    const { t } = useTranslation()
    const { sellItem, deleteItem } = useInventoryActions()
    const dataManager = getGameDatabase()
    const itemData = dataManager.getItem(characterItem.id)
    if(!dataManager.isType(itemData, 'other')) {
        return null
    }

    const canSellDelete = !dataManager.isUnacquirable(itemData.ID)

    const {
        showOverlay,
        handleHideOverlay,
        handleSell,
        handleDelete,
        longPressHandlers
    } = useOverlay(
        canSellDelete ? () => sellItem(characterItem) : null,
        canSellDelete ? () => deleteItem(characterItem) : null
    )

    if (!itemData) {
        return null
    }

    const quantity = characterItem.quantity

    return (
        <div
            className="inventory-row"
            {...longPressHandlers}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Row Header (same as InventoryRow but no expand button) */}
            <div className="inventory-row__header">
                <div className="inventory-row__icon themed-svg" data-icon="caps"></div>

                <div className="inventory-row__info">
                    <div className="inventory-row__name">
                        {t(itemData.ID)}
                    </div>
                    <div className="inventory-row__subinfo">
                        {itemData.CATEGORY === 'ammo' ? t('ammo') : itemData.EFFECT}
                    </div>
                </div>

                <div className="inventory-row__quantity">
                    <span>{quantity}x</span>
                </div>
            </div>

            {/* Sell/Delete Overlay - shown on long press (only for items that can be sold/deleted) */}
            {canSellDelete && (
                <div className={`card-overlay ${showOverlay ? '' : 'hidden'}`} onClick={handleHideOverlay}>
                    <button
                        className="popup__button-confirm"
                        data-icon="caps"
                        onClick={(e) => {
                            e.stopPropagation()
                            handleSell()
                        }}
                        title={t('sell')}
                    >
                        {/* TODO Use an appropriate image */}
                        <img src="img/svg/caps.svg" alt="Sell" />
                    </button>
                    <button
                        className="delete-button"
                        onClick={(e) => {
                            e.stopPropagation()
                            handleDelete()
                        }}
                        title={t('delete')}
                    >
                        <i className="fas fa-trash"></i>
                    </button>
                </div>
            )}
        </div>
    )
}

export default AmmoRow

