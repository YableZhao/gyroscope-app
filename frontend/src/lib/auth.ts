import { jwtVerify, SignJWT } from 'jose'
import type { User } from '@/types'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

export interface JWTPayload {
  userId: string
  email: string
  username: string
  iat?: number
  exp?: number
}

export async function signToken(user: User): Promise<string> {
  return await new SignJWT({
    userId: user.id,
    email: user.email,
    username: user.username
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as JWTPayload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  return authHeader.slice(7)
}

export function setAuthCookie(token: string): string {
  return `auth-token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`
}

export function clearAuthCookie(): string {
  return `auth-token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
}

// Client-side token management
export const tokenStorage = {
  set: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-token', token)
    }
  },
  
  get: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth-token')
    }
    return null
  },
  
  remove: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token')
    }
  }
}