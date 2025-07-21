import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function calculateAccuracy(target: number, actual: number, tolerance: number = 10): number {
  const diff = Math.abs(target - actual)
  const accuracy = Math.max(0, 100 - (diff / tolerance) * 100)
  return Math.round(accuracy)
}

export function normalizeAngle(angle: number): number {
  // Normalize angle to 0-360 range
  while (angle < 0) angle += 360
  while (angle >= 360) angle -= 360
  return angle
}

export function adjustForOrientation(alpha: number, beta: number, gamma: number): {
  alpha: number
  beta: number
  gamma: number
} {
  // Get screen orientation
  const orientation = window.screen?.orientation?.angle || 0
  
  let adjustedBeta = beta
  let adjustedGamma = gamma
  
  switch (orientation) {
    case 90:
      adjustedBeta = -gamma
      adjustedGamma = beta
      break
    case -90:
    case 270:
      adjustedBeta = gamma
      adjustedGamma = -beta
      break
    case 180:
      adjustedBeta = -beta
      adjustedGamma = -gamma
      break
    default:
      // 0 degrees, no adjustment needed
      break
  }
  
  return {
    alpha,
    beta: adjustedBeta,
    gamma: adjustedGamma
  }
}