import type { Room, User, GameEngine } from '@/types'

// Shared mock data storage - In production, this would be a database
export const mockData = {
  // Rooms storage
  rooms: [] as Room[],
  roomParticipants: {} as Record<string, User[]>, // roomId -> participants
  
  // Game sessions storage  
  gameSessions: {} as Record<string, GameEngine>, // sessionId -> GameEngine
  roomSessions: {} as Record<string, string>, // roomId -> sessionId

  // Helper methods
  findRoomByCode(code: string): Room | undefined {
    return this.rooms.find(room => room.code.toLowerCase() === code.toLowerCase())
  },

  findRoomById(id: string): Room | undefined {
    return this.rooms.find(room => room.id === id)
  },

  addRoom(room: Room, host: User): void {
    this.rooms.push(room)
    this.roomParticipants[room.id] = [host]
  },

  addParticipantToRoom(roomId: string, user: User): boolean {
    const room = this.findRoomById(roomId)
    if (!room) return false

    const participants = this.roomParticipants[roomId] || []
    
    // Check if user already in room
    if (participants.some(p => p.id === user.id)) {
      return true // Already in room
    }

    // Check room capacity
    if (participants.length >= room.max_players) {
      return false // Room full
    }

    this.roomParticipants[roomId].push(user)
    return true
  },

  removeParticipantFromRoom(roomId: string, userId: string): void {
    if (this.roomParticipants[roomId]) {
      this.roomParticipants[roomId] = this.roomParticipants[roomId].filter(p => p.id !== userId)
    }
  },

  getRoomParticipants(roomId: string): User[] {
    return this.roomParticipants[roomId] || []
  },

  // Game session helpers
  addGameSession(sessionId: string, gameEngine: GameEngine): void {
    this.gameSessions[sessionId] = gameEngine
    this.roomSessions[gameEngine.session.room_id] = sessionId
  },

  getGameSession(sessionId: string): GameEngine | undefined {
    return this.gameSessions[sessionId]
  },

  getGameSessionByRoom(roomId: string): GameEngine | undefined {
    const sessionId = this.roomSessions[roomId]
    return sessionId ? this.gameSessions[sessionId] : undefined
  },

  updateGameSession(sessionId: string, gameEngine: GameEngine): void {
    this.gameSessions[sessionId] = gameEngine
  }
}

// Initialize with a demo room for testing
export function initializeDemoData() {
  // Create a demo room
  const demoRoom: Room = {
    id: 'demo_room_1',
    code: 'DEMO01',
    name: 'Demo Game Room',
    host_id: 'demo_host',
    host: {
      id: 'demo_host',
      email: 'host@demo.com',
      username: 'DemoHost',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    status: 'waiting',
    max_players: 10,
    settings: {
      allow_late_join: true,
      show_leaderboard: true,
      enable_multi_modal: true,
      time_per_question: 30
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  mockData.addRoom(demoRoom, demoRoom.host)
}

// Initialize demo data
initializeDemoData()