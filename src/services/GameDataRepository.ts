import Papa from 'papaparse';
import { AidItem, AmmoItem, LegendaryEffect, ModItem, TraitData } from '@/types';
import { WeaponItem, WeaponSchema } from '@/schemas/items/weaponSchemas.ts';
import { ApparelItem, ApparelSchema } from '@/schemas/items/apparelSchemas.ts';
import { BaseItem } from '@/schemas/items/baseItemSchemas.ts';
import { z } from 'zod';

export const GameDataRepository = {


    transformField(value: string | number): any {
        if (typeof value !== 'string') { return value }

        const trimmed = value.trim();
        if (trimmed === 'Infinity') { return Infinity }

        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) ||
            (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
            try {
                return JSON.parse(trimmed);
            } catch {
                return value; // Fallback to raw string if JSON parsing fails
            }
        }
        return value;
    },

    /**
     * Core Parsing logic
     */
    async parseCSV<T>(url: string, schema: z.ZodType<T> = z.any()): Promise<Record<string, T>> {
        return new Promise((resolve, reject) => {
            Papa.parse(url, {
                download: true,
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                transform: this.transformField,
                complete: (results: any) => {
                    const map: Record<string, T> = {};

                    results.data.forEach((row: any, index: number) => {
                        if (!row.ID) { return }

                        const validation = schema.safeParse(row);
                        if (validation.success) {
                            map[row.ID] = validation.data;
                        }

                        // TODO this is temporary, we need to fix the CompnaionSkillType problem
                        else if(['guns', 'body'].includes(row.CATEGORY)){
                            console.warn(`⚠️ Remember to fix CompanionSkills in Weapons, ${url} (row ${index + 2}):`, z.treeifyError(validation.error));
                            map[row.ID] = row as T;
                        }

                        else {
                            console.error(`❌ Validation error in ${url} (row ${index + 2}):`, z.treeifyError(validation.error));
                        }
                    });
                    resolve(map);
                },
                error: reject,
            });
        });
    },

    async mergeCSVs<T>(urls: string[], schema?: z.Schema<T>): Promise<Record<string, T>> {
        const results = await Promise.all(urls.map(url => this.parseCSV<T>(url, schema)));
        return Object.assign({}, ...results);
    },

    async loadAllData() {
        const [weapon, apparel, aid, ammo, other, mod, perks, traits, legendaryEffects] = await Promise.all([
            this.mergeCSVs<WeaponItem>([
                'data/weapon/smallGuns.csv', 'data/weapon/energyWeapons.csv',
                'data/weapon/bigGuns.csv', 'data/weapon/meleeWeapons.csv',
                'data/weapon/throwing.csv', 'data/weapon/explosives.csv',
                'data/weapon/companionWeapons.csv'
            ], WeaponSchema),
            this.mergeCSVs<ApparelItem>([
                'data/apparel/armor.csv', 'data/apparel/clothing.csv', 'data/apparel/robotParts.csv'
            ], ApparelSchema),
            this.mergeCSVs<AidItem>([
                'data/aid/food.csv', 'data/aid/drinks.csv', 'data/aid/meds.csv', 'data/aid/misc.csv'
            ]), // TODO provide Zod schema
            this.parseCSV<AmmoItem>('data/other/ammo.csv'), // TODO provide Zod schema
            this.mergeCSVs<BaseItem>(['data/other/misc.csv']), // TODO provide Zod schema
            this.mergeCSVs<ModItem>([
                'data/mods/smallGunMods.csv', 'data/mods/bigGunMods.csv',
                'data/mods/energyWeaponMods.csv', 'data/mods/meleeWeaponMods.csv',
                'data/mods/armorMaterialMods.csv', 'data/mods/armorImprovementMods.csv',
                'data/mods/ballisticWeaveMods.csv', 'data/mods/vaultSuitMods.csv',
                'data/mods/robotArmorMods.csv'
            ]), // TODO provide Zod schema
            this.parseCSV<any>('data/perks.csv'), // TODO provide Zod schema
            this.parseCSV<TraitData>('data/traits.csv'), // TODO provide Zod schema
            this.parseCSV<LegendaryEffect>('data/legendaryEffects.csv'), // TODO provide Zod schema
        ]);

        return { weapon, apparel, aid, ammo, other, mod, perks, traits, legendaryEffects };
    },
};


