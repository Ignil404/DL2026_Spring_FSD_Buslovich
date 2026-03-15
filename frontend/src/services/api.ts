/**
 * API client service for Geography Quiz
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  Question,
  RoundResponse,
  AnswerRequest,
  AnswerResult,
  Round,
  LeaderboardResponse,
  ScoreSubmitRequest,
  ScoreSubmitResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

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
export const startRound = async (playerName: string): Promise<RoundResponse> => {
  console.log('[API] startRound called with playerName:', playerName);
  const response = await apiClient.get<RoundResponse>('/questions', {
    params: { player_name: playerName },
  });
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
  clickedLon: number
): Promise<AnswerResult> => {
  console.log('[API] submitAnswer called', { roundId, questionId, clickedLat, clickedLon });
  
  const payload = {
    round_id: roundId,
    question_id: questionId,
    clicked_lat: clickedLat,
    clicked_lon: clickedLon,
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
export const getLeaderboard = async (): Promise<LeaderboardResponse> => {
  const response = await apiClient.get<LeaderboardResponse>('/leaderboard');
  return response.data;
};

/**
 * Submit score to leaderboard
 */
export const submitScore = async (roundId: string): Promise<ScoreSubmitResponse> => {
  const response = await apiClient.post<ScoreSubmitResponse>('/leaderboard', {
    round_id: roundId,
  });
  return response.data;
};

export default apiClient;
