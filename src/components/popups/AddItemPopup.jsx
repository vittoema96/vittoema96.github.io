import React, { useState, useEffect, useRef } from 'react'
import { useI18n } from '../../hooks/useI18n'
import { useCharacter } from '../../contexts/CharacterContext.jsx'

/**
 * Add Item popup component for adding items to inventory
 */
function AddItemPopup({ isOpen, onClose, itemType, dataManager }) {
    const [selectedItemId, setSelectedItemId] = useState('')
    const [quantity, setQuantity] = useState(1)
    const [availableItems, setAvailableItems] = useState([])
    
    const t = useI18n()
    const { character, updateCharacter } = useCharacter()
    const dialogRef = useRef(null)

    // Update available items when itemType or dataManager changes
    useEffect(() => {
        if (!isOpen || !itemType || !dataManager.getItem) {
            setAvailableItems([])
            return
        }

        let itemsOfType = {}

        // Get items based on type
        if (itemType === 'ammo') {
            itemsOfType = dataManager.other
        } else if (dataManager.isType(itemType, 'weapon')) {
            itemsOfType = dataManager.weapon
        } else if (dataManager.isType(itemType, 'apparel')) {
            itemsOfType = dataManager.apparel
        } else if (dataManager.isType(itemType, 'aid')) {
            itemsOfType = dataManager.aid
        }

        // Filter items by type and exclude unacquirable items
        const filteredItems = Object.values(itemsOfType).filter(item => {
            return item.TYPE === itemType && !dataManager.isUnacquirable(item.ID)
        })

        // Add side variations for items that need them (arms/legs)
        const itemsWithSides = []
        filteredItems.forEach(item => {
            let suffixes = ['']
            if (item.ID.endsWith('Arm') || item.ID.endsWith('Leg')) {
                suffixes = ['_left', '_right']
            }

            suffixes.forEach(suffix => {
                itemsWithSides.push({
                    ...item,
                    DISPLAY_ID: `${item.ID}${suffix}`,
                    SIDE_SUFFIX: suffix
                })
            })
        })

        setAvailableItems(itemsWithSides)
        
        // Set first item as default selection
        if (itemsWithSides.length > 0) {
            setSelectedItemId(itemsWithSides[0].DISPLAY_ID)
        }
    }, [isOpen, itemType, dataManager])

    // Handle dialog open/close
    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return

        if (isOpen) {
            dialog.showModal()
            // Reset form when opening
            setQuantity(1)
        } else {
            dialog.close()
        }
    }, [isOpen])

    const handleClose = () => {
        onClose()
    }

    const handleConfirm = () => {
        if (!selectedItemId || quantity <= 0) return

        // Add item to character inventory
        const newItem = {
            id: selectedItemId, // This will be the DISPLAY_ID (with _left/_right if applicable)
            type: itemType,
            quantity: quantity,
            equipped: false
        }

        // Check if item already exists in inventory
        const existingItems = character.items || []
        const existingItemIndex = existingItems.findIndex(item => item.id === selectedItemId)

        let updatedItems
        if (existingItemIndex >= 0) {
            // Item exists, increase quantity
            updatedItems = [...existingItems]
            updatedItems[existingItemIndex] = {
                ...updatedItems[existingItemIndex],
                quantity: updatedItems[existingItemIndex].quantity + quantity
            }
        } else {
            // New item, add to inventory
            updatedItems = [...existingItems, newItem]
        }

        updateCharacter({ items: updatedItems })
        handleClose()
    }

    const handleBackdropClick = (e) => {
        if (e.target === dialogRef.current) {
            handleClose()
        }
    }

    return (
        <dialog 
            ref={dialogRef}
            id="popup-addItem"
            onClick={handleBackdropClick}
        >
            <div onClick={(e) => e.stopPropagation()}>
                <header className="l-lastSmall">
                    <span className="h2">{t('chooseItem') || 'Choose an item:'}</span>
                    <button className="popup__button-x" onClick={handleClose}>
                        &times;
                    </button>
                </header>
                
                <hr />
                <div className="row">
                    <select
                        id="popup-addItem__selector"
                        value={selectedItemId}
                        onChange={(e) => setSelectedItemId(e.target.value)}
                        aria-label="Object picker"
                    >
                        {availableItems.map(item => {
                            let displayName = t(item.ID)
                            if (item.SIDE_SUFFIX) {
                                const sideText = item.SIDE_SUFFIX.replace('_', '')
                                displayName += ` (${t(sideText)})`
                            }
                            return (
                                <option key={item.DISPLAY_ID} value={item.DISPLAY_ID}>
                                    {displayName}
                                </option>
                            )
                        })}
                    </select>

                    <input
                        type="number"
                        id="popup-addItem__quantity"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        aria-label="Object quantity"
                        style={{ width: '5rem' }}
                    />
                </div>
                <hr />
                
                <footer>
                    <button 
                        className="popup__button-confirm"
                        onClick={handleConfirm}
                        disabled={!selectedItemId || quantity <= 0}
                    >
                        {t('confirm')}
                    </button>
                    <button 
                        className="popup__button-close"
                        onClick={handleClose}
                    >
                        {t('close')}
                    </button>
                </footer>
            </div>
        </dialog>
    )
}

export default AddItemPopup
