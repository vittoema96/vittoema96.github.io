import { usePanzoom } from '@/app/tabs/map/hooks/usePanzoom'

function MapTab() {
    // The hook handles everything; we just attach the ref it gives us
    const mapRef = usePanzoom();

    return (
        <section id="map-tabContent" className="tabContent">
            <div id="map-container" style={{ overflow: 'hidden', width: '100%', height: '500px' }}>
                <img
                    ref={mapRef}
                    src="/img/png/map.png"
                    alt="Zoomable Map"
                    style={{ display: 'block' }}
                />
            </div>
        </section>
    );
}

export default MapTab
