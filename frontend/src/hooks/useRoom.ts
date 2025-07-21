"use client"

import { useState, useCallback } from 'react'
import { tokenStorage } from '@/lib/auth'
import type { Room, RoomSettings, User } from '@/types'

interface CreateRoomRequest {
  name: string
  maxPlayers?: number
  settings?: Partial<RoomSettings>
}

interface JoinRoomRequest {
  code: string
}

interface UseRoomReturn {
  room: Room | null
  participants: User[]
  isLoading: boolean
  error: string | null
  isHost: boolean
  createRoom: (data: CreateRoomRequest) => Promise<Room | null>
  joinRoom: (data: JoinRoomRequest) => Promise<Room | null>
  leaveRoom: () => Promise<void>
  updateRoomSettings: (settings: Partial<RoomSettings>) => Promise<boolean>
  clearError: () => void
}

export function useRoom(): UseRoomReturn {
  const [room, setRoom] = useState<Room | null>(null)
  const [participants, setParticipants] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isHost, setIsHost] = useState(false)

  const createRoom = useCallback(async (data: CreateRoomRequest): Promise<Room | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const token = tokenStorage.get()
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to create room')
      }

      const result = await response.json()
      const createdRoom = result.data.room
      const roomParticipants = result.data.participants

      setRoom(createdRoom)
      setParticipants(roomParticipants)
      setIsHost(true)

      return createdRoom
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create room'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const joinRoom = useCallback(async (data: JoinRoomRequest): Promise<Room | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const token = tokenStorage.get()
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to join room')
      }

      const result = await response.json()
      const joinedRoom = result.data.room
      const roomParticipants = result.data.participants
      const hostStatus = result.data.is_host

      setRoom(joinedRoom)
      setParticipants(roomParticipants)
      setIsHost(hostStatus)

      return joinedRoom
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join room'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const leaveRoom = useCallback(async (): Promise<void> => {
    if (!room) return

    setIsLoading(true)
    setError(null)

    try {
      const token = tokenStorage.get()
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`/api/rooms/${room.id}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to leave room')
      }

      // Clear room state
      setRoom(null)
      setParticipants([])
      setIsHost(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave room'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [room])

  const updateRoomSettings = useCallback(async (settings: Partial<RoomSettings>): Promise<boolean> => {
    if (!room || !isHost) {
      setError('Only the host can update room settings')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const token = tokenStorage.get()
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`/api/rooms/${room.id}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ settings })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to update room settings')
      }

      const result = await response.json()
      const updatedRoom = result.data

      setRoom(updatedRoom)
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update room settings'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [room, isHost])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    room,
    participants,
    isLoading,
    error,
    isHost,
    createRoom,
    joinRoom,
    leaveRoom,
    updateRoomSettings,
    clearError
  }
}