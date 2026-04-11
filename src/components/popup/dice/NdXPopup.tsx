import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GenericPopupProps } from '@/types';
import BasePopup from '@/components/popup/common/BasePopup.tsx';
import useInputNumberState from '@/hooks/useInputNumberState.ts';
import { DiceProps } from '@/components/popup/dice/components/dice.tsx';


interface NdXPopupProps extends GenericPopupProps {
    diceMaxValue: number;
    diceClass: React.ComponentType<DiceProps>;

    diceCount: number | undefined;
    title: string;
    description?: string | undefined;

    renderSection?: (diceValues: number[], hasRolled: boolean) => React.ReactNode;

    onConfirm: (diceValues: number[]) => void;
}

/**
 * Generic N d6 popup for rolling multiple d6 dice
 * Used for various game mechanics that require rolling combat dice
 */
function NdXPopup({
    diceMaxValue, diceClass: DiceClass,
    diceCount,
    title, description,
    renderSection,
    onClose, onConfirm
}: Readonly<NdXPopupProps>) {
    const { t } = useTranslation();

    const [diceNumber, setDiceNumber] = useInputNumberState(diceCount ?? 2);
    const [diceValues, setDiceValues] = useState<number[]>([]);
    const [hasRolled, setHasRolled] = useState<boolean>(false);

    // Handle roll
    const handleRoll = () => {
        const rolls = Array.from({ length: Number(diceNumber) }, () => {
            return Math.floor(Math.random() * diceMaxValue) + 1
        });
        setDiceValues(rolls);
        setHasRolled(true);
    };

    // Handle confirm (call onResult callback if provided)
    const handleConfirm = () => {
        if (onConfirm && hasRolled) {
            onConfirm(diceValues);
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
                    gap: '0.7rem',
                    justifyContent: 'center',
                    minHeight: '2.5rem',
                    margin: '0.5rem 0'
                }}>
                    {Array.from({ length: Number(diceNumber) }, (_, i) => (
                        <DiceClass
                            value={diceValues[i] ?? '?'}
                            key={i}
                            isActive={false}
                            isRerolled={true}/>
                    ))}
                </div>

                {/* Results display */}
                {renderSection?.(diceValues, hasRolled)}
            </div>
        </BasePopup>
    );
}

export default NdXPopup;

