import { usePanzoom } from '@/features/map/hooks/usePanzoom';
import { useCallback, useEffect, useMemo, useRef, useState, RefObject } from 'react';
import { PanzoomEventDetail } from '@panzoom/panzoom';
import { useCharacter } from '@/contexts/CharacterContext.tsx';
import { usePopup } from '@/contexts/popup/PopupContext.tsx';
import { useLongPress } from '@/hooks/useLongPress.ts';
import { useTranslation } from 'react-i18next';

const SHOW_ALL = false; // For debug only
const MARKER_SIZE_PX = '20px';
const MARKER_TEXT_THRESHOLD = 2.5;

type MapMarker = {
    id: string;
    code: string;
    x: number;
    y: number;
};

const markers: MapMarker[] = [
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
        code: 'n4fb', x: 67, y: 17 },

    { id: `Freeside East Gate`,
        code: "fr3g", x: 52.7, y: 25.2 },
    { id: `Freeside North Gate`,
        code: "frng", x: 53, y: 22.5 },
    { id: `Westside West Entrance`,
        code: "w3w3", x: 43, y: 22.2 },
    { id: `Westside South Entrance`,
        code: "w3s3", x: 44.4, y: 23.6 },

    { id: `Quarry Junction`,
        code: 'quju', x: 45, y: 53 },
    { id: `Gibson Scrap Yard`,
        code: "g1sy", x: 63.2, y: 64.5 },
    { id: `HELIOS One`,
        code: "h3l1", x: 62.5, y: 58.2 },
    { id: `Camp Golf`,
        code: "c4g0", x: 64.7, y: 37.3 },
    { id: `Camp Forlorn Hope`,
        code: "c4fh", x: 74.7, y: 61.3 },
    { id: `Vault 22`,
        code: "vt22", x: 35, y: 21 },
    { id: `Vault 3`,
        code: "vt03", x: 44, y: 37.5 },
    { id: `Vault 34`,
        code: "vt34", x: 62.5, y: 31},
    { id: `Vault 11`,
        code: "vt11", x: 64.5, y: 50.7 },
    { id: `Vault 19`,
        code: "vt19", x: 42.1, y: 45.7 },
    { id: `Vault 21`,
        code: "vt21", x: 48, y: 30 },
    { id: `North Vegas Square`,
        code: "nv3s", x: 51.2, y: 21.7 },
    { id: `The Thorn`,
        code: "t3th", x: 44.4, y: 25 },
    { id: `Legate's Camp`,
        code: "l3g4", x: 89.1, y: 51.8 },
    { id: `REPCONN Test Site`,
        code: "r3tt", x: 53.3, y: 67 },
    { id: `REPCONN Headquarters`,
        code: "r3h3", x: 56.3, y: 44.3 },
    { id: `Follower's Outpost`,
        code: "f040", x: 61.3, y: 41.7 },
    { id: `Crimson Caravan Company`,
        code: "cc4c", x: 54.5, y: 23.5 },
    { id: `Old Mormon Fort`,
        code: "0mm4", x: 51.7, y: 23.5 },
    { id: `King's School of Impersonation`,
        code: "ks01", x: 50.5, y: 25 }
    // Removed:
    // Calville Bay,
    // El Dorado Substation,
    // Brooks Tumbleweed Ranch,
    // Ivanpah Dry Lake,
    // Crescent Canyon
    // The casinos and freeside places (i will provide a strip map separate)
]


type MapMarkerItemProps = Readonly<{
    marker: MapMarker;
    scale: number;
    activeMarkerCode: string | null;
    markerRefs: RefObject<Record<string, HTMLDivElement | null>>;
    onLongPress: (code: string) => void;
}>;

function MapMarkerItem({ marker, scale, activeMarkerCode, markerRefs, onLongPress }: MapMarkerItemProps) {
    const longPressHandlers = useLongPress(() => {
        onLongPress(marker.code);
    });

    return (
        <div
            key={marker.code}
            className="map-marker"
            ref={(element) => {
                markerRefs.current[marker.code] = element;
            }}
            style={{
                position: 'absolute',
                pointerEvents: 'auto',
                left: `${marker.x}%`, top: `${marker.y}%`,
                transform: `translate(-50%, -50%) scale(${1/(scale??1)})`,
            }}
            {...longPressHandlers}
            onContextMenu={(e) => e.preventDefault()}
        >
            {scale > MARKER_TEXT_THRESHOLD && marker.code === activeMarkerCode && <span
                style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    pointerEvents: 'none',
                    textAlign: 'center',
                    width: 'max-content',
                    maxWidth: '140px',
                    whiteSpace: 'normal',
                    wordWrap: 'break-word'
                }}>{marker.id}</span>}
            <div className="themed-svg"
                 id={marker.code}
                 data-icon="caps"
                 style={{ width: MARKER_SIZE_PX, height: MARKER_SIZE_PX }} />
        </div>
    );
}

function MapTab() {
    const { t } = useTranslation()
    const { mapRef } = usePanzoom();
    const { character, updateCharacter } = useCharacter()
    const [ scale, setScale ] = useState<number>(1);
    const [ code, setCode ] = useState('')
    const [ activeMarkerCode, setActiveMarkerCode ] = useState<string | null>(null)
    const { showConfirm } = usePopup()
    const viewportRef = useRef<HTMLDivElement | null>(null)
    const markerRefs = useRef<Record<string, HTMLDivElement | null>>({})

    const handleLongPress = useCallback((markerCode: string) => {
        showConfirm(t('deleteMarker'), () => {
            updateCharacter({ mapCodes: character.mapCodes.filter(m => m !== markerCode) });
        });
    }, [showConfirm, t, updateCharacter, character.mapCodes]);

    const visibleMarkers = useMemo(() => {
        return markers.filter(m => SHOW_ALL || character.mapCodes.includes(m.code))
    }, [character.mapCodes])

    const updateActiveMarker = useCallback((nextScale = scale) => {
        if (nextScale <= MARKER_TEXT_THRESHOLD || visibleMarkers.length === 0) {
            setActiveMarkerCode(null);
            return;
        }

        const viewport = viewportRef.current;

        if (!viewport) {
            setActiveMarkerCode(null);
            return;
        }

        const viewportRect = viewport.getBoundingClientRect();
        const viewportCenterX = viewportRect.left + (viewportRect.width / 2);
        const viewportCenterY = viewportRect.top + (viewportRect.height / 2);

        let closestMarkerCode: string | null = null;
        let closestDistance = Number.POSITIVE_INFINITY;

        for (const marker of visibleMarkers) {
            const markerElement = markerRefs.current[marker.code];

            if (!markerElement) {
                continue;
            }

            const markerRect = markerElement.getBoundingClientRect();
            const markerCenterX = markerRect.left + (markerRect.width / 2);
            const markerCenterY = markerRect.top + (markerRect.height / 2);
            const distance = ((markerCenterX - viewportCenterX) ** 2) + ((markerCenterY - viewportCenterY) ** 2);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestMarkerCode = marker.code;
            }
        }

        setActiveMarkerCode(closestMarkerCode);
    }, [scale, visibleMarkers])

    // Unscales markers
    useEffect(() => {
        const img = mapRef.current;
        if (!img) { return; }

        let animationFrameId: number | null = null;

        const syncTransform = (event: CustomEvent<PanzoomEventDetail>) => {
            setScale(event.detail.scale)
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }

            animationFrameId = requestAnimationFrame(() => {
                updateActiveMarker(event.detail.scale)
            });
        };

        img.addEventListener('panzoomchange', syncTransform as EventListener);
        return () => {
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }

            img.removeEventListener('panzoomchange', syncTransform as EventListener);
        };
    }, [mapRef, updateActiveMarker]);

    useEffect(() => {
        updateActiveMarker();
    }, [updateActiveMarker]);

    useEffect(() => {
        const handleResize = () => {
            updateActiveMarker();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [updateActiveMarker]);

    const handleUnlockLocation = () => {
        if (code.length !== 4) {return}
        const marker = markers.some(m => m.code === code)
        if(marker) {
            updateCharacter({ mapCodes: [...character.mapCodes, code] });
        }
        setCode('')
    }

    return (
        <section className="tabContent">
            <div ref={viewportRef} style={{flex: 1}}>
                <div
                    ref={mapRef}
                    style={{
                        backgroundImage: 'url(/img/png/map.png)',
                        backgroundSize: 'cover',
                        aspectRatio: '1 / 1'
                    }}
                >
                    {visibleMarkers.map(marker => (
                        <MapMarkerItem
                            key={marker.code}
                            marker={marker}
                            scale={scale}
                            activeMarkerCode={activeMarkerCode}
                            markerRefs={markerRefs}
                            onLongPress={handleLongPress}
                        />
                    ))}
                </div>
            </div>
            <div className="row" style={{justifyContent: "center"}}>
                <input type="text" style={{textAlign: 'center' }} maxLength={4} placeholder="○○○○" value={code} onChange={(e) => setCode(e.currentTarget.value.toLowerCase())} />
                <button onClick={handleUnlockLocation}>{t("unlock")}</button>
            </div>
        </section>
    );
}

export default MapTab
