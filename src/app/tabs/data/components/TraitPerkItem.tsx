import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface TraitPerkItemProps {
    id: string;
    isFixed?: boolean;
    isImplemented?: boolean;
    onChangeClick?: () => void; // Callback when user wants to change selection
    onDeleteClick?: () => void; // Callback when user wants to delete/clear selection
    actionButton?:
        | {
              label: string;
              onClick: () => void;
          }
        | undefined;
}

/**
 * Unified component for displaying traits and perks with consistent UI
 * - Compact row display with name and implementation status
 * - Click to expand/collapse description
 * - Optional "Change" button for selectable items
 * - Optional action button for perks
 */
function TraitPerkItem({
    id,
    isFixed = false,
    isImplemented = true,
    onChangeClick,
    onDeleteClick,
    actionButton,
}: Readonly<TraitPerkItemProps>) {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [showActionButtons, setShowActionButtons] = useState(false);

    const toggleExpanded = () => setIsExpanded(!isExpanded);

    // Long press handling
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handlePressStart = () => {
        if (!isFixed && (onChangeClick || onDeleteClick)) {
            // 500ms long press
            longPressTimerRef.current = setTimeout(() => {
                setShowActionButtons(true);
            }, 500);
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

    return (
        <div className="inventory-row trait-perk-item">
            {/* Header - Always Visible */}
            <div className="inventory-row__header">
                {/* Clickable area for expand/collapse */}
                <div
                    className={`trait-perk-item__clickable${showActionButtons ? ' trait-perk-item__clickable--actions' : ''}`}
                    onClick={showActionButtons ? undefined : toggleExpanded}
                    onMouseDown={handlePressStart}
                    onMouseUp={handlePressEnd}
                    onMouseLeave={handlePressEnd}
                    onTouchStart={handlePressStart}
                    onTouchEnd={handlePressEnd}
                >
                    <div className="inventory-row__info trait-perk-item__info">
                        <div className="inventory-row__name trait-perk-item__name">
                            {/* Name */}
                            <span
                                className={`trait-perk-item__name-label${isImplemented ? '' : ' trait-perk-item__name-label--disabled'}`}
                            >
                                {t(id)}
                            </span>
                        </div>
                    </div>

                    {/* Action button (for feats/actions with a shortcut) */}
                    {actionButton && !showActionButtons && (
                        <button
                            className="perk-action-button"
                            onClick={e => {
                                e.stopPropagation();
                                actionButton.onClick();
                            }}
                            title={t(actionButton.label)}
                        >
                            <i className="fas fa-play"></i>
                        </button>
                    )}

                    {/* Expand/Collapse indicator (only when not in action mode) */}
                    {!showActionButtons && (
                        <div className="inventory-row__expand trait-perk-item__expand">
                            <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                        </div>
                    )}
                </div>

                {/* Right side buttons - always visible */}
                <div className="trait-perk-item__actions">
                    {/* Action mode buttons (cancel/delete/change) */}
                    {showActionButtons && (
                        <>
                            <button
                                onClick={handleCancel}
                                className="trait-perk-item__button"
                                title={t('cancel')}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                            {onDeleteClick && (
                                <button
                                    onClick={handleDelete}
                                    className="trait-perk-item__button trait-perk-item__button--delete"
                                    title={t('delete')}
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            )}
                            {onChangeClick && (
                                <button
                                    onClick={handleChange}
                                    className="trait-perk-item__button trait-perk-item__button--change"
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
                <div className="card-content card-content--compact trait-perk-item__description">
                    {/* Display as simple description */}
                    {showAsDescription && (
                        <p>{hasDescription ? t(id + 'Description') : t(id + 'Benefit')}</p>
                    )}

                    {/* Display as Benefit/Penalty structure (traits with both) */}
                    {showAsBenefitPenalty && (
                        <>
                            <div className="trait-perk-item__benefit">
                                <strong className="trait-perk-item__benefit-label">
                                    + {t('benefit')}:
                                </strong>{' '}
                                {t(id + 'Benefit')}
                            </div>
                            <div className="trait-perk-item__penalty">
                                <strong className="trait-perk-item__penalty-label">
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
