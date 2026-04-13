import { useTranslation } from 'react-i18next';
import { GenericPopupProps } from '@/types';
import { D6Dice } from '@/components/popup/dice/components/dice.tsx';
import NdXPopup from '@/components/popup/dice/NdXPopup.tsx';

export type ResultDisplay = 'damage' | 'effects' | 'both';


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

    const getTotalDamage = (diceValues: number[]) => {
        return diceValues.filter(v => v <= 4).length;
    }

    const getTotalEffects = (diceValues: number[]) => {
        return diceValues.filter(v => v === 3 || v === 4).length
    }

    const onConfirm = (diceValues: number[]) => {
        if (onResult) {
            onResult({
                totalDamage: getTotalDamage(diceValues),
                totalEffects: getTotalEffects(diceValues),
                rolls: diceValues
            })
        }
    }

    const renderSection = (diceValues: number[], hasRolled: boolean) => {

        return hasRolled && (
            <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
                {(resultDisplay === 'damage' || resultDisplay === 'both') && (
                    <div>{t('totalDamage')}: {getTotalDamage(diceValues)}</div>
                )}
                {(resultDisplay === 'effects' || resultDisplay === 'both') && (
                    <div>{t('totalEffects')}: {getTotalEffects(diceValues)}</div>
                )}
            </div>
        )
    }
    return (
        <NdXPopup
            diceMaxValue={6}
            diceClass={D6Dice}
            diceCount={diceCount}

            title={title}
            description={description}

            renderSection={renderSection}

            onConfirm={onConfirm}
            onClose={onClose}
            />
    )
}

export default Nd6Popup;

