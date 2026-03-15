/**
 * GameHeader component - displays game progress bar
 * Shows question number, current score, and player name
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
        padding: '16px 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}
    >
      {/* Progress bar at top */}
      <div style={{
        width: '100%',
        height: '4px',
        backgroundColor: '#333',
        borderRadius: '2px',
        marginBottom: '16px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${progressPercentage}%`,
          height: '100%',
          backgroundColor: 'linear-gradient(90deg, #4caf50, #8bc34a)',
          background: 'linear-gradient(90deg, #4caf50 0%, #8bc34a 100%)',
          transition: 'width 0.5s ease',
          borderRadius: '2px'
        }} />
      </div>

      {/* Info bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1400px',
        margin: '0 auto',
        gap: '24px'
      }}>
        {/* Question number */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minWidth: '140px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            backgroundColor: '#2196f3',
            borderRadius: '50%',
            fontSize: '16px',
            fontWeight: '700'
          }}>
            {currentQuestion}
          </div>
          <div>
            <div style={{
              fontSize: '12px',
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Question
            </div>
            <div style={{
              fontSize: '14px',
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
          minWidth: '120px'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#999',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '4px'
          }}>
            Current Score
          </div>
          <div style={{
            fontSize: '28px',
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
          gap: '12px',
          minWidth: '140px',
          justifyContent: 'flex-end'
        }}>
          <div style={{
            textAlign: 'right'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Player
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#fff',
              maxWidth: '150px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {playerName}
            </div>
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#9c27b0',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>
            👤
          </div>
        </div>
      </div>
    </header>
  );
}
