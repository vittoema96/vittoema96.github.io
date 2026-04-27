export type MapMarkerCategory =
    | 'bunker'
    | 'camp'
    | 'canyon'
    | 'cemetery'
    | 'city'
    | 'dam'
    | 'fortress'
    | 'hazard'
    | 'industrial'
    | 'medical'
    | 'military'
    | 'prison'
    | 'scrapyard'
    | 'school'
    | 'settlement'
    | 'store'
    | 'vault';

export type MapMarkerIconKey =
    | 'bunker'
    | 'camp'
    | 'canyon'
    | 'cemetery'
    | 'city'
    | 'dam'
    | 'fortress'
    | 'hazard'
    | 'industrial'
    | 'medical'
    | 'military'
    | 'prison'
    | 'scrapyard'
    | 'school'
    | 'settlement'
    | 'store'
    | 'vault';

export type MapMarker = {
    id: string;
    code: string;
    x: number;
    y: number;
    category: MapMarkerCategory;
    iconKey?: MapMarkerIconKey;
};

