"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { GyroscopeVisualizer } from '@/components/game/GyroscopeVisualizer'
import { useMultiModalInput } from '@/hooks/useMultiModalInput'
import type { Question, QuestionOption } from '@/types'

interface QuestionDisplayProps {
  question: Question
  onSubmitAnswer: (answer: unknown) => void
  hasAnswered: boolean
  timeRemaining: number
}

export function QuestionDisplay({ 
  question, 
  onSubmitAnswer, 
  hasAnswered, 
  timeRemaining 
}: QuestionDisplayProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | boolean | null>(null)
  const multiModal = useMultiModalInput()

  const handleOptionSelect = (option: QuestionOption) => {
    if (hasAnswered) return
    
    setSelectedAnswer(option.text)
    onSubmitAnswer(option.text)
  }

  const handleTrueFalseSelect = (value: boolean) => {
    if (hasAnswered) return
    
    setSelectedAnswer(value)
    onSubmitAnswer(value)
  }

  const getProgressColor = () => {
    const percentage = (timeRemaining / question.time_limit) * 100
    if (percentage > 50) return 'bg-green-500'
    if (percentage > 25) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleOptionSelect(option)}
                disabled={hasAnswered}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                  selectedAnswer === option.text
                    ? `border-blue-500 bg-blue-50`
                    : hasAnswered
                    ? 'border-gray-200 bg-gray-100 cursor-not-allowed'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                } ${hasAnswered ? 'opacity-60' : ''}`}
                style={{ 
                  borderColor: hasAnswered && selectedAnswer === option.text ? option.color : undefined 
                }}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: option.color }}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="font-medium text-gray-900">{option.text}</span>
                </div>
              </motion.button>
            ))}
          </div>
        )

      case 'true_false':
        return (
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              onClick={() => handleTrueFalseSelect(true)}
              disabled={hasAnswered}
              className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                selectedAnswer === true
                  ? 'border-green-500 bg-green-50'
                  : hasAnswered
                  ? 'border-gray-200 bg-gray-100 cursor-not-allowed'
                  : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
              } ${hasAnswered ? 'opacity-60' : ''}`}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-xl">✓</span>
                </div>
                <span className="text-lg font-medium">True</span>
              </div>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              onClick={() => handleTrueFalseSelect(false)}
              disabled={hasAnswered}
              className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                selectedAnswer === false
                  ? 'border-red-500 bg-red-50'
                  : hasAnswered
                  ? 'border-gray-200 bg-gray-100 cursor-not-allowed'
                  : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
              } ${hasAnswered ? 'opacity-60' : ''}`}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-xl">✗</span>
                </div>
                <span className="text-lg font-medium">False</span>
              </div>
            </motion.button>
          </div>
        )

      case 'orientation_match':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Target Orientation:</h4>
              <div className="text-sm text-blue-700">
                {question.target_data?.gyroscope && (
                  <div className="grid grid-cols-3 gap-2">
                    <span>α: {question.target_data.gyroscope.alpha}°</span>
                    <span>β: {question.target_data.gyroscope.beta}°</span>
                    <span>γ: {question.target_data.gyroscope.gamma}°</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Gyroscope visualizer would go here */}
            <div className="bg-gray-100 p-8 rounded-lg text-center">
              <p className="text-gray-600 mb-4">Tilt your device to match the target orientation</p>
              {hasAnswered ? (
                <div className="text-green-600 font-medium">✓ Orientation submitted!</div>
              ) : (
                <div className="text-blue-600">Hold the target position...</div>
              )}
            </div>
            
            {question.hint && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="text-yellow-800 text-sm">
                  <strong>Hint:</strong> {question.hint}
                </div>
              </div>
            )}
          </div>
        )

      case 'voice_command':
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">🎤</span>
              </div>
              <p className="text-purple-900 font-medium mb-2">Voice Challenge</p>
              <p className="text-purple-700 text-sm">Speak clearly into your microphone</p>
            </div>

            {multiModal.voice.transcript && (
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-green-800 text-sm">
                  <strong>Detected:</strong> &ldquo;{multiModal.voice.transcript}&rdquo;
                </div>
                <div className="text-green-600 text-xs">
                  Confidence: {(multiModal.voice.confidence * 100).toFixed(1)}%
                </div>
              </div>
            )}

            {hasAnswered ? (
              <div className="text-center text-green-600 font-medium">✓ Voice input submitted!</div>
            ) : (
              <div className="text-center">
                <Button
                  onClick={multiModal.startVoice}
                  disabled={multiModal.voice.isListening}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {multiModal.voice.isListening ? 'Listening...' : 'Start Speaking'}
                </Button>
              </div>
            )}

            {question.hint && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="text-yellow-800 text-sm">
                  <strong>Hint:</strong> {question.hint}
                </div>
              </div>
            )}
          </div>
        )

      case 'gesture_recognition':
        return (
          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">👋</span>
              </div>
              <p className="text-orange-900 font-medium mb-2">Gesture Challenge</p>
              <p className="text-orange-700 text-sm">Make sure your camera can see your hands</p>
            </div>

            {multiModal.gesture.data && (
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-green-800 text-sm">
                  <strong>Detected:</strong> {multiModal.gesture.data.type}
                </div>
                <div className="text-green-600 text-xs">
                  Confidence: {(multiModal.gesture.data.confidence * 100).toFixed(1)}%
                </div>
              </div>
            )}

            {hasAnswered ? (
              <div className="text-center text-green-600 font-medium">✓ Gesture submitted!</div>
            ) : (
              <div className="text-center">
                <Button
                  onClick={multiModal.startGesture}
                  disabled={multiModal.gesture.isActive}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {multiModal.gesture.isActive ? 'Detecting...' : 'Start Camera'}
                </Button>
              </div>
            )}

            {question.hint && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="text-yellow-800 text-sm">
                  <strong>Hint:</strong> {question.hint}
                </div>
              </div>
            )}
          </div>
        )

      case 'multi_modal':
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">🎯</span>
              </div>
              <p className="text-gray-900 font-medium mb-2">Multi-Modal Challenge</p>
              <p className="text-gray-700 text-sm">Use multiple input methods simultaneously</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <span className="text-purple-600 text-xl">🎤</span>
                <div className="text-xs text-purple-700">Voice</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg text-center">
                <span className="text-orange-600 text-xl">👋</span>
                <div className="text-xs text-orange-700">Gesture</div>
              </div>
            </div>

            {hasAnswered ? (
              <div className="text-center text-green-600 font-medium">✓ Multi-modal input submitted!</div>
            ) : (
              <div className="text-center">
                <Button
                  onClick={multiModal.startAll}
                  disabled={multiModal.isAnyActive}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {multiModal.isAnyActive ? 'Active...' : 'Start All Inputs'}
                </Button>
              </div>
            )}

            {question.hint && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="text-yellow-800 text-sm">
                  <strong>Hint:</strong> {question.hint}
                </div>
              </div>
            )}
          </div>
        )

      default:
        return (
          <div className="text-center text-gray-500">
            Unsupported question type: {question.type}
          </div>
        )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Timer Progress */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span>Time Remaining</span>
              <span className={`font-bold ${timeRemaining <= 5 ? 'text-red-500' : 'text-blue-600'}`}>
                {timeRemaining}s
              </span>
            </div>
            <div className="relative">
              <Progress 
                value={(timeRemaining / question.time_limit) * 100} 
                className="h-3"
              />
              <div 
                className={`absolute top-0 left-0 h-3 rounded-full transition-all duration-1000 ${getProgressColor()}`}
                style={{ width: `${(timeRemaining / question.time_limit) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{question.title}</CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{question.points} pts</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                question.type === 'multiple_choice' ? 'bg-blue-100 text-blue-800' :
                question.type === 'true_false' ? 'bg-green-100 text-green-800' :
                question.type === 'orientation_match' ? 'bg-purple-100 text-purple-800' :
                question.type === 'voice_command' ? 'bg-pink-100 text-pink-800' :
                question.type === 'gesture_recognition' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {question.type.replace('_', ' ')}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <p className="text-gray-600 mb-1">{question.description}</p>
              <h3 className="text-lg font-medium text-gray-900">
                {question.question_text}
              </h3>
            </div>

            {renderQuestionContent()}

            {hasAnswered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-200 rounded-lg p-4 text-center"
              >
                <div className="text-green-600 font-medium">
                  ✓ Answer submitted! Waiting for other players...
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}