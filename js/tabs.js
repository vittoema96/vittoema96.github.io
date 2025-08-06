const tabButtons = document.querySelectorAll('.tab-button');
const subTabButtons = document.querySelectorAll('.subTab-button');

const screens = document.querySelectorAll('.screen');
const subScreens = document.querySelectorAll('.subScreen');

// Event listener for main tab clicks
tabButtons.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetScreenId = tab.dataset.screen;

        // Hide all screens and deactivate all tabs
        screens.forEach(s => s.classList.add('hidden'));
        tabButtons.forEach(t => t.classList.remove('active'));

        // Show the target screen and activate its tab
        const targetScreenElement = document.getElementById(`${targetScreenId}-screen`);
        targetScreenElement.classList.remove('hidden');
        tab.classList.add('active');

        if (targetScreenId === 'map') {
            if (mapImage.complete) {
                initializePanzoom();
            } else {
                mapImage.onload = initializePanzoom;
            }
        } else {
            disposePanzoom();
        }
    });
});

// Event listener for inventory sub-tab clicks
subTabButtons.forEach(subTab => {
    subTab.addEventListener('click', () => {
        const targetSubScreen = subTab.dataset.subScreen;

        // Hide all sub-screens and deactivate all sub-tabs
        subScreens.forEach(s => s.classList.add('hidden'));
        subTabButtons.forEach(t => t.classList.remove('active'));

        // Show the target sub-screen and activate its tab
        document.getElementById(`inv-${targetSubScreen}`).classList.remove('hidden');
        subTab.classList.add('active');
    });
});