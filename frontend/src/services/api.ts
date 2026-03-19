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
  // Only include category if it's a non-empty string
  if (category && category.trim() !== '') {
    params.category = category;
  }

  const response = await apiClient.get<RoundResponse>('/questions', { params });
  console.log('[API] startRound response:', response.data);
  return response.data;
};

/**
 * Get next question for an existing round
 */
export const getNextQuestion = async (
  roundId: string,
  playerName: string,
  category?: string | null,
): Promise<RoundResponse> => {
  console.log('[API] getNextQuestion called', { roundId, playerName, category });
  const params: Record<string, string> = {
    player_name: playerName,
    round_id: roundId,
  };
  // Only include category if it's a non-empty string
  if (category && category.trim() !== '') {
    params.category = category;
  }
  
  const response = await apiClient.get<RoundResponse>('/questions', { params });
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
 * Complete a round (for timed/endless modes)
 */
export const completeRound = async (roundId: string): Promise<void> => {
  console.log('[API] completeRound called with roundId:', roundId);
  await apiClient.post(`/rounds/${roundId}/complete`);
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

/**
 * Suggest a new question
 */
export const suggestQuestion = async (data: {
  player_name: string;
  question_text: string;
  latitude: number;
  longitude: number;
  hint?: string;
  category?: string;
  difficulty?: string;
}) => {
  const response = await apiClient.post('/questions/suggest', data);
  return response.data;
};

/**
 * Admin: Get all suggested questions
 */
export const getSuggestedQuestions = async (status?: string) => {
  const params = status ? { status } : {};
  const response = await apiClient.get('/admin/questions/suggestions', { params });
  return response.data;
};

/**
 * Admin: Approve a suggested question
 */
export const approveQuestion = async (
  suggestionId: number,
  data: {
    difficulty: string;
    location_type: string;
    time_limit: number;
    category?: string;
  }
) => {
  const response = await apiClient.post(`/admin/questions/approve/${suggestionId}`, data);
  return response.data;
};

/**
 * Admin: Reject a suggested question
 */
export const rejectQuestion = async (suggestionId: number) => {
  const response = await apiClient.post(`/admin/questions/reject/${suggestionId}`);
  return response.data;
};

/**
 * Admin: Get all questions from database
 */
export const getAllQuestions = async () => {
  const response = await apiClient.get('/admin/questions');
  return response.data;
};

/**
 * Admin: Update an existing question
 */
export const updateQuestion = async (
  questionId: number,
  data: {
    text?: string;
    latitude?: number;
    longitude?: number;
    hint?: string;
    difficulty?: string;
    location_type?: string;
    time_limit?: number;
    category?: string;
  }
) => {
  const response = await apiClient.put(`/admin/questions/${questionId}`, data);
  return response.data;
};

/**
 * Admin: Delete a question
 */
export const deleteQuestion = async (questionId: number) => {
  const response = await apiClient.delete(`/admin/questions/${questionId}`);
  return response.data;
};

/**
 * Admin: Create a new question
 */
export const createQuestion = async (data: {
  text: string;
  latitude: number;
  longitude: number;
  hint?: string;
  category?: string;
  time_limit: number;
}) => {
  const response = await apiClient.post('/admin/questions', data);
  return response.data;
};

export default apiClient;
