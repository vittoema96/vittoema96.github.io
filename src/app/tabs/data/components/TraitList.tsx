import { useTranslation } from 'react-i18next';
import { useCharacter } from '@/app/contexts/CharacterContext.tsx';
import { useEffect, useMemo, useState } from 'react';
import TraitPerkItem from './TraitPerkItem.tsx';
import TraitPerkSelector from './TraitPerkSelector.tsx';
import { TraitSelectionPopup } from './FeatSelectionPopup.tsx';
import { useFeatManualActions } from '@/hooks/useFeatManualActions.ts';

import { traits } from '@/data';
import { TraitId } from '@/features/character/feats/traits.ts';
import { hasTraitImplementation } from '@/features/character/feats/registry';

function TraitList() {
    const { t } = useTranslation();
    const { character, updateCharacter } = useCharacter();
    const getActionButton = useFeatManualActions();
    const traitSlotsCount = character.origin.numberOfTraits;

    // Calculate fixed traits from database where FIXED === true AND ORIGINS includes current origin
    const fixedTraits = useMemo(
        () =>
            Object.values(traits)
                .filter(trait => trait.FIXED && trait.ORIGINS.includes(character.origin.id))
                .map(trait => trait.ID),
        [character.origin.id],
    );

    // Initialize traits from rawCharacter or create empty slots
    const [selectedTraits, setSelectedTraits] = useState<(TraitId | undefined)[]>([]);
    const [changingSlotIndex, setChangingSlotIndex] = useState<number | null>(null);

    useEffect(() => {
        setSelectedTraits(character.traits.filter(trait => !fixedTraits.includes(trait)));
    }, [character.traits, fixedTraits]);

    // Don't render if no trait slots AND no fixed traits
    if (traitSlotsCount === 0 && fixedTraits.length === 0) {
        return null;
    }

    const handleTraitSelect = (slotIndex: number, traitId: TraitId) => {
        const newTraits = [...selectedTraits];
        newTraits[slotIndex] = traitId;
        setSelectedTraits(newTraits);

        // Update character with new traits
        updateCharacter({
            traits: newTraits.filter(t => t !== undefined),
        });
    };

    const handleTraitRemove = (slotIndex: number) => {
        const newTraits = [...selectedTraits];
        newTraits[slotIndex] = undefined;
        setSelectedTraits(newTraits);

        // Update character with new traits
        updateCharacter({
            traits: newTraits.filter(t => t !== undefined),
        });
    };

    // Create array of slots based on traitSlotsCount
    const traitSlots = Array.from({ length: traitSlotsCount }, (_, index) => selectedTraits[index]);

    return (
        <div className="u-mt-xl">
            <label className="h4 u-mb-l u-block">{t('traits')}:</label>

            <div className="stack no-gap">
                {/* Fixed Traits - displayed first */}
                {fixedTraits.map(traitId => (
                    <TraitPerkItem
                        key={traitId}
                        id={traitId}
                        isFixed={true}
                        isImplemented={hasTraitImplementation(traitId)}
                        actionButton={getActionButton(traitId)}
                    />
                ))}

                {/* Selectable Traits */}
                {traitSlotsCount > 0 &&
                    traitSlots.map((selectedTrait, index) => {
                        // If trait selected, show item with change button
                        if (selectedTrait) {
                            return (
                                <TraitPerkItem
                                    key={index}
                                    id={selectedTrait}
                                    isFixed={false}
                                    isImplemented={hasTraitImplementation(selectedTrait)}
                                    onChangeClick={() => setChangingSlotIndex(index)}
                                    onDeleteClick={() => handleTraitRemove(index)}
                                    actionButton={getActionButton(selectedTrait)}
                                />
                            );
                        }

                        // If no trait selected, show add button
                        return (
                            <TraitPerkSelector
                                key={index}
                                type="trait"
                                onSelect={traitId => handleTraitSelect(index, traitId as TraitId)}
                            />
                        );
                    })}

                {/* Popup for changing trait - always rendered to avoid hooks issues */}
                {changingSlotIndex !== null ? (
                    <TraitSelectionPopup
                        prev={traitSlots[changingSlotIndex]}
                        onSelect={traitId => {
                            handleTraitSelect(changingSlotIndex, traitId);
                            setChangingSlotIndex(null);
                        }}
                        onClose={() => setChangingSlotIndex(null)}
                    />
                ) : null}
            </div>
        </div>
    );
}

export default TraitList;
