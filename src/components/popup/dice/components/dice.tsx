

export interface DiceProps {
    value: number | '?';
    isActive: boolean;
    isRerolled: boolean;
    onClick?: (() => void) | undefined;
}

export function BaseDice({
    value,
    displayValue,
    baseClass,
    getClassFromValue,
    isActive,
    isRerolled,
    extraStyle,
    onClick,
}: Readonly<DiceProps & {
    displayValue?: string;
    baseClass: string;
    getClassFromValue: (index: number | '?') => string;
    extraStyle?: Record<string, any> | undefined;
}>) {
    return (
        <button
            className={`${baseClass} dice ${getClassFromValue(value)} ${isActive ? 'active' : ''} ${isRerolled ? 'rerolled' : ''}`}
            onClick={onClick}
            style={extraStyle ?? {}}
        >
            {displayValue ?? value}
        </button>
    );
}

export function D20Dice({
    value,
    isActive,
    isRerolled,
    minComplication=20,
    maxCritical=1,
    biggerDie=true,
    onClick,
}: Readonly<DiceProps & {
    minComplication?: number;
    maxCritical?: number;
    biggerDie?: boolean;
}>) {
    const getDiceClass = (val: number | '?') => {
        if (val === '?') {
            return '';
        }
        if (val >= minComplication) {
            return 'roll-complication'; // Critical fail
        } else if (val <= maxCritical) {
            return 'roll-crit'; // Critical hit
        }
        return '';
    };
    return (
        <BaseDice
            value={value}
            baseClass={'d20-dice'}
            getClassFromValue={getDiceClass}
            isActive={isActive}
            isRerolled={isRerolled}
            extraStyle={biggerDie ? {} : { transform: 'scale(0.8)' }}
            onClick={onClick}
        />
    );
}




export const getFaceClass = (value: number | '?') => {
    const classBase = 'd6-face-';
    switch (value) {
        case 1:
            return classBase + 'damage1';
        case 2:
            return classBase + 'damage2';
        case 3:
        case 4:
            return classBase + 'effect';
        case 5:
        case 6:
            return classBase + 'blank';
        default:
            return '';
    }
};
export function D6Dice({
    value,
    isActive,
    isRerolled,
    onClick,
}: Readonly<DiceProps>) {
    return (
        <BaseDice
            value={value}
            displayValue={value === '?' ? '?' : ''}
            baseClass={'d6-dice'}
            getClassFromValue={getFaceClass}
            isActive={isActive}
            isRerolled={isRerolled}
            onClick={onClick}
        />
    );
}
