// Core data types
export interface GyroscopeData {
  alpha: number
  beta: number
  gamma: number
}

export interface FilteredGyroscopeData extends GyroscopeData {
  timestamp: number
}

// User management types  
export interface User {
  id: string
  email: string
  username: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface UserData extends GyroscopeData {
  username: string
  update: (data: Partial<UserData>) => void
}

export interface Position {
  x: number
  y: number
  alpha: number
}

// Room and Game types
export interface Room {
  id: string
  code: string
  name: string
  host_id: string
  host: User
  status: RoomStatus
  max_players: number
  settings?: RoomSettings
  created_at: string
  updated_at: string
}

export type RoomStatus = 'waiting' | 'playing' | 'finished'

export interface RoomSettings {
  allow_late_join: boolean
  show_leaderboard: boolean
  enable_multi_modal: boolean
  time_per_question: number
}

export interface GameSession {
  id: string
  room_id: string
  game_type: GameType
  status: GameStatus
  current_round: number
  total_rounds: number
  start_time?: string
  end_time?: string
  created_at: string
  updated_at: string
}

export type GameType = 
  | 'multiple_choice'
  | 'true_false'
  | 'orientation_match'
  | 'gesture_copy'
  | 'voice_recognition'
  | 'multi_modal_quiz'

export type GameStatus = 'waiting' | 'countdown' | 'question' | 'results' | 'leaderboard' | 'finished'

export type QuestionType = 
  | 'multiple_choice'
  | 'true_false'
  | 'orientation_match'
  | 'gesture_recognition'
  | 'voice_command'
  | 'multi_modal'

export interface Question {
  id: string
  session_id: string
  type: QuestionType
  title: string
  description: string
  question_text: string
  options?: QuestionOption[]
  correct_answer?: string | number | boolean
  target_data?: SensorData
  time_limit: number
  points: number
  round_number: number
  media_url?: string
  hint?: string
  created_at: string
  updated_at: string
}

export interface QuestionOption {
  id: string
  text: string
  color: string
  is_correct: boolean
}

export interface GameRound {
  id: string
  session_id: string
  question: Question
  status: 'waiting' | 'active' | 'finished'
  start_time?: string
  end_time?: string
  time_remaining: number
  responses: PlayerResponse[]
}

export interface GameEngine {
  session: GameSession
  current_round?: GameRound
  questions: Question[]
  players: GamePlayer[]
  scores: PlayerScore[]
  settings: GameSettings
  status: GameStatus
  timer: GameTimer
}

export interface GameSettings {
  max_players: number
  questions_per_game: number
  time_per_question: number
  points_per_correct: number
  speed_bonus_enabled: boolean
  multi_modal_enabled: boolean
  show_correct_answer: boolean
  allow_late_join: boolean
}

export interface GamePlayer {
  user: User
  is_connected: boolean
  is_ready: boolean
  current_response?: PlayerResponse
  total_score: number
  rank: number
  joined_at: string
}

export interface GameTimer {
  total_time: number
  remaining_time: number
  is_running: boolean
  start_time?: string
  end_time?: string
}

// Sensor data types
export interface SensorData {
  gyroscope?: GyroscopeData
  touch?: TouchData
  voice?: VoiceData
  gesture?: GestureData
}

export interface TouchData {
  x: number
  y: number
  pressure?: number
  timestamp: number
}

export interface VoiceData {
  text: string
  confidence: number
  language: string
  duration: number
}

export interface GestureData {
  type: string
  confidence: number
  landmarks?: Record<string, unknown>
}

// WebSocket message types
export interface WebSocketMessage {
  type: string
  data: unknown
  user_id?: string
  room_id?: string
  timestamp: number
}

export interface UserJoinedMessage extends WebSocketMessage {
  type: 'user_joined'
  data: {
    username: string
  }
}

export interface SensorUpdateMessage extends WebSocketMessage {
  type: 'sensor_data'
  data: SensorData
}

export interface GameActionMessage extends WebSocketMessage {
  type: 'game_action'
  data: {
    action: string
    question_id?: string
    response?: unknown
  }
}

// Player response types
export interface PlayerResponse {
  id: string
  session_id: string
  user_id: string
  question_id: string
  response_type: ResponseType
  answer_value?: string | number | boolean
  response_data?: SensorData
  confidence_score: number
  accuracy_score: number
  time_to_respond: number
  points_awarded: number
  is_correct: boolean
  submitted_at: string
  created_at: string
}

export type ResponseType = 
  | 'multiple_choice' 
  | 'true_false' 
  | 'gyroscope' 
  | 'touch' 
  | 'voice' 
  | 'gesture' 
  | 'multi_modal'

// Game event message types
export interface GameStartMessage extends WebSocketMessage {
  type: 'game_start'
  data: {
    session: GameSession
    first_question: Question
  }
}

export interface QuestionStartMessage extends WebSocketMessage {
  type: 'question_start'
  data: {
    question: Question
    round_number: number
    time_limit: number
  }
}

export interface QuestionEndMessage extends WebSocketMessage {
  type: 'question_end'
  data: {
    question_id: string
    correct_answer: string | number | boolean
    results: PlayerResponse[]
  }
}

export interface PlayerAnswerMessage extends WebSocketMessage {
  type: 'player_answer'
  data: PlayerResponse
}

export interface LeaderboardUpdateMessage extends WebSocketMessage {
  type: 'leaderboard_update'
  data: {
    scores: PlayerScore[]
    current_round: number
  }
}

export interface GameEndMessage extends WebSocketMessage {
  type: 'game_end'
  data: {
    final_scores: PlayerScore[]
    session: GameSession
  }
}

export interface PlayerScore {
  user_id: string
  session_id: string
  user: User
  score: number
  rank: number
  accuracy: number
  updated_at: string
}

// API response types
export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: string
  }
  meta?: {
    page?: number
    per_page?: number
    total?: number
    total_pages?: number
  }
}

// Authentication types
export interface LoginRequest {
  email: string
  password: string
}

// Browser API extensions for TypeScript
declare global {
  interface Window {
    SpeechRecognition: unknown
    webkitSpeechRecognition: unknown
  }
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
}

export interface AuthResponse {
  user: User
  access_token: string
  refresh_token: string
  expires_at: string
}

// Permission types
export type PermissionState = 'default' | 'granted' | 'denied'

// Component props
export interface BoardProps {
  className?: string
}

export interface DotProps {
  className?: string
  username: string
  position: Position
}

// Game state types
export interface GameState {
  session?: GameSession
  current_question?: Question
  players: PlayerScore[]
  is_host: boolean
  time_remaining?: number
}

// Room state types
export interface RoomState {
  room: Room
  participants: User[]
  current_session?: GameSession
  is_host: boolean
}