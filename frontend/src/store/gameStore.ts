import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { 
  User, 
  Room, 
  GameSession, 
  Question, 
  PlayerScore, 
  RoomState,
  GameState,
  GameType,
  QuestionType 
} from '@/types'

interface GameStore {
  // User state
  currentUser: User | null
  setCurrentUser: (user: User | null) => void

  // Room state
  currentRoom: Room | null
  roomParticipants: User[]
  isHost: boolean
  setRoomState: (state: RoomState) => void
  clearRoom: () => void

  // Game session state
  currentSession: GameSession | null
  currentQuestion: Question | null
  timeRemaining: number
  playerScores: PlayerScore[]
  setGameState: (state: GameState) => void
  clearGame: () => void

  // UI state
  isLoading: boolean
  error: string | null
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Actions
  joinRoom: (roomCode: string) => Promise<void>
  leaveRoom: () => void
  startGame: (gameType: string) => Promise<void>
  submitAnswer: (answer: unknown) => Promise<void>
}

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentUser: null,
      currentRoom: null,
      roomParticipants: [],
      isHost: false,
      currentSession: null,
      currentQuestion: null,
      timeRemaining: 0,
      playerScores: [],
      isLoading: false,
      error: null,

      // User actions
      setCurrentUser: (user) => set({ currentUser: user }),

      // Room actions
      setRoomState: (state) => set({
        currentRoom: state.room,
        roomParticipants: state.participants,
        currentSession: state.current_session,
        isHost: state.is_host
      }),

      clearRoom: () => set({
        currentRoom: null,
        roomParticipants: [],
        isHost: false,
        currentSession: null,
        currentQuestion: null,
        timeRemaining: 0,
        playerScores: []
      }),

      // Game actions
      setGameState: (state) => set({
        currentSession: state.session,
        currentQuestion: state.current_question,
        playerScores: state.players,
        isHost: state.is_host,
        timeRemaining: state.time_remaining || 0
      }),

      clearGame: () => set({
        currentSession: null,
        currentQuestion: null,
        timeRemaining: 0,
        playerScores: []
      }),

      // UI actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // API actions (to be implemented with actual API calls)
      joinRoom: async (roomCode) => {
        const { setLoading, setError, setRoomState } = get()
        
        setLoading(true)
        setError(null)

        try {
          // TODO: Replace with actual API call
          console.log('Joining room:', roomCode)
          
          // Mock room state for now
          const mockRoomState: RoomState = {
            room: {
              id: '1',
              code: roomCode,
              name: 'Test Room',
              host_id: '1',
              host: {
                id: '1',
                email: 'host@example.com',
                username: 'Host',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              },
              status: 'waiting',
              max_players: 50,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            participants: [
              {
                id: '1',
                email: 'host@example.com',
                username: 'Host',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ],
            is_host: false
          }

          setRoomState(mockRoomState)
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to join room')
        } finally {
          setLoading(false)
        }
      },

      leaveRoom: () => {
        const { clearRoom } = get()
        // TODO: Make API call to leave room
        clearRoom()
      },

      startGame: async (gameType) => {
        const { setLoading, setError, setGameState, currentRoom } = get()
        
        if (!currentRoom) {
          setError('No room selected')
          return
        }

        setLoading(true)
        setError(null)

        try {
          // TODO: Replace with actual API call
          console.log('Starting game:', gameType)
          
          // Mock game state
          const mockGameState: GameState = {
            session: {
              id: '1',
              room_id: currentRoom.id,
              game_type: gameType as GameType,
              status: 'waiting',
              current_round: 1,
              total_rounds: 10,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            current_question: {
              id: '1',
              session_id: '1',
              type: 'multiple_choice' as QuestionType,
              title: 'Match the orientation',
              description: 'Rotate your device to match the target orientation',
              question_text: 'Rotate your device to match the target orientation',
              time_limit: 30,
              points: 100,
              round_number: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            players: [],
            is_host: true,
            time_remaining: 30
          }

          setGameState(mockGameState)
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to start game')
        } finally {
          setLoading(false)
        }
      },

      submitAnswer: async (answer: unknown) => {
        const { setLoading, setError, currentSession, currentQuestion } = get()
        
        if (!currentSession || !currentQuestion) {
          setError('No active game')
          return
        }

        setLoading(true)
        setError(null)

        try {
          // TODO: Replace with actual API call
          console.log('Submitting answer:', answer)
          
          // Mock success response
          console.log('Answer submitted successfully')
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to submit answer')
        } finally {
          setLoading(false)
        }
      }
    }),
    {
      name: 'game-store'
    }
  )
)