const tabButtons = document.querySelectorAll('.tab');
const subTabButtons = document.querySelectorAll('.subTab');

const screens = document.querySelectorAll('.screen');
const subScreens = document.querySelectorAll('.subScreen');

let activeScreen = 'stat';
let activeSubScreen = 'weapons';


// Event listener for tab clicks
tabButtons.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetScreen = tab.dataset.screen;
        tabButtons.forEach(t => t.classList.remove('active'));
        screens.forEach(s => s.classList.add('hidden'));
        tab.classList.add('active');
        document.getElementById(`${targetScreen}-screen`).classList.remove('hidden');
        activeScreen = targetScreen;
        if(targetScreen === 'map'){
            loadPanzoom();
        } else {
            disposePanzoom();
        }
    });
});
subTabButtons.forEach(subTab => {
    subTab.addEventListener('click', () => {
        const targetSubScreen = subTab.dataset.subScreen;
        subTabButtons.forEach(t => t.classList.remove('active'));
        subScreens.forEach(s => s.classList.add('hidden'));
        subTab.classList.add('active');
        document.getElementById(`inv-${targetSubScreen}`).classList.remove('hidden');
        activeSubScreen = targetSubScreen;
    });
});