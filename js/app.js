// Get references to DOM elements
const tabButtons = document.querySelectorAll('.tab');
const screens = document.querySelectorAll('.screen');


const defenseDisplay = document.getElementById('defense-value');
const initiativeDisplay = document.getElementById('initiative-value');
const meleeDamageDisplay = document.getElementById('melee-damage-value');


const playerCapsDisplay = document.getElementById('player-caps');
const carryWeightDisplay = document.getElementById('carry-weight');

const characterBackgroundInput = document.getElementById('character-background');
const gameMapDisplay = document.getElementById('game-map');

const editStatsButton = document.getElementById('edit-stats-button'); // New button

const specialList = [
    "strength",
    "perception",
    "endurance",
    "charisma",
    "intelligence",
    "agility",
    "luck"
]
const specialDisplays = specialList.reduce((acc, special) => {
    acc[special] = document.getElementById("special-" + special + "-value");
    return acc;
}, {});
const skill2special = {
        athletics: "strength",
        barter: "charisma",
        bigGuns: "endurance",
        energyWeapons: "perception",
        explosives: "perception",
        lockpick: "perception",
        medicine: "intelligence",
        meleeWeapons: "strength",
        pilot: "perception",
        repair: "intelligence",
        science: "intelligence",
        smallGuns: "agility",
        sneak: "agility",
        speech: "charisma",
        survival: "endurance",
        throwing: "agility",
        unarmed: "strength",
};
const skillDisplays = Object.keys(skill2special).reduce((acc, skill) => {
    acc[skill] = document.getElementById("skill-" + skill);
    return acc;
}, {});

const specialtyDisplays = Object.keys(skill2special).reduce((acc, skill) => {
    acc[skill] = document.getElementById("specialty-" + skill);
    return acc;
}, {});


const skillBoxes = document.querySelectorAll('.skill');

// Character data (load from localStorage or use defaults)
let defaultCharacter = undefined;
let characterData = undefined;

let isEditing = false; // Track editing state
let weaponData = undefined;

// Function to update the display
function updateDisplay() {
    specialList.forEach(special => specialDisplays[special].textContent = characterData.special[special])

    defenseDisplay.textContent = (characterData.special.agility <= 8) ? "1" : "2";
    initiativeDisplay.textContent = `${characterData.special.agility + characterData.special.perception}`;

    const str = characterData.special.strength;
    if (str < 7) {
        meleeDamageDisplay.textContent = "+1";
    } else if (str >= 7 && str <= 8) {
        meleeDamageDisplay.textContent = "+2";
    } else if (str >= 9 && str <= 10) {
        meleeDamageDisplay.textContent = "+3";
    } else if (str >= 11) {
        meleeDamageDisplay.textContent = "+4";
    } else {
        meleeDamageDisplay.textContent = "0"; // Default case if strength is not within specified ranges.
    }

    Object.keys(skill2special).forEach(skill => {
        skillDisplays[skill].textContent = characterData.skills[skill];
        specialtyDisplays[skill].checked = characterData.specialties.includes(skill);
    });


    playerCapsDisplay.textContent = characterData.caps;

    const weapons = characterData.weapons === "*" ? weaponData : characterData.weapons.map(wId => weaponData.find(w => w.WEAPON_ID === wId));
    const container = document.getElementById("weapon-cards");
    for (weaponId of characterData.weapons) {
        const weaponCard = createWeaponCard(weaponId);
        if (weaponCard) { // Check if createWeaponCard was successful
            container.appendChild(weaponCard);
        }
    }

    const currentWeight = weapons
        .map(w => w.WEIGTH)
        .reduce((acc, weight) => acc + weight==="<0.5" ? 0 : weight, 0);
    const maxWeight = 75 + str * 5
    carryWeightDisplay.textContent = `${currentWeight} / ${maxWeight}`;
    carryWeightDisplay.style.color = currentWeight > maxWeight ? 'red' : "#afff03";

    characterBackgroundInput.value = characterData.background;
    gameMapDisplay.textContent = characterData.map;


    // Call the function to load and populate the table when the page loads
    populateTable();

    // Save to localStorage
    localStorage.setItem('characterData', JSON.stringify(characterData));
}

// Function to toggle edit mode
function toggleEditMode() {
    isEditing = !isEditing;

    // TODO should probably not set editing, but still the "effect" when gear is clicked is cool
    specialList.forEach(special => specialDisplays[special].contentEditable = isEditing)

    // Toggle event listeners on special stat boxes
    const specialStatBoxes = document.querySelectorAll('.stat');
    specialStatBoxes.forEach(box => {
        box.addEventListener('click', incrementSpecialStat);
    });


    // TODO as above, but here i did not leave the contentEditable = true (as i don't remember any "effect" here)

    // Toggle event listeners on skills
    const skillBoxes = document.querySelectorAll('.skill'); // Or whatever the parent element is
    skillBoxes.forEach(box => {
        const checkbox = box.querySelector('input[type="checkbox"]');
        if(checkbox)
            checkbox.disabled = !isEditing;
    });

    // Update button text
    editStatsButton.textContent = isEditing ? 'Save Stats' : 'Edit Stats'; // TODO Translation
}

// Function to increment special stat values
function incrementSpecialStat(event) {
    if (!isEditing) return; // Only increment if editing

    const box = event.currentTarget;
    const statId = box.querySelector('.stat-value').id;

    const special = statId.replace('special-', '').replace('-value', '');
    const maxValue = special === "strength" || special === "endurance" ? 12 : 10;
    characterData.special[special] = (characterData.special[special] < maxValue ? characterData.special[special] + 1 : 4)

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

skillBoxes.forEach(box => {
    const checkbox = box.querySelector('input[type="checkbox"]');
    box.addEventListener('click', function (evt) {
        if(isEditing)
            incrementSkill(evt);
        else
            openMyPopup();
    });
});

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

// TODO just the specialty checkboxes
const checkboxes = document.querySelectorAll('input[type="checkbox"]');
checkboxes.forEach(checkbox => {
    checkbox.disabled = true;
});

const clearLocalStorageButton = document.getElementById('clear-local-storage');
clearLocalStorageButton.addEventListener('click', async () => {
    localStorage.clear();
    let confirmedStorageWipe = confirm("Are you really sure you want to DELETE YOUR CHARACTER and every other saved data?")
    if (confirmedStorageWipe) {
        localStorage.clear();
        alert("Local data was wiped");
        characterData = defaultCharacter
        updateDisplay()

    }
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

async function loadJSON(filePath) {
    const response = await fetch(filePath);
    if (!response.ok) {
        console.error("Could not load or parse JSON:", error);
        return null;
    }
    return await response.json();
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
    let data = await loadCSV('data/weapons/smallGuns.csv');
    data = data.concat(await loadCSV('data/weapons/energyWeapons.csv'));
    data = data.concat(await loadCSV('data/weapons/bigGuns.csv'));
    data = data.concat(await loadCSV('data/weapons/meleeWeapons.csv'));
    data = data.concat(await loadCSV('data/weapons/throwing.csv'));
    data = data.concat(await loadCSV('data/weapons/explosives.csv'));
    return data
}

function populateTable() {
    const tableBody = document.getElementById("armiLeggereTableBody");


    const toAdd = [];
    weaponData.forEach(e => toAdd.push(e["WEAPON_ID"]));


    toAdd.forEach(weaponId => {
        const weapon = weaponData.find(row => row["WEAPON_ID"] === weaponId);
        const row = tableBody.insertRow();
        row.insertCell().textContent = weapon["WEAPON_ID"] || "";
        row.insertCell().dataLangId = weapon["SKILL"] || "na";
        row.insertCell().textContent = weapon["DAMAGE_RATING"] || "";
        row.insertCell().textContent = weapon["EFFECTS"] || "";
        row.insertCell().textContent = weapon["DAMAGE_TYPE"] || "";
        row.insertCell().textContent = weapon["FIRE_RATE"] || "";
        row.insertCell().textContent = weapon["RANGE"] || "";
        row.insertCell().textContent = weapon["QUALITIES"] || "";
        row.insertCell().dataLangId = weapon["AMMO_TYPE"] || "na";
    });
}


function createWeaponCard(weaponId) {
    const weapon = weaponData.find(row => row.WEAPON_ID === weaponId);

    if (!weapon) {
        console.error(`Weapon data not found for ID: ${weaponId}`);
        return null;
    }

    const ammoCount = weapon.AMMO_TYPE==="na" ? "-" : "x"+(characterData.ammo[weapon.AMMO_TYPE] || 0);

    const cardHTML = `
        <div class="card">
            <div class="header">
                <div class="weapon-name">${weapon.WEAPON_ID}</div>
                <div class="right-header">
                    <div class="right-header-item"><div>Cost</div><div>${weapon.COST}</div></div>
                    <div class="right-header-item"><div>Weight</div><div>${weapon.WEIGHT} kg</div></div>
                    <div class="right-header-item"><div>Rarity</div><div>${weapon.RARITY}</div></div>
                </div>
            </div>
            <div class="card-content">
                <div class="stats" id="stats-left">
                    <div class="weapon-stat">
                        <div data-lang-id="${weapon.SKILL}"></div>
                        <div>To Hit: ${characterData.skills[`${weapon.SKILL}`]+characterData.special[skill2special[weapon.SKILL]]}</div>
                        <div>To Crit: ${Math.max(characterData.skills[`${weapon.SKILL}`], 1)}</div>
                    </div>
                    <div class="weapon-stat">
                        <div data-lang-id="${weapon.AMMO_TYPE}"></div>
                        <div>${ammoCount}</div>
                    </div>
                    <button class="attack-button" onclick="openMyPopup()"></button>
                </div>
                <div class="image">
                    <img src="img/${weapon.SKILL}.svg" alt="${weapon.WEAPON_ID}">
                </div>
                <div class="stats" id="stats-right">
                    <div class="weapon-stat"><div>Damage Dice</div><div>${weapon.DAMAGE_RATING}</div><div>${weapon.DAMAGE_TYPE}</div></div>
                    <div class="weapon-stat"><div>Fire Rate</div><div>${weapon.FIRE_RATE}</div></div>
                    <div class="weapon-stat"><div>Range</div><div>${weapon.RANGE}</div></div>
                </div>    
                <button class="description-toggle">Show Description</button>
                <div class="description-container">
                    <div class="description">
                        ${weapon.DESCRIPTION.split('. ').map(paragraph => `<p>${paragraph}</p>`).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    const card = document.createElement('div');
    card.innerHTML = cardHTML;

    // Add event listener to this card's button
    const descriptionToggle = card.querySelector(".description-toggle");
    const descriptionContainer = card.querySelector(".description-container");

    descriptionToggle.addEventListener("click", () => {
        descriptionContainer.classList.toggle("expanded");
        if (descriptionContainer.classList.contains("expanded")) {
            descriptionToggle.textContent = "Hide Description";
        } else {
            descriptionToggle.textContent = "Show Description";
        }
    });

    return card; // Return the actual card element
}
document.addEventListener("DOMContentLoaded", async () => {
    // const weaponIds = ["Pistola 44", "Fat Man", "Pistola Gamma"]; // Add more weapon IDs as needed

    weaponData = await loadWeapons();
    defaultCharacter = await loadJSON('../data/defaultCharacter.json');
    characterData = JSON.parse(localStorage.getItem('characterData')) || defaultCharacter;
    const weaponIds = weaponData.map(w => w.WEAPON_ID)

    updateDisplay();
    loadTranslations(currentLanguage);
});