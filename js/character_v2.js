// =================================================================
// FILE: Enums.js
// Defines constants to prevent errors from typos and ease refactoring.
// =================================================================

// PROPOSED: Using constant objects as Enums for type safety.
export const STATS = {
    STRENGTH: 'strength',
    PERCEPTION: 'perception',
    ENDURANCE: 'endurance',
    CHARISMA: 'charisma',
    INTELLIGENCE: 'intelligence',
    AGILITY: 'agility',
    LUCK: 'luck'
};

export const SKILLS = {
    ATHLETICS: 'athletics', BARTER: 'barter', BIG_GUNS: 'bigGuns',
    ENERGY_WEAPONS: 'energyWeapons', EXPLOSIVES: 'explosives', LOCKPICK: 'lockpick',
    MEDICINE: 'medicine', MELEE_WEAPONS: 'meleeWeapons', PILOT: 'pilot',
    REPAIR: 'repair', SCIENCE: 'science', SMALL_GUNS: 'smallGuns',
    SNEAK: 'sneak', SPEECH: 'speech', SURVIVAL: 'survival',
    THROWING: 'throwing', UNARMED: 'unarmed'
};

export const ITEM_TYPES = {
    WEAPON: 'weapon', ARMOR: 'armor', FOOD: 'food', DRINK: 'drink',
    MEDS: 'meds', MISC: 'misc', AMMO: 'ammo'
};


// =================================================================
// FILE: Character.js
// =================================================================

class Character {
    static load() {
        let savedData = null;
        try {
            savedData = JSON.parse(localStorage.getItem('characterData'));
        } catch (error) {
            console.error("Error parsing character data from localStorage:", error);
        }
        return new Character(savedData);
    }

    constructor(data = null) {
        // --- Core Attributes ---
        this.name = data?.name ?? 'John Fallout';
        this.level = data?.level ?? 1;
        this.caps = data?.caps ?? 0;
        this.background = data?.background ?? "";

        // --- S.P.E.C.I.A.L. ---
        this.special = data?.special ?? {
            [STATS.STRENGTH]: 5, [STATS.PERCEPTION]: 5, [STATS.ENDURANCE]: 5,
            [STATS.CHARISMA]: 5, [STATS.INTELLIGENCE]: 5, [STATS.AGILITY]: 5,
            [STATS.LUCK]: { current: 5, max: 5 }
        };

        // --- Skills & Specialties ---
        this.skills = data?.skills ?? {
            [SKILLS.ATHLETICS]: 0, [SKILLS.BARTER]: 0, [SKILLS.BIG_GUNS]: 0,
            [SKILLS.ENERGY_WEAPONS]: 0, [SKILLS.EXPLOSIVES]: 0, [SKILLS.LOCKPICK]: 0,
            [SKILLS.MEDICINE]: 0, [SKILLS.MELEE_WEAPONS]: 0, [SKILLS.PILOT]: 0,
            [SKILLS.REPAIR]: 0, [SKILLS.SCIENCE]: 0, [SKILLS.SMALL_GUNS]: 0,
            [SKILLS.SNEAK]: 0, [SKILLS.SPEECH]: 0, [SKILLS.SURVIVAL]: 0,
            [SKILLS.THROWING]: 0, [SKILLS.UNARMED]: 0
        };
        this.specialties = data?.specialties ?? [];

        // --- Unified Inventory & Modifiers ---
        this.inventory = data?.inventory ?? [];
        this.modifiers = data?.modifiers ?? [];

        // --- HP (calculated last as it depends on other stats) ---
        const defaultMaxHp = this.getStat(STATS.ENDURANCE) + this.special.luck.max + this.level;
        this.hp = data?.hp ?? {
            current: defaultMaxHp,
            max: defaultMaxHp
        };

        console.log(`Character "${this.name}" has been loaded.`);
    }

    // --- STAT CALCULATION ---
    getStat(statName) {
        let finalValue = this.special[statName];
        for (const modifier of this.modifiers) {
            if (modifier.attribute === statName) {
                finalValue += modifier.value;
            }
        }
        return finalValue;
    }

    // --- DERIVED STATS (Getters) ---
    get defense() { return this.getStat(STATS.AGILITY) < 9 ? 1 : 2; }
    get initiative() { return this.getStat(STATS.AGILITY) + this.getStat(STATS.PERCEPTION); }
    get maxWeight() { return 75 + (this.getStat(STATS.STRENGTH) * 5); }
    get meleeDamage() {
        const strength = this.getStat(STATS.STRENGTH);
        if (strength < 7) return 0;
        if (strength < 9) return 1;
        if (strength < 11) return 2;
        return 3;
    }
    get currentWeight() {
        // TODO: This requires external item data definitions to be implemented.
        return 0;
    }

    // --- METHODS ---
    updateHp() {
        const newMax = this.getStat(STATS.ENDURANCE) + this.special.luck.max + this.level;
        if (this.hp.max === newMax) return; // No change needed

        const hpDiff = newMax - this.hp.max;
        this.hp.max = newMax;
        this.hp.current += hpDiff;
        if (this.hp.current > this.hp.max || hpDiff > 0) {
            // Heal to new max if max HP increased, otherwise just adjust
            this.hp.current = Math.min(this.hp.current, this.hp.max);
        }
        this.save();
    }

    addModifier(modifierData) {
        const modifier = {
            ...modifierData,
            instanceId: crypto.randomUUID() // Assign a unique ID for this specific instance
        };
        this.modifiers.push(modifier);
        console.log(`Added modifier: ${modifier.id} (${modifier.instanceId})`);
        this.updateHp();
        this.save();
    }

    removeModifier(instanceId) {
        const initialLength = this.modifiers.length;
        this.modifiers = this.modifiers.filter(m => m.instanceId !== instanceId);
        if (this.modifiers.length < initialLength) {
            console.log(`Removed modifier instance: ${instanceId}`);
            this.updateHp();
            this.save();
        }
    }

    addSpecialty(skill) {
        if (this.specialties.includes(skill)) {
            console.error(`Cannot add specialty '${skill}', character already has it.`);
            return;
        }
        this.specialties.push(skill);
        this.skills[skill] = Math.min(6, this.skills[skill] + 2); // Add 2, but cap at 6
        this.save();
    }

    removeSpecialty(skill) {
        const index = this.specialties.indexOf(skill);
        if (index === -1) {
            console.error(`Cannot remove specialty '${skill}', character does not have it.`);
            return;
        }
        this.specialties.splice(index, 1);
        this.skills[skill] = Math.max(0, this.skills[skill] - 2); // Subtract 2, with a floor of 0
        this.save();
    }

    updateItemQuantity(itemData, amount) {
        const existingItem = this.inventory.find(i => i.id === itemData.id);

        if (existingItem) {
            existingItem.quantity += amount;
            if (existingItem.quantity <= 0) {
                // Remove item if quantity is 0 or less
                this.inventory = this.inventory.filter(i => i.id !== itemData.id);
            }
        } else if (amount > 0) {
            // Add new item if it doesn't exist and amount is positive
            this.inventory.push({ ...itemData, quantity: amount });
        }
        this.save();
    }

    // --- Persistence Methods ---
    save() {
        try {
            localStorage.setItem('characterData', JSON.stringify(this));
        } catch (error) {
            console.error("Error saving character data:", error);
        }
    }

    static reset() {
        localStorage.removeItem('characterData');
        console.log('Character data reset.');
    }
}

// =================================================================
// FILE: main.js (The logic to connect the class to the HTML)
// =================================================================

let player = Character.load();

const nameEl = document.getElementById('char-name');
const levelEl = document.getElementById('char-level');
const specialListEl = document.getElementById('char-special');
const equipmentEl = document.getElementById('char-equipment');
const inventoryListEl = document.getElementById('char-inventory');
const addPotionBtn = document.getElementById('add-potion-btn');
const addGoldBtn = document.getElementById('add-gold-btn');
const resetBtn = document.getElementById('reset-btn');
const modifiersListEl = document.getElementById('char-modifiers');
const addModifierBtn = document.getElementById('add-modifier-btn');

function updateUI() {
    if (!nameEl) return;

    nameEl.textContent = player.name;
    levelEl.textContent = player.level;

    specialListEl.innerHTML = '';
    Object.values(STATS).forEach(statName => {
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center';

        if (statName === STATS.LUCK) {
            const value = player.special[STATS.LUCK];
            li.innerHTML = `<span class="capitalize">${statName}</span><span class="font-mono bg-gray-600 px-2 rounded w-20 text-center">${value.current} / ${value.max}</span>`;
        } else {
            const baseValue = player.special[statName];
            const finalValue = player.getStat(statName);
            let displayClass = 'text-gray-300';
            if (finalValue > baseValue) displayClass = 'text-green-400';
            if (finalValue < baseValue) displayClass = 'text-red-400';
            li.innerHTML = `<span class="capitalize">${statName}</span><span class="font-mono bg-gray-600 px-2 rounded ${displayClass}">${finalValue}</span>`;
        }
        specialListEl.appendChild(li);
    });

    equipmentEl.innerHTML = `<p><strong>Weapon:</strong> Fists</p><p><strong>Armor:</strong> Cloth Shirt</p>`;

    inventoryListEl.innerHTML = '';
    if (player.inventory.length === 0) {
        inventoryListEl.innerHTML = '<li class="text-gray-500">Inventory is empty.</li>';
    } else {
        player.inventory.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.name || item.id} (x${item.quantity})`;
            inventoryListEl.appendChild(li);
        });
    }

    if (modifiersListEl) {
        modifiersListEl.innerHTML = '';
        if (player.modifiers.length === 0) {
            modifiersListEl.innerHTML = '<li class="text-gray-500">No active effects.</li>';
        } else {
            player.modifiers.forEach(mod => {
                const li = document.createElement('li');
                const sign = mod.value > 0 ? '+' : '';
                li.className = `text-sm ${mod.value > 0 ? 'text-green-400' : 'text-red-400'}`;
                li.innerHTML = `${mod.id}: ${mod.attribute} ${sign}${mod.value} <button data-instance-id="${mod.instanceId}" class="remove-mod-btn text-red-500 ml-2">[x]</button>`;
                modifiersListEl.appendChild(li);
            });
        }
    }

    // Re-attach listeners for dynamic buttons
    document.querySelectorAll('.remove-mod-btn').forEach(button => {
        button.onclick = (e) => {
            const instanceId = e.target.dataset.instanceId;
            player.removeModifier(instanceId);
            updateUI();
        };
    });
}

if (addPotionBtn) {
    addPotionBtn.addEventListener('click', () => {
        const potionData = { id: 'health_potion', name: 'Health Potion', type: ITEM_TYPES.MEDS };
        player.updateItemQuantity(potionData, 1);
        updateUI();
    });

    addGoldBtn.addEventListener('click', () => {
        player.caps += 10;
        player.save();
        updateUI();
    });

    if (addModifierBtn) {
        addModifierBtn.addEventListener('click', () => {
            const modData = { id: 'Rusted', attribute: STATS.STRENGTH, value: -2 };
            player.addModifier(modData);
            updateUI();
        });
    }

    resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure?')) {
            Character.reset();
            window.location.reload();
        }
    });
}

updateUI();
