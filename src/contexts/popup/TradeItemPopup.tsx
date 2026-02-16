import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import BasePopup from '@/contexts/popup/common/BasePopup.tsx'

function TradeItemPopup({ onClose, characterItem, itemData, onConfirm }) {
    const { t } = useTranslation()

    const [quantity, setQuantity] = useState('')
    const [price, setPrice] = useState('')

    // Calculate sell price (70% of cost)
    const tradeValueRate = 0.7

    // Initialize on mount
    useEffect(() => {
        if (characterItem && itemData) {
            // Initialize quantity to max available
            setQuantity(characterItem.quantity)

            // Calculate price with trade rate (70%)
            let basePrice = itemData.COST || 1
            basePrice = basePrice * tradeValueRate
            basePrice = Math.round(basePrice * 100) / 100 // Round decimals
            setPrice(basePrice)
        }
    }, [])

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm(quantity, price)
        }
    }

    const handleQuantityChange = (e) => {
        const value = e.target.value

        // Allow empty string
        if (value === '') {
            setQuantity('')
            return
        }

        const numValue = parseInt(value)
        if (!isNaN(numValue) && numValue >= 1 && numValue <= characterItem.quantity) {
            setQuantity(numValue)
        }
    }

    const handlePriceChange = (e) => {
        const value = e.target.value

        // Allow empty string
        if (value === '') {
            setPrice('')
            return
        }

        const numValue = parseFloat(value)
        if (!isNaN(numValue) && numValue >= 0) {
            setPrice(numValue)
        }
    }

    // Check if inputs are valid
    const isQuantityValid = quantity !== '' && !isNaN(quantity) && quantity >= 1 && quantity <= characterItem.quantity
    const isPriceValid = price !== '' && !isNaN(price) && price >= 0
    const isFormValid = isQuantityValid && isPriceValid

    const total = isFormValid ? Math.floor(quantity * price) : 0
    const [, side] = characterItem?.id.split('_') || ['', '']

    return (
        <BasePopup
            title="barter"
            onConfirm={handleConfirm}
            onClose={onClose}
            disabled={!isFormValid}
        >
            {/* Item Name */}
            {itemData && (
                <div className="row l-centered" style={{ marginBottom: '0.5rem' }}>
                    <span className="h2">
                        {t(itemData.ID, side ? { side } : {})}
                    </span>
                </div>
            )}

            <span className="h5" style={{ display: 'block', textAlign: 'center', marginBottom: '1rem' }}>
                {t('selling')}
            </span>

            <hr />

            {/* Quantity */}
            <div className="row l-distributed" style={{ marginBottom: '0.5rem' }}>
                <label className="h3">{t('quantityLabel')}:</label>
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
                <label className="h3">{t('priceLabel')}:</label>
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
                <span className="h2">{t('totalLabel')}:</span>
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

            <hr />
        </BasePopup>
    )
}

export default TradeItemPopup

