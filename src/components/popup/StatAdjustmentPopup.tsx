import BasePopup from '@/components/popup/common/BasePopup.tsx'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GenericPopupProps } from '@/types'

interface StatAdjustmentPopupProps extends GenericPopupProps {
    initialValue: number
    min?: number
    max?: number
    onConfirm: (newValue: number) => void
}

function StatAdjustmentPopup({ onClose, onConfirm, initialValue, min, max }: Readonly<StatAdjustmentPopupProps>) {
    const { t } = useTranslation()
    const [value, setValue] = useState<number>(initialValue)

    const handleConfirm = () => {
        if (min !== undefined && value < min) return
        if (max !== undefined && value > max) return
        onConfirm(value)
    }

    return (
        <BasePopup
            title={'adjustValue'}
            onConfirm={handleConfirm}
            onClose={onClose}
            disabled={(min !== undefined && value < min) || (max !== undefined && value > max)}
        >
            <hr />
            <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <label>{t('value')}</label>
                <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(parseInt(e.target.value))}
                    min={min}
                    max={max}
                    aria-label="New value"
                    style={{ width: '5rem' }}
                />
            </div>
            <hr />
        </BasePopup>
    )
}

export default StatAdjustmentPopup

