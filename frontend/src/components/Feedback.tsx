/**
 * Feedback component - shows results after answering
 */
import type { AnswerResult } from '../types';

interface FeedbackProps {
  result: AnswerResult;
  onNext: () => void;
  isLastQuestion?: boolean;
}

export default function Feedback({ result, onNext, isLastQuestion = false }: FeedbackProps) {
  const getAccuracyMessage = (distance: number) => {
    if (distance < 100) return { text: 'Perfect! 🎯', color: '#4caf50' };
    if (distance < 500) return { text: 'Great job! 👍', color: '#8bc34a' };
    if (distance < 1000) return { text: 'Not bad! 👌', color: '#ff9800' };
    if (distance < 5000) return { text: 'Keep trying! 💪', color: '#ff9800' };
    return { text: 'Way off! 🎯', color: '#f44336' };
  };

  const accuracy = getAccuracyMessage(result.distance_km);

  return (
    <div className="feedback" style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      padding: '30px',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      zIndex: 1000,
      minWidth: '300px',
      textAlign: 'center'
    }}>
      {/* Accuracy message */}
      <h3 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: accuracy.color,
        marginBottom: '16px'
      }}>
        {accuracy.text}
      </h3>

      {/* Distance */}
      <div className="distance" style={{
        fontSize: '18px',
        color: '#666',
        marginBottom: '12px'
      }}>
        Distance: <strong>{result.distance_km.toFixed(2)} km</strong>
      </div>

      {/* Score breakdown */}
      <div className="score-breakdown" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ padding: '12px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>Base Points</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1976d2' }}>
            {result.base_points}
          </div>
        </div>
        <div style={{ padding: '12px', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>Speed Bonus</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f57c00' }}>
            {(result.speed_multiplier * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Final score */}
      <div className="final-score" style={{
        padding: '16px',
        backgroundColor: accuracy.color + '20',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Final Score</div>
        <div style={{ fontSize: '36px', fontWeight: 'bold', color: accuracy.color }}>
          {result.final_score}
        </div>
      </div>

      {/* Next button */}
      <button
        onClick={() => {
          console.log('[Feedback] Next button clicked, isLastQuestion:', isLastQuestion);
          onNext();
        }}
        style={{
          padding: '12px 32px',
          fontSize: '16px',
          fontWeight: '600',
          color: '#fff',
          backgroundColor: '#2196f3',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2196f3'}
      >
        {isLastQuestion ? 'See Results' : 'Next Question'}
      </button>
    </div>
  );
}
