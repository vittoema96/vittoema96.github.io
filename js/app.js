// Get references to DOM elements
const tabButtons = document.querySelectorAll('.tab');
const subtabButtons = document.querySelectorAll('.subtab');
const screens = document.querySelectorAll('.screen');
const subscreens = document.querySelectorAll('.subscreen');


const defenseDisplay = document.getElementById('defense-value');
const initiativeDisplay = document.getElementById('initiative-value');
const meleeDamageDisplay = document.getElementById('melee-damage-value');


const capsDisplay = document.getElementById('caps-value');
const weightDisplay = document.getElementById('weight-value');
const hpDisplay = document.getElementById('hp-value');

const levelDisplay = document.getElementById('level-display');

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
const luckCurrentValDisplay = document.getElementById('luck-current-value');
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
let activeTab = 'stat';
let activeSubtab = 'weapons';

let weaponData = undefined;
let foodData = undefined;
let drinksData = undefined;
let medsData = undefined;

// Function to update the display
function updateDisplay() {
    const str = characterData.special.strength

    const maxHp = characterData.special.endurance + characterData.special.luck + characterData.level
    hpDisplay.textContent = maxHp + "/" + maxHp; // TODO Should be "current / max"
    capsDisplay.textContent = characterData.caps;
    const currentWeight = characterData.weapons.map(key => weaponData[key])
            .concat(characterData.supplies.food.map(key => foodData[key]))
            .concat(characterData.supplies.drinks.map(key => drinksData[key]))
            .concat(characterData.supplies.meds.map(key => medsData[key]))
        .map(i => i.WEIGHT)
        .reduce((acc, weight) => {
            const parsed = Number(weight);
            return acc + (isNaN(parsed) ? 0 : parsed) // TODO as WEIGHT=<0.5 was changed to just 0, might not need this anymore
        }, 0);
    const maxWeight = 75 + str * 5
    weightDisplay.textContent = `${currentWeight}/${maxWeight}`;
    weightDisplay.style.color = currentWeight > maxWeight ? 'red' : "#afff03";

    if (activeTab === 'stat') {
        specialList.forEach(special => specialDisplays[special].textContent = characterData.special[special])
        luckCurrentValDisplay.textContent = characterData.luckCurrent;

        defenseDisplay.textContent = (characterData.special.agility <= 8) ? "1" : "2";
        initiativeDisplay.textContent = `${characterData.special.agility + characterData.special.perception}`;
        meleeDamageDisplay.textContent = str < 7 ? "+1" : str < 9 ? "+2" : str < 11 ? "+3" : "+4";

        Object.keys(skill2special).forEach(skill => {
            skillDisplays[skill].textContent = characterData.skills[skill];
            specialtyDisplays[skill].checked = characterData.specialties.includes(skill);
        });
        luckCurrentValDisplay.textContent = characterData.luckCurrent;
    } else if (activeTab === 'inv') {
        if (activeSubtab === 'weapons') {
            updateWeapons();
        } else if (activeSubtab === 'supplies') {
            updateSupplies();
        }
    } else if (activeTab === 'data') {
        characterBackgroundInput.value = characterData.background;
    } else { // === 'map'
        // Currently nothing here
    }

    levelDisplay.value = characterData.level;

    // Save to localStorage
    localStorage.setItem('characterData', JSON.stringify(characterData));

    loadTranslations(currentLanguage);
}

function updateWeapons() {
    // TODO optimize here, don't remove everything and re-add everything
    const weapons = characterData.weapons.map(key => weaponData[key]);
    const containers = {
        smallGuns: document.getElementById("smallGuns-cards"),
        energyWeapons: document.getElementById("energyWeapons-cards"),
        bigGuns: document.getElementById("bigGuns-cards"),
        meleeWeapons: document.getElementById("meleeWeapons-cards"),
        explosives: document.getElementById("explosives-cards"),
        throwing: document.getElementById("throwing-cards"),
    };
    for(let c of Object.values(containers))
        c.innerHTML = '';
    for (let weapon of weapons) {
        containers[weapon.SKILL].appendChild(createWeaponCard(weapon.ID));
    }
}

function updateSupplies() {
    // TODO optimize here, don't remove everything and re-add everything
    const supplies = {
        'food': foodData,
        'drinks': drinksData,
        'meds': medsData
    }
    const characterSupplies = {};
    for (let key of Object.keys(supplies)){
        const container = document.getElementById(key+"-cards");
        container.innerHTML = '';
        for(let item of characterData.supplies[key].map(item => supplies[key][item])) {
            container.appendChild(createObjectCard(item, key));
        }
    }
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
        const checkbox = box.querySelector('input[type="checkbox"][class="specialty-checkbox"]');
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
    if(special === "luck")
        characterData.luckCurrent = characterData.special.luck;inv

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
    box.addEventListener('click', function (evt) {
        if(isEditing)
            incrementSkill(evt);
        else {
            const box = evt.currentTarget;
            const skillId = box.querySelector('.skill-value').id.replace("skill-", "");
            openDicePopup(skillId);
        }
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
        activeTab = targetTab;
        updateDisplay();
    });
});
subtabButtons.forEach(subtab => {
    subtab.addEventListener('click', () => {
        const targetSubtab = subtab.getAttribute('data-tab');
        subtabButtons.forEach(t => t.classList.remove('active'));
        subscreens.forEach(s => s.classList.add('hidden'));
        subtab.classList.add('active');
        document.getElementById(`inv-${targetSubtab}`).classList.remove('hidden');
        activeSubtab = targetSubtab;
        updateDisplay();
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
const checkboxes = document.querySelectorAll('input[type="checkbox"][class="specialty-checkbox"]');
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
        return {};
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
        return {};
    }

    const headers = lines[0].split(',').map(header => header.trim());
    const data = {};

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
            data[entry.ID] = entry;
        } else {
            console.warn(`Skipping row ${i + 1} due to inconsistent number of columns.`);
        }
    }

    return data;
}

async function loadWeapons() {
    return {
        ...await loadCSV('data/weapons/smallGuns.csv'),
        ...await loadCSV('data/weapons/energyWeapons.csv'),
        ...await loadCSV('data/weapons/bigGuns.csv'),
        ...await loadCSV('data/weapons/meleeWeapons.csv'),
        ...await loadCSV('data/weapons/throwing.csv'),
        ...await loadCSV('data/weapons/explosives.csv'),
    }
}

function removeItem(genericItem) {
    const id = genericItem.ID;
    for(let l of [characterData.weapons, characterData.supplies.food, characterData.supplies.drinks, characterData.supplies.meds]){
        const index = l.indexOf(id);
        if(index > -1)
            l.splice(index, 1);
    }
    updateDisplay()
}

function createGenericCard(genericItem, customCardContent) {
    if (!genericItem) {
        console.error(`Item data provided was null`);
        return null;
    }
    const card = document.createElement('div');
    function showCardOverlay(show) {
        const cardOverlay = card.querySelector('.card-overlay');
        if(show){
            cardOverlay.classList.remove('hidden')
        } else {
            cardOverlay.classList.add("hidden")
        }
    }

    const skillId = genericItem.SKILL || "---"

    card.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-name">${genericItem.ID}</div>
                <div class="right-header">
                    <div class="right-header-item"><div>Cost</div><div>${genericItem.COST}</div></div>
                    <div class="right-header-item"><div>Weight</div><div>${genericItem.WEIGHT} kg</div></div>
                    <div class="right-header-item"><div>Rarity</div><div>${genericItem.RARITY}</div></div>
                </div>
            </div>
            <div class="card-content">
                ${customCardContent}
                <div class="card-controls">
                    <button class="attack-button" onclick="openDicePopup('${skillId}')"></button>
                    <button class="description-toggle">Show Description</button>
                </div>
                <div class="description-container">
                    <div class="description">
                        ${genericItem.DESCRIPTION.split('. ').map(paragraph => `<p>${paragraph}${paragraph.endsWith(".") ? "" : "."}</p>`).join('')}
                    </div>
                </div>
            </div>
            <div class="card-overlay hidden">
                <div class="overlay-buttons">
                    <button class="cancel-button">
                        <div class="fas fa-times"/>
                    </button>
                    <button class="delete-button">
                        <div class="fas fa-trash"/>
                    </button>
                </div>
            </div>
        </div>
    `;
    const longPressDuration = 500; // Adjust this value (in milliseconds)
    let pressTimer;
    let isLongPress = false;

    card.addEventListener('pointerdown', (event) => {
      isLongPress = false;
      pressTimer = setTimeout(() => {
        isLongPress = true;
        const longPressEvent = new CustomEvent('longpress', {});
        card.dispatchEvent(longPressEvent);
      }, longPressDuration);
    });

    card.addEventListener('pointerup', () => clearTimeout(pressTimer));
    card.addEventListener('pointermove', () => clearTimeout(pressTimer));
    card.addEventListener('contextmenu', (event) => event.preventDefault());

    card.addEventListener('longpress', (event) => {
        showCardOverlay(true);
    });
    card.querySelector('.delete-button').addEventListener('click', (event) => {
        removeItem(genericItem);
        showCardOverlay(false);
    })
    card.querySelector('.cancel-button').addEventListener('click', (event) => {
        showCardOverlay(false);
    })


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


function createWeaponCard(weaponId) {
    const weapon = weaponData[weaponId];

    if (!weapon) {
        console.error(`Weapon data not found for ID: ${weaponId}`);
        return null;
    }

    const ammoCount = weapon.AMMO_TYPE==="na" ? "-" : "x"+(characterData.ammo[weapon.AMMO_TYPE] || 0);

    const weaponHTML = `
        <div class="stats" id="stats-left">
            <div class="card-stat">
                <div data-lang-id="${weapon.SKILL}"></div>
                <div>To Hit: ${characterData.skills[`${weapon.SKILL}`]+characterData.special[skill2special[weapon.SKILL]]}</div>
                <div>To Crit: ${Math.max(characterData.skills[`${weapon.SKILL}`], 1)}</div>
            </div>
            <div class="card-stat">
                <div data-lang-id="${weapon.AMMO_TYPE}"></div>
                <div>${ammoCount}</div>
            </div>
        </div>
        <div class="image">
            <img id="weapon-img" src="img/${weapon.SKILL}.svg" alt="${weapon.ID}">
        </div>
        <div class="stats" id="stats-right">
            <div class="card-stat"><div>Damage Dice</div><div>${weapon.DAMAGE_RATING}</div><div>${weapon.DAMAGE_TYPE}</div></div>
            <div class="card-stat"><div>Fire Rate</div><div>${weapon.FIRE_RATE}</div></div>
            <div class="card-stat"><div>Range</div><div>${weapon.RANGE}</div></div>
        </div>
    `;

    return createGenericCard(weapon, weaponHTML); // Return the actual card element
}
function createObjectCard(object, type) {

    const specificEffectHeader = object.RADIOACTIVE !== undefined ? 'Radioactive' : 'Addictive';

    const hpGainHTML = type !== "meds" ? `
        <div class="card-stat">
            <div>HP</div>
            <div>+${object.HP_GAIN}</div>
        </div>
    ` : "";

    const objectHTML = `
        <div class="stats">
            <div class="image">
                <img src="img/${type}.svg" alt="${type}" id="supply-img">
            </div>
        </div>
        <div class="stats"">
            <div style="margin: 10px; grid-column: 2 / 3;">${object.EFFECTS}</div>
        </div>
        <div class="stats" id="stats-right">
            ${hpGainHTML}
            <div class="card-stat">
                <div>${specificEffectHeader}</div>
                <div>${object[specificEffectHeader.toUpperCase()]}</div>
            </div>
        </div>
    `;

    return createGenericCard(object, objectHTML)
}

luckCurrentValDisplay.parentElement.addEventListener('click', () => {
    if(!isEditing) {
        let replenishLuck = confirm("Vuoi davvero ripristinare la tua fortuna?")
        if(replenishLuck) {
            characterData.luckCurrent = characterData.special.luck;
            updateDisplay();
        }
    }
});

levelDisplay.addEventListener('change', () => {
    characterData.level = parseInt(levelDisplay.value);
    updateDisplay();
})

document.addEventListener("DOMContentLoaded", async () => {
    // const weaponIds = ["Pistola 44", "Fat Man", "Pistola Gamma"]; // Add more weapon IDs as needed

    weaponData = await loadWeapons();
    foodData = await loadCSV("../data/supplies/food.csv");
    drinksData = await loadCSV("../data/supplies/drinks.csv");
    medsData = await loadCSV("../data/supplies/meds.csv");
    defaultCharacter = await loadJSON('../data/defaultCharacter.json');

    characterBackgroundInput.addEventListener('blur', function () {
        characterData.background = characterBackgroundInput.value;
    });

    characterData = JSON.parse(localStorage.getItem('characterData')) || defaultCharacter;

    updateDisplay();
});