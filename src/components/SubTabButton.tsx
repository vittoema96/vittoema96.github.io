
/**
 * Reusable sub-tab button component
 * @param {string} id - Sub-tab identifier
 * @param {string} label - Sub-tab label text
 * @param {boolean} active - Whether sub-tab is active
 * @param {function} onClick - Click handler
 */
function SubTabButton({ id, label, active, onClick }) {
    return (
        <button
            className={`subTab-button ${active ? 'active' : ''}`}
            onClick={onClick}
        >
            {label}
        </button>
    )
}

