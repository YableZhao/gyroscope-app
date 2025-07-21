import { NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { mockData } from '@/lib/mockData'
import type { GameEngine, GameRound } from '@/types'

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

    // Check if user is host (simplified check - in production would verify room ownership)
    const isHost = true // For now, assume authenticated user can start

    if (!isHost) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'ACCESS_DENIED', 
            message: 'Only the host can start the game' 
          } 
        },
        { status: 403 }
      )
    }

    // Check if game can be started
    if (gameEngine.status !== 'waiting') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_STATE', 
            message: 'Game cannot be started in current state' 
          } 
        },
        { status: 400 }
      )
    }

    if (gameEngine.players.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'NO_PLAYERS', 
            message: 'Cannot start game with no players' 
          } 
        },
        { status: 400 }
      )
    }

    if (gameEngine.questions.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'NO_QUESTIONS', 
            message: 'No questions available for this game' 
          } 
        },
        { status: 500 }
      )
    }

    // Start the game
    const firstQuestion = gameEngine.questions[0]
    const currentTime = new Date().toISOString()

    // Create first round
    const firstRound: GameRound = {
      id: `${sessionId}_round_1`,
      session_id: sessionId,
      question: firstQuestion,
      status: 'waiting',
      start_time: currentTime,
      time_remaining: gameEngine.settings.time_per_question,
      responses: []
    }

    // Update game engine
    gameEngine.session.status = 'countdown'
    gameEngine.session.current_round = 1
    gameEngine.session.start_time = currentTime
    gameEngine.session.updated_at = currentTime
    gameEngine.status = 'countdown'
    gameEngine.current_round = firstRound
    gameEngine.timer = {
      total_time: gameEngine.settings.time_per_question,
      remaining_time: gameEngine.settings.time_per_question,
      is_running: false, // Will start after countdown
      start_time: currentTime
    }

    // Reset all player scores for new game
    gameEngine.players.forEach(player => {
      player.total_score = 0
      player.rank = 0
      player.is_ready = false
      player.current_response = undefined
    })

    gameEngine.scores = gameEngine.players.map(player => ({
      user_id: player.user.id,
      session_id: sessionId,
      user: player.user,
      score: 0,
      rank: 0,
      accuracy: 0,
      updated_at: currentTime
    }))

    // Store updated engine
    mockData.updateGameSession(sessionId, gameEngine)

    // In a real implementation, this would broadcast to all players via WebSocket
    // For now, we'll just return the updated state

    return NextResponse.json({
      success: true,
      data: gameEngine,
      message: 'Game started successfully'
    })
  } catch (error) {
    console.error('Start game error:', error)
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