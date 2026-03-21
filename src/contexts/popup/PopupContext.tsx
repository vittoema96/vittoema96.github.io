import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import AlertPopup from '@/components/popup/AlertPopup'
import D20Popup from '@/components/popup/D20Popup'
import D20PopupWithRoller from '@/components/popup/D20PopupWithRoller'
import D6Popup from '@/components/popup/D6Popup'
import Nd6Popup from '@/components/popup/Nd6Popup'
import AddItemPopup from '@/components/popup/AddItemPopup'
import TradeItemPopup from '@/components/popup/TradeItemPopup'
import ModifyItemPopup from '@/components/popup/ModifyItemPopup'
import { CharacterItem, Item, ItemType, PopupContextValue, SkillType } from '@/types'
import { getModifiedItemData } from '@/hooks/getGameDatabase.ts'

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
    skillId: SkillType;
    roller?: 'companion' | 'mysteriousStranger';  // Optional: which character is rolling
}

interface D6State extends UsingItemPopupState {
    hasAimed: boolean;
    isMysteriousStranger: boolean;
}

interface Nd6State {
    diceCount: number;
    title: string;
    description?: string;
    resultDisplay?: 'damage' | 'effects' | 'both';
    onResult?: (result: { totalDamage: number; totalEffects: number; rolls: number[] }) => void;
}

interface AddItemState {
    itemType: ItemType;
}

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
    // No translations needed here currently

    // TODO is there a reason to use all these states here?
    //  specific popup state lives inside that class, here we case just about open / close
    const [alertState, setAlertState] = useState<AlertState | undefined>(undefined)
    const [d20State, setD20State] = useState<D20State | undefined>(undefined)
    const [d6State, setD6State] = useState<D6State | undefined>(undefined)
    const [nd6State, setNd6State] = useState<Nd6State | undefined>(undefined)
    const [addItemState, setAddItemState] = useState<AddItemState | undefined>(undefined)
    // StatAdjustment popup was moved to AppHeader (local only)
    const [tradeItemState, setTradeItemState] = useState<TradeItemState | undefined>(undefined)
    const [modifyItemState, setModifyItemState] = useState<ModifyItemState | undefined>(undefined)

    // Alert Popup functions
    const showAlert = useCallback(
        (content: string) => {
            setAlertState({
                content: content,
                onConfirm: () => {},
                showConfirm: false
            })
        }, []
    )

    const showConfirm = useCallback(
        (content: string, onConfirm: () => void) => {
            setAlertState({
                content: content,
                onConfirm: onConfirm,
                showConfirm: true
            })
        }, []
    )

    const closeAlert = useCallback(() => {
        setAlertState(undefined)
    }, [])

    // D20 Popup functions
    const showD20Popup = useCallback(
        (skillId: SkillType, usingItem: CharacterItem | null = null, roller?: 'companion' | 'mysteriousStranger') => {
            setD20State({
                skillId: skillId,
                usingItem: usingItem,
                roller: roller
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

    // Nd6 Popup functions
    const showNd6Popup = useCallback(
        (diceCount: number, title: string, description?: string, resultDisplay?: 'damage' | 'effects' | 'both', onResult?: (result: { totalDamage: number; totalEffects: number; rolls: number[] }) => void) => {
            setNd6State({
                diceCount,
                title,
                description,
                resultDisplay,
                onResult
            })
        }, []
    )

    const closeNd6Popup = useCallback(() => {
        setNd6State(undefined)
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

    // StatAdjustment Popup handlers removed (moved to AppHeader)

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
            showNd6Popup,
            closeNd6Popup,
            showAddItemPopup,
            closeAddItemPopup,
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
            showNd6Popup,
            closeNd6Popup,
            showAddItemPopup,
            closeAddItemPopup,
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

	            {d20State && (
	                d20State.roller ? (
	                    <D20PopupWithRoller
	                        onClose={closeD20Popup}
	                        skillId={d20State.skillId}
	                        usingItem={d20State.usingItem}
	                        roller={d20State.roller}
	                        onShowDamage={(usingItem, hasAimed, isMysteriousStrangerOrCompanion) => {
	                            showD6Popup(usingItem, hasAimed, isMysteriousStrangerOrCompanion)
	                        }}
	                    />
	                ) : (
	                    <D20Popup
	                        onClose={closeD20Popup}
	                        skillId={d20State.skillId}
	                        usingItem={d20State.usingItem}
	                        onShowDamage={(usingItem, hasAimed, isMysteriousStrangerOrCompanion) => {
	                            showD6Popup(usingItem, hasAimed, isMysteriousStrangerOrCompanion)
	                        }}
	                    />
	                )
	            )}

            {d6State && <D6Popup
                onClose={closeD6Popup}
                usingItem={d6State.usingItem}
                hasAimed={d6State.hasAimed}
                isMysteriousStranger={d6State.isMysteriousStranger}
            />}

            {nd6State && <Nd6Popup
                onClose={closeNd6Popup}
                diceCount={nd6State.diceCount}
                title={nd6State.title}
                description={nd6State.description}
                resultDisplay={nd6State.resultDisplay}
                onResult={nd6State.onResult}
            />}

            {addItemState?.itemType && <AddItemPopup
                onClose={closeAddItemPopup}
                itemType={addItemState.itemType}
            />}

            {/* StatAdjustmentPopup moved to AppHeader */}

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
