import { useMemo, useCallback } from 'react'
import { SKILLS } from '../js/constants.js'
import { useCharacter } from '../contexts/CharacterContext.jsx'
import { useI18n } from './useI18n.js'

/**
 * Custom hook for managing character skills
 * Encapsulates logic for skill management and sorting
 * @returns {Object} Skill management functions and data
 */
export const useSkills = () => {
    const { character, updateCharacter, derivedStats } = useCharacter()
    const t = useI18n()

    /**
     * Get sorted skills list (alphabetically by translated name)
     */
    const sortedSkills = useMemo(() => {
        return Object.values(SKILLS)
            .map(skillId => ({
                skillId,
                translatedName: t(skillId),
                baseValue: character.skills?.[skillId] || 0,
                effectiveValue: derivedStats.effectiveSkills?.[skillId] || 0,
                hasSpecialty: character.specialties?.includes(skillId) || false
            }))
            .sort((a, b) => a.translatedName.localeCompare(b.translatedName))
    }, [character.skills, character.specialties, derivedStats.effectiveSkills, t])

    /**
     * Increment skill value
     * @param {string} skillId - Skill ID
     */
    const incrementSkill = useCallback((skillId) => {
        const current = character.skills?.[skillId] || 0
        const next = current < 10 ? current + 1 : 0 // Cycle back to 0 if at max

        updateCharacter({
            skills: {
                ...character.skills,
                [skillId]: next
            }
        })
    }, [character.skills, updateCharacter])

    /**
     * Toggle skill specialty
     * @param {string} skillId - Skill ID
     */
    const toggleSpecialty = useCallback((skillId) => {
        const hasSpecialty = character.specialties?.includes(skillId) || false
        const newSpecialties = hasSpecialty
            ? character.specialties.filter(s => s !== skillId)
            : [...(character.specialties || []), skillId]

        updateCharacter({
            specialties: newSpecialties
        })
    }, [character.specialties, updateCharacter])

    return {
        sortedSkills,
        incrementSkill,
        toggleSpecialty
    }
}

