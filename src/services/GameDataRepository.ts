import Papa from 'papaparse';
import { AidItem, AmmoItem, ModItem } from '@/types';
import { WeaponItem, WeaponSchema } from '@/schemas/items/weaponSchemas.ts';
import { ApparelItem, ApparelSchema } from '@/schemas/items/apparelSchemas.ts';
import { BaseItem } from '@/schemas/items/baseItemSchemas.ts';
import { z } from 'zod';

export const GameDataRepository = {
    /**
     * Internal helper to handle JSON strings within CSV cells
     * - If [...] or {...} JSON.parse
     * - If 'Infinity' parses to Infinity
     */
    transformRow(row: any): any {
        const processed = { ...row };
        for (const key in processed) {
            const val = processed[key];
            if (typeof val === 'string') {
                const trimmed = val.trim();
                if (trimmed === 'Infinity') {
                    processed[key] = Infinity;
                    continue;
                }
                if ((trimmed.startsWith('[') && trimmed.endsWith(']')) ||
                    (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
                    try {
                        processed[key] = JSON.parse(trimmed);
                    } catch (e) {
                        console.error(`Error parsing JSON in CSV: ${trimmed}. Error: ${e}`)
                    }
                }
            }
        }
        return processed;
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
                complete: (results: any) => {
                    const map: Record<string, T> = {};
                    results.data.forEach((row: any, index: number) => {
                        if (!row.ID) { return }
                        const processed = this.transformRow(row);
                        const validation = schema.safeParse(processed);
                        if (validation.success) {
                            map[row.ID] = validation.data;
                        } else {
                            console.error(
                                `❌ Validation error in ${url} (row ${index + 2}):`,
                                validation.error.format()
                            );
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
        const [weapon, apparel, aid, ammo, other, mod, perks, traits] = await Promise.all([
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
            ]),
            this.parseCSV<AmmoItem>('data/other/ammo.csv'),
            this.mergeCSVs<BaseItem>(['data/other/misc.csv']),
            this.mergeCSVs<ModItem>([
                'data/mods/smallGunMods.csv', 'data/mods/bigGunMods.csv',
                'data/mods/energyWeaponMods.csv', 'data/mods/meleeWeaponMods.csv',
                'data/mods/armorMaterialMods.csv', 'data/mods/armorImprovementMods.csv',
                'data/mods/ballisticWeaveMods.csv', 'data/mods/vaultSuitMods.csv',
                'data/mods/robotArmorMods.csv'
            ]),
            this.parseCSV<any>('data/perks.csv'),
            this.parseCSV<any>('data/traits.csv')
        ]);

        return { weapon, apparel, aid, ammo, other, mod, perks, traits };
    },
};


