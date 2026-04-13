import { useTranslation } from 'react-i18next';
import { GenericPopupProps } from '@/types';
import { D20Dice } from '@/components/popup/dice/components/dice.tsx';
import NdXPopup from '@/components/popup/dice/NdXPopup.tsx';

interface Nd20PopupProps extends GenericPopupProps {
    diceCount: number | undefined;
    title: string;
    description?: string | undefined;

    minFailure?: number | undefined;
    maxCritical?: number | undefined;

    onResult: (result: {
        total: number;
        crits: number;
        failures: number;
        rolls: number[]
    }) => void;
}

/**
 * Generic N d6 popup for rolling multiple d6 dice
 * Used for various game mechanics that require rolling combat dice
 */

function Nd20Popup({
    diceCount,
    title,
    description,
    minFailure = 20,
    maxCritical = 1,
    onClose, onResult
}: Readonly<Nd20PopupProps>) {

    const { t } = useTranslation();

    const getTotal = (diceValues: number[]) => {
         return  diceValues.reduce((tot, val) => tot + val, 0)
    }

    const getCrits = (diceValues: number[]) => {
        return diceValues.filter(v => v <= maxCritical).length
    }

    const getFailures = (diceValues: number[]) => {
        return diceValues.filter(v => v >= minFailure).length
    }

    const onConfirm = (diceValues: number[]) => {
        if (onResult) {
            onResult({
                total: getTotal(diceValues),
                crits: getCrits(diceValues),
                failures: getFailures(diceValues),
                rolls: diceValues
            })
        }
    }

    const renderSection = (diceValues: number[], hasRolled: boolean) => {

        return hasRolled && (
            <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
                <div>{t('total')}: {getTotal(diceValues)}</div>
            </div>
        )
    }
    return (
        <NdXPopup
            diceMaxValue={20}
            diceClass={D20Dice}
            diceCount={diceCount}

            title={title}
            description={description}

            renderSection={renderSection}

            onConfirm={onConfirm}
            onClose={onClose}
            />
    )
}

export default Nd20Popup;

