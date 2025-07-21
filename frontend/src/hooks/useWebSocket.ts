"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type { WebSocketMessage, SensorData } from '@/types'

interface UseWebSocketOptions {
  url?: string
  userId?: string
  roomId?: string
  username?: string
  autoConnect?: boolean
}

interface UseWebSocketReturn {
  socket: Socket | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  sendMessage: (message: Omit<WebSocketMessage, 'timestamp'>) => void
  sendSensorData: (data: SensorData) => void
  connect: () => void
  disconnect: () => void
}

export function useWebSocket({
  url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8081',
  userId,
  roomId,
  username,
  autoConnect = false
}: UseWebSocketOptions): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)

  const connect = useCallback(() => {
    if (socketRef.current?.connected || !userId || !roomId) {
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      // Create WebSocket connection with query parameters
      const wsUrl = url.replace(/^https?:/, 'ws:').replace(/^wss?:/, 'ws:')
      const socket = io(wsUrl, {
        query: {
          user_id: userId,
          room_id: roomId,
          username: username || 'Anonymous'
        },
        transports: ['websocket'],
        forceNew: true
      })

      socket.on('connect', () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setIsConnecting(false)
        setError(null)
      })

      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason)
        setIsConnected(false)
        setIsConnecting(false)
      })

      socket.on('connect_error', (err) => {
        console.error('WebSocket connection error:', err)
        setError(err.message)
        setIsConnected(false)
        setIsConnecting(false)
      })

      // Handle incoming messages
      socket.on('message', (message: WebSocketMessage) => {
        console.log('Received WebSocket message:', message)
        // Messages are handled by specific listeners in components
      })

      socketRef.current = socket
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err)
      setError(err instanceof Error ? err.message : 'Connection failed')
      setIsConnecting(false)
    }
  }, [url, userId, roomId, username])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    setIsConnected(false)
    setIsConnecting(false)
  }, [])

  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'timestamp'>) => {
    if (!socketRef.current?.connected) {
      console.warn('WebSocket not connected, cannot send message')
      return
    }

    const fullMessage: WebSocketMessage = {
      ...message,
      timestamp: Date.now()
    }

    socketRef.current.emit('message', fullMessage)
  }, [])

  const sendSensorData = useCallback((data: SensorData) => {
    sendMessage({
      type: 'sensor_data',
      data,
      user_id: userId,
      room_id: roomId
    })
  }, [sendMessage, userId, roomId])

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect && userId && roomId) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, userId, roomId, connect, disconnect])

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
    sendMessage,
    sendSensorData,
    connect,
    disconnect
  }
}