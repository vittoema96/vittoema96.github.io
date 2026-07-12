import { useTranslation } from 'react-i18next';
import { MYSTERIOUS_44_MAGNUM, useCharacter } from '@/app/contexts/CharacterContext.tsx';
import { useEffect, useState } from 'react';
import { getGameDatabase } from '@/hooks/getGameDatabase.ts';
import { usePopup } from '@/app/contexts/PopupContext.tsx';
import TraitPerkItem from './TraitPerkItem.tsx';
import TraitPerkSelector from './TraitPerkSelector.tsx';
import TraitPerkSelectionPopup from './TraitPerkSelectionPopup.tsx';

import { SpecialType } from '@/features/character/special/special.ts';
import { PerkId } from '@/features/character/feats/perks/perks.ts';

/**
 * Configuration for perk-specific actions.
 * Each perk can have an optional action with a button that appears in the perk description.
 * To add a new perk action, add an entry with the perk ID as key.
 */
interface PerkAction {
    buttonLabel: string;  // i18n key for the button text
    onClick: () => void;  // Handler when button is clicked
}



function PerkList() {
    const dataManager = getGameDatabase()
    const { t } = useTranslation()
    const { showD20Popup, showAlert } = usePopup()
    const { character, updateCharacter } = useCharacter()
    const numberOfPerks = character.level + (character.traits.includes("traitExtraPerk") ? 1 : 0)

    // Initialize perks from rawCharacter or create empty slots
    const [selectedPerks, setSelectedPerks] = useState<(PerkId | undefined)[]>([]);
    const [allPerks, setAllPerks] = useState<PerkId[]>([])

    const PERK_ACTIONS: Record<string, PerkAction> = {
	        'perkMysteriousStranger': {
            buttonLabel: 'summonStranger',
            onClick: () => {
                // Check if player has at least 1 luck
                if(character.currentLuck > 0){
                    showD20Popup({skillId: 'smallGuns', usingItem: MYSTERIOUS_44_MAGNUM, roller: 'mysteriousStranger'})
                } else {
                    showAlert(t('notEnoughLuckAlert'));
                }
            }
        }
    };

    useEffect(() => {
        const availablePerks = Object.values(dataManager.perks)
            .filter(perk => {
                const req = perk.REQUISITES
                return Object.entries(req).every(([key, val]) => {
                    const value = Number(val)
                    if(key === 'level') {
                        return character.level >= value
                    }
                    if(key in character.special){
                        return character.special[key as SpecialType] >= value
                    }
                    return false
                })
            })
            .map(perk => perk.ID as PerkId).sort((a, b) => t(a).localeCompare(t(b)))
        setAllPerks(availablePerks)
        setSelectedPerks(character.perks)
    }, [character.level, character.origin, character.special, character.perks, dataManager.perks, t])


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

    const getAvailablePerksForSlot = (currentSlotIndex: number): string[] => {
        // Filter out perks that are already selected in other slots
        return allPerks.filter(perk => {
            if (selectedPerks[currentSlotIndex] === perk) {
                return true;
            }
            const isSelectedInOtherSlot = selectedPerks.some(
                (selected, index) => index !== currentSlotIndex && selected === perk
            );
            const alreadySelected = selectedPerks.filter(p => p === perk).length
            const perkData = dataManager.perks[perk]!

            return !isSelectedInOtherSlot || (
                perkData.TIER > alreadySelected &&
                (perkData.REQUISITES.level ?? 0) + (perkData.LEVEL_REQ_INCREASE ?? 0) * alreadySelected <= character.level
            );
        });
    };

    // Create array of slots based on numberOfPerks
    const perkSlots = Array.from({ length: numberOfPerks }, (_, index) => selectedPerks[index]);

    return (
        <div style={{ marginTop: '1rem' }}>
            <label className="h4" style={{ marginBottom: '0.5rem', display: 'block' }}>
                {t('perks')}:
            </label>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {perkSlots.map((selectedPerk, index) => {
                    const availablePerks = getAvailablePerksForSlot(index);

                    // If perk selected, show item with change button
                    if (selectedPerk) {
                        return (
                            <TraitPerkItem
                                key={index}
                                id={selectedPerk}
                                isFixed={false}
                                onChangeClick={() => setChangingSlotIndex(index)}
                                onDeleteClick={() => handlePerkRemove(index)}
                                actionButton={PERK_ACTIONS[selectedPerk] ? {
                                    label: PERK_ACTIONS[selectedPerk].buttonLabel,
                                    onClick: PERK_ACTIONS[selectedPerk].onClick
                                } : undefined}
                            />
                        );
                    }

                    // If no perk selected, show add button
                    return (
                        <TraitPerkSelector
                            key={index}
                            type="perk"
                            availableIds={availablePerks}
                            onSelect={(perkId) => handlePerkSelect(index, perkId as PerkId)}
                        />
                    );
                })}

                {/* Popup for changing perk */}
                {changingSlotIndex !== null && (
                    <TraitPerkSelectionPopup
                        type="perk"
                        availableIds={getAvailablePerksForSlot(changingSlotIndex)}
                        onSelect={(perkId) => {
                            handlePerkSelect(changingSlotIndex, perkId as PerkId);
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
