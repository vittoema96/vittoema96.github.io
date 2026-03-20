import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useCharacter } from '@/contexts/CharacterContext'
import {ORIGINS} from "@/utils/characterSheet";
import {OriginId} from "@/types";
import TraitList from '@/features/data/components/TraitList.tsx';
import PerkList from '@/features/data/components/PerkList.tsx';
import useInputNumberState from '@/hooks/useInputNumberState.ts';

function DataTab() {
    const { t } = useTranslation()
    const { character, updateCharacter } = useCharacter()
    const [ levelInput, setLevelInput ] = useInputNumberState(character.level)

    // Update levelInput when character.level changes (e.g., when loading a character)
    useEffect(() => {
        setLevelInput(character.level)
    }, [character.level])

    const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        // Allow empty string temporarily
        const numValue = Number.parseInt(value)
        if (Number.isNaN(numValue)) {
            setLevelInput('')
            return
        }

        if (numValue >= 1) {
            setLevelInput(numValue)
            updateCharacter({ level: numValue })
        }
    }

    const handleLevelBlur = () => {
        // On blur, if empty or invalid, restore previous value
        if (!levelInput) {
            setLevelInput(character.level)
        }
    }

    return (
        <section className="tabContent">
            {/* Character Name */}
            <div className="row l-distributed l-firstSmall">
                <label className="h2" htmlFor="pg_name">
                    {t('name')}:
                </label>
                <input
                    id="pg_name"
                    type="text"
                    placeholder={t('namePlaceholder')}
                    value={character.name || ''}
                    onChange={(e) => updateCharacter({name: e.target.value})}
                />
            </div>

            {/* Character Level */}
            <div className="row l-distributed l-firstSmall">
                <label className="h4" htmlFor="level">
                    {t('level')}:
                </label>
                <input
                    id="level"
                    type="number"
                    min="1"
                    step="1"
                    value={levelInput}
                    onChange={handleLevelChange}
                    onBlur={handleLevelBlur}
                />
            </div>

            {/* Character Origin */}
            <div className="row l-distributed l-firstSmall">
                <label className="h4" htmlFor="origin">
                    {t('origin')}:
                </label>
                <select
                    id="origin"
                    value={character.origin.id}
                    onChange={(e) => updateCharacter({
                        origin: e.target.value as OriginId
                    })}
                >

                    <option value={undefined} disabled>-</option>
                    {Object.values(ORIGINS).map(origin => (
                        origin.id && <option key={origin.id} value={origin.id}>
                            {t(origin.id)}
                        </option>
                    ))}
                </select>
            </div>

            {/* Character Background */}
            <div className="row l-distributed l-firstSmall">
                <label className="h4" htmlFor="character-background">
                    Background:
                </label>
                <textarea
                    id="character-background"
                    rows={7}
                    placeholder={t('backgroundPlaceholder')}
                    value={character.background || ''}
                    onChange={(e) => updateCharacter({background: e.target.value})}
                />
            </div>

            <TraitList />
            <br />
            <PerkList />
        </section>
    )
}

export default DataTab
