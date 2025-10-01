import { NextRequest, NextResponse } from 'next/server'

// HERA Smart Codes for Question Generation
const QUESTION_SMART_CODES = {
  MCQ: 'HERA.CA.EDU.QUEST.MCQ.V1',
  DESCRIPTIVE: 'HERA.CA.EDU.QUEST.DESC.V1',
  CASE_STUDY: 'HERA.CA.EDU.QUEST.CASE.V1',
  TRUE_FALSE: 'HERA.CA.EDU.QUEST.TF.V1'
}

// AI-Generated CA Final Questions Database
const questionsDatabase = {
  GST_BASICS: [
    {
      question_id: 'Q_GST_001',
      smart_code: QUESTION_SMART_CODES.MCQ,
      topic: 'GST Registration',
      difficulty: 'medium',
      question:
        'What is the threshold limit for GST registration for goods suppliers in states other than special category states?',
      options: ['Rs. 20 lakhs', 'Rs. 40 lakhs', 'Rs. 10 lakhs', 'Rs. 75 lakhs'],
      correct_answer: 1,
      explanation:
        'As per Section 22 of CGST Act, the threshold limit for GST registration for suppliers of goods in states other than special category states is Rs. 40 lakhs.',
      legal_reference: 'Section 22, CGST Act 2017',
      ai_metadata: {
        success_rate: 0.65,
        avg_time_seconds: 45,
        common_mistakes: [
          'Confusing with service threshold',
          'Mixing special category states limit'
        ]
      }
    },
    {
      question_id: 'Q_GST_002',
      smart_code: QUESTION_SMART_CODES.CASE_STUDY,
      topic: 'Input Tax Credit',
      difficulty: 'hard',
      question:
        'ABC Ltd. purchased machinery worth Rs. 10 lakhs (including GST @ 18%) from XYZ Ltd. on 15th March 2025. The invoice was received on 20th March 2025. Payment was made on 30th April 2025. When can ABC Ltd. claim ITC on this purchase?',
      options: [
        'March 2025 (month of purchase)',
        'April 2025 (month of payment)',
        'May 2025 (month following payment)',
        'Cannot claim ITC as payment is beyond 180 days'
      ],
      correct_answer: 1,
      explanation:
        'As per Section 16(2) of CGST Act, ITC can be claimed only when invoice is received, goods/services are received, and payment is made to supplier within 180 days. Since payment was made in April, ITC can be claimed in April 2025.',
      legal_reference: 'Section 16(2), CGST Act 2017',
      ai_metadata: {
        success_rate: 0.42,
        avg_time_seconds: 120,
        common_mistakes: ['Claiming ITC immediately upon purchase', 'Forgetting payment condition']
      }
    }
  ],

  CUSTOMS_VALUATION: [
    {
      question_id: 'Q_CUS_001',
      smart_code: QUESTION_SMART_CODES.MCQ,
      topic: 'Transaction Value',
      difficulty: 'medium',
      question:
        'Which of the following is NOT included in transaction value for customs valuation?',
      options: [
        'Buying commission paid by importer',
        'Selling commission paid by exporter',
        'Cost of transportation to place of importation',
        'Loading and handling charges'
      ],
      correct_answer: 1,
      explanation:
        'Selling commission paid by exporter is not included in transaction value as it is not borne by the buyer (importer). Only buying commission is included as per Customs Valuation Rules.',
      legal_reference: 'Rule 10, Customs Valuation Rules 2007',
      ai_metadata: {
        success_rate: 0.58,
        avg_time_seconds: 60,
        common_mistakes: ['Confusing buying vs selling commission', 'Including all commissions']
      }
    }
  ],

  FTP_SCHEMES: [
    {
      question_id: 'Q_FTP_001',
      smart_code: QUESTION_SMART_CODES.TRUE_FALSE,
      topic: 'Advance Authorization',
      difficulty: 'easy',
      question: 'Advance Authorization can be issued for both physical exports and deemed exports.',
      correct_answer: true,
      explanation:
        'As per FTP 2023, Advance Authorization can be issued for both physical exports and deemed exports like supply to EOU, SEZ units, etc.',
      legal_reference: 'Para 4.1.3, FTP 2023',
      ai_metadata: {
        success_rate: 0.78,
        avg_time_seconds: 30,
        common_mistakes: ['Thinking it applies only to physical exports']
      }
    }
  ]
}

// AI-Powered Question Generation
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const topic = searchParams.get('topic')
  const difficulty = searchParams.get('difficulty') || 'medium'
  const type = searchParams.get('type') || 'mcq'
  const count = parseInt(searchParams.get('count') || '5')
  const studentId = searchParams.get('student_id')

  try {
    // Simulate AI-powered question selection based on student's weak areas
    let selectedQuestions: any[] = []

    if (topic && questionsDatabase[topic as keyof typeof questionsDatabase]) {
      const topicQuestions = questionsDatabase[topic as keyof typeof questionsDatabase]
      selectedQuestions = topicQuestions
        .filter(q => difficulty === 'all' || q.difficulty === difficulty)
        .slice(0, count)
    } else {
      // Random selection from all topics for mixed practice
      const allQuestions = Object.values(questionsDatabase).flat()
      selectedQuestions = allQuestions
        .filter(q => difficulty === 'all' || q.difficulty === difficulty)
        .sort(() => Math.random() - 0.5)
        .slice(0, count)
    }

    // AI Enhancement: Personalize question order based on student performance
    if (studentId) {
      selectedQuestions = selectedQuestions.sort((a, b) => {
        // Questions with lower success rates come first (harder questions for improvement)
        return a.ai_metadata.success_rate - b.ai_metadata.success_rate
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        questions: selectedQuestions,
        total_count: selectedQuestions.length,
        ai_personalization: studentId ? 'applied' : 'none',
        difficulty_distribution: {
          easy: selectedQuestions.filter(q => q.difficulty === 'easy').length,
          medium: selectedQuestions.filter(q => q.difficulty === 'medium').length,
          hard: selectedQuestions.filter(q => q.difficulty === 'hard').length
        }
      },
      metadata: {
        generated_by: 'HERA_AI_QUESTION_ENGINE',
        smart_code_system: 'HERA.CA.EDU.QUEST.*',
        personalized_for: studentId || 'anonymous'
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate questions',
        details: error instanceof Error ? error.message : 'Unknown error',
        smart_code: 'HERA.CA.EDU.ERROR.QUESTION_GEN.v1',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Submit Quiz Answers and Get AI Feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, quiz_id, answers, time_taken } = body

    // AI-Powered Answer Analysis
    let totalQuestions = answers.length
    let correctAnswers = 0
    let detailedFeedback: any[] = []

    // Simulate answer checking and generate detailed feedback
    answers.forEach((answer: any, index: number) => {
      const isCorrect = answer.selected_answer === answer.correct_answer
      if (isCorrect) correctAnswers++

      detailedFeedback.push({
        question_id: answer.question_id,
        is_correct: isCorrect,
        selected_option: answer.selected_answer,
        correct_option: answer.correct_answer,
        explanation: answer.explanation,
        legal_reference: answer.legal_reference,
        ai_insight: isCorrect
          ? "Great! You've mastered this concept."
          : 'Review the legal provision and practice similar questions.'
      })
    })

    const accuracy = correctAnswers / totalQuestions
    const averageTime = time_taken / totalQuestions

    // AI Performance Analysis
    const performanceAnalysis = {
      overall_score: Math.round(accuracy * 100),
      accuracy_rating:
        accuracy >= 0.8 ? 'excellent' : accuracy >= 0.6 ? 'good' : 'needs_improvement',
      speed_rating: averageTime <= 60 ? 'fast' : averageTime <= 90 ? 'optimal' : 'slow',
      strengths: correctAnswers > totalQuestions * 0.7 ? ['Good conceptual understanding'] : [],
      weaknesses: accuracy < 0.6 ? ['Need more practice with legal provisions'] : [],
      next_recommended_action:
        accuracy < 0.6
          ? 'concept_revision'
          : accuracy < 0.8
            ? 'more_practice'
            : 'advance_to_mock_test'
    }

    // Generate Smart Code Transaction
    const quizResult = {
      transaction_id: `QUIZ_${Date.now()}`,
      smart_code: 'HERA.CA.EDU.TXN.QUIZ_COMPLETE.v1',
      student_id,
      quiz_id,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      accuracy: accuracy,
      time_taken_seconds: time_taken,
      performance_analysis: performanceAnalysis,
      detailed_feedback: detailedFeedback,
      submitted_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: quizResult,
      message: 'Quiz submitted successfully',
      smart_code: 'HERA.CA.EDU.TXN.QUIZ_COMPLETE.v1',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process quiz submission',
        details: error instanceof Error ? error.message : 'Unknown error',
        smart_code: 'HERA.CA.EDU.ERROR.QUIZ_SUBMIT.v1',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
