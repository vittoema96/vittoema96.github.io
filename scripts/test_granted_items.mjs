import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const storage = new Map();
globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key),
};
globalThis.window = { localStorage: globalThis.localStorage };

let server,
    schema,
    inventory,
    utils,
    feats,
    store,
    origins,
    calculate,
    transitions,
    data,
    registry,
    calculatePerks,
    calculateTraits;
before(async () => {
    server = await createServer({
        configFile: false,
        root,
        resolve: { alias: { '@': `${root}src` } },
        server: { middlewareMode: true, hmr: false, ws: false, watch: null },
        optimizeDeps: { noDiscovery: true, entries: [] },
        esbuild: { jsx: 'automatic' },
    });
    const load = path => server.ssrLoadModule(`/src/${path}`);
    schema = await load('schemas/characterSchemas.ts');
    inventory = await load('features/character/items.ts');
    utils = await load('features/item/utils.ts');
    feats = await load('features/character/feats/rules.ts');
    store = await load('hooks/useSaveStore.ts');
    origins = await load('features/character/origins/registry.ts');
    ({ calculateCharacter: calculate } = await load('features/character/calculate.ts'));
    transitions = await load('features/character/update.ts');
    data = await load('data/index.ts');
    registry = await load('features/character/feats/registry.ts');
    ({ calculatePerks } = await load('features/character/feats/perks.ts'));
    ({ calculateTraits } = await load('features/character/feats/traits.ts'));
});
after(async () => {
    await server?.close();
});

const item = (id, extra = {}) => ({ id, quantity: 1, equipped: false, mods: [], ...extra });
const character = (extra = {}) =>
    schema.RawCharacterSchema.parse({
        saveVersion: 1,
        origin: 'mrHandy',
        level: 30,
        special: {
            strength: 8,
            perception: 8,
            endurance: 8,
            charisma: 8,
            intelligence: 8,
            agility: 8,
            luck: 8,
        },
        ...extra,
    });
const legacyCharacter = extra => {
    const { saveVersion: _saveVersion, ...raw } = character(extra);
    return raw;
};
const reconcile = raw => inventory.reconcileItems(raw, raw);
const active = raw => {
    const origin = origins.getOriginById(raw.origin);
    return inventory.getInventory(raw.items, {
        origin,
        perks: calculatePerks(raw),
        traits: calculateTraits(raw, origin),
    }).items;
};
const granted = (raw, id) => raw.items.find(i => i.id === id && i.grantedBy);

for (const suffix of ['CircularSaw', 'Flamethrower', 'Pliers', 'AutomaticPistol', 'LaserEmitter']) {
    test(`Mr. Handy ${suffix}: grant, hide, restore configuration without duplicating`, () => {
        const id = `weaponMrHandy${suffix}`,
            trait = `traitMrHandy${suffix}`;
        let raw = reconcile(character({ traits: [trait] }));
        assert.equal(granted(raw, id).grantedBy, trait);
        raw = {
            ...raw,
            items: raw.items.map(i =>
                i.id === id
                    ? { ...i, mods: ['legendaryFreezing'], customName: 'Customized arm' }
                    : i,
            ),
        };
        const saved = structuredClone(granted(raw, id));
        const inactive = reconcile({ ...raw, traits: [] });
        assert.deepEqual(granted(inactive, id), saved);
        assert.ok(!active(inactive).some(i => i.id === id));
        const restored = reconcile(
            schema.RawCharacterSchema.parse(
                JSON.parse(
                    JSON.stringify({
                        ...inactive,
                        traits: [trait],
                    }),
                ),
            ),
        );
        assert.deepEqual(granted(restored, id), saved);
        assert.equal(restored.items.filter(i => i.id === id).length, 1);
        assert.ok(active(restored).some(i => i.id === id));
        assert.deepEqual(reconcile(restored), restored);
    });
}

test('Inactive grants stay out of weight and retain equipped state', () => {
    const raw = character({
        items: [
            item('weaponTenMillimeterPistol', {
                grantedBy: 'inactiveFeat',
                equipped: true,
            }),
        ],
    });
    assert.equal(calculate(raw).currentWeight, 0);
    assert.equal(
        calculate({ ...raw, items: raw.items.map(i => ({ ...i, grantedBy: undefined })) })
            .currentWeight,
        2,
    );
    assert.equal(reconcile(raw).items[0].equipped, true);
});

test('Humanoid Iron Fist replaces but preserves a saved unarmed attack', () => {
    const base = character({
        origin: 'survivor',
        items: [item('weaponUnarmedStrike', { customName: 'Original attack' })],
    });
    const raw = reconcile({ ...base, perks: ['perkIronFist'] });
    assert.equal(granted(raw, 'weaponIronFist').grantedBy, 'perkIronFist');
    assert.ok(raw.items.some(i => i.id === 'weaponUnarmedStrike'));
    assert.deepEqual(
        active(raw).map(i => i.id),
        ['weaponIronFist'],
    );
    const removed = reconcile({ ...raw, perks: [] });
    assert.deepEqual(active(removed), base.items);
    assert.ok(granted(removed, 'weaponIronFist'));
});

test('Humanoid implicit unarmed attack is a valid replacement target', () => {
    const raw = reconcile(character({ origin: 'survivor', perks: ['perkIronFist'] }));
    assert.deepEqual(
        active(raw).map(i => i.id),
        ['weaponIronFist'],
    );
});

test('Pliers and Iron Fist both retain their configurations through replacement cycles', () => {
    let raw = reconcile(character({ traits: ['traitMrHandyPliers'] }));
    const pliers = granted(raw, 'weaponMrHandyPliers');
    pliers.mods = ['legendaryFreezing'];
    pliers.customName = 'My pliers';
    raw = reconcile({ ...raw, perks: ['perkIronFist'] });
    const fist = granted(raw, 'weaponIronFist');
    fist.customName = 'My fist';
    assert.ok(!active(raw).some(i => i.id === pliers.id));
    raw = reconcile({ ...raw, perks: [] });
    assert.deepEqual(
        active(raw).find(i => i.id === pliers.id),
        pliers,
    );
    raw = reconcile({ ...raw, perks: ['perkIronFist'] });
    assert.deepEqual(
        active(raw).find(i => i.id === fist.id),
        fist,
    );
    assert.equal(raw.items.filter(i => i.id === fist.id).length, 1);
});

test('Stored inactive pliers cannot unlock Iron Fist', () => {
    const raw = reconcile(
        character({
            perks: ['perkIronFist'],
            items: [item('weaponMrHandyPliers', { grantedBy: 'traitMrHandyPliers' })],
        }),
    );
    assert.ok(!granted(raw, 'weaponIronFist'));
    assert.ok(!active(raw).some(i => i.id === 'weaponMrHandyPliers'));
    const withPliers = reconcile({ ...raw, traits: ['traitMrHandyPliers'] });
    assert.ok(active(withPliers).some(i => i.id === 'weaponIronFist'));
    const withoutPliers = reconcile({ ...withPliers, traits: [] });
    assert.ok(granted(withoutPliers, 'weaponIronFist'));
    assert.ok(!active(withoutPliers).some(i => i.id === 'weaponIronFist'));
});

test('Changing origin hides grants without deleting configuration', () => {
    const robot = reconcile(character({ traits: ['traitMrHandyPliers'] }));
    const human = inventory.reconcileItems(robot, { ...robot, origin: 'survivor' });
    assert.ok(granted(human, 'weaponMrHandyPliers'));
    assert.ok(
        !inventory
            .getInventory(human.items, {
                origin: origins.getOriginById('survivor'),
                perks: [],
                traits: [],
            })
            .items.some(i => i.id === 'weaponMrHandyPliers'),
    );
});

test("Manual items and grants do not merge or acquire each other's provenance", async () => {
    const { applyRemoveItem } = inventory;
    const manual = item('weaponMrHandyCircularSaw');
    const grant = { ...manual, grantedBy: 'traitMrHandyCircularSaw' };
    for (const items of [
        [manual, grant],
        [grant, manual],
    ]) {
        const parsed = schema.ItemsSchema.parse(items);
        assert.equal(parsed.length, 2);
        assert.notEqual(utils.getUniqueKey(manual), utils.getUniqueKey(grant));
        assert.deepEqual(applyRemoveItem(parsed, grant), [manual]);
        let raw = character({ traits: ['traitMrHandyCircularSaw'], items });
        for (let i = 0; i < 3; i++) {
            raw = schema.RawCharacterSchema.parse(reconcile(raw));
        }
        assert.equal(
            raw.items.filter(i => i.id === manual.id).reduce((n, i) => n + i.quantity, 0),
            2,
        );
        assert.deepEqual(
            active({ ...raw, traits: [] }).filter(i => i.id === manual.id),
            [manual],
        );
    }
});

test('Iron Fist Vicious follows the rank and removes the tagged receiver workaround', () => {
    const legacy = item('weaponIronFist', {
        grantedBy: 'perkIronFist',
        mods: ['modCalibrated', 'legendaryFreezing'],
    });
    const raw = reconcile(
        character({ origin: 'survivor', items: [legacy], perks: ['perkIronFist'] }),
    );
    const fist = granted(raw, 'weaponIronFist');
    assert.deepEqual(fist.mods, ['legendaryFreezing']);
    for (const rank of [1, 2, 1, 2, 0]) {
        const perks = Array(rank).fill('perkIronFist');
        assert.equal(
            inventory.getModifiedItemData(fist, perks).EFFECTS.includes('effectVicious'),
            rank >= 2,
        );
        assert.deepEqual(fist.mods, ['legendaryFreezing']);
    }
});

for (const suffix of ['CircularSaw', 'Flamethrower', 'Pliers', 'AutomaticPistol', 'LaserEmitter']) {
    test(`Legacy Mr. Handy ${suffix}: adopt the saved configuration before adding grants`, () => {
        const id = `weaponMrHandy${suffix}`;
        const trait = `traitMrHandy${suffix}`;
        const saved = item(id, {
            quantity: 3,
            customName: 'Customized legacy arm',
            mods: ['legendaryFreezing'],
        });
        const legacy = legacyCharacter({ traits: [trait], currentHp: 2, items: [saved] });
        const snapshot = structuredClone(legacy);
        assert.ok(!('saveVersion' in legacy));
        assert.ok(!('grantedBy' in legacy.items[0]));
        const migrated = transitions.loadCharacter(legacy);
        assert.equal(migrated.saveVersion, 1);
        assert.equal(migrated.currentHp, 2);
        assert.deepEqual(
            migrated.items.filter(i => i.id === id),
            [{ ...saved, grantedBy: trait }],
        );
        assert.deepEqual(legacy, snapshot);
        const inactive = transitions.applyUpdate(migrated, { traits: [] });
        assert.ok(!active(inactive).some(i => i.id === id));
        const restored = transitions.applyUpdate(inactive, { traits: [trait] });
        assert.deepEqual(
            restored.items.filter(i => i.id === id),
            migrated.items.filter(i => i.id === id),
        );
        assert.deepEqual(transitions.loadCharacter(JSON.parse(JSON.stringify(restored))), restored);
    });
}

test('Legacy Iron Fist preserves all configurations and derives Vicious after rank downgrades', () => {
    const saved = [
        item('weaponIronFist', {
            quantity: 2,
            customName: 'Old freezing fist',
            mods: ['modCalibrated', 'legendaryFreezing'],
        }),
        item('weaponIronFist', {
            customName: 'Old equipped fist',
            equipped: true,
            mods: ['modCalibrated'],
        }),
    ];
    const legacy = legacyCharacter({
        origin: 'survivor',
        currentHp: 2,
        perks: ['perkIronFist', 'perkIronFist'],
        items: saved,
    });
    const snapshot = structuredClone(legacy);
    let migrated = transitions.loadCharacter(legacy);
    const expected = saved.map(i => ({
        ...i,
        grantedBy: 'perkIronFist',
        mods: i.mods.filter(mod => mod !== 'modCalibrated'),
    }));
    assert.deepEqual(migrated.items, expected);
    assert.equal(migrated.currentHp, 2);
    assert.deepEqual(legacy, snapshot);
    for (const rank of [1, 2, 0, 2, 1]) {
        migrated = transitions.applyUpdate(migrated, { perks: Array(rank).fill('perkIronFist') });
        assert.deepEqual(migrated.items, expected);
        assert.equal(active(migrated).length, rank > 0 ? 2 : 0);
        for (const fist of active(migrated)) {
            assert.equal(
                inventory
                    .getModifiedItemData(fist, migrated.perks)
                    .EFFECTS.includes('effectVicious'),
                rank >= 2,
            );
        }
    }
});

test('Legacy grants are adopted even when their feat or origin is inactive', () => {
    const suffixes = ['CircularSaw', 'Flamethrower', 'Pliers', 'AutomaticPistol', 'LaserEmitter'];
    const legacy = legacyCharacter({
        origin: 'survivor',
        items: [
            ...suffixes.map(suffix => item(`weaponMrHandy${suffix}`)),
            item('weaponIronFist', { mods: ['modCalibrated'] }),
            item('weaponTenMillimeterPistol', {
                mods: ['modCalibrated'],
                customName: 'Manual pistol',
            }),
            item('weaponMrHandyPliers', { grantedBy: 'otherFeat', customName: 'Other source' }),
        ],
    });
    const migrated = transitions.loadCharacter({ ...legacy, saveVersion: 0 });
    for (const suffix of suffixes) {
        assert.equal(
            granted(migrated, `weaponMrHandy${suffix}`).grantedBy,
            `traitMrHandy${suffix}`,
        );
    }
    assert.deepEqual(granted(migrated, 'weaponIronFist').mods, []);
    assert.deepEqual(active(migrated), [
        item('weaponTenMillimeterPistol', { mods: ['modCalibrated'], customName: 'Manual pistol' }),
    ]);
    assert.equal(migrated.items.find(i => i.customName === 'Other source').grantedBy, 'otherFeat');
    const robot = transitions.applyUpdate(migrated, {
        origin: 'mrHandy',
        traits: ['traitMrHandyPliers'],
        perks: ['perkIronFist'],
    });
    assert.ok(active(robot).some(i => i.id === 'weaponIronFist'));
    assert.ok(!active(robot).some(i => i.id === 'weaponMrHandyPliers'));
});

test('Legacy grant migration leaves non-inventory character data and uninitialized HP unchanged', async () => {
    const { createDefaultCompanion } = await server.ssrLoadModule('/src/utils/companionTypes.ts');
    const dog = {
        ...createDefaultCompanion('dog'),
        name: 'Old companion',
        special: { body: 6, mind: 4 },
        currentHp: 1,
    };
    const legacy = legacyCharacter({
        origin: 'survivor',
        name: 'Old character',
        currentLuck: 2,
        rads: 7,
        caps: 81,
        ncrDollars: 12,
        legionDenarius: 3,
        prewarMoney: 9,
        mapCodes: ['oldMarker'],
        companions: { dog },
        activeCompanionId: 'dog',
        items: [item('weaponIronFist', { mods: ['modCalibrated'] })],
    });
    const { items: _oldItems, ...expected } = structuredClone(legacy);
    const migrated = transitions.loadCharacter(legacy);
    const { items: _items, saveVersion: _version, ...actual } = migrated;
    assert.deepEqual(actual, expected);
    assert.equal(migrated.currentHp, undefined);
});

test('Versioned saves preserve manual copies created after the migration, including on import', () => {
    assert.equal(store.getDefaultCharacter().saveVersion, 1);
    const migrated = transitions.loadCharacter(
        legacyCharacter({
            traits: ['traitMrHandyCircularSaw'],
            items: [item('weaponMrHandyCircularSaw', { customName: 'Old arm' })],
        }),
    );
    const manual = item('weaponMrHandyCircularSaw', { quantity: 2 });
    const manualFist = item('weaponIronFist', { mods: ['modCalibrated'] });
    const updated = transitions.applyUpdate(migrated, {
        items: inventory.applyAddItem([...migrated.items, manualFist], manual),
    });
    const exported = JSON.parse(JSON.stringify(updated));
    const loaded = transitions.loadCharacter(exported);
    assert.deepEqual(loaded, updated);
    assert.deepEqual(
        loaded.items.find(i => i.id === manual.id && !i.grantedBy),
        manual,
    );
    assert.deepEqual(
        loaded.items.find(i => i.id === manualFist.id),
        manualFist,
    );
    store.useSaveStore.getState().importSlot(6, exported);
    assert.deepEqual(store.useSaveStore.getState().slots[6], updated);
    const off = transitions.applyUpdate(loaded, { traits: [] });
    assert.deepEqual(
        active(off).filter(i => i.id === manual.id),
        [manual],
    );
});

test('Imports, all persisted slots and legacy storage keys migrate without transition healing', async () => {
    const saves = store.useSaveStore;
    const robot = legacyCharacter({
        traits: ['traitMrHandyLaserEmitter'],
        currentHp: 2,
        items: [item('weaponMrHandyLaserEmitter', { customName: 'Old laser' })],
    });
    const human = legacyCharacter({
        origin: 'survivor',
        currentHp: 1,
        perks: ['perkIronFist'],
        items: [item('weaponIronFist', { mods: ['modCalibrated'] })],
    });
    saves.getState().importSlot(1, robot);
    assert.equal(saves.getState().slots[1].saveVersion, 1);
    assert.equal(saves.getState().slots[1].currentHp, 2);
    const slots = Array.from({ length: 10 }, (_, i) => (i === 1 ? robot : i === 8 ? human : null));
    storage.set(
        'PB3K_character_saves',
        JSON.stringify({ state: { activeSlot: 1, slots }, version: 0 }),
    );
    await saves.persist.rehydrate();
    assert.deepEqual(saves.getState().slots[1], transitions.loadCharacter(robot));
    assert.deepEqual(saves.getState().slots[8], transitions.loadCharacter(human));
    saves.getState().setActiveSlot(8);
    const persisted = JSON.parse(storage.get('PB3K_character_saves'));
    assert.equal(persisted.version, 0);
    assert.equal(persisted.state.slots[1].saveVersion, 1);
    assert.equal(persisted.state.slots[8].saveVersion, 1);
    assert.equal(persisted.state.slots[8].currentHp, 1);

    storage.delete('PB3K_character_saves');
    storage.set('character_slot_2', JSON.stringify(robot));
    storage.set('character_slot_7', JSON.stringify(human));
    storage.set('character_active_slot', '2');
    store.migrateLegacyStorage();
    const legacyStorage = JSON.parse(storage.get('PB3K_character_saves'));
    assert.equal(legacyStorage.state.activeSlot, 2);
    assert.deepEqual(legacyStorage.state.slots[2], transitions.loadCharacter(robot));
    assert.deepEqual(legacyStorage.state.slots[7], transitions.loadCharacter(human));
    assert.equal(storage.has('character_slot_2'), false);
    assert.equal(storage.has('character_slot_7'), false);
    await saves.persist.rehydrate();
});

test('Collector rejects ungrounded replacement chains and accepts grounded ones', () => {
    const origin = {
        ...origins.getOriginById('survivor'),
        getGrantedItems: () => [
            { ...item('B'), replaces: ['A'] },
            { ...item('A'), replaces: ['base'] },
        ],
    };
    assert.deepEqual(feats.getGrantedItems({ origin, perks: [], traits: [], items: [] }), []);
    assert.deepEqual(
        feats
            .getGrantedItems({ origin, perks: [], traits: [], items: [item('base')] })
            .map(i => i.id),
        ['A', 'B'],
    );
});

test('Store normalizes imports, updates, serialization and rehydration without Context effects', async () => {
    const saves = store.useSaveStore;
    saves.getState().importSlot(1, character({ traits: ['traitMrHandyLaserEmitter'] }));
    saves.getState().setActiveSlot(1);
    let raw = saves.getState().slots[1];
    const laser = granted(raw, 'weaponMrHandyLaserEmitter');
    assert.ok(laser);
    saves.getState().updateActiveCharacter(prev => ({
        ...prev,
        items: prev.items.map(i => (i.id === laser.id ? { ...i, customName: 'Saved laser' } : i)),
        traits: [],
    }));
    const savedStorage = storage.get('PB3K_character_saves');
    saves.getState().resetActiveCharacter();
    storage.set('PB3K_character_saves', savedStorage);
    await saves.persist.rehydrate();
    raw = saves.getState().slots[1];
    assert.equal(granted(raw, laser.id).customName, 'Saved laser');
    assert.ok(!active(raw).some(i => i.id === laser.id));
    saves
        .getState()
        .updateActiveCharacter(prev => ({ ...prev, traits: ['traitMrHandyLaserEmitter'] }));
    raw = saves.getState().slots[1];
    assert.equal(active(raw).find(i => i.id === laser.id).customName, 'Saved laser');
    assert.equal(raw.items.filter(i => i.id === laser.id).length, 1);
});

test('Reconciliation does not mutate its input', () => {
    const raw = character({ traits: ['traitMrHandyPliers'] });
    const snapshot = JSON.stringify(raw);
    reconcile(raw);
    assert.equal(JSON.stringify(raw), snapshot);
});

test('Unmet perk requirements hide a retained grant and remove its calculated effects', () => {
    const raw = reconcile(
        character({ origin: 'survivor', perks: ['perkIronFist', 'perkIronFist'] }),
    );
    const lowLevel = reconcile({ ...raw, level: 1 });
    assert.ok(granted(lowLevel, 'weaponIronFist'));
    assert.deepEqual(calculate(lowLevel).perks, []);
    assert.ok(!calculate(lowLevel).items.some(i => i.id === 'weaponIronFist'));
    const rankOne = reconcile({ ...lowLevel, perks: ['perkIronFist'] });
    const calculated = calculate(rankOne);
    assert.ok(
        !inventory
            .getModifiedItemData(granted(rankOne, 'weaponIronFist'), calculated.perks)
            .EFFECTS.includes('effectVicious'),
    );
});

test('Inventory hooks add virtual attacks only to weapons and do not mutate saved items', async () => {
    const { CharacterProvider } = await server.ssrLoadModule(
        '/src/app/contexts/CharacterContext.tsx',
    );
    const { useInventoryFilter } = await server.ssrLoadModule(
        '/src/app/tabs/inv/hooks/useInventoryFilter.ts',
    );
    store.useSaveStore.getState().importSlot(
        0,
        character({
            origin: 'survivor',
            items: [
                item('weaponUnarmedStrike'),
                item('weaponTenMillimeterPistol', { quantity: 2 }),
                item('weaponWeaponStockOneHanded'),
            ],
        }),
    );
    store.useSaveStore.getState().setActiveSlot(0);
    const snapshot = JSON.stringify(store.useSaveStore.getState().slots[0]);
    let weapons, ammo;
    function View() {
        weapons = useInventoryFilter('weapon');
        ammo = useInventoryFilter('ammo');
        return null;
    }
    for (let i = 0; i < 2; i++) {
        renderToStaticMarkup(createElement(CharacterProvider, null, createElement(View)));
    }
    assert.equal(weapons.filter(i => i.id === 'weaponUnarmedStrike').length, 1);
    assert.deepEqual(ammo, []);
    assert.equal(JSON.stringify(store.useSaveStore.getState().slots[0]), snapshot);
});

test('Domain updates merge nested patches once without mutating previous values', () => {
    const prev = character({ currentHp: 5 });
    const snapshot = structuredClone(prev);
    const next = transitions.applyUpdate(prev, {
        special: { strength: 9 },
        skills: { smallGuns: 2 },
        name: 'Updated',
    });
    assert.deepEqual(next.special, { ...prev.special, strength: 9 });
    assert.deepEqual(next.skills, { ...prev.skills, smallGuns: 2 });
    assert.equal(next.name, 'Updated');
    assert.equal(next.currentHp, 5);
    assert.deepEqual(prev, snapshot);
    assert.throws(() => transitions.applyUpdate(prev, { level: 0 }));
});

test('HP transitions heal only the positive maximum delta and clamp decreases', () => {
    const prev = character({ origin: 'survivor', level: 5, currentHp: 10 });
    const higher = transitions.applyUpdate(prev, { level: 8 });
    assert.equal(higher.currentHp, 13);
    const lower = transitions.applyUpdate(higher, { level: 5 });
    assert.equal(lower.currentHp, 13);
    const full = { ...higher, currentHp: calculate(higher).maxHp };
    const clamped = transitions.applyUpdate(full, { level: 5 });
    assert.equal(clamped.currentHp, calculate(clamped).maxHp);
    const implicit = character({ origin: 'survivor', level: 5 });
    const increased = transitions.applyUpdate(implicit, { level: 8 });
    assert.equal(increased.currentHp, calculate(increased).maxHp);
});

test('Explicit HP edits are respected even when maximum HP increases', () => {
    const prev = character({ origin: 'survivor', currentHp: 5, level: 5 });
    assert.equal(transitions.applyUpdate(prev, { level: 8, currentHp: 2 }).currentHp, 2);
    assert.equal(
        transitions.applyUpdate(prev, { level: 8, currentHp: undefined }).currentHp,
        calculate({ ...prev, level: 8 }).maxHp,
    );
    const clamped = transitions.applyUpdate(prev, { level: 8, currentHp: 999 });
    assert.equal(clamped.currentHp, calculate(clamped).maxHp);
});

test('HP transitions and calculation agree on effective perk requirements', () => {
    const prev = character({
        origin: 'survivor',
        level: 4,
        currentHp: 5,
        perks: ['perkLifeGiver'],
    });
    assert.deepEqual(calculate(prev).perks, []);
    const next = transitions.applyUpdate(prev, { level: 5 });
    const delta = calculate(next).maxHp - calculate(prev).maxHp;
    assert.equal(delta, 1 + prev.special.endurance);
    assert.equal(next.currentHp, prev.currentHp + delta);
    const removed = transitions.applyUpdate(next, { perks: [] });
    assert.equal(removed.currentHp, next.currentHp);
});

test('Loading, importing, switching and rehydrating never grant transition healing', async () => {
    const raw = character({ origin: 'survivor', currentHp: 2, perks: ['perkLifeGiver'] });
    const snapshot = structuredClone(raw);
    const loaded = transitions.loadCharacter(raw);
    assert.equal(loaded.currentHp, 2);
    assert.deepEqual(raw, snapshot);
    const saves = store.useSaveStore;
    saves.getState().importSlot(4, raw);
    saves.getState().setActiveSlot(4);
    assert.equal(saves.getState().slots[4].currentHp, 2);
    saves.getState().setActiveSlot(5);
    saves.getState().setActiveSlot(4);
    await saves.persist.rehydrate();
    assert.equal(saves.getState().slots[4].currentHp, 2);
    saves.getState().updateActiveCharacter({ level: raw.level + 1 });
    assert.equal(saves.getState().slots[4].currentHp, 3);
});

test('Companion map edits preserve other companions and the legacy import format', async () => {
    const { createDefaultCompanion } = await server.ssrLoadModule('/src/utils/companionTypes.ts');
    const dog = createDefaultCompanion('dog');
    const robot = createDefaultCompanion('mrHandy');
    const prev = transitions.loadCharacter({
        ...character(),
        companions: { [dog.type]: dog, [robot.type]: robot },
    });
    const next = transitions.applyUpdate(prev, {
        companions: { [dog.type]: { ...dog, name: 'Dog', currentHp: 1 } },
        activeCompanionId: dog.type,
    });
    assert.equal(next.companions[dog.type].currentHp, 1);
    assert.equal(next.companions[dog.type].name, 'Dog');
    assert.deepEqual(next.companions[robot.type], prev.companions[robot.type]);
    const { companions: _companions, ...legacy } = prev;
    const imported = transitions.loadCharacter({ ...legacy, companion: dog });
    assert.deepEqual(imported.companions[dog.type], prev.companions[dog.type]);
    assert.equal(imported.activeCompanionId, dog.type);
});

test('Companion updaters compose against latest data without overwriting other fields or companions', async () => {
    const { createDefaultCompanion } = await server.ssrLoadModule('/src/utils/companionTypes.ts');
    const prev = transitions.loadCharacter({
        ...character(),
        companions: {
            dog: createDefaultCompanion('dog'),
            eyebot: createDefaultCompanion('eyebot'),
        },
    });
    const snapshot = structuredClone(prev);
    const rename = transitions.updateCompanion('dog', { name: 'Dog' });
    const increaseBody = transitions.updateCompanion('dog', current => ({
        special: { ...current.special, body: current.special.body + 1 },
    }));
    let next = transitions.applyUpdate(prev, rename(prev));
    next = transitions.applyUpdate(next, increaseBody(next));
    next = transitions.applyUpdate(next, increaseBody(next));
    const hurt = transitions.updateCompanion('dog', { currentHp: 1 });
    next = transitions.applyUpdate(next, hurt(next));
    assert.equal(next.companions.dog.name, 'Dog');
    assert.equal(next.companions.dog.currentHp, 1);
    assert.equal(next.companions.dog.special.body, prev.companions.dog.special.body + 2);
    assert.equal(next.companions.dog.special.mind, prev.companions.dog.special.mind);
    assert.deepEqual(next.companions.dog.skills, prev.companions.dog.skills);
    assert.deepEqual(next.companions.eyebot, prev.companions.eyebot);
    assert.deepEqual(prev, snapshot);
});

test('First companion edits save legitimate defaults but do not recreate unavailable companions', () => {
    const rename = transitions.updateCompanion('dog', { name: 'First saved edit' });
    const unlocked = transitions.loadCharacter(character({ perks: ['perkDogmeat'] }));
    assert.deepEqual(unlocked.companions, {});
    const saved = transitions.applyUpdate(unlocked, rename(unlocked));
    assert.equal(saved.companions.dog.name, 'First saved edit');
    assert.equal(saved.companions.dog.special.mind, 3);
    assert.deepEqual(unlocked.companions, {});
    assert.throws(
        () => rename(transitions.loadCharacter(character())),
        /Cannot update missing companion: dog/,
    );
    assert.throws(
        () => rename(transitions.loadCharacter(character({ perks: ['perkRobotWrangler'] }))),
        /Cannot update missing companion: dog/,
    );
});

test('Pure item mutations preserve stacking, configuration, grants and input arrays', () => {
    const manual = item('weaponMrHandyPliers', { quantity: 2 });
    const grant = { ...manual, quantity: 1, grantedBy: 'traitMrHandyPliers' };
    const modified = { ...manual, quantity: 1, mods: ['legendaryFreezing'] };
    const items = [manual, grant, modified];
    const snapshot = structuredClone(items);
    const added = inventory.applyAddItem(items, { ...manual, quantity: 3 });
    assert.deepEqual(added, [{ ...manual, quantity: 5 }, grant, modified]);
    const removed = inventory.applyRemoveItem(added, { ...manual, quantity: 4 });
    assert.deepEqual(removed, [{ ...manual, quantity: 1 }, grant, modified]);
    assert.deepEqual(
        inventory.applyRemoveItem([manual, { ...manual }], { ...manual, quantity: 3 }),
        [{ ...manual, quantity: 1 }],
    );
    assert.deepEqual(inventory.applyRemoveItem(items, { ...manual, quantity: 0 }), items);
    assert.deepEqual(items, snapshot);

    const custom = {
        customName: 'Souvenir',
        quantity: 2,
        COST: 3,
        WEIGHT: 1,
        RARITY: 0,
        CATEGORY: 'misc',
        TYPE: 'other',
    };
    assert.deepEqual(inventory.applyAddItem([custom], { ...custom, quantity: 1 }), [
        { ...custom, quantity: 3 },
    ]);
    assert.deepEqual(inventory.applyRemoveItem([custom], { ...custom, quantity: 1 }), [
        { ...custom, quantity: 1 },
    ]);
    assert.equal(custom.quantity, 2);
});

test('Currency updates preserve direction, partial amounts and no-currency operations', () => {
    const initial = { caps: 100, ncrDollars: 80, legionDenarius: 60, prewarMoney: 40 };
    const snapshot = { ...initial };
    assert.deepEqual(inventory.getCurrencyUpdate(initial, { caps: 10, ncrDollars: 2 }, -1), {
        caps: 90,
        ncrDollars: 78,
        legionDenarius: 60,
        prewarMoney: 40,
    });
    assert.deepEqual(
        inventory.getCurrencyUpdate(initial, { legionDenarius: 3, prewarMoney: 4 }, 1),
        {
            caps: 100,
            ncrDollars: 80,
            legionDenarius: 63,
            prewarMoney: 44,
        },
    );
    assert.deepEqual(inventory.getCurrencyUpdate(initial, undefined, -1), {});
    assert.deepEqual(initial, snapshot);
});

test('Typed feat helpers preserve ranks and membership without runtime module dependencies', async () => {
    const helpers = await server.ssrLoadModule('/src/features/character/feats/utils.ts');
    const perks = Object.freeze(['perkIronFist', 'perkIronFist', 'perkStrongBack']);
    assert.equal(helpers.perkRank(perks, 'perkIronFist'), 2);
    assert.equal(helpers.perkRank(perks, 'perkLifeGiver'), 0);
    assert.equal(helpers.hasPerk(perks, 'perkStrongBack'), true);
    assert.equal(helpers.hasTrait(['traitMrHandyPliers'], 'traitMrHandyPliers'), true);
    assert.equal(helpers.hasTrait([], 'traitMrHandyPliers'), false);
    const transformed = await server.transformRequest('/src/features/character/feats/utils.ts', {
        ssr: true,
    });
    assert.doesNotMatch(transformed.code, /__vite_ssr_import__\(/);
});

test('Virtual attacks use modified handedness, remain nonpersistent and add no physical weight', () => {
    const raw = transitions.loadCharacter(
        character({
            origin: 'survivor',
            items: [
                item('weaponHandmadePistol', { quantity: 2, mods: ['modFullStock'] }),
                item('weaponDoubleBarrelShotgun', { quantity: 3, mods: ['modSawedOffBarrel'] }),
            ],
        }),
    );
    const snapshot = structuredClone(raw);
    const view = calculate(raw);
    assert.equal(view.items.find(i => i.id === 'weaponWeaponStock').quantity, 2);
    assert.equal(view.items.find(i => i.id === 'weaponWeaponStockOneHanded').quantity, 3);
    assert.equal(view.items.filter(i => i.id === 'weaponUnarmedStrike').length, 1);
    const weight = raw.items.reduce(
        (total, i) => total + inventory.getModifiedItemData(i).WEIGHT * i.quantity,
        0,
    );
    assert.equal(view.currentWeight, weight);
    assert.deepEqual(calculate(raw), view);
    assert.deepEqual(raw, snapshot);
    const updated = transitions.applyUpdate(raw, { currentLuck: 2 });
    assert.deepEqual(updated.items, raw.items);
});

test('Bayonets and shredders are projected from active weapons only', () => {
    const raw = character({
        origin: 'survivor',
        items: [
            item('weaponCombatRifle', { quantity: 2, mods: ['modBayonet'] }),
            item('weaponCombatRifle', { mods: ['modMissileLauncherBayonet'] }),
            item('weaponCombatRifle', { quantity: 3, mods: ['modShredder'] }),
            item('weaponCombatRifle', {
                quantity: 9,
                mods: ['modBayonet'],
                grantedBy: 'inactiveFeat',
            }),
        ],
    });
    const view = calculate(raw);
    assert.equal(view.items.find(i => i.id === 'weaponBayonet').quantity, 2);
    assert.equal(view.items.find(i => i.id === 'weaponMissileLauncherBayonet').quantity, 1);
    assert.equal(view.items.find(i => i.id === 'weaponShredder').quantity, 3);
    assert.ok(
        !raw.items.some(i =>
            ['weaponBayonet', 'weaponMissileLauncherBayonet', 'weaponShredder'].includes(i.id),
        ),
    );
});

test('Damage bonuses use prepared qualities while preserving instance and sneak checks', () => {
    const knife = item('weaponCombatKnife');
    const gladiator = calculate(
        character({ origin: 'survivor', perks: ['perkGladiator', 'perkGladiator'] }),
    );
    const knifeData = inventory.getModifiedItemData(knife, gladiator.perks);
    assert.equal(feats.getDamageRatingBonus(gladiator, knife, knifeData), 2);
    assert.equal(
        feats.getDamageRatingBonus(gladiator, knife, {
            ...knifeData,
            QUALITIES: ['qualityTwoHanded'],
        }),
        0,
    );

    const laser = item('weaponLaserPistol');
    const commander = calculate(character({ origin: 'survivor', perks: ['perkLaserCommander'] }));
    assert.equal(
        feats.getDamageRatingBonus(
            commander,
            laser,
            inventory.getModifiedItemData(laser, commander.perks),
        ),
        1,
    );

    const sandman = calculate(
        character({
            origin: 'survivor',
            perks: ['perkMisterSandman'],
            special: { ...character().special, agility: 9 },
        }),
    );
    const suppressed = item('weaponHandmadePistol', { mods: ['modSuppressor'] });
    const prepared = inventory.getModifiedItemData(suppressed, sandman.perks);
    assert.equal(feats.getDamageRatingBonus(sandman, suppressed, prepared, true), 2);
    assert.equal(feats.getDamageRatingBonus(sandman, suppressed, prepared, false), 0);
    assert.equal(feats.getDamageRatingBonus(sandman, item(suppressed.id), prepared, true), 0);

    const grunt = calculate(character({ origin: 'survivor', traits: ['traitGrunt'] }));
    assert.equal(feats.getDamageRatingBonus(grunt, knife, knifeData), 1);
    assert.equal(inventory.getSkillForWeaponCategory('bows'), 'athletics');
    assert.equal(inventory.getSpecialForWeaponCategory('bows'), 'agility');
    assert.equal(inventory.getSpecialForWeaponCategory('smallGuns'), 'agility');
});

test('Registry discovers moved modules once, in family order, without losing ranks', () => {
    const names = family =>
        readdirSync(`${root}src/features/character/feats/${family}`)
            .filter(name =>
                new RegExp(`^${family === 'perks' ? 'perk' : 'trait'}.*\\.ts$`).test(name),
            )
            .map(name => name.slice(0, -3));
    const perks = names('perks'),
        traits = names('traits');
    const origin = origins.getOriginById('survivor');
    const active = registry.getActiveFeats({
        origin,
        perks: [...perks, ...perks],
        traits: [...traits, ...traits],
    });
    assert.deepEqual(
        active.map(feat => feat.id),
        [origin.id, ...perks, ...traits],
    );
    for (const id of ['perkMysteriousStranger', 'traitMotherWasteland', 'traitRiteOfPassage']) {
        assert.equal(active.filter(feat => feat.id === id).length, 1);
    }
    const raw = character({ origin: 'survivor', perks: ['perkLifeGiver', 'perkLifeGiver'] });
    assert.equal(
        calculate(raw).maxHp - calculate({ ...raw, perks: [] }).maxHp,
        raw.special.endurance * 2,
    );
});

test('Manual actions come from effective registered feats, not raw selections', () => {
    const raw = character({
        origin: 'tribal',
        perks: ['perkMysteriousStranger'],
        traits: ['traitMotherWasteland', 'traitRiteOfPassage'],
    });
    const snapshot = structuredClone(raw);
    assert.deepEqual(
        feats.getManualActions(calculate(raw)),
        new Map([
            ['perkMysteriousStranger', {
                type: 'skillRoll',
                label: 'summonStranger',
                skillId: 'smallGuns',
                usingItem: item('weaponFortyFourPistol', {
                    equipped: true, mods: ['modMarksmanGrip', 'modPowerful'],
                }),
                roller: 'mysteriousStranger',
                requiredLuck: 1,
            }],
            ['traitMotherWasteland', {
                type: 'confirm',
                label: 'traitMotherWasteland',
                message: 'traitMotherWastelandBenefit',
                luckCost: 1,
            }],
            ['traitRiteOfPassage', {
                type: 'combatDice',
                label: 'traitRiteOfPassage',
                diceCount: 1,
                description: 'traitRiteOfPassageBenefit',
                luckOnEffect: 1,
            }],
        ]),
    );
    assert.deepEqual(raw, snapshot);
    assert.equal(feats.getManualActions(calculate(character({ origin: 'tribal' }))).size, 0);
    assert.equal(feats.getManualActions(calculate({
        ...raw, origin: 'survivor', special: { ...raw.special, luck: 6 },
    })).size, 0, 'Invalid perk prerequisites and traits from another origin must not grant actions');
});

test('Registered stranger profile preserves the previous schema-derived combat stats', async () => {
    const { MYSTERIOUS_STRANGER, MYSTERIOUS_44_MAGNUM } = await server.ssrLoadModule(
        '/src/features/character/feats/perks/perkMysteriousStranger.ts',
    );
    const weapon = item('weaponFortyFourPistol', {
        equipped: true, mods: ['modMarksmanGrip', 'modPowerful'],
    });
    const previous = schema.RawCharacterSchema.parse({
        name: 'Mysterious Stranger',
        special: { agility: 10 },
        skills: { smallGuns: 6 },
        specialties: ['smallGuns'],
        items: [weapon],
        maxHp: 9999,
    });
    assert.deepEqual(MYSTERIOUS_44_MAGNUM, weapon);
    assert.deepEqual(MYSTERIOUS_STRANGER, Object.fromEntries(
        ['special', 'skills', 'specialties', 'traits', 'items'].map(key => [key, previous[key]]),
    ));
});

const ammoFixture = () =>
    character({
        origin: 'survivor',
        items: [
            item('ammo10mm', { quantity: 3, customName: 'First stack' }),
            item('ammo10mm', { quantity: 4, customName: 'Second stack' }),
            item('ammo10mm', {
                quantity: 20,
                customName: 'Inactive ammo',
                grantedBy: 'inactiveFeat',
            }),
            item('weaponMrHandyPliers', {
                grantedBy: 'traitMrHandyPliers',
                mods: ['legendaryFreezing'],
                customName: 'Hidden arm',
            }),
            item('weaponTenMillimeterPistol'),
        ],
        currentLuck: 8,
    });

test('Ammo spending consumes one total across stacks and preserves hidden data', () => {
    const raw = ammoFixture();
    const usingItem = item('weaponTenMillimeterPistol');
    const weapon = inventory.getModifiedItemData(usingItem);
    assert.equal(weapon.AMMO_TYPE, 'ammo10mm');
    const snapshot = structuredClone(raw);
    const spent = inventory.consumeAmmo(raw, weapon, 5, usingItem);
    assert.equal(
        spent
            .filter(i => i.id === weapon.AMMO_TYPE && !i.grantedBy)
            .reduce((sum, i) => sum + i.quantity, 0),
        2,
    );
    assert.equal(spent.find(i => i.customName === 'Second stack').quantity, 2);
    assert.deepEqual(
        spent.filter(i => i.grantedBy),
        raw.items.filter(i => i.grantedBy),
    );
    assert.deepEqual(raw, snapshot);
    assert.throws(() => inventory.consumeAmmo(raw, weapon, 8, usingItem), /Not enough ammunition/);
    for (const invalid of [-1, 1.5, Infinity, NaN]) {
        assert.throws(
            () => inventory.consumeAmmo(raw, weapon, invalid, usingItem),
            /nonnegative integer/,
        );
    }
    assert.equal(inventory.getWeaponAmmoCount(weapon, calculate(raw), usingItem), 7);
});

test('No-ammo, self-ammo and zero-cost attacks preserve the correct raw inventory', () => {
    const raw = ammoFixture();
    const usingItem = item('weaponTenMillimeterPistol');
    const weapon = inventory.getModifiedItemData(usingItem);
    assert.equal(inventory.consumeAmmo(raw, weapon, 0, usingItem), raw.items);
    assert.equal(
        inventory.consumeAmmo(raw, { ...weapon, AMMO_TYPE: 'na' }, 99, usingItem),
        raw.items,
    );
    assert.equal(
        inventory.getWeaponAmmoCount({ ...weapon, AMMO_TYPE: 'na' }, calculate(raw), usingItem),
        Infinity,
    );
    assert.equal(inventory.getWeaponAmmoPerShot({ ...weapon, AMMO_TYPE: 'na' }), 0);
    assert.equal(inventory.getWeaponAmmoPerShot({ ...weapon, QUALITIES: ['qualityGatling'] }), 10);
    assert.equal(
        inventory.getWeaponAmmoPerShot({ ...weapon, QUALITIES: ['qualityAmmoHungry:3'] }),
        3,
    );
    assert.ok(inventory.hasEnoughAmmo(weapon, calculate(raw), usingItem));
    assert.ok(!inventory.hasEnoughAmmo(weapon, calculate({ ...raw, items: [] }), usingItem));
    const selfWeapon = Object.values(data.weapon).find(w => w.AMMO_TYPE === 'self');
    assert.ok(selfWeapon);
    const selfItem = item(selfWeapon.ID, { quantity: 3 });
    const self = { ...raw, items: [...raw.items, selfItem] };
    const next = inventory.consumeAmmo(self, selfWeapon, 1, selfItem);
    assert.equal(next.find(i => i.id === selfWeapon.ID).quantity, 2);
    assert.deepEqual(
        next.filter(i => i.id !== selfWeapon.ID),
        raw.items,
    );
});

test('Consecutive ammo and luck updates use latest raw state and never persist virtual attacks', () => {
    const saves = store.useSaveStore;
    saves.getState().importSlot(6, ammoFixture());
    saves.getState().setActiveSlot(6);
    const usingItem = item('weaponTenMillimeterPistol');
    const weapon = inventory.getModifiedItemData(usingItem);
    for (const amount of [1, 2, 3]) {
        saves.getState().updateActiveCharacter(prev => ({
            items: inventory.consumeAmmo(prev, weapon, amount, usingItem),
            currentLuck: calculate(prev).currentLuck - 1,
        }));
    }
    const raw = saves.getState().slots[6];
    assert.equal(
        raw.items
            .filter(i => i.id === 'ammo10mm' && !i.grantedBy)
            .reduce((sum, i) => sum + i.quantity, 0),
        1,
    );
    assert.equal(raw.currentLuck, 5);
    assert.deepEqual(
        raw.items.filter(i => i.grantedBy),
        ammoFixture().items.filter(i => i.grantedBy),
    );
    assert.ok(
        !raw.items.some(i => ['weaponUnarmedStrike', 'weaponWeaponStockOneHanded'].includes(i.id)),
    );
    const persisted = JSON.parse(storage.get('PB3K_character_saves')).state.slots[6];
    assert.deepEqual(persisted.items, JSON.parse(JSON.stringify(raw.items)));
});

test('Self-ammo counts and consumes only the selected configuration across parsed updates', () => {
    const selected = item('weaponAtomicMine', { customName: 'Selected mine' });
    const other = item(selected.id, { customName: 'Other mine', quantity: 2 });
    const modified = { ...selected, mods: ['legendaryFreezing'], quantity: 3 };
    const hidden = { ...selected, grantedBy: 'inactiveFeat', quantity: 4 };
    const raw = character({ origin: 'survivor', items: [other, modified, hidden, selected] });
    const weapon = inventory.getModifiedItemData(selected);
    const snapshot = structuredClone(raw);
    assert.equal(inventory.getWeaponAmmoCount(weapon, calculate(raw), selected), 1);
    const remaining = inventory.consumeAmmo(raw, weapon, 1, selected);
    assert.deepEqual(remaining, raw.items.slice(0, 3));
    assert.deepEqual(raw, snapshot);
    const after = transitions.applyUpdate(raw, { items: remaining });
    assert.equal(inventory.getWeaponAmmoCount(weapon, calculate(after), selected), 0);
    assert.ok(!inventory.hasEnoughAmmo(weapon, calculate(after), selected));
    assert.throws(() => inventory.consumeAmmo(after, weapon, 1, selected), /Not enough ammunition/);
});

test('Mr. Handy excludes perk and trait carry modifiers but retains equipment bonuses', async () => {
    const perks = ['perkStrongBack', 'perkStrongBack'];
    const human = character({ origin: 'survivor', perks });
    assert.equal(calculate(human).maxWeight, 140);
    const robot = transitions.loadCharacter(character({ perks }));
    assert.equal(calculate(robot).maxWeight, 75);
    const body = robot.items.find(i => i.id === 'robotPartBody');
    assert.ok(body);
    const modified = transitions.applyUpdate(robot, {
        items: robot.items.map(i =>
            i === body ? { ...i, mods: [...i.mods, 'modRobotFactoryStorageBody'] } : i,
        ),
    });
    assert.equal(calculate(modified).maxWeight, 85);
    assert.equal(
        calculate(transitions.applyUpdate(modified, { special: { strength: 9 } })).maxWeight,
        85,
    );
    const weight = await server.ssrLoadModule('/src/features/character/weight.ts');
    assert.equal(
        weight.calculateMaxWeight(modified, origins.getOriginById('mrHandy'), perks, [
            'traitSmallFrame',
        ]),
        85,
    );
});
