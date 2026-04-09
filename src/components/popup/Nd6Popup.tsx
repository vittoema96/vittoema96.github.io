import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GenericPopupProps } from '@/types';
import BasePopup from '@/components/popup/common/BasePopup.tsx';

type ResultDisplay = 'damage' | 'effects' | 'both';


// Get dice face class from roll (1-6)
const getDiceClassFromRoll = (roll: number): string => {
    if (roll >= 5) {
        return 'd6-face-blank';
    }
    if (roll >= 3) {
        return 'd6-face-effect';
    }
    if (roll >= 2) {
        return 'd6-face-damage2';
    }
    return 'd6-face-damage1';
};

interface Nd6PopupProps extends GenericPopupProps {
    diceCount: number;
    title: string;
    description?: string | undefined;
    resultDisplay: ResultDisplay;
    onResult: (result: { totalDamage: number; totalEffects: number; rolls: number[] }) => void;
}

/**
 * Generic N d6 popup for rolling multiple d6 dice
 * Used for various game mechanics that require rolling combat dice
 */
function Nd6Popup({ onClose, diceCount, title, description, resultDisplay, onResult }: Readonly<Nd6PopupProps>) {
    const { t } = useTranslation();

    const [diceValues, setDiceValues] = useState<number[]>([]);
    const [hasRolled, setHasRolled] = useState<boolean>(false);

    // Count damage (1-4 on dice)
    const totalDamage = useMemo(() => {
            return diceValues.filter(v => v <= 4).length
        }, [diceValues])

    // Count effects (3-4 on dice)
    const totalEffects = useMemo(() => {
        return diceValues.filter(v => v === 3 || v === 4).length;
    }, [diceValues]);

    // Handle roll
    const handleRoll = () => {
        const rolls = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
        setDiceValues(rolls);
        setHasRolled(true);
    };

    // Handle confirm (call onResult callback if provided)
    const handleConfirm = () => {
        if (onResult && hasRolled) {
            onResult({
                totalDamage,
                totalEffects,
                rolls: diceValues
            });
        }
    };

    return (
        <BasePopup
            title={title}
            confirmLabel={'confirm'}
            onConfirm={hasRolled ? handleConfirm : undefined}
            footerChildren={!hasRolled &&
                <button
                    className="confirmButton"
                    onClick={handleRoll}
                >
                    {t('roll')}
                </button>
            }
            onClose={onClose}
        >
            <div className="stack no-gap">

                    {description && (
                        <>
                            <hr />
                            <p style={{ textAlign: 'center', margin: '0.5rem 0' }}>
                                {description}
                            </p>
                        </>
                    )}

                    <hr />

                    {/* Dice display */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, 2.5rem)',
                        gap: '0.25rem',
                        justifyContent: 'center',
                        minHeight: '2.5rem',
                        margin: '0.5rem 0'
                    }}>
                        {Array.from({ length: diceCount }, (_, index) => {
                            const roll = diceValues[index];
                            const diceClass = roll ? getDiceClassFromRoll(roll) : null;

                            return (
                                <div
                                    key={index}
                                    className={`d6-dice dice ${diceClass || ''}`}
                                >
                                    {diceClass ? '' : '?'}
                                </div>
                            );
                        })}
                    </div>

                    {/* Results display */}
                    {hasRolled && (
                        <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
                            {(resultDisplay === 'damage' || resultDisplay === 'both') && (
                                <div>{t('totalDamage')}: {totalDamage}</div>
                            )}
                            {(resultDisplay === 'effects' || resultDisplay === 'both') && (
                                <div>{t('totalEffects')}: {totalEffects}</div>
                            )}
                        </div>
                    )}
                </div>
        </BasePopup>
    );
}

export default Nd6Popup;

