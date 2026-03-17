import { useTranslation } from 'react-i18next'
import Tag from '@/components/Tag.tsx'
import {getGameDatabase, getModifiedItemData } from "@/hooks/getGameDatabase.ts";
import { CharacterItem } from '@/types';

/**
 * Apparel-specific content renderer
 * Displays armor stats and protection areas
 */
interface ApparelContentProps {
    characterItem: CharacterItem
    actionButtons?: React.ReactNode
}
function ApparelContent({ characterItem, actionButtons }: Readonly<ApparelContentProps>) {
    const { t } = useTranslation();

    const dataManager = getGameDatabase();
    const itemData = getModifiedItemData(characterItem)
    if (!dataManager.isType(itemData, 'apparel')) {
        console.error(`Apparel data not found for ID: ${characterItem.id}`)
        return null;
    }

    const isRobotPart = itemData.CATEGORY === 'robotPart';

    return (
        <>
            <div className="card-apparel-stats card-apparel-stats--4col">
                {/* Column 1 - Damage Resistances */}
                <div className="card-apparel-stats__column">
                    <div className="card-stat-compact" title={t('physical')}>
                        <i className="fas fa-shield-halved"></i>
                        <div className="card-stat-compact__value js-cardApparel-physical">{itemData.PHYSICAL_RES}</div>
                    </div>
                    <div className="card-stat-compact" title={t('energy')}>
                        <i className="fas fa-bolt"></i>
                        <div className="card-stat-compact__value js-cardApparel-energy">{itemData.ENERGY_RES}</div>
                    </div>
                    <div className="card-stat-compact" title={t('radiation')}>
                        <i className="fas fa-radiation"></i>
                        <div className="card-stat-compact__value js-cardApparel-radiation">
                            {isRobotPart ? t('immune') : itemData.RADIATION_RES}
                        </div>
                    </div>
                </div>

                {/* Column 2 - Apparel Icon */}
                <div className="card-apparel-image--compact themed-svg" data-icon={itemData.CATEGORY}></div>

                {/* Column 3 - Locations Covered */}
                <div className="card-apparel-stats__column">
                    <div className="card-apparel-stats__locations">
                        <i className="fas fa-user" title={t('protects')}></i>
                        <div className="card-apparel-stats__locations-list">
                            {itemData.LOCATIONS_COVERED?.map(location => {
                                const locationText = t(location, {
                                    variation: t(characterItem.variation!),
                                });
                                return <span key={locationText}>{locationText}</span>;
                            })}
                        </div>
                    </div>
                </div>

                {/* Column 4 - Action Buttons */}
                {actionButtons}
            </div>

            {/* Tags container for effects - Compact */}
            {itemData.EFFECTS?.length > 0 && (
                <div className="tags-container tags-container--compact">
                    {itemData.EFFECTS.map((effect) => {
                        const [effectType, effectOpt] = effect.split(':');
                        let displayValue = t(effectOpt!)
                        if (displayValue) {
                            displayValue = ` ${displayValue}`;
                        }
                        const displayText = `${t(effectType!)}${displayValue}`;
                        return (
                            <Tag key={effect} tooltipId={`${effectType}Description`}>
                                {displayText}
                            </Tag>
                        );
                    })}
                </div>
            )}
        </>
    );
}

export default ApparelContent
