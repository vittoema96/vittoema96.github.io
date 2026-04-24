import { useTranslation } from 'react-i18next'
import BasePopup from '@/components/popup/common/BasePopup.tsx';
import { CharacterItem, CustomItem } from '@/types';
import useInputNumberState from '@/hooks/useInputNumberState.ts';
import { getGameDatabase, getModifiedItemData } from '@/hooks/getGameDatabase.ts';
import { usePopup } from '@/contexts/popup/PopupContext.tsx';
import { useInventoryActions } from '@/features/inv/hooks/useInventoryActions.ts';
import { useCharacter } from '@/contexts/CharacterContext.tsx';
import Skill from '@/features/stat/components/Skill.tsx';
import { addItem } from '@/utils/itemUtils.ts';
import { ChangeEventHandler, useMemo, useState } from 'react';

type TradeMode = 'sell' | 'buy'

export interface TradeItemPopupProps {
    onClose: () => void;
    characterItem: CharacterItem | CustomItem;
    tradeMode?: TradeMode;
    initialQuantity?: number;
    maxQuantity?: number;
}

function TradeItemPopup({
    onClose,
    characterItem,
    tradeMode = 'sell',
    initialQuantity,
    maxQuantity,
} : Readonly<TradeItemPopupProps>) {
    const { t } = useTranslation()
    const { showAlert } = usePopup()
    const { removeItem } = useInventoryActions()
    const { character, updateCharacter } = useCharacter()
    const dataManager = getGameDatabase()
    const isBuying = tradeMode === 'buy'

    let itemData
    if("id" in characterItem) {
        itemData = getModifiedItemData(characterItem) ?? dataManager.getItem(characterItem.id)!
    } else {
        itemData = characterItem
    }

    const maxTradeQuantity = isBuying ? (maxQuantity ?? 99) : characterItem.quantity
    const startingQuantity = isBuying ? (initialQuantity ?? 1) : characterItem.quantity

    const [quantity, setQuantity] = useInputNumberState(startingQuantity)
    const [rate, setRate] = useState(1)
    const basePrice = useMemo(() => Number(itemData.COST) || 0, [itemData.COST])
    const [price, setPrice] = useInputNumberState(() => {
        return Math.round(basePrice * rate * 100) / 100
    })

    const handleConfirm = () => {
        if (quantity && price !== '') {
            const total = Math.floor(quantity * price)

            if (isBuying) {
                if (!('id' in characterItem)) {
                    return
                }

                if (character.caps < total) {
                    showAlert(t('notEnoughCaps'))
                    return
                }

                const newItems = addItem(character.items, {
                    id: characterItem.id,
                    quantity,
                    equipped: false,
                    mods: [],
                    ...(characterItem.variation ? { variation: characterItem.variation } : {}),
                })

                updateCharacter({
                    items: newItems,
                    caps: character.caps - total,
                })
                showAlert(t('boughtForCaps', { caps: total }))
                return
            }

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
        else if (val >= 1 && val <= maxTradeQuantity) { setQuantity(val) }
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
        && quantity <= maxTradeQuantity
    )
    const isPriceValid = price !== '' && price >= 0
    const total = isQuantityValid && isPriceValid ? Math.floor(quantity * price) : 0
    const canAfford = !isBuying || character.caps >= total
    const isFormValid = isQuantityValid && isPriceValid && canAfford

    const side = {variation: undefined, ...characterItem}.variation

    return (
        <BasePopup
            title="barter"
            confirmLabel={isBuying ? 'buy' : 'confirm'}
            onConfirm={handleConfirm}
            onClose={onClose}
            confirmDisabled={!isFormValid}
        >
            {/* buying / selling */}
            <span className="h5">{t(isBuying ? 'buying' : 'selling')}</span>

            <hr />

            {/* Item name × quantity */}
            <div className="row l-distributed">
                <span>{t(itemData.ID ?? '', side ? { side } : {})}</span>
                <div className="row l-centered">
                    <span className="h3">×</span>
                    <input
                        type="number"
                        min="1"
                        max={maxTradeQuantity}
                        value={quantity}
                        onChange={handleQuantityChange}
                        placeholder="1"
                        aria-label="Trade quantity"
                        style={{ width: '5rem' }}
                    />
                </div>
            </div>

            <hr />

            {/* Price label */}

            {/* Price controls + barter skill on same row */}
            <div className="row l-distributed l-space-between">
                <span>{t('price')}:</span>

                <div className={"row"}>
                    <button type="button" onClick={() => handleAdjust(-0.1)} style={{ padding: 'var(--space-s)' }}>
                        -10%
                    </button>

                    <div className="stack l-centered no-gap">
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
                            border: 'var(--border-primary-thin)',
                            borderRadius: '5px',
                            borderTop: 0,
                            borderTopLeftRadius: 0,
                            borderTopRightRadius: 0,
                        }}>
                            {Math.round(rate * 100)}%
                        </span>
                    </div>

                    <button type="button" onClick={() => handleAdjust(0.1)} style={{ padding: 'var(--space-s)' }}>
                        +10%
                    </button>
                </div>

            </div>

            <Skill skillId="barter" isEditing={false} />

            <hr />

            {/* Total */}
            <div className="row l-distributed">
                <span className="h2">{t('total')}:</span>
                <div className="row l-centered">
                    <span className="h2" style={{ color: canAfford ? 'var(--primary-color)' : 'var(--failure-color)' }}>
                        {isBuying ? '-' : '+'}{total}
                    </span>
                    <div className="themed-svg" data-icon="caps" style={{ width: '1.5rem', height: '1.5rem' }} />
                </div>
            </div>
        </BasePopup>
    )
}

export default TradeItemPopup
