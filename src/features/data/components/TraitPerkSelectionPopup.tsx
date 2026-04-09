import React, { useState, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { getGameDatabase } from '@/hooks/getGameDatabase.ts';
import { useCharacter } from '@/contexts/CharacterContext.tsx';
import './TraitPerkSelectionPopup.css';

type SortMode = 'none' | 'level' | 'strength' | 'perception' | 'endurance' | 'charisma' | 'intelligence' | 'agility' | 'luck' | 'total';

interface TraitPerkSelectionPopupProps {
    type: 'trait' | 'perk';
    availableIds: string[];
    onSelect: (id: string) => void;
    onClose: () => void;
}

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
}

/**
 * Helper component to render requirement badges
 */
function RequirementBadges({ reqs }: { reqs: Requirements | null }) {
    if (!reqs) {return null;}

    const badges: Array<{ key: keyof Requirements; label: string; isLevel: boolean }> = [
        { key: 'level', label: 'LVL', isLevel: true },
        { key: 'strength', label: 'S', isLevel: false },
        { key: 'perception', label: 'P', isLevel: false },
        { key: 'endurance', label: 'E', isLevel: false },
        { key: 'charisma', label: 'C', isLevel: false },
        { key: 'intelligence', label: 'I', isLevel: false },
        { key: 'agility', label: 'A', isLevel: false },
        { key: 'luck', label: 'L', isLevel: false },
    ];

    return (
        <div className="trait-perk-popup__item-reqs">
            {badges.map(({ key, label, isLevel }) => {
                const value = reqs[key];
                if (value <= 0) {return null;}
                return (
                    <span key={key} className={`req-badge ${isLevel ? 'req-level' : 'req-special'}`}>
                        {label} {value}
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
function TraitPerkSelectionPopup({ type, availableIds, onSelect, onClose }: Readonly<TraitPerkSelectionPopupProps>) {
    const { t } = useTranslation();
    const dataManager = getGameDatabase();
    const { character } = useCharacter();
    const [sortMode, setSortMode] = useState<SortMode>('none');
    const [showUnavailable, setShowUnavailable] = useState(false);

    const handleSelect = (id: string) => {
        onSelect(id);
        onClose();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Calculate requirements for an item (memoized to prevent re-creation)
    const getRequirements = useCallback((id: string) => {
        if (type === 'trait') {return null;}

        const perkData = dataManager.perks[id];
        if (!perkData?.REQUISITES) {return null;}

        const reqs = perkData.REQUISITES;
        const level = reqs.level || 0;
        const strength = reqs.strength || 0;
        const perception = reqs.perception || 0;
        const endurance = reqs.endurance || 0;
        const charisma = reqs.charisma || 0;
        const intelligence = reqs.intelligence || 0;
        const agility = reqs.agility || 0;
        const luck = reqs.luck || 0;
        const total = strength + perception + endurance + charisma + intelligence + agility + luck;

        return { level, strength, perception, endurance, charisma, intelligence, agility, luck, total };
    }, [type, dataManager.perks]);

    // Check if character meets requirements for a perk
    const meetsRequirements = useCallback((id: string) => {
        if (type === 'trait') {return true;} // Traits have no requirements

        const reqs = getRequirements(id);
        if (!reqs) {return true;} // No requirements

        // Check level
        if (reqs.level > 0 && character?.level < reqs.level) {return false;}

        // Check SPECIAL attributes
        if (reqs.strength > 0 && character?.special.strength < reqs.strength) {return false;}
        if (reqs.perception > 0 && character?.special.perception < reqs.perception) {return false;}
        if (reqs.endurance > 0 && character?.special.endurance < reqs.endurance) {return false;}
        if (reqs.charisma > 0 && character?.special.charisma < reqs.charisma) {return false;}
        if (reqs.intelligence > 0 && character?.special.intelligence < reqs.intelligence) {return false;}
        if (reqs.agility > 0 && character?.special.agility < reqs.agility) {return false;}
        if (reqs.luck > 0 && character?.special.luck < reqs.luck) {return false;}

        return true;
    }, [type, character, getRequirements]);

    // Get all IDs if showing unavailable, otherwise use availableIds
    const allIds = useMemo(() => {
        if (!showUnavailable || type === 'trait') {
            return availableIds;
        }
        // Get all perk IDs from database
        return Object.keys(dataManager.perks);
    }, [showUnavailable, type, availableIds, dataManager.perks]);

    // Sort items based on sort mode
    const sortedIds = useMemo(() => {
        if (sortMode === 'none' || type === 'trait') {
            return allIds;
        }

        return [...allIds].sort((a, b) => {
            const reqsA = getRequirements(a);
            const reqsB = getRequirements(b);

            if (!reqsA && !reqsB) {return 0;}
            if (!reqsA) {return 1;}
            if (!reqsB) {return -1;}

            const valueA = reqsA[sortMode as keyof typeof reqsA] || 0;
            const valueB = reqsB[sortMode as keyof typeof reqsB] || 0;

            // Put perks with 0 requirement at the end
            if (valueA === 0 && valueB === 0) {return 0;}
            if (valueA === 0) {return 1;}
            if (valueB === 0) {return -1;}

            // Primary sort: by selected attribute (DESCENDING - highest first)
            if (valueA !== valueB) {
                return valueB - valueA; // Descending
            }

            // Secondary sort: by sum of OTHER requirements (DESCENDING - lowest last)
            // Calculate sum of all requirements except the one we're sorting by
            const getSumExcluding = (reqs: ReturnType<typeof getRequirements>, exclude: SortMode) => {
                if (!reqs) {return 0;}
                let sum = 0;
                if (exclude !== 'level') {sum += reqs.level;}
                if (exclude !== 'strength') {sum += reqs.strength;}
                if (exclude !== 'perception') {sum += reqs.perception;}
                if (exclude !== 'endurance') {sum += reqs.endurance;}
                if (exclude !== 'charisma') {sum += reqs.charisma;}
                if (exclude !== 'intelligence') {sum += reqs.intelligence;}
                if (exclude !== 'agility') {sum += reqs.agility;}
                if (exclude !== 'luck') {sum += reqs.luck;}
                return sum;
            };

            const otherSumA = getSumExcluding(reqsA, sortMode);
            const otherSumB = getSumExcluding(reqsB, sortMode);

            return otherSumB - otherSumA; // Descending (lowest last)
        });
    }, [allIds, sortMode, type, getRequirements]);

    const popupContent = (
        <div className="trait-perk-popup-backdrop" onClick={handleBackdropClick} style={{ display: 'flex' }}>
            <div className="trait-perk-popup" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="trait-perk-popup__header">
                    <h3 className="trait-perk-popup__title">
                        {type === 'trait' ? t('selectTrait') : t('selectPerk')}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {type === 'perk' && (
                            <button
                                className={`trait-perk-popup__toggle ${showUnavailable ? 'active' : ''}`}
                                onClick={() => setShowUnavailable(!showUnavailable)}
                                title={t('showUnavailable')}
                            >
                                <i className={`fas fa-eye${showUnavailable ? '' : '-slash'}`}></i>
                            </button>
                        )}
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
                {type === 'perk' && (
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
                )}

                {/* Scrollable List */}
                <div className="trait-perk-popup__list">
                    {sortedIds.length === 0 ? (
                        <div className="trait-perk-popup__empty">
                            {type === 'trait' ? t('noTraitsAvailable') : t('noPerksAvailable')}
                        </div>
                    ) : (
                        sortedIds.map(id => {
                            const reqs = getRequirements(id);
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

                                        {/* Requirements (only for perks) - on same line as name */}
                                        <RequirementBadges reqs={reqs} />
                                    </div>

                                    {/* Description preview */}
                                    <div className="trait-perk-popup__item-description">
                                        {type === 'perk'
                                            ? t(id + 'Description')
                                            : t(id + 'Description') !== id + 'Description'
                                                ? t(id + 'Description')
                                                : t(id + 'Benefit')
                                        }
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer (optional - for future use) */}
                {/* <div className="trait-perk-popup__footer">
                    <button onClick={onClose}>Cancel</button>
                </div> */}
            </div>
        </div>
    );

    // Render in a portal to avoid hooks issues when conditionally rendered
    return ReactDOM.createPortal(popupContent, document.body);
}

export default TraitPerkSelectionPopup;

