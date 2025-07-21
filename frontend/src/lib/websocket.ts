"use client"

import { useRef, useEffect, useCallback, useState } from 'react'
import type { User, Room, GameEngine, PlayerResponse } from '@/types'

export interface WebSocketMessage {
  type: 'room_update' | 'game_start' | 'game_update' | 'player_joined' | 'player_left' | 'question_start' | 'answer_submitted' | 'game_end'
  data: unknown
  timestamp: string
  room_id?: string
  user_id?: string
}

export interface RoomUpdateMessage {
  type: 'room_update'
  data: {
    room: Room
    participants: User[]
  }
}

export interface GameUpdateMessage {
  type: 'game_update'
  data: {
    game_engine: GameEngine
    current_question?: unknown
    time_remaining?: number
  }
}

export interface PlayerJoinedMessage {
  type: 'player_joined'
  data: {
    user: User
    room: Room
  }
}

export interface PlayerLeftMessage {
  type: 'player_left'
  data: {
    user_id: string
    room: Room
  }
}

export interface AnswerSubmittedMessage {
  type: 'answer_submitted'
  data: {
    response: PlayerResponse
    game_engine: GameEngine
  }
}

interface UseWebSocketOptions {
  url?: string
  autoConnect?: boolean
  reconnectAttempts?: number
  reconnectDelay?: number
}

interface UseWebSocketReturn {
  socket: WebSocket | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connect: () => void
  disconnect: () => void
  sendMessage: (message: WebSocketMessage) => void
  joinRoom: (roomId: string, token: string) => void
  leaveRoom: (roomId: string) => void
  onMessage: (callback: (message: WebSocketMessage) => void) => void
  offMessage: (callback: (message: WebSocketMessage) => void) => void
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    url = 'ws://localhost:8002/ws', // WebSocket service URL
    autoConnect = false,
    reconnectAttempts = 5,
    reconnectDelay = 1000
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const socketRef = useRef<WebSocket | null>(null)
  const messageCallbacksRef = useRef<Set<(message: WebSocketMessage) => void>>(new Set())
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectCountRef = useRef(0)
  const roomIdRef = useRef<string | null>(null)
  const tokenRef = useRef<string | null>(null)

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const socket = new WebSocket(url)
      
      socket.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setIsConnecting(false)
        setError(null)
        reconnectCountRef.current = 0
        
        // Auto-rejoin room if we were in one
        if (roomIdRef.current && tokenRef.current) {
          joinRoom(roomIdRef.current, tokenRef.current)
        }
      }

      socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          console.log('WebSocket message received:', message)
          
          // Notify all callbacks
          messageCallbacksRef.current.forEach(callback => {
            try {
              callback(message)
            } catch (err) {
              console.error('Error in message callback:', err)
            }
          })
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      socket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        setIsConnected(false)
        setIsConnecting(false)
        
        // Attempt to reconnect if not intentionally closed
        if (event.code !== 1000 && reconnectCountRef.current < reconnectAttempts) {
          const delay = reconnectDelay * Math.pow(2, reconnectCountRef.current)
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectCountRef.current + 1}/${reconnectAttempts})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectCountRef.current++
            connect()
          }, delay)
        }
      }

      socket.onerror = (event) => {
        console.error('WebSocket error:', event)
        setError('WebSocket connection error')
        setIsConnecting(false)
      }

      socketRef.current = socket
    } catch (err) {
      console.error('Failed to create WebSocket:', err)
      setError('Failed to create WebSocket connection')
      setIsConnecting(false)
    }
  }, [url, reconnectAttempts, reconnectDelay])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (socketRef.current) {
      socketRef.current.close(1000, 'Client disconnect')
      socketRef.current = null
    }
    
    setIsConnected(false)
    setIsConnecting(false)
    reconnectCountRef.current = 0
    roomIdRef.current = null
    tokenRef.current = null
  }, [])

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      try {
        const messageWithTimestamp = {
          ...message,
          timestamp: new Date().toISOString()
        }
        socketRef.current.send(JSON.stringify(messageWithTimestamp))
        console.log('WebSocket message sent:', messageWithTimestamp)
      } catch (err) {
        console.error('Error sending WebSocket message:', err)
        setError('Failed to send message')
      }
    } else {
      console.warn('WebSocket not connected, cannot send message')
      setError('WebSocket not connected')
    }
  }, [])

  const joinRoom = useCallback((roomId: string, token: string) => {
    roomIdRef.current = roomId
    tokenRef.current = token
    
    sendMessage({
      type: 'room_update',
      data: {
        action: 'join',
        room_id: roomId,
        token: token
      },
      timestamp: new Date().toISOString()
    })
  }, [sendMessage])

  const leaveRoom = useCallback((roomId: string) => {
    sendMessage({
      type: 'room_update',
      data: {
        action: 'leave',
        room_id: roomId
      },
      timestamp: new Date().toISOString()
    })
    
    roomIdRef.current = null
    tokenRef.current = null
  }, [sendMessage])

  const onMessage = useCallback((callback: (message: WebSocketMessage) => void) => {
    messageCallbacksRef.current.add(callback)
  }, [])

  const offMessage = useCallback((callback: (message: WebSocketMessage) => void) => {
    messageCallbacksRef.current.delete(callback)
  }, [])

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    sendMessage,
    joinRoom,
    leaveRoom,
    onMessage,
    offMessage
  }
}

// Singleton WebSocket manager for global state
class WebSocketManager {
  private static instance: WebSocketManager
  private socket: WebSocket | null = null
  private callbacks: Set<(message: WebSocketMessage) => void> = new Set()
  private isConnected = false
  private currentRoom: string | null = null

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager()
    }
    return WebSocketManager.instance
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      const wsUrl = `ws://localhost:8002/ws?token=${encodeURIComponent(token)}`
      this.socket = new WebSocket(wsUrl)

      this.socket.onopen = () => {
        console.log('Global WebSocket connected')
        this.isConnected = true
        resolve()
      }

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.callbacks.forEach(callback => callback(message))
        } catch (err) {
          console.error('Error parsing message:', err)
        }
      }

      this.socket.onclose = () => {
        console.log('Global WebSocket disconnected')
        this.isConnected = false
      }

      this.socket.onerror = (error) => {
        console.error('Global WebSocket error:', error)
        reject(error)
      }
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
      this.isConnected = false
      this.currentRoom = null
    }
  }

  sendMessage(message: WebSocketMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString()
      }))
    }
  }

  subscribe(callback: (message: WebSocketMessage) => void) {
    this.callbacks.add(callback)
  }

  unsubscribe(callback: (message: WebSocketMessage) => void) {
    this.callbacks.delete(callback)
  }

  joinRoom(roomId: string) {
    this.currentRoom = roomId
    this.sendMessage({
      type: 'room_update',
      data: { action: 'join', room_id: roomId },
      timestamp: new Date().toISOString()
    })
  }

  leaveRoom() {
    if (this.currentRoom) {
      this.sendMessage({
        type: 'room_update',
        data: { action: 'leave', room_id: this.currentRoom },
        timestamp: new Date().toISOString()
      })
      this.currentRoom = null
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      currentRoom: this.currentRoom
    }
  }
}

export const wsManager = WebSocketManager.getInstance()