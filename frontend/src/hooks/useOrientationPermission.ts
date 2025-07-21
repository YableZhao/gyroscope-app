"use client"

import { useState, useEffect } from 'react'
import type { PermissionState } from '@/types'

interface UseOrientationPermissionReturn {
  permission: PermissionState
  requestPermission: () => Promise<void>
  isLoading: boolean
}

export function useOrientationPermission(): UseOrientationPermissionReturn {
  const [permission, setPermission] = useState<PermissionState>('default')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if permission is required (iOS Safari)
    if (typeof window !== 'undefined' && 
        typeof DeviceOrientationEvent !== 'undefined' && 
        'requestPermission' in DeviceOrientationEvent && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      // Permission required - start with default state
      setPermission('default')
    } else if (typeof window !== 'undefined') {
      // Permission not required - assume granted
      setPermission('granted')
    }
  }, [])

  const requestPermission = async (): Promise<void> => {
    if (permission === 'granted') {
      // Toggle off - reset to default
      setPermission('default')
      return
    }

    setIsLoading(true)

    try {
      if (typeof window !== 'undefined' && 
          typeof DeviceOrientationEvent !== 'undefined' && 
          'requestPermission' in DeviceOrientationEvent &&
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        const permissionState = await DeviceOrientationEvent.requestPermission()
        setPermission(permissionState as PermissionState)
      } else {
        // Browser doesn't require permission
        setPermission('granted')
      }
    } catch (error) {
      console.error('Failed to request device orientation permission:', error)
      setPermission('denied')
    } finally {
      setIsLoading(false)
    }
  }

  return { permission, requestPermission, isLoading }
}