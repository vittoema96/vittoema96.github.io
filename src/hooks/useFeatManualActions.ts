import { useTranslation } from 'react-i18next';
import { useCharacter } from '@/app/contexts/CharacterContext.tsx';
import { usePopup } from '@/app/contexts/PopupContext.tsx';
import { calculateCharacter } from '@/features/character/calculate.ts';
import { getManualActions } from '@/features/character/feats/rules.ts';
import type { FeatManualAction } from '@/features/character/feats/types.ts';

export function useFeatManualActions() {
    const { t } = useTranslation();
    const { character, updateCharacter } = useCharacter();
    const { showAlert, showConfirm, showNd6Popup, showD20Popup } = usePopup();
    const actions = getManualActions(character);

    const changeLuck = (delta: number) => {
        updateCharacter(prev => {
            const current = calculateCharacter(prev);
            if (current.currentLuck + delta < 0) {
                showAlert(t('notEnoughLuckAlert'));
                return {};
            }
            return { currentLuck: Math.min(current.currentLuck + delta, current.maxLuck) };
        });
    };

    const activate = (action: FeatManualAction) => {
        const requiredLuck =
            action.type === 'confirm'
                ? action.luckCost
                : action.type === 'skillRoll'
                  ? action.requiredLuck
                  : 0;
        if (character.currentLuck < requiredLuck) {
            showAlert(t('notEnoughLuckAlert'));
            return;
        }
        switch (action.type) {
            case 'confirm':
                showConfirm(t(action.message), () => changeLuck(-action.luckCost));
                break;
            case 'combatDice':
                showNd6Popup({
                    diceCount: action.diceCount,
                    title: t(action.label),
                    description: t(action.description),
                    resultDisplay: 'effects',
                    onResult: result => {
                        if (result.totalEffects > 0) {
                            changeLuck(action.luckOnEffect);
                        }
                    },
                });
                break;
            case 'skillRoll':
                showD20Popup({
                    skillId: action.skillId,
                    usingItem: action.usingItem,
                    roller: action.roller,
                });
                break;
        }
    };

    return (id: string) => {
        const action = actions.get(id);
        return action ? { label: action.label, onClick: () => activate(action) } : undefined;
    };
}
