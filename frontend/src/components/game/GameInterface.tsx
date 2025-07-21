"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { QuestionDisplay } from '@/components/game/QuestionDisplay'
import { MultiModalPanel } from '@/components/game/MultiModalPanel'
import { Leaderboard } from '@/components/game/Leaderboard'
import { useGameEngine } from '@/hooks/useGameEngine'
import { useRealtime } from '@/contexts/RealtimeContext'
import type { GameEngine, User, QuestionType } from '@/types'

interface GameInterfaceProps {
  gameEngine: GameEngine
  user: User
  isHost: boolean
  onLeaveGame: () => void
  realtimeConnected?: boolean
}

export function GameInterface({ gameEngine, user, isHost, onLeaveGame, realtimeConnected = false }: GameInterfaceProps) {
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [hasAnswered, setHasAnswered] = useState(false)
  
  const {
    currentQuestion,
    timer,
    submitAnswer,
    nextQuestion,
    endGame,
    isLoading
  } = useGameEngine(gameEngine.session.id)
  
  const { sendAnswer, sendGameAction } = useRealtime()

  // Check if current user has answered
  useEffect(() => {
    if (gameEngine.current_round) {
      const userResponse = gameEngine.current_round.responses.find(r => r.user_id === user.id)
      setHasAnswered(!!userResponse)
    }
  }, [gameEngine.current_round, user.id])

  // Show leaderboard after each question
  useEffect(() => {
    if (gameEngine.status === 'results') {
      setShowLeaderboard(true)
      
      // Auto-hide leaderboard after 5 seconds for host
      if (isHost) {
        const timeout = setTimeout(() => {
          setShowLeaderboard(false)
          handleNextQuestion()
        }, 5000)
        
        return () => clearTimeout(timeout)
      }
    }
  }, [gameEngine.status, isHost])

  const handleSubmitAnswer = async (answer: unknown) => {
    if (hasAnswered || !currentQuestion) return
    
    // Use realtime WebSocket if connected, otherwise fallback to HTTP API
    if (realtimeConnected) {
      sendAnswer(currentQuestion.id, answer)
      setHasAnswered(true)
    } else {
      const success = await submitAnswer(answer)
      if (success) {
        setHasAnswered(true)
      }
    }
  }

  const handleNextQuestion = async () => {
    if (!isHost) return
    
    setShowLeaderboard(false)
    setHasAnswered(false)
    
    // Use realtime WebSocket if connected, otherwise fallback to HTTP API
    if (realtimeConnected) {
      sendGameAction('next_question')
    } else {
      await nextQuestion()
    }
  }

  const handleEndGame = async () => {
    if (!isHost) return
    
    // Use realtime WebSocket if connected, otherwise fallback to HTTP API
    if (realtimeConnected) {
      sendGameAction('end_game')
    } else {
      await endGame()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'countdown': return 'bg-yellow-500'
      case 'question': return 'bg-green-500'
      case 'results': return 'bg-blue-500'
      case 'leaderboard': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'countdown': return 'Get Ready!'
      case 'question': return 'Answer Now!'
      case 'results': return 'Results'
      case 'leaderboard': return 'Leaderboard'
      case 'finished': return 'Game Finished'
      default: return status
    }
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Game Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Multi-Modal Quiz
            </h1>
            <Badge className={`${getStatusColor(gameEngine.status)} text-white`}>
              {getStatusText(gameEngine.status)}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Question {gameEngine.session.current_round}/{gameEngine.session.total_rounds}
            </div>
            <Button onClick={onLeaveGame} variant="outline" size="sm">
              Leave Game
            </Button>
          </div>
        </motion.div>

        {/* Game Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Game Progress</span>
                <span>{gameEngine.session.current_round}/{gameEngine.session.total_rounds} questions</span>
              </div>
              <Progress 
                value={(gameEngine.session.current_round / gameEngine.session.total_rounds) * 100} 
                className="h-2"
              />
              
              {/* Timer */}
              {timer.is_running && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Time Remaining:</span>
                  <span className={`text-lg font-bold ${
                    timer.remaining_time <= 5 ? 'text-red-500' : 'text-blue-600'
                  }`}>
                    {timer.remaining_time}s
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <AnimatePresence mode="wait">
          {/* Countdown State */}
          {gameEngine.status === 'countdown' && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center py-20"
            >
              <Card className="max-w-md mx-auto">
                <CardContent className="pt-12 pb-12">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="text-6xl font-bold text-blue-600 mb-4"
                  >
                    {Math.ceil(timer.remaining_time) || 3}
                  </motion.div>
                  <p className="text-xl text-gray-600">Get ready for the next question!</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Question State */}
          {gameEngine.status === 'question' && currentQuestion && (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Main Question Area */}
              <div className="lg:col-span-2 space-y-6">
                <QuestionDisplay
                  question={currentQuestion}
                  onSubmitAnswer={handleSubmitAnswer}
                  hasAnswered={hasAnswered}
                  timeRemaining={timer.remaining_time}
                />
              </div>

              {/* Multi-Modal Panel */}
              <div className="space-y-6">
                {currentQuestion.type !== 'multiple_choice' && currentQuestion.type !== 'true_false' && (
                  <MultiModalPanel
                    onSensorData={(data) => {
                      if (!hasAnswered) {
                        handleSubmitAnswer(data)
                      }
                    }}
                  />
                )}
                
                {/* Mini Leaderboard */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current Standings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {gameEngine.scores.slice(0, 5).map((score, index) => (
                        <div
                          key={score.user_id}
                          className={`flex items-center justify-between p-2 rounded ${
                            score.user_id === user.id ? 'bg-blue-50' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center">
                              {index + 1}
                            </span>
                            <span className="text-sm font-medium">{score.user.username}</span>
                          </div>
                          <span className="text-sm font-bold">{score.score}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Results/Leaderboard State */}
          {(gameEngine.status === 'results' || showLeaderboard) && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Leaderboard
                scores={gameEngine.scores}
                currentUser={user}
                showQuestion={currentQuestion}
                onNext={isHost ? handleNextQuestion : undefined}
                onEndGame={isHost ? handleEndGame : undefined}
                isLoading={isLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Host Controls */}
        {isHost && gameEngine.status === 'question' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-4 right-4"
          >
            <Card className="bg-white shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Button onClick={handleNextQuestion} size="sm">
                    Skip Question
                  </Button>
                  <Button onClick={handleEndGame} variant="destructive" size="sm">
                    End Game
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}