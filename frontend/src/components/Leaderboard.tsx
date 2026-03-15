/**
 * Leaderboard component - displays top 10 scores
 */
import { useEffect, useState } from 'react';
import { getLeaderboard } from '../services/api';
import type { LeaderboardEntry } from '../types';

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getLeaderboard();
      setEntries(data.entries);
    } catch (err) {
      console.error('[Leaderboard] Failed to load:', err);
      setError('Failed to load leaderboard. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="leaderboard-loading" style={{
        textAlign: 'center',
        padding: '40px'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '16px' }}>🏆</div>
        <div>Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-error" style={{
        textAlign: 'center',
        padding: '40px',
        color: '#f44336'
      }}>
        <div style={{ marginBottom: '16px' }}>⚠️</div>
        <div>{error}</div>
        <button
          onClick={loadLeaderboard}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            backgroundColor: '#2196f3',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="leaderboard" style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <h2 style={{
        textAlign: 'center',
        marginBottom: '24px',
        color: '#333'
      }}>
        🏆 Top 10 Players
      </h2>

      {entries.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#666'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎮</div>
          <div>No scores yet!</div>
          <div style={{ fontSize: '14px', marginTop: '8px' }}>
            Be the first to submit a score
          </div>
        </div>
      ) : (
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: '#fff',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#667eea', color: '#fff' }}>
              <th style={{ padding: '12px', textAlign: 'center', width: '60px' }}>Rank</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Player</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr
                key={entry.rank}
                style={{
                  backgroundColor: index % 2 === 0 ? '#f5f5f5' : '#fff',
                  borderBottom: '1px solid #e0e0e0'
                }}
              >
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  {entry.rank === 1 && '🥇'}
                  {entry.rank === 2 && '🥈'}
                  {entry.rank === 3 && '🥉'}
                  {entry.rank > 3 && `#${entry.rank}`}
                </td>
                <td style={{ padding: '12px', textAlign: 'left', fontWeight: '500' }}>
                  {entry.player_name}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#667eea' }}>
                  {entry.total_score.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{
        textAlign: 'center',
        marginTop: '24px',
        color: '#666',
        fontSize: '14px'
      }}>
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
