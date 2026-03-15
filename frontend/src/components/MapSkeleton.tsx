/**
 * Skeleton loader for Map component
 * Provides visual feedback during map tiles loading
 */
export default function MapSkeleton() {
  return (
    <div
      className="map-skeleton"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        backgroundColor: '#e0e0e0',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px'
      }}
    >
      {/* Map placeholder pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
          linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
          linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
        `,
        backgroundSize: '40px 40px',
        backgroundPosition: '0 0, 0 20px, 20px -20px, -20px 0px',
        opacity: 0.5
      }} />

      {/* Loading indicator */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '24px 32px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        {/* Spinning loader */}
        <div style={{
          width: '40px',
          height: '40px',
          margin: '0 auto 16px',
          border: '4px solid #e0e0e0',
          borderTop: '4px solid #2196f3',
          borderRadius: '50%',
          animation: 'skeleton-spin 1s linear infinite'
        }} />
        
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#666',
          marginBottom: '8px'
        }}>
          Loading Map...
        </div>
        
        <div style={{
          fontSize: '13px',
          color: '#999'
        }}>
          Preparing your geography challenge
        </div>
      </div>

      {/* CSS for skeleton animation */}
      <style>{`
        @keyframes skeleton-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
