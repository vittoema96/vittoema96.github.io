import { BODY_PARTS, GenericBodyPart, MR_HANDY_PARTS } from '@/types';

import { SpecialType } from '@/features/character/special/special.ts';

// ORIGIN ENUM
export const ORIGIN_IDS = [
    'vaultDweller',
    'ghoul',
    'survivor',
    'mrHandy',
    'brotherhoodInitiate',
    'superMutant',

    'minutemen',
    'ncr',
    'protectron',
    'robobrain',
    'securitron',
    'synth',

    'assaultron',
    'brotherhoodOutcast',
    'childOfAtom',
    'nightkin',
    'tribal',
] as const;
export type OriginId = (typeof ORIGIN_IDS)[number] | undefined;

export interface Origin {
    id: OriginId;
    calcMaxCarryWeight: (strengthVal: number) => number;
    hasRadiationImmunity: boolean;
    hasPoisonImmunity: boolean;
    bodyParts: Set<GenericBodyPart>;
    numberOfTraits: number;
    isRobot: boolean;
    specialMaxValues: Record<SpecialType, number>;
    skillMaxValue: number;
    needsSpecializedArmor: boolean;
    needsSpecializedWeapons: boolean;
    characterSvg: string;
}

type OriginOverrides = Partial<Omit<Origin, 'id' | 'specialMaxValues' | 'bodyParts'>> & {
    specialMaxValues?: Partial<Record<SpecialType, number>>;
    bodyParts?: Iterable<GenericBodyPart>;
};

const DEFAULT_SPECIAL_MAX_VALUES: Record<SpecialType, number> = {
    strength: 10,
    perception: 10,
    endurance: 10,
    charisma: 10,
    intelligence: 10,
    agility: 10,
    luck: 10,
};

const DEFAULT_ORIGIN_VALUES = {
    calcMaxCarryWeight: (strengthVal: number) => 75 + strengthVal * 5,
    hasRadiationImmunity: false,
    hasPoisonImmunity: false,
    bodyParts: BODY_PARTS,
    isRobot: false,
    skillMaxValue: 6,
    numberOfTraits: 0,
    needsSpecializedArmor: false,
    needsSpecializedWeapons: false,
    characterSvg: 'vaultboy-open-arms',
} as const;


const createOrigin = (
    id?: OriginId,
    options: OriginOverrides = {}
): Origin => {
    const {
        calcMaxCarryWeight = DEFAULT_ORIGIN_VALUES.calcMaxCarryWeight,
        hasRadiationImmunity = DEFAULT_ORIGIN_VALUES.hasRadiationImmunity,
        hasPoisonImmunity = DEFAULT_ORIGIN_VALUES.hasPoisonImmunity,
        bodyParts = DEFAULT_ORIGIN_VALUES.bodyParts,
        isRobot = DEFAULT_ORIGIN_VALUES.isRobot,
        specialMaxValues = {},
        skillMaxValue = DEFAULT_ORIGIN_VALUES.skillMaxValue,
        numberOfTraits = DEFAULT_ORIGIN_VALUES.numberOfTraits,
        needsSpecializedArmor = DEFAULT_ORIGIN_VALUES.needsSpecializedArmor,
        needsSpecializedWeapons = DEFAULT_ORIGIN_VALUES.needsSpecializedWeapons,
        characterSvg = DEFAULT_ORIGIN_VALUES.characterSvg,
    } = options;

    return Object.freeze({
        id,
        calcMaxCarryWeight,
        hasRadiationImmunity,
        hasPoisonImmunity,
        // Clone to avoid shared mutable references across origins.
        bodyParts: new Set(bodyParts),
        isRobot,
        specialMaxValues: Object.freeze({
            ...DEFAULT_SPECIAL_MAX_VALUES,
            ...specialMaxValues,
        }),
        skillMaxValue,
        numberOfTraits,
        needsSpecializedArmor,
        needsSpecializedWeapons,
        characterSvg,
    });
};
export const getOriginById = (id: OriginId): Origin => {
    return Object.values(ORIGINS).find(o => o.id === id) ?? ORIGINS.NO_ORIGIN;
};
export const ORIGINS = Object.freeze({
    // TODO to implement on origin:
    //  - additional tag apparel
    NO_ORIGIN: createOrigin(),

    // TODO make trait gain 1 luck when clicked
    VAULT_DWELLER: createOrigin('vaultDweller'),
    GHOUL: createOrigin('ghoul', {
        hasRadiationImmunity: true,
        characterSvg: 'ghoul'
    }),
    SURVIVOR: createOrigin('survivor', {
        numberOfTraits: 2,
    }),
    // TODO
    //  isRobot == No aid consumption allowed
    MR_HANDY: createOrigin('mrHandy', {
        calcMaxCarryWeight: () => 75, // Fixed carry weight for Mr. Handy, can only be upped by armour/mods
        hasRadiationImmunity: true,
        hasPoisonImmunity: true,
        bodyParts: MR_HANDY_PARTS,
        isRobot: true,
        numberOfTraits: 3,
        needsSpecializedArmor: true,
        needsSpecializedWeapons: true,
        characterSvg: 'mrHandy',
    }),
    BROTHERHOOD_INITIATE: createOrigin('brotherhoodInitiate'),
    SUPER_MUTANT: createOrigin('superMutant', {
        hasRadiationImmunity: true,
        hasPoisonImmunity: true,
        specialMaxValues: {
            strength: 12,
            endurance: 12,
            intelligence: 6,
            charisma: 6,
        },
        skillMaxValue: 4,
        needsSpecializedArmor: true
    }),

    // #### Settler's Guide Origins
    // TODO all the below needs reviewing and implementation of mechanics
    MINUTEMEN: createOrigin('minutemen'), // TODO missing trait
    NCR: createOrigin('ncr', {
        numberOfTraits: 2
    }), // TODO missing traits
    PROTECTRON: createOrigin('protectron', {
        // TODO protectron weapons as "traits"
        calcMaxCarryWeight: () => 225 / 2, // Fixed carry weight for Mr. Handy, can only be upped by armour/mods
        hasRadiationImmunity: true,
        hasPoisonImmunity: true,
        numberOfTraits: 2, // TODO TRAITS ARE NOT HANDLED ON THIS AND BELOW ORIGINS
        // hasDiseaseImmunity: true, TODO
        isRobot: true,
        needsSpecializedArmor: true,
        needsSpecializedWeapons: true,
        // characterSvg: "protectron", TODO add protectron svg
    }),
    ROBOBRAIN: createOrigin('robobrain', {
        // TODO mesmetron + CAN USA NORMAL WEAPONS
        calcMaxCarryWeight: () => 150 / 2,
        hasRadiationImmunity: true,
        hasPoisonImmunity: true,
        isRobot: true,
        needsSpecializedArmor: true,
        needsSpecializedWeapons: true,
        // characterSvg: "robobrain", TODO add robobrain svg
    }),
    SECURITRON: createOrigin('securitron', {
        // TODO has special weapons only for him (no choose i think)
        calcMaxCarryWeight: () => 150 / 2,
        hasRadiationImmunity: true,
        hasPoisonImmunity: true,
        bodyParts: BODY_PARTS, // TODO should replace 2 legs with 1 wheel
        isRobot: true,
        needsSpecializedArmor: true,
        needsSpecializedWeapons: true,
        // characterSvg: "securitron", TODO add securitron svg
    }),
    SYNTH: createOrigin('synth', {
        // TODO many more things to implement
        bodyParts: BODY_PARTS,
        isRobot: true,
        // characterSvg: "synth", TODO add synth svg
    }),

    // #### Wanderer's Guide Origins
    // TODO all the below needs reviewing and implementation of mechanics
    ASSAULTRON: createOrigin('assaultron', {
        // TODO has special weapons only for him (no choose i think)
        calcMaxCarryWeight: () => 150 / 2,
        hasRadiationImmunity: true,
        hasPoisonImmunity: true,
        // hasPoisonImmunity: true, TODO
        isRobot: true,
        needsSpecializedArmor: true,
        needsSpecializedWeapons: true,
        // characterSvg: "assaultron" TODO add assaultron svg
    }),
    BROTHERHOOD_OUTCAST: createOrigin('brotherhoodOutcast'),
    CHILD_OF_ATOM: createOrigin('childOfAtom'), // TODO base radRes:1 and more
    NIGHTKIN: createOrigin('nightkin', {
        hasRadiationImmunity: true,
        hasPoisonImmunity: true,
        specialMaxValues: {
            strength: 12,
            endurance: 12,
            intelligence: 8,
            charisma: 8,
        },
        skillMaxValue: 4,
        needsSpecializedArmor: true,
        // characterSvg: "nightkin" TODO add nightkin svg
    }),
    TRIBAL: createOrigin('tribal', {
        numberOfTraits: 2
    }),
});
