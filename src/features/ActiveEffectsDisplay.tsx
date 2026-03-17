import { useTranslation } from 'react-i18next';
import Tag from '@/components/Tag';
import { useCharacter } from '@/contexts/CharacterContext.tsx';
import { getGameDatabase } from '@/hooks/getGameDatabase.ts';
import { useMemo } from 'react';
import { CharacterItem } from '@/types';

/**
 * Component to display active effects from equipped armor
 * Shows only GLOBAL effects that affect the character as a whole
 * (not local effects that only affect individual armor pieces)
 */
export default function ActiveEffectsDisplay() {
    const { t } = useTranslation()
    const { character } = useCharacter()
    const dataManager = getGameDatabase()

    // Whitelist of global countedEffects to show in Active Effects
    // TODO find a better way to distinguish countedEffects that are directly applied and countedEffects that need to be shown to player
    const GLOBAL_EFFECTS = new Set([
        'effectShadowed',       // Graduated bonuses based on number of pieces
        'effectBalanced',       // Reduces total Agility penalty
        'effectMuffled',        // Reduces total armor noise
        'effectStealthReroll',  // Allows Sneak reroll
        'effectStunResistance', // Stun resistance
        'effectChemDuration',   // Doubles chem duration
        'effectSpecialReroll'   // Allows SPECIAL stat reroll
    ])

    const equippedItems = character.items.filter(item => item.equipped)

    const getItemEffects = (item: CharacterItem) => {
        return item.mods.flatMap(mod => {
            const modData = dataManager.getItem(mod)
            if(!dataManager.isType(modData, "mod")) {return []}
            return (modData.EFFECTS || []).flatMap(effect => {
                const [effectType, ...valueParts] = effect.split(':');
                const value = valueParts.join(':')
                if(!['effectAdd', 'qualityAdd'].includes(effectType ?? '')) {return []}
                return [value];
            }).filter(
                // TODO i do not like how this is handled...
                //  we should find a different way to find "global" countedEffects
                effect => GLOBAL_EFFECTS.has(effect)
            )
        })
    }

    const countedEffects: Map<string, number> = useMemo(() =>
        equippedItems
            .flatMap(item => getItemEffects(item))
            .reduce((countedEffects, effect) => {
                if (countedEffects.has(effect)) {
                    countedEffects.set(effect, countedEffects.get(effect) + 1);
                } else {
                    countedEffects.set(effect, 1);
                }
                return countedEffects;
            }, new Map())
    , [equippedItems])

    // Don't render if no countedEffects
    if (countedEffects.size === 0) {
        return null
    }

    return (
        <div className="equipped-armor-effects section-label">
            <div className="equipped-armor-effects__list">
                {Array.from(countedEffects)}
                {countedEffects.entries().map(([effectId, count]) => {
                    // Build the display text
                    let displayText = t(effectId)

                    // For countedEffects with values, add the translated value
                    // TODO WAS EFFECT VALUE ACTUALLY USED HERE??? (effectId:effectValue)
                    //      currently it seems just effectAdd:effectPiercing:1/2 is the only one used
                    //      (and is not in the GLOBAL EFFECTS list)
                    const effectValue = undefined;
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
                    // All countedEffects here are global mod countedEffects, so use isMod styling
                    return (
                        <Tag
                            key={effectId}
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
