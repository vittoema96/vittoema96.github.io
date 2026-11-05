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
        <div className="error-screen">
            <h1 className="error-screen__title">
                ⚠️ Pip-Boy System Error
            </h1>

            <p className="error-screen__message">
                The Pip-Boy encountered an initialization error. Try restarting the system.
                Your saved character data remains untouched.
            </p>

            <button
                onClick={resetErrorBoundary}
                className="error-screen__restart"
            >
                🔄 Restart Pip-Boy
            </button>

            {Boolean(error) && (
                <details
                    open
                    className="error-screen__details"
                >
                    <summary className="error-screen__summary">
                        🐛 Error Details ({errorMessage})
                    </summary>

                    {Array.isArray(zodIssues) && (
                        <div className="error-screen__issues">
                            <strong className="error-screen__failure">
                                Zod Schema Validation Errors:
                            </strong>
                            <pre
                                className="error-screen__code"
                            >
                                {JSON.stringify(zodIssues, null, 2)}
                            </pre>
                        </div>
                    )}

                    {errorStack && (
                        <div>
                            <strong>Stack Trace:</strong>
                            <pre
                                className="error-screen__stack"
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
