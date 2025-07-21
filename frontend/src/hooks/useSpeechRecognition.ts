"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import type { VoiceData } from '@/types'

interface UseSpeechRecognitionReturn {
  isListening: boolean
  isSupported: boolean
  transcript: string
  confidence: number
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  error: string | null
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const recognitionRef = useRef<{
    start: () => void
    stop: () => void
    abort: () => void
  } | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check if speech recognition is supported
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        setIsSupported(true)
        
        // Initialize speech recognition
        const recognition = new (SpeechRecognition as unknown as new () => {
          continuous: boolean
          interimResults: boolean
          lang: string
          maxAlternatives: number
          start: () => void
          stop: () => void
          abort: () => void
          onstart: (() => void) | null
          onend: (() => void) | null
          onerror: ((event: unknown) => void) | null
          onresult: ((event: unknown) => void) | null
        })()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
          setIsListening(true)
          setError(null)
        }

        recognition.onend = () => {
          setIsListening(false)
        }

        recognition.onerror = (event: unknown) => {
          const errorEvent = event as { error?: string }
          setError(`Speech recognition error: ${errorEvent?.error || 'Unknown error'}`)
          setIsListening(false)
        }

        recognition.onresult = (event: unknown) => {
          let finalTranscript = ''
          let interimTranscript = ''
          
          const eventObj = event as {
            resultIndex: number
            results: {
              length: number
              [index: number]: {
                isFinal: boolean
                [index: number]: {
                  transcript: string
                  confidence?: number
                }
              }
            }
          }
          for (let i = eventObj.resultIndex; i < eventObj.results.length; i++) {
            const result = eventObj.results[i]
            const transcriptSegment = result[0].transcript
            
            if (result.isFinal) {
              finalTranscript += transcriptSegment
              setConfidence(result[0].confidence || 0)
            } else {
              interimTranscript += transcriptSegment
            }
          }
          
          setTranscript(finalTranscript + interimTranscript)
          
          // Auto-stop after 5 seconds of final result
          if (finalTranscript && timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = setTimeout(() => {
              stopListening()
            }, 5000)
          }
        }

        recognitionRef.current = recognition
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      setError('Speech recognition is not supported')
      return
    }

    try {
      setError(null)
      setTranscript('')
      setConfidence(0)
      recognitionRef.current.start()
    } catch (err) {
      setError('Failed to start speech recognition')
      console.error('Speech recognition start error:', err)
    }
  }, [isSupported])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [isListening])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setConfidence(0)
    setError(null)
  }, [])

  return {
    isListening,
    isSupported,
    transcript,
    confidence,
    startListening,
    stopListening,
    resetTranscript,
    error
  }
}

// Voice data utility
export function createVoiceData(transcript: string, confidence: number): VoiceData {
  return {
    text: transcript,
    confidence,
    language: 'en-US',
    duration: 0 // This would need to be calculated based on timing
  }
}