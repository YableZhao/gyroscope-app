import { NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { mockData } from '@/lib/mockData'
import type { Room, RoomSettings, User } from '@/types'

interface CreateRoomRequest {
  name: string
  maxPlayers?: number
  settings?: Partial<RoomSettings>
}

// Helper function to generate room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789' // Exclude O and 0 for clarity
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Default room settings
const defaultSettings: RoomSettings = {
  allow_late_join: true,
  show_leaderboard: true,
  enable_multi_modal: true,
  time_per_question: 30
}

export async function POST(request: Request) {
  try {
    // Verify authentication
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'UNAUTHORIZED', 
            message: 'Authentication required' 
          } 
        },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_TOKEN', 
            message: 'Invalid or expired token' 
          } 
        },
        { status: 401 }
      )
    }

    const body: CreateRoomRequest = await request.json()
    const { name, maxPlayers = 50, settings = {} } = body

    // Validate input
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_INPUT', 
            message: 'Room name is required' 
          } 
        },
        { status: 400 }
      )
    }

    if (maxPlayers < 2 || maxPlayers > 100) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_INPUT', 
            message: 'Max players must be between 2 and 100' 
          } 
        },
        { status: 400 }
      )
    }

    // Generate unique room code
    let roomCode: string
    let attempts = 0
    do {
      roomCode = generateRoomCode()
      attempts++
    } while (mockData.findRoomByCode(roomCode) && attempts < 10)

    if (attempts >= 10) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INTERNAL_ERROR', 
            message: 'Failed to generate unique room code' 
          } 
        },
        { status: 500 }
      )
    }

    // Create host user object
    const host: User = {
      id: payload.userId,
      email: payload.email,
      username: payload.username,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Create room
    const room: Room = {
      id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      code: roomCode,
      name: name.trim(),
      host_id: payload.userId,
      host,
      status: 'waiting',
      max_players: maxPlayers,
      settings: { ...defaultSettings, ...settings },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Store room and add host as first participant
    mockData.addRoom(room, host)

    return NextResponse.json({
      success: true,
      data: {
        room,
        participants: mockData.getRoomParticipants(room.id),
        is_host: true
      }
    })
  } catch (error) {
    console.error('Create room error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'An internal error occurred' 
        } 
      },
      { status: 500 }
    )
  }
}