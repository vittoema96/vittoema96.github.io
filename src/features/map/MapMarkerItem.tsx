import { RefObject } from 'react';
import { useLongPress } from '@/hooks/useLongPress.ts';
import MapMarkerIcon from '@/features/map/MapMarkerIcon';
import { MapMarker } from '@/features/map/mapMarkerTypes';

const MARKER_SIZE_PX = '20px';
export const MARKER_TEXT_THRESHOLD = 2.5;

export type MapMarkerItemProps = Readonly<{
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
                zIndex: marker.code === activeMarkerCode ? 10 : 1,
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
                    wordWrap: 'break-word',
                    textShadow: [
                        '-1px -1px 0 var(--background-color)',
                        ' 1px -1px 0 var(--background-color)',
                        '-1px  1px 0 var(--background-color)',
                        ' 1px  1px 0 var(--background-color)',
                        '0 0 6px var(--background-color)',
                    ].join(','),
                }}>{marker.id}</span>}
            <div id={marker.code}>
                <MapMarkerIcon
                    category={marker.category}
                    size={MARKER_SIZE_PX}
                    {...(marker.iconKey ? { iconKey: marker.iconKey } : {})}
                />
            </div>
        </div>
    );
}

export default MapMarkerItem;


