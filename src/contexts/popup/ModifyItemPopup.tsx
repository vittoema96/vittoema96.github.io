import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCharacter } from '@/contexts/CharacterContext'
import { getGameDatabase, getModifiedItemData } from '@/hooks/getGameDatabase';
import { useTooltip } from '@/contexts/TooltipContext'
import { useDialog } from '@/hooks/useDialog'
import { CharacterItem, ModItem, MrHandyPart } from '@/types';
import { addItem, removeItem } from '@/utils/itemUtils.ts';

/**
 * Popup for modifying weapons and armor with mods
 * Uses dropdown selectors for each mod slot
 */
interface ModifyItemPopupProps {
    onClose: () => void;
    characterItem: CharacterItem;
}

interface SlotData {
    availableMods: ModItem[]
    appliedMod: ModItem | undefined
    selectedMod: ModItem | undefined
    buy: boolean
}

function ModifyItemPopup({ onClose, characterItem }: Readonly<ModifyItemPopupProps>) {
    const { t } = useTranslation()
    const dialogRef = useRef<HTMLDialogElement>(null)
    const { character, updateCharacter } = useCharacter()
    const dataManager = getGameDatabase()
    const itemData = getModifiedItemData(characterItem) // TODO not sure may be calculated below

    const { showTooltip } = useTooltip()
    // Use dialog hook for dialog management
    const { closeWithAnimation } = useDialog(dialogRef, onClose)

    const [ slotsData, setSlotsData ] = useState(() => {
        if(!dataManager.isType(itemData, 'moddable')) {return {}}
        const result: Record<string, SlotData> = {}
        itemData.AVAILABLE_MODS.forEach((modId) => {
            const modData = dataManager.getItem(modId)
            if (dataManager.isType(modData, "mod")) {
                result[modData.SLOT_TYPE] ??= {
                    availableMods: [],
                    appliedMod: undefined,
                    selectedMod: undefined,
                    buy: false
                }
                result[modData.SLOT_TYPE]!.availableMods.push(modData) // Why do i need ! here?
            }
        })
        characterItem.mods.forEach((modId) => {
            const modData = dataManager.getItem(modId)
            if(!dataManager.isType(modData, 'mod')) {return}
            result[modData.SLOT_TYPE]!.appliedMod = modData // modId exists here
            result[modData.SLOT_TYPE]!.selectedMod = modData // modId exists here
        })
        return result
    })

    if(!dataManager.isType(itemData, 'moddable')) {return}


    // Calculate total cost of mods to buy
    const calculateCost = () => {
        let totalCost = 0

        Object.values(slotsData).forEach((data) => {
            if (data.selectedMod && data.buy) {
                totalCost += data.selectedMod.COST || 0;
            }
        })

        return totalCost
    }

    // Get preview of modified item data
    const getPreviewData = () => {
        const newMods = Object.values(slotsData)
            .flatMap((data) => data.selectedMod ? [data.selectedMod.ID] : [])
        const previewItem = {...characterItem, mods: newMods}
        return getModifiedItemData(previewItem)
    }

    const handleConfirm = () => {
        const newMods = Object.values(slotsData)
            .flatMap((data) => {
                if (data.selectedMod) {
                    return [data.selectedMod.ID];
                } else {
                    return [];
                }
            })
        const totalCost = calculateCost()

        // Check if player has enough caps
        if (totalCost > 0 && character.caps < totalCost) {
            alert(t('notEnoughCaps'))
            return
        }

        const editItems = (oldItem: CharacterItem, newItem: CharacterItem, items: CharacterItem[]) => {
            let newItems = removeItem(items, {
                ...oldItem,
                quantity: 1
            })
            newItems = addItem(newItems, {
                ...newItem,
                quantity: 1
            })
            return newItems
        }

        let newItems = character.items
        // If editing robot plating, edit all OTHER parts (not this one)
        if(itemData.CATEGORY === 'robotPart'){
            const data = slotsData['modSlotRobotPlating']
            if(data && data.selectedMod?.ID !== data.appliedMod?.ID){
                character.items.map(item => {
                    if(item.id !== characterItem.id
                        && character.origin.bodyParts.has(item.id as MrHandyPart)){
                        newItems = editItems(item, {
                            ...item,
                            mods: [
                                ...item.mods.filter(m => m !== data.appliedMod?.ID),
                                data.selectedMod?.ID ?? ''
                            ]
                        }, newItems)
                    }
                })
            }
        }
        // Add THIS item
        newItems = editItems({
            ...characterItem,
            quantity: 1
        }, {
            ...characterItem,
            mods: newMods,
            quantity: 1
        }, newItems)

        // Handle confirm

        // Subtract caps for purchased mods
        const updatedCaps = character.caps - totalCost

        updateCharacter({
            items: newItems,
            caps: updatedCaps
        })

        closeWithAnimation()
    }

    // Format effect string for display in tooltip
    const formatEffect = (effectStr: string) => {
        const [effectType, ...valueParts] = effectStr.split(':')
        const value = valueParts.join(':')
        if(!effectType) {return effectStr}

        const signed = (value: string) =>
            Number.parseInt(value).toLocaleString(undefined, { signDisplay: "exceptZero" })

        if(effectType.startsWith('effect') || effectType.startsWith('quality')){
            if(effectType.endsWith('Add')){
                return `+ ${valueParts.map(val => t(val)).join(' ')}`
            } else if(effectType.endsWith('Remove')){
                return `- ${t(valueParts.map(val => t(val)).join(' '))}`
            }
        } else if(effectType.endsWith('Add')){
            return `${signed(value)} ${t(effectType.replace('Add', ''))}`
        } else if(effectType.endsWith('Set')){
            return `${t(effectType.replace('Set', ''))}: ${t(value)}`
        }
        console.error(`${effectType} was not handled correctly`)
        return effectStr
    }

    // Show mod info tooltip
    const onModInfoClick = (e: React.MouseEvent<HTMLButtonElement>, modData: ModItem) => {
        e.stopPropagation()

        if (!modData.EFFECTS || modData.EFFECTS?.length === 0) {
            return
        }

        // Format as: Title + list of effects
        const modName = t(modData.ID)
        const effectsList = modData.EFFECTS.map(effect => `• ${formatEffect(effect)}`).join('\n')
        const content = `${modName}\n\n${effectsList}`

        showTooltip(content, e.currentTarget)
    }

    const previewData = getPreviewData()
    const totalCost = calculateCost()
    const useTwoColumns = Object.keys(slotsData).length > 3

    return (
        <dialog ref={dialogRef} className="popup modify-item-popup">
            <div className="popup__header">
                <h2>{t(itemData.ID)}</h2>
            </div>

            <div className="popup__content">
                {/* Compact Stats Bar */}
                <div className="mod-stats-bar">
                    {/* Weapons: 2x2 grid (damage, fire rate, weight, cost) */}
                    {dataManager.isType(itemData, "weapon")
                        && dataManager.isType(previewData, "weapon") && (
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
                                {   // TODO is it possible to change from no fire rate to fire rate?
                                    itemData.FIRE_RATE !== '-' && previewData.FIRE_RATE !== '-' && (
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
                                    <span className="mod-stat-value">{itemData.COST}</span>
                                </div>
                            </div>
                        </>
                    )}
                    {/* Armor: Resistances row (3 items) + Weight/Cost row (2 items) */}
                    { dataManager.isType(itemData, "apparel") && dataManager.isType(previewData, "apparel") && (
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
                                    <span className="mod-stat-value">{itemData.COST}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                {/* Mod Slots */}
                <div className={`mod-slots-container ${useTwoColumns ? 'mod-slots-two-columns' : ''}`}>
                    {Object.entries(slotsData).map(([slot, data]) => {
                        const needsToBuy = data.selectedMod && !characterItem.mods.includes(data.selectedMod.ID)

                        return (
                            <div key={slot} className="mod-slot-row">
                                <div className="mod-slot-header">
                                    <div className="mod-slot-label-group">
                                        <label>{t(slot)}</label>
                                        {data.selectedMod &&
                                            <button
                                                type="button"
                                                className="mod-info-button"
                                                onClick={
                                                    (e) =>
                                                        onModInfoClick(e, data.selectedMod!)
                                                }
                                                aria-label="Mod info"
                                            >
                                                <span className="mod-info-icon">ⓘ</span>
                                            </button>}
                                    </div>
                                    <div className="mod-slot-cost-area">
                                        {needsToBuy && (
                                            <div className="mod-slot-cost-badge">
                                                <input
                                                    type="checkbox"
                                                    className="themed-svg"
                                                    data-icon="caps"
                                                    checked={data.buy}
                                                    onChange={
                                                        (e) =>
                                                            setSlotsData({
                                                                ...slotsData,
                                                                [slot]: {...slotsData[slot]!, buy: e.target.checked}
                                                            })
                                                    }
                                                />
                                                <span className="mod-cost-value">{data.selectedMod?.COST || 0}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <select
                                    className="mod-slot-select"
                                    value={data.selectedMod?.ID || ''}
                                    onChange={(e) => {
                                        let newMod = dataManager.getItem(e.target.value) ?? undefined
                                        if(!dataManager.isType(newMod, "mod")) {
                                            newMod = undefined
                                        }
                                        setSlotsData({
                                            ...slotsData,
                                            [slot]: {
                                                ...slotsData[slot]!,
                                                selectedMod: newMod,
                                                buy: !!newMod && !characterItem.mods.includes(newMod.ID)
                                            }
                                        })
                                    }}
                                >
                                    {/* Robot plating slot cannot be empty, but armor slot can */}
                                    {slot !== "modSlotRobotPlating" && <option value="">{t('none')}</option>}
                                    {slotsData[slot]!.availableMods.map((mod) => (
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
                    {t('confirm')}
                </button>
                <button className="popup__button-cancel" onClick={() => closeWithAnimation()}>
                    {t('cancel')}
                </button>
            </div>
        </dialog>
    )
}

export default ModifyItemPopup

