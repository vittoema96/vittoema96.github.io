import { useTranslation } from 'react-i18next';
import { useCharacter } from '@/app/contexts/CharacterContext.tsx';
import { useEffect, useMemo, useState } from 'react';
import TraitPerkItem from './TraitPerkItem.tsx';
import TraitPerkSelector from './TraitPerkSelector.tsx';
import { TraitSelectionPopup } from './FeatSelectionPopup.tsx';
import { usePopup } from '@/app/contexts/PopupContext.tsx';

import { traits } from '@/data';
import { TraitId } from '@/features/character/feats/traits/traits.ts';

function TraitList() {
    const { t } = useTranslation()
    const { character, updateCharacter } = useCharacter()
    const { showNd6Popup, showConfirm, showAlert } = usePopup()
    const traitSlotsCount = character.origin.numberOfTraits

    // Calculate fixed traits from database where FIXED === true AND ORIGINS includes current origin
    const fixedTraits = useMemo(
        () => Object.values(traits)
            .filter(trait => trait.FIXED && trait.ORIGINS.includes(character.origin.id))
            .map(trait => trait.ID),
        [character.origin.id]
    );

    // Initialize traits from rawCharacter or create empty slots
    const [selectedTraits, setSelectedTraits] = useState<(TraitId | undefined)[]>([]);
    const [changingSlotIndex, setChangingSlotIndex] = useState<number | null>(null);

    useEffect(() => {
        setSelectedTraits(character.traits.filter(trait => !fixedTraits.includes(trait)))
    }, [character.traits, fixedTraits])

    // Trait actions configuration (similar to perk actions)
    const TRAIT_ACTIONS: Record<string, { buttonLabel: string; onClick: () => void }> = {
        'traitRiteOfPassage': {
            buttonLabel: 'traitRiteOfPassage',
            onClick: () => {
                showNd6Popup({
                    diceCount: 1,
                    title: t('traitRiteOfPassage'),
                    description: t('traitRiteOfPassageBenefit'),
                    resultDisplay: 'effects',
                    onResult: (result) => {
                        // If rolled an effect (3-4 on d6), gain +1 luck
                        if (result.totalEffects > 0) {
                            const newLuck = Math.min(character.currentLuck + 1, character.maxLuck);
                            updateCharacter({ currentLuck: newLuck });
                        }
                    }
                });
            }
        },
        'traitMotherWasteland': {
            buttonLabel: 'traitMotherWasteland',
            onClick: () => {
                if(character.currentLuck > 0){
                    showConfirm(t('traitMotherWastelandBenefit'), () => {
                        updateCharacter({ currentLuck: character.currentLuck - 1 });
                    });
                } else {
                    showAlert(t('notEnoughLuckAlert'))
                }
            }
        }
    }


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

    // Create array of slots based on traitSlotsCount
    const traitSlots = Array.from({ length: traitSlotsCount }, (_, index) => selectedTraits[index]);

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
                        isFixed={true}
                        actionButton={TRAIT_ACTIONS[traitId] ? {
                            label: TRAIT_ACTIONS[traitId].buttonLabel,
                            onClick: TRAIT_ACTIONS[traitId].onClick
                        } : undefined}
                    />
                ))}

                {/* Selectable Traits */}
                {traitSlotsCount > 0 && traitSlots.map((selectedTrait, index) => {

                    // If trait selected, show item with change button
                    if (selectedTrait) {
                        return (
                            <TraitPerkItem
                                key={index}
                                id={selectedTrait}
                                isFixed={false}
                                onChangeClick={() => setChangingSlotIndex(index)}
                                onDeleteClick={() => handleTraitRemove(index)}
                                actionButton={TRAIT_ACTIONS[selectedTrait] ? {
                                    label: TRAIT_ACTIONS[selectedTrait].buttonLabel,
                                    onClick: TRAIT_ACTIONS[selectedTrait].onClick
                                } : undefined}
                            />
                        );
                    }

                    // If no trait selected, show add button
                    return (
                        <TraitPerkSelector
                            key={index}
                            type="trait"
                            onSelect={(traitId) => handleTraitSelect(index, traitId as TraitId)}
                        />
                    );
                })}

                {/* Popup for changing trait - always rendered to avoid hooks issues */}
                {changingSlotIndex !== null ? (
                    <TraitSelectionPopup
                        prev={traitSlots[changingSlotIndex]}
                        onSelect={(traitId) => {
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

export default TraitList
