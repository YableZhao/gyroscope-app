import { NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { mockData } from '@/lib/mockData'
import type { User } from '@/types'

interface JoinRoomRequest {
  code: string
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

    const body: JoinRoomRequest = await request.json()
    const { code } = body

    // Validate input
    if (!code || code.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_INPUT', 
            message: 'Room code is required' 
          } 
        },
        { status: 400 }
      )
    }

    // Find room by code
    const room = mockData.findRoomByCode(code)
    if (!room) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'ROOM_NOT_FOUND', 
            message: 'Room not found. Please check the room code.' 
          } 
        },
        { status: 404 }
      )
    }

    // Check if room is full
    const currentParticipants = mockData.getRoomParticipants(room.id)
    if (currentParticipants.length >= room.max_players) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'ROOM_FULL', 
            message: 'This room is full' 
          } 
        },
        { status: 400 }
      )
    }

    // Check if room allows late join (if game is in progress)
    if (room.status === 'playing' && !room.settings?.allow_late_join) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'GAME_IN_PROGRESS', 
            message: 'Cannot join room while game is in progress' 
          } 
        },
        { status: 400 }
      )
    }

    // Check if user is already in the room
    const isAlreadyParticipant = currentParticipants.some(p => p.id === payload.userId)
    if (isAlreadyParticipant) {
      // User is already in room, just return the room data
      return NextResponse.json({
        success: true,
        data: {
          room,
          participants: currentParticipants,
          is_host: room.host_id === payload.userId
        }
      })
    }

    // Create user object
    const user: User = {
      id: payload.userId,
      email: payload.email,
      username: payload.username,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Add user to room participants
    const added = mockData.addParticipantToRoom(room.id, user)
    if (!added) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'ROOM_FULL', 
            message: 'This room is full' 
          } 
        },
        { status: 400 }
      )
    }

    // Update room's updated_at timestamp
    room.updated_at = new Date().toISOString()

    return NextResponse.json({
      success: true,
      data: {
        room,
        participants: mockData.getRoomParticipants(room.id),
        is_host: room.host_id === payload.userId
      }
    })
  } catch (error) {
    console.error('Join room error:', error)
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