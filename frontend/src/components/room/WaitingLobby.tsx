"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Room, User } from '@/types'

interface WaitingLobbyProps {
  room: Room | null
  participants: User[]
  user: User
  isHost: boolean
  onStartGame: () => void
  onLeaveRoom: () => void
  isLoading: boolean
  realtimeConnected?: boolean
}

export function WaitingLobby({
  room,
  participants,
  user,
  isHost,
  onStartGame,
  onLeaveRoom,
  isLoading,
  realtimeConnected = false
}: WaitingLobbyProps) {
  const [isStarting, setIsStarting] = useState(false)

  const handleStartGame = async () => {
    setIsStarting(true)
    try {
      await onStartGame()
    } finally {
      setIsStarting(false)
    }
  }

  if (!room) {
    return <div>Room not found</div>
  }

  const canStartGame = participants.length >= 1 && !isLoading && !isStarting

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {room.name}
          </h1>
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg text-gray-600">Room Code:</span>
              <code className="text-2xl font-mono font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-lg tracking-wider">
                {room.code}
              </code>
            </div>
            <Badge variant={room.status === 'waiting' ? 'default' : 'secondary'}>
              {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
            </Badge>
            <Badge variant={realtimeConnected ? 'default' : 'destructive'}>
              {realtimeConnected ? '🟢 Live' : '🔴 Offline'}
            </Badge>
          </div>
          <p className="text-gray-600 mt-2">
            Waiting for players to join...
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Players ({participants.length}/{room.max_players})</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-gray-500">Live</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {participants.map((participant, index) => (
                    <motion.div
                      key={participant.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center space-x-3 p-3 rounded-lg border ${
                        participant.id === user.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        participant.id === room.host_id
                          ? 'bg-yellow-500'
                          : participant.id === user.id
                          ? 'bg-blue-500'
                          : 'bg-gray-500'
                      }`}>
                        {participant.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{participant.username}</span>
                          {participant.id === room.host_id && (
                            <Badge variant="default" className="text-xs">Host</Badge>
                          )}
                          {participant.id === user.id && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {participant.id === room.host_id ? 'Room Host' : 'Player'}
                        </div>
                      </div>
                      <div className="w-3 h-3 bg-green-500 rounded-full" title="Online" />
                    </motion.div>
                  ))}
                  
                  {/* Empty slots */}
                  {Array.from({ length: Math.min(room.max_players - participants.length, 8) }).map((_, index) => (
                    <motion.div
                      key={`empty-${index}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: (participants.length + index) * 0.05 }}
                      className="flex items-center space-x-3 p-3 rounded-lg border-2 border-dashed border-gray-300"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-lg">+</span>
                      </div>
                      <div className="flex-1">
                        <span className="text-gray-400">Waiting for player...</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Game Controls */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Game Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Game Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Questions:</span>
                    <div className="font-medium">{room.settings?.time_per_question ? '10' : '5'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Time/Q:</span>
                    <div className="font-medium">{room.settings?.time_per_question || 30}s</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Late Join:</span>
                    <div className="font-medium">
                      {room.settings?.allow_late_join ? 'Yes' : 'No'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Multi-Modal:</span>
                    <div className="font-medium">
                      {room.settings?.enable_multi_modal ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>

                {room.settings?.enable_multi_modal && (
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-purple-800 mb-2">
                      Multi-Modal Features Enabled
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-purple-700">
                      <div className="flex items-center space-x-1">
                        <span>🎵</span>
                        <span>Voice</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>👋</span>
                        <span>Gestures</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>📱</span>
                        <span>Motion</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>👆</span>
                        <span>Touch</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Game Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Game Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isHost ? (
                  <div className="space-y-3">
                    <Button
                      onClick={handleStartGame}
                      disabled={!canStartGame}
                      className="w-full py-3 text-lg"
                      size="lg"
                    >
                      {isStarting ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Starting Game...</span>
                        </div>
                      ) : (
                        'Start Game'
                      )}
                    </Button>
                    
                    {!canStartGame && participants.length < 1 && (
                      <p className="text-sm text-gray-500 text-center">
                        Need at least 1 player to start
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-blue-800 font-medium mb-1">
                        Waiting for Host
                      </div>
                      <div className="text-blue-600 text-sm">
                        The host will start the game when ready
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={onLeaveRoom}
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                >
                  Leave Room
                </Button>
              </CardContent>
            </Card>

            {/* Room Info */}
            <Card>
              <CardHeader>
                <CardTitle>Share Room</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    Share this room code with friends:
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg text-center">
                    <code className="text-xl font-mono font-bold text-gray-800">
                      {room.code}
                    </code>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      navigator.clipboard.writeText(room.code)
                      // Could add a toast notification here
                    }}
                  >
                    Copy Room Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}