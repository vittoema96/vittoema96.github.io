import {
    BODY_PARTS, GenericBodyPart,
    MR_HANDY_PARTS,
    Origin,
    OriginId,
    SkillType,
    SpecialType
} from "@/types";

// TODO delete this class:
//   - Most stuff can be moved to index.ts
//   - An Origin.ts class or something similar has to be created to contain Origin related stuff (complex handling)

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
        characterSvg = "vaultboy-open-arms",
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
    NO_ORIGIN: createOrigin(),
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
        characterSvg: "mrHandy",
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
