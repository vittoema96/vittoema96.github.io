import { useTranslation } from 'react-i18next';
import { useCharacter } from '@/app/contexts/CharacterContext.tsx';
import { useEffect, useState } from 'react';
import TraitPerkItem from './TraitPerkItem.tsx';
import TraitPerkSelector from './TraitPerkSelector.tsx';
import { PerkSelectionPopup } from './FeatSelectionPopup.tsx';

import { PerkId } from '@/features/character/feats/perks.ts';
import { getPerkSlotCount } from '@/features/character/feats/rules';
import { hasPerkImplementation } from '@/features/character/feats/registry';
import { useFeatManualActions } from '@/hooks/useFeatManualActions.ts';

function PerkList() {
    const { t } = useTranslation()
    const { character, updateCharacter } = useCharacter()
    const getActionButton = useFeatManualActions();
    const numberOfPerks = getPerkSlotCount(
        character.level, character.perks, character.traits, character.origin,
    );

    // Initialize perks from rawCharacter or create empty slots
    const [selectedPerks, setSelectedPerks] = useState<(PerkId | undefined)[]>([]);

    useEffect(() => {
        setSelectedPerks(character.perks)
    }, [character.perks])


    const handlePerkSelect = (slotIndex: number, perkId: PerkId) => {
        const newPerks = [...selectedPerks];
        newPerks[slotIndex] = perkId;
        setSelectedPerks(newPerks);

        // Update character with new perks
        updateCharacter({
            perks: newPerks.filter(t => t !== undefined)
        });
    };

    const handlePerkRemove = (slotIndex: number) => {
        const newPerks = [...selectedPerks];
        newPerks[slotIndex] = undefined;
        setSelectedPerks(newPerks);

        // Update character with new perks
        updateCharacter({
            perks: newPerks.filter(t => t !== undefined)
        });
    };

    const [changingSlotIndex, setChangingSlotIndex] = useState<number | null>(null);

    // Create array of slots based on numberOfPerks
    const perkSlots = Array.from({ length: numberOfPerks }, (_, index) => selectedPerks[index]);

    return (
        <div style={{ marginTop: '1rem' }}>
            <label className="h4" style={{ marginBottom: '0.5rem', display: 'block' }}>
                {t('perks')}:
            </label>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {perkSlots.map((selectedPerk, index) => {

                    // If perk selected, show item with change button
                    if (selectedPerk) {
                        return (
                            <TraitPerkItem
                                key={index}
                                id={selectedPerk}
                                isFixed={false}
                                isImplemented={hasPerkImplementation(selectedPerk)}
                                onChangeClick={() => setChangingSlotIndex(index)}
                                onDeleteClick={() => handlePerkRemove(index)}
                                actionButton={getActionButton(selectedPerk)}
                            />
                        );
                    }

                    // If no perk selected, show add button
                    return (
                        <TraitPerkSelector
                            key={index}
                            type="perk"
                            onSelect={(perkId) => handlePerkSelect(index, perkId as PerkId)}
                        />
                    );
                })}

                {/* Popup for changing perk */}
                {changingSlotIndex !== null && (
                    <PerkSelectionPopup
                        prev={perkSlots[changingSlotIndex]}
                        onSelect={(perkId) => {
                            handlePerkSelect(changingSlotIndex, perkId);
                            setChangingSlotIndex(null);
                        }}
                        onClose={() => setChangingSlotIndex(null)}
                    />
                )}
            </div>
        </div>
    );
}

export default PerkList
