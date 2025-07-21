import type { Question, QuestionOption, QuestionType, SensorData } from '@/types'

export interface QuestionTemplate {
  id: string
  type: QuestionType
  title: string
  description: string
  question_text: string
  options?: Omit<QuestionOption, 'id'>[]
  correct_answer?: string | number | boolean
  target_data?: SensorData
  points: number
  time_limit: number
  hint?: string
  media_url?: string
}

// Pre-built question templates
const questionTemplates: QuestionTemplate[] = [
  // Multiple Choice Questions
  {
    id: 'mc_1',
    type: 'multiple_choice',
    title: 'Technology Knowledge',
    description: 'Test your tech knowledge',
    question_text: 'Which company developed the React framework?',
    options: [
      { text: 'Google', color: '#4285f4', is_correct: false },
      { text: 'Facebook (Meta)', color: '#1877f2', is_correct: true },
      { text: 'Microsoft', color: '#00a1f1', is_correct: false },
      { text: 'Apple', color: '#007aff', is_correct: false }
    ],
    correct_answer: 'Facebook (Meta)',
    points: 100,
    time_limit: 15
  },
  {
    id: 'mc_2',
    type: 'multiple_choice',
    title: 'Programming Concepts',
    description: 'Basic programming knowledge',
    question_text: 'What does API stand for?',
    options: [
      { text: 'Application Programming Interface', color: '#22c55e', is_correct: true },
      { text: 'Advanced Programming Integration', color: '#ef4444', is_correct: false },
      { text: 'Automated Process Implementation', color: '#f59e0b', is_correct: false },
      { text: 'Application Process Interpreter', color: '#8b5cf6', is_correct: false }
    ],
    correct_answer: 'Application Programming Interface',
    points: 100,
    time_limit: 20
  },
  {
    id: 'mc_3',
    type: 'multiple_choice',
    title: 'Web Development',
    description: 'Frontend technologies',
    question_text: 'Which of these is NOT a JavaScript framework?',
    options: [
      { text: 'React', color: '#61dafb', is_correct: false },
      { text: 'Vue.js', color: '#4fc08d', is_correct: false },
      { text: 'Django', color: '#092e20', is_correct: true },
      { text: 'Angular', color: '#dd1b16', is_correct: false }
    ],
    correct_answer: 'Django',
    points: 150,
    time_limit: 15
  },

  // True/False Questions
  {
    id: 'tf_1',
    type: 'true_false',
    title: 'Tech Facts',
    description: 'True or false statements',
    question_text: 'TypeScript is a superset of JavaScript.',
    correct_answer: true,
    points: 100,
    time_limit: 10
  },
  {
    id: 'tf_2',
    type: 'true_false',
    title: 'Programming Facts',
    description: 'Quick true/false check',
    question_text: 'Python was named after the snake species.',
    correct_answer: false,
    points: 100,
    time_limit: 10,
    hint: 'Think about British comedy!'
  },
  {
    id: 'tf_3',
    type: 'true_false',
    title: 'Web Standards',
    description: 'Web development knowledge',
    question_text: 'CSS stands for Cascading Style Sheets.',
    correct_answer: true,
    points: 80,
    time_limit: 8
  },

  // Orientation Match Questions
  {
    id: 'om_1',
    type: 'orientation_match',
    title: 'Device Orientation',
    description: 'Match the target orientation',
    question_text: 'Tilt your device to match the target orientation: Portrait upright',
    target_data: {
      gyroscope: { alpha: 0, beta: 0, gamma: 0 }
    },
    points: 200,
    time_limit: 15,
    hint: 'Hold your device vertically'
  },
  {
    id: 'om_2',
    type: 'orientation_match',
    title: 'Landscape Challenge',
    description: 'Rotate to landscape mode',
    question_text: 'Rotate your device to landscape orientation (left side)',
    target_data: {
      gyroscope: { alpha: 0, beta: 0, gamma: -90 }
    },
    points: 200,
    time_limit: 12,
    hint: 'Rotate 90 degrees counter-clockwise'
  },

  // Voice Recognition Questions
  {
    id: 'vr_1',
    type: 'voice_command',
    title: 'Voice Challenge',
    description: 'Say the magic word!',
    question_text: 'Say "Hello World" clearly into your microphone',
    correct_answer: 'hello world',
    points: 150,
    time_limit: 10,
    hint: 'Speak clearly and loudly'
  },
  {
    id: 'vr_2',
    type: 'voice_command',
    title: 'Number Recognition',
    description: 'Voice number challenge',
    question_text: 'Say the number "42" out loud',
    correct_answer: 'forty two',
    points: 150,
    time_limit: 8
  },

  // Gesture Recognition Questions
  {
    id: 'gr_1',
    type: 'gesture_recognition',
    title: 'Hand Gesture',
    description: 'Show a thumbs up gesture',
    question_text: 'Make a thumbs up gesture with your hand',
    correct_answer: 'thumbs_up',
    points: 180,
    time_limit: 15,
    hint: 'Make sure your camera can see your hand clearly'
  },
  {
    id: 'gr_2',
    type: 'gesture_recognition',
    title: 'Peace Sign',
    description: 'Victory gesture challenge',
    question_text: 'Show a peace sign (V for victory) with your fingers',
    correct_answer: 'peace',
    points: 180,
    time_limit: 15
  },

  // Multi-Modal Questions
  {
    id: 'mm_1',
    type: 'multi_modal',
    title: 'Multi-Modal Challenge',
    description: 'Use voice AND gesture together',
    question_text: 'Say "Yes" while making a thumbs up gesture',
    correct_answer: 'yes_thumbs_up',
    points: 300,
    time_limit: 20,
    hint: 'Combine voice and gesture for maximum points!'
  }
]

export class QuestionGenerator {
  private usedQuestions: Set<string> = new Set()
  private questionPool: QuestionTemplate[] = [...questionTemplates]

  constructor(customQuestions?: QuestionTemplate[]) {
    if (customQuestions) {
      this.questionPool = [...questionTemplates, ...customQuestions]
    }
  }

  // Generate a random question of any type
  generateRandomQuestion(sessionId: string, roundNumber: number): Question {
    const availableQuestions = this.questionPool.filter(q => !this.usedQuestions.has(q.id))
    
    if (availableQuestions.length === 0) {
      // Reset if all questions have been used
      this.usedQuestions.clear()
      this.questionPool = [...questionTemplates]
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length)
    const template = availableQuestions[randomIndex]
    
    this.usedQuestions.add(template.id)
    
    return this.createQuestionFromTemplate(template, sessionId, roundNumber)
  }

  // Generate a question of specific type
  generateQuestionByType(type: QuestionType, sessionId: string, roundNumber: number): Question {
    const availableQuestions = this.questionPool.filter(
      q => q.type === type && !this.usedQuestions.has(q.id)
    )
    
    if (availableQuestions.length === 0) {
      // If no unused questions of this type, use any available
      const typeQuestions = this.questionPool.filter(q => q.type === type)
      if (typeQuestions.length === 0) {
        throw new Error(`No questions available for type: ${type}`)
      }
      
      const randomIndex = Math.floor(Math.random() * typeQuestions.length)
      const template = typeQuestions[randomIndex]
      return this.createQuestionFromTemplate(template, sessionId, roundNumber)
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length)
    const template = availableQuestions[randomIndex]
    
    this.usedQuestions.add(template.id)
    
    return this.createQuestionFromTemplate(template, sessionId, roundNumber)
  }

  // Generate a balanced set of questions for a game
  generateGameQuestionSet(sessionId: string, totalQuestions: number, includeMultiModal = true): Question[] {
    const questions: Question[] = []
    const questionTypes: QuestionType[] = includeMultiModal 
      ? ['multiple_choice', 'true_false', 'orientation_match', 'voice_command', 'gesture_recognition', 'multi_modal']
      : ['multiple_choice', 'true_false', 'orientation_match']

    // Reset used questions for a new game
    this.usedQuestions.clear()

    for (let i = 0; i < totalQuestions; i++) {
      const typeIndex = i % questionTypes.length
      const questionType = questionTypes[typeIndex]
      
      try {
        const question = this.generateQuestionByType(questionType, sessionId, i + 1)
        questions.push(question)
      } catch (error) {
        // If we can't generate a question of the specific type, generate any random question
        const question = this.generateRandomQuestion(sessionId, i + 1)
        questions.push(question)
      }
    }

    return this.shuffleQuestions(questions)
  }

  // Add custom questions to the pool
  addCustomQuestions(questions: QuestionTemplate[]): void {
    this.questionPool.push(...questions)
  }

  // Reset the generator
  reset(): void {
    this.usedQuestions.clear()
    this.questionPool = [...questionTemplates]
  }

  // Get available question types
  getAvailableTypes(): QuestionType[] {
    return Array.from(new Set(this.questionPool.map(q => q.type)))
  }

  // Get question count by type
  getQuestionCountByType(): Record<QuestionType, number> {
    const counts: Partial<Record<QuestionType, number>> = {}
    
    this.questionPool.forEach(q => {
      counts[q.type] = (counts[q.type] || 0) + 1
    })
    
    return counts as Record<QuestionType, number>
  }

  private createQuestionFromTemplate(template: QuestionTemplate, sessionId: string, roundNumber: number): Question {
    const questionId = `${sessionId}_q${roundNumber}_${template.id}_${Date.now()}`
    
    return {
      id: questionId,
      session_id: sessionId,
      type: template.type,
      title: template.title,
      description: template.description,
      question_text: template.question_text,
      options: template.options?.map((option, index) => ({
        id: `${questionId}_opt_${index}`,
        ...option
      })),
      correct_answer: template.correct_answer,
      target_data: template.target_data,
      time_limit: template.time_limit,
      points: template.points,
      round_number: roundNumber,
      media_url: template.media_url,
      hint: template.hint,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  private shuffleQuestions(questions: Question[]): Question[] {
    const shuffled = [...questions]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}

// Export a default instance
export const questionGenerator = new QuestionGenerator()