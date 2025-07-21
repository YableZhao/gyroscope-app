"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useRoom } from '@/hooks/useRoom'
import { useGameEngine } from '@/hooks/useGameEngine'
import { useRealtime } from '@/contexts/RealtimeContext'
import { WaitingLobby } from '@/components/room/WaitingLobby'
import { GameInterface } from '@/components/game/GameInterface'
import type { Room, GameEngine } from '@/types'

type RoomState = 'loading' | 'joining' | 'lobby' | 'game' | 'finished' | 'error'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.code as string
  
  const [roomState, setRoomState] = useState<RoomState>('loading')
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null)
  const [gameSessionId, setGameSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { user, isLoading: authLoading } = useAuth()
  const { joinRoom, room, participants, isHost, isLoading: roomLoading, error: roomError } = useRoom()
  const { 
    gameEngine, 
    startGame, 
    gameStatus, 
    isLoading: gameLoading, 
    error: gameError 
  } = useGameEngine(gameSessionId || undefined)
  const { 
    isConnected: realtimeConnected, 
    currentRoom: realtimeRoom, 
    participants: realtimeParticipants,
    gameEngine: realtimeGameEngine,
    connectToRoom: connectToRealtimeRoom,
    leaveRoom: leaveRealtimeRoom,
    error: realtimeError 
  } = useRealtime()

  // Redirect to lobby if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/lobby')
    }
  }, [authLoading, user, router])

  // Auto-join room when component loads
  useEffect(() => {
    if (user && roomCode && !room && roomState === 'loading') {
      handleJoinRoom()
    }
  }, [user, roomCode, room, roomState])

  // Update room state based on current status
  useEffect(() => {
    if (room) {
      setCurrentRoom(room)
      
      if (room.status === 'playing' && gameSessionId) {
        setRoomState('game')
      } else {
        setRoomState('lobby')
      }
    }
  }, [room, gameSessionId])

  // Connect to realtime room when we have the room
  useEffect(() => {
    if (currentRoom?.id && realtimeConnected) {
      connectToRealtimeRoom(currentRoom.id)
    }
  }, [currentRoom?.id, realtimeConnected, connectToRealtimeRoom])

  // Handle game engine state changes (prioritize realtime data)
  useEffect(() => {
    const activeGameEngine = realtimeGameEngine || gameEngine
    if (activeGameEngine) {
      switch (activeGameEngine.status) {
        case 'waiting':
        case 'countdown':
          setRoomState('lobby')
          break
        case 'question':
        case 'results':
        case 'leaderboard':
          setRoomState('game')
          break
        case 'finished':
          setRoomState('finished')
          break
      }
    }
  }, [realtimeGameEngine?.status, gameEngine?.status])

  // Handle errors
  useEffect(() => {
    if (roomError || gameError || realtimeError) {
      setError(roomError || gameError || realtimeError)
      setRoomState('error')
    }
  }, [roomError, gameError, realtimeError])

  const handleJoinRoom = async () => {
    if (!roomCode) return
    
    setRoomState('joining')
    setError(null)

    try {
      const joinedRoom = await joinRoom({ code: roomCode })
      if (joinedRoom) {
        setCurrentRoom(joinedRoom)
        setRoomState('lobby')
      }
    } catch (err) {
      setError('Failed to join room')
      setRoomState('error')
    }
  }

  const handleStartGame = async () => {
    if (!currentRoom || !isHost) return

    try {
      // Create game session first
      const response = await fetch(`/api/game/session/new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          room_id: currentRoom.id,
          game_type: 'multiple_choice',
          settings: currentRoom.settings
        })
      })

      if (response.ok) {
        const result = await response.json()
        const sessionId = result.data.session.id
        setGameSessionId(sessionId)
        
        // Start the game
        await startGame()
      }
    } catch (err) {
      setError('Failed to start game')
    }
  }

  const handleLeaveRoom = () => {
    // Leave realtime room
    leaveRealtimeRoom()
    router.push('/lobby')
  }

  if (authLoading) {
    return <LoadingScreen message="Authenticating..." />
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  if (roomState === 'loading' || roomState === 'joining') {
    return <LoadingScreen message={roomState === 'loading' ? 'Loading room...' : 'Joining room...'} />
  }

  if (roomState === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Room Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">{error || 'Failed to load room'}</p>
            <div className="space-y-2">
              <Button onClick={handleJoinRoom} className="w-full">
                Try Again
              </Button>
              <Button onClick={handleLeaveRoom} variant="outline" className="w-full">
                Return to Lobby
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AnimatePresence mode="wait">
        {roomState === 'lobby' && (
          <WaitingLobby
            key="lobby"
            room={realtimeRoom || currentRoom}
            participants={realtimeParticipants.length > 0 ? realtimeParticipants : participants}
            user={user}
            isHost={isHost}
            onStartGame={handleStartGame}
            onLeaveRoom={handleLeaveRoom}
            isLoading={roomLoading || gameLoading}
            realtimeConnected={realtimeConnected}
          />
        )}
        
        {roomState === 'game' && (realtimeGameEngine || gameEngine) && (
          <GameInterface
            key="game"
            gameEngine={(realtimeGameEngine || gameEngine)!}
            user={user}
            isHost={isHost}
            onLeaveGame={handleLeaveRoom}
            realtimeConnected={realtimeConnected}
          />
        )}
        
        {roomState === 'finished' && (
          <GameFinished
            key="finished"
            gameEngine={gameEngine}
            onReturnToLobby={handleLeaveRoom}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-lg text-gray-600">{message}</p>
      </motion.div>
    </div>
  )
}

function GameFinished({ gameEngine, onReturnToLobby }: { 
  gameEngine: GameEngine | null
  onReturnToLobby: () => void 
}) {
  const topScores = gameEngine?.scores.slice(0, 3) || []

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl mb-2">🎉 Game Finished!</CardTitle>
          <p className="text-gray-600">Congratulations to all participants!</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Top 3 Leaderboard */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-center">Final Rankings</h3>
              {topScores.map((score, index) => (
                <motion.div
                  key={score.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    index === 0 ? 'bg-yellow-100 border-2 border-yellow-400' :
                    index === 1 ? 'bg-gray-100 border-2 border-gray-400' :
                    index === 2 ? 'bg-orange-100 border-2 border-orange-400' :
                    'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-500 text-white' :
                      index === 2 ? 'bg-orange-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{score.user.username}</div>
                      <div className="text-sm text-gray-500">
                        {score.accuracy.toFixed(1)}% accuracy
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{score.score} pts</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Game Stats */}
            {gameEngine && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {gameEngine.session.total_rounds}
                  </div>
                  <div className="text-sm text-gray-600">Questions</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {gameEngine.players.length}
                  </div>
                  <div className="text-sm text-gray-600">Players</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round((gameEngine.scores.reduce((sum, s) => sum + s.accuracy, 0) / gameEngine.scores.length) || 0)}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Accuracy</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round((gameEngine.scores.reduce((sum, s) => sum + s.score, 0) / gameEngine.scores.length) || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Avg Score</div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-center space-x-4">
              <Button onClick={onReturnToLobby} className="px-8">
                Return to Lobby
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}