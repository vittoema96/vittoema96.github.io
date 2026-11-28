/**
 * Save migrations, run by loadCharacter on every load, import and rehydration (never on updates).
 *
 * There is no save version, so every migration must be idempotent: running it on an already
 * migrated save must change nothing. For renames that means:
 * - an old ID must never be a current ID (no swaps, no chains, no reuse of a retired ID);
 * - two old IDs must never map to the same target (stacks would merge for good).
 * Both are enforced by tests against the current data.
 *
 * Retire a migration once every save has been loaded at least once since it shipped.
 */

/** 2026-11-28: IDs aligned with the English names in the manuals; meds* became chem*. */
export const ITEM_RENAMES: Readonly<Record<string, string>> = {
    medsAddictol: 'chemAddictol',
    medsAntibiotics: 'chemAntibiotics',
    medsBerryMentats: 'chemBerryMentats',
    medsBuffjet: 'chemBuffjet',
    medsBuffout: 'chemBuffout',
    medsBufftats: 'chemBufftats',
    medsCalmex: 'chemCalmex',
    medsDayTripper: 'chemDayTripper',
    medsDaddyO: 'chemDaddyO',
    medsDilutedRadAway: 'chemRadAwayDiluted',
    medsDilutedRadX: 'chemRadXDiluted',
    medsDilutedStimpak: 'chemStimpakDiluted',
    medsFury: 'chemFury',
    medsGrapeMentats: 'chemGrapeMentats',
    medsHealingPowder: 'chemHealingPowder',
    medsHealingSalve: 'chemHealingSalve',
    medsJet: 'chemJet',
    medsJetFuel: 'chemJetFuel',
    medsMedX: 'chemMedX',
    medsMentats: 'chemMentats',
    medsOrangeMentats: 'chemOrangeMentats',
    medsOverdrive: 'chemOverdrive',
    medsPsycho: 'chemPsycho',
    medsPsychoJet: 'chemPsychoJet',
    medsPsychobuff: 'chemPsychobuff',
    medsPsychotats: 'chemPsychotats',
    medsRadAway: 'chemRadAway',
    medsRadX: 'chemRadX',
    medsSkeetoSpit: 'chemSkeetoSpit',
    medsStimpak: 'chemStimpak',
    medsSuperStimpak: 'chemSuperStimpak',
    medsUltraJet: 'chemUltraJet',
    medsXCell: 'chemXCell',
    ammo10mm: 'ammo10mmRound',
    ammo22: 'ammo22Lr',
    ammo308: 'ammo308Rounds',
    ammo38: 'ammo38Rounds',
    ammo40mmGrenade: 'ammo40mmGrenadeRound',
    ammo45: 'ammo45Rounds',
    ammo5mm: 'ammo5mmRounds',
    ammoAlienPowerCell: 'ammoAlienPowerCells',
    ammoArrowCryo: 'ammoCryoArrowBolt',
    ammoArrowExplosive: 'ammoExplosiveArrowBolt',
    ammoArrowFlaming: 'ammoFlamingArrowBolt',
    ammoArrowPlasma: 'ammoPlasmaArrowBolt',
    ammoArrowPoison: 'ammoPoisonArrowBolt',
    ammoArrowSerrated: 'ammoSerratedArrowBolt',
    ammoSyringer: 'ammoSyringerAmmo',
    ammoSyringerCazadoresSting: 'ammoCazadoresSting',
    armorBrotherhoodScribe: 'armorBrotherhoodScribesArmor',
    armorBrotherhoodScribeHat: 'armorBrotherhoodScribesHat',
    armorBrotherhoodSteelFatigues: 'armorBrotherhoodOfSteelFatigues',
    armorBrotherhoodSteelHood: 'armorBrotherhoodOfSteelHood',
    armorBrotherhoodSteelUniform: 'armorBrotherhoodOfSteelUniform',
    armorCage: 'armorCageArmor',
    armorChineseStealth: 'armorChineseStealthArmor',
    armorCleanroom: 'armorCleanroomSuit',
    armorCombatChest: 'armorCombatChestPiece',
    armorCombatHeavyArm: 'armorHeavyCombatArm',
    armorCombatHeavyChest: 'armorHeavyCombatChestPiece',
    armorCombatHeavyHelmet: 'armorHeavyCombatHelmet',
    armorCombatHeavyLeg: 'armorHeavyCombatLeg',
    armorCombatSturdyArm: 'armorSturdyCombatArm',
    armorCombatSturdyChest: 'armorSturdyCombatChestPiece',
    armorCombatSturdyHelmet: 'armorSturdyCombatHelmet',
    armorCombatSturdyLeg: 'armorSturdyCombatLeg',
    armorDrifter: 'armorDrifterOutfit',
    armorEngineer: 'armorEngineersArmor',
    armorLeatherChest: 'armorLeatherChestPiece',
    armorLeatherHeavyArm: 'armorHeavyLeatherArm',
    armorLeatherHeavyChest: 'armorHeavyLeatherChestPiece',
    armorLeatherHeavyLeg: 'armorHeavyLeatherLeg',
    armorLeatherSturdyArm: 'armorSturdyLeatherArm',
    armorLeatherSturdyChest: 'armorSturdyLeatherChestPiece',
    armorLeatherSturdyLeg: 'armorSturdyLeatherLeg',
    armorLegionaryCenturionChest: 'armorLegionaryCenturionChestPiece',
    armorLegionaryChest: 'armorLegionaryChestPiece',
    armorLegionaryRecruitChest: 'armorLegionaryRecruitChestPiece',
    armorMarineChest: 'armorMarineChestPiece',
    armorMetalChest: 'armorMetalChestPiece',
    armorMetalHeavyArm: 'armorHeavyMetalArm',
    armorMetalHeavyChest: 'armorHeavyMetalChestPiece',
    armorMetalHeavyHelmet: 'armorHeavyMetalHelmet',
    armorMetalHeavyLeg: 'armorHeavyMetalLeg',
    armorMetalSturdyArm: 'armorSturdyMetalArm',
    armorMetalSturdyChest: 'armorSturdyMetalChestPiece',
    armorMetalSturdyHelmet: 'armorSturdyMetalHelmet',
    armorMetalSturdyLeg: 'armorSturdyMetalLeg',
    armorNcrChest: 'armorNcrChestPiece',
    armorRaiderChest: 'armorRaiderChestPiece',
    armorRaiderHeavyArm: 'armorHeavyRaiderArm',
    armorRaiderHeavyChest: 'armorHeavyRaiderChestPiece',
    armorRaiderHeavyLeg: 'armorHeavyRaiderLeg',
    armorRaiderSturdyArm: 'armorSturdyRaiderArm',
    armorRaiderSturdyChest: 'armorSturdyRaiderChestPiece',
    armorRaiderSturdyLeg: 'armorSturdyRaiderLeg',
    armorRecon: 'armorReconArmor',
    armorRiotGearChest: 'armorRiotGearChestPiece',
    armorScoutChest: 'armorScoutChestPiece',
    armorSpike: 'armorSpikeArmor',
    armorSyntheticArm: 'armorSynthArm',
    armorSyntheticChest: 'armorSynthChestPiece',
    armorSyntheticHeavyArm: 'armorHeavySynthArm',
    armorSyntheticHeavyChest: 'armorHeavySynthChestPiece',
    armorSyntheticHeavyHelmet: 'armorHeavySynthHelmet',
    armorSyntheticHeavyLeg: 'armorHeavySynthLeg',
    armorSyntheticHelmet: 'armorSynthHelmet',
    armorSyntheticLeg: 'armorSynthLeg',
    armorSyntheticSturdyArm: 'armorSturdySynthArm',
    armorSyntheticSturdyChest: 'armorSturdySynthChestPiece',
    armorSyntheticSturdyHelmet: 'armorSturdySynthHelmet',
    armorSyntheticSturdyLeg: 'armorSturdySynthLeg',
    armorUnderarmor: 'armorUnderarmorSuit',
    armorWoodArm: 'armorWoodArmorArm',
    armorWoodChest: 'armorWoodArmorChestPiece',
    armorWoodHelmet: 'armorWoodArmorHelmet',
    armorWoodLeg: 'armorWoodArmorLeg',
    foodFancyLadsSnacks: 'foodFancyLadsSnackCakes',
    foodPaste: 'foodFoodPaste',
    foodPreservedFancyLadsSnacks: 'foodPreservedFancyLadsSnackCakes',
    miscCommonJunk: 'miscCommonJunkMaterials',
    miscDoctorBag: 'miscDoctorsBag',
    miscRareJunk: 'miscRareJunkMaterials',
    miscUncommonJunk: 'miscUncommonJunkMaterials',
    robotPartSensors: 'robotPartOptics',
    weapon357Revolver: 'weapon357MagnumRevolver',
    weaponAllAmerican: 'weaponTheAllAmerican',
    weaponAtomicMine: 'weaponNukeMine',
    weaponCompanionLaser: 'weaponEyebotLaser',
    weaponExplosiveBaseball: 'weaponBaseballGrenade',
    weaponFlamethrower: 'weaponFlamer',
    weaponFortyFourPistol: 'weapon44Pistol',
    weaponFragmentationGrenade: 'weaponFragGrenade',
    weaponFragmentationMine: 'weaponFragMine',
    weaponGammaPistol: 'weaponGammaGun',
    weaponHandmadeBoltAction: 'weaponPipeBoltAction',
    weaponHandmadePistol: 'weaponPipeGun',
    weaponHandmadeRevolver: 'weaponPipeRevolver',
    weaponIncinerator: 'weaponHeavyIncinerator',
    weaponLaserPistol: 'weaponLaserGun',
    weaponMachineGun: 'weaponSubmachineGun',
    weaponMrHandyCircularSaw: 'weaponBuzzSawArm',
    weaponMrHandyPliers: 'weaponPincerArm',
    weaponPlasmaPistol: 'weaponPlasmaGun',
    weaponStone: 'weaponHandyRock',
    weaponTenMillimeterPistol: 'weapon10mmPistol',
    weaponWalkingStick: 'weaponWalkingCane',
    weaponWeaponStock: 'weaponGunBash',
    weaponWeaponStockOneHanded: 'weaponGunBashOneHanded',
};

/**
 * 2026-07-21: older spellings of items that were renamed again later, pointing straight at the
 * current IDs (foodPasta and foodPaste both become foodFoodPaste). Two keys may share a target
 * here because each pair is the same item, never two items that coexisted.
 */
export const LEGACY_ITEM_RENAMES: Readonly<Record<string, string>> = {
    foodMirelurkRoast: 'foodRoastedMirelurkMeat',
    foodBerry: 'foodTarberry',
    foodCookedSoftshellMirelurkMeat: 'foodCookedSoftshellMeat',
    foodMongrelMeat: 'foodMongrelDogMeat',
    foodMirelurkQueenMeat: 'foodQueenMirelurkMeat',
    foodWatermelon: 'foodMelon',
    foodMongrelChops: 'foodMuttChops',
    foodYaoGuaiChops: 'foodYaoGuaiRibs',
    foodSandbean: 'foodSiltBean',
    foodGranola: 'foodRazorgrain',
    foodMinestrone: 'foodVegetableSoup',
    foodRoastedBloatfly: 'foodBakedBloatfly',
    foodPasta: 'foodFoodPaste',
    foodPotatoChips: 'foodPotatoCrisps',
    foodInstantRamen: 'foodNoodleCup',
    foodInstituteRations: 'foodInstituteFoodPacket',
    drinkBerryJuice: 'drinkTarberryJuice',
    drinkWatermelonJuice: 'drinkMelonJuice',
    medsBufftat: 'chemBufftats',
    medsPsychojet: 'chemPsychoJet',
    medsDaytripper: 'chemDayTripper',
};

type ItemConversion = {
    id: string;
    /** Mods the converted item needs, placed before the mods it already had. */
    mods: string[];
};

/** 2026-11-28: Mr Handy arms are the manual's base weapons with a built-in arm mod. */
export const ITEM_CONVERSIONS: Readonly<Record<string, ItemConversion>> = {
    // "see 10mm pistol, with an automatic receiver mod"
    weaponMrHandyAutomaticPistol: {
        id: 'weapon10mmPistol',
        mods: ['modAutomatic', 'modMrHandyArm'],
    },
    weaponMrHandyLaserEmitter: { id: 'weaponLaserGun', mods: ['modMrHandyArm'] },
    weaponMrHandyFlamethrower: { id: 'weaponFlamer', mods: ['modMrHandyArm'] },
};

/** 2026-11-28 (modFlashHider: 2026-10-15). */
export const MOD_RENAMES: Readonly<Record<string, string>> = {
    modFlashHider: 'modMuzzleBreak',
    // Armor mods aligned with the EN corebook. Not migrated, because their old ID is now another
    // mod's ID: modTempered (was Hardened, now Tempered) and modCushioned (was Padded, now Cushioned).
    modAnnealed: 'modTempered',
    modArmorHardened: 'modButtressed',
    modShockAbsorbing: 'modCushioned',
    modBandedLeather: 'modGirdedLeather',
    modEnamelledMetal: 'modEnameledMetal',
    modDensity: 'modDense',
    modStreamlined: 'modAerodynamic',
    modBalanced: 'modWeighted',
    modCrafted: 'modBraced',
    modAutomaticSignalRepeater: 'modSignalRepeater',
    modBallisticWeave2: 'modBallisticWeaveMk2',
    modBallisticWeave3: 'modBallisticWeaveMk3',
    modBallisticWeave4: 'modBallisticWeaveMk4',
    modBallisticWeave5: 'modBallisticWeaveMk5',
    modBarbedCane: 'modBarbedWalkingCane',
    modBarbedHarpoon: 'modBarbedHarpoonGun',
    modBeamFocuserGatling: 'modBeamFocuserGatlingLaser',
    modBetaWaveTunerGatling: 'modBetaWaveTunerGatlingLaser',
    modBladeBaseballBat: 'modBladedBaseballBat',
    modBladeKnuckles: 'modBladedKnuckles',
    modBoostedCapacitorGatling: 'modBoostedCapacitorGatlingLaser',
    modBoostedGammaWaveEmitterGatling: 'modBoostedGammaWaveEmitterGatlingLaser',
    modBoostedPhotonAgitatorGatling: 'modBoostedPhotonAgitatorGatlingLaser',
    modBowCompoundFrame: 'modCompoundFrameBow',
    modBowGlowSights: 'modGlowSightsBow',
    modBowIronSights: 'modIronSightsBow',
    modCapacitorMk3: 'modCapacitorMkIii',
    modCapacitorMk4: 'modCapacitorMkIv',
    modCapacitorMk5: 'modCapacitorMkV',
    modCapacitorMk6: 'modCapacitorMkVi',
    modChainBaseballBat: 'modChainWrappedBaseballBat',
    modCombustionModule: 'modIgnitionModule',
    modCrossbowGlowSights: 'modGlowSightsCrossbow',
    modCrossbowHeavyFrame: 'modHeavyFrameCrossbow',
    modCrossbowIronSights: 'modIronSightsCrossbow',
    modCrossbowMultipleLaunchFrame: 'modMultipleLaunchFrameCrossbow',
    modCrossbowRepeatingFrame: 'modRepeatingFrameCrossbow',
    modCurvedRipper: 'modCurvedBladeRipper',
    modElectricSignalAntenna: 'modElectricSignalCarrierAntennae',
    modElectrifiedSerratedSword: 'modElectrifiedSerratedBladeSword',
    modElectrifiedSword: 'modElectrifiedBladeSword',
    modErgonomicGrip: 'modComfortGrip',
    modExtendedRipper: 'modExtendedBladeRipper',
    modExtraClawDeathclaw: 'modExtraClawDeathclawGauntlet',
    modExtraFlamesShishkebab: 'modExtraFlameJetsShishkebab',
    modFlaming: 'modFlamer',
    modGammaWaveEmitterGatling: 'modGammaWaveEmitterGatlingLaser',
    modGunnerSightHarpoon: 'modGunnerSightHarpoonGun',
    modHeatingPowerFist: 'modHeatingCoilPowerFist',
    modHeatingSuperSledge: 'modHeatingCoilSuperSledge',
    modHeavyBarrelAutoGrenade: 'modHeavyBarrelAutoGrenadeLauncher',
    modHeavyWrench: 'modHeavyPipeWrench',
    modHookedWrench: 'modHookedPipeWrench',
    modLeadedBoxingGlove: 'modLeadLiningBoxingGlove',
    modLegionReinforced: 'modReinforcedLegionArmor',
    modLegionShadowed: 'modShadowedLegionArmor',
    modLegionStudded: 'modStuddedLegionArmor',
    modLegionTreated: 'modTreatedLegionArmor',
    modLongBarrelAutoGrenade: 'modLongBarrelAutoGrenadeLauncher',
    modLongBarrelFlamethrower: 'modLongBarrelFlamer',
    modLongBarrelM79: 'modLongBarrelM79GrenadeLauncher',
    modMagFusionAlienBlaster: 'modFusionMagAlienBlaster',
    modMarineButtressed: 'modButtressedMarineArmor',
    modMarineHardened: 'modHardenedMarineArmor',
    modMarineTempered: 'modTemperedMarineArmor',
    modMarineWelded: 'modWeldedMarineArmor',
    modMarksmanGrip: 'modSharpshootersGrip',
    modMarksmanStock: 'modMarksmansStock',
    modMaximizedCapacitorGatling: 'modMaximizedCapacitorGatlingLaser',
    modNapalm: 'modNapalmFuel',
    modOverchargedCapacitorGatling: 'modOverchargedCapacitorGatlingLaser',
    modPhotonicAgitatorGatling: 'modPhotonicAgitatorGatlingLaser',
    modPhotonicStimulatorGatling: 'modPhotonExciterGatlingLaser',
    modPuncturedBoard: 'modPuncturingBoard',
    modPuncturedBoxingGlove: 'modPuncturingBoxingGlove',
    modPuncturedKnuckles: 'modPuncturingKnuckles',
    modPuncturedPowerFist: 'modPuncturingPowerFist',
    modPuncturedSledgehammer: 'modPuncturingSledgehammer',
    modPuncturedWrench: 'modPuncturingPipeWrench',
    modReceiver308: 'mod308Receiver',
    modReceiver357: 'mod357Receiver',
    modReceiver38: 'mod38Receiver',
    modReceiver45: 'mod45Receiver',
    modReceiver50: 'mod50Receiver',
    modReceiver9mm: 'mod9mmReceiver',
    modRecoilCompensatingStockHarpoon: 'modRecoilCompensatingStockHarpoonGun',
    modReflexSightGatling: 'modReflexSightGatlingLaser',
    modRobotActivationFrameArms: 'modRobotActuatedFrameArms',
    modRobotActivationFrameBody: 'modRobotActuatedFrameBody',
    modRobotActivationFrameOptics: 'modRobotActuatedFrameOptics',
    modRobotActivationFrameThrusters: 'modRobotActuatedFrameThrusters',
    modRobotBasePlatingArms: 'modRobotPrimalPlateArms',
    modRobotBasePlatingBody: 'modRobotPrimalPlateBody',
    modRobotBasePlatingOptics: 'modRobotPrimalPlateOptics',
    modRobotBasePlatingThrusters: 'modRobotPrimalPlateThrusters',
    modRobotDiagnosticModule: 'modRobotDiagnosisModule',
    modRobotFactoryStorageBody: 'modRobotFactoryStorageArmorBody',
    modRobotIntegratedBoiler: 'modRobotIntegralBoiler',
    modRobotKnurledPlatingArms: 'modRobotSerratedPlateArms',
    modRobotKnurledPlatingBody: 'modRobotSerratedPlateBody',
    modRobotKnurledPlatingOptics: 'modRobotSerratedPlateOptics',
    modRobotKnurledPlatingThrusters: 'modRobotSerratedPlateThrusters',
    modRobotLockpickingModule: 'modRobotLockpickModule',
    modRobotPlatingMisterGutsy: 'modRobotMisterGutsyPlating',
    modRobotPlatingStandard: 'modRobotStandardPlating',
    modRobotPoisonousPlatingArms: 'modRobotNoxiousPlateArms',
    modRobotPoisonousPlatingBody: 'modRobotNoxiousPlateBody',
    modRobotPoisonousPlatingOptics: 'modRobotNoxiousPlateOptics',
    modRobotPoisonousPlatingThrusters: 'modRobotNoxiousPlateThrusters',
    modRobotReconnaissanceSensors: 'modRobotReconSensors',
    modRobotSensors: 'modRobotSensorArray',
    modSerratedCombatKnife: 'modSerratedBladeCombatKnife',
    modSerratedMachete: 'modSerratedBladeMachete',
    modSerratedSwitchblade: 'modSerratedBladeSwitchblade',
    modSerratedSword: 'modSerratedBladeSword',
    modSharpBoard: 'modBladedBoard',
    modSharpTireIron: 'modBladedTireIron',
    modShortBarrel: 'modSnubnoseBarrel',
    modShortScopeHarpoon: 'modShortScopeHarpoonGun',
    modSpikedCane: 'modSpikedWalkingCane',
    modStableBarrel: 'modBullBarrel',
    modStealthCombatKnife: 'modStealthBladeCombatKnife',
    modStunningBaton: 'modStunPackBaton',
    modStunningSuperSledge: 'modStunPackSuperSledge',
    modStunningSword: 'modStunPackSword',
    modTripleBarrelMinigun: 'modTriBarrelMinigun',
    modUnderarmorProtectiveLining: 'modProtectiveUnderarmorLining',
    modUnderarmorResistantLining: 'modResistantUnderarmorLining',
    modUnderarmorShieldedLining: 'modShieldedUnderarmorLining',
    modUnderarmorTreatedLining: 'modTreatedUnderarmorLining',
    modVaporizerNozzle: 'modVaporizationNozzle',
    modVeryHeavyWrench: 'modExtraHeavyPipeWrench',
    modWeaponHardened: 'modHardenedReceiver',
    modWoodShrouded: 'modShroudedWoodArmor',
};

/** 2026-11-28 */
export const CUSTOM_ITEM_CATEGORY_RENAMES: Readonly<Record<string, string>> = {
    meds: 'chems',
};

type RawObject = Record<string, unknown>;
const isObject = (value: unknown): value is RawObject =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

function migrateRawItem(item: unknown): unknown {
    if (!isObject(item)) {
        return item;
    }
    // Old saves (before 2026-07-24) stored the hand of an item as `variation`.
    const { variation, ...rest } = item;
    const migrated: RawObject =
        variation !== undefined && rest['equipped'] && !rest['side']
            ? { ...rest, side: variation }
            : rest;

    const id = typeof migrated['id'] === 'string' ? migrated['id'] : undefined;
    const oldMods = Array.isArray(migrated['mods']) ? (migrated['mods'] as unknown[]) : [];
    const conversion = id === undefined ? undefined : ITEM_CONVERSIONS[id];
    const mods: unknown[] = [...(conversion?.mods ?? [])];
    for (const mod of oldMods) {
        const renamed = typeof mod === 'string' ? (MOD_RENAMES[mod] ?? mod) : mod;
        // A rename may land on a mod the item already has (flash hider + muzzle break).
        if (!mods.includes(renamed)) {
            mods.push(renamed);
        }
    }
    return {
        ...migrated,
        ...(id === undefined
            ? {}
            : { id: conversion?.id ?? ITEM_RENAMES[id] ?? LEGACY_ITEM_RENAMES[id] ?? id }),
        ...(Array.isArray(migrated['mods']) || conversion ? { mods } : {}),
    };
}

/**
 * 2026-11-28: items that no longer exist and have no replacement. Iron Fist was a separate weapon
 * granted by the perk; the perk now boosts every Unarmed weapon instead.
 */
export const REMOVED_ITEMS: ReadonlySet<string> = new Set(['weaponIronFist']);

const isRemovedItem = (item: unknown) =>
    isObject(item) && typeof item['id'] === 'string' && REMOVED_ITEMS.has(item['id']);

const migrateRawItems = (items: unknown) =>
    Array.isArray(items) ? items.filter(item => !isRemovedItem(item)).map(migrateRawItem) : items;

function migrateRawCustomItem(item: unknown): unknown {
    if (!isObject(item)) {
        return item;
    }
    // Old saves stored custom item fields in lowercase, and the name as `name`.
    const { name, value, weight, rarity, category, type, ...rest } = item;
    const CATEGORY = rest['CATEGORY'] ?? category;
    return {
        ...rest,
        customName: rest['customName'] ?? name,
        COST: rest['COST'] ?? value,
        WEIGHT: rest['WEIGHT'] ?? weight,
        RARITY: rest['RARITY'] ?? rarity,
        TYPE: rest['TYPE'] ?? type,
        CATEGORY:
            typeof CATEGORY === 'string'
                ? (CUSTOM_ITEM_CATEGORY_RENAMES[CATEGORY] ?? CATEGORY)
                : CATEGORY,
    };
}

function migrateRawCompanion(companion: unknown): unknown {
    if (!isObject(companion)) {
        return companion;
    }
    // Old companions stored their items as `weapons`.
    const { weapons, ...rest } = companion;
    return { ...rest, items: migrateRawItems(rest['items'] ?? weapons) };
}

/**
 * Brings a raw save (localStorage, import file) to the current format, before validation.
 * Idempotent: a current save comes out equal.
 */
export function migrateRawSave(input: unknown): unknown {
    if (!isObject(input)) {
        return input;
    }
    // Old saves may still carry `saveVersion` (retired 2026-11-28): validation drops it.
    const save = input;
    let companions = save['companions'];
    let activeCompanionId = save['activeCompanionId'];
    // Old saves had a single `companion` instead of the companions map.
    const { companion, ...rest } = save;
    if (isObject(companion) && companions === undefined) {
        companions = { [String(companion['type'])]: companion };
        activeCompanionId = companion['type'];
    }
    return {
        ...rest,
        ...(companions === undefined
            ? {}
            : {
                  companions: isObject(companions)
                      ? Object.fromEntries(
                            Object.entries(companions).map(([id, data]) => [
                                id,
                                migrateRawCompanion(data),
                            ]),
                        )
                      : companions,
              }),
        ...(activeCompanionId === undefined ? {} : { activeCompanionId }),
        ...(rest['items'] === undefined ? {} : { items: migrateRawItems(rest['items']) }),
        ...(Array.isArray(rest['customItems'])
            ? { customItems: rest['customItems'].map(migrateRawCustomItem) }
            : {}),
    };
}
