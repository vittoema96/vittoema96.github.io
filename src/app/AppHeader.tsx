import {useCharacter} from "@/contexts/CharacterContext";
import {usePopup} from "@/contexts/popup/PopupContext";
import { FitText } from '@/app/FitText.tsx';

export function AppHeader() {
    const {character} = useCharacter()

    const {showStatAdjustmentPopup} = usePopup()

    // Effective max HP is reduced by rads
    const effectiveMaxHp = character.maxHp - character.rads
    const hasRads = character.rads > 0


    return (
        <header className="l-lastSmall">
            <FitText maxSize={35} style={{margin: "1rem"}}>Pip-Boy 3000</FitText>
            <div onClick={showStatAdjustmentPopup}
                 style={{cursor: 'pointer'}}>
                <HeaderStatRow icon="hp"
                           value={character.currentHp}
                           value2={effectiveMaxHp}
                           value2Danger={hasRads}
                           useBorder/>
                <HeaderStatRow icon="caps"
                           value={character.caps || 0}
                           useBorder/>
                <HeaderStatRow icon="weight"
                           value={character.currentWeight}
                           value2={character.maxWeight}/>
            </div>
        </header>
    )
}

function HeaderStatRow({
    icon,
    value,
    value2,
    useBorder,
    value2Danger
}: Readonly<{ icon: string; value: number | string; value2?: number | string; useBorder?: boolean, value2Danger?: boolean }>) {
    return (
        <div style={{
                padding: '2px',
                display: 'flex',
             }}
             className={useBorder ? 'bottomBorder' : ''}
        >
            <div
                className="themed-svg"
                style={{ width: '15px', height: '15px' }}
                data-icon={icon}
            ></div>
            <div style={{ flex: 1, textAlign: 'center', padding: '0 8px' }}>
                {value}
                {value2 && ' / '}
                {value2 && <span className={value2Danger ? 'text-danger' : ''}>{value2}</span>}
            </div>
        </div>
    );
}

export default AppHeader
