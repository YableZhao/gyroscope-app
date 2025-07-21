import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth'

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      data: { message: 'Logged out successfully' }
    })

    // Clear HTTP-only cookie
    response.headers.set('Set-Cookie', clearAuthCookie())

    return response
  } catch (error) {
    console.error('Logout error:', error)
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