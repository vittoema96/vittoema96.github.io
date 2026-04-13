import { useTranslation } from 'react-i18next'
import BasePopup from '@/components/popup/common/BasePopup.tsx';
import { CharacterItem, CustomItem } from '@/types';
import useInputNumberState from '@/hooks/useInputNumberState.ts';
import { getGameDatabase, getModifiedItemData } from '@/hooks/getGameDatabase.ts';
import { usePopup } from '@/contexts/popup/PopupContext.tsx';
import { useInventoryActions } from '@/features/inv/hooks/useInventoryActions.ts';
import { ChangeEventHandler } from 'react';

function TradeItemPopup({ onClose, characterItem } : Readonly<{
    onClose: () => void;
    characterItem: CharacterItem | CustomItem;
}>) {
    const { t } = useTranslation()
    const { showAlert } = usePopup()
    const { removeItem } = useInventoryActions()
    const dataManager = getGameDatabase()

    let itemData
    if("id" in characterItem) {
        itemData = getModifiedItemData(characterItem) ?? dataManager.getItem(characterItem.id)!
    } else {
        itemData = characterItem
    }

    // Calculate sell price (70% of cost)
    const tradeValueRate = 0.7

    const [quantity, setQuantity] = useInputNumberState(characterItem.quantity)
    const [price, setPrice] = useInputNumberState(() => {
        let basePrice = Number(itemData.COST) || 0
        basePrice = basePrice * tradeValueRate
        basePrice = Math.round(basePrice * 100) / 100
        return basePrice
    })

    const handleConfirm = () => {
        if (quantity && price !== '') {
            const total = Math.floor(quantity * price)
            removeItem(characterItem, quantity, price)
            showAlert(t('soldForCaps', { caps: total }))
        }
    }

    const handleQuantityChange: ChangeEventHandler<HTMLInputElement> = (e) => {
        const value = e.target.value

        // Allow empty string
        const val = Number.parseInt(value)
        if (Number.isNaN(val)) { setQuantity('') }
        else if (val >= 1 && val <= characterItem.quantity) { setQuantity(val) }
    }

    const handlePriceChange: ChangeEventHandler<HTMLInputElement> = (e) => {
        const value = e.target.value

        // Allow empty string
        const val = Number.parseInt(value)
        if (Number.isNaN(val)) { setPrice('') }
        else if (val >= 0) { setPrice(val) }
    }

    // Check if inputs are valid
    const isQuantityValid = (
        quantity !== ''
        && quantity >= 1
        && quantity <= characterItem.quantity
    )
    const isPriceValid = price !== '' && price >= 0
    const isFormValid = isQuantityValid && isPriceValid

    const total = isFormValid ? Math.floor(quantity * price) : 0
    const side = {variation: undefined, ...characterItem}.variation

    return (
        <BasePopup
            title="barter"
            onConfirm={handleConfirm}
            onClose={onClose}
            confirmDisabled={!isFormValid}
        >
            {/* Item Name */}
            {itemData && (
                <div className="row l-centered" style={{ marginBottom: '0.5rem' }}>
                    <span className="h2">
                        {t(itemData.ID ?? '', side ? { side } : {})}
                    </span>
                </div>
            )}

            <span className="h5" style={{ display: 'block', textAlign: 'center', marginBottom: '1rem' }}>
                {t('selling')}
            </span>

            <hr />

            {/* Quantity */}
            <div className="row l-distributed" style={{ marginBottom: '0.5rem' }}>
                <label className="h3">{t('quantity')}:</label>
                <input
                    type="number"
                    min="1"
                    max={characterItem.quantity}
                    value={quantity}
                    onChange={handleQuantityChange}
                    placeholder="1"
                    aria-label="Trade quantity"
                    style={{ width: '5rem' }}
                />
            </div>

            {/* Price per unit */}
            <div className="row l-distributed" style={{ marginBottom: '0.5rem' }}>
                <label className="h3">{t('price')}:</label>
                <div className="row l-centered" style={{ gap: '0.5rem' }}>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={price}
                        onChange={handlePriceChange}
                        placeholder="0"
                        aria-label="Trade price"
                        style={{ width: '5rem' }}
                    />
                    <div
                        className="themed-svg"
                        data-icon="caps"
                        style={{ width: '1rem', height: '1rem' }}
                    ></div>
                </div>
            </div>

            <hr />

            {/* Total */}
            <div className="row l-distributed" style={{ marginTop: '1rem' }}>
                <span className="h2">{t('total')}:</span>
                <div className="row l-centered" style={{ gap: '0.5rem' }}>
                    <span className="h2" style={{ color: 'var(--primary-color)' }}>
                        +{total}
                    </span>
                    <div
                        className="themed-svg"
                        data-icon="caps"
                        style={{ width: '1.5rem', height: '1.5rem' }}
                    ></div>
                </div>
            </div>
        </BasePopup>
    )
}

export default TradeItemPopup
