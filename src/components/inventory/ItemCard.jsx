import React, { useState, useRef } from 'react'
import { useI18n } from '../../hooks/useI18n'

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
    hideControls = false
}) {
    const t = useI18n()
    const [showOverlay, setShowOverlay] = useState(false)
    const [showDescription, setShowDescription] = useState(false)
    const longPressTimer = useRef(null)
    
    if (!itemData) {
        console.error(`Item data not found for ID: ${characterItem.id}`)
        return null
    }

    const [itemId, side] = characterItem.id.split('_')
    const quantity = characterItem.quantity

    const handleAction = () => {
        if (!disabled && onAction) {
            onAction(characterItem, itemData)
        }
    }

    const handleSell = () => {
        // TODO: Implement sell functionality
        console.log('Sell item:', characterItem.id)
    }

    const handleDelete = () => {
        // TODO: Implement delete functionality
        console.log('Delete item:', characterItem.id)
        setShowOverlay(false)
    }

    // Long press handlers
    const handlePointerDown = (e) => {
        // Only trigger on left mouse button or touch
        if (e.button !== 0) return

        longPressTimer.current = setTimeout(() => {
            setShowOverlay(true)
        }, 500) // 500ms long press
    }

    const handlePointerUp = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current)
            longPressTimer.current = null
        }
    }

    const handlePointerLeave = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current)
            longPressTimer.current = null
        }
    }

    const handleCancelOverlay = () => {
        setShowOverlay(false)
    }

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
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
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
            {!hideControls && (
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
            )}

            {/* Description Container */}
            <div className={`description-container ${showDescription ? 'expanded' : ''}`}>
                <div className="description">
                    <p>{formatDescription(itemData.DESCRIPTION)}</p>
                </div>
            </div>

            {/* Card Overlay - shown on long press */}
            <div className={`card-overlay ${showOverlay ? '' : 'hidden'}`} onClick={handleCancelOverlay}>
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
