import {
    BODY_PARTS, GenericBodyPart,
    MR_HANDY_PARTS,
    Origin,
    OriginId,
    RawCharacter,
    SKILLS,
    SkillType,
    SPECIAL,
    SpecialType
} from "@/types";

export const SKILL_TO_SPECIAL_MAP: Record<SkillType, SpecialType> = {
    athletics: "strength",
    barter: "charisma",
    bigGuns: "endurance",
    energyWeapons: "perception",
    explosives: "perception",
    lockpick: "perception",
    medicine: "intelligence",
    meleeWeapons: "strength",
    pilot: "perception",
    repair: "intelligence",
    science: "intelligence",
    smallGuns: "agility",
    sneak: "agility",
    speech: "charisma",
    survival: "endurance",
    throwing: "agility",
    unarmed: "strength",
} as const;

// Default character template
export const DEFAULT_CHARACTER: Readonly<RawCharacter> = Object.freeze({
    name: undefined,
    origin: undefined,
    background: undefined,
    level: 1,
    caps: 0,
    special: SPECIAL.reduce((acc, key) => {
        acc[key] = 5;
        return acc;
    }, {} as Record<SpecialType, number>),
    currentLuck: 5,
    currentHp: 10,
    skills: SKILLS.reduce((acc, key) => {
        acc[key] = 0;
        return acc;
    }, {} as Record<SkillType, number>),
    specialties: [],
    items: [],
});

interface CreateOriginOptions {
    calcMaxCarryWeight?: (strengthVal: number) => number;
    hasRadiationImmunity?: boolean;
    hasPoisonImmunity?: boolean;
    bodyParts?: Set<GenericBodyPart>;
    specialMaxValues?: Partial<Record<SpecialType, number>>;
    skillMaxValue?: number;
    needsSpecializedArmor?: boolean;
    needsSpecializedWeapons?: boolean;
    canUseAid?: boolean;
    characterSvg?: string;
}

const createOrigin = (id?: OriginId, options: CreateOriginOptions = {}): Origin => {
    const {
        calcMaxCarryWeight = (strengthVal) => 75 + (strengthVal * 5),
        hasRadiationImmunity = false,
        hasPoisonImmunity = false,
        bodyParts = BODY_PARTS,
        specialMaxValues = {},
        skillMaxValue = 6,
        needsSpecializedArmor = false,
        needsSpecializedWeapons = false,
        canUseAid = true,
        characterSvg = "vaultboy-open-arms"
    } = options;
    const bp = new Set(BODY_PARTS)
    const pbp = new Set(bodyParts)
    const isRobot = bp.size !== pbp.size || !bp.isSubsetOf(pbp)
    return Object.freeze({
        id,
        calcMaxCarryWeight,
        hasRadiationImmunity,
        hasPoisonImmunity,
        bodyParts,
        isRobot,
        specialMaxValues: {
            strength: 10,
            perception: 10,
            endurance: 10,
            charisma: 10,
            intelligence: 10,
            agility: 10,
            luck: 10,
            ...specialMaxValues
        },
        skillMaxValue,
        needsSpecializedArmor,
        needsSpecializedWeapons,
        canUseAid,
        characterSvg
    });
};
export const getOriginById = (id: OriginId): Origin => {
    return Object.values(ORIGINS).find(o => o.id === id) ?? ORIGINS.NO_ORIGIN;
};
export const ORIGINS = Object.freeze({
    // TODO to implement on origin:
    //  - additional tag skills
    //      * BrotherhoodInitiate: 1 of energyWeapons, Science or Repair
    //      * Ghoul: Survival
    //      * VaultDweller: any 1 skill
    //  - additional tag apparel
    //  - Supermutant starts with +2 on Str and End
    //  - Survivor has to choose Traits
    NO_ORIGIN: createOrigin(undefined),
    VAULT_DWELLER: createOrigin("vaultDweller"),
    GHOUL: createOrigin("ghoul", {
        hasRadiationImmunity: true,
        characterSvg: "ghoul"
    }),
    SURVIVOR: createOrigin("survivor"),
    MR_HANDY: createOrigin("mrHandy", {
        calcMaxCarryWeight: () => 75, // Fixed carry weight for Mr. Handy, can only be upped by armour/mods
        hasRadiationImmunity: true,
        hasPoisonImmunity: true,
        bodyParts: MR_HANDY_PARTS,
        needsSpecializedArmor: true,
        needsSpecializedWeapons: true,
        canUseAid: false,
        characterSvg: "mrHandy"
    }),
    BROTHERHOOD_INITIATE: createOrigin("brotherhoodInitiate"),
    SUPER_MUTANT: createOrigin("superMutant", {
        hasRadiationImmunity: true,
        hasPoisonImmunity: true,
        specialMaxValues: {
            strength: 12,
            endurance: 12,
            intelligence: 6,
            charisma: 6
        }
    })
});
