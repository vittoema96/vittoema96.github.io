import { useCharacter } from '@/contexts/CharacterContext';
import { useState } from 'react';
import AppHeaderPopup from '@/app/AppHeaderPopup.tsx';

function AppHeaderData() {
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const { character } = useCharacter();

    // Effective max HP is reduced by rads
    const effectiveMaxHp = character.maxHp - character.rads;
    const hasRads = character.rads > 0;
    return (
        <>
            <div onClick={() => setIsPopupOpen(true)} style={{ cursor: 'pointer' }}>
                <HeaderInfoRow
                    icon="hp"
                    value={character.currentHp}
                    valueTot={effectiveMaxHp}
                    valueTotDanger={hasRads}
                    useBorder
                />
                <HeaderInfoRow
                    icon="caps"
                    value={character.caps}
                    useBorder />
                <HeaderInfoRow
                    icon="weight"
                    value={character.currentWeight}
                    valueTot={character.maxWeight}
                />
            </div>

            {isPopupOpen && <AppHeaderPopup onClose={() => setIsPopupOpen(false)} />}
        </>
    );
}

function HeaderInfoRow({
    icon,
    value,
    valueTot,
    useBorder,
    valueTotDanger,
}: Readonly<{
    icon: string;
    value: number | string;
    valueTot?: number | string;
    useBorder?: boolean;
    valueTotDanger?: boolean;
}>) {
    return (
        <div
            style={{
                borderBottom: useBorder ? "var(--border-primary-thick)" : 0,
                paddingRight: "var(--space-m)"
            }}
            className={"row"}
        >
            <div
                className="themed-svg icon-s"
                data-icon={icon}
            ></div>
            <div style={{ flex: 1 }}>
                {value}
                {valueTot && <span className={valueTotDanger ? 'text-warning' : ''}> / {valueTot}</span>}
            </div>
        </div>
    );
}

export default AppHeaderData;
