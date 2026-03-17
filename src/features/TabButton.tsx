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
            style={{
                borderBottom: 0,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                padding: '0.2rem',
                flex: 1,
                boxSizing: 'border-box',
                ...(isMiniTab ? {flex: '0 0 auto'} : {}),
                ...(active? {
                    color: 'var(--secondary-color)',
                    backgroundColor: 'var(--primary-color)',
                }: {})
            }}
            onClick={onClick}
        >
            {isSettings && <i className="fas fa-gear" />}
            {isCompanion && <i className="fas fa-user" />}
            {!isMiniTab && tabType.toUpperCase()}
        </button>
    );
}

export default TabButton

