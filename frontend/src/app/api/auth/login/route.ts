import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signToken, setAuthCookie } from '@/lib/auth'
import { DatabaseService } from '@/lib/dbService'
import type { LoginRequest, AuthResponse, User } from '@/types'

export async function POST(request: Request) {
  try {
    const body: LoginRequest = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_INPUT', 
            message: 'Email and password are required' 
          } 
        },
        { status: 400 }
      )
    }

    // Find user by email
    const userWithPassword = await DatabaseService.getUserByEmail(email.toLowerCase())
    if (!userWithPassword || !userWithPassword.password_hash) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_CREDENTIALS', 
            message: 'Invalid email or password' 
          } 
        },
        { status: 401 }
      )
    }

    // Verify password
    if (!bcrypt.compareSync(password, userWithPassword.password_hash)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_CREDENTIALS', 
            message: 'Invalid email or password' 
          } 
        },
        { status: 401 }
      )
    }

    // Generate JWT token (exclude password from user object)
    const user = { ...userWithPassword }
    delete (user as unknown as {password_hash?: string}).password_hash
    const accessToken = await signToken(user)
    const refreshToken = await signToken(user) // In production, use different secret/expiry
    
    const authResponse: AuthResponse = {
      user: {
        ...user,
        updated_at: new Date().toISOString()
      },
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
    console.error('Login error:', error)
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