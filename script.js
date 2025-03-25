// Get references to DOM elements
const characterNameInput = document.getElementById('character-name');
const levelInput = document.getElementById('level');
const experienceInput = document.getElementById('experience');
const raceSelect = document.getElementById('race');
const genderSelect = document.getElementById('gender');
const ageInput = document.getElementById('age');
const hitPointsDisplay = document.getElementById('hit-points');
const actionPointsDisplay = document.getElementById('action-points');
const carryWeightDisplay = document.getElementById('carry-weight');
const updateButton = document.getElementById('update-character');
const skillsDisplay = document.getElementById('skills');
const characterImageInput = document.getElementById('character-image');
const inventoryList = document.getElementById('inventory-items');
const weaponList = document.getElementById('weapon-list');
const tabButtons = document.querySelectorAll('.tab');
const screens = document.querySelectorAll('.screen');
const characterBackgroundInput = document.getElementById('character-background');
//elementi per special
const specialStrengthDisplay = document.getElementById('special-strength');
const specialPerceptionDisplay = document.getElementById('special-perception');
const specialEnduranceDisplay = document.getElementById('special-endurance');
const specialCharismaDisplay = document.getElementById('special-charisma');
const specialIntelligenceDisplay = document.getElementById('special-intelligence');
const specialAgilityDisplay = document.getElementById('special-agility');
const specialLuckDisplay = document.getElementById('special-luck');
const specialContainer = document.getElementById('special-container');

// Initial character data (can be expanded)
let characterData = {
    name: 'Vault Dweller',
    level: 1,
    experience: 0,
    race: 'human',
    gender: 'male',
    age: 20,
    special: {
        strength: 5,
        perception: 5,
        endurance: 5,
        charisma: 5,
        intelligence: 5,
        agility: 5,
        luck: 5
    },
    hitPoints: 100,
    actionPoints: 50,
    carryWeight: { current: 0, max: 200 },
    skills: {
        smallGuns: 20,
        bigGuns: 20,
        energyWeapons: 20,
        meleeWeapons: 20,
        unarmed: 20,
        sneak: 20,
        lockpick: 20,
        speech: 20,
        barter: 20,
        medicine: 20,
        repair: 20,
        science: 20
    },
    inventory: [
        { name: 'Item 1', weight: 5 },
        { name: 'Item 2', weight: 10 },
        { name: 'Item 3', weight: 7 }
    ],
    weapons: [
        { name: 'Weapon 1', damage: 10 },
        { name: 'Weapon 2', damage: 15 },
    ],
    imageUrl: "",
    background: ""
};

// Function to update the display
function updateDisplay() {
    characterNameInput.value = characterData.name;
    levelInput.value = characterData.level;
    experienceInput.value = characterData.experience;
    raceSelect.value = characterData.race;
    genderSelect.value = characterData.gender;
    ageInput.value = characterData.age;

    //aggiorna i valori special
    specialStrengthDisplay.textContent = characterData.special.strength;
    specialPerceptionDisplay.textContent = characterData.special.perception;
    specialEnduranceDisplay.textContent = characterData.special.endurance;
    specialCharismaDisplay.textContent = characterData.special.charisma;
    specialIntelligenceDisplay.textContent = characterData.special.intelligence;
    specialAgilityDisplay.textContent = characterData.special.agility;
    specialLuckDisplay.textContent = characterData.special.luck;

    hitPointsDisplay.textContent = characterData.hitPoints;
    actionPointsDisplay.textContent = characterData.actionPoints;
    carryWeightDisplay.textContent = `${characterData.carryWeight.current} / ${characterData.carryWeight.max}`;
    characterBackgroundInput.value = characterData.background;

    // Update skills display
    document.getElementById('skill-small-guns').textContent = characterData.skills.smallGuns;
    document.getElementById('skill-big-guns').textContent = characterData.skills.bigGuns;
    document.getElementById('skill-energy-weapons').textContent = characterData.skills.energyWeapons;
    document.getElementById('skill-melee-weapons').textContent = characterData.skills.meleeWeapons;
    document.getElementById('skill-unarmed').textContent = characterData.skills.unarmed;
    document.getElementById('skill-sneak').textContent = characterData.skills.sneak;
    document.getElementById('skill-lockpick').textContent = characterData.skills.lockpick;
    document.getElementById('skill-speech').textContent = characterData.skills.speech;
    document.getElementById('skill-barter').textContent = characterData.skills.barter;
    document.getElementById('skill-medicine').textContent = characterData.skills.medicine;
    document.getElementById('skill-repair').textContent = characterData.skills.repair;
    document.getElementById('skill-science').textContent = characterData.skills.science;

    //update inventory
    inventoryList.innerHTML = '';
    characterData.inventory.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.name} (${item.weight} lbs)`;
        inventoryList.appendChild(li);
        characterData.carryWeight.current += item.weight;
    });
    carryWeightDisplay.textContent = `${characterData.carryWeight.current} / ${characterData.carryWeight.max}`;

    //update weapons
    weaponList.innerHTML = '';
    characterData.weapons.forEach(weapon => {
        const li = document.createElement('li');
        li.textContent = `${weapon.name} (Damage: ${weapon.damage})`;
        weaponList.appendChild(li);
    });
    characterImageInput.value = characterData.imageUrl;
}

// Event listener for the update button
updateButton.addEventListener('click', () => {
    characterData.name = characterNameInput.value;
    characterData.level = parseInt(levelInput.value);
    characterData.experience = parseInt(experienceInput.value);
    characterData.race = raceSelect.value;
    characterData.gender = genderSelect.value;
    characterData.age = parseInt(ageInput.value);
    characterData.imageUrl = characterImageInput.value;
    characterData.background = characterBackgroundInput.value;

    updateDisplay();
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

//PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered! 😎', registration);
            })
            .catch(err => {
                console.log('Service Worker registration failed! 😥', err);
            });
    });
}

// Initial display update
updateDisplay();