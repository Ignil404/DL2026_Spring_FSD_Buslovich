/**
 * Timer component - countdown display with visual feedback
 * Compact horizontal design for game header layout
 */
import { useEffect, useState } from 'react';

interface TimerProps {
  timeLimit: number; // seconds
  onTimeUp: () => void;
  isActive: boolean;
  onTick?: (timeRemaining: number) => void;
}

export default function Timer({ timeLimit, onTimeUp, isActive, onTick }: TimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);

  useEffect(() => {
    setTimeRemaining(timeLimit);
  }, [timeLimit]);

  useEffect(() => {
    if (!isActive || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newValue = prev - 1;
        if (onTick) onTick(newValue);
        if (newValue <= 0) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeRemaining, onTimeUp, onTick]);

  const timePercentage = timeRemaining / timeLimit;
  
  const getTimerState = () => {
    if (timePercentage > 0.5) {
      return { color: '#4caf50', bgColor: '#e8f5e9', pulse: false };
    } else if (timePercentage > 0.25) {
      return { color: '#ff9800', bgColor: '#fff3e0', pulse: false };
    } else if (timePercentage > 0.1) {
      return { color: '#f44336', bgColor: '#ffebee', pulse: true };
    } else {
      return { color: '#d32f2f', bgColor: '#ffcdd2', pulse: true };
    }
  };

  const state = getTimerState();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 20px',
      backgroundColor: state.bgColor,
      borderRadius: '8px',
      border: `2px solid ${state.color}`,
      transition: 'all 0.3s ease',
      animation: state.pulse ? 'pulse 1s infinite' : 'none',
      height: '80px',
      flexShrink: 0
    }}>
      {/* Compact timer display */}
      <span style={{
        fontSize: '32px',
        fontWeight: 'bold',
        color: state.color,
        fontVariantNumeric: 'tabular-nums',
        transition: 'color 0.3s ease'
      }}>
        ⏱️ {formatTime(timeRemaining)}
      </span>
      
      {state.pulse && (
        <span style={{
          fontSize: '12px',
          fontWeight: '600',
          color: state.color,
          textTransform: 'uppercase',
          animation: 'pulse 0.5s infinite'
        }}>
          Hurry!
        </span>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
