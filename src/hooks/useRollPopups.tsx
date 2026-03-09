import { useCallback, useState } from 'react'
import D20Popup, { RollerType } from '@/contexts/popup/D20Popup'
import D20PopupWithRoller from '@/contexts/popup/D20PopupWithRoller'
import D6Popup from '@/contexts/popup/D6Popup'
import { CharacterItem, SkillType } from '@/types'

interface D20Config {
    skillId: SkillType | 'perkMysteriousStranger';
    usingItem: CharacterItem | null;
    roller?: RollerType;
}

interface D6Config {
    usingItem: CharacterItem;
    hasAimed: boolean;
    isMysteriousStranger: boolean;
}

/**
 * Local controller hook for D20 + D6 roll popups.
 *
 * Exposes an `openD20` function and a `Popups` element that should be rendered
 * once in the component tree. This removes the need for PopupContext to manage
 * D20/D6 state globally while keeping the logic DRY across call sites.
 */
export function useRollPopups() {
    const [d20Config, setD20Config] = useState<D20Config | null>(null)
    const [d6Config, setD6Config] = useState<D6Config | null>(null)

    const openD20 = useCallback((config: D20Config) => {
        setD20Config(config)
        setD6Config(null)
    }, [])

    const closeD20 = useCallback(() => {
        setD20Config(null)
    }, [])

    const openD6 = useCallback((config: D6Config) => {
        setD6Config(config)
    }, [])

    const closeD6 = useCallback(() => {
        setD6Config(null)
    }, [])

    const Popups = (
        <>
            {d20Config && (
                d20Config.roller ? (
                    <D20PopupWithRoller
                        onClose={closeD20}
                        skillId={d20Config.skillId}
                        usingItem={d20Config.usingItem}
                        roller={d20Config.roller}
                        onShowDamage={(usingItem, hasAimed, isMysteriousStrangerOrCompanion) => {
                            openD6({
                                usingItem,
                                hasAimed,
                                isMysteriousStranger: isMysteriousStrangerOrCompanion,
                            })
                        }}
                    />
                ) : (
                    <D20Popup
                        onClose={closeD20}
                        skillId={d20Config.skillId}
                        usingItem={d20Config.usingItem}
                        onShowDamage={(usingItem, hasAimed, isMysteriousStrangerOrCompanion) => {
                            openD6({
                                usingItem,
                                hasAimed,
                                isMysteriousStranger: isMysteriousStrangerOrCompanion,
                            })
                        }}
                    />
                )
            )}

            {d6Config && (
                <D6Popup
                    onClose={closeD6}
                    usingItem={d6Config.usingItem}
                    hasAimed={d6Config.hasAimed}
                    isMysteriousStranger={d6Config.isMysteriousStranger}
                />
            )}
        </>
    )

    return { openD20, closeD20, Popups }
}

