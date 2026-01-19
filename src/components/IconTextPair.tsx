interface IconTextPairProps {
    icon: string;
    text: string;
    onClick?: () => void;
    className?: string;
}

/**
 * Reusable component for icon-text pairs (HP, Caps, Weight, etc.)
 */
export default function IconTextPair(
    { icon, text, onClick, className = '' }: Readonly<IconTextPairProps>) {
        return (
            <div
                className={`icon-text-pair ${className}`}
                onClick={onClick}
                style={onClick ? { cursor: 'pointer' } : undefined}
            >
                <div className="themed-svg" data-icon={icon}></div>
                <div>{text}</div>
            </div>
        )
    }


