import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useCharacter } from '@/contexts/CharacterContext.tsx'
import Skill from './components/Skill.tsx'
import DamageReductionDisplay from '@/app/tabs/stat/components/DamageReductionDisplay.tsx'
import EquippedArmorEffects from '@/app/tabs/EquippedArmorEffects.tsx'
import SpecialStat from '@/app/tabs/stat/components/SpecialStat.tsx'
import {SKILLS, SPECIAL} from "@/types";

function StatTab() {
    const { t } = useTranslation()
    const [isEditing, setIsEditing] = useState(false)
    const { character } = useCharacter()

    // THIS SHOULD BE THE CORRECT WAY TO HANDLE SORTING USING DIFFERENT LANGUAGES
    const sortedSkills =  useMemo(
        () => Object.values(SKILLS).sort(
            (a, b) => t(a).localeCompare(t(b))
        ), [t]
    )

    // Toggle edit mode
    const toggleEditMode = () => {
        setIsEditing(!isEditing)
    }


    return (
        <section className="tabContent">
            {/* SPECIAL Stats */}
            <div id="c-special">
                {SPECIAL.map((specialName) => (
                    <SpecialStat
                        key={specialName}
                        specialType={specialName}
                        editable={isEditing}
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
                    <span>{character.meleeDamage.toLocaleString(undefined, { signDisplay: "exceptZero" })}</span>
                </div>
            </div>

            {/* Damage Reduction Display */}
            <DamageReductionDisplay />

            {/* Active Effects from Equipped Armor */}
            <EquippedArmorEffects equippedItems={character.items.filter(item => item.equipped)} />

            {/* Skills Section */}
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

            {/* Edit Stats Button */}
            <button className="button" onClick={toggleEditMode}>
                {isEditing ? t('stopEditing') : t('editStats')}
            </button>
        </section>
    )
}

export default StatTab
