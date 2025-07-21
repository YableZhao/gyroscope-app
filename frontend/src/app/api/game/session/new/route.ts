import { NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { questionGenerator } from '@/lib/questionGenerator'
import { mockData } from '@/lib/mockData'
import type { GameEngine, GameSession, GameSettings } from '@/types'

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
    const existingSession = mockData.getGameSessionByRoom(room_id)
    if (existingSession) {
      
      if (existingSession && existingSession.session.status !== 'finished') {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'SESSION_EXISTS', 
              message: 'Active game session already exists for this room' 
            } 
          },
          { status: 400 }
        )
      }
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Merge settings with defaults
    const gameSettings: GameSettings = { ...defaultGameSettings, ...settings }

    // Create game session
    const gameSession: GameSession = {
      id: sessionId,
      room_id,
      game_type,
      status: 'waiting',
      current_round: 0,
      total_rounds: gameSettings.questions_per_game,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Generate questions for the game
    const questions = questionGenerator.generateGameQuestionSet(
      sessionId,
      gameSession.total_rounds,
      gameSettings.multi_modal_enabled
    )

    // Create game engine
    const gameEngine: GameEngine = {
      session: gameSession,
      questions,
      players: [
        // Add the current user as the first player (host)
        {
          user: {
            id: payload.userId,
            email: payload.email,
            username: payload.username,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          is_connected: true,
          is_ready: true,
          total_score: 0,
          rank: 1,
          joined_at: new Date().toISOString()
        }
      ],
      scores: [
        {
          user_id: payload.userId,
          session_id: sessionId,
          user: {
            id: payload.userId,
            email: payload.email,
            username: payload.username,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          score: 0,
          rank: 1,
          accuracy: 0,
          updated_at: new Date().toISOString()
        }
      ],
      settings: gameSettings,
      status: 'waiting',
      timer: {
        total_time: 0,
        remaining_time: 0,
        is_running: false
      }
    }

    // Store the session
    mockData.addGameSession(sessionId, gameEngine)

    return NextResponse.json({
      success: true,
      data: gameEngine,
      message: 'Game session created successfully'
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

