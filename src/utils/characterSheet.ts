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
    isRobot?: boolean;
    numberOfTraits?: number;
    specialMaxValues?: Partial<Record<SpecialType, number>>;
    skillMaxValue?: number;
    needsSpecializedArmor?: boolean;
    needsSpecializedWeapons?: boolean;
    characterSvg?: string;
}

const createOrigin = (id?: OriginId, options: CreateOriginOptions = {}): Origin => {
    const {
        calcMaxCarryWeight = (strengthVal) => 75 + (strengthVal * 5),
        hasRadiationImmunity = false,
        hasPoisonImmunity = false,
        bodyParts = BODY_PARTS,
        isRobot = false,
        specialMaxValues = {},
        skillMaxValue = 6,
        numberOfTraits = 0,
        needsSpecializedArmor = false,
        needsSpecializedWeapons = false,
        characterSvg = "vaultboy-open-arms",
    } = options;
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
        numberOfTraits,
        needsSpecializedArmor,
        needsSpecializedWeapons,
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
    VAULT_DWELLER: createOrigin('vaultDweller'),
    GHOUL: createOrigin('ghoul', {
        hasRadiationImmunity: true,
        characterSvg: 'ghoul',
    }),
    SURVIVOR: createOrigin('survivor', {
        numberOfTraits: 2,
    }), // TODO missing traits
    MR_HANDY: createOrigin('mrHandy', {
        // TODO might have mr handy weapons as "traits"
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
        // TODO might have protectron weapons as "traits"
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

// TODO Trait implementations needed:
//  - traitEducated: add as info or something (penalty: When failing a skill test using a skill other than a tag skill, the GM gains 1 AP)
//  - traitHeavyHanded: implement (Melee attacks suffer complication on 19-20 instead of only 20)
//  - traitSmallFrame: implement (Carry weight is 75 + (2.5 × STR) kg instead of 75 + (5 × STR) kg)
//  - traitExtraPerk: implement (character gains an additional perk at level 1)
//  - traitGrunt: implement (+1 DC damage with specific weapons, increased complication range with big guns/energy weapons)
//  - traitHomeOnTheRange: implement (campfire rest mechanics, cannot gain well rested bonus)
//  - traitTriggerDiscipline: implement (re-roll 1d20 on ranged attacks, reduce fire rate by 1)
//  - traitBrahminBaron: implement (settlement mechanics for Brahmin)
//  - traitMotherWasteland: implement (?) maybe add a button to decrease current luck (spend 1 Luck for insight)
//  - traitNomad: implement (re-roll on Survival tests, increased difficulty/complication on Barter/Speech in settlements)
//  - traitRiteOfPassage: implement (first Luck spend in scene has chance to not consume, cannot assist PCs without spending 1 AP)
//  - traitToolsOfTheOldWorld: implement (use Survival instead of Repair/Science, increased complication range)
//  - traitTheChosenOne: implement (first d20 purchase free on tribe quest tests, GM gains 2 AP when quest comes up)
