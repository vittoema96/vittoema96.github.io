import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getGameDatabase } from '@/hooks/getGameDatabase.ts';

interface TraitPerkItemProps {
    id: string;
    type: 'trait' | 'perk';
    isFixed?: boolean;
    onChangeClick?: () => void; // Callback when user wants to change selection
    onDeleteClick?: () => void; // Callback when user wants to delete/clear selection
    actionButton?: {
        label: string;
        onClick: () => void;
    };
}

/**
 * Unified component for displaying traits and perks with consistent UI
 * - Compact row display with name and implementation status
 * - Click to expand/collapse description
 * - Optional "Change" button for selectable items
 * - Optional action button for perks
 */
function TraitPerkItem({ id, type, isFixed = false, onChangeClick, onDeleteClick, actionButton }: Readonly<TraitPerkItemProps>) {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [showActionButtons, setShowActionButtons] = useState(false);

    const toggleExpanded = () => setIsExpanded(!isExpanded);

    // Long press handling
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handlePressStart = () => {
        if (!isFixed && (onChangeClick || onDeleteClick)) {
            const timer = setTimeout(() => {
                setShowActionButtons(true);
            }, 500); // 500ms long press
            longPressTimerRef.current = timer;
        }
    };

    const handlePressEnd = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    const handleCancel = () => {
        setShowActionButtons(false);
    };

    const handleChange = () => {
        if (onChangeClick) {
            onChangeClick();
            setShowActionButtons(false);
        }
    };

    const handleDelete = () => {
        if (onDeleteClick) {
            onDeleteClick();
            setShowActionButtons(false);
        }
    };

    // Check what content is available
    const hasDescription = t(id + 'Description') !== id + 'Description';
    const hasBenefit = t(id + 'Benefit') !== id + 'Benefit';
    const hasPenalty = t(id + 'Penalty') !== id + 'Penalty';

    // Determine display mode:
    // - If has both Benefit and Penalty: show as benefit/penalty structure
    // - Otherwise: show as simple description (from Description or Benefit)
    const showAsBenefitPenalty = hasBenefit && hasPenalty;
    const showAsDescription = !showAsBenefitPenalty;

    // Common button styles
    const squareButtonStyle: React.CSSProperties = {
        padding: 0,
        borderRadius: '3px',
        cursor: 'pointer',
        fontSize: '0.85rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '2rem',
        height: '2rem',
        flexShrink: 0,
    };

    return (
        <div className="inventory-row" style={{ marginBottom: '0.5rem' }}>
            {/* Header - Always Visible */}
            <div
                className="inventory-row__header"
                style={{
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}
            >
                {/* Clickable area for expand/collapse */}
                <div
                    onClick={showActionButtons ? undefined : toggleExpanded}
                    onMouseDown={handlePressStart}
                    onMouseUp={handlePressEnd}
                    onMouseLeave={handlePressEnd}
                    onTouchStart={handlePressStart}
                    onTouchEnd={handlePressEnd}
                    style={{
                        cursor: showActionButtons ? 'default' : 'pointer',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        minWidth: 0,
                    }}
                >
                    <div className="inventory-row__info" style={{ flex: 1, minWidth: 0 }}>
                        <div className="inventory-row__name" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {/* Name */}
                            <span style={{ fontWeight: 'bold' }}>
                                {t(id)}
                            </span>
                        </div>
                    </div>

                    {/* Expand/Collapse indicator (only when not in action mode) */}
                    {!showActionButtons && (
                        <div className="inventory-row__expand" style={{ marginLeft: '0.25rem', flexShrink: 0 }}>
                            <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                        </div>
                    )}
                </div>

                {/* Right side buttons - always visible */}
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexShrink: 0 }}>
                    {/* Action button (for perks with special actions) - always visible */}
                    {actionButton && !showActionButtons && (
                        <button
                            className="perk-action-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                actionButton.onClick();
                            }}
                            style={{
                                ...squareButtonStyle,
                                backgroundColor: 'var(--primary-color)',
                                border: 'none',
                                fontSize: '0.9rem',
                                color: 'var(--secondary-color)',
                            }}
                            title={t(actionButton.label)}
                        >
                            <i className="fas fa-play"></i>
                        </button>
                    )}

                    {/* Action mode buttons (cancel/delete/change) */}
                    {showActionButtons && (
                        <>
                            <button
                                onClick={handleCancel}
                                style={{
                                    ...squareButtonStyle,
                                    backgroundColor: 'transparent',
                                    border: 'var(--border-primary-thin)',
                                }}
                                title={t('cancel')}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                            {onDeleteClick && (
                                <button
                                    onClick={handleDelete}
                                    style={{
                                        ...squareButtonStyle,
                                        backgroundColor: 'transparent',
                                        border: 'var(--border-primary-thin)',
                                        color: 'var(--failure-color)',
                                    }}
                                    title={t('delete')}
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            )}
                            {onChangeClick && (
                                <button
                                    onClick={handleChange}
                                    style={{
                                        ...squareButtonStyle,
                                        backgroundColor: 'transparent',
                                        border: 'var(--border-primary-thin)',
                                        color: 'var(--primary-color)',
                                    }}
                                    title={t('change')}
                                >
                                    <i className="fas fa-edit"></i>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Expanded Content - Description */}
            {isExpanded && (
                <div
                    className="card-content card-content--compact"
                    style={{
                        padding: '0.75rem',
                        borderTop: 'var(--border-primary-thin)',
                        fontSize: '0.85rem',
                        lineHeight: '1.5',
                        position: 'relative',
                    }}
                >
                    {/* Display as simple description */}
                    {showAsDescription && (
                        <p style={{ margin: 0 }}>
                            {hasDescription ? t(id + 'Description') : t(id + 'Benefit')}
                        </p>
                    )}

                    {/* Display as Benefit/Penalty structure (traits with both) */}
                    {showAsBenefitPenalty && (
                        <>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <strong style={{ color: 'var(--success-color)' }}>
                                    + {t('benefit')}:
                                </strong>{' '}
                                {t(id + 'Benefit')}
                            </div>
                            <div>
                                <strong style={{ color: 'var(--failure-color)' }}>
                                    - {t('penalty')}:
                                </strong>{' '}
                                {t(id + 'Penalty')}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default TraitPerkItem;

