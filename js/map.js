let instance = undefined;
const mapImage  = document.getElementById('map-image');


function loadPanzoom() {
    if (!instance) {
        instance = Panzoom(mapImage, {
            contain: 'outside',
            maxScale: 4,
            noBind: true
        });
    }
    init();
}

function init() {
    instance.bind();
    instance.zoom(.1);
    setTimeout(() => {
        const rect = mapImage.parentElement.getBoundingClientRect();
        const imgRect = mapImage.getBoundingClientRect();
        const x = -(imgRect.width - rect.width)/2
        const y = -(imgRect.height - rect.height)/2
        instance.pan(0, 0);
        instance.pan(x, y, {relative: true});
    });
    mapImage.parentElement.addEventListener('wheel', instance.zoomWithWheel);
}

function disposePanzoom() {
    if(instance)
        instance.destroy();
}