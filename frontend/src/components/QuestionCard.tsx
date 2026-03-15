/**
 * QuestionCard component - displays question text, hint, and location type
 * Compact horizontal design for game header layout
 */
import type { Question } from '../types';

interface QuestionCardProps {
  question: Question;
}

export default function QuestionCard({ question }: QuestionCardProps) {
  const getLocationTypeConfig = (type: string) => {
    switch (type) {
      case 'country':
        return { icon: '🌍', label: 'Country', color: '#2196f3' };
      case 'city':
        return { icon: '🏙️', label: 'City', color: '#ff9800' };
      case 'landmark':
        return { icon: '🏛️', label: 'Landmark', color: '#9c27b0' };
      default:
        return { icon: '📍', label: 'Location', color: '#666' };
    }
  };

  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return { color: '#4caf50', bgColor: '#e8f5e9' };
      case 'medium':
        return { color: '#ff9800', bgColor: '#fff3e0' };
      case 'hard':
        return { color: '#f44336', bgColor: '#ffebee' };
      default:
        return { color: '#9e9e9e', bgColor: '#f5f5f5' };
    }
  };

  const locationType = getLocationTypeConfig(question.location_type);
  const difficulty = getDifficultyConfig(question.difficulty);

  return (
    <article 
      className="question-card" 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '12px 20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        flex: 1,
        minWidth: 0,
        height: '80px'
      }}
    >
      {/* Location type + Difficulty badges */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          backgroundColor: `${locationType.color}15`,
          borderRadius: '12px',
          border: `1px solid ${locationType.color}30`,
          fontSize: '12px',
          fontWeight: '500'
        }}>
          <span style={{ fontSize: '14px' }}>{locationType.icon}</span>
          <span style={{ color: locationType.color, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
            {locationType.label}
          </span>
        </div>

        <div style={{
          padding: '4px 10px',
          backgroundColor: difficulty.bgColor,
          borderRadius: '12px',
          border: `1px solid ${difficulty.color}30`,
          fontSize: '10px',
          fontWeight: '600',
          color: difficulty.color,
          textTransform: 'uppercase',
          textAlign: 'center',
          whiteSpace: 'nowrap'
        }}>
          {difficulty.label}
        </div>
      </div>

      {/* Question text */}
      <h2 style={{
        flex: 1,
        fontSize: '16px',
        fontWeight: '600',
        color: '#1a1a1a',
        lineHeight: '1.3',
        margin: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical'
      }}>
        {question.text}
      </h2>

      {/* Hint (if available) - compact */}
      {question.hint && (
        <div style={{
          flexShrink: 0,
          maxWidth: '150px',
          padding: '8px 12px',
          backgroundColor: '#f5f5f5',
          borderRadius: '6px',
          borderLeft: '3px solid #2196f3',
          fontStyle: 'italic',
          color: '#666',
          fontSize: '12px',
          lineHeight: '1.3',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          💡 {question.hint}
        </div>
      )}
    </article>
  );
}
