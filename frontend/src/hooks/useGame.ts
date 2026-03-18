/**
 * useGame hook - manages game state and API interactions
 */
import { useState, useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { startRound, submitAnswer, getRoundSummary, getNextQuestion, completeRound } from '../services/api';
import type { GameState, GameMode, GameCategory } from '../types';

interface UseGameReturn {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  startNewRound: (playerName: string) => Promise<void>;
  submitAnswerClick: (lat: number, lon: number, timeTaken: number) => Promise<void>;
  goToNextQuestion: () => void;
  finishGame: () => Promise<void>;
  resetGame: () => void;
  isLoading: boolean;
  error: string | null;
  currentQuestionNumber: number;
  currentScore: number;
}

export function useGame(): UseGameReturn {
  const [gameState, setGameState] = useState<GameState>(() => {
    // Try to restore from sessionStorage
    const saved = sessionStorage.getItem('gameState');
    const savedMode = sessionStorage.getItem('gameMode') as GameMode || 'standard';
    const savedCategory = sessionStorage.getItem('gameCategory') as GameCategory || null;
    
    if (saved) {
      console.log('[useGame] Restoring state from sessionStorage:', saved);
      try {
        const parsed = JSON.parse(saved);
        console.log('[useGame] Restored state:', {
          hasRound: !!parsed.round,
          roundId: parsed.round?.id,
          hasRoundSummary: !!parsed.roundSummary,
          hasCurrentQuestion: !!parsed.currentQuestion,
          questionId: parsed.currentQuestion?.id,
          isPlaying: parsed.isPlaying,
        });

        // Detect broken state: isPlaying but no round
        if (parsed.isPlaying && !parsed.round) {
          console.warn('[useGame] Detected broken state (isPlaying but no round), clearing and reinitializing');
          sessionStorage.removeItem('gameState');
          sessionStorage.removeItem('playerName');
          // Return initial state - will be reinitialized by GamePage
          return {
            round: null,
            roundSummary: null,
            currentQuestion: null,
            currentAnswer: null,
            isPlaying: false,
            isComplete: false,
            error: null,
            mode: savedMode,
            category: savedCategory,
          };
        }

        return {
          ...parsed,
          mode: parsed.mode || savedMode,
          category: parsed.category || savedCategory,
        };
      } catch (e) {
        console.error('[useGame] Failed to parse saved state:', e);
        sessionStorage.removeItem('gameState');
        return {
          round: null,
          roundSummary: null,
          currentQuestion: null,
          currentAnswer: null,
          isPlaying: false,
          isComplete: false,
          error: null,
          mode: savedMode,
          category: savedCategory,
        };
      }
    }
    console.log('[useGame] No saved state, using initial state');
    return {
      round: null,
      roundSummary: null,
      currentQuestion: null,
      currentAnswer: null,
      isPlaying: false,
      isComplete: false,
      error: null,
      mode: savedMode,
      category: savedCategory,
    };
  });

  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const [currentScore, setCurrentScore] = useState(0);

  // Persist state to sessionStorage
  useEffect(() => {
    console.log('[useGame] Persisting state to sessionStorage', {
      hasRound: !!gameState.round,
      hasRoundSummary: !!gameState.roundSummary,
      isComplete: gameState.isComplete,
    });
    sessionStorage.setItem('gameState', JSON.stringify(gameState));
  }, [gameState]);

  // Start new round mutation
  const startRoundMutation = useMutation({
    mutationFn: async (playerName: string) => {
      const mode = sessionStorage.getItem('gameMode') || 'standard';
      const category = sessionStorage.getItem('gameCategory') || null;
      const response = await startRound(playerName, mode, category || undefined);
      return response;
    },
    onSuccess: (data) => {
      console.log('[useGame] Round started', data);

      // Store round info from the response
      setGameState({
        round: {
          id: data.round_id,
          player_name: '',
          started_at: data.timer_starts_at,
          is_complete: false,
          questions_answered: 0,
          total_score: 0,
          answers: [],
        },
        roundSummary: null,
        currentQuestion: data.question,
        currentAnswer: null,
        isPlaying: true,
        isComplete: false,
        error: null,
        mode: (data.mode as GameMode) || 'standard',
        category: data.category as GameCategory || null,
      });
      setCurrentQuestionNumber(1);
      setTimerStartTime(Date.now());
    },
    onError: (error) => {
      console.error('[useGame] Failed to start round', error);
      setGameState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start round',
      }));
    },
  });

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async ({
      roundId,
      questionId,
      lat,
      lon,
      timeTaken,
    }: {
      roundId: string;
      questionId: number;
      lat: number;
      lon: number;
      timeTaken: number;
    }) => {
      return await submitAnswer(roundId, questionId, lat, lon, timeTaken);
    },
    onSuccess: (data) => {
      // Update current score
      setCurrentScore(prev => prev + data.final_score);
      
      setGameState(prev => ({
        ...prev,
        currentAnswer: data,
      }));
    },
    onError: (error) => {
      setGameState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to submit answer',
      }));
    },
  });

  const startNewRound = useCallback(async (playerName: string) => {
    console.log('[useGame] startNewRound called with playerName:', playerName);
    startRoundMutation.mutate(playerName);
  }, [startRoundMutation]);

  const submitAnswerClick = useCallback(async (
    lat: number,
    lon: number,
    timeTaken: number,
  ) => {
    console.log('[useGame] submitAnswerClick called', { lat, lon, timeTaken });
    console.log('[useGame] Current state', {
      hasRound: !!gameState.round,
      roundId: gameState.round?.id,
      hasCurrentQuestion: !!gameState.currentQuestion,
      questionId: gameState.currentQuestion?.id
    });

    if (!gameState.round) {
      const errorMsg = '[useGame] No round found - round must be created before submitting answers';
      console.error(errorMsg);
      setGameState(prev => ({ ...prev, error: errorMsg }));
      return;
    }

    if (!gameState.currentQuestion) {
      const errorMsg = '[useGame] No current question found';
      console.error(errorMsg);
      setGameState(prev => ({ ...prev, error: errorMsg }));
      return;
    }

    // Use provided timeTaken
    console.log('[useGame] Using time taken', timeTaken);

    console.log('[useGame] Mutating with', {
      roundId: gameState.round.id,
      questionId: gameState.currentQuestion.id,
      lat,
      lon,
      timeTaken,
    });

    submitAnswerMutation.mutate({
      roundId: gameState.round.id,
      questionId: gameState.currentQuestion.id,
      lat,
      lon,
      timeTaken,
    });
  }, [gameState.round, gameState.currentQuestion, timerStartTime, submitAnswerMutation]);

  const goToNextQuestion = useCallback(async () => {
    console.log('[useGame] goToNextQuestion called', { currentQuestionNumber });

    if (!gameState.round) {
      console.error('[useGame] No round found');
      return;
    }

    // Only end game at 10 questions for standard mode
    const isStandardMode = gameState.mode === 'standard' || !gameState.mode;
    
    if (isStandardMode && currentQuestionNumber >= 10) {
      console.log('[useGame] Last question reached (standard mode), fetching round summary');
      // Fetch round summary
      try {
        const summary = await getRoundSummary(gameState.round.id);
        console.log('[useGame] Round summary received', summary);

        // Use functional update to ensure we have latest state
        setGameState(prev => ({
          round: prev.round,         // Keep the original round for reference
          roundSummary: summary,     // Store the completed summary
          currentQuestion: null,
          currentAnswer: null,
          isPlaying: false,
          isComplete: true,
          error: null,
          mode: prev.mode,
          category: prev.category,
        }));
        console.log('[useGame] State updated with roundSummary');
      } catch (error) {
        console.error('[useGame] Failed to get round summary', error);
        setGameState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to get round summary',
        }));
      }
      return;
    }

    // For non-standard modes, always fetch next question (no auto-end)
    // Game ends via global timer (timed modes) or Finish button (endless)
    const playerName = sessionStorage.getItem('playerName') || 'Player';
    const category = gameState.category || null;
    console.log('[useGame] Fetching next question for round', gameState.round.id, { category });

    try {
      const nextQuestionData = await getNextQuestion(gameState.round.id, playerName, category);
      console.log('[useGame] Next question received', nextQuestionData.question);

      setGameState(prev => ({
        ...prev,
        currentQuestion: nextQuestionData.question,
        currentAnswer: null,
      }));
      setCurrentQuestionNumber(prev => prev + 1);
      setTimerStartTime(Date.now());
    } catch (error) {
      console.error('[useGame] Failed to get next question', error);
      setGameState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load next question',
      }));
    }
  }, [gameState.round, gameState.mode, currentQuestionNumber]);

  // Finish game mutation (for timed/endless modes)
  const finishGameMutation = useMutation({
    mutationFn: async (roundId: string) => {
      await completeRound(roundId);
      const summary = await getRoundSummary(roundId);
      return summary;
    },
    onSuccess: (summary) => {
      console.log('[useGame] Game finished', summary);
      setGameState(prev => ({
        round: prev.round,
        roundSummary: summary,
        currentQuestion: null,
        currentAnswer: null,
        isPlaying: false,
        isComplete: true,
        error: null,
        mode: prev.mode,
        category: prev.category,
      }));
    },
    onError: (error) => {
      console.error('[useGame] Failed to finish game', error);
      setGameState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to finish game',
      }));
    },
  });

  const finishGame = useCallback(async () => {
    console.log('[useGame] finishGame called');
    if (!gameState.round) {
      console.error('[useGame] No round found');
      return;
    }
    finishGameMutation.mutate(gameState.round.id);
  }, [gameState.round, finishGameMutation]);

  const resetGame = useCallback(() => {
    setGameState({
      round: null,
      roundSummary: null,
      currentQuestion: null,
      currentAnswer: null,
      isPlaying: false,
      isComplete: false,
      error: null,
      mode: 'standard',
      category: null,
    });
    setCurrentQuestionNumber(1);
    setTimerStartTime(null);
    setCurrentScore(0);
    sessionStorage.removeItem('gameState');
    sessionStorage.removeItem('playerName');
    sessionStorage.removeItem('gameMode');
    sessionStorage.removeItem('gameCategory');
  }, []);

  return {
    gameState,
    setGameState,
    startNewRound,
    submitAnswerClick,
    goToNextQuestion,
    finishGame,
    resetGame,
    isLoading: startRoundMutation.isPending || submitAnswerMutation.isPending,
    error: gameState.error,
    currentQuestionNumber,
    currentScore,
  };
}
