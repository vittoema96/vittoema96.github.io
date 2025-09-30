import React from 'react'
import BaseCard from './BaseCard.jsx'
import WeaponContent from './content/WeaponContent.jsx'
import { useCharacter } from '../../contexts/CharacterContext.jsx'
import { usePopup } from '../../contexts/PopupContext.jsx'

/**
 * Weapon card component with weapon-specific stats and actions
 * Uses BaseCard with WeaponContent renderer
 */
function WeaponCard({ characterItem, itemData, dataManager, onAttack }) {
    const { character } = useCharacter()
    const { showD20Popup } = usePopup()

    if (!itemData) {
        console.error(`Weapon data not found for ID: ${characterItem.id}`)
        return null
    }

    const weaponObj = itemData

    // Check if weapon is gatling (uses 10 ammo per shot)
    const isGatling = (weaponObj.QUALITIES || []).includes('qualityGatling')
    const ammoPerShot = isGatling ? 10 : 1

    // Get ammo count
    const getAmmoCount = () => {
        if (weaponObj.AMMO_TYPE === 'na') return '-'
        if (weaponObj.AMMO_TYPE === 'self') return characterItem.quantity

        // Find ammo in character items
        const ammoItem = character.items?.find(item => item.id === weaponObj.AMMO_TYPE)
        return ammoItem ? ammoItem.quantity : 0
    }

    // Check if weapon has enough ammo to attack
    const hasEnoughAmmo = () => {
        if (weaponObj.AMMO_TYPE === 'na') return true // Melee weapons don't need ammo

        const currentAmmo = getAmmoCount()
        if (typeof currentAmmo === 'string') return false // '-' case

        return currentAmmo >= ammoPerShot
    }

    const handleAttack = () => {
        if (!hasEnoughAmmo()) {
            console.log('Not enough ammo to attack')
            return
        }

        if (onAttack) {
            onAttack(characterItem, weaponObj)
        } else {
            // Open D20 popup for weapon attack
            showD20Popup(weaponObj.TYPE, weaponObj.ID)
        }
    }



    return (
        <BaseCard
            characterItem={characterItem}
            itemData={itemData}
            contentRenderer={WeaponContent}
            onAction={handleAttack}
            actionIcon="attack"
            actionType="attack"
            isEquipped={hasEnoughAmmo()}
            disabled={!hasEnoughAmmo()}
            className="weapon-card"
        />
    )
}

export default WeaponCard
