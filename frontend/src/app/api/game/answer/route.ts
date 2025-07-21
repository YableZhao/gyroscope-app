import { NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import type { GameEngine, PlayerResponse, ResponseType, SensorData } from '@/types'

// Import mock storage
const mockGameSessions: Record<string, GameEngine> = {}

interface SubmitAnswerRequest {
  session_id: string
  question_id: string
  answer?: string | number | boolean
  response_data?: SensorData
  time_to_respond: number
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

    const body: SubmitAnswerRequest = await request.json()
    const { session_id, question_id, answer, response_data, time_to_respond } = body

    // Validate input
    if (!session_id || !question_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_INPUT', 
            message: 'Session ID and Question ID are required' 
          } 
        },
        { status: 400 }
      )
    }

    const gameEngine = mockGameSessions[session_id]
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

    // Check if user is a player in this session
    const player = gameEngine.players.find(p => p.user.id === payload.userId)
    if (!player) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'NOT_A_PLAYER', 
            message: 'User is not a player in this session' 
          } 
        },
        { status: 403 }
      )
    }

    // Check if game is in question state
    if (!['question', 'countdown'].includes(gameEngine.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_STATE', 
            message: 'Cannot submit answer in current game state' 
          } 
        },
        { status: 400 }
      )
    }

    // Check if current question matches
    if (!gameEngine.current_round || gameEngine.current_round.question.id !== question_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_QUESTION', 
            message: 'Question ID does not match current question' 
          } 
        },
        { status: 400 }
      )
    }

    // Check if player has already answered this question
    const existingResponse = gameEngine.current_round.responses.find(r => r.user_id === payload.userId)
    if (existingResponse) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'ALREADY_ANSWERED', 
            message: 'Player has already answered this question' 
          } 
        },
        { status: 400 }
      )
    }

    const currentQuestion = gameEngine.current_round.question
    const currentTime = new Date().toISOString()

    // Determine response type based on question type and provided data
    let responseType: ResponseType
    let finalAnswer: string | number | boolean | undefined
    let confidenceScore = 1.0
    let accuracyScore = 0
    let isCorrect = false

    // Process answer based on question type
    switch (currentQuestion.type) {
      case 'multiple_choice':
        responseType = 'multiple_choice'
        finalAnswer = answer
        isCorrect = answer === currentQuestion.correct_answer
        accuracyScore = isCorrect ? 100 : 0
        break

      case 'true_false':
        responseType = 'true_false'
        finalAnswer = answer
        isCorrect = answer === currentQuestion.correct_answer
        accuracyScore = isCorrect ? 100 : 0
        break

      case 'orientation_match':
        responseType = 'gyroscope'
        finalAnswer = 'orientation_data'
        if (response_data?.gyroscope && currentQuestion.target_data?.gyroscope) {
          // Calculate orientation accuracy (simplified)
          const target = currentQuestion.target_data.gyroscope
          const actual = response_data.gyroscope
          const alphaDiff = Math.abs(target.alpha - actual.alpha)
          const betaDiff = Math.abs(target.beta - actual.beta)
          const gammaDiff = Math.abs(target.gamma - actual.gamma)
          const totalDiff = alphaDiff + betaDiff + gammaDiff
          accuracyScore = Math.max(0, 100 - (totalDiff / 3)) // Simple accuracy calculation
          isCorrect = accuracyScore >= 70 // 70% accuracy threshold
          confidenceScore = accuracyScore / 100
        }
        break

      case 'voice_command':
        responseType = 'voice'
        if (response_data?.voice) {
          finalAnswer = response_data.voice.text.toLowerCase()
          const targetText = (currentQuestion.correct_answer as string).toLowerCase()
          confidenceScore = response_data.voice.confidence
          
          // Simple text matching (in production, use more sophisticated NLP)
          const similarity = calculateTextSimilarity(finalAnswer, targetText)
          accuracyScore = similarity * 100
          isCorrect = similarity >= 0.7 // 70% similarity threshold
        }
        break

      case 'gesture_recognition':
        responseType = 'gesture'
        if (response_data?.gesture) {
          finalAnswer = response_data.gesture.type
          isCorrect = finalAnswer === currentQuestion.correct_answer
          confidenceScore = response_data.gesture.confidence
          accuracyScore = isCorrect ? confidenceScore * 100 : 0
        }
        break

      case 'multi_modal':
        responseType = 'multi_modal'
        // Complex multi-modal scoring logic would go here
        finalAnswer = 'multi_modal_response'
        confidenceScore = 0.8
        accuracyScore = 75
        isCorrect = accuracyScore >= 70
        break

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'UNSUPPORTED_QUESTION_TYPE', 
              message: 'Unsupported question type' 
            } 
          },
          { status: 400 }
        )
    }

    // Calculate points
    let pointsAwarded = 0
    if (isCorrect) {
      pointsAwarded = currentQuestion.points
      
      // Speed bonus
      if (gameEngine.settings.speed_bonus_enabled) {
        const responseTimeRatio = time_to_respond / currentQuestion.time_limit
        if (responseTimeRatio < 0.5) { // Answered in first half of time
          pointsAwarded += Math.round(currentQuestion.points * 0.5) // 50% bonus
        } else if (responseTimeRatio < 0.75) { // Answered in first 3/4 of time
          pointsAwarded += Math.round(currentQuestion.points * 0.25) // 25% bonus
        }
      }
    }

    // Create player response
    const playerResponse: PlayerResponse = {
      id: `${session_id}_${question_id}_${payload.userId}_${Date.now()}`,
      session_id,
      user_id: payload.userId,
      question_id,
      response_type: responseType,
      answer_value: finalAnswer,
      response_data,
      confidence_score: confidenceScore,
      accuracy_score: accuracyScore,
      time_to_respond,
      points_awarded: pointsAwarded,
      is_correct: isCorrect,
      submitted_at: currentTime,
      created_at: currentTime
    }

    // Add response to current round
    gameEngine.current_round.responses.push(playerResponse)

    // Update player
    player.current_response = playerResponse
    player.total_score += pointsAwarded

    // Update player score
    let playerScore = gameEngine.scores.find(s => s.user_id === payload.userId)
    if (!playerScore) {
      playerScore = {
        user_id: payload.userId,
        session_id,
        user: player.user,
        score: 0,
        rank: 0,
        accuracy: 0,
        updated_at: currentTime
      }
      gameEngine.scores.push(playerScore)
    }

    playerScore.score += pointsAwarded
    playerScore.updated_at = currentTime

    // Recalculate rankings
    gameEngine.scores.sort((a, b) => b.score - a.score)
    gameEngine.scores.forEach((score, index) => {
      score.rank = index + 1
    })

    // Update player ranks
    gameEngine.players.forEach(p => {
      const score = gameEngine.scores.find(s => s.user_id === p.user.id)
      if (score) {
        p.rank = score.rank
      }
    })

    // Store updated game engine
    mockGameSessions[session_id] = gameEngine

    // In a real implementation, this would broadcast the response to all players

    return NextResponse.json({
      success: true,
      data: {
        response: playerResponse,
        player_score: playerScore,
        is_correct: isCorrect,
        points_awarded: pointsAwarded
      },
      message: isCorrect ? 'Correct answer!' : 'Incorrect answer'
    })
  } catch (error) {
    console.error('Submit answer error:', error)
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

// Helper function to calculate text similarity (simplified)
function calculateTextSimilarity(text1: string, text2: string): number {
  if (text1 === text2) return 1.0
  
  // Simple word-based similarity
  const words1 = text1.toLowerCase().split(' ')
  const words2 = text2.toLowerCase().split(' ')
  
  let matches = 0
  words1.forEach(word => {
    if (words2.includes(word)) {
      matches++
    }
  })
  
  return matches / Math.max(words1.length, words2.length)
}