import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCharacter } from '@/contexts/CharacterContext'
import { getGameDatabase, getModifiedItemData } from '@/hooks/getGameDatabase';
import { useTooltip } from '@/contexts/TooltipContext'
import { CharacterItem, MrHandyPart } from '@/types';
import { addItem, removeItem } from '@/utils/itemUtils.ts';
import BasePopup from './common/BasePopup';

/**
 * Popup for modifying weapons and armor with mods
 * Uses dropdown selectors for each mod slot
 */
export interface ModifyItemPopupProps {
    onClose: () => void;
    characterItem: CharacterItem;
}

interface SlotOption {
    id: string;
    effects: string[];
    cost: number;
}

interface SlotData {
    availableMods: SlotOption[]
    appliedMod: SlotOption | undefined
    selectedMod: SlotOption | undefined
    buy: boolean | undefined
}

function ModifyItemPopup({ onClose, characterItem }: Readonly<ModifyItemPopupProps>) {
    const { t } = useTranslation()
    const { character, updateCharacter } = useCharacter()
    const dataManager = getGameDatabase()
    const itemData = getModifiedItemData(characterItem)

    const { showTooltip } = useTooltip()

    const [ slotsData, setSlotsData ] = useState(() => {
        const result: Record<string, SlotData> = {}

        if(!itemData) { return result }

        itemData.AVAILABLE_MODS.forEach((modId) => {
            const modData = dataManager.getItem(modId)
            if (dataManager.isType(modData, "mod")) {
                const slot = result[modData.SLOT_TYPE] ??= {
                    availableMods: [],
                    appliedMod: undefined,
                    selectedMod: undefined,
                    buy: false
                }
                const data = {
                    id: modData.ID,
                    effects: modData.EFFECTS,
                    cost: Number(modData.COST) || 0,
                }
                slot.availableMods.push(data)
                if(characterItem.mods.includes(data.id)) {
                    slot.appliedMod = data
                    slot.selectedMod = data
                }
            }
        })

        Object.values(dataManager.legendaryEffects).filter(
            effect => (
                !dataManager.isUnacquirable(itemData)
                && effect.FOR_CATEGORY.includes(itemData.CATEGORY)
                && effect.FOR_TYPE.includes(itemData.TYPE)
            )
        ).sort(
            (a, b) => t(a.ID).localeCompare(t(b.ID))
        ).forEach(effect => {
            const slot = result["modSlotLegendary"] ??= {
                availableMods: [],
                appliedMod: undefined,
                selectedMod: undefined,
                buy: undefined
            }
            const data ={
                id: effect.ID,
                effects: effect.EFFECTS,
                cost: 0
            }
            slot.availableMods.push(data)
            if(characterItem.mods.includes(data.id)) {
                slot.appliedMod = data
                slot.selectedMod = data
            }
        })
        return result
    })

    if(!itemData) { return }


    // Calculate total cost of mods to buy
    const calculateCost = () => {
        let totalCost = 0

        Object.values(slotsData).forEach((data) => {
            if (data.selectedMod && data.buy) {
                totalCost += data.selectedMod.cost;
            }
        })

        return totalCost
    }

    // Get preview of modified item data
    const getPreviewData = () => {
        const newMods = Object.values(slotsData)
            .flatMap((data) => data.selectedMod ? [data.selectedMod.id] : [])
        const previewItem = {...characterItem, mods: newMods}
        return getModifiedItemData(previewItem)
    }

    const handleConfirm = () => {
        const newMods = Object.values(slotsData)
            .flatMap((data) => {
                if (data.selectedMod) {
                    return [data.selectedMod.id];
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
            if(data && data.selectedMod?.id !== data.appliedMod?.id){
                character.items.map(item => {
                    if(item.id !== characterItem.id
                        && character.origin.bodyParts.has(item.id as MrHandyPart)){
                        newItems = editItems(item, {
                            ...item,
                            mods: [
                                ...item.mods.filter(m => m !== data.appliedMod?.id),
                                data.selectedMod?.id ?? ''
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
    const onModInfoClick = (e: React.MouseEvent<HTMLButtonElement>, modData: SlotOption) => {
        e.stopPropagation()

        if (modData.effects.length === 0) {
            return
        }

        // Format as: Title + list of effects
        const modName = t(modData.id)
        const effectsList = modData.effects.map(effect => `• ${formatEffect(effect)}`).join('\n')
        const content = `${modName}\n\n${effectsList}`

        showTooltip(content, e.currentTarget)
    }

    const previewData = getPreviewData()
    const totalCost = calculateCost()
    const useTwoColumns = Object.keys(slotsData).length > 3

    return (
        <BasePopup
            title={itemData.ID}
            onConfirm={handleConfirm}
            onClose={onClose}
            confirmDisabled={totalCost > character.caps}
            className="modify-item-popup"
        >
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
                                                {((Number(previewData.WEIGHT) || 0) - (Number(itemData.WEIGHT) || 0)).toFixed(1)}
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
                                            {((Number(previewData.WEIGHT) || 0) - (Number(itemData.WEIGHT) || 0)).toFixed(1)}
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
                { Object.entries(slotsData).map(([slot, data]) => {
                    const needsToBuy = data.selectedMod !== undefined && data.buy !== undefined && !characterItem.mods.includes(data.selectedMod.id)

                    return <div key={slot}>
                        {/* Header */}
                        <div className="row l-spaceBetween" style={{padding: "0 var(--space-s)"}}>
                            <label style={{fontSize: "0.8rem", textAlign: "start", padding: "var(--space-xs) 0" }}>
                                {t(slot)}
                            </label>
                            <div className="row" style={{ width: "auto" }}>
                                {data.selectedMod && <button
                                    type="button"
                                    className="mod-info-button"
                                    onClick={
                                        (e) =>
                                            onModInfoClick(e, data.selectedMod!)
                                    }
                                    aria-label="Mod info"
                                >ⓘ</button>}
                                {needsToBuy && <div className="mod-slot-cost-area">
                                    <div className="mod-slot-cost-badge">
                                        <input
                                            type="checkbox"
                                            className="themed-svg icon-s"
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
                                        <span className="mod-cost-value">{data.selectedMod?.cost ?? 0}</span>
                                    </div>
                                </div>}
                            </div>
                        </div>
                        <select
                            className="mod-slot-select"
                            value={data.selectedMod?.id ?? ''}
                            onChange={(e) => {
                                const newMod = dataManager.getItem(e.target.value)
                                    ?? dataManager.legendaryEffects[e.target.value]
                                    ?? undefined
                                let data = undefined
                                if(newMod){
                                    data = {
                                        id: newMod.ID,
                                        effects: { EFFECTS: [], ...newMod }.EFFECTS,
                                        cost: Number({ COST: 0, ...newMod }.COST) || 0,
                                    };
                                }
                                setSlotsData({
                                    ...slotsData,
                                    [slot]: {
                                        ...slotsData[slot]!,
                                        selectedMod: data,
                                        // set buy=true if selected an actual mod that is not the applied one
                                        // TODO might want to add mods to inventory and do something else here if mod is in inventory
                                        ...(slotsData[slot]?.buy === undefined ? {} : { buy: data && slotsData[slot]?.appliedMod?.id !== data.id })

                                    }
                                })
                            }}
                        >
                            {/* Robot plating slot cannot be empty, but armor slot can */}
                            {slot !== "modSlotRobotPlating" && <option value="">{t('none')}</option>}
                            {slotsData[slot]!.availableMods.map((mod) => (
                                <option key={mod.id} value={mod.id}>
                                    {t(mod.id)}
                                </option>
                            ))}
                        </select>
                    </div>
                })}
            </div>

            {/* Total Cost */}
            {totalCost > 0 && (
                <div className="mod-total-section">
                    <span className="mod-total-label">{t('totalCost') || 'Total Cost'}:</span>
                    <span className="mod-total-value">
                        <span className="themed-svg icon-s" data-icon="caps"></span>
                        {totalCost}
                    </span>
                </div>
            )}
        </BasePopup>
    )
}

export default ModifyItemPopup
