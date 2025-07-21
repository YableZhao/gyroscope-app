"use client"

import { useState, useEffect, useCallback } from 'react'
import { tokenStorage, verifyToken } from '@/lib/auth'
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '@/types'

interface UseAuthReturn {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  login: (credentials: LoginRequest) => Promise<boolean>
  register: (data: RegisterRequest) => Promise<boolean>
  logout: () => void
  clearError: () => void
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = tokenStorage.get()
        if (token) {
          const payload = await verifyToken(token)
          if (payload) {
            // Create user object from token payload
            const userData: User = {
              id: payload.userId,
              email: payload.email,
              username: payload.username,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            setUser(userData)
          } else {
            // Token is invalid, remove it
            tokenStorage.remove()
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        tokenStorage.remove()
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = useCallback(async (credentials: LoginRequest): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // Call the login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Login failed')
      }

      const authResponse: AuthResponse = await response.json()
      
      // Store token and set user
      tokenStorage.set(authResponse.access_token)
      setUser(authResponse.user)
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (data: RegisterRequest): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // Call the register API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Registration failed')
      }

      const authResponse: AuthResponse = await response.json()
      
      // Store token and set user
      tokenStorage.set(authResponse.access_token)
      setUser(authResponse.user)
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    tokenStorage.remove()
    setUser(null)
    setError(null)
    
    // Optional: Call logout API to invalidate server-side session
    fetch('/api/auth/logout', {
      method: 'POST',
    }).catch(console.error)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    register,
    logout,
    clearError
  }
}