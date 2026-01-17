import { useRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCharacter } from '@/contexts/CharacterContext'
import { getGameDatabase, getModifiedItemData } from '@/hooks/getGameDatabase';
import { useTooltip } from '@/contexts/TooltipContext'
import { useDialog } from '@/hooks/useDialog'
import  { CharacterItem, MOD_SLOTS } from '@/types'

/**
 * Popup for modifying weapons and armor with mods
 * Uses dropdown selectors for each mod slot
 */
function ModifyItemPopup({ onClose, characterItem, itemData }) {
    const { t } = useTranslation()
    const dialogRef = useRef<HTMLDialogElement>(null)
    const { character, updateCharacter } = useCharacter()
    const dataManager = getGameDatabase()
    const { showTooltip } = useTooltip()

    // State: selected mod for each slot
    const [selectedMods, setSelectedMods] = useState({})
    // State: which mods to buy (slot -> boolean)
    const [modsToBuy, setModsToBuy] = useState({})

    // Get available mods from AVAILABLE_MODS field
    const getAvailableMods = () => {
        if (!itemData || !itemData.AVAILABLE_MODS) {return []}
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

    // Initialize selected mods from characterItem on mount
    useEffect(() => {
        if (characterItem) {
            const currentMods = characterItem.mods
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
    }, [])

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
        const previewItem = {...characterItem, mods: newMods}
        return getModifiedItemData(previewItem)
    }

    // Handle confirm
    const handleConfirm = () => {
        if (!characterItem) {return}

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
            JSON.stringify([...item.mods].sort()) === JSON.stringify([...characterItem.mods].sort())
        )

        if (itemIndex === -1) {return}

        let updatedItems = [...character.items]
        const currentItem = updatedItems[itemIndex]

        // Check if this is a robot part
        const isRobotPart = characterItem.type === 'robotPart'
        const robotPartIds = ['robotPartSensors', 'robotPartBody', 'robotPartArms', 'robotPartThrusters']

        // If quantity > 1, decrease quantity and add new modified item
        if (currentItem.quantity > 1) {
            // Decrease quantity of original
            updatedItems[itemIndex] = {
                ...currentItem,
                quantity: currentItem.quantity - 1
            } as CharacterItem

            // Add new item with mods
            updatedItems.push({
                ...currentItem,
                quantity: 1,
                mods: newMods
            } as CharacterItem)
        } else {
            // Just update the single item
            updatedItems[itemIndex] = {
                ...currentItem,
                mods: newMods
            } as CharacterItem
        }

        // If this is a robot part and plating was changed, sync across all parts
        if (isRobotPart) {
            const platingSlot = 'modSlotRobotPlating'
            const newPlating = selectedMods[platingSlot]
            const oldPlating = characterItem.mods[0]

            if (newPlating && newPlating !== oldPlating) {
                // Plating changed - sync across all robot parts
                updatedItems = updatedItems.map(item => {
                    if (robotPartIds.includes(item.id) && item.id !== characterItem.id) {
                        // Update plating (slot 0), preserve armor (slot 1)
                        const armorMod = item.mods && item.mods[1] ? item.mods[1] : null
                        const newMods = armorMod ? [newPlating, armorMod] : [newPlating]
                        return { ...item, mods: newMods }
                    }
                    return item
                })
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

    // Use dialog hook for dialog management
    const { closeWithAnimation } = useDialog(dialogRef, onClose)

    const handleClose = () => {
        closeWithAnimation()
    }

    // Format effect string for display in tooltip
    const formatEffect = (effectStr) => {
        const [effectType, ...valueParts] = effectStr.split(':')
        const value = valueParts.join(':')

        const signedValue = (value) => {if (value>=0) {return `+${value}`;} else {return `-${value}`}}

        const effectMap = {
            damageAdd: `${signedValue(value)} ${t('damage')}`,
            fireRateAdd: `${signedValue(value)} ${t('fireRate')}`,
            rangeIncrease: `${signedValue(value)} ${t('range')}`,
            physicalResAdd: `${signedValue(value)} ${t('physicalRes')}`,
            energyResAdd: `${signedValue(value)} ${t('energyRes')}`,
            radiationResAdd: `${signedValue(value)} ${t('radiationRes')}`,
            qualityAdd: t(value),
            qualityRemove: `${t('remove')} ${t(value)}`,
            effectAdd: t(value),
            damageTypeChange: `${t('damageType')}: ${t(value)}`,
            ammoChange: `${t('ammo')}: ${t(value)}`,
            meleeDamage: `${value} ${t('meleeDamage')}`
        }

        return effectMap[effectType] || effectStr
    }

    // Show mod info tooltip
    const handleModInfo = (e, modData) => {
        e.stopPropagation()

        if (!modData || !modData.EFFECTS || modData.EFFECTS.length === 0) {
            return
        }

        // Format as: Title + list of effects
        const modName = t(modData.ID)
        const effectsList = modData.EFFECTS.map(effect => `• ${formatEffect(effect)}`).join('\n')
        const content = `${modName}\n\n${effectsList}`

        showTooltip(e.currentTarget, content)
    }

    if (!characterItem || !itemData) {return null}

    const modsBySlot = getModsBySlot()
    const availableSlots = getAvailableSlots()
    const previewData = getPreviewData()
    const totalCost = calculateCost()
    const useTwoColumns = availableSlots.length > 3

    // Check if this is a robot part (must always have a mod)
    const [itemId] = characterItem.id.split('_')
    const isRobotPart = dataManager.isUnacquirable(itemId)

    return (
        <dialog ref={dialogRef} className="popup modify-item-popup">
            <div className="popup__header">
                <h2>{t(itemData.ID)}</h2>
            </div>

            <div className="popup__content">
                {/* Compact Stats Bar */}
                <div className="mod-stats-bar">
                    {/* Weapons: 2x2 grid (damage, fire rate, weight, cost) */}
                    {itemData.DAMAGE_RATING && (
                        <>
                            <div className="mod-stat-row">
                                <div className="mod-stat">
                                    <span className="mod-stat-label">{t('damage')}</span>
                                    <span className="mod-stat-value">
                                        {itemData.DAMAGE_RATING}d6
                                        {previewData.DAMAGE_RATING !== itemData.DAMAGE_RATING && (
                                            <span className="mod-stat-change">
                                                {previewData.DAMAGE_RATING > itemData.DAMAGE_RATING ? '+' : ''}
                                                {previewData.DAMAGE_RATING - itemData.DAMAGE_RATING}
                                            </span>
                                        )}
                                    </span>
                                </div>
                                {itemData.FIRE_RATE !== undefined && (
                                    <div className="mod-stat">
                                        <span className="mod-stat-label">{t('fireRate')}</span>
                                        <span className="mod-stat-value">
                                            {itemData.FIRE_RATE}
                                            {previewData.FIRE_RATE !== itemData.FIRE_RATE && (
                                                <span className="mod-stat-change">
                                                    {previewData.FIRE_RATE > itemData.FIRE_RATE ? '+' : ''}
                                                    {previewData.FIRE_RATE - itemData.FIRE_RATE}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="mod-stat-row">
                                <div className="mod-stat">
                                    <span className="mod-stat-label">{t('weight')}</span>
                                    <span className="mod-stat-value">
                                        {itemData.WEIGHT}kg
                                        {previewData.WEIGHT !== itemData.WEIGHT && (
                                            <span className="mod-stat-change">
                                                {previewData.WEIGHT > itemData.WEIGHT ? '+' : ''}
                                                {(previewData.WEIGHT - itemData.WEIGHT).toFixed(1)}
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className="mod-stat">
                                    <span className="mod-stat-label">{t('cost')}</span>
                                    <span className="mod-stat-value">{itemData.COST || 0}</span>
                                </div>
                            </div>
                        </>
                    )}
                    {/* Armor: Resistances row (3 items) + Weight/Cost row (2 items) */}
                    {!itemData.DAMAGE_RATING && (itemData.PHYSICAL_RES !== undefined || itemData.ENERGY_RES !== undefined || itemData.RADIATION_RES !== undefined) && (
                        <>
                            <div className="mod-stat-row">
                                {itemData.PHYSICAL_RES !== undefined && (
                                    <div className="mod-stat">
                                        <span className="mod-stat-label">{t('physical')}</span>
                                        <span className="mod-stat-value">
                                            {itemData.PHYSICAL_RES}
                                            {previewData.PHYSICAL_RES !== itemData.PHYSICAL_RES && (
                                                <span className="mod-stat-change">
                                                    {previewData.PHYSICAL_RES > itemData.PHYSICAL_RES ? '+' : ''}
                                                    {previewData.PHYSICAL_RES - itemData.PHYSICAL_RES}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                )}
                                {itemData.ENERGY_RES !== undefined && (
                                    <div className="mod-stat">
                                        <span className="mod-stat-label">{t('energy')}</span>
                                        <span className="mod-stat-value">
                                            {itemData.ENERGY_RES}
                                            {previewData.ENERGY_RES !== itemData.ENERGY_RES && (
                                                <span className="mod-stat-change">
                                                    {previewData.ENERGY_RES > itemData.ENERGY_RES ? '+' : ''}
                                                    {previewData.ENERGY_RES - itemData.ENERGY_RES}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                )}
                                {itemData.RADIATION_RES !== undefined && (
                                    <div className="mod-stat">
                                        <span className="mod-stat-label">{t('radiation')}</span>
                                        <span className="mod-stat-value">
                                            {itemData.RADIATION_RES}
                                            {previewData.RADIATION_RES !== itemData.RADIATION_RES && (
                                                <span className="mod-stat-change">
                                                    {previewData.RADIATION_RES > itemData.RADIATION_RES ? '+' : ''}
                                                    {previewData.RADIATION_RES - itemData.RADIATION_RES}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="mod-stat-row">
                                <div className="mod-stat">
                                    <span className="mod-stat-label">{t('weight')}</span>
                                    <span className="mod-stat-value">
                                        {itemData.WEIGHT}kg
                                        {previewData.WEIGHT !== itemData.WEIGHT && (
                                            <span className="mod-stat-change">
                                                {previewData.WEIGHT > itemData.WEIGHT ? '+' : ''}
                                                {(previewData.WEIGHT - itemData.WEIGHT).toFixed(1)}
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className="mod-stat">
                                    <span className="mod-stat-label">{t('cost')}</span>
                                    <span className="mod-stat-value">{itemData.COST || 0}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Mod Slots */}
                <div className={`mod-slots-container ${useTwoColumns ? 'mod-slots-two-columns' : ''}`}>
                    {availableSlots.map(slot => {
                        const modsForSlot = modsBySlot[slot] || []
                        if (modsForSlot.length === 0) {return null}

                        const selectedModId = selectedMods[slot]
                        const selectedModData = selectedModId ? dataManager.getItem(selectedModId) : null
                        const currentMods = characterItem.mods
                        const isNewMod = selectedModId && !currentMods.includes(selectedModId)
                        const modCost = selectedModData?.COST || 0
                        const needsToBuy = isNewMod && selectedModId
                        const hasEffects = selectedModData?.EFFECTS && selectedModData.EFFECTS.length > 0

                        return (
                            <div key={slot} className="mod-slot-row">
                                <div className="mod-slot-header">
                                    <div className="mod-slot-label-group">
                                        <label>{t(slot)}</label>
                                        {selectedModId && hasEffects && (
                                            <button
                                                type="button"
                                                className="mod-info-button"
                                                onClick={(e) => handleModInfo(e, selectedModData)}
                                                aria-label="Mod info"
                                            >
                                                <span className="mod-info-icon">ⓘ</span>
                                            </button>
                                        )}
                                    </div>
                                    <div className="mod-slot-cost-area">
                                        {needsToBuy && (
                                            <div className="mod-slot-cost-badge">
                                                <input
                                                    type="checkbox"
                                                    className="themed-svg"
                                                    data-icon="caps"
                                                    checked={modsToBuy[slot] || false}
                                                    onChange={(e) => setModsToBuy({
                                                        ...modsToBuy,
                                                        [slot]: e.target.checked
                                                    })}
                                                />
                                                <span className="mod-cost-value">{modCost}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <select
                                    className="mod-slot-select"
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
                                    {/* Robot plating slot cannot be empty, but armor slot can */}
                                    {(!isRobotPart || slot === 'modSlotRobotArmor') && <option value="">{t('none')}</option>}
                                    {modsForSlot.map(mod => (
                                        <option key={mod.ID} value={mod.ID}>
                                            {t(mod.ID)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )
                    })}
                </div>

                {/* Total Cost */}
                {totalCost > 0 && (
                    <div className="mod-total-section">
                        <span className="mod-total-label">{t('totalCost') || 'Total Cost'}:</span>
                        <span className="mod-total-value">
                            <span className="themed-svg" data-icon="caps"></span>
                            {totalCost}
                        </span>
                    </div>
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

