export type TabType = "stat" | "inv" | "data" | "map" | "settings"

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

    return (
        <button
            style={{
                borderBottom: 0,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                padding: '0.2rem',
                flex: 1,
                boxSizing: 'border-box',
                ...(isSettings ? {flex: '0 0 auto'} : {}),
                ...(active? {
                    color: 'var(--secondary-color)',
                    backgroundColor: 'var(--primary-color)',
                }: {})
            }}
            onClick={onClick}
        >
            {isSettings ? <i className="fas fa-gear" /> : tabType.toUpperCase()}
        </button>
    );
}

export default TabButton

