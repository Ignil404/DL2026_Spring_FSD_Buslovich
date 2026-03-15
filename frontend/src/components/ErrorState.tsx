/**
 * ErrorState component - displays error message with retry button
 * Used for network errors and other recoverable failures
 */
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  retryLabel?: string;
  backLabel?: string;
}

export default function ErrorState({
  title = 'Oops! Something went wrong',
  message,
  onRetry,
  onGoBack,
  retryLabel = 'Try Again',
  backLabel = 'Go Back'
}: ErrorStateProps) {
  return (
    <div
      className="error-state"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: '40px 20px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        margin: '0 auto',
        textAlign: 'center'
      }}
    >
      {/* Error icon */}
      <div style={{
        width: '80px',
        height: '80px',
        marginBottom: '24px',
        backgroundColor: '#ffebee',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '40px'
      }}>
        ⚠️
      </div>

      {/* Title */}
      <h2 style={{
        fontSize: '24px',
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: '12px',
        marginTop: 0
      }}>
        {title}
      </h2>

      {/* Error message */}
      <p style={{
        fontSize: '16px',
        color: '#666',
        lineHeight: '1.6',
        marginBottom: '32px',
        maxWidth: '400px'
      }}>
        {message}
      </p>

      {/* Action buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#fff',
              backgroundColor: '#2196f3',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2196f3'}
          >
            <span>🔄</span>
            {retryLabel}
          </button>
        )}
        
        {onGoBack && (
          <button
            onClick={onGoBack}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#333',
              backgroundColor: '#e0e0e0',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d0d0d0'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
          >
            <span>←</span>
            {backLabel}
          </button>
        )}
      </div>

      {/* Error code (optional, for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <details style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#666',
          textAlign: 'left',
          maxWidth: '100%'
        }}>
          <summary style={{
            fontWeight: '600',
            marginBottom: '8px',
            cursor: 'pointer'
          }}>
            Technical Details
          </summary>
          <pre style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: '11px',
            color: '#999'
          }}>
            {message}
          </pre>
        </details>
      )}
    </div>
  );
}
