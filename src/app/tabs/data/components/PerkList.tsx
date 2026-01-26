import { useTranslation } from 'react-i18next';
import { useCharacter } from '@/contexts/CharacterContext.tsx';
import { useEffect, useState } from 'react';
import { getGameDatabase } from '@/hooks/getGameDatabase.ts';
import { SpecialType } from '@/types';

function PerkList() {
    const dataManager = getGameDatabase()
    const { t } = useTranslation()
    const { character, updateCharacter } = useCharacter()
    const numberOfPerks = character.level + (character.traits.includes("traitExtraPerk") ? 1 : 0)

    // Initialize perks from rawCharacter or create empty slots
    const [selectedPerks, setSelectedPerks] = useState<(string | undefined)[]>([]);
    const [allPerks, setAllPerks] = useState<string[]>([])


    useEffect(() => {
        const allPerks = Object.values(dataManager.perks)
            .filter(perk => {
                const req = perk.REQUISITES
                return Object.entries(req).every(([key, value]) => {
                    if(key === 'level') {
                        return character.level >= Number(value)
                    }
                    if(key in character.special){
                        return character.special[key as SpecialType] >= Number(value)
                    }
                    return false
                })
            })
            .map(perk => perk.ID).sort((a, b) => t(a).localeCompare(t(b)))
        setAllPerks(allPerks)
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
            const isSelectedInOtherSlot = selectedPerks.some(
                (selected, index) => index !== currentSlotIndex && selected === perk
            );
            return !isSelectedInOtherSlot;
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
                                    {t(selectedPerk + 'Description')}
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
