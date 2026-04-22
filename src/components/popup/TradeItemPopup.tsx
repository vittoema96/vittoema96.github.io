import { useTranslation } from 'react-i18next'
import BasePopup from '@/components/popup/common/BasePopup.tsx';
import { CharacterItem, CustomItem } from '@/types';
import useInputNumberState from '@/hooks/useInputNumberState.ts';
import { getGameDatabase, getModifiedItemData } from '@/hooks/getGameDatabase.ts';
import { usePopup } from '@/contexts/popup/PopupContext.tsx';
import { useInventoryActions } from '@/features/inv/hooks/useInventoryActions.ts';
import { ChangeEventHandler, useMemo, useState } from 'react';

export interface TradeItemPopupProps {
    onClose: () => void;
    characterItem: CharacterItem | CustomItem;
}

function TradeItemPopup({ onClose, characterItem } : Readonly<TradeItemPopupProps>) {
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

    const [quantity, setQuantity] = useInputNumberState(characterItem.quantity)
    const [rate, setRate] = useState(0.9)
    const basePrice = useMemo(() => Number(itemData.COST) || 0, [itemData.COST])
    const [price, setPrice] = useInputNumberState(() => {
        return Math.round(basePrice * rate * 100) / 100
    })

    const handleConfirm = () => {
        if (quantity && price !== '') {
            const total = Math.floor(quantity * price)
            removeItem(characterItem, quantity, price)
            showAlert(t('soldForCaps', { caps: total }))
        }
    }

    const handleAdjust = (delta: number) => {
        const currentPct = Math.round(rate * 100)
        let newPct = currentPct + (delta * 100)
        if (newPct < 0) { newPct = 0 }
        const newRate = newPct / 100

        setRate(newRate)
        setPrice(Math.round(basePrice * newRate * 100) / 100)
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
        if (Number.isNaN(val) || value === '') {
            setPrice('')
            setRate(0)
        }
        else if (val >= 0) {
            setPrice(val)
            if (basePrice > 0) {
                setRate(val / basePrice)
            }
        }
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

            <hr />

            {/* Price Adjustment Cluster */}
            <div className="row l-firstSmall" style={{ marginBottom: '1rem' }}>
                {/* Contenitore flessibile centrale per controlli */}

                <label className="h3">{t('price')}: </label>
                <div className="row l-centered">

                    {/* Pulsante -10% */}
                    <button
                        type="button"
                        onClick={() => handleAdjust(-0.1)}
                        title="Decrease by 10%"
                        style={{ padding: 'var(--space-s)' }} // Un po' più compatto per il mobile
                    >
                        -10%
                    </button>

                    {/* Gruppo Input (Editabile) + Percentuale */}
                    <div className={"stack l-centered no-gap"}>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={price}
                            onChange={handlePriceChange}
                            placeholder="0"
                            aria-label="Trade price"
                            style={{
                                width: '4.5rem',
                                borderBottomLeftRadius: 0,
                                borderBottomRightRadius: 0,
                            }}
                        />
                        <span className="h5" style={{
                            border: "var(--border-primary-thin)",
                            borderRadius: "5px",
                            borderTop: 0,
                            borderTopLeftRadius: 0,
                            borderTopRightRadius: 0,
                        }}>
                            {Math.round(rate * 100)}%
                        </span>
                    </div>

                    {/* Pulsante +10% */}
                    <button
                        type="button"
                        onClick={() => handleAdjust(0.1)}
                        title="Increase by 10%"
                        style={{ padding: 'var(--space-s)' }}
                    >
                        +10%
                    </button>

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
