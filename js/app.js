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
    caps: 0,
    carryWeight: { current: 0, max: 200 },
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

// Function to update the display
function updateDisplay() {
    specialStrengthDisplay.textContent = characterData.special.strength;
    specialPerceptionDisplay.textContent = characterData.special.perception;
    specialEnduranceDisplay.textContent = characterData.special.endurance;
    specialCharismaDisplay.textContent = characterData.special.charisma;
    specialIntelligenceDisplay.textContent = characterData.special.intelligence;
    specialAgilityDisplay.textContent = characterData.special.agility;
    specialLuckDisplay.textContent = characterData.special.luck;
    defenseDisplay.textContent = characterData.defense;
    initiativeDisplay.textContent = characterData.initiative;
    meleeDamageDisplay.textContent = characterData.meleeDamage;
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
    carryWeightDisplay.textContent = `${characterData.carryWeight.current} / ${characterData.carryWeight.max}`;
    characterBackgroundInput.value = characterData.background;
    gameMapDisplay.textContent = characterData.map;
    radioControlsDisplay.textContent = characterData.radio;

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
                <span class="object-name"><span class="math-inline">\{object\.name\}</span\>
<span class\="object\-description"\></span>{object.description}</span>
                <span class="object-weight">Peso: ${object.weight}</span>
            </div>
        </li>
    `).join('');

    // Save to localStorage
    localStorage.setItem('characterData', JSON.stringify(characterData));
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

// Initial display update
updateDisplay();