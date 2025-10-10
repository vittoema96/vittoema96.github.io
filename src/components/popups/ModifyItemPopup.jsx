import React, { useRef, useEffect, useState } from 'react'
import { useI18n } from '../../hooks/useI18n.js'
import { useCharacter } from '../../contexts/CharacterContext.jsx'
import { useDataManager } from '../../hooks/useDataManager.js'
import { getModifiedItemData } from '../../utils/itemUtils.js'
import { MOD_SLOTS } from '../../js/constants.js'

/**
 * Popup for modifying weapons and armor with mods
 * Uses dropdown selectors for each mod slot
 */
function ModifyItemPopup({ isOpen, onClose, characterItem, itemData }) {
    const dialogRef = useRef(null)
    const prevIsOpenRef = useRef(false)
    const t = useI18n()
    const { character, updateCharacter } = useCharacter()
    const dataManager = useDataManager()

    // State: selected mod for each slot
    const [selectedMods, setSelectedMods] = useState({})
    // State: which mods to buy (slot -> boolean)
    const [modsToBuy, setModsToBuy] = useState({})

    // Get available mods from AVAILABLE_MODS field
    const getAvailableMods = () => {
        if (!itemData || !itemData.AVAILABLE_MODS) return []
        return itemData.AVAILABLE_MODS
    }

    // Get mod data for each available mod ID
    const getModsData = () => {
        const availableModIds = getAvailableMods()
        return availableModIds.map(modId => dataManager.getItem(modId)).filter(Boolean)
    }

    // Group mods by slot
    const getModsBySlot = () => {
        const modsData = getModsData()
        const modsBySlot = {}

        modsData.forEach(mod => {
            const slot = mod.SLOT_TYPE || mod.SLOT || MOD_SLOTS.MISC
            if (!modsBySlot[slot]) {
                modsBySlot[slot] = []
            }
            modsBySlot[slot].push(mod)
        })

        return modsBySlot
    }

    // Get available slots (slots that have mods)
    const getAvailableSlots = () => {
        const modsBySlot = getModsBySlot()
        return Object.keys(modsBySlot)
    }

    // Initialize selected mods from characterItem (only when popup opens)
    useEffect(() => {
        // Only run when popup transitions from closed to open
        if (isOpen && !prevIsOpenRef.current && characterItem) {
            const currentMods = characterItem.mods || []
            const modsMap = {}

            // Map current mods to their slots
            currentMods.forEach(modId => {
                const modData = dataManager.getItem(modId)
                if (modData) {
                    const slot = modData.SLOT_TYPE || modData.SLOT
                    if (slot) {
                        modsMap[slot] = modId
                    }
                }
            })

            setSelectedMods(modsMap)
            setModsToBuy({})
        }

        // Update ref
        prevIsOpenRef.current = isOpen
    }, [isOpen, characterItem, dataManager])

    // Calculate total cost of mods to buy
    const calculateCost = () => {
        let totalCost = 0

        Object.entries(modsToBuy).forEach(([slot, shouldBuy]) => {
            if (shouldBuy && selectedMods[slot]) {
                const modData = dataManager.getItem(selectedMods[slot])
                if (modData && modData.COST) {
                    totalCost += Number(modData.COST) || 0
                }
            }
        })

        return totalCost
    }

    // Get preview of modified item data
    const getPreviewData = () => {
        const newMods = Object.values(selectedMods).filter(Boolean)
        return getModifiedItemData(dataManager, characterItem?.id.split('_')[0], newMods)
    }

    // Handle confirm
    const handleConfirm = () => {
        if (!characterItem) return

        const newMods = Object.values(selectedMods).filter(Boolean)
        const totalCost = calculateCost()

        // Check if player has enough caps
        if (totalCost > 0 && character.caps < totalCost) {
            alert(t('notEnoughCaps') || 'Not enough caps!')
            return
        }

        // Find the item in inventory (exact match with same mods)
        const itemIndex = character.items.findIndex(item =>
            item.id === characterItem.id &&
            JSON.stringify((item.mods || []).sort()) === JSON.stringify((characterItem.mods || []).sort())
        )

        if (itemIndex === -1) return

        const updatedItems = [...character.items]
        const currentItem = updatedItems[itemIndex]

        // If quantity > 1, decrease quantity and add new modified item
        if (currentItem.quantity > 1) {
            // Decrease quantity of original
            updatedItems[itemIndex] = {
                ...currentItem,
                quantity: currentItem.quantity - 1
            }

            // Add new item with mods
            updatedItems.push({
                ...currentItem,
                quantity: 1,
                mods: newMods
            })
        } else {
            // Just update the single item
            updatedItems[itemIndex] = {
                ...currentItem,
                mods: newMods
            }
        }

        // Subtract caps for purchased mods
        const updatedCaps = character.caps - totalCost

        updateCharacter({
            items: updatedItems,
            caps: updatedCaps
        })

        handleClose()
    }

    // Dialog management
    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return

        if (isOpen && !dialog.open) {
            dialog.showModal()
        } else if (!isOpen && dialog.open) {
            dialog.close()
        }
    }, [isOpen])

    const handleClose = () => {
        const dialog = dialogRef.current
        if (dialog && dialog.open) {
            dialog.classList.add('dialog-closing')
            dialog.addEventListener(
                'animationend',
                () => {
                    dialog.classList.remove('dialog-closing')
                    if (dialog.open) {
                        dialog.close()
                    }
                    onClose()
                },
                { once: true }
            )
        } else {
            onClose()
        }
    }

    if (!characterItem || !itemData) return null

    const modsBySlot = getModsBySlot()
    const availableSlots = getAvailableSlots()
    const previewData = getPreviewData()
    const totalCost = calculateCost()

    return (
        <dialog ref={dialogRef} className="popup">
            <div className="popup__header">
                <h2>{t('modifyItem') || 'Modify Item'}: {t(itemData.ID)}</h2>
            </div>

            <div className="popup__content">
                {/* Preview Stats */}
                {previewData.DAMAGE_RATING && (
                    <div className="row">
                        <div className="col">
                            <label>{t('damage') || 'Damage'}</label>
                            <div className="value">
                                {previewData.DAMAGE_RATING}d6
                                {previewData.DAMAGE_RATING !== itemData.DAMAGE_RATING && (
                                    <span style={{ color: '#0f0', marginLeft: '0.5rem' }}>
                                        (+{previewData.DAMAGE_RATING - itemData.DAMAGE_RATING})
                                    </span>
                                )}
                            </div>
                        </div>
                        {previewData.FIRE_RATE !== undefined && (
                            <div className="col">
                                <label>{t('fireRate') || 'Fire Rate'}</label>
                                <div className="value">
                                    {previewData.FIRE_RATE}
                                    {previewData.FIRE_RATE !== itemData.FIRE_RATE && (
                                        <span style={{ color: '#0f0', marginLeft: '0.5rem' }}>
                                            (+{previewData.FIRE_RATE - itemData.FIRE_RATE})
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="col">
                            <label>{t('weight') || 'Weight'}</label>
                            <div className="value">
                                {previewData.WEIGHT} kg
                                {previewData.WEIGHT !== itemData.WEIGHT && (
                                    <span style={{ color: '#0f0', marginLeft: '0.5rem' }}>
                                        (+{(previewData.WEIGHT - itemData.WEIGHT).toFixed(1)})
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Mod Slots - 2 columns if > 3 slots */}
                <div className={`mod-slots-container ${availableSlots.length > 3 ? 'mod-slots-two-columns' : ''}`}>
                    {availableSlots.map(slot => {
                        const modsForSlot = modsBySlot[slot] || []
                        if (modsForSlot.length === 0) return null

                        const selectedModId = selectedMods[slot]
                        const selectedModData = selectedModId ? dataManager.getItem(selectedModId) : null
                        const currentMods = characterItem?.mods || []
                        const isNewMod = selectedModId && !currentMods.includes(selectedModId)
                        const modCost = selectedModData?.COST || 0
                        const canBuy = isNewMod && selectedModId

                        return (
                            <div key={slot} className="mod-slot-row">
                                <div className="mod-slot-selector">
                                    <label>{t(slot) || slot}</label>
                                    <select
                                        value={selectedModId || ''}
                                        onChange={(e) => {
                                            const newModId = e.target.value || null
                                            setSelectedMods({
                                                ...selectedMods,
                                                [slot]: newModId
                                            })
                                            // Auto-check buy if it's a new mod
                                            if (newModId && !currentMods.includes(newModId)) {
                                                setModsToBuy({
                                                    ...modsToBuy,
                                                    [slot]: true
                                                })
                                            } else {
                                                setModsToBuy({
                                                    ...modsToBuy,
                                                    [slot]: false
                                                })
                                            }
                                        }}
                                    >
                                        <option value="">{t('none') || 'None'}</option>
                                        {modsForSlot.map(mod => (
                                            <option key={mod.ID} value={mod.ID}>
                                                {t(mod.ID)}
                                                {mod.DAMAGE_ADD ? ` (+${mod.DAMAGE_ADD} DMG)` : ''}
                                                {mod.FIRE_RATE_ADD ? ` (+${mod.FIRE_RATE_ADD} FR)` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Buy checkbox - always visible but disabled if not applicable */}
                                <div className="mod-slot-buy">
                                    <input
                                        type="checkbox"
                                        className="themed-svg"
                                        data-icon="caps"
                                        checked={modsToBuy[slot] || false}
                                        disabled={!canBuy}
                                        onChange={(e) => setModsToBuy({
                                            ...modsToBuy,
                                            [slot]: e.target.checked
                                        })}
                                    />
                                    {modsToBuy[slot] && canBuy && (
                                        <span className="mod-cost">
                                            {modCost}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Total Cost - only show if multiple mods are being purchased */}
                {totalCost > 0 && Object.values(modsToBuy).filter(Boolean).length > 1 && (
                    <>
                        <hr className="mod-divider" />
                        <div className="mod-total">
                            <span>{t('total') || 'Total'}:</span>
                            <span className="mod-total-cost">
                                <span className="themed-svg" data-icon="caps"></span>
                                {totalCost}
                            </span>
                        </div>
                    </>
                )}
            </div>

            <div className="popup__footer">
                <button
                    className="popup__button-confirm"
                    onClick={handleConfirm}
                    disabled={totalCost > character.caps}
                >
                    {t('confirm') || 'Confirm'}
                </button>
                <button className="popup__button-cancel" onClick={handleClose}>
                    {t('cancel') || 'Cancel'}
                </button>
            </div>
        </dialog>
    )
}

export default ModifyItemPopup

