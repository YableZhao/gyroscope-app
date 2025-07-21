"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { PlayerScore, User, Question } from '@/types'

interface LeaderboardProps {
  scores: PlayerScore[]
  currentUser: User
  showQuestion?: Question | null
  onNext?: () => void
  onEndGame?: () => void
  isLoading?: boolean
}

export function Leaderboard({
  scores,
  currentUser,
  showQuestion,
  onNext,
  onEndGame,
  isLoading
}: LeaderboardProps) {
  const sortedScores = [...scores].sort((a, b) => b.score - a.score)
  const currentUserScore = sortedScores.find(s => s.user_id === currentUser.id)

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-yellow-600'
      case 2: return 'from-gray-300 to-gray-500'
      case 3: return 'from-orange-400 to-orange-600'
      default: return 'from-blue-400 to-blue-600'
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return '🏅'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Results Header */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {showQuestion ? 'Question Results' : 'Final Leaderboard'}
          </CardTitle>
          {showQuestion && (
            <div className="space-y-2">
              <p className="text-gray-600">{showQuestion.question_text}</p>
              {showQuestion.correct_answer && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-green-800 font-medium">
                    Correct Answer: {String(showQuestion.correct_answer)}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Top 3 Podium */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {sortedScores.slice(0, 3).map((score, index) => (
              <motion.div
                key={score.user_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative overflow-hidden rounded-lg p-6 text-center text-white bg-gradient-to-br ${getRankColor(index + 1)} ${
                  score.user_id === currentUser.id ? 'ring-4 ring-white' : ''
                }`}
              >
                <div className="text-4xl mb-2">{getRankIcon(index + 1)}</div>
                <div className="font-bold text-lg mb-1">{score.user.username}</div>
                <div className="text-2xl font-bold mb-2">{score.score} pts</div>
                <div className="text-sm opacity-90">
                  {score.accuracy.toFixed(1)}% accuracy
                </div>
                {score.user_id === currentUser.id && (
                  <Badge className="absolute top-2 right-2 bg-white text-gray-900">
                    You
                  </Badge>
                )}
              </motion.div>
            ))}
          </div>

          {/* Full Rankings */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 mb-4">All Players</h4>
            {sortedScores.map((score, index) => (
              <motion.div
                key={score.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  score.user_id === currentUser.id
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br ${getRankColor(index + 1)}`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{score.user.username}</span>
                      {score.user_id === currentUser.id && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {score.accuracy.toFixed(1)}% accuracy
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-lg">{score.score} pts</div>
                  <div className="text-sm text-gray-500">
                    Rank #{index + 1}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Personal Stats */}
      {currentUserScore && (
        <Card>
          <CardHeader>
            <CardTitle>Your Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">#{currentUserScore.rank}</div>
                <div className="text-sm text-gray-600">Your Rank</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{currentUserScore.score}</div>
                <div className="text-sm text-gray-600">Total Points</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {currentUserScore.accuracy.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {sortedScores.length > currentUserScore.rank 
                    ? `+${sortedScores.length - currentUserScore.rank}`
                    : '🎯'
                  }
                </div>
                <div className="text-sm text-gray-600">
                  {sortedScores.length > currentUserScore.rank ? 'Behind Leader' : 'Top Player!'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Host Controls */}
      {(onNext || onEndGame) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center space-x-4">
              {onNext && (
                <Button
                  onClick={onNext}
                  disabled={isLoading}
                  size="lg"
                  className="px-8"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    'Next Question'
                  )}
                </Button>
              )}
              
              {onEndGame && (
                <Button
                  onClick={onEndGame}
                  disabled={isLoading}
                  variant="destructive"
                  size="lg"
                  className="px-8"
                >
                  End Game
                </Button>
              )}
            </div>
            
            {!isLoading && (
              <p className="text-center text-sm text-gray-500 mt-3">
                Host controls - other players are waiting
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}