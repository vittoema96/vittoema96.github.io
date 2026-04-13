import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CharacterItem, CustomItem } from '@/types';
import { CompanionSkillType, SkillType } from '@/services/character/utils.ts';
import { ItemType } from '@/types/item.ts';

import AlertPopup from '@/components/popup/AlertPopup';
import D20Popup from '@/components/popup/dice/D20Popup.tsx';
import D6Popup from '@/components/popup/dice/D6Popup.tsx';
import Nd6Popup, { ResultDisplay } from '@/components/popup/dice/Nd6Popup.tsx';
import Nd20Popup from '@/components/popup/dice/Nd20Popup.tsx';
import AddItemPopup from '@/components/popup/AddItemPopup';
import TradeItemPopup from '@/components/popup/TradeItemPopup.tsx';
import ModifyItemPopup from '@/components/popup/ModifyItemPopup';

export type RollerType = 'companion' | 'mysteriousStranger' | undefined;

interface ActivePopup {
    id: string;
    Component: React.ComponentType<any>;
    props: any;
}

export interface PopupContextValue {
    open: <T>(Component: React.ComponentType<T>, props: Omit<T, 'onClose'>) => void;
    close: (identifier?: string | React.ComponentType<any>) => void;

    showAlert: (content: string) => void;
    showConfirm: (content: string, onConfirm: () => void) => void;
    showD20Popup: (
        skillId: SkillType | CompanionSkillType,
        usingItem?: CharacterItem | null,
        roller?: RollerType,
    ) => void;
    showD6Popup: (usingItem: CharacterItem, hasAimed?: boolean, roller?: RollerType) => void;
    showNd20Popup: (
        diceCount: number | undefined,
        title: string,
        onResult?: any,
        description?: string,
        maxCritical?: number,
        minFailure?: number,
    ) => void;
    showNd6Popup: (
        diceCount: number | undefined,
        title: string,
        description?: string,
        resultDisplay?: ResultDisplay,
        onResult?: any,
    ) => void;
    showAddItemPopup: (itemType: ItemType) => void;
    showTradeItemPopup: (usingItem: CharacterItem | CustomItem) => void;
    showModifyItemPopup: (usingItem: CharacterItem) => void;
}

const PopupContext = createContext<PopupContextValue | undefined>(undefined);

export const usePopup = () => {
    const context = useContext(PopupContext);
    if (!context) {
        throw new Error('usePopup must be used within a PopupProvider');
    }
    return context;
};

export function PopupProvider({ children }: Readonly<React.PropsWithChildren>) {
    const [stack, setStack] = useState<ActivePopup[]>([]);

    const close = useCallback((identifier?: string | React.ComponentType<any>) => {
        setStack(prev => {
            if (identifier) {
                if(typeof identifier === 'string') {
                    return prev.filter(p => p.id !== identifier)
                }
                const index = prev.findLastIndex(p => p.Component === identifier);
                if (index === -1) {
                    throw new Error(`Could not close popup because no "${identifier}" was found.`);
                }
                return prev.splice(index, 1);
            }
            return prev.slice(0, -1); // Close last opened popup
        });
    }, []);

    const open = useCallback(<T,>(Component: React.ComponentType<T>, props: Omit<T, 'onClose'>) => {
        const id = crypto.randomUUID();
        setStack(prev => [...prev, { id, Component, props }]);
    }, []);

    // --- Specific implementations of 'open'

    const showAlert = useCallback(
        (content: string) =>
            open(AlertPopup, {
                content,
                showConfirm: false,
                onConfirm: () => {},
            }),
        [open],
    );

    const showConfirm = useCallback(
        (content: string, onConfirm: () => void) =>
            open(AlertPopup, {
                content,
                showConfirm: true,
                onConfirm,
            }),
        [open],
    );

    const showD20Popup = useCallback(
        (skillId: any, roller: any, usingItem: any = null) =>
            open(D20Popup, {
                skillId,
                usingItem,
                roller,
            }),
        [open],
    );

    const showD6Popup = useCallback(
        (usingItem: any, roller: any, hasAimed = false) =>
            open(D6Popup, {
                usingItem,
                hasAimed,
                roller,
            }),
        [open],
    );

    const showNd20Popup = useCallback(
        (
            diceCount: any,
            title: string,
            onResult: any,
            description: any,
            maxCritical: any,
            minFailure: any,
        ) =>
            open(Nd20Popup, {
                diceCount,
                title,
                onResult: onResult || (() => {}),
                description,
                maxCritical,
                minFailure,
            }),
        [open],
    );

    const showNd6Popup = useCallback(
        (diceCount: any, title: string, description: any, onResult: any, resultDisplay: ResultDisplay = 'both') =>
            open(Nd6Popup, {
                diceCount,
                title,
                description,
                resultDisplay,
                onResult: onResult || (() => {}),
            }),
        [open],
    );

    const showAddItemPopup = useCallback(
        (itemType: ItemType) =>
            open(AddItemPopup, {
                itemType,
            }),
        [open],
    );

    const showTradeItemPopup = useCallback(
        (usingItem: any) =>
            open(TradeItemPopup, {
                characterItem: usingItem,
            }),
        [open],
    );

    const showModifyItemPopup = useCallback(
        (usingItem: any) =>
            open(ModifyItemPopup, {
                characterItem: usingItem,
            }),
        [open],
    );

    const contextValue = useMemo(
        () => ({
            open,
            close,
            showAlert,
            showConfirm,
            showD20Popup,
            showD6Popup,
            showNd20Popup,
            showNd6Popup,
            showAddItemPopup,
            showTradeItemPopup,
            showModifyItemPopup,
        }),
        [
            open,
            close,
            showAlert,
            showConfirm,
            showD20Popup,
            showD6Popup,
            showNd20Popup,
            showNd6Popup,
            showAddItemPopup,
            showTradeItemPopup,
            showModifyItemPopup,
        ],
    );

    return (
        <PopupContext.Provider value={contextValue as any}>
            {children}

            {stack.map(popup => (
                <popup.Component key={popup.id} {...popup.props} onClose={() => close(popup.id)} />
            ))}
        </PopupContext.Provider>
    );
}
