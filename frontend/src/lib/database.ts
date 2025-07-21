import { Pool } from 'pg'
import type { 
  User, 
  Room, 
  GameEngine, 
  GameSession, 
  Question,
  PlayerScore,
  PlayerResponse 
} from '@/types'

// Database connection pool
let pool: Pool | null = null

export function getDatabase(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/gyroscope_game',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }
  return pool
}

// User operations
export async function createUser(userData: {
  email: string
  username: string
  password_hash: string
}): Promise<User> {
  const db = getDatabase()
  const query = `
    INSERT INTO users (email, username, password_hash, created_at, updated_at)
    VALUES ($1, $2, $3, NOW(), NOW())
    RETURNING id, email, username, created_at, updated_at
  `
  const result = await db.query(query, [userData.email, userData.username, userData.password_hash])
  return result.rows[0]
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getDatabase()
  const query = 'SELECT id, email, username, password_hash, created_at, updated_at FROM users WHERE email = $1'
  const result = await db.query(query, [email])
  return result.rows[0] || null
}

export async function getUserById(id: string): Promise<User | null> {
  const db = getDatabase()
  const query = 'SELECT id, email, username, created_at, updated_at FROM users WHERE id = $1'
  const result = await db.query(query, [id])
  return result.rows[0] || null
}

// Room operations
export async function createRoom(roomData: {
  code: string
  name: string
  host_id: string
  max_players: number
  settings: unknown
}): Promise<Room> {
  const db = getDatabase()
  
  // First get the host user
  const host = await getUserById(roomData.host_id)
  if (!host) {
    throw new Error('Host user not found')
  }

  const query = `
    INSERT INTO rooms (code, name, host_id, status, max_players, settings, created_at, updated_at)
    VALUES ($1, $2, $3, 'waiting', $4, $5, NOW(), NOW())
    RETURNING id, code, name, host_id, status, max_players, settings, created_at, updated_at
  `
  const result = await db.query(query, [
    roomData.code,
    roomData.name,
    roomData.host_id,
    roomData.max_players,
    JSON.stringify(roomData.settings)
  ])

  const room = result.rows[0]
  return {
    ...room,
    host,
    settings: JSON.parse(room.settings)
  }
}

export async function getRoomByCode(code: string): Promise<Room | null> {
  const db = getDatabase()
  const query = `
    SELECT r.*, u.id as host_user_id, u.email as host_email, 
           u.username as host_username, u.created_at as host_created_at, 
           u.updated_at as host_updated_at
    FROM rooms r
    JOIN users u ON r.host_id = u.id
    WHERE r.code = $1
  `
  const result = await db.query(query, [code])
  
  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows[0]
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    host_id: row.host_id,
    host: {
      id: row.host_user_id,
      email: row.host_email,
      username: row.host_username,
      created_at: row.host_created_at,
      updated_at: row.host_updated_at
    },
    status: row.status,
    max_players: row.max_players,
    settings: JSON.parse(row.settings),
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

export async function addUserToRoom(roomId: string, userId: string): Promise<void> {
  const db = getDatabase()
  const query = `
    INSERT INTO room_participants (room_id, user_id, joined_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (room_id, user_id) DO NOTHING
  `
  await db.query(query, [roomId, userId])
}

export async function getRoomParticipants(roomId: string): Promise<User[]> {
  const db = getDatabase()
  const query = `
    SELECT u.id, u.email, u.username, u.created_at, u.updated_at
    FROM users u
    JOIN room_participants rp ON u.id = rp.user_id
    WHERE rp.room_id = $1
    ORDER BY rp.joined_at ASC
  `
  const result = await db.query(query, [roomId])
  return result.rows
}

// Game session operations
export async function createGameSession(sessionData: {
  id: string
  room_id: string
  game_type: string
  status: string
  total_rounds: number
}): Promise<GameSession> {
  const db = getDatabase()
  const query = `
    INSERT INTO game_sessions (id, room_id, game_type, status, current_round, total_rounds, created_at, updated_at)
    VALUES ($1, $2, $3, $4, 0, $5, NOW(), NOW())
    RETURNING *
  `
  const result = await db.query(query, [
    sessionData.id,
    sessionData.room_id,
    sessionData.game_type,
    sessionData.status,
    sessionData.total_rounds
  ])
  return result.rows[0]
}

export async function getGameSession(sessionId: string): Promise<GameSession | null> {
  const db = getDatabase()
  const query = 'SELECT * FROM game_sessions WHERE id = $1'
  const result = await db.query(query, [sessionId])
  return result.rows[0] || null
}

export async function updateGameSession(sessionId: string, updates: {
  status?: string
  current_round?: number
  start_time?: string
  end_time?: string
}): Promise<void> {
  const db = getDatabase()
  
  const setParts = []
  const values = []
  let paramIndex = 1

  if (updates.status !== undefined) {
    setParts.push(`status = $${paramIndex++}`)
    values.push(updates.status)
  }
  if (updates.current_round !== undefined) {
    setParts.push(`current_round = $${paramIndex++}`)
    values.push(updates.current_round)
  }
  if (updates.start_time !== undefined) {
    setParts.push(`start_time = $${paramIndex++}`)
    values.push(updates.start_time)
  }
  if (updates.end_time !== undefined) {
    setParts.push(`end_time = $${paramIndex++}`)
    values.push(updates.end_time)
  }
  
  setParts.push(`updated_at = NOW()`)
  values.push(sessionId)

  const query = `UPDATE game_sessions SET ${setParts.join(', ')} WHERE id = $${paramIndex}`
  await db.query(query, values)
}

// Question operations
export async function saveQuestion(question: Question): Promise<void> {
  const db = getDatabase()
  const query = `
    INSERT INTO questions (id, session_id, type, title, description, question_text, 
                          options, correct_answer, target_data, time_limit, points, 
                          round_number, media_url, hint, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `
  await db.query(query, [
    question.id,
    question.session_id,
    question.type,
    question.title,
    question.description,
    question.question_text,
    JSON.stringify(question.options || []),
    JSON.stringify(question.correct_answer),
    JSON.stringify(question.target_data),
    question.time_limit,
    question.points,
    question.round_number,
    question.media_url,
    question.hint
  ])
}

export async function getSessionQuestions(sessionId: string): Promise<Question[]> {
  const db = getDatabase()
  const query = `
    SELECT * FROM questions WHERE session_id = $1 ORDER BY round_number ASC
  `
  const result = await db.query(query, [sessionId])
  return result.rows.map(row => ({
    ...row,
    options: JSON.parse(row.options || '[]'),
    correct_answer: JSON.parse(row.correct_answer || 'null'),
    target_data: JSON.parse(row.target_data || 'null')
  }))
}

// Player response operations
export async function savePlayerResponse(response: PlayerResponse): Promise<void> {
  const db = getDatabase()
  const query = `
    INSERT INTO player_responses (id, session_id, question_id, user_id, answer, 
                                 is_correct, time_taken, points_earned, response_time, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      answer = EXCLUDED.answer,
      is_correct = EXCLUDED.is_correct,
      time_taken = EXCLUDED.time_taken,
      points_earned = EXCLUDED.points_earned,
      response_time = EXCLUDED.response_time
  `
  await db.query(query, [
    response.id,
    response.session_id,
    response.question_id,
    response.user_id,
    JSON.stringify(response.answer_value),
    response.is_correct,
    response.time_to_respond,
    response.points_awarded
  ])
}

export async function getSessionResponses(sessionId: string): Promise<PlayerResponse[]> {
  const db = getDatabase()
  const query = `
    SELECT pr.*, u.email, u.username
    FROM player_responses pr
    JOIN users u ON pr.user_id = u.id
    WHERE pr.session_id = $1
    ORDER BY pr.created_at ASC
  `
  const result = await db.query(query, [sessionId])
  return result.rows.map(row => ({
    id: row.id,
    session_id: row.session_id,
    question_id: row.question_id,
    user_id: row.user_id,
    response_type: 'multiple_choice' as const,
    answer_value: JSON.parse(row.answer),
    confidence_score: 1.0,
    accuracy_score: row.is_correct ? 1.0 : 0.0,
    time_to_respond: row.time_taken || 0,
    points_awarded: row.points_earned || 0,
    is_correct: row.is_correct,
    submitted_at: row.response_time || row.created_at,
    created_at: row.created_at
  }))
}

// Player score operations
export async function updatePlayerScore(score: PlayerScore): Promise<void> {
  const db = getDatabase()
  const query = `
    INSERT INTO player_scores (user_id, session_id, score, rank, accuracy, updated_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    ON CONFLICT (user_id, session_id) DO UPDATE SET
      score = EXCLUDED.score,
      rank = EXCLUDED.rank,
      accuracy = EXCLUDED.accuracy,
      updated_at = EXCLUDED.updated_at
  `
  await db.query(query, [
    score.user_id,
    score.session_id,
    score.score,
    score.rank,
    score.accuracy
  ])
}

export async function getSessionScores(sessionId: string): Promise<PlayerScore[]> {
  const db = getDatabase()
  const query = `
    SELECT ps.*, u.email, u.username, u.created_at as user_created_at, u.updated_at as user_updated_at
    FROM player_scores ps
    JOIN users u ON ps.user_id = u.id
    WHERE ps.session_id = $1
    ORDER BY ps.score DESC, ps.updated_at ASC
  `
  const result = await db.query(query, [sessionId])
  return result.rows.map(row => ({
    user_id: row.user_id,
    session_id: row.session_id,
    user: {
      id: row.user_id,
      email: row.email,
      username: row.username,
      created_at: row.user_created_at,
      updated_at: row.user_updated_at
    },
    score: row.score,
    rank: row.rank,
    accuracy: row.accuracy,
    updated_at: row.updated_at
  }))
}

// Database initialization
export async function initializeDatabase(): Promise<void> {
  const db = getDatabase()
  
  try {
    // Create tables if they don't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        host_id UUID REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'waiting',
        max_players INTEGER DEFAULT 50,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS room_participants (
        room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (room_id, user_id)
      )
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id VARCHAR(255) PRIMARY KEY,
        room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
        game_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'waiting',
        current_round INTEGER DEFAULT 0,
        total_rounds INTEGER NOT NULL,
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(255) REFERENCES game_sessions(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        question_text TEXT NOT NULL,
        options JSONB DEFAULT '[]',
        correct_answer JSONB,
        target_data JSONB,
        time_limit INTEGER DEFAULT 30,
        points INTEGER DEFAULT 100,
        round_number INTEGER NOT NULL,
        media_url VARCHAR(255),
        hint TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS player_responses (
        id VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(255) REFERENCES game_sessions(id) ON DELETE CASCADE,
        question_id VARCHAR(255) REFERENCES questions(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        answer JSONB NOT NULL,
        is_correct BOOLEAN DEFAULT false,
        time_taken INTEGER DEFAULT 0,
        points_earned INTEGER DEFAULT 0,
        response_time TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS player_scores (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        session_id VARCHAR(255) REFERENCES game_sessions(id) ON DELETE CASCADE,
        score INTEGER DEFAULT 0,
        rank INTEGER DEFAULT 0,
        accuracy DECIMAL(5,2) DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (user_id, session_id)
      )
    `)

    // Create indexes for better performance
    await db.query(`CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code)`)
    await db.query(`CREATE INDEX IF NOT EXISTS idx_rooms_host ON rooms(host_id)`)
    await db.query(`CREATE INDEX IF NOT EXISTS idx_sessions_room ON game_sessions(room_id)`)
    await db.query(`CREATE INDEX IF NOT EXISTS idx_questions_session ON questions(session_id)`)
    await db.query(`CREATE INDEX IF NOT EXISTS idx_responses_session ON player_responses(session_id)`)
    await db.query(`CREATE INDEX IF NOT EXISTS idx_scores_session ON player_scores(session_id)`)

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  }
}

// Helper function to close database connections
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}