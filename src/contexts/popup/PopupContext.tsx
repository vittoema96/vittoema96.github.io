import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import AlertPopup from '@/contexts/popup/AlertPopup'
import D20Popup from '@/contexts/popup/D20Popup'
import D6Popup from '@/contexts/popup/D6Popup'
import AddItemPopup from '@/contexts/popup/AddItemPopup'
import StatAdjustmentPopup from '@/contexts/popup/StatAdjustmentPopup'
import TradeItemPopup from '@/contexts/popup/TradeItemPopup'
import ModifyItemPopup from '@/contexts/popup/ModifyItemPopup'
import { useTranslation } from 'react-i18next'
import {CharacterItem, Item, ItemType, PopupContextValue, SkillType} from "@/types";
import { getModifiedItemData } from '@/hooks/getGameDatabase.ts';

const PopupContext = createContext<PopupContextValue | undefined>(undefined)


// TODO most of UsingItemPopups NEED a CharacterItem (except for D20)
interface UsingItemPopupState {
    usingItem: CharacterItem | null;
}


interface AlertState {
    content: string;
    onConfirm: () => void;
    showConfirm: boolean;
}

interface D20State extends UsingItemPopupState {
    skillId: SkillType | 'perkMysteriousStranger';
}

interface D6State extends UsingItemPopupState {
    hasAimed: boolean;
    isMysteriousStranger: boolean;
}

interface AddItemState {
    itemType: ItemType;
}

interface StatAdjustmentState {}

interface TradeItemState extends UsingItemPopupState {
    itemData: Item;
    onConfirm: ((quantity: number, price: number) => void) | null;
}

interface ModifyItemState extends UsingItemPopupState {
    itemData: Item;
    usingItem: CharacterItem;
}

export const usePopup = (): PopupContextValue => {
    const context = useContext(PopupContext)
    if (!context) {
        throw new Error('usePopup must be used within a PopupProvider')
    }
    return context
}

// TODO may have to add a "close d20 popup on d6 close / click"
export function PopupProvider({ children }: Readonly<React.PropsWithChildren>) {
    const { t } = useTranslation()

    // TODO is there a reason to use all these states here?
    //  specific popup state lives inside that class, here we case just about open / close
    const [alertState, setAlertState] = useState<AlertState | undefined>(undefined)
    const [d20State, setD20State] = useState<D20State | undefined>(undefined)
    const [d6State, setD6State] = useState<D6State | undefined>(undefined)
    const [addItemState, setAddItemState] = useState<AddItemState | undefined>(undefined)
    const [statAdjustmentState, setStatAdjustmentState] = useState<StatAdjustmentState | undefined>(undefined)
    const [tradeItemState, setTradeItemState] = useState<TradeItemState | undefined>(undefined)
    const [modifyItemState, setModifyItemState] = useState<ModifyItemState | undefined>(undefined)

    // Alert Popup functions
    const showAlert = useCallback(
        (content: string) => {
            const translatedContent = t(content || '')
            setAlertState({
                content: translatedContent,
                onConfirm: () => {},
                showConfirm: false
            })
        }, [t]
    )

    const showConfirm = useCallback(
        (content: string, onConfirm: () => void) => {
            const translatedContent = t(content || '')
            setAlertState({
                content: translatedContent,
                onConfirm: onConfirm,
                showConfirm: true
            })
        }, [t]
    )

    const closeAlert = useCallback(() => {
        setAlertState(undefined)
    }, [])

    // D20 Popup functions
    const showD20Popup = useCallback(
        (skillId: SkillType | 'perkMysteriousStranger', usingItem: CharacterItem | null = null) => {
            setD20State({
                skillId: skillId,
                usingItem: usingItem,
            })
        }, []
    )

    const closeD20Popup = useCallback(() => {
        setD20State(undefined)
    }, [])

    // D6 Popup functions
    const showD6Popup = useCallback(
        (usingItem: CharacterItem, hasAimed = false, isMysteriousStranger = false) => {
            setD6State({
                usingItem: usingItem,
                hasAimed: hasAimed,
                isMysteriousStranger: isMysteriousStranger
            })
        }, []
    )

    const closeD6Popup = useCallback(() => {
        setD6State(undefined)
    }, [])

    // AddItem Popup functions
    const showAddItemPopup = useCallback(
        (itemType: ItemType) => {
            setAddItemState({
                itemType: itemType
            })
        }, []
    )

    const closeAddItemPopup = useCallback(() => {
        setAddItemState(undefined)
    }, [])

    // StatAdjustment Popup functions
    const showStatAdjustmentPopup = useCallback(() => {
        setStatAdjustmentState({ isOpen: true })
    }, [])

    const closeStatAdjustmentPopup = useCallback(() => {
        setStatAdjustmentState(undefined)
    }, [])

    // TradeItem Popup functions
    const showTradeItemPopup = useCallback(
        (usingItem: CharacterItem,
         itemData: Item,
         onConfirm: (quantity: number, price: number) => void) => {
            setTradeItemState({
                usingItem: usingItem,
                itemData: itemData,
                onConfirm: onConfirm
            })
        }, []
    )

    const closeTradeItemPopup = useCallback(() => {
        setTradeItemState(undefined)
    }, [])

    // ModifyItem Popup functions
    const showModifyItemPopup = useCallback(
        (usingItem: CharacterItem) => {
            setModifyItemState({
                usingItem: usingItem,
                itemData: getModifiedItemData(usingItem)!
            })
        }, []
    )

    const closeModifyItemPopup = useCallback(() => {
        setModifyItemState(undefined)
    }, [])

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(
        () => ({
            showAlert,
            showConfirm,
            closeAlert,
            showD20Popup,
            closeD20Popup,
            showD6Popup,
            closeD6Popup,
            showAddItemPopup,
            closeAddItemPopup,
            showStatAdjustmentPopup,
            closeStatAdjustmentPopup,
            showTradeItemPopup,
            closeTradeItemPopup,
            showModifyItemPopup,
            closeModifyItemPopup
        }),
        [
            showAlert,
            showConfirm,
            closeAlert,
            showD20Popup,
            closeD20Popup,
            showD6Popup,
            closeD6Popup,
            showAddItemPopup,
            closeAddItemPopup,
            showStatAdjustmentPopup,
            closeStatAdjustmentPopup,
            showTradeItemPopup,
            closeTradeItemPopup,
            showModifyItemPopup,
            closeModifyItemPopup
        ]
    )

    return (
        <PopupContext.Provider value={contextValue}>
            {children}

            {alertState && <AlertPopup
                onClose={closeAlert}
                content={alertState.content}
                onConfirm={alertState.onConfirm}
                showConfirm={alertState.showConfirm}
            />}

            {d20State && <D20Popup
                onClose={closeD20Popup}
                skillId={d20State.skillId}
                usingItem={d20State.usingItem}
            />}

            {d6State && <D6Popup
                onClose={closeD6Popup}
                usingItem={d6State.usingItem}
                hasAimed={d6State.hasAimed}
                isMysteriousStranger={d6State.isMysteriousStranger}
            />}

            {addItemState?.itemType && <AddItemPopup
                onClose={closeAddItemPopup}
                itemType={addItemState.itemType}
            />}

            {statAdjustmentState && <StatAdjustmentPopup
                onClose={closeStatAdjustmentPopup}
            />}

            {tradeItemState && <TradeItemPopup
                onClose={closeTradeItemPopup}
                characterItem={tradeItemState.usingItem}
                itemData={tradeItemState.itemData}
                onConfirm={tradeItemState.onConfirm}
            />}

            {modifyItemState && <ModifyItemPopup
                onClose={closeModifyItemPopup}
                characterItem={modifyItemState.usingItem}
            />}
        </PopupContext.Provider>
    )
}
