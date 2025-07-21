import { NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { questionGenerator } from '@/lib/questionGenerator'
import { mockData } from '@/lib/mockData'
import type { GameEngine, GameSession, GamePlayer, GameSettings, Question, GameRound } from '@/types'

const defaultGameSettings: GameSettings = {
  max_players: 20,
  questions_per_game: 10,
  time_per_question: 30,
  points_per_correct: 100,
  speed_bonus_enabled: true,
  multi_modal_enabled: true,
  show_correct_answer: true,
  allow_late_join: false
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
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

    const { sessionId } = await params
    const gameEngine = mockData.getGameSession(sessionId)

    if (!gameEngine) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'SESSION_NOT_FOUND', 
            message: 'Game session not found' 
          } 
        },
        { status: 404 }
      )
    }

    // Check if user is part of this session
    const isParticipant = gameEngine.players.some(p => p.user.id === payload.userId)
    const isHost = gameEngine.session.room_id && // Check if user is host of the room
                   payload.userId === 'host_id' // This would be looked up from room data

    if (!isParticipant && !isHost) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'ACCESS_DENIED', 
            message: 'Access denied to this game session' 
          } 
        },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: gameEngine,
      is_host: isHost
    })
  } catch (error) {
    console.error('Get game session error:', error)
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

// Create a new game session for a room
export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
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

    const body = await request.json()
    const { room_id, game_type = 'multiple_choice', settings = {} } = body

    // Validate input
    if (!room_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_INPUT', 
            message: 'Room ID is required' 
          } 
        },
        { status: 400 }
      )
    }

    // Check if session already exists for this room
    if (mockData.getGameSessionByRoom(room_id)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'SESSION_EXISTS', 
            message: 'Game session already exists for this room' 
          } 
        },
        { status: 400 }
      )
    }

    const resolvedParams = await params
    const sessionId = resolvedParams.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create game session
    const gameSession: GameSession = {
      id: sessionId,
      room_id,
      game_type,
      status: 'waiting',
      current_round: 0,
      total_rounds: settings.questions_per_game || defaultGameSettings.questions_per_game,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Generate questions for the game
    const questions = questionGenerator.generateGameQuestionSet(
      sessionId,
      gameSession.total_rounds,
      settings.multi_modal_enabled ?? defaultGameSettings.multi_modal_enabled
    )

    // Create game engine
    const gameEngine: GameEngine = {
      session: gameSession,
      questions,
      players: [],
      scores: [],
      settings: { ...defaultGameSettings, ...settings },
      status: 'waiting',
      timer: {
        total_time: 0,
        remaining_time: 0,
        is_running: false
      }
    }

    // Store the session
    mockData.updateGameSession(sessionId, gameEngine)
    // Room session mapping is handled in mockData.addGameSession

    return NextResponse.json({
      success: true,
      data: gameEngine
    })
  } catch (error) {
    console.error('Create game session error:', error)
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