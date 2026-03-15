/**
 * HomePage - Entry point with player name input and start button
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface HomePageProps {
  onStartGame: (playerName: string) => void;
}

export default function HomePage({ onStartGame }: HomePageProps) {
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate name
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (playerName.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    
    if (playerName.trim().length > 20) {
      setError('Name must be 20 characters or less');
      return;
    }

    // Store player name for GamePage to use
    sessionStorage.setItem('playerName', playerName.trim());
    
    // Navigate to game (GamePage will start the round)
    navigate('/game');
  };

  return (
    <div className="home-page" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        maxWidth: '400px',
        width: '100%'
      }}>
        {/* Title */}
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          🌍 Geography Quiz
        </h1>
        
        <p style={{
          fontSize: '16px',
          color: '#666',
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          Test your geography knowledge!
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="playerName"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '8px'
              }}
            >
              Enter Your Name
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                setError('');
              }}
              placeholder="Your name"
              maxLength={20}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
            
            {error && (
              <p style={{
                marginTop: '8px',
                fontSize: '14px',
                color: '#f44336'
              }}>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#fff',
              backgroundColor: '#667eea',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5568d3'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#667eea'}
          >
            Start Quiz
          </button>
        </form>

        {/* Instructions */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#666'
        }}>
          <strong>How to play:</strong>
          <ul style={{
            marginTop: '8px',
            paddingLeft: '20px'
          }}>
            <li>You'll get 10 geography questions</li>
            <li>Click on the map where you think the location is</li>
            <li>Points based on accuracy and speed</li>
            <li>Submit your score to the leaderboard!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
