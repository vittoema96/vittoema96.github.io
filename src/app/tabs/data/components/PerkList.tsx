import { useTranslation } from 'react-i18next';
import { useCharacter } from '@/contexts/CharacterContext.tsx';
import { useEffect, useState } from 'react';
import { getGameDatabase } from '@/hooks/getGameDatabase.ts';
import { Side, SpecialType } from '@/types';
import { usePopup } from '@/contexts/popup/PopupContext.tsx';

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
    const { showD20Popup } = usePopup()
    const { character, updateCharacter } = useCharacter()
    const numberOfPerks = character.level + (character.traits.includes("traitExtraPerk") ? 1 : 0)

    // Initialize perks from rawCharacter or create empty slots
    const [selectedPerks, setSelectedPerks] = useState<(string | undefined)[]>([]);
    const [allPerks, setAllPerks] = useState<string[]>([])

    const PERK_ACTIONS: Record<string, PerkAction> = {
        'perkMysteriousStranger': {
            buttonLabel: 'summonStranger',
            onClick: () => {
                showD20Popup('perkMysteriousStranger', {
                    id: "weaponFortyFourPistol",
                    quantity: 1,
                    mods: ["modErgonomicGrip", "modMarksmanGrip", "modPowerful"],
                    customName: "Mysterious .44 Magnum"
                })
                console.log('Mysterious Stranger action triggered!');
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
            .map(perk => perk.ID).sort((a, b) => t(a).localeCompare(t(b)))
        setAllPerks(availablePerks)
        setSelectedPerks(character.perks ?? [])
    }, [character.level, character.origin, character.special, character.perks])


    const handlePerkChange = (slotIndex: number, perkId: string) => {
        const newPerks = [...selectedPerks];
        newPerks[slotIndex] = perkId === 'none' ? undefined : perkId
        setSelectedPerks(newPerks);

        // Update character with new perks
        updateCharacter({
            perks: newPerks.filter(t => t !== undefined)
        });
    };

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
            const perkData = dataManager.perks[perk]

            return !isSelectedInOtherSlot || (
                perkData.TIER > alreadySelected &&
                perkData.REQUISITES.level + perkData.LEVEL_REQ_INCREASE * alreadySelected <= character.level
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {perkSlots.map((selectedPerk, index) => {
                    const availablePerks = getAvailablePerksForSlot(index);

                    return (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {/* Perk Selector */}
                            <select
                                value={selectedPerk || 'none'}
                                onChange={(e) => handlePerkChange(index, e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    fontSize: '1rem',
                                    fontWeight: selectedPerk ? 'bold' : 'normal'
                                }}
                            >
                                <option value="none">
                                    {selectedPerk ? t('noPerk') : '+ ' + t('selectPerk')}
                                </option>
                                {availablePerks.map(perk => (
                                    <option key={perk} value={perk}>
                                        {t(perk)}
                                    </option>
                                ))}
                            </select>

                            {/* Perk Benefit */}
                            {selectedPerk && (
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
                                    <p>{t(selectedPerk + 'Description')}</p>
                                    {/* Perk-specific action button */}
                                    {PERK_ACTIONS[selectedPerk] && (
                                        <button
                                            className="perk-action-button"
                                            onClick={PERK_ACTIONS[selectedPerk].onClick}
                                            style={{
                                                width: '100%'
                                            }}
                                        >
                                            {t(PERK_ACTIONS[selectedPerk].buttonLabel)}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default PerkList
