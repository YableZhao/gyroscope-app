"use client"

import React from 'react'
import { useMultiModalInput } from '@/hooks/useMultiModalInput'
import { motion } from 'framer-motion'

import type { SensorData } from '@/types'

interface MultiModalPanelProps {
  className?: string
  onSensorData?: (data: SensorData) => void
}

export function MultiModalPanel({ className = '', onSensorData }: MultiModalPanelProps) {
  const multiModal = useMultiModalInput()

  // Send sensor data to parent when it changes
  React.useEffect(() => {
    if (onSensorData) {
      onSensorData(multiModal.sensorData)
    }
  }, [multiModal.sensorData, onSensorData])

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Multi-Modal Input</h3>
          <div className="flex gap-2">
            <button
              onClick={multiModal.startAll}
              disabled={multiModal.isAnyActive}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Start All
            </button>
            <button
              onClick={multiModal.stopAll}
              disabled={!multiModal.isAnyActive}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              Stop All
            </button>
          </div>
        </div>

        {/* Error Display */}
        {multiModal.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-red-800 mb-1">Errors:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {multiModal.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Gyroscope Panel */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              📱 Gyroscope
              {multiModal.gyroscope.isActive && (
                <motion.div
                  className="w-2 h-2 bg-green-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              )}
            </h4>
            <div className="flex gap-2">
              <button
                onClick={multiModal.startGyroscope}
                disabled={multiModal.gyroscope.isActive}
                className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
              >
                Start
              </button>
              <button
                onClick={multiModal.stopGyroscope}
                disabled={!multiModal.gyroscope.isActive}
                className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
              >
                Stop
              </button>
            </div>
          </div>
          {multiModal.gyroscope.data ? (
            <div className="text-sm text-gray-600 grid grid-cols-3 gap-2">
              <div>α: {multiModal.gyroscope.data.alpha.toFixed(1)}°</div>
              <div>β: {multiModal.gyroscope.data.beta.toFixed(1)}°</div>
              <div>γ: {multiModal.gyroscope.data.gamma.toFixed(1)}°</div>
            </div>
          ) : (
            <div className="text-sm text-gray-400">No data</div>
          )}
        </div>

        {/* Voice Panel */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              🎤 Voice Recognition
              {multiModal.voice.isListening && (
                <motion.div
                  className="w-2 h-2 bg-red-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                />
              )}
            </h4>
            <div className="flex gap-2">
              <button
                onClick={multiModal.startVoice}
                disabled={multiModal.voice.isListening || !multiModal.voice.isSupported}
                className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
              >
                Start
              </button>
              <button
                onClick={multiModal.stopVoice}
                disabled={!multiModal.voice.isListening}
                className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
              >
                Stop
              </button>
            </div>
          </div>
          {multiModal.voice.isSupported ? (
            <div className="space-y-2">
              {multiModal.voice.transcript ? (
                <div className="text-sm bg-gray-50 p-2 rounded">
                  <div className="font-medium">&ldquo;{multiModal.voice.transcript}&rdquo;</div>
                  <div className="text-gray-500 text-xs">
                    Confidence: {(multiModal.voice.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  {multiModal.voice.isListening ? 'Listening...' : 'No speech detected'}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-400">Not supported</div>
          )}
        </div>

        {/* Gesture Panel */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              👋 Gesture Detection
              {multiModal.gesture.isActive && (
                <motion.div
                  className="w-2 h-2 bg-purple-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              )}
            </h4>
            <div className="flex gap-2">
              <button
                onClick={multiModal.startGesture}
                disabled={multiModal.gesture.isActive || !multiModal.gesture.isSupported}
                className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
              >
                Start
              </button>
              <button
                onClick={multiModal.stopGesture}
                disabled={!multiModal.gesture.isActive}
                className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
              >
                Stop
              </button>
            </div>
          </div>
          {multiModal.gesture.isSupported ? (
            <div className="space-y-2">
              {multiModal.gesture.data ? (
                <div className="text-sm bg-gray-50 p-2 rounded">
                  <div className="font-medium capitalize">{multiModal.gesture.data.type}</div>
                  <div className="text-gray-500 text-xs">
                    Confidence: {(multiModal.gesture.data.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  {multiModal.gesture.isActive ? 'Detecting gestures...' : 'No gesture detected'}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-400">Camera not supported</div>
          )}
        </div>

        {/* Touch Panel */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              👆 Touch Input
              {multiModal.touch.isActive && (
                <motion.div
                  className="w-2 h-2 bg-orange-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              )}
            </h4>
            <div className="flex gap-2">
              <button
                onClick={multiModal.startTouch}
                disabled={multiModal.touch.isActive}
                className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
              >
                Start
              </button>
              <button
                onClick={multiModal.stopTouch}
                disabled={!multiModal.touch.isActive}
                className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
              >
                Stop
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {multiModal.touch.data ? (
              <div className="text-sm bg-gray-50 p-2 rounded">
                <div className="grid grid-cols-2 gap-2">
                  <div>X: {(multiModal.touch.data.x * 100).toFixed(1)}%</div>
                  <div>Y: {(multiModal.touch.data.y * 100).toFixed(1)}%</div>
                </div>
                <div className="text-gray-500 text-xs">
                  Pressure: {((multiModal.touch.data.pressure || 0) * 100).toFixed(1)}%
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400">
                {multiModal.touch.isActive ? 'Touch the screen...' : 'No touch input'}
              </div>
            )}
            {multiModal.touch.history.length > 0 && (
              <div className="text-xs text-gray-500">
                History: {multiModal.touch.history.length} points
              </div>
            )}
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={multiModal.resetAll}
          className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Reset All Data
        </button>
      </div>
    </div>
  )
}