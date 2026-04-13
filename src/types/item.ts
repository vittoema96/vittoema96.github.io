

// *---- ITEM TYPES ----*
export const ITEM_TYPES = ['weapon', 'apparel', 'aid', 'ammo', 'other', 'mod'] as const;
export type ItemType = (typeof ITEM_TYPES)[number];


// *---- ITEM CATEGORIES ----*
// arrays
export const WEAPON_CATEGORIES = [
    'smallGuns',
    'bigGuns',
    'energyWeapons',
    'meleeWeapons',
    'explosives',
    'throwing',
    'unarmed',
] as const;
export const APPAREL_CATEGORIES = [
    'clothing',
    'headgear',
    'outfit',
    'raiderArmor',
    'leatherArmor',
    'metalArmor',
    'combatArmor',
    'syntheticArmor',
    'vaultTecSecurity',
    'robotPart',
] as const;
export const AID_CATEGORIES = ['food', 'drinks', 'meds'] as const;
export const AMMO_CATEGORIES = ['ammo'] as const;
export const OTHER_CATEGORIES = ['misc', 'junk', 'custom'] as const;

// types
export type WeaponCategory = (typeof WEAPON_CATEGORIES)[number];
export type ApparelCategory = (typeof APPAREL_CATEGORIES)[number];
export type AidCategory = (typeof AID_CATEGORIES)[number];
export type AmmoCategory = (typeof AMMO_CATEGORIES)[number];
export type OtherCategory = (typeof OTHER_CATEGORIES)[number];

export const ITEM_CATEGORIES = [
    ...WEAPON_CATEGORIES,
    ...APPAREL_CATEGORIES,
    ...AID_CATEGORIES,
    ...AMMO_CATEGORIES,
    ...OTHER_CATEGORIES,
];
export type ItemCategory =
    | WeaponCategory
    | ApparelCategory
    | AidCategory
    | AmmoCategory
    | OtherCategory;


// *---- MAP TYPE -> CATEGORIES ----*
export const ITEM_TYPE_MAP: Record<ItemType, readonly ItemCategory[]> = {
    weapon: WEAPON_CATEGORIES,
    apparel: APPAREL_CATEGORIES,
    aid: AID_CATEGORIES,
    ammo: AMMO_CATEGORIES,
    mod: ['mods'], // TODO HAVE to decide how to handle mod categories
    other: OTHER_CATEGORIES,
};
