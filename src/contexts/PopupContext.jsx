import React, { createContext, useContext, useState } from 'react'
import AlertPopup from '../components/popups/AlertPopup.jsx'
import D20Popup from '../components/popups/D20Popup.jsx'
import D6Popup from '../components/popups/D6Popup.jsx'
import AddItemPopup from '../components/popups/AddItemPopup.jsx'
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
        skillId: null
    })

    const [d6State, setD6State] = useState({
        isOpen: false,
        weaponName: '',
        damageRating: 2
    })

    const [addItemState, setAddItemState] = useState({
        isOpen: false,
        itemType: null
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
    const showD20Popup = (skillId) => {
        setD20State({
            isOpen: true,
            skillId: skillId
        })
    }

    const closeD20Popup = () => {
        setD20State(prev => ({
            ...prev,
            isOpen: false
        }))
    }

    // D6 Popup functions
    const showD6Popup = (weaponName, damageRating = 2) => {
        setD6State({
            isOpen: true,
            weaponName: weaponName,
            damageRating: damageRating
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

    const contextValue = {
        showAlert,
        showConfirm,
        closeAlert,
        showD20Popup,
        closeD20Popup,
        showD6Popup,
        closeD6Popup,
        showAddItemPopup,
        closeAddItemPopup
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
            />

            <D6Popup
                isOpen={d6State.isOpen}
                onClose={closeD6Popup}
                weaponName={d6State.weaponName}
                damageRating={d6State.damageRating}
            />

            <AddItemPopup
                isOpen={addItemState.isOpen}
                onClose={closeAddItemPopup}
                itemType={addItemState.itemType}
                dataManager={dataManager}
            />
        </PopupContext.Provider>
    )
}
