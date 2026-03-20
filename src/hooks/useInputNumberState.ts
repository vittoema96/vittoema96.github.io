import { Dispatch, SetStateAction, useState } from 'react';

type InputNumberType = number | '';

const parseInputNumber = (val: string | number): InputNumberType => {
    const parsed = Number.parseInt(val);
    return Number.isNaN(parsed) ? '' : parsed;
}

const getSetValueFunc = (setValue: Dispatch<SetStateAction<InputNumberType>>) => {
    return ((val: string | number) => {
        setValue(parseInputNumber(val));
    }) as Dispatch<SetStateAction<InputNumberType>>;
}

function useInputNumberState(initialOrInitializer?: InputNumberType | (() => InputNumberType)):
    [InputNumberType, Dispatch<SetStateAction<InputNumberType>>] {
        const [value, setValue] = useState<InputNumberType>(() => {
            if (typeof initialOrInitializer === 'function') {
                return parseInputNumber(initialOrInitializer());
            }
            if (initialOrInitializer !== undefined) {
                return parseInputNumber(initialOrInitializer);
            }
            return '';
        });
        return [value, getSetValueFunc(setValue)] as const;
    }

export default useInputNumberState;
