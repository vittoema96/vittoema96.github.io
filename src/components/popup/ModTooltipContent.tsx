import { useTranslation } from 'react-i18next'
import { useCharacter } from '@/contexts/CharacterContext'

interface ModTooltipProps {
    /** Mod locale ID (e.g. "modCompensator") */
    modId: string
    /** Raw effect strings from the mod data (e.g. ["qualityAdd:qualityMelee"]) */
    effects: string[]
    /** Complexity / rarity level (determines crafting materials) */
    complexity: number | '-'
    /** Skill ID used for the crafting roll (e.g. "repair", "science") */
    skill: string
    /** Perk requirements as "perkId:rank" (e.g. ["perkGunNut:1", "scrapper:2"]) */
    perks: string[]
}

/**
 * Structured tooltip content for weapon/armor mods.
 * Shows: name, effects list, crafting requirements (complexity, skill, perks).
 * Perk names are highlighted in red when the character doesn't meet the requirement.
 */
export default function ModTooltipContent({ modId, effects, complexity, skill, perks }: Readonly<ModTooltipProps>) {
    const { t } = useTranslation()
    const { character } = useCharacter()

    return (
        <div className="stack no-gap" style={{ gap: 'var(--space-xs)', minWidth: '10rem' }}>
            {/* ── Mod Name ── */}
            <strong style={{ fontSize: '0.9rem', borderBottom: 'var(--border-primary-thin)', paddingBottom: 'var(--space-xs)' }}>
                {t(modId)}
            </strong>

            {/* ── Effects ── */}
            {effects.length > 0 && (
                <ul style={{ margin: 'var(--space-xs) 0', paddingLeft: 'var(--space-l)', fontSize: '0.8rem' }}>
                    {effects.map(effect => (
                        <li key={effect}>{formatEffect(effect, t)}</li>
                    ))}
                </ul>
            )}

            {/* ── Crafting Requirements ── */}
            {(complexity !== '-' || skill || perks.length > 0) && (
                <div
                    className="stack no-gap"
                    style={{
                        gap: 'var(--space-xs)',
                        fontSize: '0.75rem',
                        borderTop: 'var(--border-primary-thin)',
                        paddingTop: 'var(--space-xs)',
                        opacity: 0.85,
                    }}
                >
                    {/* Complexity */}
                    {complexity !== '-' && (
                        <div className="row" style={{ gap: 'var(--space-s)' }}>
                            <span>{t('complexity')}:</span>
                            <span>{complexity}</span>
                        </div>
                    )}

                    {/* Skill */}
                    {skill && (
                        <div className="row" style={{ gap: 'var(--space-s)' }}>
                            <span>{t('skill')}:</span>
                            <span>{t(skill)}</span>
                        </div>
                    )}

                    {/* Perks */}
                    {perks.length > 0 && (
                        <div className="row" style={{ gap: 'var(--space-s)', flexWrap: 'wrap' }}>
                            <span>{t('perks')}:</span>
                            {perks.map((perkEntry) => {
                                const { name, rank, met } = parsePerkRequirement(perkEntry, character.perks, t)
                                return (
                                    <span
                                        key={perkEntry}
                                        style={met ? undefined : { color: 'var(--failure-color)' }}
                                    >
                                        {name} {rank}
                                    </span>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ── Helpers ──────────────────────────────────────────────────

/** Parse "perkGunNut:2" → { name: "Gun Nut", rank: 2, met: true/false } */
function parsePerkRequirement(
    perkEntry: string,
    characterPerks: string[],
    t: (key: string) => string,
) {
    const [rawId, rawRank] = perkEntry.split(':')
    const rank = Number(rawRank) || 1
    // CSV stores "perkGunNut", locale key is "perkGunNut"
    const name = t(rawId)
    // Character has rank N if the perk appears N times in the array
    const characterRank = characterPerks.filter(p => p === rawId).length
    const met = characterRank >= rank
    return { name, rank, met }
}

/** Format a single effect string for display */
function formatEffect(effectStr: string, t: (key: string) => string): string {
    const [effectType, ...valueParts] = effectStr.split(':')
    const value = valueParts.join(':')
    if (!effectType) { return effectStr }

    const signed = (v: string) =>
        Number.parseInt(v).toLocaleString(undefined, { signDisplay: 'exceptZero' })

    if (effectType.startsWith('effect') || effectType.startsWith('quality')) {
        if (effectType.endsWith('Add')) {
            return `${t('adds')} ${valueParts.map(val => t(val)).join(' ')}`
        } else if (effectType.endsWith('Remove')) {
            return `${t('removes')} ${valueParts.map(val => t(val)).join(' ')}`
        }
    } else if (effectType.endsWith('Add')) {
        return `${signed(value)} ${t(effectType.replace('Add', ''))}`
    } else if (effectType.endsWith('Set')) {
        return `${t(effectType.replace('Set', ''))}: ${t(value)}`
    }
    return effectStr
}

