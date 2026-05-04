import { useMemo, useState } from 'react';
import { MYSTERIOUS_STRANGER, useCharacter } from '@/contexts/CharacterContext.tsx';
import { useTranslation } from 'react-i18next';
import { Character, CharacterItem, CompanionData, TraitId } from '@/types';
import {
    COMPANION_SPECIAL,
    CompanionSkillType,
    CompanionSpecialType,
    getSpecialFromSkill,
    getSpecialFromSkillCompanion,
    isCharacterSkill,
    isCharacterSpecial,
    isCompanionSkill,
    isCompanionSpecial,
    SkillType,
    SPECIAL,
    SpecialType,
} from '@/services/character/utils.ts';
import { getGameDatabase, getModifiedItemData } from '@/hooks/getGameDatabase.ts';
import BasePopup from '@/components/popup/common/BasePopup.tsx';
import { RollerType, usePopup } from '@/contexts/popup/PopupContext.tsx';
import useDice from '@/utils/useDice.ts';
import { D20Dice } from '@/components/popup/dice/components/dice.tsx';

// Discriminated union — built from actual domain types, no invented duplicates.
interface PlayerRollerStats extends Pick<Character,
    'special' | 'skills' | 'specialties' | 'traits' | 'currentLuck' | 'currentHp' | 'companion' | 'items'
> {
    kind: 'player';
}
interface CompanionRollerStats extends Pick<CompanionData, 'special' | 'skills' | 'currentHp' | 'items'> {
    kind: 'companion';
}
interface StrangerRollerStats {
    kind: 'stranger';
    special: Record<SpecialType, number>;
    skills: Record<SkillType, number>;
    specialties: SkillType[];
    traits: TraitId[];
    items: CharacterItem[];
}
type RollerStats = PlayerRollerStats | CompanionRollerStats | StrangerRollerStats;

export interface D20PopupProps {
    skillId: SkillType | CompanionSkillType;
    roller?: RollerType;
    usingItem?: CharacterItem | undefined;
    onClose: () => void;
}

function D20Popup({
    skillId,
    usingItem,
    roller,
    onClose,
}: Readonly<D20PopupProps>) {
    const { t } = useTranslation();
    const dataManager = getGameDatabase();
    const { showD6Popup } = usePopup();
    const { character, updateCharacter } = useCharacter();

    const activePerks = character.perks;

    // perkAdrenalineRush: treat STR as 10 when HP < max — immutable copy
    const hasAdrenalineRush = activePerks.includes('perkAdrenalineRush');
    const effectiveSpecial: Record<SpecialType, number> =
        hasAdrenalineRush && character.currentHp < character.maxHp
            ? { ...character.special, strength: 10 }
            : character.special;

    const currentLuck = character.currentLuck;
    const isCompanion = roller === 'companion';
    const isMysteriousStranger = roller === 'mysteriousStranger';

    // Build discriminated roller stats from real typed objects — no 'as'
    const rollerStats: RollerStats = (() => {
        if (isCompanion && character.companion) {
            const stats: CompanionRollerStats = { kind: 'companion', ...character.companion };
            return stats;
        }
        if (isMysteriousStranger) {
            const stats: StrangerRollerStats = { kind: 'stranger', ...MYSTERIOUS_STRANGER };
            return stats;
        }
        const stats: PlayerRollerStats = { kind: 'player', ...character, special: effectiveSpecial };
        return stats;
    })();

    // Traits are only available on player / stranger rollers — use the roller's own traits, not always the player's
    const rollerTraits: TraitId[] = rollerStats.kind !== 'companion' ? rollerStats.traits : [];

    // Get weapon data with mods applied
    const itemData = getModifiedItemData(usingItem, activePerks);

    // State
    const [isUsingLuck, setIsUsingLuck] = useState(false);
    const [isAiming, setIsAiming] = useState(false);
    const [hasRolled, setHasRolled] = useState(false);

    // hasTriggerDiscipline is a cheap boolean derivation — no useMemo needed
    const hasTriggerDiscipline =
        rollerTraits.includes('traitTriggerDiscipline') &&
        ['smallGuns', 'energyWeapons'].includes(skillId);

    // perkCenterOfMass: applies only to ranged attacks by the player (not melee/unarmed, not companion/stranger)
    // isCharacterSkill narrows skillId to SkillType, removing the need for any cast
    const isCenterOfMassRanged =
        !roller &&
        activePerks.includes('perkCenterOfMass') &&
        dataManager.isType(itemData, 'weapon') &&
        isCharacterSkill(skillId) &&
        !['meleeWeapons', 'unarmed'].includes(skillId);

    // "Hit Torso?" checkbox for perkCenterOfMass: starts checked, locked after rolling.
    const [hitTorso, setHitTorso] = useState(true);

    // Free reroll: the perk grants +1 reroll discount whenever Torso is targeted.
    const hasCenterOfMassDiscount = isCenterOfMassRanged && hitTorso;

    let diceNumber: number;
    if (isMysteriousStranger) {
        diceNumber = 3;
    } else if (isCompanion) {
        diceNumber = 2;
    } else {
        diceNumber = 5;
    }

    const [diceValues, setDiceValues, diceActive, setDiceActive, diceRerolled, setDiceRerolled] =
        useDice(
            diceNumber,
            roller ? diceNumber : 2,
            roller ? diceNumber : 0,
        );

    const [initialApCost, setInitialApCost] = useState(0);

    // Derive default specials without 'as' — use existing type guards
    const defaultPlayerSpecial: SpecialType = isCharacterSkill(skillId)
        ? getSpecialFromSkill(skillId)
        : 'strength';
    const defaultCompanionSpecial: CompanionSpecialType = isCompanionSkill(skillId)
        ? getSpecialFromSkillCompanion(skillId)
        : 'body';

    const [selectedSpecial, setSelectedSpecial] = useState<SpecialType | CompanionSpecialType>(
        isCompanion ? defaultCompanionSpecial : defaultPlayerSpecial,
    );
    // 'luck' is itself a SpecialType, so the union stays SpecialType | CompanionSpecialType
    const activeSpecialId: SpecialType | CompanionSpecialType = isUsingLuck ? 'luck' : selectedSpecial;

    // Narrow to the correct record type via type guards — no 'as' required
    let specialValue: number;
    let skillValue: number;
    let hasSpecialty = false;

    if (rollerStats.kind === 'companion') {
        const cSpecial = isCompanionSpecial(activeSpecialId) ? activeSpecialId : 'body';
        const cSkill = isCompanionSkill(skillId) ? skillId : 'guns';
        specialValue = rollerStats.special[cSpecial];
        skillValue = rollerStats.skills[cSkill];
    } else {
        const pSpecial = isCharacterSpecial(activeSpecialId) ? activeSpecialId : 'strength';
        const pSkill = isCharacterSkill(skillId) ? skillId : 'smallGuns';
        specialValue = rollerStats.special[pSpecial];
        skillValue = rollerStats.skills[pSkill];
        if (isCharacterSkill(skillId)) {
            hasSpecialty = rollerStats.specialties.includes(skillId);
        }
    }

    const targetNumber = skillValue + specialValue;
    const criticalValue = hasSpecialty ? skillValue : 1;

    const extraComplications = [];
    let baseComplication = 20;
    if (dataManager.isType(itemData, 'weapon')) {
        if (itemData.QUALITIES.includes('qualityUnreliable')) {
            baseComplication -= 1;
        }
        if (
            rollerTraits.includes('traitHeavyHanded') &&
            ['meleeWeapons', 'unarmed'].includes(skillId)
        ) {
            extraComplications.push(19);
        }
        if (
            rollerTraits.includes('traitGrunt') &&
            ['energyWeapons', 'bigGuns'].includes(skillId)
        ) {
            baseComplication -= 2;
        }
    }
    const complicationValue = Math.min(baseComplication, ...extraComplications);

    // AP Cost calculation — relevant only for roller = undefined
    const getApCost = () => {
        if (hasRolled) {
            return initialApCost;
        }
        const activeDiceCount = diceActive.filter(Boolean).length;
        switch (activeDiceCount) {
            case 5: return 6;
            case 4: return 3;
            case 3: return 1;
            default: return 0;
        }
    };

    const luckCost = useMemo(() => {
        if (roller) {
            if (isMysteriousStranger && !hasRolled) {
                return 1;
            }
            return 0;
        }
        if (hasRolled) {
            const rerollingCount = diceActive.filter(Boolean).length;
            const rerolledCount = diceRerolled.filter(Boolean).length;

            let cost = rerollingCount;
            let discount = 0;
            if (isAiming) { discount += 1; }
            if (hasTriggerDiscipline) { discount += 1; }
            if (hasCenterOfMassDiscount) { discount += 1; }
            discount -= Math.min(discount, rerolledCount);
            cost -= discount;

            return Math.max(0, cost);
        }
        return isUsingLuck ? 1 : 0;
    }, [diceActive, diceRerolled, isAiming, isUsingLuck, hasRolled, roller, isMysteriousStranger, hasTriggerDiscipline, hasCenterOfMassDiscount]);

    // Success calculation
    const getSuccesses = () => {
        if (!hasRolled) { return '?'; }
        let successes = 0;
        diceValues.forEach(value => {
            const nVal = Number(value);
            if (nVal <= targetNumber) { successes++; }
            if (nVal <= criticalValue) { successes++; }
        });
        return successes;
    };

    const handleDiceClick = (index: number) => {
        if (roller || (hasRolled && (diceValues[index] === '?' || diceRerolled[index]))) {
            return;
        }
        setDiceActive(prev => {
            const newActive = [...prev];
            if (hasRolled) {
                newActive[index] = !prev[index];
            } else {
                const willBeActive = !prev[index];
                for (let i = 0; i < newActive.length; i++) {
                    const alwaysActive = i <= 1;
                    if (i < index) {
                        newActive[i] = true;
                    } else if (i === index) {
                        newActive[i] = alwaysActive || willBeActive;
                    } else {
                        newActive[i] = alwaysActive;
                    }
                }
            }
            return newActive;
        });
    };

    const handleRoll = () => {
        if (roller && hasRolled) { return; }
        const activeDiceCount = diceActive.filter(Boolean).length;
        if (activeDiceCount === 0) {
            alert(t('selectDiceAlert') || 'Select at least one die!');
            return;
        }
        if (currentLuck < luckCost) {
            alert(t('notEnoughLuckAlert') || 'Not enough luck!');
            return;
        }

        setInitialApCost(getApCost());

        const newValues = [...diceValues];
        const newRerolled = [...diceRerolled];
        diceActive.forEach((isActive, index) => {
            if (isActive) {
                newValues[index] = Math.floor(Math.random() * 20) + 1;
                if (hasRolled) { newRerolled[index] = true; }
            }
        });

        setDiceValues(newValues);
        setDiceRerolled(newRerolled);
        setHasRolled(true);
        setDiceActive(Array.from(diceActive).fill(false));

        if (luckCost > 0) {
            updateCharacter({ currentLuck: currentLuck - luckCost });
        }
    };

    if (!skillId) { return null; }

    function toggleAiming(checked: boolean) {
        if (
            dataManager.isType(itemData, 'weapon') &&
            itemData.QUALITIES.includes('qualityInaccurate')
        ) {
            return;
        }
        setIsAiming(checked);
    }

    return (
        <BasePopup
            title={skillId}
            onClose={onClose}
            footerChildren={
                <>
                    {/* Reroll button  */}
                    {(!roller || !hasRolled) && (
                        <button
                            className="confirmButton"
                            onClick={handleRoll}
                            disabled={
                                hasRolled &&
                                (diceActive.filter(Boolean).length === 0 || luckCost > currentLuck)
                            }
                        >
                            {t(hasRolled ? 'reroll' : 'roll')}
                        </button>
                    )}

                    {/* Damage button */}
                    {itemData && (!roller || hasRolled) && (
                        <button
                            className="confirmButton"
                            onClick={() => {
                                if (!usingItem) {
                                    return;
                                }
                                const damageItem = usingItem || {
                                    id: itemData.ID,
                                    quantity: 1,
                                    equipped: false,
                                    mods: [],
                                };
                                showD6Popup({usingItem: damageItem, hasAimed: isAiming, roller: roller, hitTorso: isCenterOfMassRanged && hitTorso});
                            }}
                            /* TODO Companions SHOULD use ammo too */
                            disabled={!hasRolled}
                        >
                            {t('damage')}
                        </button>
                    )}
                </>
            }
        >
            {/* Special selection */}
            <div className="row l-lastSmall">
                <select
                    value={isUsingLuck ? 'luck' : selectedSpecial}
                    onChange={e => {
                        const val = e.target.value;
                        if (isCharacterSpecial(val) || isCompanionSpecial(val)) {
                            setSelectedSpecial(val);
                        }
                    }}
                    disabled={hasRolled || isUsingLuck || isMysteriousStranger}
                    aria-label="Special to use?"
                >
                    {(isCharacterSkill(skillId) ? SPECIAL : COMPANION_SPECIAL).map(sv => (
                        <option key={sv} value={sv}>
                            {t(sv)}
                        </option>
                    ))}
                </select>
                {!roller && (
                    <input
                        type="checkbox"
                        className="themed-svg"
                        data-icon="luck"
                        checked={isUsingLuck}
                        onChange={e => setIsUsingLuck(e.target.checked)}
                        disabled={hasRolled}
                        aria-label="Use Luck"
                    />
                )}
            </div>

            <hr />

            <div className={'stack no-gap'}>
                <span className="h2">Target: {targetNumber}</span>
                <span className="h5">
                    {skillValue} (Skill) + {specialValue} ({t(activeSpecialId)})
                </span>
                <span className="h5">
                    Critical Hit: Roll {criticalValue > 1 ? `≤` : `=`} {criticalValue}
                </span>
            </div>

            <hr />

            <div className={'row'} style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                {diceValues.map((value, index) => (
                    <D20Dice
                        key={index}
                        value={value}
                        minComplication={complicationValue}
                        maxCritical={criticalValue}
                        isActive={diceActive[index]!}
                        isRerolled={diceRerolled[index]!}
                        onClick={() => handleDiceClick(index)}
                        biggerDie={isMysteriousStranger || isCompanion || index < 2}
                    />
                ))}
            </div>

            <div className="row l-distributed l-lastSmall">
                <span>{t('apCost')}</span>
                <span>{getApCost()}</span>
            </div>

            {!isMysteriousStranger &&
                !isCompanion &&
                dataManager.isType(itemData, 'weapon') && ( // Show Aim only when rolling for a weapon
                    <div className="row l-distributed l-lastSmall">
                        <span>{t('aim')}?</span>
                        <div>
                            <input
                                type="checkbox"
                                className="themed-svg"
                                data-icon="attack"
                                checked={isAiming}
                                disabled={hasRolled}
                                onChange={e => toggleAiming(e.target.checked)}
                                aria-label="Aim"
                            />
                        </div>
                    </div>
                )}

            {/* Center of Mass: Hit Torso? checkbox – visible only for ranged weapons */}
            {isCenterOfMassRanged && (
                <div className="row l-distributed l-lastSmall">
                    <span>{t('hitTorso')}</span>
                    <input
                        type="checkbox"
                        className="themed-svg"
                        data-icon="attack"
                        checked={hitTorso}
                        onChange={e => setHitTorso(e.target.checked)}
                        disabled={hasRolled}
                        aria-label={t('hitTorso')}
                    />
                </div>
            )}
            {!isCompanion && (
                <div className="row l-distributed l-lastSmall">
                    <span>{t('luckCost')}</span>
                    <div className="row l-centered">
                        <span>
                            {luckCost} / {currentLuck}
                        </span>
                    </div>
                </div>
            )}

            <hr />

            <span className="h3">
                {t('successes')}: {getSuccesses()}
            </span>
        </BasePopup>
    );
}

export default D20Popup;
