"use client"

import React from 'react'
import { motion } from 'framer-motion'
import type { GyroscopeData, Position } from '@/types'

interface Dot {
  id: string
  username: string
  position: Position
  isActive: boolean
}

interface SensorBoardProps {
  dots: Dot[]
  className?: string
  size?: number
  showGrid?: boolean
  highlightActive?: boolean
}

export function SensorBoard({ 
  dots, 
  className = '',
  size = 400,
  showGrid = true,
  highlightActive = true
}: SensorBoardProps) {
  return (
    <div 
      className={`relative bg-blue-900 border border-gray-300 rounded-lg overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Grid lines */}
      {showGrid && (
        <>
          <div className="absolute top-1/2 left-0 w-full h-px bg-gray-400 opacity-50" />
          <div className="absolute top-0 left-1/2 w-px h-full bg-gray-400 opacity-50" />
          
          {/* Quarter lines */}
          <div className="absolute top-1/4 left-0 w-full h-px bg-gray-400 opacity-25" />
          <div className="absolute top-3/4 left-0 w-full h-px bg-gray-400 opacity-25" />
          <div className="absolute top-0 left-1/4 w-px h-full bg-gray-400 opacity-25" />
          <div className="absolute top-0 left-3/4 w-px h-full bg-gray-400 opacity-25" />
        </>
      )}
      
      {/* Center marker */}
      <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 opacity-60" />
      
      {/* Dots */}
      {dots.map((dot) => (
        <DotComponent
          key={dot.id}
          dot={dot}
          boardSize={size}
          highlightActive={highlightActive}
        />
      ))}
      
      {/* Legends */}
      <div className="absolute bottom-2 left-2 text-xs text-white bg-black bg-opacity-70 px-2 py-1 rounded">
        {dots.length} player{dots.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

interface DotComponentProps {
  dot: Dot
  boardSize: number
  highlightActive: boolean
}

function DotComponent({ dot, boardSize, highlightActive }: DotComponentProps) {
  const { position, username, isActive } = dot
  
  // Convert position to pixel coordinates
  const x = (position.x / 360) * boardSize
  const y = (position.y / 360) * boardSize
  
  // Ensure dot stays within bounds
  const clampedX = Math.max(4, Math.min(boardSize - 4, x))
  const clampedY = Math.max(4, Math.min(boardSize - 4, y))

  return (
    <motion.div
      className="absolute z-10"
      style={{
        left: clampedX - 4,
        top: clampedY - 4,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        boxShadow: isActive && highlightActive ? '0 0 20px rgba(255, 203, 5, 0.8)' : 'none'
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Main dot */}
      <motion.div 
        className={`w-3 h-3 rounded-full shadow-lg ${
          isActive && highlightActive ? 'bg-yellow-400' : 'bg-blue-400'
        }`}
        style={{ 
          transform: `rotate(${position.alpha + 225}deg)` 
        }}
        animate={{
          scale: isActive && highlightActive ? [1, 1.2, 1] : 1
        }}
        transition={{
          duration: 1,
          repeat: isActive && highlightActive ? Infinity : 0,
          repeatType: "reverse"
        }}
      >
        {/* Direction indicator */}
        <div className="absolute top-0 left-1/2 w-0.5 h-1 bg-white transform -translate-x-1/2 -translate-y-full" />
      </motion.div>
      
      {/* Username label */}
      <motion.div 
        className="absolute top-4 left-1/2 transform -translate-x-1/2 text-xs text-white bg-black bg-opacity-70 px-1 rounded whitespace-nowrap pointer-events-none"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {username}
      </motion.div>
      
      {/* Coordinates tooltip (on hover) */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-white bg-gray-800 px-1 rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        ({position.x.toFixed(0)}, {position.y.toFixed(0)}, {position.alpha.toFixed(0)}°)
      </div>
    </motion.div>
  )
}