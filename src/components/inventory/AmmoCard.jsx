import React, { useState, useRef } from 'react'
import { useI18n } from '../../hooks/useI18n.js'

/**
 * Ammo card component - simpler than other items
 */
function AmmoCard({ characterItem, onSell, onDelete }) {
    const t = useI18n()
    const [showOverlay, setShowOverlay] = useState(false)
    const longPressTimer = useRef(null)

    const ammoId = characterItem.id
    const quantity = characterItem.quantity

    const handleSell = () => {
        if (onSell) {
            onSell(characterItem)
        } else {
            // TODO: Implement sell functionality
            console.log('Sell ammo:', ammoId)
        }
        setShowOverlay(false)
    }

    const handleDelete = () => {
        if (onDelete) {
            onDelete(characterItem)
        } else {
            // TODO: Implement delete functionality
            console.log('Delete ammo:', ammoId)
        }
        setShowOverlay(false)
    }

    // Long press handlers
    const handlePointerDown = (e) => {
        if (e.button !== 0) return

        longPressTimer.current = setTimeout(() => {
            setShowOverlay(true)
        }, 500)
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

    return (
        <div
            className="ammo-card row"
            data-item-id={ammoId}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
        >
            <span className="card-quantity ammo-quantity">
                <i>{quantity}x</i>
            </span>
            <span className="ammo-card-name">{t(ammoId)}</span>

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
        </div>
    )
}

export default AmmoCard
