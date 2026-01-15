import { useState, useRef } from 'react'
import { useCharacter } from '@/contexts/CharacterContext.tsx'
import { useTranslation } from 'react-i18next'
import { useDialog } from '@/hooks/useDialog.ts'

/**
 * StatAdjustmentPopup - React version of the legacy header stats popup
 * Allows editing HP, Caps, and current Luck with proper validation
 */
function StatAdjustmentPopup({ onClose }) {
    const { t } = useTranslation()
    const dialogRef = useRef<HTMLDialogElement>(null)
    const { character, updateCharacter } = useCharacter()

    // Local state for form inputs
    const [currentHp, setCurrentHp] = useState<number | ''>(() => character.currentHp)
    const [caps, setCaps] = useState<number | ''>(() => character.caps)
    const [currentLuck, setCurrentLuck] = useState<number | ''>(() => character.currentLuck)

    // Use dialog hook for dialog management
    const { handleBackdropClick, closeWithAnimation } = useDialog(dialogRef, onClose)

    const handleClose = () => {
        closeWithAnimation()
    }

    // Handle confirm - validation is done by input handlers, just need to check for empty values
    const handleConfirm = () => {
        if (!isFormValid) {return}

        // All validation passed - update character
        updateCharacter({
            currentHp,
            caps,
            currentLuck
        })

        handleClose()
    }

    // Handle input changes - allow empty string, but clamp values to valid range
    const handleHpChange = (e) => {
        const val = e.target.value
        if (val === '') {
            setCurrentHp('')
        } else {
            const num = parseInt(val)
            if (!isNaN(num)) {
                setCurrentHp(Math.max(0, Math.min(num, character.maxHp)))
            }
        }
    }

    const handleCapsChange = (e) => {
        const val = e.target.value
        if (val === '') {
            setCaps('')
        } else {
            const num = parseInt(val)
            if (!isNaN(num)) {
                setCaps(Math.max(0, num))
            }
        }
    }

    const handleLuckChange = (e) => {
        const val = e.target.value
        if (val === '') {
            setCurrentLuck('')
        } else {
            const num = parseInt(val)
            if (!isNaN(num)) {
                setCurrentLuck(Math.max(0, Math.min(num, character.maxLuck)))
            }
        }
    }

    // Check if form is valid (no empty values)
    const isFormValid = currentHp !== '' && caps !== '' && currentLuck !== ''

    if (!character) {return null}

    return (
        <dialog
            ref={dialogRef}
            onClick={handleBackdropClick}
            style={{
                zIndex: 10000,
                position: 'fixed'
            }}
        >
            <div onClick={(e) => e.stopPropagation()}>
                <header className="l-lastSmall">
                    <span className="h2">{t('edit')}</span>
                    <button className="popup__button-x" onClick={handleClose}>&times;</button>
                </header>

                <hr />

                {/* Stats Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.5rem 0' }}>
                    {/* HP Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>HP</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input
                                type="number"
                                value={currentHp}
                                onChange={handleHpChange}
                                placeholder="0"
                                min="0"
                                max={character.maxHp}
                                aria-label="Current HP"
                                style={{ width: '100px', textAlign: 'center', fontSize: '1.1rem' }}
                            />
                            <span style={{ color: 'var(--primary-color)', fontSize: '1rem' }}>
                                {character.currentHp} / {character.maxHp}
                            </span>
                        </div>
                    </div>

                    {/* Caps Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{t('caps')}</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input
                                type="number"
                                value={caps}
                                onChange={handleCapsChange}
                                placeholder="0"
                                min="0"
                                aria-label="Caps amount"
                                style={{ width: '100px', textAlign: 'center', fontSize: '1.1rem' }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', fontSize: '1rem' }}>
                                <span>{character.caps || 0}</span>
                                <div
                                    className="themed-svg"
                                    data-icon="caps"
                                    style={{ width: '1.2rem', height: '1.2rem' }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Luck Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{t('luck')}</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input
                                type="number"
                                value={currentLuck}
                                onChange={handleLuckChange}
                                placeholder="0"
                                min="0"
                                max={character.maxLuck}
                                aria-label="Current Luck"
                                style={{ width: '100px', textAlign: 'center', fontSize: '1.1rem' }}
                            />
                            <span style={{ color: 'var(--primary-color)', fontSize: '1rem' }}>
                                {character.currentLuck} / {character.maxLuck}
                            </span>
                        </div>
                    </div>
                </div>

                <hr />

                <footer>
                    <button
                        className="popup__button-confirm"
                        onClick={handleConfirm}
                        disabled={!isFormValid}
                    >
                        {t('confirm')}
                    </button>
                    <button className="popup__button-close" onClick={handleClose}>
                        {t('close')}
                    </button>
                </footer>
            </div>
        </dialog>
    )
}

export default StatAdjustmentPopup
