import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useCharacter } from '@/contexts/CharacterContext'
import { usePopup } from '@/contexts/popup/PopupContext'
import GenericGear from './components/GenericGear'
import { CharacterItem, CompanionId } from '@/types'
import { getGameDatabase } from '@/hooks/getGameDatabase'
import { COMPANION_TYPES } from '@/utils/companionTypes'
import useInputNumberState from '@/hooks/useInputNumberState.ts';

// Companion-specific perks (different from character perks)
const COMPANION_PERKS = [
    'perkAttackDog',
    'perkPackMule',
    'perkScout',
    'perkRepairBot',
    'perkLoyalCompanion',
    'perkProtector'
]

const COMPANION_MAP: Record<string, CompanionId[]> = {
    "perkDogmeat": ["dog"],
    "perkRobotWrangler": ["eyebot"] // TODO add more
}

/**
 * Companion Tab - Shows companion stats and info
 * Visible when player has a companion (controlled by perk in future)
 */
function CompanionTab() {
    const { t } = useTranslation()
    const { character, updateCharacter } = useCharacter()
    const companion = character.companion! // TODO better check for companion existence
    const { showD20Popup } = usePopup()
    const dataManager = getGameDatabase()
    const [isEditing, setIsEditing] = useState(false)

    // Local state for HP input (to allow empty string for deletion)
    const [hpInput, setHpInput] = useInputNumberState(companion.currentHp)

    // Update hpInput when companion.currentHp changes (e.g., when loading a character)
    useEffect(() => {
        setHpInput(companion.currentHp)
    }, [companion.currentHp])

    // Memoize selectedCompanionType
    const selectedCompanionType = useMemo(
        () => COMPANION_TYPES[companion.type],
        [companion.type]
    )

    // Calculate perk slots: 1 every 5 levels
    const perkSlots = Math.floor(character.level / 5)

    const bodyBonus = companion.special.body - selectedCompanionType.special.body
    const maxHp = selectedCompanionType.baseHp + (character.level - 1) + bodyBonus

    const [ selectedPerks, setSelectedPerks ] = useState<(string | undefined)[]>(() => { // TODO CompanionPerkType
        return [
            ...companion.perks,
            ...new Array(perkSlots - companion.perks.length).fill(undefined)
        ]
    })

    // Handle perk selection
    const handlePerkChange = (slotIndex: number, perkId: string) => {
        const newPerks = [...selectedPerks]
        newPerks[slotIndex] = perkId === 'none' ? undefined : perkId
        setSelectedPerks(newPerks)
        updateCharacter({
            companion: { ...companion, perks: newPerks.filter(p => p !== undefined) }
        })
    }

    const getAvailablePerksForSlot = (currentSlotIndex: number): string[] => {
        return COMPANION_PERKS.filter(perk => {
            if (companion.perks[currentSlotIndex] === perk) {
                return true
            }
            // Don't allow selecting same perk in multiple slots
            return !companion.perks.some((selected, index) => index !== currentSlotIndex && selected === perk)
        })
    }

    // Handle attack click - opens D20 popup with companion weapon (no ammo consumption)
    const handleAttackClick = (attackItem: CharacterItem) => {
        // Find the weapon definition in companion type to get the correct skill
        const companionWeapon = selectedCompanionType.weapons.find(w => w.id === attackItem.id)
        if (companionWeapon) {
            // Use the skill defined in companion type (melee/guns/other)
            showD20Popup(companionWeapon.skill, attackItem, 'companion');
        }
    }

    // Calculate available companion SPECIAL points
    const companionSpecialPoints = Math.floor((character.level - 1) / 2)
    const baseSpecialSum = selectedCompanionType.special.body + selectedCompanionType.special.mind
    const currentSpecialSum = companion.special.body + companion.special.mind
    const usedSpecialPoints = currentSpecialSum - baseSpecialSum
    const remainingSpecialPoints = companionSpecialPoints - usedSpecialPoints

    return (
        <section className="tabContent">
            {/* Companion Type Selector */}
            <div className="row l-spaceBetween" style={{ marginBottom: '0.3rem' }}>
                <select
                    value={companion.type}
                    onChange={e =>
                        updateCharacter({
                            companion: { ...companion, type: e.target.value as CompanionId },
                        })
                    }
                    style={{ flex: 1 }}
                >
                    {Object.entries(COMPANION_MAP)
                        .reduce((acc, [perk, types]) => {
                            if (character.perks?.includes(perk)) {
                                acc.push(...types);
                            }
                            return acc;
                        }, [] as CompanionId[])
                        .map(type => (
                            <option key={type} value={type}>
                                {t(type)}
                            </option>
                        ))}
                </select>
            </div>

            {/* Companion Name (editable) and HP */}
            <div className="row l-spaceBetween" style={{ marginBottom: '0.5rem' }}>
                <input
                    type="text"
                    value={companion.name}
                    onChange={e =>
                        updateCharacter({
                            companion: { ...companion, name: e.target.value },
                        })
                    }
                    placeholder={t(companion.type)}
                    style={{ flex: 1, marginRight: '0.5rem' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span>{t('hp')}:</span>
                    <input
                        type="number"
                        value={hpInput}
                        onChange={e => {
                            const value = e.target.value;
                            // Allow empty string temporarily
                            if (value === '') {
                                setHpInput('');
                                return;
                            }
                            const numValue = Number(value);
                            if (!Number.isNaN(numValue) && numValue >= 0) {
                                setHpInput(numValue);
                                updateCharacter({
                                    companion: { ...companion, currentHp: numValue },
                                });
                            }
                        }}
                        onBlur={() => {
                            // On blur, if empty or invalid, restore previous value
                            if (hpInput === '' || hpInput < 0) {
                                setHpInput(companion.currentHp);
                            }
                        }}
                        style={{ width: '3rem', textAlign: 'center' }}
                    />
                    <span>/{maxHp}</span>
                </div>
            </div>

            {/* Available SPECIAL Points (only when editing) */}
            {isEditing && (
                <div
                    className="inventory-list__controls row l-distributed"
                    style={remainingSpecialPoints < 0 ? { color: 'var(--failure-color)' } : {}}
                >
                    <span className="h4">{t('availableSpecial')}</span>
                    <span className="h4">{remainingSpecialPoints}</span>
                </div>
            )}

            {/* BODY/MIND Stats */}
            <div id="c-special" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <GenericGear
                    statType="body"
                    baseValue={selectedCompanionType.special.body}
                    isEditing={isEditing}
                />
                <GenericGear
                    statType="mind"
                    baseValue={selectedCompanionType.special.mind}
                    isEditing={isEditing}
                />
            </div>

            {/* Edit Stats Button - Right after SPECIAL/BODY-MIND */}
            <button
                className="button"
                onClick={() => setIsEditing(!isEditing)}
                style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}
            >
                {isEditing ? t('stopEditing') : t('editStats')}
            </button>

            {/* Compact Stats Row: Melee/Guns/Other + Init/Def */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {/* Skills Column */}
                <div>
                    <h4 style={{ marginBottom: '0.3rem', fontSize: '0.9rem' }}>{t('skills')}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {(['melee', 'guns', 'other'] as const).map(skillType => {
                            const baseValue = selectedCompanionType.skills[skillType];
                            return (
                                <div
                                    key={skillType}
                                    className="skill"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        if (isEditing) {
                                            const current = companion.skills[skillType];
                                            const next = current < 6 ? current + 1 : baseValue;
                                            updateCharacter({
                                                companion: {
                                                    ...companion,
                                                    skills: {
                                                        ...companion.skills,
                                                        [skillType]: next,
                                                    },
                                                },
                                            });
                                        } else {
                                            // Roll a d20 using the companion's sheet for this skill
                                            showD20Popup(skillType, null, 'companion');
                                        }
                                    }}
                                >
                                    <span>
                                        <b>{t(skillType)}</b>
                                    </span>
                                    <span>{companion.skills[skillType]}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Derived Stats Column (with Level) */}
                <div>
                    <h4 style={{ marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                        {t('derivedStats')}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div className="skill" style={{ cursor: 'default' }}>
                            <span>
                                <b>{t('level')}</b>
                            </span>
                            <span>{character.level}</span>
                        </div>
                        <div className="skill" style={{ cursor: 'default' }}>
                            <span>
                                <b>{t('initiative')}</b>
                            </span>
                            <span>{character.initiative}</span>
                        </div>
                        <div className="skill" style={{ cursor: 'default' }}>
                            <span>
                                <b>{t('defense')}</b>
                            </span>
                            <span>{selectedCompanionType.baseDefense}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Damage Reduction by Type */}
            <div style={{ marginTop: '0.5rem' }}>
                <h4 style={{ marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                    {t('damageReductionFull')}
                </h4>
                <div className="row row--spaced">
                    <div className="derived-stat">
                        <span>
                            <i className="fas fa-shield-halved" title={t('physical')}></i>
                        </span>
                        <DRValue value={selectedCompanionType.baseDR.physical} />
                    </div>
                    <div className="derived-stat">
                        <span>
                            <i className="fas fa-bolt" title={t('energy')}></i>
                        </span>
                        <DRValue value={selectedCompanionType.baseDR.energy} />
                    </div>
                    <div className="derived-stat">
                        <span>
                            <i className="fas fa-radiation" title={t('radiation')}></i>
                        </span>
                        <DRValue value={selectedCompanionType.baseDR.radiation} />
                    </div>
                    <div className="derived-stat">
                        <span>{t('poison')}</span>
                        <DRValue value={selectedCompanionType.baseDR.poison} />
                    </div>
                </div>
            </div>

            {/* Attack Items - Clickable */}
            <div style={{ marginTop: '0.5rem' }}>
                <h4 style={{ marginBottom: '0.3rem', fontSize: '0.9rem' }}>{t('attacks')}</h4>
                <section>
                    {companion.items.map((attack, index) => {
                        const weaponData = dataManager.getItem(attack.id);
                        const displayName =
                            attack.customName || (weaponData ? t(weaponData.ID) : 'Unknown');

                        return (
                            <div
                                key={index}
                                className="skill"
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleAttackClick(attack)}
                            >
                                <span>
                                    <b>{displayName}</b>
                                </span>
                                {weaponData && dataManager.isType(weaponData, 'weapon') && (
                                    <>
                                        <span>{weaponData.DAMAGE_RATING}CD</span>
                                        <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                            {weaponData.EFFECTS.join(', ') || '-'}
                                        </span>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </section>
            </div>

            {/* Perks - Selectable */}
            <div style={{ marginTop: '0.5rem' }}>
                <h4 style={{ marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                    {t('perks')} ({companion.perks.filter(Boolean).length}/{perkSlots})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {Array.from({ length: perkSlots }, (_, index) => {
                        const selectedPerk = companion.perks[index];
                        const availablePerks = getAvailablePerksForSlot(index);

                        return (
                            <div
                                key={index}
                                style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}
                            >
                                {/* Perk Selector */}
                                <select
                                    value={selectedPerk || 'none'}
                                    onChange={e => handlePerkChange(index, e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        fontSize: '0.9rem',
                                        fontWeight: selectedPerk ? 'bold' : 'normal',
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

                                {/* Perk Description */}
                                {selectedPerk && (
                                    <div
                                        style={{
                                            padding: '0.5rem',
                                            backgroundColor: 'var(--button-background)',
                                            border: 'var(--border-primary-thin)',
                                            borderRadius: '3px',
                                            fontSize: '0.75rem',
                                            lineHeight: '1.4',
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
        </section>
    );
}

const DRValue = ({ value }: { value: number }) => {
    const { t } = useTranslation()

    return (
        <span>
            {value === Infinity
                ? <i className="fas fa-infinity" aria-label={t('immune')} title={t('immune')} />
                : value}
        </span>
    )
}

export default CompanionTab

