/**
 * ErrorBoundary component - catches React errors and displays fallback UI
 * Provides graceful error handling for the entire app
 */
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    
    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Add error reporting (e.g., Sentry, LogRocket)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
    // Reload the page to reset state
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '40px',
            backgroundColor: '#f5f5f5',
            textAlign: 'center'
          }}
        >
          <div style={{
            fontSize: '64px',
            marginBottom: '24px'
          }}>
            ⚠️
          </div>
          
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1a1a1a',
            marginBottom: '12px'
          }}>
            Oops! Something went wrong
          </h1>
          
          <p style={{
            fontSize: '16px',
            color: '#666',
            marginBottom: '32px',
            maxWidth: '500px'
          }}>
            We're sorry for the inconvenience. The error has been logged and we'll look into it.
          </p>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              textAlign: 'left',
              maxWidth: '600px',
              width: '100%'
            }}>
              <summary style={{
                fontWeight: '600',
                marginBottom: '12px',
                cursor: 'pointer'
              }}>
                Error Details (Development)
              </summary>
              <pre style={{
                margin: 0,
                padding: '12px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px',
                color: '#d32f2f'
              }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
          
          <button
            onClick={this.handleReset}
            style={{
              padding: '12px 32px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#fff',
              backgroundColor: '#2196f3',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Return to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
