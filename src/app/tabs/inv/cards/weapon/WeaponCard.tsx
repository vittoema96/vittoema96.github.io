import BaseCard from '../BaseCard.tsx'
import WeaponContent from '@/app/tabs/inv/cards/weapon/WeaponContent.tsx'
import { useCharacter } from '@/contexts/CharacterContext.tsx'
import { usePopup } from '@/contexts/popup/PopupContext.tsx'
import { hasEnoughAmmo as checkHasEnoughAmmo } from '@/app/tabs/inv/utils/weaponUtils.ts'
import { getGameDatabase, getModifiedItemData } from '@/hooks/getGameDatabase.ts';
import { CharacterItem } from '@/types';

/**
 * Weapon card component with weapon-specific stats and actions
 * Uses BaseCard with WeaponContent renderer
 */
interface WeaponCardProps {
    characterItem: CharacterItem
}
function WeaponCard({ characterItem }: Readonly<WeaponCardProps>) {
    const { character } = useCharacter();
    const { showD20Popup } = usePopup();

    const dataManager = getGameDatabase();
    const itemData = getModifiedItemData(characterItem)
    if (!dataManager.isType(itemData, 'weapon')) {
        console.error(`Weapon data not found for ID: ${characterItem.id}`);
        return null;
    }

    // Use weapon utilities
    const hasEnoughAmmo = () => checkHasEnoughAmmo(itemData, character);

    const handleAttack = () => {
        if (!hasEnoughAmmo()) {
            console.log('Not enough ammo to attack');
            return;
        }

        // Open D20 popup for weapon attack, passing characterItem
        showD20Popup(itemData.CATEGORY, characterItem);
    };

    return (
        <BaseCard
            action={{
                icon: "attack",
                onClick: handleAttack,
                isChecked: (_) => hasEnoughAmmo(),
                isDisabled: (_) => !hasEnoughAmmo(),
                // TODO isDisabled for non origin compatible weapons
            }}
            characterItem={characterItem}
            contentRenderer={WeaponContent}
            className="weapon-card"
        />
    );
}

export default WeaponCard
