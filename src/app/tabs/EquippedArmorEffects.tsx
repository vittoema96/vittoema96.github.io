import { useTranslation } from 'react-i18next'
import { getModifiedItemData } from '@/utils/itemUtils.ts'
import Tag from '@/components/Tag.tsx'
import {CharacterItem} from "@/types";

/**
 * Component to display active effects from equipped armor
 * Shows only GLOBAL effects that affect the character as a whole
 * (not local effects that only affect individual armor pieces)
 */
function EquippedArmorEffects({ equippedItems }: Readonly<{ equippedItems: CharacterItem[] }>) {
    const { t } = useTranslation()

    // Whitelist of global effects to show in Active Effects
    const GLOBAL_EFFECTS = new Set([
        'effectShadowed',       // Graduated bonuses based on number of pieces
        'effectBalanced',       // Reduces total Agility penalty
        'effectMuffled',        // Reduces total armor noise
        'effectStealthReroll',  // Allows Sneak reroll
        'effectStunResistance', // Stun resistance
        'effectChemDuration',   // Doubles chem duration
        'effectSpecialReroll'   // Allows SPECIAL stat reroll
    ])

    // Collect global effects and passive bonuses from equipped items
    const collectEffects = () => {
        const effectsMap = new Map() // Use Map to track effect counts)
        equippedItems.forEach(item => {

            // Get modified item data (with mods applied)
            const modifiedItemData = getModifiedItemData(item)
            if (!modifiedItemData) {return}

            // Helper function to process effects array

            modifiedItemData.MOD_EFFECTS.forEach(effect => {
                // Parse effect to get the base effect ID and optional value
                const [effectId, ...valueParts] = effect.split(':')
                const effectValue = valueParts.join(':')

                // Only process if this is a global effect
                if (!GLOBAL_EFFECTS.has(effectId)) {return}

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
        <div className="equipped-armor-effects section-label">
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

