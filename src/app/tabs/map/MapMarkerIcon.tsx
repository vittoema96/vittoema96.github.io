import { Icon } from '@iconify/react';
import { markerCategoryIcons, markerIconRegistry } from '@/app/tabs/map/markerIcons';
import { MapMarkerCategory, MapMarkerIconKey } from '@/app/tabs/map/mapMarkerTypes';

type MapMarkerIconProps = Readonly<{
    category: MapMarkerCategory;
    iconKey?: MapMarkerIconKey;
    size: string;
}>;

function MapMarkerIcon({ category, iconKey, size }: MapMarkerIconProps) {
    const resolvedIconKey = iconKey ?? markerCategoryIcons[category];
    const icon = markerIconRegistry[resolvedIconKey];

    if (!icon) {
        return (
            <div
                className="themed-svg"
                data-icon="caps"
                style={{ width: size, height: size }}
                aria-hidden="true"
            />
        );
    }

    return (
        <span className="map-marker__icon-shell" style={{ width: size, height: size }}>
            <Icon icon={icon} className="map-marker__icon" width={size} height={size} aria-hidden="true" />
        </span>
    );
}

export default MapMarkerIcon;

