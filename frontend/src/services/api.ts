/**
 * API client service for Geography Quiz
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  RoundResponse,
  AnswerResult,
  Round,
  LeaderboardResponse,
  ScoreSubmitResponse,
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

/**
 * Start a new round or get next question
 */
export const startRound = async (
  playerName: string,
  mode?: string,
  category?: string | null,
): Promise<RoundResponse> => {
  console.log('[API] startRound called with:', { playerName, mode, category });
  const params: Record<string, string> = { player_name: playerName };
  if (mode) params.mode = mode;
  if (category) params.category = category;
  
  const response = await apiClient.get<RoundResponse>('/questions', { params });
  console.log('[API] startRound response:', response.data);
  return response.data;
};

/**
 * Get next question for an existing round
 */
export const getNextQuestion = async (
  roundId: string,
  playerName: string
): Promise<RoundResponse> => {
  console.log('[API] getNextQuestion called', { roundId, playerName });
  const response = await apiClient.get<RoundResponse>('/questions', {
    params: { 
      player_name: playerName,
      round_id: roundId 
    },
  });
  console.log('[API] getNextQuestion response:', response.data);
  return response.data;
};

/**
 * Submit an answer for the current question
 */
export const submitAnswer = async (
  roundId: string,
  questionId: number,
  clickedLat: number,
  clickedLon: number,
  timeTaken: number,
): Promise<AnswerResult> => {
  console.log('[API] submitAnswer called', { roundId, questionId, clickedLat, clickedLon, timeTaken });

  const payload = {
    round_id: roundId,
    question_id: questionId,
    clicked_lat: clickedLat,
    clicked_lon: clickedLon,
    time_taken: timeTaken,
  };

  console.log('[API] Sending payload', payload);
  
  const response = await apiClient.post<AnswerResult>('/answers', payload);
  
  console.log('[API] Response received', response.data);
  return response.data;
};

/**
 * Get round summary
 */
export const getRoundSummary = async (roundId: string): Promise<Round> => {
  console.log('[API] getRoundSummary called with roundId:', roundId);
  try {
    const response = await apiClient.get<Round>(`/rounds/${roundId}`);
    console.log('[API] getRoundSummary response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] getRoundSummary error:', error);
    throw error;
  }
};

/**
 * Get leaderboard (top 10)
 */
export const getLeaderboard = async (mode: string = 'standard'): Promise<LeaderboardResponse> => {
  const response = await apiClient.get<LeaderboardResponse>('/leaderboard', {
    params: { mode },
  });
  return response.data;
};

/**
 * Submit score to leaderboard
 */
export const submitScore = async (
  roundId: string,
  mode?: string,
): Promise<ScoreSubmitResponse> => {
  const response = await apiClient.post<ScoreSubmitResponse>('/leaderboard', {
    round_id: roundId,
    mode: mode || 'standard',
  });
  return response.data;
};

export default apiClient;
