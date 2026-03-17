import { useState } from 'react';
import { useCharacter } from '@/contexts/CharacterContext';
import { useTooltip } from '@/contexts/TooltipContext';
import { useTranslation } from 'react-i18next';
import { CharacterItem, GenericPopupProps, ItemType, ModItem, WeaponItem } from '@/types';
import { getGameDatabase, getModifiedItemData } from '@/hooks/getGameDatabase.ts';
import BasePopup from '@/components/popup/common/BasePopup.tsx';
import Tag from '@/components/Tag.tsx';

interface ModifyItemPopupProps extends GenericPopupProps {
    item: CharacterItem
}

function ModifyItemPopup({ onClose, item }: Readonly<ModifyItemPopupProps>) {
    const { t } = useTranslation();
    const { character, updateCharacter } = useCharacter();
    const dataManager = getGameDatabase();
    useTooltip();

    const [mods, setMods] = useState<string[]>(item.mods ?? [])
    const itemData = getModifiedItemData(item)

    if(dataManager.isType(itemData, "weapon")){
       const weapon = (itemData as WeaponItem)
       if (["meleeWeapons", "unarmed"].includes(weapon.CATEGORY)) {
           return (
               <BasePopup title={'modifyWeapon'} onClose={onClose}>
                   <p style={{ textAlign: 'center' }}>{t('noModAllowedMeleeWeapons')}</p>
               </BasePopup>
           )
       }
    }

    const getAvailableMods = () => Object.values(dataManager.mod)
        .filter(mod => itemData?.ID === mod.WEAPON_ID)

    const getModType = (modId: string) => {
        const mod = dataManager.mod[modId]
        if(!mod) { return '' }
        switch (mod.CATEGORY) {
            case 1: return 'scope';
            case 2: return 'magazine';
            case 3: return 'barrel';
            case 4: return 'muzzle';
            case 5: return 'stock';
            default: return 'other';
        }
    }

    const getPrice = (mod: ModItem): number => mod.COST

    const removeMod = (modId: string) => setMods(prev => prev.filter(id => id !== modId))
    const hasMod = (modId: string) => mods.includes(modId)

    const setModType = (mod: ModItem) => {
        const type = getModType(mod.ID)
        setMods(prev => prev.filter((id: string) => getModType(id) !== type))
    }

    const toggleMod = (modId: string) => setMods(prev => {
        const newMods = prev.includes(modId) ? prev.filter(i => i !== modId) : [...prev, modId]
        return newMods
    })

    const calculateFinalPrice = (mods: string[]): number => mods.reduce((acc, modId) => acc + getPrice(dataManager.mod[modId]), 0)

    const handleConfirm = () => {
        const price = calculateFinalPrice(mods)

        if (character.caps < price) {
            return
        }

        updateCharacter({
            items: character.items.map(characterItem => {
                if (characterItem.id !== item.id) { return characterItem }
                return { ...characterItem, mods }
            }),
            caps: character.caps - price
        })
    }

    return (
        <BasePopup
            onClose={onClose}
            onConfirm={handleConfirm}
            title={'modifyWeapon'}
            disabled={calculateFinalPrice(mods) > character.caps}>
            <div className="row" style={{ justifyContent: 'center', textAlign: 'center', margin: '0.25rem 0.25rem 0.5rem' }}>
                <span className="h5">{t('selectModChoice')}</span>
            </div>

            <div className="popup__choice-container">
                {getAvailableMods().map(mod => (
                    <label key={mod.ID} className={`popup__choice ${hasMod(mod.ID) ? 'active' : ''}`} style={{ cursor: 'pointer' }}>
                        <input type="checkbox" checked={hasMod(mod.ID)} onChange={() => {
                                if (!hasMod(mod.ID)) setModType(mod)
                                toggleMod(mod.ID)
                            }} style={{ display: 'none' }} />
                        <strong className="h3" style={{ padding: '0.25rem 0', margin: 0 }}>
                            {t(mod.ID)}
                        </strong>
                        <div className="h5" style={{ fontStyle: 'italic', opacity: 0.9, marginBottom: '0.25rem' }}>
                            [{t(getModType(mod.ID))}]
                        </div>
                        <div className="row" style={{ justifyContent: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {mod.EFFECTS?.map(effect => {
                                const [effectType, effectOpt] = effect.split(':');
                                let displayValue = t(effectOpt!);
                                if (displayValue) { displayValue = ` ${displayValue}`; }
                                const displayText = `${t(effectType!)}${displayValue}`;
                                return (
                                    <Tag key={effect} tooltipId={`${effectType}Description`}>
                                        {displayText}
                                    </Tag>
                                );
                            })}
                        </div>
                        <div className="h5" style={{ margin: '0.25rem 0' }}>
                            {t('price')}: <strong style={{ fontWeight: 'bold' }}>{getPrice(mod)}</strong>
                        </div>
                    </label>
                ))}
            </div>
        </BasePopup>
    )
}

export default ModifyItemPopup

