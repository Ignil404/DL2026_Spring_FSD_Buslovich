/**
 * LeaderboardPage - Full page leaderboard display
 */
import { useNavigate } from 'react-router-dom';
import Leaderboard from '../components/Leaderboard';

export default function LeaderboardPage() {
  const navigate = useNavigate();

  return (
    <div className="leaderboard-page" style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#e0e0e0',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Back to Home
        </button>
        <button
          onClick={() => navigate('/game')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4caf50',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          Play Now
        </button>
      </div>

      {/* Leaderboard */}
      <Leaderboard />
    </div>
  );
}
