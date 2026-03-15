/**
 * Skeleton loader for QuestionCard component
 * Provides visual feedback during question loading
 */
export default function QuestionCardSkeleton() {
  return (
    <article
      className="question-card-skeleton"
      style={{
        padding: '24px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        maxWidth: '420px',
        minWidth: '320px',
        border: '1px solid #e0e0e0'
      }}
    >
      {/* Header badges skeleton */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        gap: '8px'
      }}>
        {/* Location type badge skeleton */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          backgroundColor: '#f0f0f0',
          borderRadius: '20px',
          width: '100px',
          height: '32px',
          animation: 'skeleton-pulse 1.5s infinite'
        }} />
        
        {/* Difficulty badge skeleton */}
        <div style={{
          padding: '6px 12px',
          backgroundColor: '#f0f0f0',
          borderRadius: '20px',
          width: '70px',
          height: '32px',
          animation: 'skeleton-pulse 1.5s infinite'
        }} />
      </div>

      {/* Question text skeleton */}
      <div style={{
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        height: '28px',
        marginBottom: '12px',
        animation: 'skeleton-pulse 1.5s infinite'
      }} />
      <div style={{
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        height: '28px',
        width: '70%',
        marginBottom: '20px',
        animation: 'skeleton-pulse 1.5s infinite'
      }} />

      {/* Hint skeleton (optional) */}
      <div style={{
        padding: '14px 16px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        borderLeft: '4px solid #e0e0e0',
        marginBottom: '16px'
      }}>
        <div style={{
          backgroundColor: '#e0e0e0',
          borderRadius: '4px',
          height: '14px',
          width: '60px',
          marginBottom: '8px',
          animation: 'skeleton-pulse 1.5s infinite'
        }} />
        <div style={{
          backgroundColor: '#e0e0e0',
          borderRadius: '4px',
          height: '16px',
          width: '80%',
          animation: 'skeleton-pulse 1.5s infinite'
        }} />
      </div>

      {/* Time limit skeleton */}
      <div style={{
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <div style={{
          backgroundColor: '#f0f0f0',
          borderRadius: '4px',
          width: '80px',
          height: '20px',
          animation: 'skeleton-pulse 1.5s infinite'
        }} />
      </div>

      {/* CSS for skeleton animation */}
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </article>
  );
}
