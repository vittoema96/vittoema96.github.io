// A variable to hold the Panzoom instance.
let instance = undefined;

// Get references to the map image and its container from the DOM.
const mapImage = document.getElementById('map-image');
const mapContainer = document.getElementById('map-container');


/**
 * Sets up the Panzoom instance with the correct options.
 * This function is now called from tabs.js AFTER the map is visible.
 */
function initializePanzoom() {
    // If a previous instance exists, ensure it's fully disposed of.
    if (instance) {
        disposePanzoom();
    }


    instance = Panzoom(mapImage, {
        maxScale: 5,
        startScale: .1, // really low zoom, panzoom will use the min zoom allowed
        contain: 'outside'
    });

    // 4. Add the wheel event listener.
    mapContainer.addEventListener('wheel', instance.zoomWithWheel);
    setTimeout(() => {
        centerImage();
    }); // A short delay is usually sufficient.
}

/**
 * Calculates the required pan to center the image and applies it.
 */
function centerImage() {
    const containerRect = mapContainer.getBoundingClientRect();
    const imageRect = mapImage.getBoundingClientRect();
    const scale = instance.getScale();

    // Calculate the visual difference between the container's center and the image's center.
    const deltaX_visual = (containerRect.width / 2) - (imageRect.left - containerRect.left + imageRect.width / 2);
    const deltaY_visual = (containerRect.height / 2) - (imageRect.top - containerRect.top + imageRect.height / 2);

    // To get the correct pan values, divide the desired visual movement by the current scale.
    const panX = deltaX_visual / scale;
    const panY = deltaY_visual / scale;

    // Pan by a relative amount to move from the current position to the center.
    instance.pan(panX, panY, {
        animate: false,
        relative: true
    });
}

/**
 * This function is called when the user navigates away from the map tab.
 * It cleans up the Panzoom instance to free up resources.
 */
function disposePanzoom() {
    if (instance) {
        mapImage.style.transform = '';
        instance.destroy();
        instance = undefined;
    }
}