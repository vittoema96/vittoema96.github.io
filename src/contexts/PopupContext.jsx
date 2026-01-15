import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import AlertPopup from '../components/popups/AlertPopup.jsx'
import D20Popup from '../components/popups/D20Popup.jsx'
import D6Popup from '../components/popups/D6Popup.jsx'
import AddItemPopup from '../components/popups/AddItemPopup.jsx'
import StatAdjustmentPopup from '../components/popups/StatAdjustmentPopup.jsx'
import TradeItemPopup from '../components/popups/TradeItemPopup.jsx'
import ModifyItemPopup from '../components/popups/ModifyItemPopup.jsx'
import { useI18n } from '../hooks/useI18n.js'
import { useDataManager } from '../hooks/useDataManager.js'

const PopupContext = createContext()

// Initial state constants to avoid recreating objects
const INITIAL_ALERT_STATE = {
    isOpen: false,
    title: '',
    content: '',
    onConfirm: null,
    showConfirm: false
}

const INITIAL_D20_STATE = {
    isOpen: false,
    skillId: null,
    weaponId: null
}

const INITIAL_D6_STATE = {
    isOpen: false,
    weaponId: null,
    hasAimed: false
}

const INITIAL_ADD_ITEM_STATE = {
    isOpen: false,
    itemType: null
}

const INITIAL_STAT_ADJUSTMENT_STATE = {
    isOpen: false
}

const INITIAL_TRADE_ITEM_STATE = {
    isOpen: false,
    characterItem: null,
    itemData: null,
    onConfirm: null
}

const INITIAL_MODIFY_ITEM_STATE = {
    isOpen: false,
    characterItem: null,
    itemData: null
}

export const usePopup = () => {
    const context = useContext(PopupContext)
    if (!context) {
        throw new Error('usePopup must be used within a PopupProvider')
    }
    return context
}

export function PopupProvider({ children }) {
    const t = useI18n()
    const dataManager = useDataManager()

    const [alertState, setAlertState] = useState(INITIAL_ALERT_STATE)
    const [d20State, setD20State] = useState(INITIAL_D20_STATE)
    const [d6State, setD6State] = useState(INITIAL_D6_STATE)
    const [addItemState, setAddItemState] = useState(INITIAL_ADD_ITEM_STATE)
    const [statAdjustmentState, setStatAdjustmentState] = useState(INITIAL_STAT_ADJUSTMENT_STATE)
    const [tradeItemState, setTradeItemState] = useState(INITIAL_TRADE_ITEM_STATE)
    const [modifyItemState, setModifyItemState] = useState(INITIAL_MODIFY_ITEM_STATE)

    // Alert Popup functions
    const showAlert = useCallback((content, title = null) => {
        const translatedContent = t(content || '')

        setAlertState({
            isOpen: true,
            title: title,
            content: translatedContent,
            onConfirm: null,
            showConfirm: false
        })
    }, [t])

    const showConfirm = useCallback((content, onConfirm, title = null) => {
        const translatedContent = t(content || '')

        setAlertState({
            isOpen: true,
            title: title,
            content: translatedContent,
            onConfirm: onConfirm,
            showConfirm: true
        })
    }, [t])

    const closeAlert = useCallback(() => {
        setAlertState(INITIAL_ALERT_STATE)
    }, [])

    // D20 Popup functions
    const showD20Popup = useCallback((skillId, characterItem = null) => {
        setD20State({
            isOpen: true,
            skillId: skillId,
            characterItem: characterItem,
            // Keep weaponId for backward compatibility
            weaponId: characterItem?.id || null
        })
    }, [])

    const closeD20Popup = useCallback(() => {
        setD20State(INITIAL_D20_STATE)
    }, [])

    // D6 Popup functions
    const showD6Popup = useCallback((characterItem, hasAimed = false) => {
        setD6State({
            isOpen: true,
            characterItem: characterItem,
            // Keep weaponId for backward compatibility
            weaponId: characterItem?.id || null,
            hasAimed: hasAimed
        })
    }, [])

    const closeD6Popup = useCallback(() => {
        setD6State(INITIAL_D6_STATE)
    }, [])

    // AddItem Popup functions
    const showAddItemPopup = useCallback((itemType) => {
        setAddItemState({
            isOpen: true,
            itemType: itemType
        })
    }, [])

    const closeAddItemPopup = useCallback(() => {
        setAddItemState(INITIAL_ADD_ITEM_STATE)
    }, [])

    // StatAdjustment Popup functions
    const showStatAdjustmentPopup = useCallback(() => {
        setStatAdjustmentState({
            isOpen: true
        })
    }, [])

    const closeStatAdjustmentPopup = useCallback(() => {
        setStatAdjustmentState(INITIAL_STAT_ADJUSTMENT_STATE)
    }, [])

    // TradeItem Popup functions
    const showTradeItemPopup = useCallback((characterItem, itemData, onConfirm) => {
        setTradeItemState({
            isOpen: true,
            characterItem: characterItem,
            itemData: itemData,
            onConfirm: onConfirm
        })
    }, [])

    const closeTradeItemPopup = useCallback(() => {
        setTradeItemState(INITIAL_TRADE_ITEM_STATE)
    }, [])

    // ModifyItem Popup functions
    const showModifyItemPopup = useCallback((characterItem, itemData) => {
        setModifyItemState({
            isOpen: true,
            characterItem: characterItem,
            itemData: itemData
        })
    }, [])

    const closeModifyItemPopup = useCallback(() => {
        setModifyItemState(INITIAL_MODIFY_ITEM_STATE)
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

            <AlertPopup
                isOpen={alertState.isOpen}
                onClose={closeAlert}
                title={alertState.title}
                content={alertState.content}
                onConfirm={alertState.onConfirm}
                showConfirm={alertState.showConfirm}
            />

            <D20Popup
                isOpen={d20State.isOpen}
                onClose={closeD20Popup}
                skillId={d20State.skillId}
                characterItem={d20State.characterItem}
                weaponId={d20State.weaponId}
            />

            <D6Popup
                isOpen={d6State.isOpen}
                onClose={closeD6Popup}
                characterItem={d6State.characterItem}
                weaponId={d6State.weaponId}
                hasAimed={d6State.hasAimed}
            />

            <AddItemPopup
                isOpen={addItemState.isOpen}
                onClose={closeAddItemPopup}
                itemType={addItemState.itemType}
                dataManager={dataManager}
            />

            <StatAdjustmentPopup
                isOpen={statAdjustmentState.isOpen}
                onClose={closeStatAdjustmentPopup}
            />

            <TradeItemPopup
                isOpen={tradeItemState.isOpen}
                onClose={closeTradeItemPopup}
                characterItem={tradeItemState.characterItem}
                itemData={tradeItemState.itemData}
                onConfirm={tradeItemState.onConfirm}
            />

            <ModifyItemPopup
                isOpen={modifyItemState.isOpen}
                onClose={closeModifyItemPopup}
                characterItem={modifyItemState.characterItem}
                itemData={modifyItemState.itemData}
            />
        </PopupContext.Provider>
    )
}
