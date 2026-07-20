import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCharacter } from '@/app/contexts/CharacterContext';
import ActiveEffectsDisplay from '@/app/tabs/ActiveEffectsDisplay.tsx';
import Skill from './components/Skill';
import DamageReductionDisplay from './components/DamageReductionDisplay';
import { usePopup } from '@/app/contexts/PopupContext.tsx';
import { SPECIAL, useSpecialPoints } from '@/features/character/special/special.ts';
import { SKILLS, useSkillPoints } from '@/features/character/skills/skills.ts';
import { useSpecialtyPoints } from '@/features/character/specialties.ts';
import StatGear from '@/app/components/StatGear.tsx';

function StatTab() {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const { character } = useCharacter();
    const { showNd6Popup, showNd20Popup } = usePopup();

    // THIS SHOULD BE THE CORRECT WAY TO HANDLE SORTING USING DIFFERENT LANGUAGES
    const sortedSkills = useMemo(
        () => Object.values(SKILLS).sort((a, b) => t(a).localeCompare(t(b))),
        [t],
    );
    const specialPoints = useSpecialPoints(character);
    const skillPoints = useSkillPoints(character);
    const specialtyPoints = useSpecialtyPoints(character);

    const bonusSpecialtyPoints = specialtyPoints.bonus.reduce(
        (acc, b) => {
            acc += b.remaining
            return acc;
        }, 0)


    let pointsClasses = 'row l-distributed';
    pointsClasses +=
        bonusSpecialtyPoints <= 0
            ? ' l-lastSmall'
            : '';


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
                            specialtyPoints.generic < 0
                                ? {
                                      color: 'var(--failure-color)',
                                  }
                                : {}
                        }
                        className={pointsClasses}
                    >
                        <span className="h4">{t('availableSpecialtyPoints')}</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="h4">
                                {specialtyPoints.generic}
                                {bonusSpecialtyPoints > 0
                                    ? ` (${t('any')})`
                                    : ''}
                            </span>
                            {specialtyPoints.bonus
                                .map(b => {
                                    if (b.remaining > 0) {
                                        return (
                                            <span key={b.skills.toString()} className="h5">
                                                {b.remaining} (
                                                {b.skills
                                                    .map(s => t(s))
                                                    .join(', ')}
                                                )
                                            </span>
                                        );
                                    }
                                    return null;
                                })}
                        </div>
                    </div>
                </div>
            )}

            <div id="c-special">
                {SPECIAL.map(specialName => (
                    <StatGear
                        key={specialName}
                        statType={specialName}
                        isEditing={isEditing}
                    />
                ))}
            </div>

            {/* Derived Stats */}
            <div className="row l-spaceEvenly">
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
                        {character.meleeDamage.toLocaleString(undefined, { signDisplay: 'exceptZero' })}
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
                <div className={'row l-lastSmall l-spaceBetween'}>
                    <div
                        style={{
                            fontSize: '2rem',
                            marginTop: '2rem',
                        }}
                        className="form-label"
                    >
                        {t('skills')}
                    </div>
                    <div className={'row'} style={{ width: 'auto' }}>
                        <button
                            style={{ flexShrink: 0 }}
                            onClick={() => showNd6Popup({ title: 'Nd6' })}
                        >
                            <i className={'fas fa-dice-d6 fa-xl'} />
                        </button>
                        <button
                            style={{ flexShrink: 0 }}
                            onClick={() => showNd20Popup({ title: 'Nd20' })}
                        >
                            <i className={'fas fa-dice-d20 fa-xl'} />
                        </button>
                    </div>
                </div>
                <section
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: 'var(--space-s)',
                        width: '100%',
                    }}
                >
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

export default StatTab;
