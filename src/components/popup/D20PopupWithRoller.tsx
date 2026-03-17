import React from 'react'
import { CharacterItem, SkillType } from '@/types'
import { CharacterProvider, companionToCharacter, createMysteriousStranger, useCharacter } from '@/contexts/CharacterContext'
import D20Popup, { RollerType } from '@/components/popup/D20Popup'

interface D20PopupWithRollerProps {
    onClose: () => void;
    skillId: SkillType | 'perkMysteriousStranger';
    usingItem: CharacterItem | null;
    roller: RollerType;
    onShowDamage?: (usingItem: CharacterItem, hasAimed: boolean, isMysteriousStrangerOrCompanion: boolean) => void;
}

function D20PopupWithRoller({ onClose, skillId, usingItem, roller, onShowDamage }: Readonly<D20PopupWithRollerProps>) {
    const { character } = useCharacter()

    const rollerCharacter = roller === 'companion'
        ? companionToCharacter(character.companion, character)
        : createMysteriousStranger(character)

    return (
        <CharacterProvider overrideCharacter={rollerCharacter}>
            <D20Popup
                onClose={onClose}
                skillId={skillId}
                usingItem={usingItem}
                roller={roller}
                onShowDamage={onShowDamage}
            />
        </CharacterProvider>
    )
}

export default D20PopupWithRoller

