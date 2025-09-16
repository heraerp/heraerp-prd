'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import {
  GraduationCap,
  BookOpen,
  Trophy,
  Target,
  Clock,
  Brain,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Star,
  Award,
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertCircle,
  Users,
  Gamepad2,
  PieChart,
  BarChart3,
  Flame,
  Shield,
  Crown,
  Sparkles,
  FileText,
  Layers,
  Search
} from 'lucide-react'
import { caSyllabusService } from '@/src/lib/ca-syllabus/CASyllabusService'

export default function CALearningPlatform() {
  // Existing state
  const [currentStreak, setCurrentStreak] = useState(7)
  const [totalPoints, setTotalPoints] = useState(2840)
  const [studyTime, setStudyTime] = useState(0)
  const [isStudying, setIsStudying] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResponse, setAiResponse] = useState('')
  const [quizData, setQuizData] = useState(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [mockTestData, setMockTestData] = useState(null)
  const [showMockTest, setShowMockTest] = useState(false)
  const [activeQuiz, setActiveQuiz] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [quizStartTime, setQuizStartTime] = useState(null)

  // CA Syllabus Integration State
  const [caSyllabusData, setCASyllabusData] = useState(null)
  const [paper8Details, setPaper8Details] = useState(null)
  const [examSchedule, setExamSchedule] = useState(null)
  const [syllabusLoading, setSyllabusLoading] = useState(true)
  const [showSyllabusView, setShowSyllabusView] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(900) // 15 minutes in seconds

  // Immediate feedback system
  const [showFeedback, setShowFeedback] = useState(false)
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false)
  const [currentAnswer, setCurrentAnswer] = useState(null)
  const [canProceed, setCanProceed] = useState(false)

  // Millionaire-style lifelines
  const [lifelinesUsed, setLifelinesUsed] = useState({
    fiftyFifty: false,
    askExpert: false,
    phoneFriend: false,
    skipQuestion: false
  })
  const [eliminatedOptions, setEliminatedOptions] = useState({}) // Track eliminated options per question
  const [expertHint, setExpertHint] = useState('') // Store expert hint
  const [friendTip, setFriendTip] = useState('') // Store friend tip
  const [showLifelineModal, setShowLifelineModal] = useState(false)
  const [activeLifeline, setActiveLifeline] = useState('')

  // Study Timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isStudying) {
      interval = setInterval(() => {
        setStudyTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isStudying])

  // Load CA Syllabus Data
  useEffect(() => {
    async function loadCASyllabusData() {
      try {
        setSyllabusLoading(true)
        console.log('🎓 Loading CA Final syllabus data...')

        // Load CA Final level data and Paper 8 details in parallel
        const [finalLevelData, paper8Data, scheduleData] = await Promise.all([
          caSyllabusService.getCALevel('final'),
          caSyllabusService.getCAPaper8Details(),
          caSyllabusService.getExamSchedule('final')
        ])

        console.log('✅ CA Syllabus data loaded:', {
          finalLevel: finalLevelData,
          paper8: paper8Data,
          schedule: scheduleData
        })

        setCASyllabusData(finalLevelData)
        setPaper8Details(paper8Data)
        setExamSchedule(scheduleData)
      } catch (error) {
        console.error('❌ Error loading CA syllabus:', error)
        // Set fallback data
        setCASyllabusData({
          level: 'final',
          entity_id: 'ca_final_fallback',
          exam_framework: { entity_name: 'CA Final' },
          syllabus_structure: { frequency: 'thrice_yearly' },
          answer_expectations: {}
        })
      } finally {
        setSyllabusLoading(false)
      }
    }

    loadCASyllabusData()
  }, [])

  // Quiz Timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (activeQuiz && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleQuizComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [activeQuiz, timeRemaining])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // AI-powered learning handlers
  const handleLearningMode = async (mode: 'concept' | 'story' | 'drill') => {
    setAiLoading(true)
    try {
      const response = await fetch('/api/v1/ai/universal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'custom_request',
          smart_code: 'HERA.CA.EDU.AI.LEARNING_MODE.v1',
          task_type: 'learning',
          prompt: `Generate ${mode} mode learning content for CA Final Indirect Tax. Topic: GST Basics. Include interactive elements and personalized guidance.`,
          max_tokens: 1000,
          temperature: 0.7
        })
      })
      const result = await response.json()
      if (result.success) {
        setAiResponse(result.data.content)
        alert(
          `${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode activated! AI response: ${result.data.content.substring(0, 100)}...`
        )
      }
    } catch (error) {
      console.error('AI Learning Mode Error:', error)
    } finally {
      setAiLoading(false)
    }
  }

  const handleAIAssistant = async (type: 'explain' | 'practice' | 'analyze') => {
    setAiLoading(true)
    try {
      let action = ''
      let requestData = {}

      switch (type) {
        case 'explain':
          action = 'custom_request'
          requestData = {
            smart_code: 'HERA.CA.EDU.AI.EXPLAIN.v1',
            task_type: 'learning',
            prompt:
              'Explain the concept of Input Tax Credit in GST with practical examples and legal sections'
          }
          break
        case 'practice':
          action = 'generate_ca_questions'
          requestData = {
            topic: 'GST Basics',
            difficulty: 'medium',
            count: 3
          }
          break
        case 'analyze':
          action = 'analyze_student_performance'
          requestData = {
            student_data: {
              name: studentData.name,
              topics_completed: topicProgress,
              total_points: totalPoints,
              study_time: studyTime,
              streak: currentStreak
            }
          }
          break
      }

      const response = await fetch('/api/v1/ai/universal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...requestData })
      })

      const result = await response.json()
      if (result.success) {
        setAiResponse(result.data.content || JSON.stringify(result.data, null, 2))
        alert(`AI Assistant activated! Check console for full response.`)
        console.log('AI Response:', result)
      }
    } catch (error) {
      console.error('AI Assistant Error:', error)
    } finally {
      setAiLoading(false)
    }
  }

  // Quick Quiz Handler - ChatGPT First Approach
  const handleQuickQuiz = async () => {
    setAiLoading(true)
    try {
      console.log('🤖 ChatGPT-First Quick Quiz Generation')

      const weakTopics = topicProgress.filter(topic => topic.confidence === 'low').map(t => t.name)
      const randomTopic =
        weakTopics[Math.floor(Math.random() * weakTopics.length)] || 'Customs Valuation'
      const topicId = randomTopic.toLowerCase().replace(' ', '_')

      // Step 1: Try ChatGPT generation first
      console.log('🤖 Step 1: Generating fresh questions via ChatGPT...')

      const chatGPTResponse = await fetch('/api/v1/learning/ca-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_fresh_questions',
          data: {
            topic_id: topicId,
            question_count: 10,
            difficulty: 'medium'
          }
        })
      })

      const chatGPTResult = await chatGPTResponse.json()
      console.log('🤖 ChatGPT Response:', chatGPTResult)

      if (
        chatGPTResult.success &&
        chatGPTResult.data.questions &&
        chatGPTResult.data.questions.length > 0
      ) {
        console.log(
          '✅ Generated fresh questions via ChatGPT:',
          chatGPTResult.data.questions.length
        )
        setQuizData({
          questions: chatGPTResult.data.questions,
          config: {
            total_questions: chatGPTResult.data.questions.length,
            time_limit_minutes: 15,
            topic_ids: [topicId],
            source: 'chatgpt_fresh'
          }
        })
        setShowQuiz(true)
        setTimeout(() => handleBeginQuiz(), 2000)
        alert(
          `Fresh Quiz generated! ${chatGPTResult.data.questions.length} new questions on ${randomTopic} via ChatGPT. Auto-saved for reuse!`
        )
        return
      }

      // Step 2: Fallback to saved questions if ChatGPT fails
      console.log('📚 Step 2: ChatGPT unavailable, checking saved questions...')

      const savedQuestionsResponse = await fetch('/api/v1/learning/ca-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_saved_questions',
          data: {
            topic_id: topicId,
            subject_domain: 'CA',
            difficulty_level: 'medium',
            cross_subject_reuse: true,
            limit: 10
          }
        })
      })

      const savedResult = await savedQuestionsResponse.json()
      console.log('📚 Saved Questions Response:', savedResult)

      if (
        savedResult.success &&
        savedResult.data.questions &&
        savedResult.data.questions.length > 0
      ) {
        console.log('✅ Found saved questions in database:', savedResult.data.questions.length)
        setQuizData({
          questions: savedResult.data.questions,
          config: {
            total_questions: savedResult.data.questions.length,
            time_limit_minutes: 15,
            topic_ids: [topicId],
            source: 'database_saved'
          }
        })
        setShowQuiz(true)
        setTimeout(() => handleBeginQuiz(), 2000)
        alert(
          `Quick Quiz loaded! ${savedResult.data.questions.length} questions on ${randomTopic} from database.`
        )
        return
      }

      // Step 2: Generate new quiz if no saved questions found
      console.log('📝 Step 2: Generating new quiz with mock test questions...')

      const response = await fetch('/api/v1/learning/ca-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_mock_test',
          data: {
            subject_domain: 'CA',
            topic_ids: [topicId],
            difficulty_mix: { easy: 20, medium: 60, hard: 20 },
            total_questions: 10,
            time_limit_minutes: 15,
            include_cross_subject: true,
            test_type: 'quick_quiz'
          }
        })
      })

      const result = await response.json()
      console.log('🎯 Mock Test Response:', result)

      if (result.success && result.data) {
        const mockTest = result.data.mock_test || result.data
        console.log('✅ Mock test generated:', mockTest)

        setQuizData(mockTest)
        setShowQuiz(true)
        setTimeout(() => handleBeginQuiz(), 2000)
        alert(`Quick Quiz generated! 10 questions on ${randomTopic}. Starting automatically...`)

        // Step 3: Try to save the generated questions for future use
        if (mockTest.questions && mockTest.questions.length > 0) {
          console.log('💾 Step 3: Saving generated questions to database...')
          mockTest.questions.forEach(async (question, index) => {
            try {
              await fetch('/api/v1/learning/ca-final', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'save_generated_content',
                  data: {
                    title: `${randomTopic} Question ${index + 1}`,
                    subject_domain: 'CA',
                    topic_id: topicId,
                    difficulty_level: question.difficulty || 'medium',
                    question: question.question,
                    answer: question.options
                      ? question.options[question.correct_answer]
                      : question.answer,
                    explanation: question.explanation || '',
                    tags: [randomTopic.toLowerCase(), 'ca_final', 'quiz']
                  }
                })
              })
            } catch (saveError) {
              console.log('Note: Could not save question to database:', saveError)
            }
          })
        }
      } else {
        throw new Error(result.error || 'Mock test generation failed')
      }
    } catch (error) {
      console.error('Quiz Generation Error:', error)
      alert(`Quiz generation issue: ${error.message}. Using fallback questions.`)

      // Step 4: Final fallback - use built-in questions
      console.log('🔄 Step 4: Using fallback questions')
      setQuizData({ questions: [] }) // This will trigger fallback in getQuizQuestions
      setShowQuiz(true)
      setTimeout(() => handleBeginQuiz(), 1000)
    } finally {
      setAiLoading(false)
    }
  }

  // Mock Test Handler - ChatGPT First Approach
  const handleMockTest = async () => {
    setAiLoading(true)
    try {
      console.log('🤖 ChatGPT-First Mock Test Generation')

      const response = await fetch('/api/v1/learning/ca-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_mock_test',
          data: {
            subject_domain: 'CA_FINAL',
            topic_ids: ['gst_basics', 'customs_valuation', 'ftp_schemes', 'export_benefits'],
            difficulty_mix: { easy: 25, medium: 50, hard: 25 },
            total_questions: 50,
            time_limit_minutes: 180, // 3 hours
            include_cross_subject: true,
            test_type: 'full_mock_test',
            force_fresh: true // Force ChatGPT generation for mock tests
          }
        })
      })

      const result = await response.json()
      if (result.success) {
        const mockTest = result.data.mock_test || result.data
        setMockTestData(mockTest)
        setShowMockTest(true)

        const questionSource = result.data.question_source || 'unknown'
        const sourceText =
          questionSource === 'chatgpt_fresh' ? 'via ChatGPT (fresh)' : 'from database'

        alert(
          `Mock Test created! ${mockTest.questions?.length || 50} questions ${sourceText}, 3 hours.`
        )
        console.log('Mock Test Data:', result)
        console.log(`📊 Question Source: ${questionSource}`)
      } else {
        alert(`Mock test generation: ${result.error || 'Processing complete - check console'}`)
        console.log('Mock Test Response:', result)
      }
    } catch (error) {
      console.error('Mock Test Error:', error)
      alert('Mock test feature activated - check console for details')
    } finally {
      setAiLoading(false)
    }
  }

  // Quiz Control Functions
  const handleBeginQuiz = () => {
    // Ensure we have questions before starting
    let questions = getQuizQuestions()

    if (questions.length === 0) {
      // Emergency fallback: Create immediate quiz questions
      const emergencyQuestions = [
        {
          id: 'emergency_1',
          question: 'What is the full form of GST?',
          options: [
            'Gross Sales Tax',
            'Goods and Services Tax',
            'General State Tax',
            'Government Service Tax'
          ],
          correct_answer: 1,
          explanation:
            'GST stands for Goods and Services Tax, a comprehensive indirect tax system in India.',
          difficulty: 'medium',
          topic: 'indirect_tax_gst'
        },
        {
          id: 'emergency_2',
          question: 'Under which Article of the Constitution was GST introduced?',
          options: ['Article 266', 'Article 269A', 'Article 270', 'Article 279A'],
          correct_answer: 3,
          explanation: 'GST was introduced under Article 279A of the Indian Constitution.',
          difficulty: 'medium',
          topic: 'indirect_tax_gst'
        },
        {
          id: 'emergency_3',
          question: 'What is the threshold limit for GST registration for goods?',
          options: ['₹10 lakhs', '₹20 lakhs', '₹40 lakhs', '₹50 lakhs'],
          correct_answer: 1,
          explanation:
            'The threshold limit for GST registration for goods is ₹20 lakhs in most states.',
          difficulty: 'medium',
          topic: 'indirect_tax_gst'
        },
        {
          id: 'emergency_4',
          question: 'Which GST return is filed monthly by regular taxpayers?',
          options: ['GSTR-1', 'GSTR-3B', 'GSTR-9', 'GSTR-4'],
          correct_answer: 1,
          explanation: 'GSTR-3B is the monthly summary return filed by regular GST taxpayers.',
          difficulty: 'medium',
          topic: 'indirect_tax_gst'
        },
        {
          id: 'emergency_5',
          question: 'What is the maximum GST rate applicable in India?',
          options: ['18%', '24%', '28%', '30%'],
          correct_answer: 2,
          explanation:
            'The maximum GST rate in India is 28%, applicable to luxury and demerit goods.',
          difficulty: 'medium',
          topic: 'indirect_tax_gst'
        }
      ]

      // Set the emergency questions and use them
      setQuizData({
        questions: emergencyQuestions,
        config: {
          total_questions: emergencyQuestions.length,
          time_limit_minutes: 15,
          topic_ids: ['indirect_tax_gst'],
          source: 'emergency_fallback'
        }
      })

      questions = emergencyQuestions
    }

    setActiveQuiz(true)
    setCurrentQuestion(0)
    setSelectedAnswers({})
    setQuizStartTime(Date.now())
    setTimeRemaining(900) // 15 minutes
    setShowQuiz(false) // Hide the preview modal

    // Reset feedback state
    setShowFeedback(false)
    setIsAnswerCorrect(false)
    setCurrentAnswer(null)
    setCanProceed(false)

    // Reset lifelines
    setLifelinesUsed({
      fiftyFifty: false,
      askExpert: false,
      phoneFriend: false,
      skipQuestion: false
    })
    setEliminatedOptions({})
  }

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const currentQ = getQuizQuestions()[questionIndex]
    const isCorrect = answerIndex === currentQ.correct_answer

    // Store the selected answer
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }))

    // Show immediate feedback
    setCurrentAnswer(answerIndex)
    setIsAnswerCorrect(isCorrect)
    setShowFeedback(true)

    if (isCorrect) {
      // If correct, allow immediate proceed to next question
      setCanProceed(true)
      // Auto-celebrate with a slight delay
      setTimeout(() => {
        if (currentQuestion < getQuizQuestions().length - 1) {
          handleNextQuestion()
        } else {
          handleQuizComplete()
        }
      }, 2000) // 2 second delay to show celebration
    } else {
      // If wrong, don't allow proceeding until they find the right answer
      setCanProceed(false)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestion < getQuizQuestions().length - 1) {
      // Reset feedback state for next question
      setShowFeedback(false)
      setCurrentAnswer(null)
      setCanProceed(false)
      setCurrentQuestion(prev => prev + 1)
    } else {
      handleQuizComplete()
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const handleQuizComplete = () => {
    const endTime = Date.now()
    const timeTaken = Math.floor((endTime - quizStartTime) / 1000)
    const score = calculateQuizScore()

    setActiveQuiz(false)
    setCurrentQuestion(0)

    // Show results
    alert(
      `Quiz Complete! Score: ${score}/${getQuizQuestions().length} (${Math.round((score / getQuizQuestions().length) * 100)}%) Time: ${Math.floor(timeTaken / 60)}:${(timeTaken % 60).toString().padStart(2, '0')}`
    )

    console.log('Quiz Results:', {
      score,
      total: getQuizQuestions().length,
      percentage: Math.round((score / getQuizQuestions().length) * 100),
      timeTaken,
      answers: selectedAnswers
    })
  }

  const calculateQuizScore = () => {
    const questions = getQuizQuestions()
    let correct = 0

    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_answer) {
        correct++
      }
    })

    return correct
  }

  // Millionaire-style Lifeline Functions
  const use50_50 = () => {
    if (lifelinesUsed.fiftyFifty) return

    const currentQ = getQuizQuestions()[currentQuestion]
    const correctAnswer = currentQ.correct_answer
    const wrongAnswers = [0, 1, 2, 3].filter(i => i !== correctAnswer)

    // Randomly eliminate 2 wrong answers
    const toEliminate = wrongAnswers.sort(() => 0.5 - Math.random()).slice(0, 2)

    setEliminatedOptions(prev => ({
      ...prev,
      [currentQuestion]: toEliminate
    }))

    setLifelinesUsed(prev => ({ ...prev, fiftyFifty: true }))
    alert('50/50 Used! Two wrong answers have been eliminated.')
  }

  const askTheExpert = async () => {
    if (lifelinesUsed.askExpert) return

    setActiveLifeline('expert')
    setShowLifelineModal(true)

    const currentQ = getQuizQuestions()[currentQuestion]

    try {
      // Get AI hint from expert
      const response = await fetch('/api/v1/ai/universal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'custom_request',
          smart_code: 'HERA.CA.EXPERT.HINT.v1',
          task_type: 'learning',
          prompt: `As a CA Final expert, provide a helpful hint (not the direct answer) for this question: "${currentQ.question}". Give a study tip or concept explanation to guide the student.`,
          max_tokens: 150,
          temperature: 0.7
        })
      })

      const result = await response.json()

      if (result.success) {
        setExpertHint(
          result.response ||
            'Think about the fundamental principles of this topic and the key legal provisions.'
        )
      } else {
        setExpertHint(
          'Think about the fundamental principles of this topic and the key legal provisions.'
        )
      }
    } catch (error) {
      setExpertHint('Consider the basic concepts and regulatory framework for this topic.')
    }

    setLifelinesUsed(prev => ({ ...prev, askExpert: true }))
  }

  const phoneAFriend = () => {
    if (lifelinesUsed.phoneFriend) return

    setActiveLifeline('friend')
    setShowLifelineModal(true)

    const currentQ = getQuizQuestions()[currentQuestion]
    const friendTips = [
      'I remember studying this - focus on the key definitions and exceptions!',
      'This type of question usually has a trick - read carefully!',
      'Think about what we practiced in class - the professor emphasized this topic.',
      'Check if there are any recent amendments or changes to this rule.',
      'Consider the practical application - how would this work in real business?',
      'Look for keywords in the question that might give away the answer.',
      'This reminds me of a similar question - think about the underlying principle.'
    ]

    const randomTip = friendTips[Math.floor(Math.random() * friendTips.length)]
    setFriendTip(randomTip)

    setLifelinesUsed(prev => ({ ...prev, phoneFriend: true }))
  }

  const skipQuestion = () => {
    if (lifelinesUsed.skipQuestion) return

    // Mark current question as skipped and move to next
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion]: -1 // -1 indicates skipped
    }))

    setLifelinesUsed(prev => ({ ...prev, skipQuestion: true }))

    if (currentQuestion < getQuizQuestions().length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      handleQuizComplete()
    }

    alert('Question skipped! Moving to the next question.')
  }

  const getQuizQuestions = () => {
    let rawQuestions = []

    // Try different possible structures from API response
    if (quizData?.questions && Array.isArray(quizData.questions)) {
      rawQuestions = quizData.questions
    } else if (quizData?.data?.questions && Array.isArray(quizData.data.questions)) {
      rawQuestions = quizData.data.questions
    } else if (quizData?.mock_test?.questions && Array.isArray(quizData.mock_test.questions)) {
      rawQuestions = quizData.mock_test.questions
    } else if (
      quizData?.entity_type === 'mock_test' &&
      quizData?.questions &&
      Array.isArray(quizData.questions)
    ) {
      rawQuestions = quizData.questions
    } else if (quizData?.config && quizData?.questions && Array.isArray(quizData.questions)) {
      rawQuestions = quizData.questions
    }

    // Normalize and validate questions
    if (rawQuestions.length > 0) {
      const normalizedQuestions = rawQuestions.map((q, index) => {
        const normalized = {
          id: q.id || `q_${index}`,
          question: q.question || `Question ${index + 1}`,
          options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
          correct_answer: q.correct_answer !== undefined ? q.correct_answer : 0,
          explanation: q.explanation || 'No explanation provided',
          difficulty: q.difficulty || 'medium',
          topic: q.topic || 'general'
        }

        // Ensure options is an array with at least 2 items
        if (!Array.isArray(normalized.options) || normalized.options.length < 2) {
          normalized.options = ['Option A', 'Option B', 'Option C', 'Option D']
        }

        return normalized
      })

      return normalizedQuestions
    }
    return [
      {
        question: 'What is the main objective of FTP (Foreign Trade Policy)?',
        options: [
          'To increase imports only',
          'To promote exports and reduce imports',
          'To promote both exports and imports for economic growth',
          'To ban international trade'
        ],
        correct_answer: 2,
        explanation:
          'FTP aims to promote both exports and imports to boost economic growth and competitiveness.'
      },
      {
        question: 'Which scheme under FTP provides duty benefits for export-oriented units?',
        options: ['EPCG Scheme', 'Advance Authorization Scheme', 'MEIS Scheme', 'All of the above'],
        correct_answer: 3,
        explanation: 'All mentioned schemes provide various duty benefits for export promotion.'
      },
      {
        question:
          'Under which section of Customs Act, 1962 is the provision for classification of goods mentioned?',
        options: ['Section 14', 'Section 17', 'Section 28', 'Section 46'],
        correct_answer: 0,
        explanation:
          'Section 14 of Customs Act deals with valuation and classification of imported goods.'
      },
      {
        question: 'What is the time limit for filing GST returns for regular taxpayers?',
        options: [
          '10th of next month',
          '15th of next month',
          '20th of next month',
          '25th of next month'
        ],
        correct_answer: 2,
        explanation:
          'Regular taxpayers must file GSTR-1 by 11th and GSTR-3B by 20th of the following month.'
      },
      {
        question: 'Which export incentive scheme was replaced by RoDTEP?',
        options: ['EPCG', 'MEIS', 'Advance Authorization', 'SEIS'],
        correct_answer: 1,
        explanation:
          'MEIS (Merchandise Exports from India Scheme) was replaced by RoDTEP (Remission of Duties and Taxes on Export Products).'
      },
      {
        question: 'What is the penalty for late filing of GSTR-3B?',
        options: ['Rs. 50 per day', 'Rs. 100 per day', 'Rs. 200 per day', 'Rs. 500 per day'],
        correct_answer: 1,
        explanation:
          'Late filing penalty for GSTR-3B is Rs. 50 per day per act (CGST + SGST = Rs. 100 per day total).'
      },
      {
        question:
          'Under customs valuation, which method is used when transaction value cannot be determined?',
        options: [
          'Computed value method',
          'Deductive value method',
          'Comparable goods method',
          'Residual method'
        ],
        correct_answer: 2,
        explanation:
          'When transaction value is not acceptable, comparable goods method is the next preferred method.'
      },
      {
        question: 'What is the threshold limit for GST registration for goods suppliers?',
        options: ['Rs. 10 lakhs', 'Rs. 20 lakhs', 'Rs. 40 lakhs', 'Rs. 50 lakhs'],
        correct_answer: 1,
        explanation:
          'The threshold limit for GST registration is Rs. 20 lakhs for goods suppliers (Rs. 10 lakhs for special category states).'
      },
      {
        question: 'Which form is used for claiming input tax credit in GST?',
        options: ['GSTR-1', 'GSTR-2A', 'GSTR-2B', 'GSTR-3B'],
        correct_answer: 3,
        explanation:
          'Input tax credit is claimed in GSTR-3B, the monthly return for regular taxpayers.'
      },
      {
        question: 'What is the rate of interest on delayed payment of GST?',
        options: ['12% per annum', '15% per annum', '18% per annum', '24% per annum'],
        correct_answer: 2,
        explanation:
          'Interest on delayed payment of GST is charged at 18% per annum from the due date.'
      }
    ]
  }

  const formatQuizTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Student Progress Data
  const studentData = {
    name: 'Priya Sharma',
    targetExam: 'CA Final Nov 2025',
    daysRemaining: 92,
    syllabusCompleted: 68,
    currentLevel: 'Advanced Learner',
    rank: 23,
    totalStudents: 1247
  }

  const topicProgress = [
    { name: 'GST Basics', progress: 95, confidence: 'high', badge: 'gst-master' },
    { name: 'Input Tax Credit', progress: 87, confidence: 'high', badge: 'itc-expert' },
    { name: 'GST Returns', progress: 72, confidence: 'medium', badge: null },
    { name: 'Customs Valuation', progress: 45, confidence: 'low', badge: null },
    { name: 'FTP Schemes', progress: 23, confidence: 'low', badge: null },
    { name: 'Export Benefits', progress: 12, confidence: 'low', badge: null }
  ]

  const achievements = [
    { id: 1, name: '7-Day Streak', icon: Flame, earned: true, color: 'text-orange-500' },
    { id: 2, name: 'GST Master', icon: Crown, earned: true, color: 'text-yellow-500' },
    { id: 3, name: 'Quiz Champion', icon: Trophy, earned: true, color: 'text-blue-500' },
    { id: 4, name: 'Speed Reader', icon: Zap, earned: false, color: 'text-muted-foreground' },
    { id: 5, name: 'Perfect Score', icon: Star, earned: false, color: 'text-muted-foreground' },
    { id: 6, name: 'Study Warrior', icon: Shield, earned: false, color: 'text-muted-foreground' }
  ]

  const upcomingRevisions = [
    { topic: 'GST Registration', dueDate: 'Today', priority: 'high' },
    { topic: 'Customs Procedures', dueDate: 'Tomorrow', priority: 'medium' },
    { topic: 'Export Documentation', dueDate: 'Aug 5', priority: 'low' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                HERA CA Learning
              </h1>
              <p className="text-muted-foreground">AI-Powered Indirect Tax Mastery Platform</p>
            </div>
          </div>

          {/* Student Info Banner */}
          <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-100 shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <h2 className="text-xl font-semibold text-gray-100">
                  Welcome back, {studentData.name}! 👋
                </h2>
                <p className="text-muted-foreground">
                  {studentData.targetExam} • {studentData.daysRemaining} days remaining
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {studentData.syllabusCompleted}%
                  </div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">#{studentData.rank}</div>
                  <div className="text-sm text-muted-foreground">Rank</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{totalPoints}</div>
                  <div className="text-sm text-muted-foreground">Points</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-background/50 backdrop-blur-sm">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="study" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Study</span>
            </TabsTrigger>
            <TabsTrigger value="practice" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Practice</span>
            </TabsTrigger>
            <TabsTrigger value="syllabus" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Syllabus</span>
            </TabsTrigger>
            <TabsTrigger value="compete" className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              <span className="hidden sm:inline">Compete</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Progress</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                <CardContent className="p-6 text-center">
                  <Flame className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-orange-600">{currentStreak}</div>
                  <div className="text-sm text-orange-700">Day Streak</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6 text-center">
                  <Clock className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-primary">{formatTime(studyTime)}</div>
                  <div className="text-sm text-blue-700">Today's Study</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-6 text-center">
                  <Trophy className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-purple-600">
                    {achievements.filter(a => a.earned).length}
                  </div>
                  <div className="text-sm text-purple-700">Achievements</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6 text-center">
                  <Target className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-green-600">85%</div>
                  <div className="text-sm text-green-700">Avg. Score</div>
                </CardContent>
              </Card>
            </div>

            {/* Study Timer & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Smart Study Timer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-6xl font-mono font-bold text-indigo-600 mb-4">
                      {formatTime(studyTime)}
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        onClick={() => setIsStudying(!isStudying)}
                        className={
                          isStudying
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-green-500 hover:bg-green-600'
                        }
                      >
                        {isStudying ? (
                          <Pause className="h-4 w-4 mr-2" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        {isStudying ? 'Pause' : 'Start'}
                      </Button>
                      <Button variant="outline" onClick={() => setStudyTime(0)}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Today's Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingRevisions.map((revision, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{revision.topic}</div>
                        <div className="text-sm text-muted-foreground">{revision.dueDate}</div>
                      </div>
                      <Badge
                        variant={
                          revision.priority === 'high'
                            ? 'destructive'
                            : revision.priority === 'medium'
                              ? 'default'
                              : 'secondary'
                        }
                      >
                        {revision.priority}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Topic Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Topic Mastery Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topicProgress.map((topic, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{topic.name}</span>
                        {topic.badge && (
                          <Badge variant="outline" className="text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                            {topic.badge}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            topic.confidence === 'high'
                              ? 'default'
                              : topic.confidence === 'medium'
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {topic.confidence}
                        </Badge>
                        <span className="text-sm font-medium">{topic.progress}%</span>
                      </div>
                    </div>
                    <Progress value={topic.progress} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Study Tab */}
          <TabsContent value="study" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* AI-Powered Learning Modes */}
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleLearningMode('concept')}
              >
                <CardContent className="p-6 text-center">
                  <div className="relative">
                    <BookOpen className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Brain className="w-3 h-3 text-foreground" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">AI Concept Mode</h3>
                  <p className="text-muted-foreground mb-4">
                    Master fundamentals with AI-powered explanations and adaptive content
                  </p>
                  <Button className="w-full" disabled={aiLoading}>
                    {aiLoading ? 'AI Thinking...' : 'Start Learning'}
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleLearningMode('story')}
              >
                <CardContent className="p-6 text-center">
                  <div className="relative">
                    <Sparkles className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Brain className="w-3 h-3 text-foreground" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">AI Story Mode</h3>
                  <p className="text-muted-foreground mb-4">
                    Learn through AI-generated real-world scenarios and engaging cases
                  </p>
                  <Button className="w-full" disabled={aiLoading}>
                    {aiLoading ? 'AI Creating...' : 'Tell Me Stories'}
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleLearningMode('drill')}
              >
                <CardContent className="p-6 text-center">
                  <div className="relative">
                    <Target className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <Brain className="w-3 h-3 text-foreground" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">AI Exam Drill</h3>
                  <p className="text-muted-foreground mb-4">
                    Practice with AI-generated ICAI-style questions and adaptive difficulty
                  </p>
                  <Button className="w-full" disabled={aiLoading}>
                    {aiLoading ? 'AI Generating...' : 'Start Drilling'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* AI-Powered Learning Assistant */}
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-100 mb-1">
                      HERA AI Learning Assistant
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      Ask me anything about CA Final Indirect Tax. I can explain concepts, create
                      practice questions, and provide personalized guidance using advanced AI.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAIAssistant('explain')}
                        disabled={aiLoading}
                      >
                        {aiLoading ? 'AI Processing...' : 'Explain a Concept'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAIAssistant('practice')}
                        disabled={aiLoading}
                      >
                        {aiLoading ? 'AI Generating...' : 'Generate Practice Questions'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAIAssistant('analyze')}
                        disabled={aiLoading}
                      >
                        {aiLoading ? 'AI Analyzing...' : 'Analyze My Performance'}
                      </Button>
                    </div>
                    {aiResponse && (
                      <div className="mt-4 p-3 bg-background rounded-lg border text-sm">
                        <p className="text-gray-700">{aiResponse.substring(0, 200)}...</p>
                        <div className="text-xs text-muted-foreground mt-1">
                          Powered by HERA Universal AI
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Practice Tab */}
          <TabsContent value="practice" className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Practice Arena</h2>
              <p className="text-muted-foreground mb-8">
                Choose your practice mode and start improving your scores
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Quiz</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">10 random questions from your weak areas</p>
                  <div className="space-y-2">
                    <Button
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-foreground"
                      onClick={handleQuickQuiz}
                      disabled={aiLoading}
                    >
                      {aiLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Generating via ChatGPT...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Generate Fresh Questions (ChatGPT)
                        </div>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        setAiLoading(true)
                        try {
                          // Force fresh ChatGPT generation
                          const topicId = 'indirect_tax_gst'
                          const freshResponse = await fetch('/api/v1/learning/ca-final', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              action: 'generate_fresh_questions',
                              data: {
                                topic_id: topicId,
                                question_count: 15,
                                difficulty: 'mixed'
                              }
                            })
                          })

                          const result = await freshResponse.json()
                          if (result.success && result.data.questions?.length > 0) {
                            setQuizData({
                              questions: result.data.questions,
                              config: {
                                total_questions: result.data.questions.length,
                                time_limit_minutes: 20,
                                topic_ids: [topicId],
                                source: 'chatgpt_forced_fresh'
                              }
                            })
                            setShowQuiz(true)
                            setTimeout(() => handleBeginQuiz(), 2000)
                            alert(
                              `🚀 Generated ${result.data.questions.length} brand new questions via ChatGPT!`
                            )
                          } else {
                            alert('ChatGPT generation failed. Try the main button.')
                          }
                        } catch (error) {
                          console.error('Fresh generation error:', error)
                          alert('Failed to generate fresh questions')
                        } finally {
                          setAiLoading(false)
                        }
                      }}
                      disabled={aiLoading}
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Force Fresh Questions
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        // Use fallback questions immediately
                        setQuizData({ questions: [] }) // This will trigger fallback
                        setShowQuiz(false)
                        setTimeout(() => handleBeginQuiz(), 100)
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Use Saved Questions
                      </div>
                    </Button>
                  </div>
                  {quizData && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border text-sm">
                      <p className="text-green-700">
                        ✅ Quiz Ready! {getQuizQuestions().length} questions available
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mock Test</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">Full-length practice test (3 hours)</p>
                  <Button className="w-full" onClick={handleMockTest} disabled={aiLoading}>
                    {aiLoading ? 'Creating Test...' : 'Take Mock Test'}
                  </Button>
                  {mockTestData && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border text-sm">
                      <p className="text-blue-700">
                        ✅ Mock Test Ready! {mockTestData.questions?.length || '50'} questions, 3
                        hours
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quiz Display Modal */}
            {showQuiz && quizData && (
              <Card className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-600" />
                      Quick Quiz:{' '}
                      {quizData.config?.topic_ids?.[0]?.replace('_', ' ') || 'CA Final Topics'}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setShowQuiz(false)}>
                      Close
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        Questions:{' '}
                        {quizData.questions?.length || quizData.config?.total_questions || '10'}
                      </span>
                      <span>Time: {quizData.config?.time_limit_minutes || '15'} minutes</span>
                      <span>Difficulty: Mixed</span>
                    </div>
                    <div className="p-4 bg-background rounded-lg">
                      <h4 className="font-semibold text-gray-100 mb-2">Sample Question:</h4>
                      {quizData.questions?.[0] ? (
                        <div>
                          <p className="mb-3">{quizData.questions[0].question}</p>
                          <div className="space-y-1">
                            {quizData.questions[0].options?.map((option, idx) => (
                              <div key={idx} className="p-2 bg-muted rounded text-sm">
                                {String.fromCharCode(65 + idx)}. {option}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">
                          Quiz questions generated successfully! Check console for full details.
                        </p>
                      )}
                    </div>
                    <Button className="w-full" onClick={handleBeginQuiz}>
                      Begin Quiz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mock Test Display Modal */}
            {showMockTest && mockTestData && (
              <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      CA Final Mock Test - Full Length
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setShowMockTest(false)}>
                      Close
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center p-3 bg-background rounded-lg">
                        <div className="font-bold text-primary">
                          {mockTestData.questions?.length ||
                            mockTestData.config?.total_questions ||
                            '50'}
                        </div>
                        <div className="text-muted-foreground">Questions</div>
                      </div>
                      <div className="text-center p-3 bg-background rounded-lg">
                        <div className="font-bold text-primary">
                          {mockTestData.config?.time_limit_minutes || '180'}
                        </div>
                        <div className="text-muted-foreground">Minutes</div>
                      </div>
                      <div className="text-center p-3 bg-background rounded-lg">
                        <div className="font-bold text-primary">4</div>
                        <div className="text-muted-foreground">Topics</div>
                      </div>
                      <div className="text-center p-3 bg-background rounded-lg">
                        <div className="font-bold text-primary">100</div>
                        <div className="text-muted-foreground">Marks</div>
                      </div>
                    </div>
                    <div className="p-4 bg-background rounded-lg">
                      <h4 className="font-semibold text-gray-100 mb-2">Test Coverage:</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">GST Basics</Badge>
                        <Badge variant="outline">Customs Valuation</Badge>
                        <Badge variant="outline">FTP Schemes</Badge>
                        <Badge variant="outline">Export Benefits</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">
                        Full-length CA Final practice test generated with questions across all major
                        topics. Questions include cross-domain universal concepts for comprehensive
                        learning.
                      </p>
                    </div>
                    <Button className="w-full" size="lg">
                      Start 3-Hour Mock Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Quiz Interface */}
            {activeQuiz && (
              <div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-background modal-scroll">
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-6 w-6 text-primary" />
                        CA Final Quick Quiz
                      </CardTitle>
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-mono font-bold text-red-600">
                          ⏰ {formatQuizTime(timeRemaining)}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (
                              window.confirm(
                                'Are you sure you want to exit the quiz? Your progress will be lost.'
                              )
                            ) {
                              setActiveQuiz(false)
                            }
                          }}
                        >
                          Exit Quiz
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        Question {currentQuestion + 1} of {getQuizQuestions().length}
                      </span>
                      <div className="flex items-center gap-4">
                        <span>Topic: FTP Schemes</span>
                        <span>Difficulty: Mixed</span>
                      </div>
                    </div>
                    <Progress
                      value={((currentQuestion + 1) / getQuizQuestions().length) * 100}
                      className="h-2"
                    />
                  </CardHeader>

                  <CardContent className="p-6">
                    {getQuizQuestions().length > 0 ? (
                      currentQuestion < getQuizQuestions().length && (
                        <div className="space-y-6">
                          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                            <h3 className="text-lg font-semibold text-gray-100 mb-4">
                              {getQuizQuestions()[currentQuestion].question}
                            </h3>

                            <div className="space-y-3">
                              {(
                                getQuizQuestions()[currentQuestion].options || ['A', 'B', 'C', 'D']
                              ).map((option, index) => {
                                const isEliminated =
                                  eliminatedOptions[currentQuestion]?.includes(index)
                                const isSelected = selectedAnswers[currentQuestion] === index
                                const isCorrectAnswer =
                                  index === getQuizQuestions()[currentQuestion].correct_answer
                                const shouldDisable =
                                  isEliminated || (showFeedback && isAnswerCorrect)

                                // Determine styling based on feedback state
                                let buttonClass =
                                  'w-full text-left p-4 rounded-lg border-2 transition-all '
                                let circleClass =
                                  'w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-bold '
                                let circleContent = String.fromCharCode(65 + index)

                                if (isEliminated) {
                                  buttonClass +=
                                    'border-red-200 bg-red-50 text-red-400 opacity-50 cursor-not-allowed line-through'
                                  circleClass += 'border-red-300 bg-red-100 text-red-400'
                                  circleContent = '✗'
                                } else if (showFeedback) {
                                  if (isCorrectAnswer) {
                                    // Always show correct answer in green when feedback is shown
                                    buttonClass +=
                                      'border-green-500 bg-green-100 text-green-900 ring-2 ring-green-200'
                                    circleClass += 'border-green-500 bg-green-500 text-foreground'
                                    circleContent = '✓'
                                  } else if (isSelected && !isCorrectAnswer) {
                                    // Show selected wrong answer in red
                                    buttonClass +=
                                      'border-red-500 bg-red-100 text-red-900 ring-2 ring-red-200'
                                    circleClass += 'border-red-500 bg-red-500 text-foreground'
                                    circleContent = '✗'
                                  } else {
                                    // Other options stay neutral
                                    buttonClass += 'border-border bg-muted text-muted-foreground'
                                    circleClass += 'border-border text-muted-foreground'
                                  }
                                } else if (isSelected) {
                                  buttonClass += 'border-blue-500 bg-blue-100 text-blue-900'
                                  circleClass += 'border-blue-500 bg-blue-500 text-foreground'
                                } else {
                                  buttonClass +=
                                    'border-border bg-background hover:border-border hover:bg-muted'
                                  circleClass += 'border-border text-muted-foreground'
                                }

                                return (
                                  <button
                                    key={index}
                                    onClick={() => {
                                      if (!shouldDisable) {
                                        handleAnswerSelect(currentQuestion, index)
                                      }
                                    }}
                                    disabled={shouldDisable}
                                    className={buttonClass}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className={circleClass}>{circleContent}</div>
                                      <span className="flex-1">{option}</span>
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {/* Immediate Feedback Section */}
                          {showFeedback && (
                            <div
                              className={`p-4 rounded-lg border-2 ${
                                isAnswerCorrect
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-red-50 border-red-200'
                              }`}
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    isAnswerCorrect
                                      ? 'bg-green-500 text-foreground'
                                      : 'bg-red-500 text-foreground'
                                  }`}
                                >
                                  {isAnswerCorrect ? '✓' : '✗'}
                                </div>
                                <div>
                                  <h4
                                    className={`font-semibold ${
                                      isAnswerCorrect ? 'text-green-800' : 'text-red-800'
                                    }`}
                                  >
                                    {isAnswerCorrect ? '🎉 Correct!' : '❌ Incorrect'}
                                  </h4>
                                  <p
                                    className={`text-sm ${
                                      isAnswerCorrect ? 'text-green-700' : 'text-red-700'
                                    }`}
                                  >
                                    {isAnswerCorrect
                                      ? 'Great job! Moving to next question...'
                                      : 'Try again! Click the correct answer to continue.'}
                                  </p>
                                </div>
                              </div>

                              <div
                                className={`p-3 rounded-lg ${
                                  isAnswerCorrect ? 'bg-green-100' : 'bg-red-100'
                                }`}
                              >
                                <p
                                  className={`text-sm font-medium mb-2 ${
                                    isAnswerCorrect ? 'text-green-800' : 'text-red-800'
                                  }`}
                                >
                                  Explanation:
                                </p>
                                <p
                                  className={`text-sm ${
                                    isAnswerCorrect ? 'text-green-700' : 'text-red-700'
                                  }`}
                                >
                                  {getQuizQuestions()[currentQuestion].explanation}
                                </p>
                              </div>

                              {isAnswerCorrect && canProceed && (
                                <div className="mt-3 flex items-center justify-between">
                                  <span className="text-sm text-green-600">
                                    Auto-advancing in 2 seconds...
                                  </span>
                                  <Button
                                    size="sm"
                                    onClick={handleNextQuestion}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Next Question →
                                  </Button>
                                </div>
                              )}

                              {!isAnswerCorrect && (
                                <div className="mt-3">
                                  <p className="text-sm text-red-600 font-medium">
                                    💡 Hint: Look for the option highlighted in green above!
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Millionaire-style Lifelines */}
                          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
                            <h4 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                              <Crown className="h-4 w-4" />
                              Lifelines (Who Wants to Be a CA?)
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={use50_50}
                                disabled={lifelinesUsed.fiftyFifty}
                                className={`flex items-center gap-1 ${
                                  lifelinesUsed.fiftyFifty
                                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                    : 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100'
                                }`}
                              >
                                <div className="text-lg">🎯</div>
                                <span className="text-xs">50/50</span>
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={askTheExpert}
                                disabled={lifelinesUsed.askExpert}
                                className={`flex items-center gap-1 ${
                                  lifelinesUsed.askExpert
                                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                    : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                                }`}
                              >
                                <div className="text-lg">🧠</div>
                                <span className="text-xs">Expert</span>
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={phoneAFriend}
                                disabled={lifelinesUsed.phoneFriend}
                                className={`flex items-center gap-1 ${
                                  lifelinesUsed.phoneFriend
                                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                    : 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                                }`}
                              >
                                <div className="text-lg">📞</div>
                                <span className="text-xs">Friend</span>
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={skipQuestion}
                                disabled={lifelinesUsed.skipQuestion}
                                className={`flex items-center gap-1 ${
                                  lifelinesUsed.skipQuestion
                                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                    : 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100'
                                }`}
                              >
                                <div className="text-lg">⏭️</div>
                                <span className="text-xs">Skip</span>
                              </Button>
                            </div>
                          </div>

                          {/* Navigation and Progress */}
                          <div className="flex items-center justify-between">
                            <Button
                              variant="outline"
                              onClick={handlePreviousQuestion}
                              disabled={currentQuestion === 0 || (showFeedback && !isAnswerCorrect)}
                            >
                              Previous
                            </Button>

                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {Object.keys(selectedAnswers).length} of {getQuizQuestions().length}{' '}
                                answered
                              </span>
                              {showFeedback && (
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    isAnswerCorrect
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {isAnswerCorrect ? '✓ Correct' : '✗ Try again'}
                                </span>
                              )}
                            </div>

                            {currentQuestion === getQuizQuestions().length - 1 ? (
                              <Button
                                onClick={handleQuizComplete}
                                className={
                                  isAnswerCorrect && showFeedback
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : ''
                                }
                                disabled={!canProceed && showFeedback}
                              >
                                Complete Quiz
                              </Button>
                            ) : (
                              <Button
                                onClick={handleNextQuestion}
                                disabled={
                                  selectedAnswers[currentQuestion] === undefined ||
                                  (showFeedback && !isAnswerCorrect)
                                }
                                className={
                                  isAnswerCorrect && showFeedback
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : ''
                                }
                              >
                                Next
                              </Button>
                            )}
                          </div>

                          {/* Question Navigator */}
                          <div className="border-t pt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                              Question Navigator:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {getQuizQuestions().map((_, index) => (
                                <button
                                  key={index}
                                  onClick={() => setCurrentQuestion(index)}
                                  className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                                    index === currentQuestion
                                      ? 'bg-blue-600 text-foreground'
                                      : selectedAnswers[index] !== undefined
                                        ? 'bg-green-100 text-green-800 border border-green-300'
                                        : 'bg-muted text-muted-foreground hover:bg-gray-700'
                                  }`}
                                >
                                  {index + 1}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="text-center p-8">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                            No Questions Available
                          </h3>
                          <p className="text-yellow-700 mb-4">
                            The quiz questions are still being generated or there was an issue
                            loading them.
                          </p>
                          <div className="space-y-2">
                            <Button
                              onClick={() => {
                                console.log('🔄 Using fallback questions immediately')
                                setQuizData(null) // This will force fallback
                                setActiveQuiz(false)
                                setTimeout(() => handleBeginQuiz(), 500)
                              }}
                            >
                              Use Practice Questions
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                console.log('Retrying quiz generation...')
                                setActiveQuiz(false)
                                setTimeout(() => handleQuickQuiz(), 1000)
                              }}
                            >
                              Retry API Generation
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Lifelines Modal */}
            {showLifelineModal && (
              <div className="fixed inset-0 bg-background bg-opacity-75 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-md bg-background">
                  <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-foreground">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {activeLifeline === 'expert' && (
                          <>
                            <Brain className="h-5 w-5" /> Ask the Expert
                          </>
                        )}
                        {activeLifeline === 'friend' && (
                          <>
                            <Users className="h-5 w-5" /> Phone a Friend
                          </>
                        )}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowLifelineModal(false)}
                        className="text-foreground hover:bg-background hover:bg-opacity-20"
                      >
                        ✕
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {activeLifeline === 'expert' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <GraduationCap className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-100">CA Expert</h3>
                            <p className="text-sm text-muted-foreground">Professional guidance</p>
                          </div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <p className="text-blue-800 italic">
                            "{expertHint || 'Loading expert advice...'}"
                          </p>
                        </div>
                        <Button onClick={() => setShowLifelineModal(false)} className="w-full">
                          Got it, thanks!
                        </Button>
                      </div>
                    )}

                    {activeLifeline === 'friend' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-100">Study Buddy</h3>
                            <p className="text-sm text-muted-foreground">Your virtual friend</p>
                          </div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <p className="text-green-800">📞 "Hey! {friendTip}"</p>
                        </div>
                        <Button onClick={() => setShowLifelineModal(false)} className="w-full">
                          Thanks buddy!
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Compete Tab */}
          <TabsContent value="compete" className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Competition Zone</h2>
              <p className="text-muted-foreground mb-8">
                Challenge other students and climb the leaderboard
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Memory Duel
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">Challenge a friend to a quick knowledge duel</p>
                  <Button className="w-full">Find Opponent</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-foreground font-bold">
                          1
                        </div>
                        <span>Rahul Kumar</span>
                      </div>
                      <span className="font-bold">3,240 pts</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-foreground font-bold">
                          2
                        </div>
                        <span>Anita Sharma</span>
                      </div>
                      <span className="font-bold">3,100 pts</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg border-2 border-orange-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-foreground font-bold">
                          23
                        </div>
                        <span className="font-semibold">You</span>
                      </div>
                      <span className="font-bold">{totalPoints} pts</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Syllabus Tab - CA Schema Integration */}
          <TabsContent value="syllabus" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CA Final Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    CA Final Overview
                    {syllabusLoading && <div className="animate-spin">⏳</div>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {syllabusLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-center">
                        <div className="animate-spin text-2xl mb-2">📚</div>
                        <p>Loading CA syllabus from universal schema...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-primary">8</div>
                          <div className="text-sm text-muted-foreground">Total Papers</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">3×</div>
                          <div className="text-sm text-muted-foreground">Yearly Attempts</div>
                        </div>
                      </div>

                      {examSchedule && (
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
                          <h4 className="font-semibold text-purple-700 mb-2">
                            📅 2025 Exam Schedule
                          </h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>
                              <strong>Frequency:</strong>{' '}
                              {examSchedule.frequency?.replace('_', ' ') || 'Thrice yearly'}
                            </p>
                            <p>
                              <strong>Months:</strong>{' '}
                              {examSchedule.months?.join(', ') || 'January, May, September'}
                            </p>
                            <p>
                              <strong>Next Dates:</strong>{' '}
                              {examSchedule.next_dates?.slice(0, 2).join(', ') || 'Jan 15, May 15'}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                        <div className="text-sm text-yellow-800">
                          <strong>🎯 HERA Universal Schema:</strong> Data loaded from core_entities
                          and core_dynamic_data tables.
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Paper 8 - Our Focus */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Paper 8 - Indirect Tax (Our Focus)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border-l-4 border-orange-500">
                      <h4 className="font-semibold text-orange-700 mb-2">
                        Paper 8 - Indirect Tax Laws
                      </h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          <strong>Max Marks:</strong> 100
                        </p>
                        <p>
                          <strong>Duration:</strong> 3.5 hours
                        </p>
                        <p>
                          <strong>Complexity:</strong> High
                        </p>
                      </div>
                    </div>

                    {/* Smart Code Integration */}
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm">
                        <strong className="text-blue-700">🤖 Smart Code:</strong>
                        <code className="ml-2 px-2 py-1 bg-blue-100 rounded text-xs">
                          HERA.EDU.CA.FINAL.P8.INDIRECT_TAX.v1
                        </code>
                      </div>
                    </div>

                    {/* Section-wise breakdown */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">Section-wise Breakdown:</h4>

                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-blue-700">
                            GST (Goods & Services Tax)
                          </span>
                          <Badge className="bg-blue-600 text-foreground">60%</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">60 marks • High priority</div>
                      </div>

                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-green-700">Customs Law</span>
                          <Badge className="bg-green-600 text-foreground">25%</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">25 marks • Calculation heavy</div>
                      </div>

                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-purple-700">Foreign Trade Policy</span>
                          <Badge className="bg-purple-600 text-foreground">15%</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">15 marks • Easy scoring</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Universal Schema Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  HERA Universal Schema Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <div className="text-2xl mb-2">✅</div>
                    <div className="font-semibold text-green-700">Core Entities</div>
                    <div className="text-sm text-muted-foreground">CA frameworks stored</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <div className="text-2xl mb-2">✅</div>
                    <div className="font-semibold text-green-700">Dynamic Data</div>
                    <div className="text-sm text-muted-foreground">Syllabus loaded</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <div className="text-2xl mb-2">✅</div>
                    <div className="font-semibold text-green-700">Smart Codes</div>
                    <div className="text-sm text-muted-foreground">AI classification</div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <h4 className="font-semibold text-indigo-700 mb-2">
                    🏗️ Universal Architecture Benefits
                  </h4>
                  <div className="text-sm text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>• No separate CA database needed</div>
                    <div>• Automatic cross-subject correlations</div>
                    <div>• Universal question bank access</div>
                    <div>• Scalable to all CA levels</div>
                    <div>• Real-time syllabus updates</div>
                    <div>• AI-powered smart routing</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Achievement Gallery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {achievements.map(achievement => (
                    <div
                      key={achievement.id}
                      className={`text-center p-4 rounded-lg border-2 ${achievement.earned ? 'bg-gradient-to-b from-yellow-50 to-orange-50 border-yellow-200' : 'bg-muted border-border'}`}
                    >
                      <achievement.icon className={`w-12 h-12 mx-auto mb-2 ${achievement.color}`} />
                      <div className="text-sm font-medium">{achievement.name}</div>
                      {achievement.earned && (
                        <CheckCircle className="w-4 h-4 text-green-500 mx-auto mt-1" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
