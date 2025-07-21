"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { CreateRoomForm } from '@/components/room/CreateRoomForm'
import { JoinRoomForm } from '@/components/room/JoinRoomForm'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

type LobbyView = 'auth' | 'login' | 'register' | 'main' | 'create-room' | 'join-room'

export default function LobbyPage() {
  const [view, setView] = useState<LobbyView>('auth')
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()

  // Update view based on authentication state
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        setView('main')
      } else {
        setView('auth')
      }
    }
  }, [user, isLoading])

  const handleAuthSuccess = () => {
    setView('main')
  }

  const handleRoomSuccess = (room: unknown) => {
    // Navigate to room page
    const roomCode = (room as { code?: string })?.code || 'unknown'
    router.push(`/room/${roomCode}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            MultiModal Gaming Platform
          </h1>
          <p className="text-xl text-gray-600">
            Next-generation interactive gaming with voice, gesture, and motion controls
          </p>
          {user && (
            <div className="mt-4 flex items-center justify-center space-x-4">
              <span className="text-gray-700">Welcome, {user.username}!</span>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          )}
        </motion.div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {/* Welcome/Auth Selection */}
          {view === 'auth' && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-center">Get Started</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => setView('login')}
                    className="w-full"
                    size="lg"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => setView('register')}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Create Account
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Login Form */}
          {view === 'login' && (
            <LoginForm
              key="login"
              onSuccess={handleAuthSuccess}
              onSwitchToRegister={() => setView('register')}
            />
          )}

          {/* Register Form */}
          {view === 'register' && (
            <RegisterForm
              key="register"
              onSuccess={handleAuthSuccess}
              onSwitchToLogin={() => setView('login')}
            />
          )}

          {/* Main Lobby */}
          {view === 'main' && (
            <motion.div
              key="main"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
            >
              {/* Create Room */}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎮</span>
                  </div>
                  <CardTitle className="text-xl">Create Room</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 mb-6">
                    Start a new game room and invite friends to join your multi-modal gaming experience.
                  </p>
                  <Button
                    onClick={() => setView('create-room')}
                    className="w-full"
                    size="lg"
                  >
                    Create New Room
                  </Button>
                </CardContent>
              </Card>

              {/* Join Room */}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <CardTitle className="text-xl">Join Room</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 mb-6">
                    Enter a room code to join an existing game and compete with other players.
                  </p>
                  <Button
                    onClick={() => setView('join-room')}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Join Existing Room
                  </Button>
                </CardContent>
              </Card>

              {/* Features Overview */}
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-center">Platform Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-xl">🎵</span>
                        </div>
                        <h4 className="font-medium mb-2">Voice Control</h4>
                        <p className="text-sm text-gray-600">Speech recognition for voice commands</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-xl">👋</span>
                        </div>
                        <h4 className="font-medium mb-2">Gesture Detection</h4>
                        <p className="text-sm text-gray-600">Camera-based hand tracking</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-xl">📱</span>
                        </div>
                        <h4 className="font-medium mb-2">Motion Sensing</h4>
                        <p className="text-sm text-gray-600">Device orientation and gyroscope</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-xl">👆</span>
                        </div>
                        <h4 className="font-medium mb-2">Touch Input</h4>
                        <p className="text-sm text-gray-600">Multi-touch with pressure sensitivity</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Create Room Form */}
          {view === 'create-room' && (
            <CreateRoomForm
              key="create-room"
              onSuccess={handleRoomSuccess}
              onCancel={() => setView('main')}
            />
          )}

          {/* Join Room Form */}
          {view === 'join-room' && (
            <JoinRoomForm
              key="join-room"
              onSuccess={handleRoomSuccess}
              onCancel={() => setView('main')}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}