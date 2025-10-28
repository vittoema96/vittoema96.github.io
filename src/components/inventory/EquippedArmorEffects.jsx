import React from 'react'
import { useI18n } from '../../hooks/useI18n.js'
import { useDataManager } from '../../hooks/useDataManager.js'
import { getModifiedItemData } from '../../utils/itemUtils.js'
import Tag from '../common/Tag.jsx'

/**
 * Component to display active effects from equipped armor
 * Shows only GLOBAL effects that affect the character as a whole
 * (not local effects that only affect individual armor pieces)
 */
function EquippedArmorEffects({ equippedItems }) {
    const t = useI18n()
    const dataManager = useDataManager()

    // Whitelist of global effects to show in Active Effects
    const GLOBAL_EFFECTS = [
        'effectShadowed',       // Graduated bonuses based on number of pieces
        'effectBalanced',       // Reduces total Agility penalty
        'effectMuffled',        // Reduces total armor noise
        'effectStealthReroll',  // Allows Sneak reroll
        'effectStunResistance', // Stun resistance
        'effectChemDuration',   // Doubles chem duration
        'effectSpecialReroll'   // Allows SPECIAL stat reroll
    ]

    // Collect global effects and passive bonuses from equipped items
    const collectEffects = () => {
        const effectsMap = new Map() // Use Map to track effect counts
        const bonusStats = {} // Track cumulative bonus stats

        equippedItems.forEach(item => {
            const [itemId] = item.id.split('_')

            // Get modified item data (with mods applied)
            const modifiedItemData = getModifiedItemData(dataManager, itemId, item.mods)
            if (!modifiedItemData) return

            // Helper function to process effects array
            const processEffectsArray = (effectsArray) => {
                if (!effectsArray) return

                effectsArray.forEach(effect => {
                    // Parse effect to get the base effect ID and optional value
                    const [effectId, ...valueParts] = effect.split(':')
                    const effectValue = valueParts.join(':')

                    // Only process if this is a global effect
                    if (!GLOBAL_EFFECTS.includes(effectId)) return

                    // Create a unique key for this effect (including value if present)
                    const effectKey = effectValue ? `${effectId}:${effectValue}` : effectId

                    // Count occurrences of this effect
                    if (effectsMap.has(effectKey)) {
                        const existing = effectsMap.get(effectKey)
                        effectsMap.set(effectKey, {
                            ...existing,
                            count: existing.count + 1
                        })
                    } else {
                        effectsMap.set(effectKey, {
                            effectId,
                            effectValue,
                            count: 1
                        })
                    }
                })
            }

            // Process intrinsic EFFECTS (from base item)
            processEffectsArray(modifiedItemData.EFFECTS)

            // Process MOD_EFFECTS (effects added by mods via effectAdd/qualityAdd)
            processEffectsArray(modifiedItemData.MOD_EFFECTS)

        })

        // Convert effectsMap to array and return
        return Array.from(effectsMap.values())
    }

    const effects = collectEffects()

    // Don't render if no effects
    if (effects.length === 0) {
        return null
    }

    return (
        <div className="equipped-armor-effects">
            <div className="equipped-armor-effects__list">
                {effects.map(({ effectId, effectValue, count }, index) => {
                    // Build the display text
                    let displayText = t(effectId)

                    // For effects with values, add the translated value
                    if (effectValue) {
                        // Try to translate the value (e.g., "strength" → "Forza")
                        const translatedValue = t(effectValue)
                        displayText += ` ${translatedValue}`
                    }

                    // Add count (×N) only when count > 1
                    if (count > 1) {
                        displayText += ` (×${count})`
                    }

                    // Use the same Tag component as in ApparelContent
                    // All effects here are global mod effects, so use isMod styling
                    return (
                        <Tag
                            key={`effect-${index}`}
                            tooltipId={`${effectId}Description`}
                            isMod={true}
                        >
                            {displayText}
                        </Tag>
                    )
                })}
            </div>
        </div>
    )
}

export default EquippedArmorEffects

