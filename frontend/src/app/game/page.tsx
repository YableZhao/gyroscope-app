"use client"

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { GyroscopeVisualizer } from '@/components/game/GyroscopeVisualizer'
import { SensorBoard } from '@/components/game/SensorBoard'
import { PermissionButton } from '@/components/game/PermissionButton'
import { MultiModalPanel } from '@/components/game/MultiModalPanel'
import { useOrientationPermission } from '@/hooks/useOrientationPermission'
import { useGyroscope } from '@/hooks/useGyroscope'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useGameStore } from '@/store/gameStore'
import type { Position } from '@/types'

export default function GamePage() {
  const { permission, requestPermission, isLoading } = useOrientationPermission()
  const { 
    data: gyroData, 
    rawData, 
    setSmoothingFactor, 
    smoothingFactor, 
    reset, 
    isActive 
  } = useGyroscope({ 
    permission,
    onDataChange: (data) => {
      // Send sensor data via WebSocket
      sendSensorData({
        gyroscope: {
          alpha: data.alpha,
          beta: data.beta,
          gamma: data.gamma
        }
      })
    }
  })

  const [userId] = useState(() => `user_${Math.random().toString(36).substr(2, 9)}`)
  const [roomId] = useState(() => 'DEMO01')
  const [username] = useState(() => `Player_${Math.random().toString(36).substr(2, 4)}`)

  const { sendSensorData, isConnected, connect } = useWebSocket({
    userId,
    roomId,
    username,
    autoConnect: false
  })

  const { currentUser, setCurrentUser } = useGameStore()

  // Mock dots for demonstration
  const [mockDots, setMockDots] = useState(() => [
    {
      id: userId,
      username: username,
      position: { x: 180, y: 180, alpha: 0 },
      isActive: true
    }
  ])

  // Update current user position
  useEffect(() => {
    if (isActive) {
      const position: Position = {
        x: ((gyroData.gamma + 180) % 360),
        y: ((gyroData.beta + 180) % 360),
        alpha: gyroData.alpha
      }

      setMockDots(prev => prev.map(dot => 
        dot.id === userId 
          ? { ...dot, position, isActive: true }
          : dot
      ))
    }
  }, [gyroData, userId, isActive])

  // Connect to WebSocket when permission is granted
  useEffect(() => {
    if (permission === 'granted' && !isConnected) {
      connect()
    }
  }, [permission, isConnected, connect])

  // Mock current user
  useEffect(() => {
    if (!currentUser) {
      setCurrentUser({
        id: userId,
        email: `${username.toLowerCase()}@example.com`,
        username: username,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  }, [currentUser, setCurrentUser, userId, username])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            MultiModal Interactive Platform
          </h1>
          <p className="text-lg text-gray-600">
            Experience real-time multi-sensor gameplay
          </p>
          
          {/* Connection status */}
          <div className="flex items-center justify-center space-x-4 mt-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <div className="text-sm text-gray-600">
              Room: {roomId} | User: {username}
            </div>
          </div>
        </motion.div>

        {/* Permission Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Device Permissions</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <PermissionButton
                permission={permission}
                isLoading={isLoading}
                onRequestPermission={requestPermission}
              />
            </CardContent>
          </Card>
        </motion.div>

        {permission === 'granted' && (
          <>
            {/* Main Game Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Multi-User Sensor Board */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Real-time Multi-User Board</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <SensorBoard
                      dots={mockDots}
                      size={400}
                      showGrid={true}
                      highlightActive={true}
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* 3D Visualization */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>3D Orientation Visualizer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GyroscopeVisualizer
                      gyroData={gyroData}
                      className="w-full h-96"
                      showAxes={true}
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Multi-Modal Input Panel */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <MultiModalPanel
                  className="h-fit"
                  onSensorData={(data) => {
                    // Send multi-modal sensor data via WebSocket
                    sendSensorData(data)
                  }}
                />
              </motion.div>
            </div>

            {/* Control Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Sensor Controls</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Alpha Control */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Alpha: {Math.round(gyroData.alpha)}°
                      </label>
                      <Slider
                        value={[rawData.alpha]}
                        onValueChange={(value) => {
                          // In a real game, this would trigger manual control
                          console.log('Manual alpha adjustment:', value[0])
                        }}
                        max={360}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Beta Control */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Beta: {Math.round(gyroData.beta)}°
                      </label>
                      <Slider
                        value={[rawData.beta + 180]}
                        onValueChange={(value) => {
                          console.log('Manual beta adjustment:', value[0] - 180)
                        }}
                        max={360}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Gamma Control */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Gamma: {Math.round(gyroData.gamma)}°
                      </label>
                      <Slider
                        value={[rawData.gamma + 90]}
                        onValueChange={(value) => {
                          console.log('Manual gamma adjustment:', value[0] - 90)
                        }}
                        max={180}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Smoothing Control */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Smoothing: {smoothingFactor}
                      </label>
                      <Slider
                        value={[smoothingFactor]}
                        onValueChange={(value) => setSmoothingFactor(value[0])}
                        max={50}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center space-x-4 mt-6">
                    <Button onClick={reset} variant="outline">
                      Reset Sensors
                    </Button>
                    <Button 
                      onClick={() => console.log('Calibrate sensors')}
                      variant="default"
                    >
                      Calibrate
                    </Button>
                    <Button 
                      onClick={() => console.log('Start game')}
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Start Game
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Stats Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Real-time Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-blue-600">
                        {isActive ? '✓' : '✗'}
                      </div>
                      <div className="text-sm text-gray-600">Active</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-green-600">
                        {mockDots.length}
                      </div>
                      <div className="text-sm text-gray-600">Players</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-purple-600">
                        {isConnected ? 'ON' : 'OFF'}
                      </div>
                      <div className="text-sm text-gray-600">WebSocket</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-orange-600">
                        {Math.round(gyroData.timestamp % 1000)}ms
                      </div>
                      <div className="text-sm text-gray-600">Latency</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}