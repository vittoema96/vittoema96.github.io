// Get references to DOM elements

let weaponData = undefined;
let foodData = undefined;
let drinksData = undefined;
let medsData = undefined;


// TODO just the specialty checkboxes
const checkboxes = document.querySelectorAll('input[type="checkbox"][class="specialty-checkbox"]');
checkboxes.forEach(checkbox => {
    checkbox.disabled = true;
});

const clearLocalStorageButton = document.getElementById('clear-local-storage');
clearLocalStorageButton.addEventListener('click', async () => {
    let confirmedStorageWipe = confirm("Are you really sure you want to DELETE YOUR CHARACTER and every other saved data?")
    if (confirmedStorageWipe) {
        localStorage.clear();
        alert("Local data was wiped");
        characterData = new Character();
    }
});



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
                <div class="card-name" data-lang-id="${genericItem.ID}">${langData[currentLanguage][genericItem.ID]}</div>
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

    card.addEventListener('pointerdown', () => {
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

    card.addEventListener('longpress', () => {
        showCardOverlay(true);
    });
    card.querySelector('.delete-button').addEventListener('click', () => {
        characterData.removeItem(genericItem);
        showCardOverlay(false);
    })
    card.querySelector('.cancel-button').addEventListener('click', () => {
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

    const ammoCount = 0; // TODO reimplement ammo count:
    //                                    weapon.AMMO_TYPE==="na" ? "-" : "x"+(characterData.ammo[weapon.AMMO_TYPE] || 0);

    const weaponHTML = `
        <div class="stats" id="stats-left">
            <div class="card-stat">
                <div data-lang-id="${weapon.SKILL}"></div>
                <div>To Hit: ${characterData.getSkill(weapon.SKILL)+characterData.getSpecial(Character.getSpecialFromSkill(weapon.SKILL))}</div>
                <div>To Crit: ${Math.max(characterData.getSkill(weapon.SKILL), 1)}</div>
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
function createObjectCard(id, type) {
    const object = {...foodData, ...drinksData, ...medsData}[id];
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




document.addEventListener("DOMContentLoaded", async () => {

    weaponData = await loadWeapons();
    foodData = await loadCSV("../data/supplies/food.csv");
    drinksData = await loadCSV("../data/supplies/drinks.csv");
    medsData = await loadCSV("../data/supplies/meds.csv");

    /*characterBackgroundInput.addEventListener('blur', function () {
        characterData.background = characterBackgroundInput.value;
    });*/

    display = new Display();
    characterData = new Character();
    loadTranslations(currentLanguage);
});