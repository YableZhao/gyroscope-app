import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signToken, setAuthCookie } from '@/lib/auth'
import { DatabaseService } from '@/lib/dbService'
import type { RegisterRequest, AuthResponse, User } from '@/types'

export async function POST(request: Request) {
  try {
    const body: RegisterRequest = await request.json()
    const { email, username, password } = body

    // Validate input
    if (!email || !username || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_INPUT', 
            message: 'Email, username, and password are required' 
          } 
        },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_EMAIL', 
            message: 'Invalid email format' 
          } 
        },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'WEAK_PASSWORD', 
            message: 'Password must be at least 6 characters long' 
          } 
        },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await DatabaseService.getUserByEmail(email.toLowerCase())
    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'EMAIL_EXISTS', 
            message: 'An account with this email already exists' 
          } 
        },
        { status: 409 }
      )
    }

    // Create new user
    const hashedPassword = bcrypt.hashSync(password, 10)
    const newUser = await DatabaseService.createUser({
      email: email.toLowerCase(),
      username,
      password_hash: hashedPassword
    })

    // Generate JWT tokens
    const accessToken = await signToken(newUser)
    const refreshToken = await signToken(newUser) // In production, use different secret/expiry
    
    const authResponse: AuthResponse = {
      user: newUser,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    }

    const response = NextResponse.json({
      success: true,
      data: authResponse
    })

    // Set HTTP-only cookie
    response.headers.set('Set-Cookie', setAuthCookie(accessToken))

    return response
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'An internal error occurred' 
        } 
      },
      { status: 500 }
    )
  }
}