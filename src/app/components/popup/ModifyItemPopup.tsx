import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCharacter } from '@/app/contexts/CharacterContext';
import { useTooltip } from '@/app/contexts/TooltipContext'
import { CharacterItem, ModItem } from '@/types';
import BasePopup from './common/BasePopup';
import ModTooltipContent from './ModTooltipContent';
import Skill from '@/app/tabs/stat/components/Skill.tsx';
import { isCharacterSkill, SkillType } from '@/features/character/skills/skills.ts';
import { getModifiedItemData, isType, isUnacquirable } from '@/features/item/utils.ts';
import { allItems, legendaryEffects, mod } from '@/data';
import { useItemManagement } from '@/app/contexts/useItemManagement.ts';

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
    rarity: number | '-';
    skill: string;
    perks: string[];
}

interface SlotData {
    availableMods: SlotOption[]
    appliedMod: SlotOption | undefined
    selectedMod: SlotOption | undefined
    buy: boolean | undefined
}

function ModifyItemPopup({ onClose, characterItem }: Readonly<ModifyItemPopupProps>) {
    const { t } = useTranslation()
    const { rawCharacter, character, updateCharacter } = useCharacter()
    const { editItem } = useItemManagement()
    const itemData = getModifiedItemData(characterItem, character.perks)

    const { showTooltip } = useTooltip()

    const [ slotsData, setSlotsData ] = useState(() => {
        const result: Record<string, SlotData> = {}

        if(!itemData) { return result }

        itemData.AVAILABLE_MODS.forEach((modId) => {
            const modData = allItems[modId]
            if (isType(modData, "mod")) {
                const data: SlotOption = {
                    id: modData.ID,
                    effects: modData.EFFECTS,
                    cost: Number(modData.COST) || 0,
                    rarity: modData.RARITY,
                    skill: modData.SKILL,
                    perks: modData.PERKS ?? [],
                }

                if (modData.SLOT_TYPE === 'modSlotRobotModule') {
                    for (let index = 0; index < 3; index++) {
                        const slot = result[`modSlotRobotModule#${index}`] ??= {
                            availableMods: [],
                            appliedMod: undefined,
                            selectedMod: undefined,
                            buy: false
                        }
                        slot.availableMods.push(data)
                    }
                } else {
                    const slot = result[modData.SLOT_TYPE] ??= {
                        availableMods: [],
                        appliedMod: undefined,
                        selectedMod: undefined,
                        buy: false
                    }
                    slot.availableMods.push(data)
                    if(characterItem.mods.includes(data.id)) {
                        slot.appliedMod = data
                        slot.selectedMod = data
                    }
                }
            }
        })

        const appliedRobotModules = characterItem.mods.filter((modId) => {
            const modData = allItems[modId]
            return isType(modData, 'mod') && modData.SLOT_TYPE === 'modSlotRobotModule'
        })
        appliedRobotModules.slice(0, 3).forEach((modId, index) => {
            const slot = result[`modSlotRobotModule#${index}`]
            const appliedMod = slot?.availableMods.find((mod) => mod.id === modId)
            if (slot && appliedMod) {
                slot.appliedMod = appliedMod
                slot.selectedMod = appliedMod
            }
        })

        Object.values(legendaryEffects).filter(
            effect => (
                !isUnacquirable(itemData)
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
            const data: SlotOption = {
                id: effect.ID,
                effects: effect.EFFECTS,
                cost: 0,
                rarity: '-',
                skill: '',
                perks: [],
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
        return getModifiedItemData(previewItem, character.perks)
    }

    const handleConfirm = () => {
        const newMods = Object.values(slotsData)
            .flatMap((data) => data.selectedMod ? [data.selectedMod.id] : [])
        const totalCost = calculateCost()

        if (totalCost > 0 && character.caps < totalCost) {
            alert(t('notEnoughCaps'))
            return
        }

        // If editing robot plating, edit all OTHER parts (not this one)
        // TODO could improve this instead of resorting to updateCharacter

        const platingData = slotsData['modSlotRobotPlating']
        const platingChanged = platingData?.selectedMod?.id !== platingData?.appliedMod?.id
        if(itemData.CATEGORY === 'robotPart' && platingChanged){
            const selectedPlating = platingData?.selectedMod?.id
            const newItems = rawCharacter.items.map(item => {
                if(!character.origin.bodyParts.has(item.id as any)){
                    return item
                }

                const isEditedPart = item.id === characterItem.id
                if(isEditedPart) {
                    return {
                        ...item,
                        mods: newMods
                    }
                }

                const preservedMods = item.mods.filter(modId => {
                    const modData = mod[modId]
                    return !(
                        isType(modData, "mod") &&
                            modData.SLOT_TYPE === 'modSlotRobotPlating'
                    )
                })

                return {
                    ...item,
                    mods: selectedPlating ? [...preservedMods, selectedPlating] : preservedMods
                }
            })
            updateCharacter({
                items: newItems,
                caps: character.caps - totalCost
            })
        } else {
            editItem(
                { ...characterItem, quantity: 1},
                { ...characterItem, mods: newMods, quantity: 1 },
                { caps: totalCost }
            )
        }
    }

    // Show mod info tooltip
    const onModInfoClick = (e: React.MouseEvent<HTMLButtonElement>, modData: SlotOption) => {
        e.stopPropagation()

        showTooltip(
            <ModTooltipContent
                modId={modData.id}
                effects={modData.effects}
                complexity={modData.rarity}
                skill={modData.skill}
                perks={modData.perks}
            />,
            e.currentTarget,
        )
    }

    const previewData = getPreviewData()
    const totalCost = calculateCost()
    const useTwoColumns = Object.keys(slotsData).length > 3
    const hasModChanges = Object.values(slotsData).some(
        data => data.selectedMod?.id !== data.appliedMod?.id,
    )

    const requiredSkills: SkillType[] = Array.from(new Set(
        Object.values(slotsData)
            .filter(data => data.selectedMod?.id !== data.appliedMod?.id)
            .map(data => data.selectedMod?.skill)
            .filter((skill): skill is SkillType => Boolean(skill) && isCharacterSkill(skill)),
    )).sort((a, b) => t(a).localeCompare(t(b)))

    // TODO (CRITICAL): for mod crafting, "survival" checks should use INT instead of END.
    // Current Skill component maps survival -> endurance via getSpecialFromSkill().

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
                {isType(itemData, "weapon")
                    && isType(previewData, "weapon") && (
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
                { isType(itemData, "apparel") && isType(previewData, "apparel") && (
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
                    const needsToBuy = data.selectedMod !== undefined
                        && data.buy !== undefined
                        && !characterItem.mods.includes(data.selectedMod.id)
                    const robotModuleIndex = slot.match(/^modSlotRobotModule#(\d+)$/)?.[1]
                    const slotLabel = robotModuleIndex !== undefined
                        ? t('modSlotRobotModule', { number: Number(robotModuleIndex) + 1 })
                        : t(slot)
                    const selectedByOtherRobotModule = new Set(
                        Object.entries(slotsData)
                            .filter(([otherSlot]) => (
                                otherSlot.startsWith('modSlotRobotModule#')
                                && otherSlot !== slot
                            ))
                            .map(([, otherData]) => otherData.selectedMod?.id)
                            .filter((id): id is string => Boolean(id)),
                    )
                    const availableMods = data.availableMods.filter((mod) => (
                        mod.id === data.selectedMod?.id
                        || !selectedByOtherRobotModule.has(mod.id)
                    ))

                    return <div key={slot}>
                        {/* Header: slot label + info button */}
                        <div className="row l-spaceBetween" style={{padding: "0 var(--space-s)"}}>
                            <label style={{fontSize: "0.8rem", textAlign: "start", padding: "var(--space-xs) 0" }}>
                                {slotLabel}
                            </label>
                            <div className="row" style={{ width: "auto" }}>
                                {data.selectedMod && (
                                    <button
                                        type="button"
                                        className="mod-info-button"
                                        onClick={(e) => onModInfoClick(e, data.selectedMod!)}
                                        aria-label="Mod info"
                                    >ⓘ</button>
                                )}
                                {needsToBuy && (
                                    <div className="mod-slot-cost-area">
                                        <div className="mod-slot-cost-badge">
                                            <input
                                                type="checkbox"
                                                className="themed-svg icon-s"
                                                data-icon="caps"
                                                checked={data.buy ?? false}
                                                onChange={(e) =>
                                                    setSlotsData({
                                                        ...slotsData,
                                                        [slot]: {...slotsData[slot]!, buy: e.target.checked}
                                                    })
                                                }
                                            />
                                            <span className="mod-cost-value">{data.selectedMod?.cost ?? 0}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mod selector */}
                        <select
                            className="mod-slot-select"
                            value={data.selectedMod?.id ?? ''}
                            onChange={(e) => {
                                if (
                                    slot.startsWith('modSlotRobotModule#')
                                    && selectedByOtherRobotModule.has(e.target.value)
                                ) {
                                    return
                                }
                                const newMod = allItems[e.target.value]
                                    ?? legendaryEffects[e.target.value]
                                    ?? undefined
                                let resolved: SlotOption | undefined = undefined
                                if(newMod){
                                    const isMod = 'SKILL' in newMod
                                    resolved = {
                                        id: newMod.ID,
                                        effects: { EFFECTS: [], ...newMod }.EFFECTS,
                                        cost: Number({ COST: 0, ...newMod }.COST) || 0,
                                        rarity: isMod ? (newMod as ModItem).RARITY : '-',
                                        skill: isMod ? (newMod as ModItem).SKILL : '',
                                        perks: isMod ? (newMod as ModItem).PERKS : [],
                                    };
                                }
                                setSlotsData({
                                    ...slotsData,
                                    [slot]: {
                                        ...slotsData[slot]!,
                                        selectedMod: resolved,
                                        ...(slotsData[slot]?.buy === undefined ? {} : {
                                            buy: Boolean(
                                                resolved
                                                && slotsData[slot]?.appliedMod?.id !== resolved.id,
                                            )
                                        })
                                    }
                                })
                            }}
                        >
                            {slot !== "modSlotRobotPlating" && <option value="">{t('none')}</option>}
                            {availableMods.map((mod) => (
                                <option key={mod.id} value={mod.id}>{t(mod.id)}</option>
                            ))}
                        </select>
                    </div>
                })}
            </div>

            {hasModChanges && (
                <>
                    <hr />

                    <div className="row" style={{ alignItems: 'stretch' }}>
                        <div className="mod-total-section" style={{ flex: 1 }}>
                            <span className="mod-total-label">{t('totalCost') || 'Total Cost'}:</span>
                            <span className="mod-total-value">
                                <span className="themed-svg icon-s" data-icon="caps"></span>
                                {totalCost}
                            </span>
                        </div>

                        {requiredSkills.length > 0 && (
                            <div style={{ flex: 1 }} className="stack no-gap">
                                {requiredSkills.map(skillId => (
                                    <Skill key={skillId} skillId={skillId} isEditing={false} />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </BasePopup>
    )
}

export default ModifyItemPopup
