"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import type { GestureData } from '@/types'

interface UseGestureDetectionReturn {
  isActive: boolean
  isSupported: boolean
  gestureData: GestureData | null
  startDetection: () => Promise<void>
  stopDetection: () => void
  error: string | null
}

export function useGestureDetection(): UseGestureDetectionReturn {
  const [isActive, setIsActive] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [gestureData, setGestureData] = useState<GestureData | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    // Check if camera and required APIs are supported
    if (typeof window !== 'undefined' && 
        navigator.mediaDevices && 
        typeof navigator.mediaDevices.getUserMedia === 'function') {
      setIsSupported(true)
    }

    return () => {
      stopDetection()
    }
  }, [])

  const startDetection = useCallback(async () => {
    if (!isSupported) {
      setError('Camera access is not supported')
      return
    }

    try {
      setError(null)
      
      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })

      streamRef.current = stream
      
      // Create video element if it doesn't exist
      if (!videoRef.current) {
        videoRef.current = document.createElement('video')
        videoRef.current.playsInline = true
        videoRef.current.muted = true
      }

      videoRef.current.srcObject = stream
      await videoRef.current.play()

      setIsActive(true)
      startGestureDetection()

    } catch (err) {
      setError('Failed to access camera: ' + (err instanceof Error ? err.message : 'Unknown error'))
      console.error('Camera access error:', err)
    }
  }, [isSupported])

  const stopDetection = useCallback(() => {
    setIsActive(false)
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setGestureData(null)
  }, [])

  const startGestureDetection = useCallback(() => {
    if (!videoRef.current || !isActive) return

    const detectGestures = () => {
      if (!videoRef.current || !isActive) return

      // Simple gesture detection based on video analysis
      // In a real implementation, this would use MediaPipe or similar
      const mockGestureDetection = () => {
        const gestures = ['wave', 'thumbs_up', 'peace', 'point', 'fist']
        const randomGesture = gestures[Math.floor(Math.random() * gestures.length)]
        const confidence = 0.7 + Math.random() * 0.3 // 70-100% confidence
        
        return {
          type: randomGesture,
          confidence,
          landmarks: {
            // Mock hand landmarks - in real implementation would come from MediaPipe
            wrist: { x: 0.5, y: 0.5 },
            thumb_tip: { x: 0.6, y: 0.4 },
            index_tip: { x: 0.7, y: 0.3 },
            middle_tip: { x: 0.75, y: 0.25 },
            ring_tip: { x: 0.8, y: 0.3 },
            pinky_tip: { x: 0.85, y: 0.35 }
          }
        }
      }

      // Update gesture data periodically
      if (Math.random() > 0.95) { // 5% chance each frame to detect a gesture
        setGestureData(mockGestureDetection())
      }

      rafRef.current = requestAnimationFrame(detectGestures)
    }

    detectGestures()
  }, [isActive])

  return {
    isActive,
    isSupported,
    gestureData,
    startDetection,
    stopDetection,
    error
  }
}

// Gesture data utility
export function createGestureData(type: string, confidence: number, landmarks?: Record<string, unknown>): GestureData {
  return {
    type,
    confidence,
    landmarks
  }
}