"use client"

import { useState, useCallback, useEffect } from 'react'
import { useGyroscope } from './useGyroscope'
import { useSpeechRecognition } from './useSpeechRecognition'
import { useGestureDetection } from './useGestureDetection'
import { useTouch } from './useTouch'
import type { SensorData, GyroscopeData, VoiceData, GestureData, TouchData } from '@/types'

interface UseMultiModalInputReturn {
  // Current sensor data
  sensorData: SensorData
  
  // Individual sensor states
  gyroscope: {
    isActive: boolean
    data: GyroscopeData | null
    hasPermission: boolean
  }
  
  voice: {
    isListening: boolean
    isSupported: boolean
    transcript: string
    confidence: number
  }
  
  gesture: {
    isActive: boolean
    isSupported: boolean
    data: GestureData | null
  }
  
  touch: {
    isActive: boolean
    data: TouchData | null
    history: TouchData[]
  }
  
  // Control methods
  startAll: () => Promise<void>
  stopAll: () => void
  startGyroscope: () => Promise<void>
  stopGyroscope: () => void
  startVoice: () => void
  stopVoice: () => void
  startGesture: () => Promise<void>
  stopGesture: () => void
  startTouch: () => void
  stopTouch: () => void
  
  // Utility methods
  resetAll: () => void
  getCurrentSensorData: () => SensorData
  
  // State
  isAnyActive: boolean
  errors: string[]
}

export function useMultiModalInput(touchElement?: HTMLElement | null): UseMultiModalInputReturn {
  const [errors, setErrors] = useState<string[]>([])
  
  // Initialize individual sensor hooks
  const gyroscopeHook = useGyroscope({ permission: 'default' })
  const voiceHook = useSpeechRecognition()
  const gestureHook = useGestureDetection()
  const touchHook = useTouch(touchElement)

  // Aggregate sensor data
  const sensorData: SensorData = {
    gyroscope: gyroscopeHook.data,
    voice: voiceHook.transcript ? {
      text: voiceHook.transcript,
      confidence: voiceHook.confidence,
      language: 'en-US',
      duration: 0
    } : undefined,
    gesture: gestureHook.gestureData || undefined,
    touch: touchHook.touchData || undefined
  }

  // Calculate if any sensor is active
  const isAnyActive = gyroscopeHook.isActive || 
                     voiceHook.isListening || 
                     gestureHook.isActive || 
                     touchHook.isActive

  // Error handling
  useEffect(() => {
    const currentErrors: string[] = []
    
    if (voiceHook.error) currentErrors.push(`Voice: ${voiceHook.error}`)
    if (gestureHook.error) currentErrors.push(`Gesture: ${gestureHook.error}`)
    
    setErrors(currentErrors)
  }, [voiceHook.error, gestureHook.error])

  // Control methods
  const startGyroscope = useCallback(async () => {
    try {
      // For now, just start - permission handling is simplified
      console.log('Starting gyroscope...')
    } catch (error) {
      setErrors(prev => [...prev, `Gyroscope: ${error instanceof Error ? error.message : 'Unknown error'}`])
    }
  }, [])

  const stopGyroscope = useCallback(() => {
    console.log('Stopping gyroscope...')
  }, [])

  const startVoice = useCallback(() => {
    if (!voiceHook.isSupported) {
      setErrors(prev => [...prev, 'Voice: Speech recognition not supported'])
      return
    }
    voiceHook.startListening()
  }, [voiceHook])

  const stopVoice = useCallback(() => {
    voiceHook.stopListening()
  }, [voiceHook])

  const startGesture = useCallback(async () => {
    if (!gestureHook.isSupported) {
      setErrors(prev => [...prev, 'Gesture: Camera access not supported'])
      return
    }
    await gestureHook.startDetection()
  }, [gestureHook])

  const stopGesture = useCallback(() => {
    gestureHook.stopDetection()
  }, [gestureHook])

  const startTouch = useCallback(() => {
    touchHook.startTracking()
  }, [touchHook])

  const stopTouch = useCallback(() => {
    touchHook.stopTracking()
  }, [touchHook])

  const startAll = useCallback(async () => {
    setErrors([])
    
    // Start all sensors in parallel
    const promises = [
      startGyroscope(),
      Promise.resolve(startVoice()),
      startGesture(),
      Promise.resolve(startTouch())
    ]
    
    await Promise.allSettled(promises)
  }, [startGyroscope, startVoice, startGesture, startTouch])

  const stopAll = useCallback(() => {
    stopGyroscope()
    stopVoice()
    stopGesture()
    stopTouch()
  }, [stopGyroscope, stopVoice, stopGesture, stopTouch])

  const resetAll = useCallback(() => {
    voiceHook.resetTranscript()
    touchHook.clearHistory()
    setErrors([])
  }, [voiceHook, touchHook])

  const getCurrentSensorData = useCallback((): SensorData => {
    return {
      gyroscope: gyroscopeHook.data,
      voice: voiceHook.transcript ? {
        text: voiceHook.transcript,
        confidence: voiceHook.confidence,
        language: 'en-US',
        duration: 0
      } : undefined,
      gesture: gestureHook.gestureData || undefined,
      touch: touchHook.touchData || undefined
    }
  }, [gyroscopeHook.data, voiceHook.transcript, voiceHook.confidence, gestureHook.gestureData, touchHook.touchData])

  return {
    sensorData,
    
    gyroscope: {
      isActive: gyroscopeHook.isActive,
      data: gyroscopeHook.data,
      hasPermission: true // Simplified for now
    },
    
    voice: {
      isListening: voiceHook.isListening,
      isSupported: voiceHook.isSupported,
      transcript: voiceHook.transcript,
      confidence: voiceHook.confidence
    },
    
    gesture: {
      isActive: gestureHook.isActive,
      isSupported: gestureHook.isSupported,
      data: gestureHook.gestureData
    },
    
    touch: {
      isActive: touchHook.isActive,
      data: touchHook.touchData,
      history: touchHook.touchHistory
    },
    
    startAll,
    stopAll,
    startGyroscope,
    stopGyroscope,
    startVoice,
    stopVoice,
    startGesture,
    stopGesture,
    startTouch,
    stopTouch,
    
    resetAll,
    getCurrentSensorData,
    
    isAnyActive,
    errors
  }
}