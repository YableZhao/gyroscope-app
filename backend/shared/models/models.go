package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User represents a platform user
type User struct {
	ID        uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Email     string         `json:"email" gorm:"uniqueIndex;not null"`
	Username  string         `json:"username" gorm:"uniqueIndex;not null;size:50"`
	AvatarURL *string        `json:"avatar_url,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	
	// Relationships
	HostedRooms []Room `json:"hosted_rooms,omitempty" gorm:"foreignKey:HostID"`
}

// Room represents a game room
type Room struct {
	ID         uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Code       string         `json:"code" gorm:"uniqueIndex;size:6;not null"`
	Name       string         `json:"name" gorm:"size:100;not null"`
	HostID     uuid.UUID      `json:"host_id" gorm:"not null"`
	Host       User           `json:"host" gorm:"foreignKey:HostID"`
	Status     RoomStatus     `json:"status" gorm:"default:'waiting'"`
	MaxPlayers int            `json:"max_players" gorm:"default:50"`
	Settings   *RoomSettings  `json:"settings,omitempty" gorm:"type:jsonb"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`
	
	// Relationships
	GameSessions []GameSession `json:"game_sessions,omitempty" gorm:"foreignKey:RoomID"`
}

// RoomStatus represents the current status of a room
type RoomStatus string

const (
	RoomStatusWaiting  RoomStatus = "waiting"
	RoomStatusPlaying  RoomStatus = "playing"
	RoomStatusFinished RoomStatus = "finished"
)

// RoomSettings contains configurable room options
type RoomSettings struct {
	AllowLateJoin     bool `json:"allow_late_join"`
	ShowLeaderboard   bool `json:"show_leaderboard"`
	EnableMultiModal  bool `json:"enable_multi_modal"`
	TimePerQuestion   int  `json:"time_per_question"` // seconds
}

// GameSession represents a single game instance
type GameSession struct {
	ID           uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	RoomID       uuid.UUID      `json:"room_id" gorm:"not null"`
	Room         Room           `json:"room" gorm:"foreignKey:RoomID"`
	GameType     GameType       `json:"game_type" gorm:"not null"`
	Status       GameStatus     `json:"status" gorm:"default:'waiting'"`
	CurrentRound int            `json:"current_round" gorm:"default:0"`
	TotalRounds  int            `json:"total_rounds" gorm:"default:10"`
	StartTime    *time.Time     `json:"start_time,omitempty"`
	EndTime      *time.Time     `json:"end_time,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
	
	// Relationships
	Questions []Question       `json:"questions,omitempty" gorm:"foreignKey:SessionID"`
	Responses []PlayerResponse `json:"responses,omitempty" gorm:"foreignKey:SessionID"`
}

// GameType represents different types of games
type GameType string

const (
	GameTypeOrientationMatch  GameType = "orientation_match"
	GameTypeGestureCopy      GameType = "gesture_copy"
	GameTypeVoiceRecognition GameType = "voice_recognition"
	GameTypeMultiModalQuiz   GameType = "multi_modal_quiz"
	GameTypeCollaborativePuzzle GameType = "collaborative_puzzle"
)

// GameStatus represents the current status of a game
type GameStatus string

const (
	GameStatusWaiting    GameStatus = "waiting"
	GameStatusActive     GameStatus = "active"
	GameStatusPaused     GameStatus = "paused"
	GameStatusFinished   GameStatus = "finished"
)

// Question represents a game question/challenge
type Question struct {
	ID          uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	SessionID   uuid.UUID      `json:"session_id" gorm:"not null"`
	Session     GameSession    `json:"session" gorm:"foreignKey:SessionID"`
	Type        GameType       `json:"type" gorm:"not null"`
	Title       string         `json:"title" gorm:"not null"`
	Description string         `json:"description"`
	TargetData  *SensorData    `json:"target_data,omitempty" gorm:"type:jsonb"`
	TimeLimit   int            `json:"time_limit"` // seconds
	Points      int            `json:"points" gorm:"default:100"`
	RoundNumber int            `json:"round_number" gorm:"not null"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// SensorData represents multi-modal sensor input
type SensorData struct {
	Gyroscope *GyroscopeData `json:"gyroscope,omitempty"`
	Touch     *TouchData     `json:"touch,omitempty"`
	Voice     *VoiceData     `json:"voice,omitempty"`
	Gesture   *GestureData   `json:"gesture,omitempty"`
}

// GyroscopeData represents device orientation data
type GyroscopeData struct {
	Alpha float64 `json:"alpha"` // Z-axis rotation (0-360)
	Beta  float64 `json:"beta"`  // X-axis rotation (-180 to 180)
	Gamma float64 `json:"gamma"` // Y-axis rotation (-90 to 90)
}

// TouchData represents touch/click interaction
type TouchData struct {
	X         float64 `json:"x"`
	Y         float64 `json:"y"`
	Pressure  float64 `json:"pressure,omitempty"`
	Timestamp int64   `json:"timestamp"`
}

// VoiceData represents speech input
type VoiceData struct {
	Text       string  `json:"text"`
	Confidence float64 `json:"confidence"`
	Language   string  `json:"language"`
	Duration   int     `json:"duration"` // milliseconds
}

// GestureData represents camera-based gesture recognition
type GestureData struct {
	Type       string                 `json:"type"` // wave, thumbs_up, peace, etc.
	Confidence float64                `json:"confidence"`
	Landmarks  map[string]interface{} `json:"landmarks,omitempty"`
}

// PlayerResponse represents a user's answer to a question
type PlayerResponse struct {
	ID             uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	SessionID      uuid.UUID      `json:"session_id" gorm:"not null"`
	Session        GameSession    `json:"session" gorm:"foreignKey:SessionID"`
	UserID         uuid.UUID      `json:"user_id" gorm:"not null"`
	User           User           `json:"user" gorm:"foreignKey:UserID"`
	QuestionID     uuid.UUID      `json:"question_id" gorm:"not null"`
	Question       Question       `json:"question" gorm:"foreignKey:QuestionID"`
	ResponseType   ResponseType   `json:"response_type" gorm:"not null"`
	ResponseData   *SensorData    `json:"response_data" gorm:"type:jsonb"`
	ConfidenceScore float64       `json:"confidence_score"`
	AccuracyScore   float64       `json:"accuracy_score"`
	TimeToRespond   int           `json:"time_to_respond"` // milliseconds
	Points          int           `json:"points"`
	CreatedAt       time.Time     `json:"created_at"`
	UpdatedAt       time.Time     `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `json:"-" gorm:"index"`
}

// ResponseType represents the type of response
type ResponseType string

const (
	ResponseTypeGyroscope ResponseType = "gyroscope"
	ResponseTypeTouch     ResponseType = "touch"
	ResponseTypeVoice     ResponseType = "voice"
	ResponseTypeGesture   ResponseType = "gesture"
	ResponseTypeMulti     ResponseType = "multi_modal"
)

// PlayerScore represents user's score in a game session
type PlayerScore struct {
	UserID    uuid.UUID `json:"user_id" gorm:"primaryKey"`
	User      User      `json:"user" gorm:"foreignKey:UserID"`
	SessionID uuid.UUID `json:"session_id" gorm:"primaryKey"`
	Session   GameSession `json:"session" gorm:"foreignKey:SessionID"`
	Score     int       `json:"score"`
	Rank      int       `json:"rank"`
	Accuracy  float64   `json:"accuracy"`
	UpdatedAt time.Time `json:"updated_at"`
}

// RoomParticipant represents users in a room
type RoomParticipant struct {
	RoomID    uuid.UUID `json:"room_id" gorm:"primaryKey"`
	Room      Room      `json:"room" gorm:"foreignKey:RoomID"`
	UserID    uuid.UUID `json:"user_id" gorm:"primaryKey"`
	User      User      `json:"user" gorm:"foreignKey:UserID"`
	IsReady   bool      `json:"is_ready" gorm:"default:false"`
	JoinedAt  time.Time `json:"joined_at"`
	LeftAt    *time.Time `json:"left_at,omitempty"`
}