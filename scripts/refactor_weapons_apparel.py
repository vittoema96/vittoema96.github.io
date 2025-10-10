#!/usr/bin/env python3
"""
Script to refactor weapon and apparel CSV files:
1. Convert DAMAGE_TYPE from Italian to English IDs
2. Remove DESCRIPTION column and extract to i18n files
3. Convert AVAILABLE_MODS from Italian text to JSON arrays of English mod IDs
"""

import csv
import json
import re
from pathlib import Path

# Damage type mappings
DAMAGE_TYPE_MAP = {
    "Fisico": "physical",
    "Energia": "energy",
    "Radiazioni": "radiation",
    "Veleno": "damagePoison",
}

# Mod name mappings (Italian → English ID)
MOD_NAME_MAP = {
    # Small Gun Mods
    "Baionetta": "modBayonet",
    "Compensatore": "modCompensator",
    "Rompifiamma": "modFlashHider",
    "Silenziatore": "modSuppressor",
    "Calcio Completo": "modFullStock",
    "Calcio da Tiratore Scelto": "modMarksmanStock",
    "Calcio per Compensazione del Rinculo": "modRecoilCompensatingStock",
    "Canna Alettata": "modFinnedBarrel",
    "Canna Forata": "modPortedBarrel",
    "Canna Lunga": "modLongBarrel",
    "Canna Mozza": "modSawedOffBarrel",
    "Canna Ridotta": "modShortBarrel",
    "Canna Schermata": "modShieldedBarrel",
    "Canna Stabile": "modStableBarrel",
    "Canna Ventilata": "modVentedBarrel",
    "Caricatore Grande": "modLargeMagazine",
    "Caricatore Grande Rapido": "modLargeQuickMagazine",
    "Caricatore Rapido": "modQuickMagazine",
    "Automatico": "modAutomatic",
    "Avanzato": "modAdvanced",
    "Calibrato": "modCalibrated",
    "Castello .308": "modReceiver308",
    "Castello .38": "modReceiver38",
    "Castello .45": "modReceiver45",
    "Castello .50": "modReceiver50",
    "Castello Automatico a Pistone": "modAutomaticPistonReceiver",
    "Grilletto Sensibile": "modHairTrigger",
    "Potente": "modPowerful",
    "Temprato": "modHardened",
    "Condensatore Completo": "modFullCapacitor",
    "Condensatore con Bobina Potenziata": "modBoostedCoilCapacitor",
    "Impugnatura Ergonomica": "modErgonomicGrip",
    "Impugnatura da Tiratore Esperto": "modMarksmanGrip",
    "Mirino Corto": "modShortScope",
    "Mirino Corto Visione Notturna": "modShortNightVisionScope",
    "Mirino da Ricognizione": "modReconScope",
    "Mirino Lungo": "modLongScope",
    "Mirino Lungo Visione Notturna": "modLongNightVisionScope",
    "Mirino Reflex": "modReflexSight",
    # Armor Mods
    "indurita": "modHardened",
    "rinvenuta": "modAnnealed",
    "saldata": "modWelded",
    "temprata": "modTempered",
    "cuoioBollito": "modBoiledLeather",
    "cuoioBorchiato": "modStuddedLeather",
    "cuoioFasciato": "modBandedLeather",
    "cuoioOmbrato": "modShadowedLeather",
    "cuoioTrattato": "modTreatedLeather",
    "metalloInLega": "modAlloyedMetal",
    "metalloLucidato": "modPolishedMetal",
    "metalloOmbrato": "modShadowedMetal",
    "metalloSmaltato": "modEnamelledMetal",
    "metalloVerniciato": "modPaintedMetal",
    "fibraVetro": "modFiberglass",
    "ombrato": "modShadowed",
    "inPolimeri": "modPolymer",
    "rinforzato": "modReinforced",
    "laminato": "modLaminated",
    "microcarbonio": "modMicrocarbon",
    "nanofilamenti": "modNanofilament",
    "resina": "modResin",
    "leggera": "modLightweight",
    "capiente": "modPocketed",
    "moltoCapiente": "modDeepPocketed",
    "piombata": "modLeaded",
    "ultraleggera": "modUltralight",
    "altaDensita": "modDensity",
    "bioCommMesh": "modBioCommMesh",
    "imbottito": "modCushioned",
    "pneumatico": "modPneumatic",
    "rivestimentoAmianto": "modAsbestosLining",
    "aerodinamiche": "modStreamlined",
    "bilanciate": "modBalanced",
    "lavorate": "modCrafted",
    "picchiatore": "modBrawling",
    "stabilizzate": "modStabilized",
    "ammortizzate": "modShockAbsorbing",
    "attenuate": "modMuffled",
    "rivestimentoIsolante": "modInsulatedLining",
    "rivestimentoTrattato": "modTreatedLining",
    "rivestimentoResistente": "modResistantLining",
    "rivestimentoProtettivo": "modProtectiveLining",
    "rivestimentoSchermato": "modShieldedLining",
    "tramaBalistica": "modBallisticWeave",
    "tramaBalistica2": "modBallisticWeave2",
    "tramaBalistica3": "modBallisticWeave3",
    "tramaBalistica4": "modBallisticWeave4",
    "tramaBalistica5": "modBallisticWeave5",
}

def parse_italian_mods_text(text):
    """Parse Italian mod text and convert to English mod ID array"""
    if not text or text.strip() == "":
        return "[]"
    
    # Try to parse as JSON first (for apparel that already has JSON)
    try:
        mods = json.loads(text)
        # Convert Italian IDs to English
        english_mods = [MOD_NAME_MAP.get(mod, mod) for mod in mods]
        return json.dumps(english_mods)
    except:
        pass
    
    # Parse plain text format: "Bocca: Baionetta, Compensatore; Calcio: ..."
    mod_ids = []
    # Split by semicolon to get each slot section
    sections = text.split(';')
    for section in sections:
        # Split by colon to separate slot name from mod names
        if ':' in section:
            _, mods_text = section.split(':', 1)
            # Split by comma to get individual mod names
            mod_names = [m.strip() for m in mods_text.split(',')]
            for mod_name in mod_names:
                if mod_name in MOD_NAME_MAP:
                    mod_ids.append(MOD_NAME_MAP[mod_name])
    
    return json.dumps(mod_ids)

def process_weapon_csv(input_path, output_path, descriptions_en, descriptions_it):
    """Process a weapon CSV file"""
    with open(input_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    new_rows = []
    for row in rows:
        # Extract description for i18n
        item_id = row['ID']
        description = row.get('DESCRIPTION', '')
        if description:
            descriptions_it[f"{item_id}Description"] = description
            descriptions_en[f"{item_id}Description"] = ""  # Empty for manual translation
        
        # Convert damage type
        if 'DAMAGE_TYPE' in row:
            row['DAMAGE_TYPE'] = DAMAGE_TYPE_MAP.get(row['DAMAGE_TYPE'], row['DAMAGE_TYPE'])
        
        # Convert AVAILABLE_MODS
        if 'AVAILABLE_MODS' in row:
            row['AVAILABLE_MODS'] = parse_italian_mods_text(row['AVAILABLE_MODS'])
        
        # Remove DESCRIPTION column
        if 'DESCRIPTION' in row:
            del row['DESCRIPTION']
        
        new_rows.append(row)
    
    # Write new CSV
    if new_rows:
        fieldnames = list(new_rows[0].keys())
        with open(output_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(new_rows)
        print(f"Processed: {input_path}")

def process_apparel_csv(input_path, output_path, descriptions_en, descriptions_it):
    """Process an apparel CSV file"""
    with open(input_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    new_rows = []
    for row in rows:
        # Extract description for i18n
        item_id = row['ID']
        description = row.get('DESCRIPTION', '')
        if description:
            descriptions_it[f"{item_id}Description"] = description
            descriptions_en[f"{item_id}Description"] = ""  # Empty for manual translation
        
        # Convert AVAILABLE_MODS
        if 'AVAILABLE_MODS' in row:
            row['AVAILABLE_MODS'] = parse_italian_mods_text(row['AVAILABLE_MODS'])
        
        # Remove DESCRIPTION column
        if 'DESCRIPTION' in row:
            del row['DESCRIPTION']
        
        new_rows.append(row)
    
    # Write new CSV
    if new_rows:
        fieldnames = list(new_rows[0].keys())
        with open(output_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(new_rows)
        print(f"Processed: {input_path}")

def main():
    descriptions_en = {}
    descriptions_it = {}
    
    # Process weapon files
    weapon_dir = Path('public/data/weapon')
    for csv_file in ['smallGuns.csv', 'energyWeapons.csv', 'bigGuns.csv', 'meleeWeapons.csv']:
        input_path = weapon_dir / csv_file
        if input_path.exists():
            process_weapon_csv(input_path, input_path, descriptions_en, descriptions_it)
    
    # Process apparel files
    apparel_dir = Path('public/data/apparel')
    for csv_file in ['armor.csv', 'clothing.csv']:
        input_path = apparel_dir / csv_file
        if input_path.exists():
            process_apparel_csv(input_path, input_path, descriptions_en, descriptions_it)
    
    # Save descriptions to JSON files for manual addition to i18n
    with open('weapon_apparel_descriptions_en.json', 'w', encoding='utf-8') as f:
        json.dump(descriptions_en, f, indent=4, ensure_ascii=False)
    
    with open('weapon_apparel_descriptions_it.json', 'w', encoding='utf-8') as f:
        json.dump(descriptions_it, f, indent=4, ensure_ascii=False)
    
    print(f"\nExtracted {len(descriptions_it)} descriptions")
    print("Descriptions saved to weapon_apparel_descriptions_en.json and weapon_apparel_descriptions_it.json")
    print("Done!")

if __name__ == '__main__':
    main()

