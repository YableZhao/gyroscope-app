"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import { tokenStorage } from '@/lib/auth'
import type {
  GameEngine,
  GameSession,
  Question,
  GameRound,
  GamePlayer,
  PlayerResponse,
  PlayerScore,
  GameStatus,
  GameTimer,
  GameSettings,
  QuestionType
} from '@/types'

interface UseGameEngineReturn {
  gameEngine: GameEngine | null
  currentQuestion: Question | null
  timer: GameTimer
  players: GamePlayer[]
  scores: PlayerScore[]
  gameStatus: GameStatus
  isHost: boolean
  isLoading: boolean
  error: string | null
  
  // Game control methods
  startGame: () => Promise<boolean>
  nextQuestion: () => Promise<boolean>
  endGame: () => Promise<boolean>
  submitAnswer: (answer: unknown) => Promise<boolean>
  
  // Timer control
  startTimer: (duration: number) => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void
  
  // Utility methods
  resetGame: () => void
  clearError: () => void
}

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

export function useGameEngine(sessionId?: string): UseGameEngineReturn {
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isHost, setIsHost] = useState(false)
  
  // Timer state
  const [timer, setTimer] = useState<GameTimer>({
    total_time: 0,
    remaining_time: 0,
    is_running: false
  })
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const gameEngineRef = useRef<GameEngine | null>(null)
  
  // Update ref when gameEngine changes
  useEffect(() => {
    gameEngineRef.current = gameEngine
  }, [gameEngine])

  // Initialize game engine
  useEffect(() => {
    if (sessionId) {
      loadGameSession(sessionId)
    }
  }, [sessionId])

  // Timer effect
  useEffect(() => {
    if (timer.is_running && timer.remaining_time > 0) {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          const newTime = prev.remaining_time - 1
          if (newTime <= 0) {
            // Time's up - auto submit or move to next question
            handleTimeUp()
            return { ...prev, remaining_time: 0, is_running: false }
          }
          return { ...prev, remaining_time: newTime }
        })
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [timer.is_running, timer.remaining_time])

  const loadGameSession = async (sessionId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const token = tokenStorage.get()
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`/api/game/session/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to load game session')
      }

      const result = await response.json()
      const engine: GameEngine = result.data

      setGameEngine(engine)
      setIsHost(result.is_host || false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load game session'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const startGame = useCallback(async (): Promise<boolean> => {
    if (!gameEngine || !isHost) {
      setError('Only the host can start the game')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const token = tokenStorage.get()
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`/api/game/session/${gameEngine.session.id}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to start game')
      }

      const result = await response.json()
      const updatedEngine: GameEngine = result.data

      setGameEngine(updatedEngine)

      // Start countdown for first question
      if (updatedEngine.current_round?.question) {
        startTimer(updatedEngine.settings.time_per_question)
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start game'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [gameEngine, isHost])

  const nextQuestion = useCallback(async (): Promise<boolean> => {
    if (!gameEngine || !isHost) {
      setError('Only the host can control game flow')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const token = tokenStorage.get()
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`/api/game/session/${gameEngine.session.id}/next`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to advance to next question')
      }

      const result = await response.json()
      const updatedEngine: GameEngine = result.data

      setGameEngine(updatedEngine)

      // Start timer for new question
      if (updatedEngine.current_round?.question) {
        startTimer(updatedEngine.settings.time_per_question)
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to advance to next question'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [gameEngine, isHost])

  const submitAnswer = useCallback(async (answer: unknown): Promise<boolean> => {
    if (!gameEngine || !gameEngine.current_round) {
      setError('No active question to answer')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const token = tokenStorage.get()
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`/api/game/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          session_id: gameEngine.session.id,
          question_id: gameEngine.current_round.question.id,
          answer: answer,
          time_to_respond: gameEngine.settings.time_per_question - timer.remaining_time
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to submit answer')
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit answer'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [gameEngine, timer.remaining_time])

  const endGame = useCallback(async (): Promise<boolean> => {
    if (!gameEngine || !isHost) {
      setError('Only the host can end the game')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const token = tokenStorage.get()
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`/api/game/session/${gameEngine.session.id}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to end game')
      }

      const result = await response.json()
      const updatedEngine: GameEngine = result.data

      setGameEngine(updatedEngine)
      stopTimer()

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end game'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [gameEngine, isHost])

  // Timer control methods
  const startTimer = useCallback((duration: number) => {
    setTimer({
      total_time: duration,
      remaining_time: duration,
      is_running: true,
      start_time: new Date().toISOString()
    })
  }, [])

  const pauseTimer = useCallback(() => {
    setTimer(prev => ({ ...prev, is_running: false }))
  }, [])

  const resumeTimer = useCallback(() => {
    setTimer(prev => ({ ...prev, is_running: true }))
  }, [])

  const stopTimer = useCallback(() => {
    setTimer({
      total_time: 0,
      remaining_time: 0,
      is_running: false,
      end_time: new Date().toISOString()
    })
  }, [])

  const handleTimeUp = useCallback(() => {
    // Auto-submit empty answer or move to next question
    console.log('Time up! Moving to next question...')
    if (isHost) {
      nextQuestion()
    }
  }, [isHost, nextQuestion])

  const resetGame = useCallback(() => {
    setGameEngine(null)
    setError(null)
    stopTimer()
  }, [stopTimer])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    gameEngine,
    currentQuestion: gameEngine?.current_round?.question || null,
    timer,
    players: gameEngine?.players || [],
    scores: gameEngine?.scores || [],
    gameStatus: gameEngine?.status || 'waiting',
    isHost,
    isLoading,
    error,
    
    startGame,
    nextQuestion,
    endGame,
    submitAnswer,
    
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    
    resetGame,
    clearError
  }
}