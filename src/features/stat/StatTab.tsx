import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useCharacter } from '@/contexts/CharacterContext'
import ActiveEffectsDisplay from '@/features/ActiveEffectsDisplay.tsx'
import Skill from './components/Skill'
import DamageReductionDisplay from './components/DamageReductionDisplay'
import SpecialGear from './components/SpecialGear.tsx'
import { SKILLS, SPECIAL } from '@/services/character/utils.ts';

function StatTab() {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const { rawCharacter, character } = useCharacter();

    // THIS SHOULD BE THE CORRECT WAY TO HANDLE SORTING USING DIFFERENT LANGUAGES
    const sortedSkills = useMemo(
        () => Object.values(SKILLS).sort((a, b) => t(a).localeCompare(t(b))),
        [t],
    );
    const specialPoints = useMemo(() => {
        const baseSpecialSum = 7 * 4;
        const specialSum = Object.values(character.special).reduce(
            (total, value) => total + value,
            0,
        );
        const usedPoints = specialSum - baseSpecialSum;
        const giftedBonus = character.traits.includes('traitGifted') ? 2 : 0;
        const intenseTrainingBonus = character.perks.filter(
            p => p === 'perkIntenseTraining',
        ).length;
        return 12 + giftedBonus + intenseTrainingBonus - usedPoints;
    }, [character.perks, character.special, character.traits]);

    const skillPoints = useMemo(() => {
        const skillSum = Object.values(rawCharacter?.skills ?? {}).reduce(
            (total, value) => total + value,
            0,
        );
        const skilledBonus = character.perks.filter(p => p === 'perkSkilled').length * 2;
        return 9 + character.special.intelligence + (character.level - 1) + skilledBonus - skillSum;
    }, [character.level, character.perks, character.special.intelligence, rawCharacter?.skills]);

    const goodNaturedSkills = ['speech', 'medicine', 'repair', 'science', 'barter'];
    const hasGoodNatured = useMemo(
        () => character.traits.includes('traitGoodNatured'),
        [character.traits],
    );
    const { specialties, bonusSpecialties } = useMemo(
        () =>
            character.specialties.reduce(
                (acc, s) => {
                    if (goodNaturedSkills.includes(s)) {
                        acc.bonusSpecialties++;
                    } else {
                        acc.specialties++;
                    }
                    return acc;
                },
                { specialties: 0, bonusSpecialties: 0 },
            ),
        [character.specialties],
    );
    const bonusSpecialtyPoints = hasGoodNatured ? 2 : 0;
    const specialtyPoints = useMemo(() => {
        return (
            3 +
            character.traits.filter(p => p === 'traitEducated').length +
            (character.origin.id === 'ghoul' ? 1 : 0)
        ); // Ghoul has Survival as extra specialty
    }, [character.traits, character.origin]);
    const remainingBonusSpecialtyPoints = Math.max(0, bonusSpecialtyPoints - bonusSpecialties);
    const bonusSpecialtyOverflow = Math.max(0, bonusSpecialties - bonusSpecialtyPoints);
    const remainingSpecialtyPoints = specialtyPoints - specialties - bonusSpecialtyOverflow;

    let pointsClasses = 'row l-distributed';
    pointsClasses += remainingBonusSpecialtyPoints <= 0 ? ' l-lastSmall' : '';

    const meleeDamageBonus =
        character.meleeDamage + character.traits.filter(p => p === 'traitHeavyHanded').length;

    return (
        <section className="tabContent">
            {/* SPECIAL Stats */}

            {isEditing && (
                <div className="inventory-list__controls stack">
                    <div
                        style={specialPoints < 0 ? { color: 'var(--failure-color)' } : {}}
                        className={pointsClasses}
                    >
                        <span className="h4">{t('availableSpecial')}</span>
                        <span className="h4">{specialPoints}</span>
                    </div>
                    <div
                        style={skillPoints < 0 ? { color: 'var(--failure-color)' } : {}}
                        className={pointsClasses}
                    >
                        <span className="h4">{t('availableSkillPoints')}</span>
                        <span className="h4">{skillPoints}</span>
                    </div>
                    <div
                        style={
                            remainingSpecialtyPoints < 0 ? { color: 'var(--failure-color)' } : {}
                        }
                        className={pointsClasses}
                    >
                        <span className="h4">{t('availableSpecialtyPoints')}</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="h4">
                                {remainingSpecialtyPoints}
                                {remainingBonusSpecialtyPoints > 0 ? ` (${t('any')})` : ''}
                            </span>
                            {remainingBonusSpecialtyPoints > 0 && (
                                <span className="h5">
                                    {remainingBonusSpecialtyPoints} (
                                    {goodNaturedSkills.map(s => t(s)).join(', ')})
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div id="c-special">
                {SPECIAL.map(specialName => (
                    <SpecialGear
                        key={specialName}
                        specialType={specialName}
                        isEditing={isEditing}
                    />
                ))}
            </div>

            {/* Derived Stats */}
            <div className="row row--spaced">
                <div className="derived-stat">
                    <span>{t('defense')}</span>
                    <span>{character.defense}</span>
                </div>
                <div className="derived-stat">
                    <span>{t('initiative')}</span>
                    <span>{character.initiative}</span>
                </div>
                <div className="derived-stat">
                    <span>{t('melee-damage')}</span>
                    <span>
                        {meleeDamageBonus.toLocaleString(undefined, { signDisplay: 'exceptZero' })}
                    </span>
                </div>
            </div>

            {!isEditing && (
                <>
                    {/* Damage Reduction Display */}
                    <DamageReductionDisplay />

                    {/* Active Effects from Equipped Armor */}
                    <ActiveEffectsDisplay />
                </>
            )}

            {/* Skills Section */}
            {/* TODO: Could sort skills in different ways other than alphabetically */}
            <div>
                <h1 className="form-label">Skills:</h1>
                <section>
                    {sortedSkills.map(skillId => {
                        return <Skill key={skillId} skillId={skillId} isEditing={isEditing} />;
                    })}
                </section>
            </div>

            {/* Edit Stats Button */}
            <button className="button" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? t('stopEditing') : t('editStats')}
            </button>
        </section>
    );
}

export default StatTab
