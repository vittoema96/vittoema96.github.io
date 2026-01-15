import React from 'react'

/**
 * Error Boundary component to catch and handle React errors gracefully
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError() {
        // Update state so the next render will show the fallback UI
        return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
        // Log error details for debugging
        console.error('ErrorBoundary caught an error:', error, errorInfo)
        
        this.setState({
            error: error,
            errorInfo: errorInfo
        })
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null })
    }

    render() {
        if (this.state.hasError) {
            // Fallback UI
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    padding: '2rem',
                    backgroundColor: 'var(--primary-color, #000)',
                    color: 'var(--secondary-color, #afff03)',
                    fontFamily: 'monospace',
                    textAlign: 'center'
                }}>
                    <h1 style={{ color: 'var(--failure-color, #dc143c)', marginBottom: '1rem' }}>
                        ⚠️ Something went wrong
                    </h1>
                    
                    <p style={{ marginBottom: '2rem', maxWidth: '600px' }}>
                        The Pip-Boy encountered an error and needs to restart. 
                        Your character data should be safe in localStorage.
                    </p>

                    <button 
                        onClick={this.handleReset}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: 'var(--secondary-color, #afff03)',
                            color: 'var(--primary-color, #000)',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: '1rem',
                            marginBottom: '2rem'
                        }}
                    >
                        🔄 Restart Pip-Boy
                    </button>

                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details style={{
                            width: '100%',
                            maxWidth: '800px',
                            textAlign: 'left',
                            backgroundColor: 'rgba(220, 20, 60, 0.1)',
                            padding: '1rem',
                            borderRadius: '4px',
                            border: '1px solid var(--failure-color, #dc143c)',
                            boxSizing: 'border-box'
                        }}>
                            <summary style={{ cursor: 'pointer', marginBottom: '1rem' }}>
                                🐛 Error Details (Development Only)
                            </summary>
                            <pre style={{
                                fontSize: '0.75rem',
                                overflow: 'auto',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                maxWidth: '100%',
                                margin: 0
                            }}>
                                {this.state.error.toString()}
                                {this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                    )}
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
