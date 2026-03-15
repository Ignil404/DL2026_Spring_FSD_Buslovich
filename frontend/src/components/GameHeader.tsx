/**
 * GameHeader component - displays game progress bar
 * Shows question number, current score, and player name
 * Responsive design with mobile-first approach
 */
interface GameHeaderProps {
  currentQuestion: number;
  totalQuestions: number;
  currentScore: number;
  playerName: string;
}

export default function GameHeader({
  currentQuestion,
  totalQuestions,
  currentScore,
  playerName
}: GameHeaderProps) {
  const progressPercentage = ((currentQuestion - 1) / totalQuestions) * 100;

  return (
    <header
      className="game-header"
      style={{
        width: '100%',
        backgroundColor: '#1a1a1a',
        color: '#fff',
        padding: '12px 16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}
    >
      {/* Progress bar at top */}
      <div style={{
        width: '100%',
        height: '4px',
        backgroundColor: '#333',
        borderRadius: '2px',
        marginBottom: '12px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${progressPercentage}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #4caf50 0%, #8bc34a 100%)',
          transition: 'width 0.5s ease',
          borderRadius: '2px'
        }} />
      </div>

      {/* Info bar - responsive layout */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1400px',
        margin: '0 auto',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        {/* Question number */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: '100px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            backgroundColor: '#2196f3',
            borderRadius: '50%',
            fontSize: '14px',
            fontWeight: '700'
          }}>
            {currentQuestion}
          </div>
          <div>
            <div style={{
              fontSize: '10px',
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Question
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#fff'
            }}>
              of {totalQuestions}
            </div>
          </div>
        </div>

        {/* Current score */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minWidth: '80px'
        }}>
          <div style={{
            fontSize: '10px',
            color: '#999',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '2px'
          }}>
            Score
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#4caf50',
            textShadow: '0 0 10px rgba(76, 175, 80, 0.5)',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {currentScore.toLocaleString()}
          </div>
        </div>

        {/* Player name */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: '100px',
          justifyContent: 'flex-end'
        }}>
          <div style={{
            textAlign: 'right'
          }}>
            <div style={{
              fontSize: '10px',
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Player
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#fff',
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {playerName}
            </div>
          </div>
          <div style={{
            width: '32px',
            height: '32px',
            backgroundColor: '#9c27b0',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}>
            👤
          </div>
        </div>
      </div>

      {/* Mobile-responsive styles */}
      <style>{`
        @media (max-width: 480px) {
          .game-header {
            padding: 8px 12px;
          }
          
          .game-header > div:last-child {
            gap: 8px;
          }
          
          .game-header > div:last-child > div {
            min-width: 80px !important;
          }
        }
      `}</style>
    </header>
  );
}
