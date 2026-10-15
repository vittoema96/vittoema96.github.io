import {
    getModifiedItemData,
    getSkillForWeaponCategory,
    getSpecialForWeaponCategory,
    hasEnoughAmmo,
} from '@/features/character/items.ts';
import BaseCard from '../BaseCard.tsx'
import WeaponContent from '@/app/tabs/inv/cards/weapon/WeaponContent.tsx'
import { useCharacter } from '@/app/contexts/CharacterContext.tsx'
import { usePopup } from '@/app/contexts/PopupContext.tsx'
import { CharacterItem } from '@/types';
import { isType } from '@/features/item/utils.ts';

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

    const itemData = getModifiedItemData(characterItem, character.perks)
    if (!isType(itemData, 'weapon')) {
        console.error(`Weapon data not found for ID: ${characterItem.id}`);
        return null;
    }

    const handleAttack = () => {
        if (!hasEnoughAmmo(itemData, character, characterItem)) {
            console.log('Not enough ammo to attack');
            return;
        }

        // Open D20 popup for weapon attack, passing characterItem
        showD20Popup({
            skillId: getSkillForWeaponCategory(itemData.CATEGORY),
            specialOverride: getSpecialForWeaponCategory(itemData.CATEGORY),
            usingItem: characterItem,
        });
    };

    return (
        <BaseCard
            action={{
                icon: "attack",
                onClick: handleAttack,
                isChecked: (_) => hasEnoughAmmo(itemData, character, characterItem),
                isDisabled: (_) => !hasEnoughAmmo(itemData, character, characterItem),
                // TODO isDisabled for non origin compatible weapons
            }}
            characterItem={characterItem}
            contentRenderer={WeaponContent}
            className="weapon-card"
        />
    );
}

export default WeaponCard
