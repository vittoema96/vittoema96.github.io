import React, { useMemo, useState } from 'react';
import CompanionTab from '@/app/tabs/companion/CompanionTab';
import StatTab from '@/app/tabs/stat/StatTab';
import InvTab from '@/app/tabs/inv/InvTab';
import DataTab from '@/app/tabs/data/DataTab';
import MapTab from '@/app/tabs/map/MapTab';
import SettingsTab from '@/app/tabs/settings/SettingsTab';
import TabButton, { TabType } from '@/app/tabs/TabButton';
import { useCharacter } from '@/app/contexts/CharacterContext';
import { FitText } from '@/app/components/FitText.tsx';
import AppHeaderData from '@/app/AppHeaderData.tsx';
import useIsDesktop from '@/hooks/useIsDesktop';
import { getAvailableCompanions } from '@/features/character/feats';
import { Character } from '@/types';

const TABS: Record<TabType, React.ComponentType<any>> = {
    companion: CompanionTab,
    stat: StatTab,
    inv: InvTab,
    data: DataTab,
    map: MapTab,
    settings: SettingsTab
} as const

// Condition = true means SHOW the locked tab
const LOCKED_TABS: Partial<Record<TabType, (c: Character) => boolean>> = {
    companion: (c: Character) => getAvailableCompanions(c).length !== 0
}

const getKeys = <T extends object>(obj: T) => Object.keys(obj) as Array<keyof T>;

function App() {
    const { character } = useCharacter();
    const [activeTab, setActiveTab] = useState<TabType>('stat');
    const isDesktop = useIsDesktop(); // Split screen if width < 900px

    const visibleTabs = useMemo(() => {
        const allTabs = getKeys(TABS);
        return allTabs.filter(tabType => {
            return !LOCKED_TABS[tabType] || LOCKED_TABS[tabType](character)
        });
    }, [character]);

    // Desktop: right panel shows all tabs except 'stat' (stat is always on the left)
    const rightPanelTabs = useMemo(
        () => visibleTabs.filter(t => t !== 'stat'),
        [visibleTabs]
    );

    // Desktop: if the user had 'stat' selected, default to the first right-panel tab
    const desktopRightActiveTab: TabType =
        activeTab === 'stat' ? 'inv' : activeTab;

    const ActiveTabComponent = TABS[activeTab];
    const DesktopRightComponent = TABS[desktopRightActiveTab];

    const appHeader = (
        <header className="l-lastSmall">
            <FitText maxSize={35}>Pip-Boy 3000</FitText>
            <AppHeaderData />
        </header>
    );

    /* ── Desktop layout: split screen ── */
    if (isDesktop) {
        return (
            <>
                {appHeader}
                <hr />
                <div className="l-desktop-layout">
                    {/* Left panel: StatTab sempre visibile — stesso <main> delle altre tab */}
                    <div className="l-desktop-stat-panel">
                        <main>
                            <StatTab />
                        </main>
                    </div>

                    {/* Right panel: navigator + tab attiva */}
                    <div className="l-desktop-right-panel">
                        <nav>
                            {rightPanelTabs.map(tabType => (
                                <TabButton
                                    key={tabType}
                                    onClick={() => setActiveTab(tabType)}
                                    tabType={tabType}
                                    active={desktopRightActiveTab === tabType}
                                />
                            ))}
                        </nav>
                        <main>
                            <DesktopRightComponent />
                        </main>
                    </div>
                </div>
            </>
        );
    }

    /* ── Mobile layout (default) ── */
    return (
        <>
            {appHeader}
            <hr />

            {/* Tab Navigation */}
            <nav>
                {visibleTabs.map(tabType => (
                    <TabButton
                        key={tabType}
                        onClick={() => setActiveTab(tabType)}
                        tabType={tabType}
                        active={activeTab === tabType}
                    />
                ))}
            </nav>

            {/* Tab Content - Only render active tab for better performance */}
            <main>
                <ActiveTabComponent />
            </main>
        </>
    );
}

export default App
