/**
 * Shared TypeScript types for Geography Quiz
 */

// Question types
export interface Question {
  id: number;
  text: string;
  location_type: 'country' | 'city' | 'landmark';
  hint?: string;
  time_limit: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Answer types
export interface Answer {
  question_id: number;
  clicked_lat: number;
  clicked_lon: number;
  distance_km: number;
  time_taken: number;
  base_points: number;
  speed_multiplier: number;
  final_score: number;
}

export interface AnswerResult extends Answer {
  question_text: string;
  correct: {
    latitude: number;
    longitude: number;
    location_name: string;
  };
  your_answer: {
    latitude: number;
    longitude: number;
  };
  is_correct: boolean;
  next_question_available: boolean;
}

// Round types
export interface Round {
  id: string;
  player_name: string;
  started_at: string;
  completed_at?: string;
  is_complete: boolean;
  questions_answered: number;
  total_score: number;
  answers: Answer[];
}

export interface RoundResponse {
  round_id: string;
  question_number: number;
  total_questions: number;
  question: Question;
  timer_starts_at: string;
}

// Leaderboard types
export interface LeaderboardEntry {
  rank: number;
  player_name: string;
  total_score: number;
  submitted_at: string;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
}

// Request types
export interface RoundStartRequest {
  player_name: string;
}

export interface AnswerRequest {
  round_id: string;
  question_id: number;
  clicked_lat: number;
  clicked_lon: number;
}

export interface ScoreSubmitRequest {
  round_id: string;
}

export interface ScoreSubmitResponse {
  success: boolean;
  rank?: number;
  message: string;
  qualified: boolean;
}

// Game state types
export interface GameState {
  round: Round | null;
  roundSummary: Round | null;  // Store completed round summary separately
  currentQuestion: Question | null;
  currentAnswer: AnswerResult | null;
  isPlaying: boolean;
  isComplete: boolean;
  error: string | null;
}
