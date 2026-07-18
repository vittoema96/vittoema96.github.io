import weaponJson from './item/weapon.json';
import apparelJson from './item/apparel.json';
import aidJson from './item/aid.json';
import ammoJson from './item/ammo.json';
import otherJson from './item/other.json';
import modJson from './item/mod.json';
import perksJson from './perks.json';
import companionPerksJson from './companionPerks.json';
import traitsJson from './traits.json';
import legendaryEffectsJson from './legendaryEffects.json';
import { GameDatabaseType } from '@/data/types.ts';

export const weapon = weaponJson as GameDatabaseType['weapon'];
export const apparel = apparelJson as GameDatabaseType['apparel'];
export const aid = aidJson as GameDatabaseType['aid'];
export const ammo = ammoJson as GameDatabaseType['ammo'];
export const other = otherJson as GameDatabaseType['other'];
export const mod = modJson as GameDatabaseType['mod'];
export const perks = perksJson as GameDatabaseType['perks'];
export const companionPerks = companionPerksJson as GameDatabaseType['companionPerks'];
export const traits = traitsJson as GameDatabaseType['traits'];
export const legendaryEffects = legendaryEffectsJson as GameDatabaseType['legendaryEffects'];

export const allItems = { ...weapon, ...apparel, ...aid, ...ammo, ...other, ...mod };

export const compiledData: GameDatabaseType = {
    weapon,
    apparel,
    aid,
    ammo,
    other,
    mod,
    perks,
    companionPerks,
    traits,
    legendaryEffects,
};
