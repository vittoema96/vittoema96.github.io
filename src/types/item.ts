

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
    'bows',
] as const;
export const APPAREL_CATEGORIES = [
    'clothing',
    'headgear',
    'outfit',
    'armor',
    'raiderArmor',
    'leatherArmor',
    'metalArmor',
    'combatArmor',
    'syntheticArmor',
    'vaultTecSecurity',
    'robotPart',
    // Wanderers DLC armor categories
    'scoutArmor',
    'marineArmor',
    'legionaryArmor',

    'powerArmor' // TODO check, unsure how to handle it
] as const;
export const AID_CATEGORIES = ['food', 'drinks', 'meds', 'misc'] as const;
export const AMMO_CATEGORIES = ['ammo'] as const;
export const OTHER_CATEGORIES = ['misc', 'junk', 'custom'] as const;
// A mod's category is the slot it occupies: one mod per category on an item.
export const MOD_CATEGORIES = [
    'modSlotBallisticWeave',
    'modSlotBarrel',
    'modSlotCapacitor',
    'modSlotConcentrate',
    'modSlotContainer',
    'modSlotDish',
    'modSlotFrame',
    'modSlotFuel',
    'modSlotGrip',
    'modSlotImprovement',
    'modSlotMagazine',
    'modSlotMaterial',
    'modSlotMelee',
    'modSlotMuzzle',
    'modSlotNozzle',
    'modSlotPropellantTank',
    'modSlotReceiver',
    'modSlotRobotArmor',
    'modSlotRobotModule',
    'modSlotRobotPlating',
    'modSlotSight',
    'modSlotStock',
    'modSlotUnderarmorLining',
    'modSlotVaultSuit',
] as const;

// types
export type WeaponCategory = (typeof WEAPON_CATEGORIES)[number];
export type ApparelCategory = (typeof APPAREL_CATEGORIES)[number];
export type AidCategory = (typeof AID_CATEGORIES)[number];
export type AmmoCategory = (typeof AMMO_CATEGORIES)[number];
export type OtherCategory = (typeof OTHER_CATEGORIES)[number];
export type ModCategory = (typeof MOD_CATEGORIES)[number];

export const ITEM_CATEGORIES = [
    ...WEAPON_CATEGORIES,
    ...APPAREL_CATEGORIES,
    ...AID_CATEGORIES,
    ...AMMO_CATEGORIES,
    ...OTHER_CATEGORIES,
    ...MOD_CATEGORIES,
];
export type ItemCategory =
    | WeaponCategory
    | ApparelCategory
    | AidCategory
    | AmmoCategory
    | OtherCategory
    | ModCategory;


// *---- MAP TYPE -> CATEGORIES ----*
export const ITEM_TYPE_MAP: Record<ItemType, readonly ItemCategory[]> = {
    weapon: WEAPON_CATEGORIES,
    apparel: APPAREL_CATEGORIES.filter(category => category !== 'powerArmor'), // TODO fix it once powerArmor gets implemented
    aid: AID_CATEGORIES,
    ammo: AMMO_CATEGORIES,
    mod: MOD_CATEGORIES,
    other: OTHER_CATEGORIES,
};
