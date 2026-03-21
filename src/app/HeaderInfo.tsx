import { useCharacter } from '@/contexts/CharacterContext';
import { useState } from 'react';
import HeaderInfoPopup from '@/app/HeaderInfoPopup.tsx';

function HeaderInfo() {
    const [isStatPopupOpen, setIsStatPopupOpen] = useState(false);

    const { character } = useCharacter();

    // Effective max HP is reduced by rads
    const effectiveMaxHp = character.maxHp - character.rads;
    const hasRads = character.rads > 0;
    return (
        <>
            <div onClick={() => setIsStatPopupOpen(true)} style={{ cursor: 'pointer' }}>
                <HeaderInfoRow
                    icon="hp"
                    value={character.currentHp}
                    value2={effectiveMaxHp}
                    value2Danger={hasRads}
                    useBorder
                />
                <HeaderInfoRow
                    icon="caps"
                    value={character.caps}
                    useBorder />
                <HeaderInfoRow
                    icon="weight"
                    value={character.currentWeight}
                    value2={character.maxWeight}
                />
            </div>

            {isStatPopupOpen && <HeaderInfoPopup onClose={() => setIsStatPopupOpen(false)} />}
        </>
    );
}

function HeaderInfoRow({
    icon,
    value,
    value2,
    useBorder,
    value2Danger,
}: Readonly<{
    icon: string;
    value: number | string;
    value2?: number | string;
    useBorder?: boolean;
    value2Danger?: boolean;
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
                className="themed-svg small-icon"
                data-icon={icon}
            ></div>
            <div style={{ flex: 1 }}>
                {value}
                {value2 && <span className={value2Danger ? 'text-danger' : ''}> / {value2}</span>}
            </div>
        </div>
    );
}

export default HeaderInfo;
