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
    migrations,
    registry,
    calculatePerks,
    perksModule,
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
    inventory = {
        ...(await load('features/character/inventory/inventory.ts')),
        ...(await load('features/character/inventory/equipment.ts')),
        ...(await load('features/character/inventory/currency.ts')),
    };
    utils = await load('features/item/utils.ts');
    feats = await load('features/character/feats/rules.ts');
    store = await load('hooks/useSaveStore.ts');
    origins = await load('features/character/origins/registry.ts');
    ({ calculateCharacter: calculate } = await load(
        'features/character/calculations/characterCalculations.ts',
    ));
    transitions = await load('features/character/state/characterState.ts');
    data = await load('data/index.ts');
    migrations = await load('features/character/state/saveMigrations.ts');
    registry = await load('features/character/feats/registry.ts');
    perksModule = await load('features/character/feats/perks.ts');
    ({ calculatePerks } = perksModule);
    ({ calculateTraits } = await load('features/character/feats/traits.ts'));
});
after(async () => {
    await server?.close();
});

const item = (id, extra = {}) => ({ id, quantity: 1, equipped: false, mods: [], ...extra });

// Mr Handy arm traits: the pre-v2 standalone weapon and what the trait grants since v2.
const MR_HANDY_ARMS = {
    CircularSaw: { legacyId: 'weaponMrHandyCircularSaw', id: 'weaponBuzzSawArm', mods: [] },
    Flamethrower: {
        legacyId: 'weaponMrHandyFlamethrower',
        id: 'weaponFlamer',
        mods: ['modMrHandyArm'],
    },
    Pliers: { legacyId: 'weaponMrHandyPliers', id: 'weaponPincerArm', mods: [] },
    AutomaticPistol: {
        legacyId: 'weaponMrHandyAutomaticPistol',
        id: 'weapon10mmPistol',
        mods: ['modAutomatic', 'modMrHandyArm'],
    },
    LaserEmitter: {
        legacyId: 'weaponMrHandyLaserEmitter',
        id: 'weaponLaserGun',
        mods: ['modMrHandyArm'],
    },
};
const character = (extra = {}) =>
    schema.RawCharacterSchema.parse({
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

test('item effects apply sets, then adds, then removals', () => {
    const base = structuredClone(data.allItems.weaponAlienBlaster);
    const weapon = {
        ...base,
        EFFECTS: [...base.EFFECTS],
        QUALITIES: [...base.QUALITIES],
    };

    utils.applyEffect(weapon, 'damageAdd:2');
    utils.applyEffect(weapon, 'damageSet:3');
    assert.equal(weapon.DAMAGE_RATING, 3);

    const modified = utils.getModdedItemData(
        item('weaponAlienBlaster', {
            mods: ['modFusionMagAlienBlaster', 'modPowerful'],
        }),
    );
    assert.equal(modified.DAMAGE_RATING, 5);

    const qualities = structuredClone(data.allItems.weaponAlienBlaster);
    qualities.QUALITIES = [...qualities.QUALITIES, 'qualityInaccurate'];
    qualities.EFFECTS = [...qualities.EFFECTS];
    utils.applyEffect(qualities, 'qualityAdd:qualityAccurate');
    utils.applyEffect(qualities, 'qualityRemove:qualityAccurate');
    assert.ok(!qualities.QUALITIES.includes('qualityAccurate'));
});

test('contradictory weapon qualities cancel after all effects are applied', () => {
    const weapon = structuredClone(data.allItems.weaponAlienBlaster);
    weapon.EFFECTS = [...weapon.EFFECTS];
    weapon.QUALITIES = ['qualityReliable'];

    utils.applyEffect(weapon, 'qualityAdd:qualityUnreliable');
    assert.deepEqual(weapon.QUALITIES, ['qualityReliable', 'qualityUnreliable']);
    utils.normalizeWeaponQualities(weapon);
    assert.deepEqual(weapon.QUALITIES, []);

    utils.applyEffect(weapon, 'qualityAdd:qualityAccurate');
    utils.applyEffect(weapon, 'qualityAdd:qualityInaccurate');
    utils.applyEffect(weapon, 'qualityAdd:qualityAccurate');
    utils.normalizeWeaponQualities(weapon);
    assert.deepEqual(weapon.QUALITIES, ['qualityAccurate']);

    const modified = utils.getModdedItemData(item('weaponPipeGun', { mods: ['modQuickMagazine'] }));
    assert.ok(!modified.QUALITIES.includes('qualityReliable'));
    assert.ok(!modified.QUALITIES.includes('qualityUnreliable'));
});

test('Gen 3 Synths can use standard armor and retain an unarmed attack', () => {
    const origin = origins.getOriginById('synth');
    const selection = { origin, perks: [], traits: [] };

    assert.equal(origin.isRobot, false);
    assert.equal(inventory.canEquipApparel(data.apparel.armorLeatherChestPiece, selection), true);
    assert.equal(inventory.canEquipApparel(data.apparel.robotPartBody, selection), false);

    const projected = inventory.getInventory(
        [item('armorLeatherChestPiece', { equipped: true })],
        selection,
    );
    assert.equal(
        projected.displayItems.some(item => item.id === 'weaponUnarmedStrike'),
        true,
    );
});

test('Gen 3 Synths receive More Than Human fixed traits', () => {
    const raw = character({ origin: 'synth' });
    const origin = origins.getOriginById('synth');
    const traits = calculateTraits(raw, origin);

    assert.deepEqual(
        traits.filter(trait => trait.startsWith('traitMoreThanHuman_')),
        [
            'traitMoreThanHuman_immunities',
            'traitMoreThanHuman_physiology',
            'traitMoreThanHuman_recallCode',
            'traitMoreThanHuman_socialConsequences',
            'traitMoreThanHuman_tagSkill',
        ],
    );
    assert.equal(feats.hasRadiationImmunity([], traits, origin), true);
    assert.equal(feats.hasPoisonImmunity([], traits, origin), true);
});

test('Nightkin can equip only super mutant armor', () => {
    const origin = origins.getOriginById('nightkin');
    const traits = calculateTraits(character({ origin: 'nightkin' }), origin);
    const selection = { origin, perks: [], traits };

    assert.deepEqual(
        traits.filter(trait => trait.startsWith('traitStealthBoyAddict_')),
        [
            'traitStealthBoyAddict_addiction',
            'traitStealthBoyAddict_immunity',
            'traitStealthBoyAddict_physiology',
            'traitStealthBoyAddict_skillLimit',
            'traitStealthBoyAddict_special',
        ],
    );
    assert.equal(feats.getMinSpecialValueModifier('strength', [], traits, origin), 2);
    assert.equal(feats.getMaxSpecialValueModifier('strength', [], traits, origin), 2);
    assert.equal(feats.getMaxSpecialValueModifier('intelligence', [], traits, origin), -2);
    assert.equal(feats.getSkillMaxValue([], traits, origin), 4);
    assert.equal(feats.hasRadiationImmunity([], traits, origin), true);
    assert.equal(feats.hasPoisonImmunity([], traits, origin), true);
    assert.equal(inventory.canEquipApparel(data.apparel.armorRaiderChestPiece, selection), true);
    assert.equal(inventory.canEquipApparel(data.apparel.armorLeatherChestPiece, selection), false);
});
const legacyCharacter = extra => character(extra);
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

test('Wanderers underarmor linings preserve recipe data and apply only to the Underarmor Suit', () => {
    const recipes = [
        ['modTreatedUnderarmorLining', 1, 2, 1, 9, 2, 'Common', []],
        ['modResistantUnderarmorLining', 2, 2, 1, 15, 3, 'Uncommon', ['perkArmorer:1']],
        ['modProtectiveUnderarmorLining', 2, 2, 1, 24, 3, 'Uncommon', ['perkArmorer:1']],
        ['modShieldedUnderarmorLining', 3, 3, 1, 36, 4, 'Uncommon', ['perkArmorer:2']],
    ];
    for (const id of ['armorUnderarmorSuit']) {
        const base = data.allItems[id];
        assert.deepEqual(
            base.AVAILABLE_MODS,
            recipes.map(([modId]) => modId),
        );
        for (const [
            modId,
            physical,
            energy,
            radiation,
            cost,
            complexity,
            rarity,
            perks,
        ] of recipes) {
            const mod = data.allItems[modId];
            assert.equal(mod.CATEGORY, 'modSlotUnderarmorLining');
            assert.equal(mod.SKILL, 'repair');
            assert.equal(mod.RARITY, complexity);
            assert.equal(mod.RARITY_TO_FIND, rarity);
            assert.deepEqual(mod.PERKS, perks);
            const modified = utils.getModdedItemData(item(id, { mods: [modId] }));
            assert.equal(modified.PHYSICAL_RES, base.PHYSICAL_RES + physical);
            assert.equal(modified.ENERGY_RES, base.ENERGY_RES + energy);
            assert.equal(modified.RADIATION_RES, base.RADIATION_RES + radiation);
            assert.equal(modified.COST, base.COST + cost);
            assert.equal(modified.WEIGHT, base.WEIGHT);
        }
    }
    assert.ok(
        !data.allItems.armorVaultJumpsuit.AVAILABLE_MODS.some(id => id.startsWith('modUnderarmor')),
    );
    // The Wanderers manual gives linings to the Underarmor Suit only, not to the Marine Wetsuit.
    assert.deepEqual(data.allItems.armorMarineWetsuit.AVAILABLE_MODS, []);
});

test('Underarmor protective linings replace one shared reroll use with two, without stacking', () => {
    const baseEffect = 'effectUnderarmorReroll';
    const upgradedEffect = 'effectUnderarmorRerollTwice';
    for (const id of ['armorUnderarmorSuit']) {
        for (const modId of ['modProtectiveUnderarmorLining', 'modShieldedUnderarmorLining']) {
            const modified = utils.getModdedItemData(item(id, { mods: [modId] }));
            assert.ok(!modified.EFFECTS.includes(baseEffect));
            assert.deepEqual(
                modified.EFFECTS.filter(effect => effect === upgradedEffect),
                [upgradedEffect],
            );
        }
    }
    for (const mods of [[], ['modTreatedUnderarmorLining'], ['modResistantUnderarmorLining']]) {
        const modified = utils.getModdedItemData(item('armorUnderarmorSuit', { mods }));
        assert.ok(modified.EFFECTS.includes(baseEffect));
        assert.ok(!modified.EFFECTS.includes(upgradedEffect));
    }
    assert.deepEqual(data.allItems.armorUnderarmorSuit.EFFECTS, [baseEffect]);
});

test('Marine materials apply to helmet and limbs and only double torso weight and cost', () => {
    const recipes = [
        ['modWeldedMarineArmor', 1, 0.5, 10, 2, 'Common', []],
        ['modTemperedMarineArmor', 2, 1, 30, 3, 'Uncommon', ['perkArmorer:1']],
        ['modHardenedMarineArmor', 3, 1, 50, 4, 'Uncommon', ['perkArmorer:1']],
        ['modButtressedMarineArmor', 4, 1.5, 75, 5, 'Uncommon', ['perkArmorer:2']],
    ];
    for (const id of [
        'armorMarineChestPiece',
        'armorMarineArm',
        'armorMarineLeg',
        'armorMarineHelmet',
    ]) {
        const base = data.allItems[id];
        const multiplier = id === 'armorMarineChestPiece' ? 2 : 1;
        assert.deepEqual(
            base.AVAILABLE_MODS,
            recipes.map(([modId]) => modId),
        );
        for (const [modId, resistance, weight, cost, complexity, rarity, perks] of recipes) {
            const mod = data.allItems[modId];
            assert.equal(mod.CATEGORY, 'modSlotMaterial');
            assert.equal(mod.SKILL, 'repair');
            assert.equal(mod.RARITY, complexity);
            assert.equal(mod.RARITY_TO_FIND, rarity);
            assert.deepEqual(mod.PERKS, perks);
            const modified = utils.getModdedItemData(item(id, { mods: [modId] }));
            assert.equal(modified.PHYSICAL_RES, base.PHYSICAL_RES + resistance);
            assert.equal(modified.ENERGY_RES, base.ENERGY_RES + resistance);
            assert.equal(modified.RADIATION_RES, base.RADIATION_RES + resistance);
            assert.equal(modified.COST, base.COST + cost * multiplier);
            assert.equal(modified.WEIGHT, base.WEIGHT + weight * multiplier);
        }
    }
});

test('Legion materials apply to every Legion piece with the standard torso multiplier', () => {
    const recipes = [
        ['modReinforcedLegionArmor', 1, 0, 6, 3, 'Common', []],
        ['modShadowedLegionArmor', 2, 0.5, 48, 5, 'Uncommon', ['perkArmorer:1']],
        ['modTreatedLegionArmor', 3, 0.5, 15, 4, 'Uncommon', ['perkArmorer:1']],
        ['modStuddedLegionArmor', 4, 1, 30, 6, 'Uncommon', ['perkArmorer:1']],
    ];
    const ids = [
        'armorLegionaryRecruitChestPiece',
        'armorLegionaryRecruitArm',
        'armorLegionaryRecruitLeg',
        'armorLegionaryRecruitHelmet',
        'armorLegionaryChestPiece',
        'armorLegionaryArm',
        'armorLegionaryLeg',
        'armorLegionaryHelmet',
        'armorLegionaryCenturionChestPiece',
        'armorLegionaryCenturionArm',
        'armorLegionaryCenturionLeg',
        'armorLegionaryCenturionHelmet',
        'armorLegatusHelmet',
    ];
    for (const id of ids) {
        const base = data.allItems[id];
        const multiplier = base.LOCATIONS_COVERED.includes('torso') ? 2 : 1;
        assert.deepEqual(
            base.AVAILABLE_MODS,
            recipes.map(([modId]) => modId),
        );
        for (const [modId, resistance, weight, cost, complexity, rarity, perks] of recipes) {
            const mod = data.allItems[modId];
            assert.equal(mod.CATEGORY, 'modSlotMaterial');
            assert.equal(mod.SKILL, 'repair');
            assert.equal(mod.RARITY, complexity);
            assert.equal(mod.RARITY_TO_FIND, rarity);
            assert.deepEqual(mod.PERKS, perks);
            const modified = utils.getModdedItemData(item(id, { mods: [modId] }));
            assert.equal(modified.PHYSICAL_RES, base.PHYSICAL_RES + resistance);
            assert.equal(modified.ENERGY_RES, base.ENERGY_RES + resistance);
            assert.equal(modified.RADIATION_RES, base.RADIATION_RES);
            assert.equal(modified.COST, base.COST + cost * multiplier);
            assert.equal(modified.WEIGHT, base.WEIGHT + weight * multiplier);
        }
    }
});

test('Wood armor accepts Shrouded with torso weight and cost multiplier', () => {
    const recipes = [
        ['armorWoodArmorChestPiece', 2, 25, 2],
        ['armorWoodArmorArm', 1, 10, 1],
        ['armorWoodArmorLeg', 1, 10, 1],
        ['armorWoodArmorHelmet', 1, 10, 1],
    ];
    const mod = data.allItems.modShroudedWoodArmor;
    assert.equal(mod.SKILL, 'survival');
    assert.deepEqual(mod.PERKS, ['perkArmorer:1']);
    assert.equal(mod.RARITY, 3);
    assert.equal(mod.RARITY_TO_FIND, 'Rare');
    for (const [id, baseWeight, baseCost, multiplier] of recipes) {
        const base = data.allItems[id];
        assert.deepEqual(base.AVAILABLE_MODS, ['modShroudedWoodArmor']);
        const modified = utils.getModdedItemData(item(id, { mods: ['modShroudedWoodArmor'] }));
        assert.equal(modified.PHYSICAL_RES, base.PHYSICAL_RES);
        assert.equal(modified.ENERGY_RES, base.ENERGY_RES);
        assert.equal(modified.RADIATION_RES, base.RADIATION_RES);
        assert.equal(modified.WEIGHT, baseWeight - 0.5 * multiplier);
        assert.equal(modified.COST, baseCost + 10 * multiplier);
    }
    assert.ok(data.allItems.armorWoodArmorChestPiece.EFFECTS.includes('effectShadowed') === false);
    assert.ok(
        utils
            .getModdedItemData(item('armorWoodArmorChestPiece', { mods: ['modShroudedWoodArmor'] }))
            .EFFECTS.includes('effectShadowed'),
    );
});

test('Brotherhood bomber jacket accepts all ballistic weave ranks (Wanderers p. 86)', () => {
    const id = 'armorBrotherhoodBomberJacket';
    const jacket = data.allItems[id];
    const mods = [
        'modBallisticWeave',
        'modBallisticWeaveMk2',
        'modBallisticWeaveMk3',
        'modBallisticWeaveMk4',
        'modBallisticWeaveMk5',
    ];
    assert.deepEqual(jacket.AVAILABLE_MODS, mods);
    for (const [index, modId] of mods.entries()) {
        const modified = utils.getModdedItemData(item(id, { mods: [modId] }));
        assert.equal(modified.PHYSICAL_RES, jacket.PHYSICAL_RES + index + 2);
        assert.equal(modified.ENERGY_RES, jacket.ENERGY_RES + index + 2);
        assert.equal(modified.RADIATION_RES, jacket.RADIATION_RES);
    }
});

for (const suffix of ['CircularSaw', 'Flamethrower', 'Pliers', 'AutomaticPistol', 'LaserEmitter']) {
    test(`Mr. Handy ${suffix}: grant, hide, restore configuration without duplicating`, () => {
        const { id, mods } = MR_HANDY_ARMS[suffix],
            trait = `traitMrHandy${suffix}`;
        let raw = reconcile(character({ traits: [trait] }));
        assert.equal(granted(raw, id).grantedBy, trait);
        assert.deepEqual(granted(raw, id).mods, mods);
        raw = {
            ...raw,
            items: raw.items.map(i =>
                i.id === id
                    ? { ...i, mods: [...i.mods, 'legendaryFreezing'], customName: 'Customized arm' }
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
            item('weapon10mmPistol', {
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

const unarmedDamage = (raw, id) => {
    const view = calculate(raw);
    const attack = view.items.find(i => i.id === id);
    return inventory.getModifiedItemData(attack, view.perks);
};

test('Iron Fist boosts every unarmed attack and grants no item', () => {
    const base = character({
        origin: 'survivor',
        items: [
            item('weaponUnarmedStrike', { customName: 'Original attack' }),
            item('weaponPowerFist'),
            item('weaponKnuckles'),
            item('weaponBaseballBat'),
        ],
    });
    for (const rank of [0, 1, 2]) {
        const raw = reconcile({ ...base, perks: Array(rank).fill('perkIronFist') });
        assert.deepEqual(raw.items, base.items, 'Iron Fist adds nothing to the save');
        for (const id of ['weaponUnarmedStrike', 'weaponPowerFist', 'weaponKnuckles']) {
            const modded = unarmedDamage(raw, id);
            assert.equal(
                modded.DAMAGE_RATING,
                data.weapon[id].DAMAGE_RATING + (rank > 0 ? 1 : 0),
                id,
            );
            assert.equal(
                modded.EFFECTS.includes('effectVicious'),
                rank >= 2 || data.weapon[id].EFFECTS.includes('effectVicious'),
                id,
            );
        }
        assert.equal(
            unarmedDamage(raw, 'weaponBaseballBat').DAMAGE_RATING,
            data.weapon.weaponBaseballBat.DAMAGE_RATING,
            'melee weapons are not unarmed attacks',
        );
    }
    // The implicit unarmed strike is boosted too, and stays the Unarmed Strike.
    const bare = reconcile(character({ origin: 'survivor', perks: ['perkIronFist'] }));
    assert.equal(
        unarmedDamage(bare, 'weaponUnarmedStrike').DAMAGE_RATING,
        data.weapon.weaponUnarmedStrike.DAMAGE_RATING + 1,
    );
});

test('Iron Fist boosts every Mr Handy Pincer, which stays its own item', () => {
    const raw = reconcile(
        character({
            traits: ['traitMrHandyPliers', 'traitMrHandyPliers'],
            perks: ['perkIronFist'],
        }),
    );
    const pincers = calculate(raw).items.filter(i => i.id === 'weaponPincerArm');
    assert.equal(pincers.length, 2);
    for (const pincer of pincers) {
        assert.equal(
            inventory.getModifiedItemData(pincer, ['perkIronFist']).DAMAGE_RATING,
            data.weapon.weaponPincerArm.DAMAGE_RATING + 1,
        );
    }
    assert.ok(
        !calculate(raw).items.some(i => i.id === 'weaponUnarmedStrike'),
        'robots have no strike',
    );
});

test('Saved Iron Fist weapons are dropped on load, also from companions', () => {
    const dog = {
        type: 'dog',
        special: { body: 5, mind: 1 },
        skills: { melee: 2, guns: 0, other: 1 },
        currentHp: 5,
        items: [item('weaponIronFist')],
    };
    const loaded = transitions.loadCharacter(
        character({
            origin: 'survivor',
            perks: ['perkIronFist'],
            companions: { dog },
            activeCompanionId: 'dog',
            items: [
                item('weaponIronFist', { grantedBy: 'perkIronFist', customName: 'My fist' }),
                item('weaponKnuckles'),
            ],
        }),
    );
    assert.deepEqual(
        loaded.items.map(i => i.id),
        ['weaponKnuckles'],
    );
    assert.deepEqual(loaded.companions.dog.items, []);
});

test('Changing origin hides grants without deleting configuration', () => {
    const robot = reconcile(character({ traits: ['traitMrHandyPliers'] }));
    const human = inventory.reconcileItems(robot, { ...robot, origin: 'survivor' });
    assert.ok(granted(human, 'weaponPincerArm'));
    assert.ok(
        !inventory
            .getInventory(human.items, {
                origin: origins.getOriginById('survivor'),
                perks: [],
                traits: [],
            })
            .items.some(i => i.id === 'weaponPincerArm'),
    );
});

test('Changing origin hides intrinsic robot parts without changing their saved configuration', () => {
    const robot = reconcile(
        character({
            items: [
                item('robotPartBody', {
                    equipped: true,
                    mods: ['modRobotStandardPlating', 'modRobotFactoryStorageArmorBody'],
                    customName: 'Saved robot body',
                }),
            ],
        }),
    );
    const snapshot = structuredClone(robot);
    const savedBody = robot.items.find(i => i.id === 'robotPartBody');
    let raw = robot;
    for (const origin of ['survivor', 'protectron', 'mrHandy', 'survivor', 'mrHandy']) {
        raw = transitions.applyUpdate(raw, { origin });
        assert.deepEqual(
            raw.items.find(i => i.id === savedBody.id),
            savedBody,
        );
        assert.equal(raw.items.filter(i => i.id === savedBody.id).length, 1);
        assert.equal(
            active(raw).some(i => i.id === savedBody.id),
            origin === 'mrHandy',
        );
        if (origin === 'survivor') {
            const withoutParts = calculate({ ...raw, items: [] });
            const hiddenParts = calculate(raw);
            assert.equal(hiddenParts.currentWeight, withoutParts.currentWeight);
            assert.equal(hiddenParts.maxWeight, withoutParts.maxWeight);
            assert.deepEqual(hiddenParts.locationsDR, withoutParts.locationsDR);
        }
    }
    assert.deepEqual(robot, snapshot);
});

test('Loading normalizes active robot parts but preserves inactive parts and existing duplicates', () => {
    const body = item('robotPartBody', {
        mods: ['modRobotStandardPlating', 'modRobotLockpickModule'],
        customName: 'Existing body',
    });
    const input = character({ items: [body], currentHp: 1 });
    const snapshot = structuredClone(input);
    const loaded = transitions.loadCharacter(input);
    assert.deepEqual(
        loaded.items.find(i => i.id === body.id),
        { ...body, equipped: true },
    );
    assert.equal(loaded.items.filter(i => i.id === body.id).length, 1);
    assert.equal(loaded.currentHp, 1);
    assert.deepEqual(transitions.loadCharacter(loaded), loaded);
    assert.deepEqual(input, snapshot);

    const hidden = transitions.loadCharacter({ ...input, origin: 'survivor' });
    assert.deepEqual(
        hidden.items.find(i => i.id === body.id),
        body,
    );
    const restored = transitions.applyUpdate(hidden, { origin: 'mrHandy' });
    assert.deepEqual(
        restored.items.find(i => i.id === body.id),
        { ...body, equipped: true },
    );

    const otherBody = { ...body, customName: 'Other saved configuration' };
    const duplicates = transitions.loadCharacter({ ...input, items: [body, otherBody] });
    assert.deepEqual(
        duplicates.items.filter(i => i.id === body.id),
        [body, otherBody].map(i => ({ ...i, equipped: true })),
    );
});

test('Changing origin unequips incompatible ordinary apparel while preserving its configuration', () => {
    const survivor = reconcile(
        character({
            origin: 'survivor',
            items: [
                item('armorLeatherChestPiece', {
                    equipped: true,
                    mods: ['modBoiledLeather'],
                    customName: 'Saved leather chest',
                }),
            ],
        }),
    );
    const changedToRobot = inventory.reconcileItems(survivor, {
        ...survivor,
        origin: 'mrHandy',
    });
    const savedApparel = changedToRobot.items.find(i => i.id === 'armorLeatherChestPiece');
    assert.deepEqual(savedApparel, {
        ...survivor.items[0],
        equipped: false,
    });
});

test("Manual items and grants do not merge or acquire each other's provenance", async () => {
    const { applyRemoveItem } = inventory;
    const manual = item('weaponBuzzSawArm');
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

test('Flash Hider save data migrates to Muzzle Break without changing item state', () => {
    const saved = character({
        items: [
            item('weaponPipeGun', {
                quantity: 2,
                equipped: true,
                customName: 'Old rifle',
                grantedBy: 'perkGunNut',
                mods: ['modFlashHider', 'modLongBarrel'],
            }),
            item('weaponPipeGun', { mods: ['modFlashHider', 'modMuzzleBreak'] }),
        ],
    });
    const migrated = transitions.loadCharacter(saved);
    assert.deepEqual(migrated.items[0], {
        ...saved.items[0],
        mods: ['modMuzzleBreak', 'modLongBarrel'],
    });
    assert.equal(migrated.items[1].mods.filter(mod => mod === 'modMuzzleBreak').length, 1);
    assert.equal(migrated.items[1].mods.includes('modFlashHider'), false);
    assert.equal(migrated.items[0].mods.includes('modFlashHider'), false);
    assert.deepEqual(transitions.loadCharacter(migrated), migrated);
    assert.deepEqual(saved.items[0].mods, ['modFlashHider', 'modLongBarrel']);
});

test('Saves preserve manual copies next to grants, including on import', () => {
    const migrated = transitions.loadCharacter(
        legacyCharacter({
            traits: ['traitMrHandyCircularSaw'],
            items: [],
        }),
    );
    const manual = item('weaponBuzzSawArm', { quantity: 2 });
    const updated = transitions.applyUpdate(migrated, {
        items: inventory.applyAddItem(migrated.items, manual),
    });
    const exported = JSON.parse(JSON.stringify(updated));
    const loaded = transitions.loadCharacter(exported);
    assert.deepEqual(loaded, updated);
    assert.deepEqual(
        loaded.items.find(i => i.id === manual.id && !i.grantedBy),
        manual,
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

test('Store normalizes imports, updates, serialization and rehydration without Context effects', async () => {
    const saves = store.useSaveStore;
    saves.getState().importSlot(1, character({ traits: ['traitMrHandyLaserEmitter'] }));
    saves.getState().setActiveSlot(1);
    let raw = saves.getState().slots[1];
    const laser = granted(raw, 'weaponLaserGun');
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

test('Unmet perk requirements remove their calculated effects', () => {
    const raw = reconcile(
        character({ origin: 'survivor', perks: ['perkIronFist', 'perkIronFist'] }),
    );
    const weak = reconcile({ ...raw, special: { ...raw.special, strength: 5 } });
    assert.deepEqual(calculate(weak).perks, []);
    assert.equal(
        unarmedDamage(weak, 'weaponUnarmedStrike').DAMAGE_RATING,
        data.weapon.weaponUnarmedStrike.DAMAGE_RATING,
    );
    // Too low a level only drops the ranks above it: rank 1 (level 1) stays, rank 2 (level 6) goes.
    const lowLevel = reconcile({ ...raw, level: 1 });
    assert.deepEqual(calculate(lowLevel).perks, ['perkIronFist']);
    const strike = unarmedDamage(lowLevel, 'weaponUnarmedStrike');
    assert.equal(strike.DAMAGE_RATING, data.weapon.weaponUnarmedStrike.DAMAGE_RATING + 1);
    assert.ok(!strike.EFFECTS.includes('effectVicious'));
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
                item('weapon10mmPistol', { quantity: 2 }),
                item('weaponGunBashOneHanded'),
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
    const manual = item('weaponPincerArm', { quantity: 2 });
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
                item('weaponPipeGun', { quantity: 2, mods: ['modFullStock'] }),
                item('weaponDoubleBarrelShotgun', { quantity: 3, mods: ['modSawedOffBarrel'] }),
            ],
        }),
    );
    const snapshot = structuredClone(raw);
    const view = calculate(raw);
    assert.equal(view.items.find(i => i.id === 'weaponGunBash').quantity, 2);
    assert.equal(view.items.find(i => i.id === 'weaponGunBashOneHanded').quantity, 3);
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

test('Basher makes every gun bash vicious', () => {
    for (const id of ['weaponGunBashOneHanded', 'weaponGunBash']) {
        const bash = inventory.getModifiedItemData(item(id), ['perkBasher'], []);
        assert.ok(bash.EFFECTS.includes('effectVicious'), id);
    }
    const knife = inventory.getModifiedItemData(item('weaponCombatKnife'), ['perkBasher'], []);
    assert.ok(!knife.EFFECTS.includes('effectVicious'));
});

test('Bayonets and shredders are projected from active weapons only', () => {
    const raw = character({
        origin: 'survivor',
        items: [
            item('weaponCombatRifle', { quantity: 2, mods: ['modBayonet'] }),
            item('weaponMissileLauncher', { mods: ['modBayonetMissileLauncher'] }),
            item('weaponGatlingGun', { mods: ['modLargeBayonet'] }),
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
    assert.equal(view.items.find(i => i.id === 'weaponLargeBayonet').quantity, 1);
    assert.ok(
        !raw.items.some(i =>
            ['weaponBayonet', 'weaponMissileLauncherBayonet', 'weaponShredder'].includes(i.id),
        ),
    );
});

test('Damage bonuses use prepared qualities and sneak checks', () => {
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

    const laser = item('weaponLaserGun');
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
    const suppressed = item('weaponPipeGun', { mods: ['modSuppressor'] });
    const prepared = inventory.getModifiedItemData(suppressed, sandman.perks);
    assert.equal(feats.getDamageRatingBonus(sandman, suppressed, prepared, true), 2);
    assert.equal(feats.getDamageRatingBonus(sandman, suppressed, prepared, false), 0);
    assert.equal(feats.getDamageRatingBonus(sandman, item(suppressed.id), prepared, true), 2);

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
            [
                'perkMysteriousStranger',
                {
                    type: 'skillRoll',
                    label: 'summonStranger',
                    skillId: 'smallGuns',
                    usingItem: item('weapon44Pistol', {
                        equipped: true,
                        mods: ['modSharpshootersGrip', 'modPowerful'],
                    }),
                    roller: 'mysteriousStranger',
                    requiredLuck: 1,
                },
            ],
            [
                'traitMotherWasteland',
                {
                    type: 'confirm',
                    label: 'traitMotherWasteland',
                    message: 'traitMotherWastelandBenefit',
                    luckCost: 1,
                },
            ],
            [
                'traitRiteOfPassage',
                {
                    type: 'combatDice',
                    label: 'traitRiteOfPassage',
                    diceCount: 1,
                    description: 'traitRiteOfPassageBenefit',
                    luckOnEffect: 1,
                },
            ],
        ]),
    );
    assert.deepEqual(raw, snapshot);
    assert.equal(feats.getManualActions(calculate(character({ origin: 'tribal' }))).size, 0);
    assert.equal(
        feats.getManualActions(
            calculate({
                ...raw,
                origin: 'survivor',
                special: { ...raw.special, luck: 6 },
            }),
        ).size,
        0,
        'Invalid perk prerequisites and traits from another origin must not grant actions',
    );
});

test('Registered stranger profile preserves the previous schema-derived combat stats', async () => {
    const { MYSTERIOUS_STRANGER, MYSTERIOUS_44_MAGNUM } = await server.ssrLoadModule(
        '/src/features/character/feats/perks/perkMysteriousStranger.ts',
    );
    const weapon = item('weapon44Pistol', {
        equipped: true,
        mods: ['modSharpshootersGrip', 'modPowerful'],
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
    assert.deepEqual(
        MYSTERIOUS_STRANGER,
        Object.fromEntries(
            ['special', 'skills', 'specialties', 'traits', 'items'].map(key => [
                key,
                previous[key],
            ]),
        ),
    );
});

const ammoFixture = () =>
    character({
        origin: 'survivor',
        items: [
            item('ammo10mmRound', { quantity: 3, customName: 'First stack' }),
            item('ammo10mmRound', { quantity: 4, customName: 'Second stack' }),
            item('ammo10mmRound', {
                quantity: 20,
                customName: 'Inactive ammo',
                grantedBy: 'inactiveFeat',
            }),
            item('weaponPincerArm', {
                grantedBy: 'traitMrHandyPliers',
                mods: ['legendaryFreezing'],
                customName: 'Hidden arm',
            }),
            item('weapon10mmPistol'),
        ],
        currentLuck: 8,
    });

test('Ammo spending consumes one total across stacks and preserves hidden data', () => {
    const raw = ammoFixture();
    const usingItem = item('weapon10mmPistol');
    const weapon = inventory.getModifiedItemData(usingItem);
    assert.equal(weapon.AMMO_TYPE, 'ammo10mmRound');
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
    const usingItem = item('weapon10mmPistol');
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
    const usingItem = item('weapon10mmPistol');
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
            .filter(i => i.id === 'ammo10mmRound' && !i.grantedBy)
            .reduce((sum, i) => sum + i.quantity, 0),
        1,
    );
    assert.equal(raw.currentLuck, 5);
    assert.deepEqual(
        raw.items.filter(i => i.grantedBy),
        ammoFixture().items.filter(i => i.grantedBy),
    );
    assert.ok(
        !raw.items.some(i => ['weaponUnarmedStrike', 'weaponGunBashOneHanded'].includes(i.id)),
    );
    const persisted = JSON.parse(storage.get('PB3K_character_saves')).state.slots[6];
    assert.deepEqual(persisted.items, JSON.parse(JSON.stringify(raw.items)));
});

test('Self-ammo counts and consumes only the selected configuration across parsed updates', () => {
    const selected = item('weaponNukeMine', { customName: 'Selected mine' });
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
            i === body ? { ...i, mods: [...i.mods, 'modRobotFactoryStorageArmorBody'] } : i,
        ),
    });
    assert.equal(calculate(modified).maxWeight, 85);
    assert.equal(
        calculate(transitions.applyUpdate(modified, { special: { strength: 9 } })).maxWeight,
        85,
    );
    const weight = await server.ssrLoadModule('/src/features/character/calculations/weight.ts');
    assert.equal(
        weight.calculateMaxWeight(modified, origins.getOriginById('mrHandy'), perks, [
            'traitSmallFrame',
        ]),
        85,
    );
});

test('All available mods resolve and Royal Flush additions apply their manual effects', () => {
    const equipment = [...Object.values(data.weapon), ...Object.values(data.apparel)];
    for (const itemData of equipment) {
        for (const modId of itemData.AVAILABLE_MODS ?? []) {
            assert.ok(data.mod[modId], `${itemData.ID} references missing mod ${modId}`);
        }
    }

    const golfClub = utils.getModdedItemData(
        item('weaponGolfClub', { mods: ['modSpikedPuncturing'] }),
    );
    assert.ok(golfClub);
    assert.equal(golfClub.DAMAGE_RATING, 5);
    assert.ok(golfClub.EFFECTS.includes('effectVicious'));
    assert.equal(data.mod.modSpikedPuncturing.WEIGHT, 0.5);
    assert.equal(data.mod.modBladedSharp.WEIGHT, 0.5);
    assert.equal(data.mod.modHeavyClub.WEIGHT, 0.5);
    assert.equal(data.mod.modExtraWeighty.WEIGHT, 1.5);
    assert.equal(data.mod.modPartyFavor.WEIGHT, 0.5);
    assert.equal(data.mod.modMuzzleBreak.WEIGHT, 0.5);

    const pin = utils.getModdedItemData(item('weaponJugglingPin', { mods: ['modPartyFavor'] }));
    assert.ok(pin);
    assert.equal(pin.CATEGORY, 'explosives');
    assert.equal(pin.DAMAGE_RATING, 6);
    assert.ok(pin.QUALITIES.includes('qualityBlast'));
    assert.ok(pin.QUALITIES.includes('qualityThrown'));
});

test('Mod removals take precedence over additions', () => {
    const weapon = utils.getModdedItemData(
        item('weaponBroadsider', { mods: ['modLightBarrelBroadsider'] }),
    );
    assert.ok(weapon);
    assert.ok(!weapon.QUALITIES.includes('qualityBlast'));
});

test('Gatling laser counts fusion cells and states fusion core use', () => {
    const weapon = data.weapon.weaponGatlingLaser;
    assert.equal(weapon.AMMO_TYPE, 'ammoFusionCell');
    assert.ok(weapon.QUALITIES.includes('qualitySpecialFusionCoreSlot'));
    const calculated = calculate(
        character({
            origin: 'survivor',
            items: [item('weaponGatlingLaser'), item('ammoFusionCell', { quantity: 30 })],
        }),
    );
    const usingItem = calculated.items.find(i => i.id === 'weaponGatlingLaser');
    assert.equal(inventory.getWeaponAmmoCount(weapon, calculated, usingItem), 30);
});

test('Jinxed and Built to Destroy widen the complication range', () => {
    const calculated = calculate(character({ origin: 'survivor' }));
    const weapon = data.weapon.weapon10mmPistol;
    const delta = traits =>
        feats.getRollComplicationModifiers(calculated, { traits, itemData: weapon }).thresholdDelta;
    assert.equal(delta(['traitJinxed']), -2);
    assert.equal(delta(['traitBuiltToDestroy']), -1);
});

test('Winding Way poison resistance increases at level 5 and every 5 levels', () => {
    const trait = ['traitWindingWayOfTheGreatSnake_poisonResistance'];
    const pr = level => feats.getPoisonResistance(level, [], trait);
    assert.deepEqual([1, 4, 5, 9, 10].map(pr), [1, 1, 2, 2, 3]);
});

test('Perks without a base level still apply the per-rank level increase, dropping only higher ranks', () => {
    const armorer = level =>
        calculatePerks(
            character({ origin: 'survivor', level, perks: ['perkArmorer', 'perkArmorer'] }),
        );
    assert.deepEqual(armorer(4), ['perkArmorer', 'perkArmorer']);
    assert.deepEqual(armorer(3), ['perkArmorer']);
    assert.deepEqual(
        calculatePerks(character({ origin: 'survivor', level: 1, perks: ['perkArmorer'] })),
        ['perkArmorer'],
    );
});

test('Perk flag requirements exclude robots, ghouls, radiation-immune characters and second companions', () => {
    const active = (origin, perks, level = 20) =>
        calculatePerks(character({ origin, level, perks }));
    assert.deepEqual(active('survivor', ['perkBarbarian']), ['perkBarbarian']);
    assert.deepEqual(active('mrHandy', ['perkBarbarian']), []);
    const ghoulish = origin =>
        calculatePerks(
            character({
                origin,
                level: 20,
                special: { ...character().special, endurance: 9 },
                perks: ['perkGhoulish'],
            }),
        );
    assert.deepEqual(ghoulish('ghoul'), []);
    assert.deepEqual(ghoulish('survivor'), ['perkGhoulish']);
    assert.deepEqual(active('ghoul', ['perkRadicool']), []);
    assert.deepEqual(active('survivor', ['perkRadicool']), ['perkRadicool']);
    assert.deepEqual(active('survivor', ['perkRobotWrangler']), ['perkRobotWrangler']);
    // No companion is checked when the perk is taken, not on perks already owned.
    assert.deepEqual(active('survivor', ['perkDogmeat', 'perkRobotWrangler']), [
        'perkDogmeat',
        'perkRobotWrangler',
    ]);
    const { getUnmetPerkFlags } = perksModule;
    const origin = origins.getOriginById('survivor');
    assert.deepEqual(getUnmetPerkFlags('perkRobotWrangler', origin, true), ['noCompanion']);
    assert.deepEqual(getUnmetPerkFlags('perkRobotWrangler', origin, false), []);
    // Radiation immunity comes from the origin's fixed traits (Super Mutant: Forced Evolution).
    assert.deepEqual(getUnmetPerkFlags('perkRadicool', origins.getOriginById('superMutant')), [
        'notRadiationImmune',
    ]);
});

test('Evasive adds DR by Agility and is lost while encumbered', () => {
    const dr = (perks, items = []) =>
        calculate(
            character({
                origin: 'survivor',
                level: 10,
                special: { ...character().special, agility: 9 },
                perks,
                items,
            }),
        ).locationsDR.torso;
    const base = dr([]);
    const evasive = dr(['perkEvasive']);
    assert.equal(evasive.physical, base.physical + 2);
    assert.equal(evasive.energy, base.energy + 2);
    const heavy = [item('weaponMinigun', { quantity: 20 })];
    assert.deepEqual(dr(['perkEvasive'], heavy), dr([], heavy));
});

test('Violent raises an existing Recoil by 1 and Plasma Infused deals Physical and Energy damage', () => {
    const modded = (id, mods) => utils.getModdedItemData(item(id, { mods }));
    const withRecoil = modded('weaponAntiMaterielRifle', ['legendaryViolent']);
    assert.deepEqual(
        withRecoil.QUALITIES.filter(q => q.startsWith('qualityRecoil')),
        ['qualityRecoil:9'],
    );
    const withoutRecoil = modded('weaponHuntingRifle', ['legendaryViolent']);
    assert.ok(withoutRecoil.QUALITIES.includes('qualityRecoil:7'));
    assert.deepEqual(modded('weaponHuntingRifle', ['legendaryPlasmaInfused']).DAMAGE_TYPES, [
        'physical',
        'energy',
    ]);
});

test('The Mr Handy arm mod keeps the base weapon, adds the name, the quality and zero weight', () => {
    const { t } = {
        t: (key, options) => (key === 'modMrHandyArmDescriptor' ? `${options.name} Arm` : key),
    };
    const flamer = item('weaponFlamer', { mods: ['modMrHandyArm'] });
    const modded = utils.getModdedItemData(flamer);
    assert.equal(modded.WEIGHT, 0);
    assert.ok(modded.QUALITIES.includes('qualityMrHandyOnly'));
    assert.ok(!modded.QUALITIES.includes('qualityTwoHanded'));
    assert.equal(modded.DAMAGE_RATING, data.weapon.weaponFlamer.DAMAGE_RATING);
    assert.equal(utils.getCanonicalDisplayName(flamer, t), 'weaponFlamer Arm');
    // "see 10mm pistol, with an automatic receiver mod"
    const pistol = utils.getModdedItemData(
        item('weapon10mmPistol', { mods: ['modAutomatic', 'modMrHandyArm'] }),
    );
    assert.equal(pistol.FIRE_RATE, data.weapon.weapon10mmPistol.FIRE_RATE + 2);
    assert.ok(pistol.EFFECTS.includes('effectBurst'));
    assert.ok(utils.isUnacquirable('modMrHandyArm'));
});

test('Old saves migrate items, mods, companions and custom items; current saves come out equal', () => {
    const old = {
        ...character({ origin: 'survivor' }),
        saveVersion: 1,
        companion: {
            type: 'dog',
            special: { body: 5, mind: 1 },
            skills: { melee: 2, guns: 0, other: 1 },
            currentHp: 5,
            weapons: [item('medsStimpak', { quantity: 2 })],
        },
        items: [
            item('medsStimpak', { quantity: 3 }),
            item('medsDilutedRadX'),
            item('foodPaste'),
            item('foodPasta', { quantity: 2 }),
            item('medsBufftat'),
            item('weaponHandmadePistol', {
                equipped: true,
                variation: 'left',
                mods: ['modStableBarrel', 'modFlashHider', 'modMuzzleBreak'],
            }),
            item('weaponMrHandyAutomaticPistol', { mods: ['legendaryFreezing'] }),
        ],
        customItems: [
            {
                name: 'Home brew',
                quantity: 1,
                value: 1,
                weight: 0,
                rarity: 0,
                type: 'aid',
                category: 'meds',
            },
        ],
    };
    delete old.companions;
    const migrated = transitions.loadCharacter(structuredClone(old));
    assert.ok(!('saveVersion' in migrated));
    assert.deepEqual(
        migrated.items.map(i => [i.id, i.quantity, i.mods]),
        [
            ['chemStimpak', 3, []],
            ['chemRadXDiluted', 1, []],
            // foodPaste and the older foodPasta are the same item: one stack.
            ['foodFoodPaste', 3, []],
            ['chemBufftats', 1, []],
            ['weaponPipeGun', 1, ['modBullBarrel', 'modMuzzleBreak']],
            ['weapon10mmPistol', 1, ['modAutomatic', 'modMrHandyArm', 'legendaryFreezing']],
        ],
    );
    assert.equal(migrated.items.find(i => i.id === 'weaponPipeGun').side, 'left');
    assert.equal(migrated.activeCompanionId, 'dog');
    assert.deepEqual(
        migrated.companions.dog.items.map(i => i.id),
        ['chemStimpak'],
    );
    assert.deepEqual(migrated.customItems, [
        {
            customName: 'Home brew',
            quantity: 1,
            COST: 1,
            WEIGHT: 0,
            RARITY: 0,
            TYPE: 'aid',
            CATEGORY: 'chems',
        },
    ]);
    // Migrations run on every load, so they must be idempotent.
    assert.deepEqual(transitions.loadCharacter(JSON.parse(JSON.stringify(migrated))), migrated);
    assert.deepEqual(migrations.migrateRawSave(structuredClone(migrated)), migrated);
});

test('Migration maps are idempotent and consistent with the current data', () => {
    const itemIds = new Set(Object.keys(data.allItems).filter(id => !(id in data.mod)));
    const modIds = new Set([...Object.keys(data.mod), ...Object.keys(data.legendaryEffects)]);
    const conversions = migrations.ITEM_CONVERSIONS;
    for (const [kind, table, ids] of [
        [
            'item',
            {
                ...migrations.ITEM_RENAMES,
                ...Object.fromEntries(Object.entries(conversions).map(([k, v]) => [k, v.id])),
            },
            itemIds,
        ],
        ['mod', migrations.MOD_RENAMES, modIds],
    ]) {
        for (const [old, target] of Object.entries(table)) {
            assert.ok(ids.has(target), `${kind} target ${target} missing`);
            // No swaps, chains or reused IDs: an old ID must never be a current one.
            assert.ok(!ids.has(old), `${kind} ${old} is still a current ID`);
        }
        const plainTargets = Object.values(kind === 'item' ? migrations.ITEM_RENAMES : table);
        assert.equal(
            new Set(plainTargets).size,
            plainTargets.length,
            `${kind} renames merge two IDs`,
        );
    }
    for (const [old, target] of Object.entries(migrations.LEGACY_ITEM_RENAMES)) {
        assert.ok(itemIds.has(target), `legacy target ${target} missing`);
        assert.ok(!itemIds.has(old), `legacy ${old} is still a current ID`);
        assert.ok(!(old in migrations.ITEM_RENAMES), `${old} is in both rename maps`);
    }
    for (const removed of migrations.REMOVED_ITEMS) {
        assert.ok(!itemIds.has(removed), `removed item ${removed} still exists`);
    }
    for (const conversion of Object.values(conversions)) {
        for (const mod of conversion.mods)
            assert.ok(modIds.has(mod), `conversion mod ${mod} missing`);
    }
    const categories = new Set(
        Object.values(data.compiledData).flatMap(set => Object.values(set).map(i => i.CATEGORY)),
    );
    for (const [old, current] of Object.entries(migrations.CUSTOM_ITEM_CATEGORY_RENAMES)) {
        assert.ok(!categories.has(old), `category ${old} is still current`);
        assert.ok(categories.has(current), `category ${current} missing`);
    }
});

test('Mr Handy arm traits can be taken twice and grant one arm each, with separate provenance', () => {
    let raw = reconcile(
        character({
            traits: ['traitMrHandyFlamethrower', 'traitMrHandyFlamethrower', 'traitMrHandyPliers'],
        }),
    );
    const flamers = raw.items.filter(i => i.id === 'weaponFlamer');
    assert.deepEqual(flamers.map(i => i.grantedBy).toSorted(), [
        'traitMrHandyFlamethrower',
        'traitMrHandyFlamethrower#2',
    ]);
    assert.ok(flamers.every(i => i.mods.includes('modMrHandyArm')));
    assert.equal(active(raw).filter(i => i.id === 'weaponFlamer').length, 2);
    // Dropping one copy hides the second arm but keeps its configuration.
    raw = {
        ...raw,
        items: raw.items.map(i =>
            i.grantedBy === 'traitMrHandyFlamethrower#2'
                ? { ...i, customName: 'Second flamer' }
                : i,
        ),
    };
    const one = reconcile({ ...raw, traits: ['traitMrHandyFlamethrower', 'traitMrHandyPliers'] });
    assert.equal(active(one).filter(i => i.id === 'weaponFlamer').length, 1);
    assert.equal(
        one.items.find(i => i.grantedBy === 'traitMrHandyFlamethrower#2').customName,
        'Second flamer',
    );
    // Non-repeatable traits still collapse.
    const origin = origins.getOriginById('survivor');
    assert.deepEqual(
        calculateTraits(
            character({ origin: 'survivor', traits: ['traitFastShot', 'traitFastShot'] }),
            origin,
        ),
        ['traitFastShot'],
    );
});

test('Buzz-Saw and Pincer arms stay standalone Mr Handy only items', () => {
    for (const id of ['weaponBuzzSawArm', 'weaponPincerArm']) {
        assert.ok(data.weapon[id].QUALITIES.includes('qualityMrHandyOnly'), id);
    }
});

test('Armor mods follow the EN corebook names; only the non-circular old IDs migrate', () => {
    // Raider materials: Welded +1, Tempered +2, Hardened +3, Buttressed +4.
    const raider = ['modWelded', 'modTempered', 'modHardened', 'modButtressed'];
    raider.forEach((id, index) =>
        assert.ok(data.mod[id].EFFECTS.includes(`physicalResAdd:${index + 1}`), id),
    );
    assert.ok(data.mod.modPadded.EFFECTS.includes('explosiveResAdd:2'));
    assert.ok(data.mod.modCushioned.EFFECTS.includes('fallDamageResAdd:2'));
    const migrated = transitions.loadCharacter(
        character({
            origin: 'survivor',
            items: [
                item('armorRaiderChestPiece', {
                    mods: ['modAnnealed', 'modShockAbsorbing', 'modCrafted'],
                }),
            ],
        }),
    );
    assert.deepEqual(migrated.items[0].mods, ['modTempered', 'modCushioned', 'modBraced']);
    // Circular: an old modTempered (then Hardened) can't be told apart from the new one.
    assert.equal(migrations.MOD_RENAMES.modTempered, undefined);
    assert.equal(migrations.MOD_RENAMES.modCushioned, undefined);
});
