import { useTranslation } from 'react-i18next';
import Tag from '@/app/components/Tag.tsx';
import { useCharacter } from '@/app/contexts/CharacterContext.tsx';
import { useMemo } from 'react';
import { CharacterItem } from '@/types';
import { getModifiedItemData } from '@/features/character/inventory/equipment.ts';

const GLOBAL_EFFECTS = new Set([
    'effectShadowed',
    'effectBalanced',
    'effectMuffled',
    'effectStealthReroll',
    'effectStunResistance',
    'effectChemDuration',
    'effectSpecialReroll',
]);

function getGlobalEffects(item: CharacterItem): string[] {
    const itemData = getModifiedItemData(item);
    const effects =
        itemData?.EFFECTS.filter(effect => GLOBAL_EFFECTS.has(effect.split(':')[0] ?? '')) ?? [];

    return effects.flatMap(effect => {
        const effectId = effect.split(':')[0];
        const isShadowedTorso =
            effectId === 'effectShadowed' &&
            itemData?.TYPE === 'apparel' &&
            itemData.LOCATIONS_COVERED.includes('torso');

        return isShadowedTorso ? [effect, effect] : [effect];
    });
}

/**
 * Component to display active effects from equipped armor
 * Shows only GLOBAL effects that affect the character as a whole
 * (not local effects that only affect individual armor pieces)
 */
export default function ActiveEffectsDisplay() {
    const { t } = useTranslation();
    const { character } = useCharacter();

    const countedEffects = useMemo(() => {
        const effects = new Map<string, number>();

        character.items
            .filter(item => item.equipped)
            .flatMap(getGlobalEffects)
            .forEach(effect => {
                effects.set(effect, (effects.get(effect) ?? 0) + 1);
            });

        return effects;
    }, [character.items]);

    if (countedEffects.size === 0) {
        return null;
    }

    return (
        <div className="equipped-armor-effects section-label">
            <div className="equipped-armor-effects__list">
                {Array.from(countedEffects.entries()).map(([effect, count]) => {
                    const [effectId = effect, ...valueParts] = effect.split(':');
                    const effectValue = valueParts.map(value => t(value)).join(': ');
                    const displayText = [
                        t(effectId),
                        effectValue && `(${effectValue})`,
                        count > 1 && `×${count}`,
                    ]
                        .filter(Boolean)
                        .join(' ');

                    return (
                        <Tag key={effect} tooltipId={`${effectId}Description`} isMod>
                            {displayText}
                        </Tag>
                    );
                })}
            </div>
        </div>
    );
}
