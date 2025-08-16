import React, { createContext, useContext, useState } from 'react'
import AlertPopup from '../components/popups/AlertPopup.jsx'
import D20Popup from '../components/popups/D20Popup.jsx'
import D6Popup from '../components/popups/D6Popup.jsx'
import AddItemPopup from '../components/popups/AddItemPopup.jsx'
import StatAdjustmentPopup from '../components/popups/StatAdjustmentPopup.jsx'
import TradeItemPopup from '../components/popups/TradeItemPopup.jsx'
import { useI18n } from '../hooks/useI18n.js'
import { useDataManager } from '../hooks/useDataManager.js'

const PopupContext = createContext()

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

    const [alertState, setAlertState] = useState({
        isOpen: false,
        title: '',
        content: '',
        onConfirm: null,
        showConfirm: false
    })

    const [d20State, setD20State] = useState({
        isOpen: false,
        skillId: null,
        weaponId: null
    })

    const [d6State, setD6State] = useState({
        isOpen: false,
        weaponId: null,
        hasAimed: false
    })

    const [addItemState, setAddItemState] = useState({
        isOpen: false,
        itemType: null
    })

    const [statAdjustmentState, setStatAdjustmentState] = useState({
        isOpen: false
    })

    const [tradeItemState, setTradeItemState] = useState({
        isOpen: false,
        characterItem: null,
        itemData: null,
        onConfirm: null
    })

    const showAlert = (content, title = null) => {
        // TODO may not need this here
        const translatedContent = content && content.indexOf(' ') > -1 ? content : t(content || '')

        setAlertState({
            isOpen: true,
            title: title,
            content: translatedContent,
            onConfirm: null,
            showConfirm: false
        })
    }

    const showConfirm = (content, onConfirm, title = null) => {
        // TODO may not need this here
        const translatedContent = content && content.indexOf(' ') > -1 ? content : t(content || '')

        setAlertState({
            isOpen: true,
            title: title,
            content: translatedContent,
            onConfirm: onConfirm,
            showConfirm: true
        })
    }

    const closeAlert = () => {
        setAlertState(prev => ({
            ...prev,
            isOpen: false
        }))
    }

    // D20 Popup functions
    const showD20Popup = (skillId, weaponId = null) => {
        setD20State({
            isOpen: true,
            skillId: skillId,
            weaponId: weaponId
        })
    }

    const closeD20Popup = () => {
        setD20State(prev => ({
            ...prev,
            isOpen: false
        }))
    }

    // D6 Popup functions
    const showD6Popup = (weaponId, hasAimed = false) => {
        setD6State({
            isOpen: true,
            weaponId: weaponId,
            hasAimed: hasAimed
        })
    }

    const closeD6Popup = () => {
        setD6State(prev => ({
            ...prev,
            isOpen: false
        }))
    }

    // AddItem Popup functions
    const showAddItemPopup = (itemType) => {
        setAddItemState({
            isOpen: true,
            itemType: itemType
        })
    }

    const closeAddItemPopup = () => {
        setAddItemState(prev => ({
            ...prev,
            isOpen: false
        }))
    }

    // StatAdjustment Popup functions
    const showStatAdjustmentPopup = () => {
        setStatAdjustmentState({
            isOpen: true
        })
    }

    const closeStatAdjustmentPopup = () => {
        setStatAdjustmentState(prev => ({
            ...prev,
            isOpen: false
        }))
    }

    // TradeItem Popup functions
    const showTradeItemPopup = (characterItem, itemData, onConfirm) => {
        setTradeItemState({
            isOpen: true,
            characterItem: characterItem,
            itemData: itemData,
            onConfirm: onConfirm
        })
    }

    const closeTradeItemPopup = () => {
        setTradeItemState(prev => ({
            ...prev,
            isOpen: false
        }))
    }

    const contextValue = {
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
        closeTradeItemPopup
    }

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
                weaponId={d20State.weaponId}
            />

            <D6Popup
                isOpen={d6State.isOpen}
                onClose={closeD6Popup}
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
        </PopupContext.Provider>
    )
}
