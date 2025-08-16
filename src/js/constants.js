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

// Storage configuration
export const STORAGE_CONFIG = Object.freeze({
    CHARACTER_PREFIX: 'character-data-',
    DEFAULT_CHARACTER_ID: 'default',
});
