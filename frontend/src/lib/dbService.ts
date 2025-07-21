import * as db from './database'
import type { Room, User, GameEngine, GameSession, Question, RoomSettings } from '@/types'

// Flag to switch between mock data and real database
const USE_DATABASE = process.env.USE_DATABASE === 'true'

// Re-export database functions for use when database is enabled
export {
  createUser,
  getUserByEmail,
  getUserById,
  createRoom,
  getRoomByCode,
  addUserToRoom,
  getRoomParticipants,
  createGameSession,
  getGameSession,
  updateGameSession,
  saveQuestion,
  getSessionQuestions,
  savePlayerResponse,
  getSessionResponses,
  updatePlayerScore,
  getSessionScores,
  initializeDatabase
} from './database'

// Service layer that can switch between mock data and real database
export class DatabaseService {
  static async isAvailable(): Promise<boolean> {
    if (!USE_DATABASE) {
      return false
    }

    try {
      const testUser = await db.getUserById('test-id')
      return true // If we can query without error, database is available
    } catch (error) {
      console.warn('Database not available, falling back to mock data:', error)
      return false
    }
  }

  // Room operations
  static async createRoom(roomData: {
    code: string
    name: string
    host_id: string
    max_players: number
    settings: unknown
  }): Promise<Room> {
    if (await this.isAvailable()) {
      return db.createRoom(roomData)
    } else {
      // Fallback to mock data (imported from existing mockData)
      const { mockData } = await import('./mockData')
      const host = {
        id: roomData.host_id,
        email: 'mock@example.com',
        username: 'MockUser',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const room: Room = {
        id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        code: roomData.code,
        name: roomData.name,
        host_id: roomData.host_id,
        host,
        status: 'waiting',
        max_players: roomData.max_players,
        settings: roomData.settings as RoomSettings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockData.addRoom(room, host)
      return room
    }
  }

  static async getRoomByCode(code: string): Promise<Room | null> {
    if (await this.isAvailable()) {
      return db.getRoomByCode(code)
    } else {
      const { mockData } = await import('./mockData')
      return mockData.findRoomByCode(code) || null
    }
  }

  static async addUserToRoom(roomId: string, userId: string): Promise<void> {
    if (await this.isAvailable()) {
      return db.addUserToRoom(roomId, userId)
    } else {
      const { mockData } = await import('./mockData')
      const user = {
        id: userId,
        email: 'mock@example.com',
        username: 'MockUser',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      mockData.addParticipantToRoom(roomId, user)
    }
  }

  static async getRoomParticipants(roomId: string): Promise<User[]> {
    if (await this.isAvailable()) {
      return db.getRoomParticipants(roomId)
    } else {
      const { mockData } = await import('./mockData')
      return mockData.getRoomParticipants(roomId)
    }
  }

  // Game session operations
  static async createGameSession(sessionData: {
    id: string
    room_id: string
    game_type: string
    status: string
    total_rounds: number
  }): Promise<GameSession> {
    if (await this.isAvailable()) {
      return db.createGameSession(sessionData)
    } else {
      return {
        id: sessionData.id,
        room_id: sessionData.room_id,
        game_type: sessionData.game_type as 'multiple_choice',
        status: sessionData.status as 'waiting',
        current_round: 0,
        total_rounds: sessionData.total_rounds,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  }

  static async getGameSession(sessionId: string): Promise<GameSession | null> {
    if (await this.isAvailable()) {
      return db.getGameSession(sessionId)
    } else {
      const { mockData } = await import('./mockData')
      const gameEngine = mockData.getGameSession(sessionId)
      return gameEngine?.session || null
    }
  }

  static async saveQuestions(questions: Question[]): Promise<void> {
    if (await this.isAvailable()) {
      for (const question of questions) {
        await db.saveQuestion(question)
      }
    }
    // Mock data doesn't need persistent storage
  }

  static async getSessionQuestions(sessionId: string): Promise<Question[]> {
    if (await this.isAvailable()) {
      return db.getSessionQuestions(sessionId)
    } else {
      const { mockData } = await import('./mockData')
      const gameEngine = mockData.getGameSession(sessionId)
      return gameEngine?.questions || []
    }
  }

  // User operations
  static async createUser(userData: {
    email: string
    username: string
    password_hash: string
  }): Promise<User> {
    if (await this.isAvailable()) {
      return db.createUser(userData)
    } else {
      // Mock user creation
      return {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: userData.email,
        username: userData.username,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  }

  static async getUserByEmail(email: string): Promise<(User & { password_hash?: string }) | null> {
    if (await this.isAvailable()) {
      return db.getUserByEmail(email)
    } else {
      // Mock user lookup - return null for now
      return null
    }
  }

  static async getUserById(id: string): Promise<User | null> {
    if (await this.isAvailable()) {
      return db.getUserById(id)
    } else {
      // Mock user lookup
      return {
        id,
        email: 'mock@example.com',
        username: 'MockUser',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  }
}

// Initialize database on startup if enabled
if (USE_DATABASE) {
  db.initializeDatabase().catch(console.error)
}