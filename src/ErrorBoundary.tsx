import type { FallbackProps } from 'react-error-boundary';

/**
 * Fallback UI shown by ErrorBoundary when an unhandled error is caught.
 * Used as `fallbackRender` prop of <ErrorBoundary> from react-error-boundary.
 */
export function ErrorFallback({ error, resetErrorBoundary }: Readonly<FallbackProps>) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Riconosce se l'errore è generato dalla validazione Zod (schema dei salvataggi)
    const isZodError = error && typeof error === 'object' && 'issues' in error;
    const zodIssues = isZodError ? (error as { issues: unknown }).issues : null;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100dvh',
                padding: '2rem',
                backgroundColor: 'var(--primary-color, #111)',
                color: 'var(--secondary-color, #00ff66)',
                fontFamily: 'monospace',
                textAlign: 'center',
                boxSizing: 'border-box',
            }}
        >
            <h1 style={{ color: 'var(--failure-color, #ff3333)', marginBottom: '1rem' }}>
                ⚠️ Pip-Boy System Error
            </h1>

            <p style={{ marginBottom: '1.5rem', maxWidth: '600px', lineHeight: 1.5 }}>
                The Pip-Boy encountered an initialization error. Try restarting the system.
                Your saved character data remains untouched.
            </p>

            <button
                onClick={resetErrorBoundary}
                style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--secondary-color, #00ff66)',
                    color: 'var(--primary-color, #111)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    marginBottom: '2rem',
                }}
            >
                🔄 Restart Pip-Boy
            </button>

            {Boolean(error) && (
                <details
                    open
                    style={{
                        width: '100%',
                        maxWidth: '800px',
                        textAlign: 'left',
                        backgroundColor: 'rgba(255, 0, 0, 0.08)',
                        padding: '1rem',
                        borderRadius: '4px',
                        border: '1px solid var(--failure-color, #ff3333)',
                        boxSizing: 'border-box',
                    }}
                >
                    <summary style={{ cursor: 'pointer', marginBottom: '1rem', fontWeight: 'bold' }}>
                        🐛 Error Details ({errorMessage})
                    </summary>

                    {Array.isArray(zodIssues) && (
                        <div style={{ marginBottom: '1rem' }}>
                            <strong style={{ color: 'var(--failure-color, #ff3333)' }}>
                                Zod Schema Validation Errors:
                            </strong>
                            <pre
                                style={{
                                    fontSize: '0.8rem',
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    padding: '0.5rem',
                                    borderRadius: '4px',
                                    whiteSpace: 'pre-wrap',
                                    marginTop: '0.5rem',
                                }}
                            >
                                {JSON.stringify(zodIssues, null, 2)}
                            </pre>
                        </div>
                    )}

                    {errorStack && (
                        <div>
                            <strong>Stack Trace:</strong>
                            <pre
                                style={{
                                    fontSize: '0.75rem',
                                    overflow: 'auto',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    maxWidth: '100%',
                                    maxHeight: '300px',
                                    margin: '0.5rem 0 0 0',
                                }}
                            >
                                {errorStack}
                            </pre>
                        </div>
                    )}
                </details>
            )}
        </div>
    );
}
