import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GenericPopupProps } from '@/types';
import BasePopup from '@/components/popup/common/BasePopup.tsx';
import useInputNumberState from '@/hooks/useInputNumberState.ts';
import { D6Die } from '@/components/popup/dice/components/dice.tsx';

type ResultDisplay = 'damage' | 'effects' | 'both';


interface Nd6PopupProps extends GenericPopupProps {
    diceCount: number | undefined;
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

    const [diceNumber, setDiceNumber] = useInputNumberState(diceCount ?? 6);
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
        const rolls = Array.from({ length: Number(diceNumber) }, () => Math.floor(Math.random() * 6) + 1);
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
            <div className="stack no-gap"
                style={{width: "100%"}}>

                    {description && (
                        <>
                            <hr />
                            <p style={{ textAlign: 'center', margin: '0.5rem 0' }}>
                                {description}
                            </p>
                        </>
                    )}

                    {diceCount === undefined && (
                        <>
                            <hr />
                            <div className={"row l-distributed l-lastSmall"}>
                                <p>{t("diceToRoll")}:</p>
                                <input type={"number"}
                                       min={1}
                                       max={54} // on small devices it's the max with no overflow
                                       defaultValue={diceNumber}
                                       disabled={hasRolled}
                                       onChange={e => setDiceNumber(e.target.value)}/>
                            </div>
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
                        {Array.from({ length: Number(diceNumber) }, (_, i) => (
                            <D6Die
                                value={diceValues[i] ?? '?'}
                                key={i}
                                isActive={false}
                                isRerolled={true}
                                onClick={() => {}}/>
                        ))}
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

