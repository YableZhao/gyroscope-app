"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { useRoom } from '@/hooks/useRoom'
import type { RoomSettings } from '@/types'

interface CreateRoomFormProps {
  onSuccess?: (room: unknown) => void
  onCancel?: () => void
}

export function CreateRoomForm({ onSuccess, onCancel }: CreateRoomFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    maxPlayers: 20
  })
  
  const [settings, setSettings] = useState<Partial<RoomSettings>>({
    allow_late_join: true,
    show_leaderboard: true,
    enable_multi_modal: true,
    time_per_question: 30
  })

  const { createRoom, isLoading, error, clearError } = useRoom()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    if (!formData.name.trim()) {
      return
    }

    const room = await createRoom({
      name: formData.name.trim(),
      maxPlayers: formData.maxPlayers,
      settings
    })

    if (room) {
      onSuccess?.(room)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (error) {
      clearError()
    }
  }

  const handleSettingChange = (key: keyof RoomSettings, value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Create Room</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Room Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Room Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter room name"
                disabled={isLoading}
                maxLength={50}
              />
            </div>

            {/* Max Players */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Max Players: {formData.maxPlayers}
              </label>
              <Slider
                value={[formData.maxPlayers]}
                onValueChange={(value) => setFormData(prev => ({ ...prev, maxPlayers: value[0] }))}
                min={2}
                max={50}
                step={1}
                className="w-full"
                disabled={isLoading}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>2</span>
                <span>50</span>
              </div>
            </div>

            {/* Room Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Room Settings</h3>
              
              {/* Allow Late Join */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">Allow Late Join</div>
                  <div className="text-xs text-gray-500">Players can join during gameplay</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allow_late_join}
                    onChange={(e) => handleSettingChange('allow_late_join', e.target.checked)}
                    className="sr-only peer"
                    disabled={isLoading}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Show Leaderboard */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">Show Leaderboard</div>
                  <div className="text-xs text-gray-500">Display player rankings</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.show_leaderboard}
                    onChange={(e) => handleSettingChange('show_leaderboard', e.target.checked)}
                    className="sr-only peer"
                    disabled={isLoading}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Enable Multi-Modal */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">Multi-Modal Input</div>
                  <div className="text-xs text-gray-500">Voice, gesture, and touch controls</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enable_multi_modal}
                    onChange={(e) => handleSettingChange('enable_multi_modal', e.target.checked)}
                    className="sr-only peer"
                    disabled={isLoading}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Time Per Question */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Time Per Question: {settings.time_per_question}s
                </label>
                <Slider
                  value={[settings.time_per_question || 30]}
                  onValueChange={(value) => handleSettingChange('time_per_question', value[0])}
                  min={10}
                  max={120}
                  step={5}
                  className="w-full"
                  disabled={isLoading}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>10s</span>
                  <span>120s</span>
                </div>
              </div>
            </div>

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
                disabled={isLoading || !formData.name.trim()}
                className="flex-1"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating...</span>
                  </div>
                ) : (
                  'Create Room'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}