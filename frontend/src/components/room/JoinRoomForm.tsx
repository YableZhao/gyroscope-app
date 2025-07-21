"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRoom } from '@/hooks/useRoom'

interface JoinRoomFormProps {
  onSuccess?: (room: unknown) => void
  onCancel?: () => void
}

export function JoinRoomForm({ onSuccess, onCancel }: JoinRoomFormProps) {
  const [roomCode, setRoomCode] = useState('')
  const { joinRoom, isLoading, error, clearError } = useRoom()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    if (!roomCode.trim()) {
      return
    }

    const room = await joinRoom({ code: roomCode.trim().toUpperCase() })
    if (room) {
      onSuccess?.(room)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setRoomCode(value)
    
    if (error) {
      clearError()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Join Room</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Room Code Input */}
            <div className="space-y-2">
              <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700">
                Room Code
              </label>
              <input
                id="roomCode"
                type="text"
                value={roomCode}
                onChange={handleInputChange}
                className="w-full px-4 py-3 text-center text-2xl font-mono font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent tracking-wider uppercase"
                placeholder="ABC123"
                disabled={isLoading}
                maxLength={6}
                autoComplete="off"
              />
              <p className="text-xs text-gray-500 text-center">
                Enter the 6-character room code
              </p>
            </div>

            {/* Room Code Display */}
            {roomCode && (
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-600 mb-1">Room Code:</div>
                <div className="text-lg font-mono font-bold text-gray-900 tracking-wider">
                  {roomCode.split('').map((char, index) => (
                    <span key={index} className="mx-1">
                      {char || '_'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
              
              <Button
                type="submit"
                disabled={isLoading || roomCode.length !== 6}
                className="flex-1"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Joining...</span>
                  </div>
                ) : (
                  'Join Room'
                )}
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center">
              <div className="text-sm text-gray-600">
                Don&apos;t have a room code?{' '}
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                  disabled={isLoading}
                >
                  Create a room instead
                </button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}