import { usePanzoom } from '@/app/tabs/map/hooks/usePanzoom';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { PanzoomEventDetail } from '@panzoom/panzoom';
import { useCharacter } from '@/app/contexts/CharacterContext.tsx';
import { usePopup } from '@/app/contexts/PopupContext.tsx';
import { useTranslation } from 'react-i18next';
import { mojaveMarkers } from '@/app/tabs/map/mapMarkers';
import { commonwealthMarkers } from '@/app/tabs/map/commonwealthMarkers';
import { capitalWastelandMarkers } from '@/app/tabs/map/capitalWastelandMarkers';
import MapMarkerItem, { MARKER_TEXT_THRESHOLD } from '@/app/tabs/map/MapMarkerItem';
import type { MapRegion } from '@/services/UISettingsManager';
import { useMapRegion } from '@/hooks/useMapRegion';
import './MapTab.css';

const SHOW_ALL = true; // For debug only – works only when __APP_VERSION__ is not set (dev server)

function MapTab() {
    const region = useMapRegion();
    return <RegionMap key={region} region={region} />;
}

function RegionMap({ region }: Readonly<{ region: MapRegion }>) {
    const { t } = useTranslation();
    const { mapRef } = usePanzoom();
    const { character, updateCharacter } = useCharacter();
    const regionMarkers =
        region === 'mojave'
            ? mojaveMarkers
            : region === 'commonwealth'
              ? commonwealthMarkers
              : capitalWastelandMarkers;
    const unlockableMarkers = regionMarkers;
    const mapImage =
        region === 'mojave'
            ? '/img/png/map.png'
            : region === 'commonwealth'
              ? '/img/webp/Commonwealth.webp'
              : '/img/webp/CapitalWasteland.webp';
    const [scale, setScale] = useState<number>(1);
    const [code, setCode] = useState('');
    const [activeMarkerCode, setActiveMarkerCode] = useState<string | null>(null);
    const { showConfirm } = usePopup();
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const markerRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const handleLongPress = useCallback(
        (markerCode: string) => {
            showConfirm(t('deleteMarker'), () => {
                updateCharacter(prev => ({
                    mapCodes: prev.mapCodes.filter(m => m !== markerCode),
                }));
            });
        },
        [showConfirm, t, updateCharacter],
    );

    const visibleMarkers = useMemo(() => {
        const showAll = SHOW_ALL && __APP_VERSION__.includes('BUILD_VERSION');
        return regionMarkers.filter(m => showAll || character.mapCodes.includes(m.code));
    }, [regionMarkers, character.mapCodes]);

    const updateActiveMarker = useCallback(
        (nextScale = scale) => {
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
            const viewportCenterX = viewportRect.left + viewportRect.width / 2;
            const viewportCenterY = viewportRect.top + viewportRect.height / 2;

            let closestMarkerCode: string | null = null;
            let closestDistance = Number.POSITIVE_INFINITY;

            for (const marker of visibleMarkers) {
                const markerElement = markerRefs.current[marker.code];

                if (!markerElement) {
                    continue;
                }

                const markerRect = markerElement.getBoundingClientRect();
                const markerCenterX = markerRect.left + markerRect.width / 2;
                const markerCenterY = markerRect.top + markerRect.height / 2;
                const distance =
                    (markerCenterX - viewportCenterX) ** 2 + (markerCenterY - viewportCenterY) ** 2;

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestMarkerCode = marker.code;
                }
            }

            setActiveMarkerCode(closestMarkerCode);
        },
        [scale, visibleMarkers],
    );

    // Unscales markers
    useEffect(() => {
        const img = mapRef.current;
        if (!img) {
            return;
        }

        let animationFrameId: number | null = null;

        const syncTransform = (event: CustomEvent<PanzoomEventDetail>) => {
            setScale(event.detail.scale);
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }

            animationFrameId = requestAnimationFrame(() => {
                updateActiveMarker(event.detail.scale);
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

    const handleUnlockLocation = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (code.length !== 4) {
            return;
        }
        const marker = unlockableMarkers.some(m => m.code === code);
        if (marker) {
            updateCharacter(prev => ({
                mapCodes: prev.mapCodes.includes(code) ? prev.mapCodes : [...prev.mapCodes, code],
            }));
        }
        setCode('');
    };

    return (
        <section className="tabContent map-tab">
            <div ref={viewportRef} className="map-viewport">
                <div
                    ref={mapRef}
                    className="map-surface"
                    style={{ backgroundImage: `url(${mapImage})` }}
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
            <form className="map-unlock-form" onSubmit={handleUnlockLocation}>
                <input
                    type="text"
                    aria-label={t('mapLocationCode')}
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={4}
                    placeholder="○○○○"
                    value={code}
                    onChange={e => setCode(e.currentTarget.value.toLowerCase())}
                />
                <button type="submit">{t('unlock')}</button>
            </form>
        </section>
    );
}

export default MapTab;
