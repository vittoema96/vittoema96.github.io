import { DEFAULT_ORIGIN } from './defaultOrigin.ts';
import { ORIGIN_IDS } from './types.ts';
import type { DefinedOriginId, Origin, OriginId } from './types.ts';

function freezeOrigin(origin: Origin): Origin {
    return Object.freeze({
        ...origin,
        bodyParts: Object.freeze(new Set(origin.bodyParts)),
        specialMinValues: Object.freeze({ ...origin.specialMinValues }),
        specialMaxValues: Object.freeze({ ...origin.specialMaxValues }),
    });
}

const originModules = import.meta.glob<{ default: Origin }>(
    './origin*.ts',
    { eager: true },
);

const discoveredOrigins = Object.entries(originModules).map(([path, module]) => {
    const origin = module.default;
    if (!origin?.id) {
        throw new Error(`Origin module "${path}" must export an origin with an id`);
    }
    return freezeOrigin(origin);
});

const duplicateIds = discoveredOrigins
    .map(origin => origin.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index);

if (duplicateIds.length > 0) {
    throw new Error(`Duplicate origin IDs: ${[...new Set(duplicateIds)].join(', ')}`);
}

const declaredIds = new Set<string>(ORIGIN_IDS);
const discoveredIds = new Set<DefinedOriginId>(
    discoveredOrigins
        .map(origin => origin.id)
        .filter((id): id is DefinedOriginId => id !== undefined),
);
const missingIds = ORIGIN_IDS.filter(id => !discoveredIds.has(id));
const unexpectedIds = [...discoveredIds].filter(id => !declaredIds.has(id));

if (missingIds.length > 0 || unexpectedIds.length > 0) {
    throw new Error([
        missingIds.length > 0 ? `Missing origin modules: ${missingIds.join(', ')}` : '',
        unexpectedIds.length > 0 ? `Unexpected origin modules: ${unexpectedIds.join(', ')}` : '',
    ].filter(Boolean).join('; '));
}

export const originDefinitions = discoveredOrigins;
export const originIds = [...ORIGIN_IDS];

const originById = new Map(
    originDefinitions.map(origin => [origin.id, origin]),
);

export function getOriginById(id: OriginId): Origin {
    return id ? originById.get(id) ?? DEFAULT_ORIGIN : DEFAULT_ORIGIN;
}
