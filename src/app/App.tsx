import { useMemo, useState } from 'react';
import CompanionTab from '@/features/companion/CompanionTab';
import StatTab from '@/features/stat/StatTab';
import InvTab from '@/features/inv/InvTab';
import DataTab from '@/features/data/DataTab';
import MapTab from '@/features/map/MapTab';
import SettingsTab from '@/features/settings/SettingsTab';
import TabButton, { TabType } from '@/features/TabButton';
import { useCharacter } from '@/contexts/CharacterContext';
import { FitText } from '@/components/FitText.tsx';
import HeaderInfo from '@/app/HeaderInfo.tsx';

const TABS = {
    companion: CompanionTab,
    stat: StatTab,
    inv: InvTab,
    data: DataTab,
    map: MapTab,
    settings: SettingsTab
} as const

function App() {
    const { character } = useCharacter();
    const [activeTab, setActiveTab] = useState<TabType>('stat');

    // Check if player has Robot Wrangler perk
    const hasRobotWrangler = character.perks?.includes('perkRobotWrangler') ?? false;
    const hasDogmeat = character.perks?.includes('perkDogmeat') ?? false;

    // Filter visible tabs based on perks
    const visibleTabs = useMemo(() => {
        const allTabs = Object.keys(TABS) as TabType[];
        return allTabs.filter(tabType => {
            // Hide companion tab if player doesn't have Robot Wrangler perk
            return !(tabType === 'companion' && !hasRobotWrangler && !hasDogmeat);
        });
    }, [hasDogmeat, hasRobotWrangler]);

    // Get active tab component (only render the active one for better performance)
    const ActiveTabComponent = TABS[activeTab];

    return (
        <>
            <header className="l-lastSmall">
                <FitText maxSize={35}>Pip-Boy 3000</FitText>
                <HeaderInfo />
            </header>

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
