"use client"

import { useState, useEffect, useCallback } from 'react'
import type { GyroscopeData, FilteredGyroscopeData, PermissionState } from '@/types'
import { adjustForOrientation } from '@/lib/utils'

interface UseGyroscopeOptions {
  smoothingFactor?: number
  permission: PermissionState
  onDataChange?: (data: FilteredGyroscopeData) => void
}

interface UseGyroscopeReturn {
  data: FilteredGyroscopeData
  rawData: GyroscopeData
  setSmoothingFactor: (factor: number) => void
  smoothingFactor: number
  reset: () => void
  isActive: boolean
}

export function useGyroscope({ 
  smoothingFactor: initialSmoothingFactor = 10, 
  permission,
  onDataChange
}: UseGyroscopeOptions): UseGyroscopeReturn {
  const [rawData, setRawData] = useState<GyroscopeData>({
    alpha: 0,
    beta: 0,
    gamma: 0
  })

  const [smoothingFactor, setSmoothingFactor] = useState(initialSmoothingFactor)
  const [history, setHistory] = useState<GyroscopeData[]>([])
  const [isActive, setIsActive] = useState(false)

  // Calculate filtered data using moving average
  const filteredData: FilteredGyroscopeData = {
    alpha: history.length > 0 ? history.reduce((sum, data) => sum + data.alpha, 0) / history.length : 0,
    beta: history.length > 0 ? history.reduce((sum, data) => sum + data.beta, 0) / history.length : 0,
    gamma: history.length > 0 ? history.reduce((sum, data) => sum + data.gamma, 0) / history.length : 0,
    timestamp: Date.now()
  }

  const handleOrientationChange = useCallback((event: DeviceOrientationEvent) => {
    if (permission !== 'granted') return

    const adjustedData = adjustForOrientation(
      event.alpha || 0,
      event.beta || 0,
      event.gamma || 0
    )

    setRawData(adjustedData)
    setIsActive(true)
  }, [permission])

  const reset = useCallback(() => {
    setRawData({ alpha: 0, beta: 0, gamma: 0 })
    setHistory([])
    setIsActive(false)
  }, [])

  // Update history when raw data changes
  useEffect(() => {
    setHistory(prev => [rawData, ...prev].slice(0, smoothingFactor))
  }, [rawData, smoothingFactor])

  // Call onDataChange when filtered data changes
  useEffect(() => {
    if (onDataChange && isActive) {
      onDataChange(filteredData)
    }
  }, [filteredData.alpha, filteredData.beta, filteredData.gamma, onDataChange, isActive])

  // Set up device orientation listener
  useEffect(() => {
    if (typeof window === 'undefined' || !window.DeviceOrientationEvent || permission !== 'granted') {
      setIsActive(false)
      return
    }

    window.addEventListener('deviceorientation', handleOrientationChange)
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientationChange)
    }
  }, [handleOrientationChange, permission])

  // Reset when permission is lost
  useEffect(() => {
    if (permission !== 'granted') {
      setIsActive(false)
    }
  }, [permission])

  return {
    data: filteredData,
    rawData,
    setSmoothingFactor,
    smoothingFactor,
    reset,
    isActive
  }
}