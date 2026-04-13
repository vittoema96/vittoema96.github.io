import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useCharacter } from '@/contexts/CharacterContext'
import ActiveEffectsDisplay from '@/features/ActiveEffectsDisplay.tsx'
import Skill from './components/Skill'
import DamageReductionDisplay from './components/DamageReductionDisplay'
import SpecialGear from './components/SpecialGear.tsx'
import { SKILLS, SkillType, SPECIAL } from '@/services/character/utils.ts';
import { ORIGINS } from '@/services/character/Origin.ts';
import { usePopup } from '@/contexts/popup/PopupContext.tsx';

function StatTab() {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const { rawCharacter, character } = useCharacter();
    const { showNd6Popup, showNd20Popup } = usePopup()

    // THIS SHOULD BE THE CORRECT WAY TO HANDLE SORTING USING DIFFERENT LANGUAGES
    const sortedSkills = useMemo(
        () => Object.values(SKILLS).sort((a, b) => t(a).localeCompare(t(b))),
        [t],
    );
    const specialPoints = useMemo(() => {
        const baseSpecialSum = 7 * 4  // All special (7) start at 4
            + (character.origin === ORIGINS.SUPER_MUTANT ? 4 : 0); // Supermutant has +2 in Str and End
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


    const BONUS_SPECIALTIES = {
        goodNatured: {
            skills: ['speech', 'medicine', 'repair', 'science', 'barter'] as SkillType[],
            points: 2,
            active: character.traits.includes("traitGoodNatured")
        },
        brotherhoodInitiate: {
            skills: ['energyWeapons', 'science', 'repair'] as SkillType[],
            points: 1,
            active: character.origin === ORIGINS.BROTHERHOOD_INITIATE
        }
    }

    const remainingSpecialties = useMemo(() => {
        let genericPointsUsed = 0;

        // Copia i punti bonus disponibili
        const bonusAvailable = {
            goodNatured: BONUS_SPECIALTIES.goodNatured.active ? BONUS_SPECIALTIES.goodNatured.points : 0,
            brotherhoodInitiate: BONUS_SPECIALTIES.brotherhoodInitiate.active ? BONUS_SPECIALTIES.brotherhoodInitiate.points : 0
        };

        character.specialties.forEach(skill => {
            let coveredByBonus = false;

            // TODO we need to handle where to remove points first if both contain the skill
            //      ie repair and science are in both brotherhoodInitiate and in goodNatured
            if (bonusAvailable.brotherhoodInitiate > 0 && BONUS_SPECIALTIES.brotherhoodInitiate.skills.includes(skill)) {
                bonusAvailable.brotherhoodInitiate--;
                coveredByBonus = true;
            } else if ( bonusAvailable.goodNatured > 0 && BONUS_SPECIALTIES.goodNatured.skills.includes(skill)) {
                bonusAvailable.goodNatured--;
                coveredByBonus = true;
            }

            if (!coveredByBonus) {
                genericPointsUsed++;
            }
        });

        const totalGenericAllowed = 3 +
            character.traits.filter(p => p === 'traitEducated').length +
            (character.origin === ORIGINS.GHOUL ? 1 : 0); // ghouls have survival as extra specialty (and it should not count)

        return {
            generic: totalGenericAllowed - genericPointsUsed,
            goodNatured: bonusAvailable.goodNatured,
            brotherhoodInitiate: bonusAvailable.brotherhoodInitiate
        };
    }, [character.specialties, character.traits, character.origin]);


    let pointsClasses = 'row l-distributed';
    pointsClasses += remainingSpecialties.brotherhoodInitiate + remainingSpecialties.goodNatured <= 0 ? ' l-lastSmall' : '';

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
                            remainingSpecialties.generic < 0 ? {
                                color: 'var(--failure-color)'
                            } : {}
                        }
                        className={pointsClasses}
                    >
                        <span className="h4">{t('availableSpecialtyPoints')}</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="h4">
                                {remainingSpecialties.generic}
                                {remainingSpecialties.goodNatured + remainingSpecialties.brotherhoodInitiate > 0 ?
                                    ` (${t('any')})`
                                    : ''
                                }
                            </span>
                            {
                                Object.keys(remainingSpecialties).filter(k => k!== "generic").map(k => {
                                    const key = k as 'goodNatured' | 'brotherhoodInitiate'
                                    if(Number(remainingSpecialties[key]) > 0){
                                        return <span key={key} className="h5">
                                            {remainingSpecialties[key]} (
                                            {BONUS_SPECIALTIES[key].skills.map(s => t(s)).join(', ')})
                                        </span>
                                    }
                                    return null;
                                })
                            }
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
                <div className={"row l-lastSmall l-spaceBetween"}>
                    <div
                        style={{
                            fontSize: '2rem',
                            marginTop: '2rem',
                        }}
                        className="form-label">Skills:</div>
                    <div className={"row"} style={{ width:'auto'}}>
                        <button
                            style={{flexShrink: 0}}
                            onClick={() => showNd6Popup(undefined, "Nd6")}>
                            <i className={"fas fa-dice-d6 fa-xl"}/>
                        </button>
                        <button
                            style={{flexShrink: 0}}
                            onClick={() => showNd20Popup(undefined, "Nd20")}>
                            <i className={"fas fa-dice-d20 fa-xl"}/>
                        </button>
                    </div>
                </div>
                <section
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                        gap: "var(--space-s)",
                        width: "100%"
                    }}>
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
