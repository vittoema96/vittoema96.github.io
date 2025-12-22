export const SPECIAL = Object.freeze({
    STRENGTH: 'strength',
    PERCEPTION: 'perception',
    ENDURANCE: 'endurance',
    CHARISMA: 'charisma',
    INTELLIGENCE: 'intelligence',
    AGILITY: 'agility',
    LUCK: 'luck',
});
export const SKILLS = Object.freeze({
    ATHLETICS: 'athletics',
    BARTER: 'barter',
    BIG_GUNS: 'bigGuns',
    ENERGY_WEAPONS: 'energyWeapons',
    EXPLOSIVES: 'explosives',
    LOCKPICK: 'lockpick',
    MEDICINE: 'medicine',
    MELEE_WEAPONS: 'meleeWeapons',
    PILOT: 'pilot',
    REPAIR: 'repair',
    SCIENCE: 'science',
    SMALL_GUNS: 'smallGuns',
    SNEAK: 'sneak',
    SPEECH: 'speech',
    SURVIVAL: 'survival',
    THROWING: 'throwing',
    UNARMED: 'unarmed',
});
export const SKILL_TO_SPECIAL_MAP = Object.freeze({
    [SKILLS.ATHLETICS]: SPECIAL.STRENGTH,
    [SKILLS.BARTER]: SPECIAL.CHARISMA,
    [SKILLS.BIG_GUNS]: SPECIAL.ENDURANCE,
    [SKILLS.ENERGY_WEAPONS]: SPECIAL.PERCEPTION,
    [SKILLS.EXPLOSIVES]: SPECIAL.PERCEPTION,
    [SKILLS.LOCKPICK]: SPECIAL.PERCEPTION,
    [SKILLS.MEDICINE]: SPECIAL.INTELLIGENCE,
    [SKILLS.MELEE_WEAPONS]: SPECIAL.STRENGTH,
    [SKILLS.PILOT]: SPECIAL.PERCEPTION,
    [SKILLS.REPAIR]: SPECIAL.INTELLIGENCE,
    [SKILLS.SCIENCE]: SPECIAL.INTELLIGENCE,
    [SKILLS.SMALL_GUNS]: SPECIAL.AGILITY,
    [SKILLS.SNEAK]: SPECIAL.AGILITY,
    [SKILLS.SPEECH]: SPECIAL.CHARISMA,
    [SKILLS.SURVIVAL]: SPECIAL.ENDURANCE,
    [SKILLS.THROWING]: SPECIAL.AGILITY,
    [SKILLS.UNARMED]: SPECIAL.STRENGTH,
});

// Body parts for armor system
export const BODY_PARTS = Object.freeze({
    HEAD: 'head',
    LEFT_ARM: 'leftArm',
    RIGHT_ARM: 'rightArm',
    TORSO: 'torso',
    LEFT_LEG: 'leftLeg',
    RIGHT_LEG: 'rightLeg',
});

// Mr Handy body parts (robot components)
export const MR_HANDY_PARTS = Object.freeze({
    SENSORS: 'sensors',      // Maps to head position (top-left)
    BODY: 'body',            // Maps to torso position (top-right)
    ARMS: 'arms',            // Maps to left leg position (bottom-left)
    PROPULSORS: 'propulsors' // Maps to right leg position (bottom-right)
});

// Default character template
export const DEFAULT_CHARACTER = Object.freeze({
    name: undefined,
    origin: undefined,
    background: undefined,
    level: 1,
    caps: 0,
    special: Object.values(SPECIAL).reduce((acc, key) => {
        acc[key] = 5;
        return acc;
    }, {}),
    currentLuck: 5,
    currentHp: 10,
    skills: Object.values(SKILLS).reduce((acc, key) => {
        acc[key] = 0;
        return acc;
    }, {}),
    specialties: [],
    items: [],
});

// Mod slots for weapon/armor modifications
export const MOD_SLOTS = Object.freeze({
    BARREL: 'barrel',
    MAGAZINE: 'magazine',
    RECEIVER: 'receiver',
    STOCK: 'stock',
    SIGHT: 'sight',
    MUZZLE: 'muzzle',
    GRIP: 'grip',
    MATERIAL: 'material',
    LINING: 'lining',
    WEAVE: 'weave',
    MISC: 'misc',
});


const DEFAULT_SPECIAL_MAXES = Object.freeze(
    Object.values(SPECIAL).reduce((acc, stat) => {
        acc[stat] = 10;
        return acc;
    }, {})
);


const createOrigin = (id, {
                      calcMaxCarryWeight = (character) => 75 + (character.special[SPECIAL.STRENGTH] * 5),
                      hasRadiationImmunity = false,
                      hasPoisonImmunity = false,
                      bodyParts = BODY_PARTS,
                      specialMaxValues = DEFAULT_SPECIAL_MAXES,
                      skillMaxValue  = 6,
                      needsSpecializedArmor = false,
                      needsSpecializedWeapons = false,
                      canUseAid = true,
                      characterSvg = "vaultboy-open-arms"} = {}) => Object.freeze({
        id: id,
        calcMaxCarryWeight: calcMaxCarryWeight,
        hasRadiationImmunity: hasRadiationImmunity,
        hasPoisonImmunity: hasPoisonImmunity,
        bodyParts: bodyParts,
        specialMaxValues: { ...DEFAULT_SPECIAL_MAXES, ...specialMaxValues },
        skillMaxValue: skillMaxValue,
        needsSpecializedArmor: needsSpecializedArmor,
        needsSpecializedWeapons: needsSpecializedWeapons,
        canUseAid: canUseAid,
        characterSvg: characterSvg
});

export const getOriginById = (id) => {
    return Object.values(ORIGINS).find(o => o.id === id);
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

    VAULT_DWELLER:
        createOrigin("vaultDweller"),
    GHOUL:
        createOrigin("ghoul", {
            hasRadiationImmunity: true,
            characterSvg: "ghoul"
        }),
    SURVIVOR:
        createOrigin("survivor"),
    MR_HANDY:
        createOrigin("mrHandy", {
            calcMaxCarryWeight: () => 75, // Fixed carry weight for Mr. Handy, can only be upped by armour/mods
            hasRadiationImmunity: true,
            hasPoisonImmunity: true,
            bodyParts: MR_HANDY_PARTS,
            needsSpecializedArmor: true,
            needsSpecializedWeapons: true,
            canUseAid: false,
            characterSvg: "mrHandy"
        }),
    BROTHERHOOD_INITIATE:
        createOrigin("brotherhoodInitiate"),
    SUPER_MUTANT:
        createOrigin("superMutant", {
            hasRadiationImmunity: true,
            hasPoisonImmunity: true,
            specialMaxValues: {
                [SPECIAL.STRENGTH]: 12,
                [SPECIAL.ENDURANCE]: 12,
                [SPECIAL.INTELLIGENCE]: 6,
                [SPECIAL.CHARISMA]: 6
            }
        })
})
