import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useCharacter } from '@/contexts/CharacterContext'
import ActiveEffectsDisplay from '@/app/tabs/ActiveEffectsDisplay.tsx'
import Skill from './components/Skill'
import DamageReductionDisplay from './components/DamageReductionDisplay'
import SpecialStat from './components/SpecialStat'
import {SKILLS, SPECIAL} from "@/types";

function StatTab() {
    const { t } = useTranslation()
    const [isEditing, setIsEditing] = useState(false)
    const { rawCharacter, character } = useCharacter()

    // THIS SHOULD BE THE CORRECT WAY TO HANDLE SORTING USING DIFFERENT LANGUAGES
    const sortedSkills =  useMemo(
        () => Object.values(SKILLS).sort(
            (a, b) => t(a).localeCompare(t(b))
        ), [t]
    )
    const specialPoints = useMemo(() => {
        const specialSum = Object.values(character.special).reduce((total, value) => total + value, 0)
        const usedPoints = specialSum - 7*4
        const giftedBonus = character.traits.includes('traitGifted') ? 2 : 0
        return 12 + giftedBonus - usedPoints
    }, [character.special, character.traits])
    const skillPoints = useMemo(() => {
        const skillSum = Object.values(rawCharacter?.skills ?? {}).reduce((total, value) => total + value, 0)
        return 9 + character.special.intelligence + character.level - 1 - skillSum
    }, [character.level, character.special.intelligence, rawCharacter?.skills])
    const extraSpecialties = useMemo(() => {
        return character.traits.includes('traitGoodNatured') ? ['speech', 'medicine', 'repair' , 'science', 'barter'] : undefined
    }, [character.traits])
    const x = useMemo(() => {
        return character.traits.includes('traitGoodNatured') ?
            2 - character.specialties.filter(
                s => (extraSpecialties ?? []).includes(s)
            ).length : 0
    }, [character.specialties, character.traits, extraSpecialties])
    const specialtyPoints = useMemo(() => {
        return (
            3 -
            character.specialties.filter(s => !(extraSpecialties ?? []).includes(s)).length +
            Math.min(x, 0)
        );
    }, [character.specialties, extraSpecialties, x])



    return (
        <section className="tabContent">
            {/* SPECIAL Stats */}
            <div id="c-special">
                {SPECIAL.map((specialName) => (
                    <SpecialStat
                        key={specialName}
                        specialType={specialName}
                        isEditing={isEditing}
                    />
                ))}
            </div>
            {isEditing && <div style={specialPoints<0 ? {color: 'var(--failure-color)'} : {}} className="row row--spaced">
                <span className="h4">{t("availableSpecial")}</span>
                <span className="h4">{specialPoints}</span>
            </div>}

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
                    <span>{character.meleeDamage.toLocaleString(undefined, { signDisplay: "exceptZero" })}</span>
                </div>
            </div>

            {/* Damage Reduction Display */}
            <DamageReductionDisplay />

            {/* Active Effects from Equipped Armor */}
            <ActiveEffectsDisplay/>

            {/* Skills Section */}
            {/* TODO: Could sort skills in different ways other than alphabetically */}
            <div>
                <h1 className="form-label">Skills:</h1>
                <section
                    className="itemlist"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem'
                    }}
                >
                    {sortedSkills.map((skillId) => {
                        return (
                            <Skill
                                key={skillId}
                                skillId={skillId}
                                isEditing={isEditing}
                            />
                        )
                    })}
                </section>
            </div>

            {isEditing && <>
                <div style={skillPoints<0 ? {color: 'var(--failure-color)'} : {}} className="row row--spaced">
                    <span className="h4">{t("availableSkillPoints")}</span>
                    <span className="h4">{skillPoints}</span>
                </div>
                <div style={specialtyPoints<0 ? {color: 'var(--failure-color)'} : {}} className="row row--spaced">
                    <span className="h4">{t("availableSpecialtyPoints")}</span>
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                        <span className="h4">{specialtyPoints}{extraSpecialties && x>0 ? ` (${t("any")})` : ''}</span>
                        {extraSpecialties && x>0 && (
                            <span className="h5">{x} ({extraSpecialties?.map(s => t(s)).join(', ')})</span>
                        )}
                    </div>
                </div>
            </>}

            {/* Edit Stats Button */}
            <button className="button" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? t('stopEditing') : t('editStats')}
            </button>
        </section>
    )
}

export default StatTab
