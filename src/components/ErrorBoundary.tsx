import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          textAlign: 'center',
          background: '#0a0a0a',
          color: '#fff',
        }}>
          <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Something went wrong</h1>
          <p style={{ marginBottom: '16px', color: '#888' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
          <details style={{ marginTop: '24px', textAlign: 'left', maxWidth: '600px' }}>
            <summary style={{ cursor: 'pointer', color: '#888' }}>Error Details</summary>
            <pre style={{
              marginTop: '12px',
              padding: '12px',
              background: '#1a1a1a',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
            }}>
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
