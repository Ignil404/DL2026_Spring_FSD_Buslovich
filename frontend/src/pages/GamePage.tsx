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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import GameMap from '@/components/GameMap';
import { useGame } from '../hooks/useGame';
import { submitScore } from '../services/api';
import type { GameMode } from '@/types';

const TIMER_SECONDS = 30;

// Helper function to get global time limit for timed modes
function getTimeLimitForMode(mode: GameMode): number | null {
  if (mode === 'timed_1') return 60;
  if (mode === 'timed_3') return 180;
  if (mode === 'timed_5') return 300;
  return null;
}

export default function GamePage() {
  const navigate = useNavigate();
  const [selectedPos, setSelectedPos] = useState<{ lat: number; lng: number } | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const isProcessingRef = useRef(false);
  const autoSubmitTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const {
    gameState,
    setGameState,
    startNewRound,
    submitAnswerClick,
    goToNextQuestion,
    finishGame,
    resetGame,
    isLoading,
    isSubmittingAnswer,
    error,
    currentQuestionNumber,
    currentScore,
  } = useGame();

  const questionTimeLimit = gameState.currentQuestion?.time_limit || TIMER_SECONDS;
  const question = gameState.currentQuestion;
  const gameMode = gameState.mode;
  const isTimedMode = gameMode === 'timed_1' || gameMode === 'timed_3' || gameMode === 'timed_5';
  const isEndlessMode = gameMode === 'endless';

  // Initialize game round on mount if not already started
  useEffect(() => {
    if (gameState.isComplete && gameState.roundSummary) {
      return;
    }

    if (gameState.isComplete && !gameState.isPlaying) {
      setHasInitialized(false);
    }

    const needsRound = !hasInitialized && (!gameState.currentQuestion || !gameState.round || !gameState.isPlaying);

    if (needsRound) {
      const playerName = sessionStorage.getItem('playerName');
      if (playerName) {
        startNewRound(playerName);
      } else {
        navigate('/');
        return;
      }
      setHasInitialized(true);
    }
  }, [hasInitialized, gameState.currentQuestion, gameState.isPlaying, gameState.round, gameState.isComplete, gameState.roundSummary, startNewRound, navigate]);

  // Timer effect - uses question's time_limit
  useEffect(() => {
    if (!gameState.currentAnswer && gameState.currentQuestion) {
      const timeLimit = gameState.currentQuestion.time_limit || 30;
      setTimeLeft(timeLimit);
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

  // Global timer effect for timed modes
  useEffect(() => {
    const timeLimit = getTimeLimitForMode(gameMode);

    if (timeLimit !== null && gameState.isPlaying && !gameState.isComplete) {
      const startTime = Date.now();
      const totalMs = timeLimit * 1000;

      const globalTimerRef = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
        setGlobalTimeLeft(remaining);

        if (remaining <= 0) {
          clearInterval(globalTimerRef);
          finishGame();
        }
      }, 250);

      return () => clearInterval(globalTimerRef);
    }
  }, [gameMode, gameState.isPlaying, gameState.isComplete, finishGame]);

  // Handle map click
  const handleSelectPos = useCallback((pos: { lat: number; lng: number }) => {
    setSelectedPos({ lat: pos.lat, lng: pos.lng });
  }, []);

  // Handle submit answer
  const handleSubmit = useCallback(() => {
    if (!selectedPos || gameState.currentAnswer || isProcessingRef.current) {
      return;
    }
    isProcessingRef.current = true;
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
    }
    clearInterval(timerRef.current);

    const timeTaken = questionTimeLimit - timeLeft;
    submitAnswerClick(selectedPos.lat, selectedPos.lng, timeTaken);
  }, [selectedPos, gameState.currentAnswer, timeLeft, questionTimeLimit, submitAnswerClick]);

  // Handle score submission
  const handleSubmitScore = async () => {
    setShowSubmitConfirm(true);
  };

  const handleConfirmSubmitScore = async () => {
    if (!gameState.roundSummary || !gameState.round || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitMessage(null);
    setShowSubmitConfirm(false);

    try {
      const result = await submitScore(gameState.round.id, gameState.mode);
      if (result.success) {
        setSubmitMessage(`🎉 ${result.message}`);
        setTimeout(() => {
          navigate('/leaderboard', { state: { mode: gameState.mode } });
        }, 1500);
      } else {
        setSubmitMessage(`⚠️ ${result.message}`);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to submit score.';
      setSubmitMessage(`❌ ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard controls for all game modes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for Escape and Enter/Space
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
      }
      
      // Arrow keys - pan map (handled by map component)
      // Enter/Space - confirm exit dialog, submit answer, go to next question, or confirm score submission
      if (e.key === 'Enter' || e.key === ' ') {
        if (showExitConfirm) {
          // Confirm exit - finish game
          setShowExitConfirm(false);
          finishGame();
        } else if (showSubmitConfirm) {
          // Confirm score submission
          handleConfirmSubmitScore();
        } else if (gameState.isComplete && gameState.roundSummary && !showSubmitConfirm) {
          // Auto-submit score on game complete screen
          handleSubmitScore();
        } else if (selectedPos && !gameState.currentAnswer && !isProcessingRef.current) {
          // Submit answer
          handleSubmit();
        } else if (gameState.currentAnswer) {
          // Go to next question
          goToNextQuestion();
        }
      }
      // Escape - close dialogs or show exit confirmation (all modes, all screens)
      if (e.key === 'Escape') {
        if (showSubmitConfirm) {
          // Close submit dialog
          setShowSubmitConfirm(false);
        } else if (showExitConfirm) {
          // Close exit dialog
          setShowExitConfirm(false);
        } else if (!gameState.isComplete) {
          // Show exit confirmation (only if game is not complete)
          setShowExitConfirm(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSubmitConfirm, showExitConfirm, gameState.isComplete, gameState.roundSummary, selectedPos, gameState.currentAnswer, gameState.currentQuestion, handleSubmit, goToNextQuestion, handleConfirmSubmitScore, handleSubmitScore, finishGame, isEndlessMode]);

  // Reset processing flag when answer is received or question changes
  useEffect(() => {
    if (gameState.currentAnswer || gameState.currentQuestion) {
      isProcessingRef.current = false;
      if (autoSubmitTimerRef.current) {
        clearTimeout(autoSubmitTimerRef.current);
      }
    }
  }, [gameState.currentAnswer, gameState.currentQuestion?.id]);

  // Auto-skip to next question when error occurs
  useEffect(() => {
    if (gameState.error) {
      const timer = setTimeout(() => {
        setGameState(prev => ({ ...prev, error: null }));
        isProcessingRef.current = false;
        goToNextQuestion();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [gameState.error, setGameState, goToNextQuestion]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !gameState.currentAnswer && !isSubmittingAnswer && !isProcessingRef.current) {
      if (!gameState.round || !gameState.currentQuestion) {
        isProcessingRef.current = true;
        setTimeout(() => {
          isProcessingRef.current = false;
          goToNextQuestion();
        }, 1500);
        return;
      }

      if (selectedPos) {
        handleSubmit();
      } else {
        isProcessingRef.current = true;
        if (autoSubmitTimerRef.current) {
          clearTimeout(autoSubmitTimerRef.current);
        }
        autoSubmitTimerRef.current = setTimeout(() => {
          isProcessingRef.current = false;
          submitAnswerClick(0, 0, questionTimeLimit);
        }, 2500);
      }
    }
  }, [timeLeft]);

  const playerName = sessionStorage.getItem('playerName') || 'Player';

  // Per-question timer styling
  const timerColor = timeLeft > questionTimeLimit * 0.5 ? 'text-primary' : timeLeft > questionTimeLimit * 0.2 ? 'text-amber-400' : 'text-destructive';
  const timerPct = (timeLeft / questionTimeLimit) * 100;
  const timerStroke = timeLeft > questionTimeLimit * 0.5 ? 'hsl(142,71%,45%)' : timeLeft > questionTimeLimit * 0.2 ? 'hsl(38,92%,50%)' : 'hsl(0,84%,60%)';

  // Global timer styling for timed modes
  const formatGlobalTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const globalTimerColor = globalTimeLeft !== null && globalTimeLeft > 30 ? 'text-primary' : 'text-destructive';

  // Error state
  if (error) {
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
                if (playerName) startNewRound(playerName);
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
                {gameState.roundSummary.questions_answered} {!gameState.mode || gameState.mode === 'standard' ? '/ 10' : 'questions answered'}
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
                {isSubmitting ? 'Submitting...' : 'Submit Score to Leaderboard'}
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

        {/* Score submission confirmation dialog */}
        <Dialog open={showSubmitConfirm} onOpenChange={(open) => {
          if (!open) setShowSubmitConfirm(false);
        }}>
          <DialogContent
            className="max-w-md bg-[#1a1a1a] text-white border-border"
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
            style={{ zIndex: 9999 }}
          >
            <DialogHeader>
              <DialogTitle className="text-white">Submit Score to Leaderboard?</DialogTitle>
              <DialogDescription className="text-gray-400">
                Your score of <strong className="text-secondary">{gameState.roundSummary?.total_score.toLocaleString()}</strong> will be submitted to the leaderboard.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSubmitConfirm(false)}
                disabled={isSubmitting}
                className="text-white border-border hover:bg-[#262626]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSubmitScore}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
        {/* Left: Question counter or global timer */}
        <div className="flex items-center gap-3">
          {isTimedMode ? (
            <div className={`flex items-center gap-2 text-2xl font-bold ${globalTimerColor}`}>
              <span>⏱</span>
              <span>{formatGlobalTime(globalTimeLeft || 0)}</span>
              <span className="text-sm font-normal text-muted-foreground">remaining</span>
            </div>
          ) : isEndlessMode ? (
            <span className="font-semibold text-muted-foreground">
              Question {currentQuestionNumber}
            </span>
          ) : (
            <span className="font-semibold text-muted-foreground">
              Question {currentQuestionNumber} / 10
            </span>
          )}
        </div>
        
        {/* Center: Score */}
        <span className="text-lg font-bold text-secondary">{currentScore} pts</span>
        
        {/* Right: Player info and Finish button for endless mode */}
        <div className="flex items-center gap-2">
          {isEndlessMode && (
            <Button
              onClick={() => setShowExitConfirm(true)}
              variant="outline"
              size="sm"
              className="mr-2 text-white hover:text-white"
            >
              Finish Game
            </Button>
          )}
          <span className="hidden text-sm text-foreground sm:inline">{playerName}</span>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-muted text-sm font-bold">
              {playerName ? playerName[0]?.toUpperCase() : 'P'}
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
              <p className="font-semibold text-gray-900 dark:text-white">{question.text}</p>
              {question.hint && (
                <p className="text-xs text-muted-foreground">💡 {question.hint}</p>
              )}
            </>
          )}
        </div>
        {/* Circular timer - only shown in standard and endless modes */}
        {!isTimedMode && (
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
        )}
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
                  {isEndlessMode ? "Next Question" : currentQuestionNumber >= 10 ? "See Results" : "Next Question"}{!isEndlessMode && ` (${currentQuestionNumber}/10)`}
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submitting overlay - shown when submitting answer after timer expires */}
        <AnimatePresence>
          {timeLeft === 0 && !gameState.currentAnswer && selectedPos && isSubmittingAnswer && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/60 backdrop-blur-sm"
            >
              <Card className="w-full max-w-sm border-border bg-card p-6 text-center">
                <div className="mb-4 text-4xl">⏳</div>
                <h3 className="mb-2 text-xl font-bold">Submitting Answer...</h3>
                <p className="text-muted-foreground">Please wait</p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeout message overlay - shown when time runs out without answer, auto-submits after 2.5s */}
        <AnimatePresence>
          {timeLeft === 0 && !gameState.currentAnswer && !selectedPos && !isSubmittingAnswer && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/60 backdrop-blur-sm"
            >
              <Card className="w-full max-w-sm border-border bg-card p-6 text-center">
                <div className="mb-4 text-4xl">⏰</div>
                <h3 className="mb-2 text-xl font-bold">Time&apos;s Up!</h3>
                <p className="mb-4 text-muted-foreground">No answer selected</p>
                <Button
                  onClick={() => {
                    console.log('[GamePage] Submit 0 points now');
                    // Clear auto-submit timer
                    if (autoSubmitTimerRef.current) {
                      clearTimeout(autoSubmitTimerRef.current);
                    }
                    isProcessingRef.current = false;
                    submitAnswerClick(0, 0, questionTimeLimit);
                  }}
                  className="w-full mb-3"
                >
                  Get 0 pts
                </Button>
                <p className="text-xs text-muted-foreground">
                  Auto-submitting 0 points in 2.5 seconds...
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error overlay - shown when answer submission fails */}
        <AnimatePresence>
          {gameState.error && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/60 backdrop-blur-sm"
            >
              <Card className="w-full max-w-sm border-border bg-card p-6 text-center">
                <div className="mb-4 text-4xl">⚠️</div>
                <h3 className="mb-2 text-xl font-bold">Error</h3>
                <p className="mb-4 text-muted-foreground">{gameState.error}</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      console.log('[GamePage] Retry button clicked');
                      // Clear error and try again
                      setGameState(prev => ({ ...prev, error: null }));
                      isProcessingRef.current = false;
                      if (selectedPos) {
                        handleSubmit();
                      }
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Retry
                  </Button>
                  <Button
                    onClick={() => {
                      console.log('[GamePage] Skip button clicked');
                      // Clear error and skip to next question
                      setGameState(prev => ({ ...prev, error: null }));
                      isProcessingRef.current = false;
                      goToNextQuestion();
                    }}
                    className="flex-1"
                  >
                    Skip
                  </Button>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Auto-skipping in 5 seconds...
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exit confirmation dialog - MUST be inside main return, outside all conditionals */}
        <Dialog open={showExitConfirm} onOpenChange={(open) => {
          if (!open) setShowExitConfirm(false);
        }}>
          <DialogContent
            className="max-w-md bg-[#1a1a1a] text-white border-border"
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
            style={{ zIndex: 9999 }}
          >
            <DialogHeader>
              <DialogTitle className="text-white">Finish Game?</DialogTitle>
              <DialogDescription className="text-gray-400">
                You will return to the main menu. Your current progress will be lost.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowExitConfirm(false)}
                className="text-white border-border hover:bg-[#262626]"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowExitConfirm(false);
                  finishGame();
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Finish Game
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
