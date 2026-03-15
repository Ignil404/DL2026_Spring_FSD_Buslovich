/**
 * GamePage - Main game screen with map, question, timer, and feedback
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Map from '../components/Map';
import QuestionCard from '../components/QuestionCard';
import Timer from '../components/Timer';
import Feedback from '../components/Feedback';
import QuestionCardSkeleton from '../components/QuestionCardSkeleton';
import MapSkeleton from '../components/MapSkeleton';
import ErrorState from '../components/ErrorState';
import GameHeader from '../components/GameHeader';
import { useGame } from '../hooks/useGame';
import { submitScore } from '../services/api';

export default function GamePage() {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  
  const {
    gameState,
    startNewRound,
    submitAnswerClick,
    goToNextQuestion,
    resetGame,
    isLoading,
    error,
    currentQuestionNumber,
    currentScore,
  } = useGame();

  // Initialize game round on mount if not already started
  useEffect(() => {
    console.log('[GamePage] useEffect - initialization check', {
      hasInitialized,
      hasCurrentQuestion: !!gameState.currentQuestion,
      isPlaying: gameState.isPlaying,
      hasRound: !!gameState.round,
      roundId: gameState.round?.id,
      isComplete: gameState.isComplete,
      hasRoundSummary: !!gameState.roundSummary,
    });

    // Don't start a new round if the game is complete
    if (gameState.isComplete && gameState.roundSummary) {
      console.log('[GamePage] Game is complete, not starting new round');
      return;
    }

    // Check if we need to start a new round:
    // - Not yet initialized AND
    // - (No current question OR No round OR Not playing)
    const needsRound = !hasInitialized && (!gameState.currentQuestion || !gameState.round || !gameState.isPlaying);
    
    if (needsRound) {
      const playerName = sessionStorage.getItem('playerName');
      console.log('[GamePage] Starting round for player:', playerName);

      if (playerName) {
        startNewRound(playerName);
      } else {
        // No player name, redirect to home
        console.warn('[GamePage] No player name found, redirecting to home');
        navigate('/');
        return;
      }
      setHasInitialized(true);
    }
  }, [hasInitialized, gameState.currentQuestion, gameState.isPlaying, gameState.round, gameState.isComplete, gameState.roundSummary, startNewRound, navigate]);

  // Handle map click
  const handleLocationClick = (lat: number, lon: number) => {
    // Validate coordinates before storing
    if (
      typeof lat === 'number' &&
      typeof lon === 'number' &&
      !isNaN(lat) &&
      !isNaN(lon) &&
      lat >= -90 && lat <= 90 &&
      lon >= -180 && lon <= 180
    ) {
      setSelectedLocation({ lat, lon });
    }
  };

  // Handle submit answer
  const handleSubmitAnswer = () => {
    console.log('[GamePage] Submit clicked', {
      selectedLocation,
      currentQuestion: gameState.currentQuestion?.id,
      round: gameState.round?.id
    });
    
    if (selectedLocation && gameState.currentQuestion && gameState.round) {
      console.log('[GamePage] Calling submitAnswerClick', selectedLocation);
      submitAnswerClick(selectedLocation.lat, selectedLocation.lon, 0);
    } else {
      console.warn('[GamePage] Missing required state', {
        hasSelectedLocation: !!selectedLocation,
        hasCurrentQuestion: !!gameState.currentQuestion,
        hasRound: !!gameState.round
      });
    }
  };

  // Handle timer expired
  const handleTimeUp = () => {
    // Auto-submit with no answer (or could skip)
    if (gameState.currentQuestion && !gameState.currentAnswer) {
      // For now, just move to next
      goToNextQuestion();
    }
  };

  // Handle score submission
  const handleSubmitScore = async () => {
    if (!gameState.roundSummary || !gameState.round) return;
    
    setIsSubmitting(true);
    setSubmitMessage(null);
    
    try {
      const result = await submitScore(gameState.round.id);
      console.log('[GamePage] Score submitted', result);
      
      if (result.success) {
        setSubmitMessage(`🎉 ${result.message}`);
        // Navigate to leaderboard after short delay
        setTimeout(() => {
          navigate('/leaderboard');
        }, 1500);
      } else {
        setSubmitMessage(`⚠️ ${result.message}`);
      }
    } catch (error) {
      console.error('[GamePage] Failed to submit score', error);
      setSubmitMessage('Failed to submit score. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle game complete - show results
  if (gameState.isComplete && gameState.roundSummary) {
    console.log('[GamePage] ✓ Rendering game complete screen', {
      isComplete: gameState.isComplete,
      hasRoundSummary: !!gameState.roundSummary,
      totalScore: gameState.roundSummary.total_score,
      questionsAnswered: gameState.roundSummary.questions_answered
    });
    return (
      <div className="game-complete" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '20px'
      }}>
        {/* Header with final score */}
        <GameHeader
          currentQuestion={10}
          totalQuestions={10}
          currentScore={gameState.roundSummary.total_score}
          playerName={gameState.roundSummary.player_name}
        />
        
        <div style={{
          backgroundColor: '#fff',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '500px',
          marginTop: '40px'
        }}>
          <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>🎉 Round Complete!</h1>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>Total Score</div>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#667eea' }}>
              {gameState.roundSummary.total_score}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '14px', color: '#666' }}>Questions Answered</div>
            <div style={{ fontSize: '20px', fontWeight: '600' }}>
              {gameState.roundSummary.questions_answered} / 10
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                resetGame();
                navigate('/');
              }}
              disabled={isSubmitting}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#e0e0e0',
                border: 'none',
                borderRadius: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              Home
            </button>
            <button
              onClick={handleSubmitScore}
              disabled={isSubmitting}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: isSubmitting ? '#9e9e9e' : '#667eea',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Score'}
            </button>
            <button
              onClick={() => {
                const playerName = sessionStorage.getItem('playerName') || 'Player';
                resetGame();
                setHasInitialized(false);
                sessionStorage.setItem('playerName', playerName);
                startNewRound(playerName);
              }}
              disabled={isSubmitting}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: isSubmitting ? '#9e9e9e' : '#4caf50',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              Play Again
            </button>
          </div>

          {/* Submission status message */}
          {submitMessage && (
            <div style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: submitMessage.includes('🎉') ? '#e8f5e9' : '#fff3e0',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '16px',
              color: submitMessage.includes('🎉') ? '#2e7d32' : '#f57c00'
            }}>
              {submitMessage}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Loading state - show skeletons
  if ((isLoading || !gameState.currentQuestion) && !gameState.roundSummary) {
    return (
      <div className="game-page-loading" style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        {/* Header skeleton */}
        <div style={{
          width: '100%',
          backgroundColor: '#1a1a1a',
          padding: '16px 24px',
          minHeight: '70px',
          flexShrink: 0
        }}>
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: '#333',
            borderRadius: '2px',
            marginBottom: '12px'
          }} />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '24px'
          }}>
            <div style={{ flex: 1, height: '30px', backgroundColor: '#333', borderRadius: '8px' }} />
            <div style={{ flex: 1, height: '30px', backgroundColor: '#333', borderRadius: '8px' }} />
            <div style={{ flex: 1, height: '30px', backgroundColor: '#333', borderRadius: '8px' }} />
          </div>
        </div>
        
        {/* Question + Timer skeleton */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          backgroundColor: '#fff',
          gap: '16px',
          height: '100px',
          flexShrink: 0
        }}>
          <QuestionCardSkeleton />
          <div style={{
            width: '200px',
            height: '80px',
            backgroundColor: '#f0f0f0',
            borderRadius: '8px',
            animation: 'skeleton-pulse 1.5s infinite'
          }} />
        </div>
        
        {/* Map skeleton */}
        <div style={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden'
        }}>
          <MapSkeleton />
        </div>
        
        <style>{`
          @keyframes skeleton-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    console.error('[GamePage] Error state:', error);
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '20px'
      }}>
        <ErrorState
          title="Game Error"
          message={error}
          onRetry={() => {
            resetGame();
            const playerName = sessionStorage.getItem('playerName');
            if (playerName) {
              startNewRound(playerName);
            }
          }}
          onGoBack={() => {
            resetGame();
            navigate('/');
          }}
          retryLabel="Restart Game"
          backLabel="Home"
        />
      </div>
    );
  }

  // Main game view
  const playerName = sessionStorage.getItem('playerName') || 'Player';
  
  return (
    <div className="game-page" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#f5f5f5',
      overflow: 'hidden'
    }}>
      {/* Game Header with progress bar - fixed height ~70px */}
      <GameHeader
        currentQuestion={currentQuestionNumber}
        totalQuestions={10}
        currentScore={currentScore}
        playerName={playerName}
      />

      {/* Question + Timer row - fixed height ~100px */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        gap: '16px',
        height: '100px',
        flexShrink: 0
      }}>
        <QuestionCard question={gameState.currentQuestion} />
        <Timer
          timeLimit={gameState.currentQuestion.time_limit}
          onTimeUp={handleTimeUp}
          isActive={!gameState.currentAnswer}
        />
      </div>

      {/* Map area - takes ALL remaining space */}
      <div style={{
        flex: 1,
        position: 'relative',
        minHeight: 0,
        overflow: 'hidden'
      }}>
        <Map
          onLocationClick={handleLocationClick}
          correctLocation={gameState.currentAnswer ? {
            latitude: gameState.currentAnswer.correct.latitude,
            longitude: gameState.currentAnswer.correct.longitude
          } : undefined}
          userLocation={selectedLocation ? {
            latitude: selectedLocation.lat,
            longitude: selectedLocation.lon
          } : undefined}
          disabled={!!gameState.currentAnswer}
        />

        {/* Submit button (shown when location selected) */}
        {selectedLocation && !gameState.currentAnswer && (
          <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000
          }}>
            <button
              onClick={handleSubmitAnswer}
              style={{
                padding: '14px 32px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#fff',
                backgroundColor: '#4caf50',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}
            >
              Submit Answer
            </button>
          </div>
        )}

        {/* Feedback overlay (shown after answering) */}
        {gameState.currentAnswer && (
          <Feedback
            result={gameState.currentAnswer}
            onNext={goToNextQuestion}
            isLastQuestion={false}
          />
        )}
      </div>
    </div>
  );
}
