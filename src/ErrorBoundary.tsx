import type { FallbackProps } from 'react-error-boundary';

/**
 * Fallback UI shown by ErrorBoundary when an unhandled error is caught.
 * Used as `fallbackRender` prop of <ErrorBoundary> from react-error-boundary.
 */
export function ErrorFallback({ error, resetErrorBoundary }: Readonly<FallbackProps>) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100dvh',
                padding: '2rem',
                backgroundColor: 'var(--primary-color)',
                color: 'var(--secondary-color)',
                fontFamily: 'monospace',
                textAlign: 'center',
            }}
        >
            <h1 style={{ color: 'var(--failure-color)', marginBottom: '1rem' }}>
                ⚠️ Something went wrong
            </h1>

            <p style={{ marginBottom: '2rem', maxWidth: '600px' }}>
                The Pip-Boy encountered an error and needs to restart. Your character data should be
                safe in localStorage.
            </p>

            <button
                onClick={resetErrorBoundary}
                style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--secondary-color)',
                    color: 'var(--primary-color)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                    marginBottom: '2rem',
                }}
            >
                🔄 Restart Pip-Boy
            </button>

            {import.meta.env.DEV && Boolean(error) && (
                <details
                    style={{
                        width: '100%',
                        maxWidth: '800px',
                        textAlign: 'left',
                        backgroundColor: 'rgba(from var(--failure-color) r g b / 0.1)',
                        padding: '1rem',
                        borderRadius: '4px',
                        border: '1px solid var(--failure-color)',
                        boxSizing: 'border-box',
                    }}
                >
                    <summary style={{ cursor: 'pointer', marginBottom: '1rem' }}>
                        🐛 Error Details (Development Only)
                    </summary>
                    <pre
                        style={{
                            fontSize: '0.75rem',
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            maxWidth: '100%',
                            margin: 0,
                        }}
                    >
                        {error instanceof Error ? error.toString() : String(error)}
                        {error instanceof Error ? error.stack : undefined}
                    </pre>
                </details>
            )}
        </div>
    );
}
