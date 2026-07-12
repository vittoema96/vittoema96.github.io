export type TabType = "companion" | "stat" | "inv" | "data" | "map" | "settings"

interface TabButtonProps {
    tabType: TabType;
    active: boolean;
    onClick: () => void;
}

/**
 * Reusable tab button component
 */
function TabButton({ tabType, active, onClick }: Readonly<TabButtonProps>) {
    const isSettings = tabType === 'settings';
    const isCompanion = tabType === 'companion';
    const isMiniTab = isSettings || isCompanion;

    return (
        <button
            className={`tab-button ${isMiniTab ? 'mini' : ''} ${active ? 'active' : ''}`}
            onClick={onClick}
        >
            {isSettings && <i className="fas fa-gear" />}
            {isCompanion && <i className="fas fa-user" />}
            {!isMiniTab && tabType.toUpperCase()}
        </button>
    );
}

export default TabButton

