import { useState, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useCharacter } from '@/app/contexts/CharacterContext.tsx';
import './FeatSelectionPopup.css';
import { SPECIAL, SpecialType } from '@/features/character/special/special.ts';
import { perks, traits } from '@/data';
import { PerkId, perkRank } from '@/features/character/feats/perks/perks.ts';
import { hasTrait, TraitId } from '@/features/character/feats/traits/traits.ts';

type SortMode = 'none' | 'level' | SpecialType | 'total';

interface Requirements {
    level: number;
    strength: number;
    perception: number;
    endurance: number;
    charisma: number;
    intelligence: number;
    agility: number;
    luck: number;
    total: number;
    tier: string | undefined;
}

/**
 * Helper component to render requirement badges
 */
function RequirementBadges({ reqs }: Readonly<{ reqs: Requirements }>) {
    const badges: Array<{ key: keyof Requirements; label: string | undefined }> = [
        { key: 'level', label: 'Lv' },
        { key: 'strength', label: 'S' },
        { key: 'perception', label: 'P' },
        { key: 'endurance', label: 'E' },
        { key: 'charisma', label: 'C' },
        { key: 'intelligence', label: 'I' },
        { key: 'agility', label: 'A' },
        { key: 'luck', label: 'L' },
        { key: 'tier', label: undefined },
    ];

    return (
        <div className="trait-perk-popup__item-reqs">
            {badges.map(({ key, label }) => {
                const value = reqs[key];
                if (!value) {
                    return null;
                }
                const content = label ? `${label} ${value}` : value;
                return (
                    <span key={key} className={`req-badge`}>
                        {content}
                    </span>
                );
            })}
        </div>
    );
}

/**
 * Popup for selecting a trait or perk
 * Displays a scrollable list of available options
 * Each item can be enhanced with additional info in the future
 */

export function PerkSelectionPopup({
    prev,
    onSelect,
    onClose
}: Readonly<{
    prev: PerkId | undefined;
    onSelect: (id: PerkId) => void;
    onClose: () => void;
}>) {
    const { t } = useTranslation();
    const [showUnavailable, setShowUnavailable] = useState(false);
    const { character } = useCharacter();

    const [sortMode, setSortMode] = useState<SortMode>('none');

    const handleSelect = (id: PerkId)=> {
        onSelect(id);
        onClose()
    }


    // Calculate requirements for an item (memoized to prevent re-creation)
    const getRequirements = useCallback((id: PerkId) => {

        const perkData = perks[id];

        const tier = perkRank(character, perkData.ID) + 1 - (id === prev ? 1 : 0)
        const reqs = perkData.REQUISITES;
        const level = (reqs.level || 0) + (tier - 1) * (perkData.LEVEL_REQ_INCREASE ?? 0);
        const strength = reqs.strength || 0;
        const perception = reqs.perception || 0;
        const endurance = reqs.endurance || 0;
        const charisma = reqs.charisma || 0;
        const intelligence = reqs.intelligence || 0;
        const agility = reqs.agility || 0;
        const luck = reqs.luck || 0;
        const total = strength + perception + endurance + charisma + intelligence + agility + luck;
        const tierString = perkData.TIER > 1 ?
            `${tier}/${perkData.TIER}`
            : undefined

        return { level, strength, perception, endurance, charisma, intelligence, agility, luck, total, tier: tierString };
    }, [character, prev]);

    // Check if character meets requirements for a perk
    const meetsRequirements = useCallback((id: PerkId) => {

        const reqs = getRequirements(id);

        // Check level
        if (reqs.level > 0 && character.level < reqs.level) { return false }

        const failsSpecialReq = SPECIAL.some(
            key => reqs[key] > 0 && character.special[key] < reqs[key]
        )
        return !failsSpecialReq
    }, [character, getRequirements]);

    const ids = useMemo(() => {
        const allIds = Object.values(perks).map(p => p.ID)
        // Remove perks already taken (except prev or multitier ones)
        const filteredIds = allIds.filter(id => {
            return perkRank(character, id) - (prev === id ? 1 : 0) < perks[id].TIER
        })

        let resultIds = filteredIds
        if(!showUnavailable) {
            resultIds = filteredIds.filter(id => meetsRequirements(id))
        }

        if (sortMode === 'none') {
            return resultIds.sort((a, b) => {
                return t(a).localeCompare(t(b))
            })
        }
        return resultIds.sort((a, b) => {
            const reqsA = getRequirements(a);
            const reqsB = getRequirements(b);

            const valueA = reqsA[sortMode]
            const valueB = reqsB[sortMode]

            // Primary sort: by selected attribute (DESCENDING - highest first)
            if (valueA !== valueB) {
                return Number(valueB) - Number(valueA); // Descending
            }

            // Secondary sort: by sum of OTHER requirements (DESCENDING - lowest last)
            // Calculate sum of all requirements except the one we're sorting by
            const getSum = (reqs: ReturnType<typeof getRequirements>) => {
                let sum = 0;
                sum += reqs.level;
                sum += reqs.strength;
                sum += reqs.perception;
                sum += reqs.endurance;
                sum += reqs.charisma;
                sum += reqs.intelligence;
                sum += reqs.agility;
                sum += reqs.luck;
                return sum;
            };

            const otherSumA = getSum(reqsA);
            const otherSumB = getSum(reqsB);

            return otherSumB - otherSumA; // Descending (lowest last)

        })
    }, [character, getRequirements, meetsRequirements, prev, showUnavailable, sortMode, t])



    const popupContent = (
        <div className="trait-perk-popup-backdrop" style={{ display: 'flex' }}>
            <div className="trait-perk-popup" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="trait-perk-popup__header">
                    <h3 className="trait-perk-popup__title">
                        {t('selectPerk')}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>

                        <button
                            className={`trait-perk-popup__toggle ${showUnavailable ? 'active' : ''}`}
                            onClick={() => setShowUnavailable(!showUnavailable)}
                            title={t('showUnavailable')}
                        >
                            <i className={`fas fa-eye${showUnavailable ? '' : '-slash'}`}></i>
                        </button>
                        <button
                            className="trait-perk-popup__close"
                            onClick={onClose}
                            aria-label={t('close')}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Sort buttons and toggle (only for perks) */}
                <div className="trait-perk-popup__sort">
                    <button
                        className={sortMode === 'level' ? 'active' : ''}
                        onClick={() => setSortMode(sortMode === 'level' ? 'none' : 'level')}
                        title={t('sortByLevel')}
                    >
                        LVL
                    </button>
                    <button
                        className={sortMode === 'strength' ? 'active' : ''}
                        onClick={() => setSortMode(sortMode === 'strength' ? 'none' : 'strength')}
                        title={t('special.strength')}
                    >
                        S
                    </button>
                    <button
                        className={sortMode === 'perception' ? 'active' : ''}
                        onClick={() => setSortMode(sortMode === 'perception' ? 'none' : 'perception')}
                        title={t('special.perception')}
                    >
                        P
                    </button>
                    <button
                        className={sortMode === 'endurance' ? 'active' : ''}
                        onClick={() => setSortMode(sortMode === 'endurance' ? 'none' : 'endurance')}
                        title={t('special.endurance')}
                    >
                        E
                    </button>
                    <button
                        className={sortMode === 'charisma' ? 'active' : ''}
                        onClick={() => setSortMode(sortMode === 'charisma' ? 'none' : 'charisma')}
                        title={t('special.charisma')}
                    >
                        C
                    </button>
                    <button
                        className={sortMode === 'intelligence' ? 'active' : ''}
                        onClick={() => setSortMode(sortMode === 'intelligence' ? 'none' : 'intelligence')}
                        title={t('special.intelligence')}
                    >
                        I
                    </button>
                    <button
                        className={sortMode === 'agility' ? 'active' : ''}
                        onClick={() => setSortMode(sortMode === 'agility' ? 'none' : 'agility')}
                        title={t('special.agility')}
                    >
                        A
                    </button>
                    <button
                        className={sortMode === 'luck' ? 'active' : ''}
                        onClick={() => setSortMode(sortMode === 'luck' ? 'none' : 'luck')}
                        title={t('special.luck')}
                    >
                        L
                    </button>
                    <button
                        className={sortMode === 'total' ? 'active' : ''}
                        onClick={() => setSortMode(sortMode === 'total' ? 'none' : 'total')}
                        title={t('sortByTotal')}
                    >
                        Σ
                    </button>
                </div>

                {/* Scrollable List */}
                <div className="trait-perk-popup__list">
                    {ids.length === 0 ? (
                        <div className="trait-perk-popup__empty">
                            {t('noPerksAvailable')}
                        </div>
                    ) : (
                        ids.map(id => {
                            const canSelect = meetsRequirements(id);

                            return (
                                <div
                                    key={id}
                                    className={`trait-perk-popup__item ${!canSelect ? 'disabled' : ''}`}
                                    onClick={() => canSelect && handleSelect(id)}
                                    style={{ cursor: canSelect ? 'pointer' : 'not-allowed' }}
                                >
                                    {/* Top row: Name and requirements */}
                                    <div className="trait-perk-popup__item-header">
                                        <div className="trait-perk-popup__item-title-row">
                                            {/* Name */}
                                            <span className="trait-perk-popup__item-name">
                                                {t(id)}
                                            </span>

                                            {/* Lock icon for unavailable perks */}
                                            {!canSelect && (
                                                <span className="trait-perk-popup__item-lock">
                                                    <i className="fas fa-lock"></i>
                                                </span>
                                            )}
                                        </div>

                                        {/* Requirements - on same line as name */}
                                        <RequirementBadges reqs={getRequirements(id)} />
                                    </div>

                                    {/* Description preview */}
                                    <div className="trait-perk-popup__item-description">
                                        {t(id + 'Description')}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );

    // Render in a portal to avoid hooks issues when conditionally rendered
    return ReactDOM.createPortal(popupContent, document.body);
}

export function TraitSelectionPopup({
    prev,
    onSelect,
    onClose
}: Readonly<{
    prev: TraitId | undefined;
    onSelect: (id: TraitId) => void;
    onClose: () => void;
}>){
    const { t } = useTranslation();
    const { character } = useCharacter();

    const handleSelect = (id: TraitId) => {
        onSelect(id);
        onClose();
    };

    // Get all IDs if showing unavailable, otherwise use availableIds
    const ids = useMemo(() => {
        const allTraits = Object.values(traits)
        // Remove perks already taken (except prev or multitier ones)
        return allTraits.filter(
            trait => {
                return !trait.FIXED
                    && trait.ORIGINS.includes(character.origin.id)
                    && (
                        prev === trait.ID
                        || !hasTrait(character, trait.ID)
                    )
            }
        ).map(trait => trait.ID)
        .sort((a, b) => t(a).localeCompare(t(b)));

    }, [character, prev, t]);

    const popupContent = (
        <div className="trait-perk-popup-backdrop" style={{ display: 'flex' }}>
            <div className="trait-perk-popup" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="trait-perk-popup__header">
                    <h3 className="trait-perk-popup__title">
                        {t('selectTrait')}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                            className="trait-perk-popup__close"
                            onClick={onClose}
                            aria-label={t('close')}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Scrollable List */}
                <div className="trait-perk-popup__list">
                    {ids.length === 0 ? (
                        <div className="trait-perk-popup__empty">
                            {t('noTraitsAvailable')}
                        </div>
                    ) : (
                        ids.map(id => {
                            return (
                                <div
                                    key={id}
                                    className={`trait-perk-popup__item`}
                                    onClick={() => handleSelect(id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {/* Top row: Name and requirements */}
                                    <div className="trait-perk-popup__item-header">
                                        <div className="trait-perk-popup__item-title-row">
                                            {/* Name */}
                                            <span className="trait-perk-popup__item-name">
                                                {t(id)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Description preview */}
                                    <div className="trait-perk-popup__item-description">
                                        {t(id + 'Description') !== id + 'Description'
                                                ? t(id + 'Description')
                                                : t(id + 'Benefit') // TODO might want to add penalty too
                                        }
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );

    // Render in a portal to avoid hooks issues when conditionally rendered
    return ReactDOM.createPortal(popupContent, document.body);
}

