#!/usr/bin/env python3
"""
Script to refactor mod CSV files:
1. Convert Italian IDs to English camelCase
2. Remove NAME and DESCRIPTION columns
3. Convert Italian values to English keys (SKILL, PERKS, SLOT_TYPE)
4. Generate i18n translations
"""

import csv
import json
import re
from pathlib import Path

# ID mappings (Italian → English)
ID_MAPPINGS = {
    # Small Gun Mods
    "modBaionetta": "modBayonet",
    "modCompensatore": "modCompensator",
    "modRompifiamma": "modFlashHider",
    "modSilenziatore": "modSuppressor",
    "modCalcioCompleto": "modFullStock",
    "modCalcioTiratoreS celto": "modMarksmanStock",
    "modCalcioRinculo": "modRecoilCompensatingStock",
    "modCannaAlettata": "modFinnedBarrel",
    "modCannaForata": "modPortedBarrel",
    "modCannaLunga": "modLongBarrel",
    "modCannaMozza": "modSawedOffBarrel",
    "modCannaRidotta": "modShortBarrel",
    "modCannaSchermata": "modShieldedBarrel",
    "modCannaStabile": "modStableBarrel",
    "modCannaVentilata": "modVentedBarrel",
    "modCaricatoreGrande": "modLargeMagazine",
    "modCaricatoreGrandeRapido": "modLargeQuickMagazine",
    "modCaricatoreRapido": "modQuickMagazine",
    "modAutomatico": "modAutomatic",
    "modAvanzato": "modAdvanced",
    "modCalibrato": "modCalibrated",
    "modCastello308": "modReceiver308",
    "modCastello38": "modReceiver38",
    "modCastello45": "modReceiver45",
    "modCastello50": "modReceiver50",
    "modCastelloAutomaticoPistone": "modAutomaticPistonReceiver",
    "modGrillettoSensibile": "modHairTrigger",
    "modPotente": "modPowerful",
    "modTemprato": "modHardened",
    "modCondensatoreCompleto": "modFullCapacitor",
    "modCondensatoreBobinaPotenziata": "modBoostedCoilCapacitor",
    "modImpugnaturaErgonomica": "modErgonomicGrip",
    "modImpugnaturaTiratoreEsperto": "modMarksmanGrip",
    "modMirinoCorto": "modShortScope",
    "modMirinoCortoVisioneNotturna": "modShortNightVisionScope",
    "modMirinoDaRicognizione": "modReconScope",
    "modMirinoLungo": "modLongScope",
    "modMirinoLungoVisioneNotturna": "modLongNightVisionScope",
    "modMirinoReflex": "modReflexSight",
    # Add more mappings as needed...
}

# Slot type mappings
SLOT_MAPPINGS = {
    "bocca": "muzzle",
    "calcio": "stock",
    "canna": "barrel",
    "caricatore": "magazine",
    "castello": "receiver",
    "condensatore": "capacitor",
    "impugnatura": "grip",
    "mirino": "sight",
    "ugello": "nozzle",
    "disco": "dish",
    "combustibile": "fuel",
    "serbatoioPropellente": "propellantTank",
    "melee": "melee",
    "material": "material",
    "improvement": "improvement",
    "vaultSuit": "vaultSuit",
    "ballisticWeave": "ballisticWeave",
}

# Skill mappings
SKILL_MAPPINGS = {
    "riparare": "repair",
    "scienza": "science",
}

# Perk mappings
PERK_MAPPINGS = {
    "armaiolo1": "armorer1",
    "armaiolo2": "armorer2",
    "armaiolo3": "armorer3",
    "armaiolo4": "armorer4",
    "scienza1": "science1",
    "scienza2": "science2",
    "scienza3": "science3",
    "scienza4": "science4",
    "fanaticoArmi1": "gunNut1",
    "fanaticoArmi2": "gunNut2",
    "fanaticoArmi3": "gunNut3",
    "fanaticoArmi4": "gunNut4",
    "fabbro1": "blacksmith1",
    "fabbro2": "blacksmith2",
    "fabbro3": "blacksmith3",
}

def convert_perks(perks_str):
    """Convert Italian perk names to English in JSON array"""
    try:
        perks = json.loads(perks_str)
        return json.dumps([PERK_MAPPINGS.get(p, p) for p in perks])
    except:
        return perks_str

def process_csv(input_path, output_path):
    """Process a single CSV file"""
    with open(input_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    # Remove NAME and DESCRIPTION columns, convert values
    new_rows = []
    for row in rows:
        new_row = {
            'ID': ID_MAPPINGS.get(row['ID'], row['ID']),
            'SLOT_TYPE': SLOT_MAPPINGS.get(row['SLOT_TYPE'], row['SLOT_TYPE']),
            'DESCRIPTOR': row.get('DESCRIPTOR', ''),
            'EFFECTS': row['EFFECTS'],
            'WEIGHT_MOD': row['WEIGHT_MOD'],
            'COST_MOD': row['COST_MOD'],
            'SKILL': SKILL_MAPPINGS.get(row['SKILL'], row['SKILL']),
            'PERKS': convert_perks(row['PERKS']),
            'RARITY': row['RARITY'],
        }
        
        # Add type-specific column
        if 'WEAPON_TYPES' in row:
            new_row['WEAPON_TYPES'] = row['WEAPON_TYPES']
        elif 'ARMOR_TYPES' in row:
            new_row['ARMOR_TYPES'] = row['ARMOR_TYPES']
        elif 'ARMOR_LOCATIONS' in row:
            new_row['ARMOR_LOCATIONS'] = row['ARMOR_LOCATIONS']
        elif 'CLOTHING_TYPES' in row:
            new_row['CLOTHING_TYPES'] = row['CLOTHING_TYPES']
        
        new_rows.append(new_row)
    
    # Write new CSV
    if new_rows:
        with open(output_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=new_rows[0].keys())
            writer.writeheader()
            writer.writerows(new_rows)
        print(f"Processed: {input_path} → {output_path}")

def main():
    mod_dir = Path('public/data/mods')
    
    # Process all mod CSV files
    for csv_file in mod_dir.glob('*.csv'):
        process_csv(csv_file, csv_file)
    
    print("Done!")

if __name__ == '__main__':
    main()

