import { useTranslation } from 'react-i18next';
import { useCharacter } from '@/contexts/CharacterContext.tsx';
import { useEffect, useState } from 'react';
import { getGameDatabase } from '@/hooks/getGameDatabase.ts';
import { TraitId } from '@/types';

function TraitList() {
    const dataManager = getGameDatabase()
    const { t } = useTranslation()
    const { character, updateCharacter } = useCharacter()
    const numberOfTraits = character.origin.numberOfTraits

    // Initialize traits from rawCharacter or create empty slots
    const [selectedTraits, setSelectedTraits] = useState<(TraitId | undefined)[]>([]);
    const [allTraits, setAllTraits] = useState<TraitId[]>([])


    useEffect(() => {
        const allTraits = Object.values(dataManager.traits)
            .filter(trait => trait.ORIGINS.includes(character.origin.id))
            .map(trait => trait.ID)
        setAllTraits(allTraits)
        setSelectedTraits(character.traits.filter(trait => allTraits.includes(trait)))
    }, [character.origin, character.traits])


    // Don't render if no trait slots
    if (numberOfTraits === 0) {
        return null;
    }

    const handleTraitChange = (slotIndex: number, traitId: TraitId | 'none') => {
        const newTraits = [...selectedTraits];
        newTraits[slotIndex] = traitId === 'none' ? undefined : traitId
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {traitSlots.map((selectedTrait, index) => {
                    const availableTraits = getAvailableTraitsForSlot(index);

                    return (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {/* Trait Selector */}
                            <select
                                value={selectedTrait || 'none'}
                                onChange={(e) => handleTraitChange(index, e.target.value as (TraitId | 'none'))}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    fontSize: '1rem',
                                    fontWeight: selectedTrait ? 'bold' : 'normal'
                                }}
                            >
                                <option value="none">
                                    {selectedTrait ? t('noTrait') : '+ ' + t('selectTrait')}
                                </option>
                                {availableTraits.map(trait => (
                                    <option key={trait} value={trait}>
                                        {t(trait)}
                                    </option>
                                ))}
                            </select>

                            {/* Trait Benefit */}
                            {selectedTrait && (
                                <div
                                    style={{
                                        padding: '0.75rem',
                                        backgroundColor: 'var(--button-background)',
                                        border: 'var(--border-primary-thin)',
                                        borderRadius: '5px',
                                        fontSize: '0.85rem',
                                        lineHeight: '1.5',
                                    }}
                                >
                                    <strong>+ {t('benefit')}:</strong> {t(selectedTrait + 'Benefit')}
                                </div>
                            )}

                            {/* Trait Penalty */}
                            {selectedTrait && t(selectedTrait + 'Penalty') !== selectedTrait + "Penalty" && (
                                <div
                                    style={{
                                        padding: '0.75rem',
                                        backgroundColor: 'var(--button-background)',
                                        border: 'var(--border-primary-thin)',
                                        borderRadius: '5px',
                                        fontSize: '0.85rem',
                                        lineHeight: '1.5',
                                    }}
                                >
                                    <strong>- {t('penalty')}:</strong> {t(selectedTrait + 'Penalty')}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default TraitList
