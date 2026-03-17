import { useTranslation } from 'react-i18next';
import { useCharacter } from '@/contexts/CharacterContext.tsx';
import { useEffect, useState, useMemo } from 'react';
import { getGameDatabase } from '@/hooks/getGameDatabase.ts';
import { TraitId } from '@/types';
import TraitPerkItem from './TraitPerkItem.tsx';
import TraitPerkSelector from './TraitPerkSelector.tsx';
import TraitPerkSelectionPopup from './TraitPerkSelectionPopup.tsx';

function TraitList() {
    const dataManager = getGameDatabase()
    const { t } = useTranslation()
    const { character, updateCharacter } = useCharacter()
    const numberOfTraits = character.origin.numberOfTraits

    // Calculate fixed traits from database where FIXED === true AND ORIGINS includes current origin
    const fixedTraits = useMemo(
        () => Object.values(dataManager.traits)
            .filter(trait => trait.FIXED === true && trait.ORIGINS.includes(character.origin.id))
            .map(trait => trait.ID),
        [dataManager.traits, character.origin.id]
    );

    // Initialize traits from rawCharacter or create empty slots
    const [selectedTraits, setSelectedTraits] = useState<(TraitId | undefined)[]>([]);
    const [allTraits, setAllTraits] = useState<TraitId[]>([]);
    const [changingSlotIndex, setChangingSlotIndex] = useState<number | null>(null);


    useEffect(() => {
        const allTraits = Object.values(dataManager.traits)
            .filter(trait => trait.ORIGINS.includes(character.origin.id))
            .filter(trait => !fixedTraits.includes(trait.ID)) // Exclude fixed traits from selectable list
            .map(trait => trait.ID)
        setAllTraits(allTraits)
        // Only show user-selected traits (not fixed ones)
        setSelectedTraits(character.traits.filter(t => !fixedTraits.includes(t)))
    }, [character.origin, character.traits, fixedTraits])


    // Don't render if no trait slots AND no fixed traits
    if (numberOfTraits === 0 && fixedTraits.length === 0) {
        return null;
    }

    const handleTraitSelect = (slotIndex: number, traitId: TraitId) => {
        const newTraits = [...selectedTraits];
        newTraits[slotIndex] = traitId;
        setSelectedTraits(newTraits);

        // Update character with new traits
        updateCharacter({
            traits: newTraits.filter(t => t !== undefined)
        });
    };

    const handleTraitRemove = (slotIndex: number) => {
        const newTraits = [...selectedTraits];
        newTraits[slotIndex] = undefined;
        setSelectedTraits(newTraits);

        // Update character with new traits
        updateCharacter({
            traits: newTraits.filter(t => t !== undefined)
        });
    };

    const getAvailableTraitsForSlot = (currentSlotIndex: number): TraitId[] => {
        // Filter out traits that are already selected in other slots

        return allTraits.filter(trait => {
            const isSelectedInOtherSlot = selectedTraits.some(
                (selected, index) => index !== currentSlotIndex && selected === trait
            );
            return !isSelectedInOtherSlot;
        });
    };

    // Create array of slots based on numberOfTraits
    const traitSlots = Array.from({ length: numberOfTraits }, (_, index) => selectedTraits[index]);

    return (
        <div style={{ marginTop: '1rem' }}>
            <label className="h4" style={{ marginBottom: '0.5rem', display: 'block' }}>
                {t('traits')}:
            </label>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Fixed Traits - displayed first */}
                {fixedTraits.map(traitId => (
                    <TraitPerkItem
                        key={traitId}
                        id={traitId}
                        type="trait"
                        isFixed={true}
                    />
                ))}

                {/* Selectable Traits */}
                {numberOfTraits > 0 && traitSlots.map((selectedTrait, index) => {
                    const availableTraits = getAvailableTraitsForSlot(index);

                    // If trait selected, show item with change button
                    if (selectedTrait) {
                        return (
                            <TraitPerkItem
                                key={index}
                                id={selectedTrait}
                                type="trait"
                                isFixed={false}
                                onChangeClick={() => setChangingSlotIndex(index)}
                                onDeleteClick={() => handleTraitRemove(index)}
                            />
                        );
                    }

                    // If no trait selected, show add button
                    return (
                        <TraitPerkSelector
                            key={index}
                            type="trait"
                            availableIds={availableTraits}
                            onSelect={(traitId) => handleTraitSelect(index, traitId as TraitId)}
                        />
                    );
                })}

                {/* Popup for changing trait - always rendered to avoid hooks issues */}
                {changingSlotIndex !== null ? (
                    <TraitPerkSelectionPopup
                        type="trait"
                        availableIds={getAvailableTraitsForSlot(changingSlotIndex)}
                        onSelect={(traitId) => {
                            handleTraitSelect(changingSlotIndex, traitId as TraitId);
                            setChangingSlotIndex(null);
                        }}
                        onClose={() => setChangingSlotIndex(null)}
                    />
                ) : null}
            </div>
        </div>
    );
}

export default TraitList
