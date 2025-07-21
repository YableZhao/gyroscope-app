"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { wsManager, type WebSocketMessage } from '@/lib/websocket'
import type { Room, User, GameEngine } from '@/types'

interface RealtimeContextType {
  isConnected: boolean
  currentRoom: Room | null
  participants: User[]
  gameEngine: GameEngine | null
  connectToRoom: (roomId: string) => Promise<void>
  leaveRoom: () => void
  sendAnswer: (questionId: string, answer: unknown) => void
  sendGameAction: (action: string, data?: unknown) => void
  error: string | null
}

const RealtimeContext = createContext<RealtimeContextType | null>(null)

export function useRealtime(): RealtimeContextType {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}

interface RealtimeProviderProps {
  children: React.ReactNode
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null)
  const [participants, setParticipants] = useState<User[]>([])
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((message: WebSocketMessage) => {
    console.log('Realtime message received:', message)
    setError(null)

    switch (message.type) {
      case 'room_update': {
        const data = message.data as { room: Room; participants: User[] }
        setCurrentRoom(data.room)
        setParticipants(data.participants)
        break
      }

      case 'player_joined': {
        const data = message.data as { user: User; room: Room }
        setCurrentRoom(data.room)
        setParticipants(prev => {
          const existing = prev.find(p => p.id === data.user.id)
          if (existing) return prev
          return [...prev, data.user]
        })
        break
      }

      case 'player_left': {
        const data = message.data as { user_id: string; room: Room }
        setCurrentRoom(data.room)
        setParticipants(prev => prev.filter(p => p.id !== data.user_id))
        break
      }

      case 'game_start': {
        const data = message.data as { game_engine: GameEngine }
        setGameEngine(data.game_engine)
        break
      }

      case 'game_update': {
        const data = message.data as { game_engine: GameEngine }
        setGameEngine(data.game_engine)
        break
      }

      case 'question_start': {
        const data = message.data as { game_engine: GameEngine; question: unknown }
        setGameEngine(data.game_engine)
        break
      }

      case 'answer_submitted': {
        const data = message.data as { game_engine: GameEngine }
        setGameEngine(data.game_engine)
        break
      }

      case 'game_end': {
        const data = message.data as { game_engine: GameEngine }
        setGameEngine(data.game_engine)
        break
      }

      default:
        console.warn('Unknown message type:', message.type)
    }
  }, [])

  // Initialize WebSocket connection when user is authenticated
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('auth-token')
      if (token) {
        wsManager.connect(token)
        .then(() => {
          console.log('WebSocket connected successfully')
          setIsConnected(true)
          wsManager.subscribe(handleMessage)
        })
        .catch((err) => {
          console.error('WebSocket connection failed:', err)
          setError('Failed to connect to real-time service')
          setIsConnected(false)
        })
      }
    } else {
      // Disconnect when user logs out
      wsManager.disconnect()
      setIsConnected(false)
      setCurrentRoom(null)
      setParticipants([])
      setGameEngine(null)
    }

    return () => {
      wsManager.unsubscribe(handleMessage)
    }
  }, [user, handleMessage])

  // Connect to a specific room
  const connectToRoom = useCallback(async (roomId: string) => {
    if (!isConnected) {
      setError('Not connected to real-time service')
      return
    }

    try {
      wsManager.joinRoom(roomId)
      setError(null)
    } catch (err) {
      console.error('Failed to join room:', err)
      setError('Failed to join room')
    }
  }, [isConnected])

  // Leave current room
  const leaveRoom = useCallback(() => {
    if (currentRoom) {
      wsManager.leaveRoom()
      setCurrentRoom(null)
      setParticipants([])
      setGameEngine(null)
    }
  }, [currentRoom])

  // Send answer to current question
  const sendAnswer = useCallback((questionId: string, answer: unknown) => {
    if (!currentRoom) {
      setError('Not in a room')
      return
    }

    wsManager.sendMessage({
      type: 'answer_submitted',
      data: {
        question_id: questionId,
        answer: answer,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      room_id: currentRoom.id,
      user_id: user?.id
    })
  }, [currentRoom, user])

  // Send game action (start, pause, next, etc.)
  const sendGameAction = useCallback((action: string, data?: unknown) => {
    if (!currentRoom) {
      setError('Not in a room')
      return
    }

    wsManager.sendMessage({
      type: 'game_update',
      data: {
        action: action,
        ...(data as object || {})
      },
      timestamp: new Date().toISOString(),
      room_id: currentRoom.id,
      user_id: user?.id
    })
  }, [currentRoom, user])

  const contextValue: RealtimeContextType = {
    isConnected,
    currentRoom,
    participants,
    gameEngine,
    connectToRoom,
    leaveRoom,
    sendAnswer,
    sendGameAction,
    error
  }

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  )
}