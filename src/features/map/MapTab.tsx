import { usePanzoom } from '@/features/map/hooks/usePanzoom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanzoomEventDetail } from '@panzoom/panzoom';
import { useCharacter } from '@/contexts/CharacterContext.tsx';
import { usePopup } from '@/contexts/popup/PopupContext.tsx';
import { useTranslation } from 'react-i18next';
import { markers } from '@/features/map/mapMarkers';
import MapMarkerItem, { MARKER_TEXT_THRESHOLD } from '@/features/map/MapMarkerItem';

const SHOW_ALL = true; // For debug only – works only when __APP_VERSION__ is not set (dev server)

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
        const showAll = SHOW_ALL && __APP_VERSION__.includes('BUILD_VERSION');
        return markers.filter(m => showAll || character.mapCodes.includes(m.code))
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
