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

    // Check if user is host
    const isHost = true // Simplified for demo

    if (!isHost) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'ACCESS_DENIED', 
            message: 'Only the host can control game flow' 
          } 
        },
        { status: 403 }
      )
    }

    // Check if game is in valid state to advance
    if (!['question', 'results'].includes(gameEngine.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_STATE', 
            message: 'Cannot advance question in current game state' 
          } 
        },
        { status: 400 }
      )
    }

    const currentRound = gameEngine.session.current_round
    const nextRoundNumber = currentRound + 1

    // Check if game should end
    if (nextRoundNumber > gameEngine.session.total_rounds) {
      // Game is finished
      gameEngine.session.status = 'finished'
      gameEngine.session.end_time = new Date().toISOString()
      gameEngine.session.updated_at = new Date().toISOString()
      gameEngine.status = 'finished'
      gameEngine.current_round = undefined
      gameEngine.timer = {
        total_time: 0,
        remaining_time: 0,
        is_running: false,
        end_time: new Date().toISOString()
      }

      // Calculate final rankings
      gameEngine.scores.sort((a, b) => b.score - a.score)
      gameEngine.scores.forEach((score, index) => {
        score.rank = index + 1
        score.updated_at = new Date().toISOString()
      })

      // Update player ranks
      gameEngine.players.forEach(player => {
        const playerScore = gameEngine.scores.find(s => s.user_id === player.user.id)
        if (playerScore) {
          player.rank = playerScore.rank
          player.total_score = playerScore.score
        }
      })

      mockData.updateGameSession(sessionId, gameEngine)

      return NextResponse.json({
        success: true,
        data: gameEngine,
        message: 'Game finished',
        game_ended: true
      })
    }

    // Get next question
    const nextQuestion = gameEngine.questions[nextRoundNumber - 1] // 0-indexed array
    
    if (!nextQuestion) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'NO_MORE_QUESTIONS', 
            message: 'No more questions available' 
          } 
        },
        { status: 500 }
      )
    }

    const currentTime = new Date().toISOString()

    // Create next round
    const nextRound: GameRound = {
      id: `${sessionId}_round_${nextRoundNumber}`,
      session_id: sessionId,
      question: nextQuestion,
      status: 'waiting',
      start_time: currentTime,
      time_remaining: gameEngine.settings.time_per_question,
      responses: []
    }

    // Update game engine
    gameEngine.session.current_round = nextRoundNumber
    gameEngine.session.updated_at = currentTime
    gameEngine.status = 'countdown' // Brief countdown before question starts
    gameEngine.current_round = nextRound
    gameEngine.timer = {
      total_time: gameEngine.settings.time_per_question,
      remaining_time: gameEngine.settings.time_per_question,
      is_running: false, // Will start after countdown
      start_time: currentTime
    }

    // Reset player responses for new question
    gameEngine.players.forEach(player => {
      player.current_response = undefined
      player.is_ready = false
    })

    // Update scores (calculate accuracy)
    gameEngine.scores.forEach(score => {
      const player = gameEngine.players.find(p => p.user.id === score.user_id)
      if (player && gameEngine.current_round) {
        const totalQuestions = nextRoundNumber - 1 // Previous questions
        const correctAnswers = gameEngine.scores.find(s => s.user_id === player.user.id)?.score || 0
        score.accuracy = totalQuestions > 0 ? (correctAnswers / (totalQuestions * gameEngine.settings.points_per_correct)) * 100 : 0
        score.updated_at = currentTime
      }
    })

    // Store updated engine
    mockData.updateGameSession(sessionId, gameEngine)

    // In a real implementation, this would broadcast to all players via WebSocket

    return NextResponse.json({
      success: true,
      data: gameEngine,
      message: `Advanced to question ${nextRoundNumber}`,
      round_number: nextRoundNumber
    })
  } catch (error) {
    console.error('Next question error:', error)
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