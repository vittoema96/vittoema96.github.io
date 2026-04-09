import { Dispatch, SetStateAction, useCallback, useState } from 'react';

type InputNumberType = number | '';

const parseInputNumber = (val: any): InputNumberType => {
    const parsed = Number.parseInt(val);
    return Number.isNaN(parsed) ? '' : parsed;
}

function useInputNumberState(initial?: InputNumberType | (() => InputNumberType)):
    [InputNumberType,  Dispatch<SetStateAction<number | string>>] {
        const [value, setValue] = useState<InputNumberType>(() => {
            return typeof initial === 'function' ? parseInputNumber(initial()) : parseInputNumber(initial)
        });

        const setInputNumber:  Dispatch<SetStateAction<number | string>> = useCallback((action) => {
            setValue((prev) => {
                const nextValue = typeof action === 'function'
                    ? (action as (prev: InputNumberType) => InputNumberType)(prev)
                    : action;
                return parseInputNumber(nextValue)
            });
        }, []);
        return [value, setInputNumber];
    }

export default useInputNumberState;
