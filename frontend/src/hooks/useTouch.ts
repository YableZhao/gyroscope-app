"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import type { TouchData } from '@/types'

interface UseTouchReturn {
  isActive: boolean
  touchData: TouchData | null
  touchHistory: TouchData[]
  startTracking: () => void
  stopTracking: () => void
  clearHistory: () => void
}

export function useTouch(element?: HTMLElement | null): UseTouchReturn {
  const [isActive, setIsActive] = useState(false)
  const [touchData, setTouchData] = useState<TouchData | null>(null)
  const [touchHistory, setTouchHistory] = useState<TouchData[]>([])
  
  const elementRef = useRef<HTMLElement | null>(element || null)
  const maxHistoryLength = 50 // Keep last 50 touch points

  useEffect(() => {
    elementRef.current = element || document.body
  }, [element])

  const createTouchData = useCallback((event: TouchEvent | MouseEvent, pressure = 1): TouchData => {
    const rect = elementRef.current?.getBoundingClientRect()
    let x: number, y: number

    if ('touches' in event && event.touches.length > 0) {
      // Touch event
      const touch = event.touches[0]
      x = rect ? (touch.clientX - rect.left) / rect.width : touch.clientX / window.innerWidth
      y = rect ? (touch.clientY - rect.top) / rect.height : touch.clientY / window.innerHeight
      
      // Try to get pressure from touch force if available
      if ('force' in touch) {
        pressure = touch.force || pressure
      }
    } else {
      // Mouse event
      const mouseEvent = event as MouseEvent
      x = rect ? (mouseEvent.clientX - rect.left) / rect.width : mouseEvent.clientX / window.innerWidth
      y = rect ? (mouseEvent.clientY - rect.top) / rect.height : mouseEvent.clientY / window.innerHeight
    }

    return {
      x: Math.max(0, Math.min(1, x)), // Normalize to 0-1
      y: Math.max(0, Math.min(1, y)), // Normalize to 0-1
      pressure,
      timestamp: Date.now()
    }
  }, [])

  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!isActive) return
    
    const data = createTouchData(event)
    setTouchData(data)
    setTouchHistory(prev => [...prev.slice(-maxHistoryLength + 1), data])
  }, [isActive, createTouchData])

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!isActive) return
    
    event.preventDefault() // Prevent scrolling
    const data = createTouchData(event)
    setTouchData(data)
    setTouchHistory(prev => [...prev.slice(-maxHistoryLength + 1), data])
  }, [isActive, createTouchData])

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!isActive) return
    
    // Keep the last touch data but mark it as ended
    const data = createTouchData(event, 0) // Pressure 0 indicates touch end
    setTouchData(data)
    setTouchHistory(prev => [...prev.slice(-maxHistoryLength + 1), data])
  }, [isActive, createTouchData])

  // Mouse event handlers for desktop support
  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (!isActive) return
    
    const data = createTouchData(event)
    setTouchData(data)
    setTouchHistory(prev => [...prev.slice(-maxHistoryLength + 1), data])
  }, [isActive, createTouchData])

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isActive || !(event.buttons & 1)) return // Only track if left button is pressed
    
    const data = createTouchData(event)
    setTouchData(data)
    setTouchHistory(prev => [...prev.slice(-maxHistoryLength + 1), data])
  }, [isActive, createTouchData])

  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!isActive) return
    
    const data = createTouchData(event, 0) // Pressure 0 indicates mouse up
    setTouchData(data)
    setTouchHistory(prev => [...prev.slice(-maxHistoryLength + 1), data])
  }, [isActive, createTouchData])

  const startTracking = useCallback(() => {
    if (!elementRef.current) return
    
    setIsActive(true)
    const element = elementRef.current

    // Touch events
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })
    
    // Mouse events for desktop
    element.addEventListener('mousedown', handleMouseDown)
    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseup', handleMouseUp)
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown, handleMouseMove, handleMouseUp])

  const stopTracking = useCallback(() => {
    setIsActive(false)
    
    if (!elementRef.current) return
    const element = elementRef.current

    // Remove touch events
    element.removeEventListener('touchstart', handleTouchStart)
    element.removeEventListener('touchmove', handleTouchMove)
    element.removeEventListener('touchend', handleTouchEnd)
    
    // Remove mouse events
    element.removeEventListener('mousedown', handleMouseDown)
    element.removeEventListener('mousemove', handleMouseMove)
    element.removeEventListener('mouseup', handleMouseUp)
    
    setTouchData(null)
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown, handleMouseMove, handleMouseUp])

  const clearHistory = useCallback(() => {
    setTouchHistory([])
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking()
    }
  }, [stopTracking])

  return {
    isActive,
    touchData,
    touchHistory,
    startTracking,
    stopTracking,
    clearHistory
  }
}