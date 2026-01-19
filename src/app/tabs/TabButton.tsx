import { JSX } from 'react/jsx-runtime'

export type TabType = "stat" | "inv" | "data" | "map" | "settings"

interface TabButtonProps {
    tabType: TabType;
    active: boolean;
    onClick: () => void;
    icon?: JSX.Element;
}

/**
 * Reusable tab button component
 */
function TabButton({ tabType, active, onClick }: TabButtonProps) {
    const isSettings = tabType === "settings"

    return (
        <button className={`tab-button ${isSettings ? 'mini-tab-button' : ''} ${active ? 'active' : ''}`}
                onClick={onClick}>
            {
                isSettings ?
                <i className="fas fa-gear"/> :
                tabType.toUpperCase()
            }
        </button>
    )
}

export default TabButton

