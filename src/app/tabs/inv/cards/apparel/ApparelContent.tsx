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
}
function ApparelContent({ characterItem }: Readonly<ApparelContentProps>) {
    const { t } = useTranslation();

    const dataManager = getGameDatabase();
    const itemData = getModifiedItemData(characterItem)
    if (!dataManager.isType(itemData, 'apparel')) {
        console.error(`Apparel data not found for ID: ${characterItem.id}`)
        return null;
    }

    const isRobotPart = itemData.CATEGORY === 'robotPart';

    return (
        <section>
            <div className="row l-spaceBetween">
                <section>
                    <div className="card-stat">
                        <div>{t('damageReductionFull')}</div>
                        <div className="row l-centered">
                            <span>{t('physical')}:</span>
                            <span className="js-cardApparel-physical">{itemData.PHYSICAL_RES}</span>
                        </div>
                        <div className="row l-centered">
                            <span>{t('energy')}:</span>
                            <span className="js-cardApparel-energy">{itemData.ENERGY_RES}</span>
                        </div>
                        <div className="row l-centered">
                            <span>{t('radiation')}:</span>
                            <span className="js-cardApparel-radiation">
                                {isRobotPart ? t('immune') : itemData.RADIATION_RES}
                            </span>
                        </div>
                    </div>
                </section>

                <div
                    className="themed-svg js-cardApparel-image"
                    style={{
                        textAlign: 'center',
                        padding: '2rem 0.5rem',
                        color: 'var(--secondary-color)',
                    }}
                >
                    Work In Progress
                </div>

                <section>
                    <div className="card-stat js-cardApparel-protects">
                        <div>{t('protects')}</div>
                        {itemData.LOCATIONS_COVERED?.map(location => {
                            // TODO i don't know if variant should be handled the same way here, we are talking about location not items
                            const locationText = t(location, {
                                variation: t(characterItem.variation!), // if var=undefined, t() returns undefined (handled)
                            });

                            return <div key={locationText}>{locationText}</div>;
                        })}
                    </div>
                </section>
            </div>

            {/* Tags container for effects, qualities, and mod effects */}
            <div className="tags-container">
                {/* Intrinsic EFFECTS (from base item) */}
                {itemData.EFFECTS?.map((effect) => {
                    const [effectType, effectOpt] = effect.split(':');
                    // If it's a number, keep it as is. If it's a string, try to translate it.
                    let displayValue = t(effectOpt!) // undefined or number = itself, translatable gets translated
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

                {/* MOD_NAMES (names of applied mods) */}
                {/* TODO mod names not cool here, but could be added somewhere
                characterItem.mods.map((modId) => {
                        return (
                            <Tag
                                key={modId}
                                tooltipId={`${modId}Description`}
                                isMod={true}
                            >
                                {t(modId)}
                            </Tag>
                        );
                    })
                */}
            </div>
        </section>
    );
}

export default ApparelContent
