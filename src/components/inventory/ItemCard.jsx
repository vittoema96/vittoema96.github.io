import React, { useState } from 'react'
import { useI18n } from '../../hooks/useI18n'
import { useOverlay } from '../../hooks/useOverlay.js'
import { useInventoryActions } from '../../hooks/useInventoryActions.js'

/**
 * Generic item card component - base for all item types
 */
function ItemCard({
    characterItem,
    itemData,
    children,
    onAction,
    actionIcon = 'attack',
    actionType = 'use',
    isEquipped = false,
    disabled = false,
    hideControls = false,
    customControls = null
}) {
    const t = useI18n()
    const [showDescription, setShowDescription] = useState(false)
    const { sellItem, deleteItem, equipItem, useItem } = useInventoryActions()
    
    if (!itemData) {
        console.error(`Item data not found for ID: ${characterItem.id}`)
        return null
    }

    const [itemId, side] = characterItem.id.split('_')
    const quantity = characterItem.quantity

    const handleAction = () => {
        if (disabled) return

        if (onAction) {
            onAction(characterItem, itemData)
        } else {
            // Default action based on actionType
            switch (actionType) {
                case 'equip':
                    equipItem(characterItem, itemData)
                    break
                case 'use':
                    useItem(characterItem, itemData)
                    break
                default:
                    console.log('Action:', actionType, characterItem.id)
            }
        }
    }

    // Use overlay hook for sell/delete functionality
    const {
        showOverlay,
        handleHideOverlay,
        handleSell,
        handleDelete,
        longPressHandlers
    } = useOverlay(
        () => sellItem(characterItem, itemData),
        () => deleteItem(characterItem, itemData)
    )

    const toggleDescription = () => {
        setShowDescription(!showDescription)
    }

    // Format description as paragraphs
    const formatDescription = (description) => {
        if (!description) return ''
        return description.split('. ')
            .map(paragraph => `${paragraph}${paragraph.endsWith('.') ? '' : '.'}`)
            .join(' ')
    }

    return (
        <section
            className="card"
            data-item-id={itemData.ID}
            {...longPressHandlers}
        >
            {/* Card Header */}
            <div className="row card-header l-lastSmall">
                <div className="row">
                    <span className="card-quantity">
                        <i>{quantity}x</i>
                    </span>
                    <span className="card-name">
                        {t(itemData.ID, side ? { side } : {})}
                    </span>
                </div>
                <div className="row">
                    <div className="card__header-stats">
                        <span>{t('cost')}</span>
                        <span className="js-card-cost">{itemData.COST}</span>
                    </div>
                    <div className="card__header-stats">
                        <span>{t('weight')}</span>
                        <span className="js-card-weight">{itemData.WEIGHT}</span>
                    </div>
                    <div className="card__header-stats">
                        <span>{t('rarity')}</span>
                        <span className="js-card-rarity">{itemData.RARITY}</span>
                    </div>
                </div>
            </div>

            {/* Card Content - passed as children */}
            <div className="js-card-content">
                {children}
            </div>

            {/* Card Controls */}
            {customControls ? (
                customControls
            ) : !hideControls ? (
                <div className="row card-controls">
                    <input
                        type="checkbox"
                        className={`themed-svg button-card`}
                        data-icon={actionIcon}
                        checked={isEquipped}
                        disabled={disabled}
                        onChange={handleAction}
                    />
                    <button
                        className="description-toggle-button"
                        onClick={toggleDescription}
                    >
                        {t('showDescription')}
                    </button>
                </div>
            ) : null}

            {/* Description Container */}
            <div className={`description-container ${showDescription ? 'expanded' : ''}`}>
                <div className="description">
                    <p>{formatDescription(itemData.DESCRIPTION)}</p>
                </div>
            </div>

            {/* Card Overlay - shown on long press */}
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
        </section>
    )
}

export default ItemCard
