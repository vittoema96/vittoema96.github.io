import { Character, CompanionId } from '@/types';
import { hasPerk, PerkId } from '@/features/character/feats/perks/perks.ts';
import { hasTrait, TraitId } from '@/features/character/feats/traits/traits.ts';
import { WeaponItem } from '@/data/item/weapon.schemas.ts';

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

export interface FeatImplementation {
    applyPassiveModifiers?: (ctx: FeatContext) => void;

    onExecuteAction?: (ctx: FeatContext, payload?: any) => void;

    onBeforeRoll?: (ctx: FeatContext, diceContext: any) => void;

    getAvailableCompanions?: () => CompanionId[]

    getSpecialtyPointBonus?: (ctx: FeatContext) => number

    getDamageRatingBonus?: (character: Character, itemData: WeaponItem) => number
}

/**
 * Cycles over all feats (perks and traits) of a character and applies a function to each.
 * @param character
 * @param func
 */
function forEachFeat<T>(character: Character, func: (module: {default: FeatImplementation}) => T[]) {
    return [
        ...Object.entries(perkModules).flatMap(([path, module]) => {
            const perkId = path.split('/').pop()?.replace('.ts', '') as PerkId;
            if (perkId && hasPerk(character.perks, perkId)) {
                return func(module);
            }
            return []
        }),

        ...Object.entries(traitModules).flatMap(([path, module]) => {
            const traitId = path.split('/').pop()?.replace('.ts', '') as TraitId;
            if (traitId && hasTrait(character.traits, traitId)) {
                return func(module);
            }
            return []
        }),
    ];
}

function forEachSum(character: Character, func: (module: {default: FeatImplementation}) => number[]) {
    return forEachFeat(character, func).reduce((acc, curr) => acc + curr, 0)
}

export function getSpecialtyPointBonus(character: Character) {

    return forEachSum(character, module => {
        if(module.default.getSpecialtyPointBonus){
            return [module.default.getSpecialtyPointBonus({character})]
        }
        return []
    })
}

export function getAvailableCompanions(character: Character){
    return forEachFeat(character, module => {
        if(module.default.getAvailableCompanions){
            return module.default.getAvailableCompanions()
        }
        return []
    })
}

export function getDamageRatingBonus(character: Character, itemData: WeaponItem) {
    return forEachSum(character, module => {
        if(module.default.getDamageRatingBonus) {
            return [module.default.getDamageRatingBonus(character, itemData)]
        }
        return []
    })
}
