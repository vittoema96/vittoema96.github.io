import React, { useState, useEffect } from 'react'
import { BODY_PARTS } from '../../js/constants.js'
import { useI18n } from '../../hooks/useI18n.js'

function InvTab({ character, updateCharacter }) {
    const [activeSubTab, setActiveSubTab] = useState('weapon')
    const [damageReduction, setDamageReduction] = useState({})
    const t = useI18n()

    // Update damage reduction when character changes
    useEffect(() => {
        updateDamageReduction()
    }, [character])

    const updateDamageReduction = () => {
        if (!character.getLocationsDR) {
            // Fallback: calculate basic damage reduction
            const dr = {}
            Object.values(BODY_PARTS).forEach(bodyPart => {
                dr[bodyPart] = { physical: 0, energy: 0, radiation: 0 }
            })
            setDamageReduction(dr)
            return
        }

        const locationsDR = character.getLocationsDR()
        setDamageReduction(locationsDR)
    }

    const handleSubTabClick = (subTab) => {
        setActiveSubTab(subTab)
    }

    const handleAddItem = (itemType) => {
        if (window.openAddItemModal) {
            window.openAddItemModal(itemType)
        }
    }

    const getItemsByType = (itemType) => {
        if (!character.items) return []

        const items = character.items.filter(item => item.type === itemType)

        // Add special items for unarmed
        if (itemType === 'unarmed') {
            items.push({
                id: 'weaponUnarmedStrike',
                type: itemType,
                quantity: 1,
            })
        }

        return items
    }

    const renderItemSection = (itemType) => {
        const items = getItemsByType(itemType)

        return (
            <section key={itemType}>
                <div className="itemlist-header">
                    <span className="h3 js-title">{t(itemType)}</span>
                    <button className="js-button-addItem" onClick={() => handleAddItem(itemType)}>+</button>
                </div>
                <div className="card-carousel" id={`${itemType}-cards`}>
                    {items.length === 0 ? (
                        <div className="no-items">No items</div>
                    ) : (
                        items.map(item => (
                            <div key={item.id} className="simple-item-card" style={{
                                border: '1px solid var(--primary-color)',
                                padding: '8px',
                                margin: '4px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--secondary-color)',
                                minWidth: '120px',
                                textAlign: 'center'
                            }}>
                                <div className="item-name" style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                    {item.id}
                                </div>
                                <div className="item-quantity" style={{ fontSize: '10px', color: 'var(--accent-color)' }}>
                                    {item.quantity}x
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        )
    }

    const renderDamageReductionStats = () => {
        return Object.values(BODY_PARTS).map(bodyPart => (
            <div key={bodyPart} className={`apparel-stat ${bodyPart}`}>
                <div>{t(bodyPart)}</div>
                <div className="row l-centered">
                    <span>{t('physical')}:</span>
                    <span id={`apparel__${bodyPart}-physical`}>
                        {damageReduction[bodyPart]?.physical || '?'}
                    </span>
                </div>
                <div className="row l-centered">
                    <span>{t('energy')}:</span>
                    <span id={`apparel__${bodyPart}-energy`}>
                        {damageReduction[bodyPart]?.energy || '?'}
                    </span>
                </div>
                <div className="row l-centered">
                    <span>{t('radiation')}:</span>
                    <span id={`apparel__${bodyPart}-radiation`}>
                        {damageReduction[bodyPart]?.radiation || '?'}
                    </span>
                </div>
            </div>
        ))
    }

    // Item type mapping - matches your original exactly
    const itemTypeMap = {
        weapon: ['smallGuns', 'energyWeapons', 'bigGuns', 'meleeWeapons', 'explosives', 'throwing', 'unarmed'],
        apparel: ['clothing', 'outfit', 'headgear', 'raiderArmor', 'leatherArmor', 'metalArmor', 'combatArmor'],
        aid: ['food', 'drinks', 'meds'],
        other: ['ammo']
    }

    return (
        <section id="inv-tabContent" className="tabContent">
            {/* Sub-tab Navigation - EXACT copy of original */}
            <div className="navigator">
                <button
                    className={`subTab-button ${activeSubTab === 'weapon' ? 'active' : ''}`}
                    data-sub-screen="weapon"
                    onClick={() => handleSubTabClick('weapon')}
                >
                    {t('weaponsUpper')}
                </button>
                <button
                    className={`subTab-button ${activeSubTab === 'apparel' ? 'active' : ''}`}
                    data-sub-screen="apparel"
                    onClick={() => handleSubTabClick('apparel')}
                >
                    {t('apparelUpper')}
                </button>
                <button
                    className={`subTab-button ${activeSubTab === 'aid' ? 'active' : ''}`}
                    data-sub-screen="aid"
                    onClick={() => handleSubTabClick('aid')}
                >
                    {t('aidUpper')}
                </button>
                <button
                    className={`subTab-button ${activeSubTab === 'other' ? 'active' : ''}`}
                    data-sub-screen="other"
                    onClick={() => handleSubTabClick('other')}
                >
                    {t('otherUpper')}
                </button>
            </div>

            {/* Weapon Sub-screen */}
            <section className={`js-subScreen ${activeSubTab !== 'weapon' ? 'hidden' : ''}`} id="weapon-subScreen">
                {itemTypeMap.weapon.map(weaponType => renderItemSection(weaponType))}
            </section>

            {/* Apparel Sub-screen - EXACT copy of original structure */}
            <section className={`js-subScreen ${activeSubTab !== 'apparel' ? 'hidden' : ''} keep-first`} id="apparel-subScreen">
                <div>
                    <span className="h1">{t('damageReduction')}</span>
                    <div className="row l-spaceAround">
                        <div className="activeApparel l-spaceAround">
                            {renderDamageReductionStats()}
                            <div className="apparel-vaultboy themed-svg" data-icon="vaultboy-open-arms"></div>
                        </div>
                    </div>
                </div>
                {itemTypeMap.apparel.map(apparelType => renderItemSection(apparelType))}
            </section>

            {/* Aid Sub-screen */}
            <section className={`js-subScreen ${activeSubTab !== 'aid' ? 'hidden' : ''}`} id="aid-subScreen">
                {itemTypeMap.aid.map(aidType => renderItemSection(aidType))}
            </section>

            {/* Other Sub-screen */}
            <section className={`js-subScreen ${activeSubTab !== 'other' ? 'hidden' : ''}`} id="other-subScreen">
                {itemTypeMap.other.map(otherType => renderItemSection(otherType))}
            </section>
        </section>
    )
}

export default InvTab