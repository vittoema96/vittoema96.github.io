import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import AlertPopup from '@/components/popup/AlertPopup';
import D20Popup, { D20PopupProps } from '@/components/popup/dice/D20Popup.tsx';
import D6Popup, { D6PopupProps } from '@/components/popup/dice/D6Popup.tsx';
import Nd6Popup, { Nd6PopupProps } from '@/components/popup/dice/Nd6Popup.tsx';
import Nd20Popup, { Nd20PopupProps } from '@/components/popup/dice/Nd20Popup.tsx';
import AddItemPopup, { AddItemPopupProps } from '@/components/popup/AddItemPopup';
import TradeItemPopup, { TradeItemPopupProps } from '@/components/popup/TradeItemPopup.tsx';
import ModifyItemPopup, { ModifyItemPopupProps } from '@/components/popup/ModifyItemPopup';

export type RollerType = 'companion' | 'mysteriousStranger' | undefined;

interface ActivePopup {
    id: string;
    Component: React.ComponentType<any>;
    props: any;
}

// Utility to avoid writing Omit<T, 'onClose'> every time
type OmitOnClose<T> = Omit<T, 'onClose'>

export interface PopupContextValue {
    open: <T>(Component: React.ComponentType<T>, props: OmitOnClose<T>) => void;
    close: (identifier?: string | React.ComponentType<any>) => void;

    showAlert: (content: string) => void;
    showConfirm: (content: string, onConfirm: () => void) => void;
    showD20Popup: (props: OmitOnClose<D20PopupProps>) => void;
    showD6Popup: (props: OmitOnClose<D6PopupProps>) => void;
    showNd20Popup: (props: OmitOnClose<Nd20PopupProps>) => void;
    showNd6Popup: (props: OmitOnClose<Nd6PopupProps>) => void;
    showAddItemPopup: (props: OmitOnClose<AddItemPopupProps>) => void;
    showTradeItemPopup: (props: OmitOnClose<TradeItemPopupProps>) => void;
    showModifyItemPopup: (props: OmitOnClose<ModifyItemPopupProps>) => void;
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

    const showAlert: PopupContextValue["showAlert"] = useCallback(
        (content) =>
            open(AlertPopup, {
                content,
                showConfirm: false,
                onConfirm: () => {},
            }),
        [open],
    );

    const showConfirm: PopupContextValue["showConfirm"] = useCallback(
        (content, onConfirm) =>
            open(AlertPopup, {
                content,
                showConfirm: true,
                onConfirm,
            }),
        [open],
    );

    const showD20Popup: PopupContextValue["showD20Popup"] = useCallback(
        (props) =>
            open(D20Popup, props),
        [open],
    );

    const showD6Popup: PopupContextValue["showD6Popup"] = useCallback(
        (props) =>
            open(D6Popup, props),
        [open],
    );

    const showNd20Popup: PopupContextValue["showNd20Popup"] = useCallback(
        (props) =>
            open(Nd20Popup, props),
        [open],
    );

    const showNd6Popup: PopupContextValue["showNd6Popup"] = useCallback(
        (props) =>
            open(Nd6Popup, props),
        [open],
    );

    const showAddItemPopup: PopupContextValue["showAddItemPopup"] = useCallback(
        (props) =>
            open(AddItemPopup, props),
        [open],
    );

    const showTradeItemPopup: PopupContextValue["showTradeItemPopup"] = useCallback(
        (props) =>
            open(TradeItemPopup, props),
        [open],
    );

    const showModifyItemPopup: PopupContextValue["showModifyItemPopup"] = useCallback(
        (props) =>
            open(ModifyItemPopup, props),
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
