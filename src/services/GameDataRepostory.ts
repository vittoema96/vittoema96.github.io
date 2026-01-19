import Papa from 'papaparse';
import {
    WeaponItem, ApparelItem, AidItem, ModItem, GenericItem
} from '@/types';

export const GameDataRepository = {
    /**
     * Internal helper to handle JSON strings within CSV cells
     */
    transformRow(row: any): any {
        const processed = { ...row };
        for (const key in processed) {
            const val = processed[key];
            if (typeof val === 'string') {
                const trimmed = val.trim();
                if(trimmed === 'Infinity') {
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
    async parseCSV<T>(url: string): Promise<Record<string, T>> {
        return new Promise((resolve, reject) => {
            Papa.parse(url, {
                download: true,
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results: any) => {
                    const map = results.data.reduce((acc: any, row: any) => {
                        if (row.ID) { acc[row.ID] = this.transformRow(row) }
                        return acc;
                    }, {});
                    resolve(map);
                },
                error: reject,
            });
        });
    },

    async mergeCSVs<T>(urls: string[]): Promise<Record<string, T>> {
        const results = await Promise.all(urls.map(url => this.parseCSV<T>(url)));
        return Object.assign({}, ...results);
    },

    async loadAllData() {
        const [weapon, apparel, aid, other, mod, perks] = await Promise.all([
            this.mergeCSVs<WeaponItem>([
                'data/weapon/smallGuns.csv', 'data/weapon/energyWeapons.csv',
                'data/weapon/bigGuns.csv', 'data/weapon/meleeWeapons.csv',
                'data/weapon/throwing.csv', 'data/weapon/explosives.csv'
            ]),
            this.mergeCSVs<ApparelItem>([
                'data/apparel/armor.csv', 'data/apparel/clothing.csv', 'data/apparel/robotParts.csv'
            ]),
            this.mergeCSVs<AidItem>([
                'data/aid/food.csv', 'data/aid/drinks.csv', 'data/aid/meds.csv'
            ]),
            this.mergeCSVs<GenericItem>(['data/other/ammo.csv']),
            this.mergeCSVs<ModItem>([
                'data/mods/smallGunMods.csv', 'data/mods/bigGunMods.csv',
                'data/mods/energyWeaponMods.csv', 'data/mods/meleeWeaponMods.csv',
                'data/mods/armorMaterialMods.csv', 'data/mods/armorImprovementMods.csv',
                'data/mods/ballisticWeaveMods.csv', 'data/mods/vaultSuitMods.csv',
                'data/mods/robotArmorMods.csv'
            ]),
            this.parseCSV<any>('data/perks.csv')
        ]);

        return { weapon, apparel, aid, other, mod, perks };
    },
};
