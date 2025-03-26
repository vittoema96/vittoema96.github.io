// Get references to DOM elements
const tabButtons = document.querySelectorAll('.tab');
const screens = document.querySelectorAll('.screen');
const specialStrengthDisplay = document.getElementById('special-strength');
const specialPerceptionDisplay = document.getElementById('special-perception');
const specialEnduranceDisplay = document.getElementById('special-endurance');
const specialCharismaDisplay = document.getElementById('special-charisma');
const specialIntelligenceDisplay = document.getElementById('special-intelligence');
const specialAgilityDisplay = document.getElementById('special-agility');
const specialLuckDisplay = document.getElementById('special-luck');
const defenseDisplay = document.getElementById('defense');
const initiativeDisplay = document.getElementById('initiative');
const meleeDamageDisplay = document.getElementById('melee-damage');
const skillSmallGunsDisplay = document.getElementById('skill-small-guns');
const skillBigGunsDisplay = document.getElementById('skill-big-guns');
const skillEnergyWeaponsDisplay = document.getElementById('skill-energy-weapons');
const skillMeleeWeaponsDisplay = document.getElementById('skill-melee-weapons');
const skillUnarmedDisplay = document.getElementById('skill-unarmed');
const skillSneakDisplay = document.getElementById('skill-sneak');
const skillLockpickDisplay = document.getElementById('skill-lockpick');
const skillSpeechDisplay = document.getElementById('skill-speech');
const skillBarterDisplay = document.getElementById('skill-barter');
const skillMedicineDisplay = document.getElementById('skill-medicine');
const skillRepairDisplay = document.getElementById('skill-repair');
const skillScienceDisplay = document.getElementById('skill-science');
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
        smallGuns: 0,
        bigGuns: 0,
        energyWeapons: 0,
        meleeWeapons: 0,
        unarmed: 0,
        sneak: 0,
        lockpick: 0,
        speech: 0,
        barter: 0,
        medicine: 0,
        repair: 0,
        science: 0
    },
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

    skillSmallGunsDisplay.textContent = characterData.skills.smallGuns;
    skillBigGunsDisplay.textContent = characterData.skills.bigGuns;
    skillEnergyWeaponsDisplay.textContent = characterData.skills.energyWeapons;
    skillMeleeWeaponsDisplay.textContent = characterData.skills.meleeWeapons;
    skillUnarmedDisplay.textContent = characterData.skills.unarmed;
    skillSneakDisplay.textContent = characterData.skills.sneak;
    skillLockpickDisplay.textContent = characterData.skills.lockpick;
    skillSpeechDisplay.textContent = characterData.skills.speech;
    skillBarterDisplay.textContent = characterData.skills.barter;
    skillMedicineDisplay.textContent = characterData.skills.medicine;
    skillRepairDisplay.textContent = characterData.skills.repair;
    skillScienceDisplay.textContent = characterData.skills.science;

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
    skillSmallGunsDisplay.contentEditable = isEditing;
    skillBigGunsDisplay.contentEditable = isEditing;
    skillEnergyWeaponsDisplay.contentEditable = isEditing;
    skillMeleeWeaponsDisplay.contentEditable = isEditing;
    skillUnarmedDisplay.contentEditable = isEditing;
    skillSneakDisplay.contentEditable = isEditing;
    skillLockpickDisplay.contentEditable = isEditing;
    skillSpeechDisplay.contentEditable = isEditing;
    skillBarterDisplay.contentEditable = isEditing;
    skillMedicineDisplay.contentEditable = isEditing;
    skillRepairDisplay.contentEditable = isEditing;
    skillScienceDisplay.contentEditable = isEditing;

    // Update button text
    editStatsButton.textContent = isEditing ? 'Save Stats' : 'Edit Stats';

    // Toggle event listeners on special stat boxes
    const specialStatBoxes = document.querySelectorAll('.special-stat-box');
    specialStatBoxes.forEach(box => {
        if (isEditing) {
            box.addEventListener('click', incrementSpecialStat);
        } else {
            box.removeEventListener('click', incrementSpecialStat);
        }
    });
    // Toggle event listeners on skills
    const skillBoxes = document.querySelectorAll('.skill-with-specialty'); // Or whatever the parent element is
    skillBoxes.forEach(box => {
        const checkbox = box.querySelector('input[type="checkbox"]');
        if (isEditing) {
            box.addEventListener('click', incrementSkill);
            if (checkbox) checkbox.disabled = false;
        } else {
            box.removeEventListener('click', incrementSkill);
            if (checkbox) checkbox.disabled = true;
        }
    });
}

// Function to increment special stat values
function incrementSpecialStat(event) {
    if (!isEditing) return; // Only increment if editing

    const box = event.currentTarget;
    const statId = box.querySelector('.special-stat-value').id;
    let statValue;

    switch (statId) {
        case 'special-strength':
            statValue = characterData.special.strength;
            characterData.special.strength = (statValue < 12) ? statValue + 1 : 4;
            break;
        case 'special-perception':
            statValue = characterData.special.perception;
            characterData.special.perception = (statValue < 10) ? statValue + 1 : 4;
            break;
        case 'special-endurance':
            statValue = characterData.special.endurance;
            characterData.special.endurance = (statValue < 12) ? statValue + 1 : 4;
            break;
        case 'special-charisma':
            statValue = characterData.special.charisma;
            characterData.special.charisma = (statValue < 10) ? statValue + 1 : 4;
            break;
        case 'special-intelligence':
            statValue = characterData.special.intelligence;
            characterData.special.intelligence = (statValue < 10) ? statValue + 1 : 4;
            break;
        case 'special-agility':
            statValue = characterData.special.agility;
            characterData.special.agility = (statValue < 10) ? statValue + 1 : 4;
            break;
        case 'special-luck':
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
    const skillValueElement = box.querySelector('.skill-value');
    const skillId = skillValueElement.id;
    let skillValue;
    const checkbox = box.querySelector(`input[type="checkbox"][id="specialty-${skillId.replace("skill-", "")}"]`);

    switch (skillId) {
        case 'skill-small-guns':
            skillValue = characterData.skills.smallGuns;
            characterData.skills.smallGuns = (skillValue < 6) ? skillValue + 1 : checkbox.checked ? 2 : 0;
            break;
        case 'skill-big-guns':
            skillValue = characterData.skills.bigGuns;
            characterData.skills.bigGuns = (skillValue < 6) ? skillValue + 1 : checkbox.checked ? 2 : 0;
            break;
        case 'skill-energy-weapons':
            skillValue = characterData.skills.energyWeapons;
            characterData.skills.energyWeapons = (skillValue < 6) ? skillValue + 1 : checkbox.checked ? 2 : 0;
            break;
        case 'skill-melee-weapons':
            skillValue = characterData.skills.meleeWeapons;
            characterData.skills.meleeWeapons = (skillValue < 6) ? skillValue + 1 : checkbox.checked ? 2 : 0;
            break;
        case 'skill-unarmed':
            skillValue = characterData.skills.unarmed;
            characterData.skills.unarmed = (skillValue < 6) ? skillValue + 1 : checkbox.checked ? 2 : 0;
            break;
        case 'skill-sneak':
            skillValue = characterData.skills.sneak;
            characterData.skills.sneak = (skillValue < 6) ? skillValue + 1 : checkbox.checked ? 2 : 0;
            break;
        case 'skill-lockpick':
            skillValue = characterData.skills.lockpick;
            characterData.skills.lockpick = (skillValue < 6) ? skillValue + 1 : checkbox.checked ? 2 : 0;
            break;
        case 'skill-speech':
            skillValue = characterData.skills.speech;
            characterData.skills.speech = (skillValue < 6) ? skillValue + 1 : checkbox.checked ? 2 : 0;
            break;
        case 'skill-barter':
            skillValue = characterData.skills.barter;
            characterData.skills.barter = (skillValue < 6) ? skillValue + 1 : checkbox.checked ? 2 : 0;
            break;
        case 'skill-medicine':
            skillValue = characterData.skills.medicine;
            characterData.skills.medicine = (skillValue < 6) ? skillValue + 1 : checkbox.checked ? 2 : 0;
            break;
        case 'skill-repair':
            skillValue = characterData.skills.repair;
            characterData.skills.repair = (skillValue < 6) ? skillValue + 1 : checkbox.checked ? 2 : 0;
            break;
        case 'skill-science':
            skillValue = characterData.skills.science;
            characterData.skills.science = (skillValue < 6) ? skillValue + 1 : checkbox.checked ? 2 : 0;
            break;
        default:
            return;
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
        // Save changes when exiting edit mode
        characterData.special.strength = parseInt(specialStrengthDisplay.textContent) || characterData.special.strength;
        characterData.special.perception = parseInt(specialPerceptionDisplay.textContent) || characterData.special.perception;
        characterData.special.endurance = parseInt(specialEnduranceDisplay.textContent) || characterData.special.endurance;
        characterData.special.charisma = parseInt(specialCharismaDisplay.textContent) || characterData.special.charisma;
        characterData.special.intelligence = parseInt(specialIntelligenceDisplay.textContent) || characterData.special.intelligence;
        characterData.special.agility = parseInt(specialAgilityDisplay.textContent) || characterData.special.agility;
        characterData.special.luck = parseInt(specialLuckDisplay.textContent) || characterData.special.luck;
        characterData.defense = parseInt(defenseDisplay.textContent) || characterData.defense;
        characterData.initiative = parseInt(initiativeDisplay.textContent) || characterData.initiative;
        characterData.meleeDamage = parseInt(meleeDamageDisplay.textContent) || characterData.meleeDamage;
        characterData.skills.smallGuns = parseInt(skillSmallGunsDisplay.textContent) || characterData.skills.smallGuns;
        characterData.skills.bigGuns = parseInt(skillBigGunsDisplay.textContent) || characterData.skills.bigGuns;
        characterData.skills.energyWeapons = parseInt(skillEnergyWeaponsDisplay.textContent) || characterData.skills.energyWeapons;
        characterData.skills.meleeWeapons = parseInt(skillMeleeWeaponsDisplay.textContent) || characterData.skills.meleeWeapons;
        characterData.skills.unarmed = parseInt(skillUnarmedDisplay.textContent) || characterData.skills.unarmed;
        characterData.skills.sneak = parseInt(skillSneakDisplay.textContent) || characterData.skills.sneak;
        characterData.skills.lockpick = parseInt(skillLockpickDisplay.textContent) || characterData.skills.lockpick;
        characterData.skills.speech = parseInt(skillSpeechDisplay.textContent) || characterData.skills.speech;
        characterData.skills.barter = parseInt(skillBarterDisplay.textContent) || characterData.skills.barter;
        characterData.skills.medicine = parseInt(skillMedicineDisplay.textContent) || characterData.skills.medicine;
        characterData.skills.repair = parseInt(skillRepairDisplay.textContent) || characterData.skills.repair;
        characterData.skills.science = parseInt(skillScienceDisplay.textContent) || characterData.skills.science;

        updateDisplay(); // Refresh display with updated data
    }
});

const checkboxes = document.querySelectorAll('input[type="checkbox"]');
checkboxes.forEach(checkbox => {
    checkbox.disabled = true;
});

// Initial display update
updateDisplay();