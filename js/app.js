// Get references to DOM elements
const tabButtons = document.querySelectorAll('.tab');
const screens = document.querySelectorAll('.screen');
const specialStrengthDisplay = document.getElementById('special-strength-value');
const specialPerceptionDisplay = document.getElementById('special-perception-value');
const specialEnduranceDisplay = document.getElementById('special-endurance-value');
const specialCharismaDisplay = document.getElementById('special-charisma-value');
const specialIntelligenceDisplay = document.getElementById('special-intelligence-value');
const specialAgilityDisplay = document.getElementById('special-agility-value');
const specialLuckDisplay = document.getElementById('special-luck-value');
const defenseDisplay = document.getElementById('defense-value');
const initiativeDisplay = document.getElementById('initiative-value');
const meleeDamageDisplay = document.getElementById('melee-damage-value');

const skillAthleticsValue = document.getElementById('skill-athletics');
const skillBarterValue = document.getElementById('skill-barter');
const skillBigGunsValue = document.getElementById('skill-bigGuns');
const skillEnergyWeaponsValue = document.getElementById('skill-energyWeapons');
const skillExplosivesValue = document.getElementById('skill-explosives');
const skillLockpickValue = document.getElementById('skill-lockpick');
const skillMedicineValue = document.getElementById('skill-medicine');
const skillMeleeWeaponsValue = document.getElementById('skill-meleeWeapons');
const skillPilotValue = document.getElementById('skill-pilot');
const skillRepairValue = document.getElementById('skill-repair');
const skillScienceValue = document.getElementById('skill-science');
const skillSmallGunsValue = document.getElementById('skill-smallGuns');
const skillSneakValue = document.getElementById('skill-sneak');
const skillSpeechValue = document.getElementById('skill-speech');
const skillSurvivalValue = document.getElementById('skill-survival');
const skillThrowingValue = document.getElementById('skill-throwing');
const skillUnarmedValue = document.getElementById('skill-unarmed');

const specialtyAthletics = document.getElementById('specialty-athletics');
const specialtyBarter = document.getElementById('specialty-barter');
const specialtyBigGuns = document.getElementById('specialty-bigGuns');
const specialtyEnergyWeapons = document.getElementById('specialty-energyWeapons');
const specialtyExplosives = document.getElementById('specialty-explosives');
const specialtyLockpick = document.getElementById('specialty-lockpick');
const specialtyMedicine = document.getElementById('specialty-medicine');
const specialtyMeleeWeapons = document.getElementById('specialty-meleeWeapons');
const specialtyPilot = document.getElementById('specialty-pilot');
const specialtyRepair = document.getElementById('specialty-repair');
const specialtyScience = document.getElementById('specialty-science');
const specialtySmallGuns = document.getElementById('specialty-smallGuns');
const specialtySneak = document.getElementById('specialty-sneak');
const specialtySpeech = document.getElementById('specialty-speech');
const specialtySurvival = document.getElementById('specialty-survival');
const specialtyThrowing = document.getElementById('specialty-throwing');
const specialtyUnarmed = document.getElementById('specialty-unarmed');

const playerCapsDisplay = document.getElementById('player-caps');
const carryWeightDisplay = document.getElementById('carry-weight');
const weaponList = document.getElementById('weapon-list');
const ammoList = document.getElementById('ammo-list');
const objectList = document.getElementById('object-list');
const characterBackgroundInput = document.getElementById('character-background');
const gameMapDisplay = document.getElementById('game-map');
const radioControlsDisplay = document.getElementById('radio-controls');
const editStatsButton = document.getElementById('edit-stats-button'); // New button

// Character data (load from localStorage or use defaults)
let characterData = JSON.parse(localStorage.getItem('characterData')) || {
    special: {
        strength: 5,
        perception: 5,
        endurance: 5,
        charisma: 5,
        intelligence: 5,
        agility: 5,
        luck: 5
    },
    defense: 0,
    initiative: 0,
    meleeDamage: 0,
    skills: {  
        athletics: 0,
        barter: 0,
        bigGuns: 0,
        energyWeapons: 0,
        explosives: 0,
        lockpick: 0,
        medicine: 0,
        meleeWeapons: 0,
        pilot: 0,
        repair: 0,
        science: 0,
        smallGuns: 0,
        sneak: 0,
        speech: 0,
        survival: 0,
        throwing: 0,
        unarmed: 0,
    },
    specialties: ['repair'],
    caps: 0,
    currentCarryWeight: { current: 0 },
    weapons: [
        { name: 'Fucile al Plasma', ability: 'Armi ad Energia', nb: 20, special: '-', damage: 30, effects: 'Bruciatura', type: 'Fucile', rate: 'Media', range: 'Buona', quality: 'Ottima', ammo: 'Celle al Plasma', weight: 5.5 }
    ],
    ammo: [
        { name: '9mm', quantity: 100 },
        { name: 'Celle al Plasma', quantity: 50 }
    ],
    objects: [
        { name: 'Stimpack', description: 'Cura una moderata quantità di danni.', weight: 0.1 },
        { name: 'Acqua Purificata', description: 'Riduce la sete e la leggera radiazioni.', weight: 0.5 }
    ],
    background: "[Background Placeholder]",
    map: "[Map Placeholder]"
};

let isEditing = false; // Track editing state

// Function to update the display
function updateDisplay() {
    specialStrengthDisplay.textContent = characterData.special.strength;
    specialPerceptionDisplay.textContent = characterData.special.perception;
    specialEnduranceDisplay.textContent = characterData.special.endurance;
    specialCharismaDisplay.textContent = characterData.special.charisma;
    specialIntelligenceDisplay.textContent = characterData.special.intelligence;
    specialAgilityDisplay.textContent = characterData.special.agility;
    specialLuckDisplay.textContent = characterData.special.luck;

    defenseDisplay.textContent = (characterData.special.agility <= 8 ) ? "1" : "2";
    initiativeDisplay.textContent = `${characterData.special.agility + characterData.special.perception}`;

    if (characterData.special.strength < 7) {
        meleeDamageDisplay.textContent = "+1";
    } else if (characterData.special.strength >= 7 && characterData.special.strength <= 8) {
        meleeDamageDisplay.textContent = "+2";
    } else if (characterData.special.strength >= 9 && characterData.special.strength <= 10) {
        meleeDamageDisplay.textContent = "+3";
    } else if (characterData.special.strength >= 11) {
        meleeDamageDisplay.textContent = "+4";
    } else {
        meleeDamageDisplay.textContent = "0"; // Default case if strength is not within specified ranges.
    }


    skillAthleticsValue.textContent = characterData.skills.athletics;
    skillBarterValue.textContent = characterData.skills.barter;
    skillBigGunsValue.textContent = characterData.skills.bigGuns;
    skillEnergyWeaponsValue.textContent = characterData.skills.energyWeapons;
    skillExplosivesValue.textContent = characterData.skills.explosives;
    skillLockpickValue.textContent = characterData.skills.lockpick;
    skillMedicineValue.textContent = characterData.skills.medicine;
    skillMeleeWeaponsValue.textContent = characterData.skills.meleeWeapons;
    skillPilotValue.textContent = characterData.skills.pilot;
    skillRepairValue.textContent = characterData.skills.repair;
    skillScienceValue.textContent = characterData.skills.science;
    skillSmallGunsValue.textContent = characterData.skills.smallGuns;
    skillSneakValue.textContent = characterData.skills.sneak;
    skillSpeechValue.textContent = characterData.skills.speech;
    skillSurvivalValue.textContent = characterData.skills.survival;
    skillThrowingValue.textContent = characterData.skills.throwing;
    skillUnarmedValue.textContent = characterData.skills.unarmed;


    specialtyAthletics.checked = characterData.specialties.includes('athletics');
    specialtyBarter.checked = characterData.specialties.includes('barter');
    specialtyBigGuns.checked = characterData.specialties.includes('bigGuns');
    specialtyEnergyWeapons.checked = characterData.specialties.includes('energyWeapons');
    specialtyExplosives.checked = characterData.specialties.includes('explosives');
    specialtyLockpick.checked = characterData.specialties.includes('lockpick');
    specialtyMedicine.checked = characterData.specialties.includes('medicine');
    specialtyMeleeWeapons.checked = characterData.specialties.includes('meleeWeapons');
    specialtyPilot.checked = characterData.specialties.includes('pilot');
    specialtyRepair.checked = characterData.specialties.includes('repair');
    specialtyScience.checked = characterData.specialties.includes('science');
    specialtySmallGuns.checked = characterData.specialties.includes('smallGuns');
    specialtySneak.checked = characterData.specialties.includes('sneak');
    specialtySpeech.checked = characterData.specialties.includes('speech');
    specialtySurvival.checked = characterData.specialties.includes('survival');
    specialtyThrowing.checked = characterData.specialties.includes('throwing');
    specialtyUnarmed.checked = characterData.specialties.includes('unarmed');


    playerCapsDisplay.textContent = characterData.caps;
    carryWeightDisplay.textContent = `${characterData.currentCarryWeight} / ${75 + characterData.special.strength * 5}`;
    characterBackgroundInput.value = characterData.background;
    gameMapDisplay.textContent = characterData.map;

    weaponList.innerHTML = characterData.weapons.map(weapon => `
        <li>
            <div class="weapon-item">
                <span class="weapon-name">${weapon.name}</span>
                <span class="weapon-ability">Abilità: ${weapon.ability}</span>
                <span class="weapon-nb">NB: ${weapon.nb}</span>
                <span class="weapon-special">Spec: ${weapon.special}</span>
                <span class="weapon-damage">Danno: ${weapon.damage}</span>
                <span class="weapon-effects">Effetti: ${weapon.effects}</span>
                <span class="weapon-type">Tipo: ${weapon.type}</span>
                <span class="weapon-rate">Cadenza: ${weapon.rate}</span>
                <span class="weapon-range">Gittata: ${weapon.range}</span>
                <span class="weapon-quality">Qualità: ${weapon.quality}</span>
                <span class="weapon-ammo">Munizioni: ${weapon.ammo}</span>
                <span class="weapon-weight">Peso: ${weapon.weight}</span>
            </div>
        </li>
    `).join('');

    ammoList.innerHTML = characterData.ammo.map(ammo => `
        <li><span class="ammo-name">${ammo.name}</span> <span class="ammo-quantity">x ${ammo.quantity}</span></li>
    `).join('');

    objectList.innerHTML = characterData.objects.map(object => `
        <li>
            <div class="object-item">
                <span class="object-name">${object.name}</span>
                <span class="object-description">${object.description}</span>
                <span class="object-weight">Peso: ${object.weight}</span>
            </div>
        </li>
    `).join('');

    // Save to localStorage
    localStorage.setItem('characterData', JSON.stringify(characterData));
}

// Function to toggle edit mode
function toggleEditMode() {
    isEditing = !isEditing;

    // Toggle contentEditable on relevant elements
    specialStrengthDisplay.contentEditable = isEditing;
    specialPerceptionDisplay.contentEditable = isEditing;
    specialEnduranceDisplay.contentEditable = isEditing;
    specialCharismaDisplay.contentEditable = isEditing;
    specialIntelligenceDisplay.contentEditable = isEditing;
    specialAgilityDisplay.contentEditable = isEditing;
    specialLuckDisplay.contentEditable = isEditing;
    defenseDisplay.contentEditable = isEditing;
    initiativeDisplay.contentEditable = isEditing;
    meleeDamageDisplay.contentEditable = isEditing;

    // Toggle event listeners on special stat boxes
    const specialStatBoxes = document.querySelectorAll('.stat');
    specialStatBoxes.forEach(box => {
        if (isEditing) {
            box.addEventListener('click', incrementSpecialStat);
        } else {
            box.removeEventListener('click', incrementSpecialStat);
        }
    });


    skillAthleticsValue.contentEditable = isEditing;
    skillBarterValue.contentEditable = isEditing;
    skillBigGunsValue.contentEditable = isEditing;
    skillEnergyWeaponsValue.contentEditable = isEditing;
    skillExplosivesValue.contentEditable = isEditing;
    skillLockpickValue.contentEditable = isEditing;
    skillMedicineValue.contentEditable = isEditing;
    skillMeleeWeaponsValue.contentEditable = isEditing;
    skillPilotValue.contentEditable = isEditing;
    skillRepairValue.contentEditable = isEditing;
    skillScienceValue.contentEditable = isEditing;
    skillSmallGunsValue.contentEditable = isEditing;
    skillSneakValue.contentEditable = isEditing;
    skillSpeechValue.contentEditable = isEditing;
    skillSurvivalValue.contentEditable = isEditing;
    skillThrowingValue.contentEditable = isEditing;
    skillUnarmedValue.contentEditable = isEditing;

    // Toggle event listeners on skills
    const skillBoxes = document.querySelectorAll('.skill'); // Or whatever the parent element is
    skillBoxes.forEach(box => {
        const checkbox = box.querySelector('input[type="checkbox"]');
        if (isEditing) {
            box.addEventListener('click', incrementSkill);
            if (checkbox)
                checkbox.disabled = false;
        } else {
            box.removeEventListener('click', incrementSkill);
            if (checkbox) checkbox.disabled = true;
        }
    });

    // Update button text
    editStatsButton.textContent = isEditing ? 'Save Stats' : 'Edit Stats';
}

// Function to increment special stat values
function incrementSpecialStat(event) {
    if (!isEditing) return; // Only increment if editing

    const box = event.currentTarget;
    const statId = box.querySelector('.stat-value').id;
    let statValue;

    switch (statId) {
        case 'special-strength-value':
            statValue = characterData.special.strength;
            characterData.special.strength = (statValue < 12) ? statValue + 1 : 4;
            break;
        case 'special-perception-value':
            statValue = characterData.special.perception;
            characterData.special.perception = (statValue < 10) ? statValue + 1 : 4;
            break;
        case 'special-endurance-value':
            statValue = characterData.special.endurance;
            characterData.special.endurance = (statValue < 12) ? statValue + 1 : 4;
            break;
        case 'special-charisma-value':
            statValue = characterData.special.charisma;
            characterData.special.charisma = (statValue < 10) ? statValue + 1 : 4;
            break;
        case 'special-intelligence-value':
            statValue = characterData.special.intelligence;
            characterData.special.intelligence = (statValue < 10) ? statValue + 1 : 4;
            break;
        case 'special-agility-value':
            statValue = characterData.special.agility;
            characterData.special.agility = (statValue < 10) ? statValue + 1 : 4;
            break;
        case 'special-luck-value':
            statValue = characterData.special.luck;
            characterData.special.luck = (statValue < 10) ? statValue + 1 : 4;
            break;
        default:
            return;
    }

    updateDisplay(); // Refresh display with updated data
}

function incrementSkill(event) {
    if (!isEditing) return; // Only increment if editing

    const box = event.currentTarget;
    const skillId = box.querySelector('.skill-value').id;
    const skillName = skillId.replace('skill-', '');

    const checkboxId = `specialty-${skillName}`;
    const checkbox = box.querySelector(`input[type="checkbox"][id="${checkboxId}"]`);

    // Check if the click originated from the checkbox
    if (event.target === checkbox) {
        if (checkbox.checked && !characterData.specialties.includes(skillName)) {
            characterData.specialties.push(skillName);
            if (characterData.skills[skillName] < 2)
                characterData.skills[skillName] = 2;
        }
        else if (!checkbox.checked && characterData.specialties.includes(skillName)) {
            const indexToRemove = characterData.specialties.indexOf(skillName);
            if(indexToRemove > -1)
                characterData.specialties.splice(indexToRemove, 1);
        }
    } else if (characterData.skills.hasOwnProperty(skillName)) {
        let skillValue = characterData.skills[skillName];
        characterData.skills[skillName] = (skillValue < 6)
            ? skillValue + 1
            : (checkbox && checkbox.checked ? 2 : 0);

    } else {
        console.warn(`Skill with ID ${skillId} not found in characterData.skills.`);
    }
    updateDisplay(); // Refresh display with updated data
}

// Event listener for tab clicks
tabButtons.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab');
        tabButtons.forEach(t => t.classList.remove('active'));
        screens.forEach(s => s.classList.add('hidden'));
        tab.classList.add('active');
        document.getElementById(`${targetTab}-screen`).classList.remove('hidden');
    });
});

// Event listener for edit stats button
editStatsButton.addEventListener('click', () => {
    toggleEditMode();

    if (!isEditing) {
        updateDisplay(); // Refresh display with updated data
    }
});

const checkboxes = document.querySelectorAll('input[type="checkbox"]');
checkboxes.forEach(checkbox => {
    checkbox.disabled = true;
});

const clearLocalStorageButton = document.getElementById('clear-local-storage');
clearLocalStorageButton.addEventListener('click', () => {
    localStorage.clear();
});



async function loadCSV(filePath) {
    try {
        const response = await fetch(filePath);
        const csvData = await response.text();
        return parseCSV(csvData);
    } catch (error) {
        console.error("Error loading CSV:", error);
        return [];
    }
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
        return [];
    }

    const headers = lines[0].split(',').map(header => header.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = [];
        let inQuotes = false;
        let currentValue = '';

        for (let k = 0; k < line.length; k++) {
            const char = line[k];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim()); // Push the last value

        if (values.length === headers.length) {
            const entry = {};
            for (let j = 0; j < headers.length; j++) {
                entry[headers[j]] = values[j];
            }
            data.push(entry);
        } else {
            console.warn(`Skipping row ${i + 1} due to inconsistent number of columns.`);
        }
    }

    return data;
}

async function loadWeapons() {
    let weaponData = await loadCSV('data/weapons/smallGuns.csv');
    weaponData = weaponData.concat(await loadCSV('data/weapons/energyWeapons.csv'));
    weaponData = weaponData.concat(await loadCSV('data/weapons/bigGuns.csv'));
    weaponData = weaponData.concat(await loadCSV('data/weapons/meleeWeapons.csv'));
    return weaponData
}

async function populateTable() {
    const weaponData = await loadWeapons();
    const tableBody = document.getElementById("armiLeggereTableBody");


    const toAdd = [];
    weaponData.forEach(e => toAdd.push(e["WEAPON_ID"]));


    toAdd.forEach(weaponId => {
        const weapon = weaponData.find(row => row["WEAPON_ID"] === weaponId);
        const row = tableBody.insertRow();
        row.insertCell().textContent = weapon["WEAPON_ID"] || "";
        row.insertCell().textContent = weapon["SKILL"] || "";
        row.insertCell().textContent = weapon["DAMAGE_RATING"] || "";
        row.insertCell().textContent = weapon["EFFECTS"] || "";
        row.insertCell().textContent = weapon["DAMAGE_TYPE"] || "";
        row.insertCell().textContent = weapon["FIRE_RATE"] || "";
        row.insertCell().textContent = weapon["RANGE"] || "";
        row.insertCell().textContent = weapon["QUALITIES"] || "";
        row.insertCell().textContent = weapon["AMMO_TYPE"] || "";
    });
}

// Call the function to load and populate the table when the page loads
populateTable();

function createWeaponCard(weaponId, weaponData) {
    const weapon = weaponData.find(row => row.WEAPON_ID === weaponId);

    if (!weapon) {
        console.error(`Weapon data not found for ID: ${weaponId}`);
        return null;
    }

    const cardHTML = `
        <div class="card">
            <div class="header">
                <div class="weapon-name">${weapon.WEAPON_ID}</div>
                <div class="right-header">
                    <div class="cost"><div>Cost</div><div>${weapon.COST}</div></div>
                    <div class="weight"><div>Weight</div><div>${weapon.WEIGHT} kg</div></div>
                    <div class="rarity"><div>Rarity</div><div>${weapon.RARITY}</div></div>
                </div>
                <div class="details"><b>${weapon.SKILL}</b> - ${weapon.AMMO_TYPE}</div>
            </div>
            <div class="card-content">
                <div class="image">
                    <img src="img/${weapon.SKILL}.svg" alt="${weapon.WEAPON_ID}">
                </div>
                <div class="stats">
                    <div class="damage"><div>Damage Dice</div><div>${weapon.DAMAGE_RATING}</div><div>${weapon.DAMAGE_TYPE}</div></div>
                    <div class="rate"><div>Fire Rate</div><div>${weapon.FIRE_RATE}</div></div>
                    <div class="range"><div>Range</div><div>${weapon.RANGE}</div></div>
                </div>
                <div class="description">
                    ${weapon.DESCRIPTION.split('. ').map(paragraph => `<p>${paragraph}</p>`).join('')}
                </div>
            </div>
        </div>
    `;

    const card = document.createElement('div');
    card.innerHTML = cardHTML;

    return card; // Return the actual card element
}
document.addEventListener("DOMContentLoaded", async () => {
    // const weaponIds = ["Pistola 44", "Fat Man", "Pistola Gamma"]; // Add more weapon IDs as needed

    const weaponData = await loadWeapons();
    const weaponIds = weaponData.map(w => w.WEAPON_ID)
    const container = document.getElementById("inv-screen"); // Or another element where you want to add the cards

    for (const weaponId of weaponIds) {
        const weaponCard = createWeaponCard(weaponId, await loadWeapons());
        if (weaponCard) { // Check if createWeaponCard was successful
            container.appendChild(weaponCard);
        }
    }
});

// Initial display update
updateDisplay();