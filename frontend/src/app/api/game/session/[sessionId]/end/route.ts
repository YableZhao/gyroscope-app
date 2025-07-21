import { NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { mockData } from '@/lib/mockData'
import type { GameEngine } from '@/types'

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
            message: 'Only the host can end the game' 
          } 
        },
        { status: 403 }
      )
    }

    // End the game
    const currentTime = new Date().toISOString()
    
    gameEngine.session.status = 'finished'
    gameEngine.session.end_time = currentTime
    gameEngine.session.updated_at = currentTime
    gameEngine.status = 'finished'
    gameEngine.current_round = undefined
    gameEngine.timer = {
      total_time: 0,
      remaining_time: 0,
      is_running: false,
      end_time: currentTime
    }

    // Calculate final rankings and statistics
    gameEngine.scores.sort((a, b) => b.score - a.score)
    gameEngine.scores.forEach((score, index) => {
      score.rank = index + 1
      
      // Calculate accuracy based on total responses
      const totalQuestions = gameEngine.session.current_round
      const playerResponses = gameEngine.current_round?.responses.filter(r => r.user_id === score.user_id) || []
      const correctResponses = playerResponses.filter(r => r.is_correct).length
      
      score.accuracy = totalQuestions && totalQuestions > 0 
        ? (correctResponses / totalQuestions) * 100 
        : 0
      score.updated_at = currentTime
    })

    // Update player ranks
    gameEngine.players.forEach(player => {
      const playerScore = gameEngine.scores.find(s => s.user_id === player.user.id)
      if (playerScore) {
        player.rank = playerScore.rank
        player.total_score = playerScore.score
      }
    })

    // Store updated engine
    mockData.updateGameSession(sessionId, gameEngine)

    // In a real implementation, this would broadcast game end to all players

    return NextResponse.json({
      success: true,
      data: gameEngine,
      message: 'Game ended successfully'
    })
  } catch (error) {
    console.error('End game error:', error)
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