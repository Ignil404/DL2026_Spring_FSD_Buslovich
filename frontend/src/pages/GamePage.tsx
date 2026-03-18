/**
 * GamePage - Main game screen with map, question, timer, and feedback
 * Restyled with Tailwind CSS and shadcn/ui
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import GameMap from '@/components/GameMap';
import { useGame } from '../hooks/useGame';
import { submitScore } from '../services/api';

const TIMER_SECONDS = 30;

// Normalize longitude to range [-180, 180]
function normalizeLon(lon: number): number {
  while (lon > 180) lon -= 360;
  while (lon < -180) lon += 360;
  return lon;
}

export default function GamePage() {
  const navigate = useNavigate();
  const [selectedPos, setSelectedPos] = useState<{ lat: number; lng: number } | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

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

  const question = gameState.currentQuestion;

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

    // Check if we need to start a new round
    const needsRound = !hasInitialized && (!gameState.currentQuestion || !gameState.round || !gameState.isPlaying);

    if (needsRound) {
      const playerName = sessionStorage.getItem('playerName');
      console.log('[GamePage] Starting round for player:', playerName);

      if (playerName) {
        startNewRound(playerName);
      } else {
        console.warn('[GamePage] No player name found, redirecting to home');
        navigate('/');
        return;
      }
      setHasInitialized(true);
    }
  }, [hasInitialized, gameState.currentQuestion, gameState.isPlaying, gameState.round, gameState.isComplete, gameState.roundSummary, startNewRound, navigate]);

  // Timer effect
  useEffect(() => {
    if (!gameState.currentAnswer && gameState.currentQuestion) {
      setTimeLeft(TIMER_SECONDS);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [gameState.currentQuestion, gameState.currentAnswer]);

  // Handle map click
  const handleSelectPos = useCallback((pos: { lat: number; lng: number }) => {
    if (
      typeof pos.lat === 'number' &&
      typeof pos.lng === 'number' &&
      !isNaN(pos.lat) &&
      !isNaN(pos.lng)
    ) {
      setSelectedPos({ lat: pos.lat, lng: normalizeLon(pos.lng) });
    }
  }, []);

  // Handle submit answer
  const handleSubmit = useCallback(() => {
    if (!selectedPos || gameState.currentAnswer) return;
    clearInterval(timerRef.current);

    const timeTaken = TIMER_SECONDS - timeLeft;
    submitAnswerClick(selectedPos.lat, selectedPos.lng, timeTaken);
  }, [selectedPos, gameState.currentAnswer, timeLeft, submitAnswerClick]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !gameState.currentAnswer) {
      if (selectedPos) {
        handleSubmit();
      }
    }
  }, [timeLeft, gameState.currentAnswer, selectedPos, handleSubmit]);

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

  const playerName = sessionStorage.getItem('playerName') || 'Player';

  // Timer styling
  const timerColor = timeLeft > 15 ? 'text-primary' : timeLeft > 5 ? 'text-amber-400' : 'text-destructive';
  const timerPct = (timeLeft / TIMER_SECONDS) * 100;
  const timerStroke = timeLeft > 15 ? 'hsl(142,71%,45%)' : timeLeft > 5 ? 'hsl(38,92%,50%)' : 'hsl(0,84%,60%)';

  // Error state
  if (error) {
    console.error('[GamePage] Error state:', error);
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border-border bg-card p-6 text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <h2 className="mb-2 text-xl font-bold">Game Error</h2>
          <p className="mb-4 text-muted-foreground">{error}</p>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                resetGame();
                const playerName = sessionStorage.getItem('playerName');
                if (playerName) {
                  startNewRound(playerName);
                }
              }}
              className="flex-1"
            >
              Restart Game
            </Button>
            <Button
              onClick={() => {
                resetGame();
                navigate('/');
              }}
              variant="outline"
              className="flex-1"
            >
              Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Game complete - show results
  if (gameState.isComplete && gameState.roundSummary) {
    console.log('[GamePage] ✓ Rendering game complete screen', {
      isComplete: gameState.isComplete,
      hasRoundSummary: !!gameState.roundSummary,
      totalScore: gameState.roundSummary.total_score,
      questionsAnswered: gameState.roundSummary.questions_answered
    });
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-border bg-card p-6 text-center">
            <div className="mb-4 text-6xl">🎉</div>
            <h1 className="mb-2 text-2xl font-bold">Round Complete!</h1>
            
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">Total Score</p>
              <p className="text-5xl font-extrabold text-secondary">
                {gameState.roundSummary.total_score.toLocaleString()}
              </p>
            </div>

            <div className="mb-6">
              <p className="text-sm text-muted-foreground">Questions Answered</p>
              <p className="text-xl font-semibold">
                {gameState.roundSummary.questions_answered} / 10
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  resetGame();
                  navigate('/');
                }}
                disabled={isSubmitting}
                variant="secondary"
                className="w-full"
              >
                Home
              </Button>
              <Button
                onClick={handleSubmitScore}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Score'}
              </Button>
              <Button
                onClick={() => {
                  const playerName = sessionStorage.getItem('playerName') || 'Player';
                  resetGame();
                  setHasInitialized(false);
                  sessionStorage.setItem('playerName', playerName);
                  startNewRound(playerName);
                }}
                disabled={isSubmitting}
                className="w-full"
              >
                Play Again
              </Button>
            </div>

            {submitMessage && (
              <div className={`mt-4 rounded-lg p-4 text-center ${
                submitMessage.includes('🎉') 
                  ? 'bg-green-950 text-green-400' 
                  : 'bg-amber-950 text-amber-400'
              }`}>
                {submitMessage}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    );
  }

  // Loading state
  if ((isLoading || !question) && !gameState.roundSummary) {
    return (
      <div className="flex h-screen flex-col bg-background">
        {/* Header skeleton */}
        <div className="w-full border-b border-border bg-card p-4">
          <div className="mb-3 h-1 w-full rounded bg-muted" />
          <div className="flex gap-6">
            <div className="h-8 flex-1 rounded bg-muted" />
            <div className="h-8 flex-1 rounded bg-muted" />
            <div className="h-8 flex-1 rounded bg-muted" />
          </div>
        </div>

        {/* Question + Timer skeleton */}
        <div className="flex items-center justify-between border-b border-border bg-card/80 p-4">
          <div className="h-16 flex-1 rounded bg-muted" />
          <div className="ml-4 h-14 w-14 rounded-full bg-muted" />
        </div>

        {/* Map skeleton */}
        <div className="flex-1 bg-muted" />
      </div>
    );
  }

  // Main game view
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <span className="font-semibold text-muted-foreground">
          {currentQuestionNumber} / 10
        </span>
        <span className="text-lg font-bold text-secondary">{currentScore} pts</span>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-foreground sm:inline">{playerName}</span>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-muted text-sm font-bold">
              {playerName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Question strip */}
      <div className="flex items-center gap-4 border-b border-border bg-card/80 px-4 py-3">
        <div className="flex-1">
          {question && (
            <>
              <Badge variant="secondary" className="mb-1">
                {question.difficulty}
              </Badge>
              <p className="font-semibold">{question.text}</p>
              <p className="text-xs text-muted-foreground">💡 {question.hint}</p>
            </>
          )}
        </div>
        {/* Circular timer */}
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(0,0%,15%)" strokeWidth="4" />
            <circle
              cx="28" cy="28" r="24" fill="none"
              stroke={timerStroke} strokeWidth="4"
              strokeDasharray={`${(timerPct / 100) * 150.8} 150.8`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <span className={`text-sm font-bold ${timerColor}`}>{timeLeft}</span>
        </div>
      </div>

      {/* Map */}
      <div className="relative flex-1 min-h-0 overflow-hidden w-full">
        <GameMap
          selectedPos={selectedPos}
          onSelect={(pos) => !gameState.currentAnswer && handleSelectPos(pos)}
          answerPos={gameState.currentAnswer ? {
            lat: gameState.currentAnswer.correct.latitude,
            lng: gameState.currentAnswer.correct.longitude
          } : undefined}
        />

        {/* Submit button */}
        {selectedPos && !gameState.currentAnswer && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-6 left-1/2 z-[1000] -translate-x-1/2"
          >
            <Button
              onClick={handleSubmit}
              size="lg"
              className="px-8"
            >
              Submit Answer
            </Button>
          </motion.div>
        )}

        {/* Feedback overlay */}
        <AnimatePresence>
          {gameState.currentAnswer && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/60 backdrop-blur-sm"
            >
              <Card className="w-full max-w-sm border-border bg-card p-6 text-center">
                <p className="mb-1 text-sm text-muted-foreground">Distance</p>
                <p className="mb-3 text-2xl font-bold">
                  {Math.round(gameState.currentAnswer.distance_km).toLocaleString()} km
                </p>
                <div className="mb-4 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Base</p>
                    <p className="font-bold text-primary">{gameState.currentAnswer.base_points}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Speed</p>
                    <p className="font-bold text-amber-400">+{Math.round(gameState.currentAnswer.speed_multiplier * 100)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-bold text-secondary">{gameState.currentAnswer.final_score}</p>
                  </div>
                </div>
                <Button
                  onClick={goToNextQuestion}
                  className="w-full"
                >
                  {currentQuestionNumber >= 10 ? "See Results" : "Next Question"}
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
