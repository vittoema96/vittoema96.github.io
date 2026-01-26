import { usePanzoom } from '@/app/tabs/map/hooks/usePanzoom';
import { useEffect, useMemo, useState } from 'react';
import { PanzoomEventDetail } from '@panzoom/panzoom';
import { useCharacter } from '@/contexts/CharacterContext.tsx';
import { usePopup } from '@/contexts/popup/PopupContext.tsx';
import { useLongPress } from '@/hooks/useLongPress.ts';
import { useTranslation } from 'react-i18next';

const markers = [
    { id: `Goodsprings`,
        code: 'g00d', x: 34, y: 57 },
    { id: `Goodsprings Cemetery`,
        code: 'gc3m', x: 36, y: 54 },
    { id: `Primm`,
        code: 'pr1m', x: 39, y: 74.5 },
    { id: `Mojave Outpost`,
        code: 'm00t', x: 29.7, y: 90 },
    { id: `Nipton`,
        code: 'n1pt', x: 45.5, y: 88 },
    { id: `Novac`,
        code: 'nv4c', x: 62.5, y: 68 },
    { id: `NCRCF`,
        code: 'ncrc', x: 45.3, y: 66.3 },
    { id: `New Vegas Strip`,
        code: 'nvg5', x: 50, y: 27 },
    { id: `Hoover Dam`,
        code: 'h00v', x: 79.5, y: 50 },
    { id: `Jacobstown`,
        code: 'j4ck', x: 22, y: 28 },
    { id: `Red Rock Canyon`,
        code: 'rrck', x: 33, y: 43 },
    { id: `Black Mountain`,
        code: 'bm0t', x: 57, y: 54 },
    { id: `Hidden Valley`,
        code: 'h1v4', x: 50.5, y: 59 },
    { id: `Camp McCarran`,
        code: 'cmcc', x: 50.5, y: 34 },
    { id: `Boulder City`,
        code: 'b0ul', x: 72.5, y: 51.5 },
    { id: `Cottonwood Cove`,
        code: 'c0tt', x: 76, y: 85.8 },
    { id: `The Fort`,
        code: 'th4t', x: 84.5, y: 43.5 },
    { id: `Bitter Springs`,
        code: 'b15p', x: 79, y: 29.2 },
    { id: `Nelson`,
        code: 'n3l5', x: 73.5, y: 68.5 },
    { id: `Sloan`,
        code: 'sl4n', x: 46.5, y: 55 },
    { id: `Camp Searchlight`,
        code: 'cmsl', x: 64.3, y: 88 },
    { id: `Nellis Air Force Base`,
        code: 'n4fb', x: 67, y: 17 }
]


function MapTab() {
    // The hook handles everything; we just attach the ref it gives us
    const { t } = useTranslation()
    const { mapRef } = usePanzoom();
    const { character, updateCharacter } = useCharacter()
    const [ scale, setScale ] = useState<number>(1);
    const [ code, setCode ] = useState('')
    const { showConfirm } = usePopup()

    const longPressHandlers = useLongPress((e) => {
        showConfirm(t('deleteMarker'), () => {
            updateCharacter({ mapCodes: character.mapCodes.filter(m => m !== e.target?.id) })
        })
    })


    const markerSize = "20px"
    const markerTextThreshold = 4;

    const visibleMarkers = useMemo(() => {
        return markers.filter(m => character.mapCodes.includes(m.code))
    }, [character.mapCodes])

    // Unscales markers
    useEffect(() => {
        const img = mapRef.current;
        if (!img) { return; }

        const syncTransform = (event: CustomEvent<PanzoomEventDetail>) => {
            setScale(event.detail.scale)
        };
        img.addEventListener('panzoomchange', syncTransform as EventListener);
        return () => {
            img.removeEventListener('panzoomchange', syncTransform as EventListener);
        };
    }, [mapRef]);

    const handleMarkerClick = (marker: any) => {
        showConfirm(t('deleteMarker'), () => {
            updateCharacter({ mapCodes: character.mapCodes.filter(m => m !== marker.code) })
        })
    }

    const handleUnlockLocation = () => {
        if (code.length !== 4) {return}
        const marker = markers.some(m => m.code === code)
        if(!marker) {return}
        updateCharacter({ mapCodes: [...character.mapCodes, code] })
    }

    return (
        <section id="map-tabContent" className="tabContent">
            <div id="map-container" style={{ overflow: 'hidden', width: '100%', height: '500px' }}>

                <div
                    ref={mapRef}
                    style={{
                        display: 'block',
                        backgroundImage: 'url(/img/png/map.png)',
                        backgroundSize: 'cover',
                        width: '100%',
                        aspectRatio: '1 / 1'
                    }}
                >
                    {visibleMarkers.map(marker => (
                        <div
                            key={marker.code}
                            className="map-marker"
                            style={{
                                position: 'absolute',
                                pointerEvents: 'auto',
                                left: `${marker.x}%`, top: `${marker.y}%`,
                                transform: `translate(-50%, -50%) scale(${1/(scale??1)})`,  // Center marker on point
                            }}
                            {...longPressHandlers}
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            {scale > markerTextThreshold &&<span style={{
                                position: 'absolute',
                                bottom: '100%',  // Position above the icon
                                left: '50%',
                                transform: 'translateX(-50%)',  // Center horizontally
                                pointerEvents: 'none',
                                textAlign: 'center',
                            }}>{marker.id}</span>}
                            <div className="themed-svg"
                                 id={marker.code}
                                 data-icon="caps"
                                 style={{ width: markerSize, height: markerSize }} /> {/*<MarkerIcon />*/}
                        </div>
                    ))}
                </div>
            </div>
            <div className="row">
                <input type="text" style={{textAlign: 'center' }} maxLength={4} placeholder="○○○○" onChange={(e) => setCode(e.target.value)} />
                <button onClick={handleUnlockLocation}>{t("unlock")}</button>
            </div>
        </section>
    );
}

export default MapTab
