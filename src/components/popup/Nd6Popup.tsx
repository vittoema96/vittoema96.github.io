import { useState, useRef } from 'react';
import { useCharacter } from '@/contexts/CharacterContext';
import { useTranslation } from 'react-i18next';
import { useDialog } from '@/hooks/useDialog';
import { GenericPopupProps } from '@/types';
import DialogPortal from '@/components/popup/common/DialogPortal.tsx';
import PopupHeader from '@/components/popup/common/PopupHeader.tsx';

type ResultDisplay = 'damage' | 'effects' | 'both';

interface Nd6PopupProps extends GenericPopupProps {
    diceCount: number;
    title: string;
    description?: string;
    resultDisplay?: ResultDisplay;
    onResult?: (result: { totalDamage: number; totalEffects: number; rolls: number[] }) => void;
}

/**
 * Generic N d6 popup for rolling multiple d6 dice
 * Used for various game mechanics that require rolling combat dice
 */
function Nd6Popup({ onClose, diceCount, title, description, resultDisplay = 'both', onResult }: Readonly<Nd6PopupProps>) {
    const { t } = useTranslation();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const { closeWithAnimation } = useDialog(dialogRef, onClose);

    const [diceValues, setDiceValues] = useState<number[]>([]);

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

    // Count damage (1-4 on dice)
    const getTotalDamage = (): number => {
        return diceValues.filter(v => v <= 4).length;
    };

    // Count effects (3-4 on dice)
    const getTotalEffects = (): number => {
        return diceValues.filter(v => v >= 3 && v <= 4).length;
    };

    const hasRolled = diceValues.length > 0;

    // Handle roll
    const handleRoll = () => {
        const rolls = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
        setDiceValues(rolls);
    };

    // Handle confirm (call onResult callback if provided)
    const handleConfirm = () => {
        if (onResult && hasRolled) {
            onResult({
                totalDamage: getTotalDamage(),
                totalEffects: getTotalEffects(),
                rolls: diceValues
            });
        }
        closeWithAnimation();
    };

    return (
        <DialogPortal>
            <dialog ref={dialogRef}>
                <div className="stack no-gap">
                    <PopupHeader title={title} onClose={() => closeWithAnimation()} />

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
                                <div>{t('totalDamage')}: {getTotalDamage()}</div>
                            )}
                            {(resultDisplay === 'effects' || resultDisplay === 'both') && (
                                <div>{t('totalEffects')}: {getTotalEffects()}</div>
                            )}
                        </div>
                    )}

                    <hr />

                    <footer>
                        <button
                            className="confirmButton"
                            onClick={hasRolled ? handleConfirm : handleRoll}
                        >
                            {t(hasRolled ? 'confirm' : 'roll')}
                        </button>
                        <button
                            className="closeButton"
                            onClick={() => closeWithAnimation()}
                        >
                            {t('close')}
                        </button>
                    </footer>
                </div>
            </dialog>
        </DialogPortal>
    );
}

export default Nd6Popup;

