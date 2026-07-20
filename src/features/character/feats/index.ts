import { Character, CompanionId } from '@/types';
import { TabType } from '@/app/tabs/TabButton.tsx';
import { hasPerk, PerkId } from '@/features/character/feats/perks/perks.ts';
import { hasTrait, TraitId } from '@/features/character/feats/traits/traits.ts';

const perkModules = import.meta.glob<{
    default: FeatImplementation
}>(
    './perks/implementations/perk*.ts',
    { eager: true }
)

const traitModules = import.meta.glob<{
    default: FeatImplementation
}>(
    './traits/implementations/trait*.ts',
    { eager: true }
)

export interface FeatContext {
    character: Character;
    // Qui puoi passare utility utili agli effetti (es. funzioni di update, notifiche, ecc.)
}

type FeatureUnlock =
    | { type: 'companion'; id: CompanionId }
    | { type: 'tab'; id: TabType };

export interface FeatImplementation {
    applyPassiveModifiers?: (ctx: FeatContext) => void;

    onExecuteAction?: (ctx: FeatContext, payload?: any) => void;

    onBeforeRoll?: (ctx: FeatContext, diceContext: any) => void;

    getFeatureUnlocks?: () => FeatureUnlock[]

    getSpecialtyPointBonus?: (ctx: FeatContext) => number
}

export function getSpecialtyPointBonus(character: Character) {

    return Object.entries(perkModules).reduce((sum, [path, module]) => {
            const perkId = path.split('/').pop()?.replace('.ts', '') as PerkId;

            if (perkId && hasPerk(character, perkId) && module.default.getSpecialtyPointBonus) {
                return sum + module.default.getSpecialtyPointBonus({character});
            }

            return sum
        }, 0)
        +
        Object.entries(traitModules).reduce((sum, [path, module]) => {
            const traitId = path.split('/').pop()?.replace('.ts', '') as TraitId;

            if (traitId && hasTrait(character, traitId) && module.default.getSpecialtyPointBonus) {
                return sum + module.default.getSpecialtyPointBonus({character});
            }

            return sum
        }, 0)
}

export function getFeatureUnlocks(character: Character){
    return [
        ...Object.entries(perkModules).flatMap(([path, module]) => {
            const perkId = path.split('/').pop()?.replace('.ts', '') as PerkId;

            if (perkId && hasPerk(character, perkId) && module.default.getFeatureUnlocks) {
                return module.default.getFeatureUnlocks();
            }

            return []
        }),
        ...Object.entries(traitModules).flatMap(([path, module]) => {
            const traitId = path.split('/').pop()?.replace('.ts', '') as TraitId;

            if (traitId && hasTrait(character, traitId) && module.default.getFeatureUnlocks) {
                return module.default.getFeatureUnlocks();
            }

            return []
        })
    ]
}
