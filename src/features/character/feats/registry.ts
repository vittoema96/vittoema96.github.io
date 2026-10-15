import type { PerkId } from './perks.ts';
import type { TraitId } from './traits.ts';
import type {
    PerkImplementation,
    TraitImplementation,
    FeatSelection
} from './types.ts';
import type { Origin } from '../origins/types.ts';

function registerImplementations<T extends { id: string }>(
    modules: Record<string, { default: T }>,
): Map<string, T> {
    const registry = new Map<string, T>();
    for (const [path, module] of Object.entries(modules)) {
        const implementation = module.default;
        if (!implementation?.id) {
            throw new Error(`Feat module "${path}" must export an implementation with an id`);
        }
        if (registry.has(implementation.id)) {
            throw new Error(`Duplicate feat implementation: ${implementation.id}`);
        }
        registry.set(implementation.id, implementation);
    }
    return registry;
}

const perkRegistry = registerImplementations(
    import.meta.glob<{ default: PerkImplementation }>('./perks/perk*.ts', {
        eager: true,
    }),
);
const traitRegistry = registerImplementations(
    import.meta.glob<{ default: TraitImplementation }>('./traits/trait*.ts', {
        eager: true,
    }),
);

export function hasPerkImplementation(id: PerkId): boolean {
    return perkRegistry.has(id);
}

export function hasTraitImplementation(id: TraitId): boolean {
    return traitRegistry.has(id);
}

export function getActiveFeats({ perks, traits, origin }: FeatSelection) {
    // Order matters for overrides and sequential modifiers: origin, perks, then traits.
    const active: (Origin | PerkImplementation | TraitImplementation)[] = origin ? [origin] : [];
    // Resolve each implementation once, retaining the original IDs for perk rank calculations.
    for (const id of new Set(perks)) {
        const feat = perkRegistry.get(id);
        if (feat) {
            active.push(feat);
        }
    }
    for (const id of new Set(traits)) {
        const feat = traitRegistry.get(id);
        if (feat) {
            active.push(feat);
        }
    }
    return active;
}
