import React, { createContext, useContext, useMemo } from 'react'
import { Character } from '@/types'
import { useCharacter as useBaseCharacter } from './CharacterContext'

export type RollerType = 'character' | 'companion' | 'mysteriousStranger'

interface RollerContextValue {
    rollerType: RollerType
    character: Character
}

const RollerContext = createContext<RollerContextValue | undefined>(undefined)

interface RollerProviderProps {
    roller: RollerType
    children: React.ReactNode
}

/**
 * RollerProvider - Wraps components that need a different "roller" character
 * When wrapped, useCharacter() will return the roller's character instead of the player character
 */
export function RollerProvider({ roller, children }: RollerProviderProps) {
    const baseContext = useBaseCharacter()
    
    // Convert companion/mysteriousStranger to Character format
    const rollerCharacter = useMemo((): Character => {
        if (roller === 'companion' && baseContext.character.companion) {
            const companion = baseContext.character.companion
            
            // Calculate maxHp based on companion type
            const baseHp = companion.type === 'eyebot' ? 5 : 10
            const baseBody = companion.type === 'eyebot' ? 4 : 5
            const maxHp = baseHp + (baseContext.character.level - 1) + (companion.body - baseBody)
            
            return {
                ...baseContext.character,
                name: companion.name,
                // Map companion stats to character format
                special: {
                    strength: companion.body,      // Body → Strength (for guns, melee)
                    perception: companion.mind,    // Mind → Perception (for other)
                    endurance: companion.body,     // Body affects HP
                    charisma: companion.mind,
                    intelligence: companion.mind,
                    agility: companion.body,       // Body affects initiative
                    luck: 0  // Companions don't have luck
                },
                skills: {
                    ...baseContext.character.skills,
                    meleeWeapons: companion.melee,
                    smallGuns: companion.guns,
                    bigGuns: companion.guns,
                    energyWeapons: companion.guns,
                    explosives: companion.other,
                    throwing: companion.other,
                    unarmed: companion.melee
                },
                currentHp: companion.currentHp,
                maxHp: maxHp,
                currentLuck: 0,
                maxLuck: 0,
                items: companion.weapons,
                specialties: []
            }
        } else if (roller === 'mysteriousStranger') {
            // Mysterious Stranger character
            return {
                ...baseContext.character,
                name: 'Mysterious Stranger',
                special: {
                    strength: 10,
                    perception: 10,
                    endurance: 10,
                    charisma: 10,
                    intelligence: 10,
                    agility: 10,
                    luck: 10
                },
                skills: {
                    ...baseContext.character.skills,
                    smallGuns: 6  // Mysterious Stranger has 6 in Small Guns
                },
                currentLuck: 0,
                maxLuck: 0,
                items: [{
                    id: 'weapon44Magnum',
                    quantity: 1,
                    equipped: true,
                    mods: []
                }],
                specialties: []
            }
        }
        
        // Default: return player character
        return baseContext.character
    }, [roller, baseContext.character])
    
    const value: RollerContextValue = {
        rollerType: roller,
        character: rollerCharacter
    }
    
    return (
        <RollerContext.Provider value={value}>
            {children}
        </RollerContext.Provider>
    )
}

/**
 * Hook to check if we're inside a RollerProvider
 * Returns the roller context if available, undefined otherwise
 */
export function useRollerContext(): RollerContextValue | undefined {
    return useContext(RollerContext)
}

