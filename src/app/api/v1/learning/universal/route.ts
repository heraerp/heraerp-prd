/**
 * 🎓 HERA Universal Learning API - All Domains Hybrid Architecture
 *
 * Single endpoint that intelligently handles ALL educational domains:
 * - Mathematics, Physics, Chemistry, English (Direct AI)
 * - CA, Medicine, Law (PDF Processing)
 * - Engineering, Business, Technology (Hybrid)
 *
 * Routes: POST /api/v1/learning/universal
 */

import { NextRequest, NextResponse } from 'next/server'
import { heraRouter, LearningRequest } from '@/src/lib/universal-learning/HERAUniversalLearningRouter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, domain, topic, student_query, student_level, files, urgency, ...otherData } =
      body

    console.log(`🎓 HERA Universal Learning Request: ${action} for ${domain}/${topic}`)

    switch (action) {
      case 'learn':
      case 'explain':
      case 'teach':
      case 'process_learning':
        return await handleLearningRequest({
          domain,
          topic,
          student_query,
          student_level,
          files,
          urgency
        })

      case 'generate_questions':
        return await handleQuestionGeneration({
          domain,
          topic,
          difficulty: otherData.difficulty || 'medium',
          count: otherData.count || 5,
          student_level
        })

      case 'create_study_plan':
        return await handleStudyPlanCreation({
          domain,
          student_level,
          time_available: otherData.time_available,
          weak_areas: otherData.weak_areas || [],
          goals: otherData.goals || []
        })

      case 'analyze_performance':
        return await handlePerformanceAnalysis({
          domain,
          student_data: otherData.student_data,
          recent_activities: otherData.recent_activities || []
        })

      case 'get_domain_info':
        return await handleDomainInfo(domain)

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
            available_actions: [
              'learn',
              'explain',
              'teach',
              'process_learning',
              'generate_questions',
              'create_study_plan',
              'analyze_performance',
              'get_domain_info'
            ]
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Universal Learning API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Handle learning requests using the HERA Router
 */
async function handleLearningRequest(requestData: Partial<LearningRequest>) {
  try {
    if (!requestData.domain || !requestData.student_query) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: domain and student_query'
        },
        { status: 400 }
      )
    }

    const learningRequest: LearningRequest = {
      domain: requestData.domain,
      topic: requestData.topic || 'general',
      student_query: requestData.student_query,
      student_level: requestData.student_level || 'intermediate',
      files: requestData.files || [],
      urgency: requestData.urgency || 'medium'
    }

    // Use HERA Router to process the request
    const result = await heraRouter.processLearningRequest(learningRequest)

    return NextResponse.json({
      success: true,
      action: 'learning_processed',
      domain: requestData.domain,
      approach_used: result.approach,
      strategy: result.strategy,
      data: result.data,
      optimization: result.optimization,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Learning request processing error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process learning request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Generate questions using domain-appropriate approach
 */
async function handleQuestionGeneration(params: {
  domain: string
  topic: string
  difficulty: string
  count: number
  student_level?: string
}) {
  try {
    const { domain, topic, difficulty, count, student_level } = params

    // Use router to determine optimal approach for question generation
    const strategy = await heraRouter.determineOptimalStrategy({
      domain,
      topic,
      student_query: `Generate ${count} ${difficulty} questions on ${topic}`,
      student_level: student_level || 'intermediate'
    })

    console.log(`🎯 Question Generation: Using ${strategy.approach} for ${domain}`)

    let questionsResult

    switch (strategy.approach) {
      case 'direct_ai':
        // Direct AI question generation for stable domains
        questionsResult = await generateQuestionsDirectAI(
          domain,
          topic,
          difficulty,
          count,
          strategy
        )
        break

      case 'pdf_processing':
        // PDF-based question generation for regulatory domains
        questionsResult = await generateQuestionsPDF(domain, topic, difficulty, count, strategy)
        break

      case 'hybrid':
        // Hybrid question generation
        questionsResult = await generateQuestionsHybrid(domain, topic, difficulty, count, strategy)
        break

      default:
        throw new Error(`Unknown strategy: ${strategy.approach}`)
    }

    return NextResponse.json({
      success: true,
      action: 'questions_generated',
      domain,
      topic,
      difficulty,
      count: questionsResult.questions?.length || count,
      approach_used: strategy.approach,
      strategy: strategy,
      data: {
        questions: questionsResult.questions || [],
        metadata: {
          generated_at: new Date().toISOString(),
          approach: strategy.approach,
          smart_code: strategy.smart_code,
          source: questionsResult.source || 'ai_generated'
        }
      }
    })
  } catch (error) {
    console.error('Question generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate questions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Generate questions using Direct AI approach
 */
async function generateQuestionsDirectAI(
  domain: string,
  topic: string,
  difficulty: string,
  count: number,
  strategy: any
) {
  const response = await fetch('/api/v1/ai/universal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'generate_questions',
      smart_code: strategy.smart_code,
      task_type: 'question_generation',
      domain,
      topic,
      prompt: `Generate ${count} multiple choice questions on ${topic} in ${domain}:
        
        Requirements:
        - Difficulty: ${difficulty}
        - Domain: ${domain}
        - Topic: ${topic}
        - Format: Multiple choice with 4 options
        - Include explanations for correct answers
        - Focus on conceptual understanding
        - Make questions educational and engaging
        
        Return as JSON array with format:
        {
          "questions": [
            {
              "question": "Question text",
              "options": ["A", "B", "C", "D"],
              "correct_answer": 0,
              "explanation": "Why this answer is correct",
              "difficulty": "${difficulty}",
              "topic": "${topic}"
            }
          ]
        }`,
      max_tokens: 2000,
      temperature: 0.7,
      fallback_enabled: true
    })
  })

  const result = await response.json()

  if (result.success) {
    // Try to parse AI response as JSON
    let questions = []
    try {
      const aiContent = result.data?.content || result.response || ''
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        questions = parsed.questions || []
      }
    } catch (parseError) {
      console.log('Could not parse AI response as JSON, using fallback questions')
      questions = createFallbackQuestions(domain, topic, difficulty, count)
    }

    return {
      questions,
      source: 'direct_ai',
      provider: result.data?.provider_used || 'openai'
    }
  }

  // Fallback questions if AI fails
  return {
    questions: createFallbackQuestions(domain, topic, difficulty, count),
    source: 'fallback'
  }
}

/**
 * Generate questions using PDF processing approach
 */
async function generateQuestionsPDF(
  domain: string,
  topic: string,
  difficulty: string,
  count: number,
  strategy: any
) {
  // For now, route to universal-learning API for PDF processing
  // In future, this would process actual PDF documents

  const response = await fetch('/api/v1/universal-learning', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'generate_questions',
      domain,
      topic,
      difficulty,
      count,
      options: {
        regulatory_focus: true,
        latest_updates: true,
        document_based: true,
        smart_code: strategy.smart_code
      }
    })
  })

  const result = await response.json()

  if (result.success) {
    return {
      questions: result.data?.questions || [],
      source: 'pdf_processing',
      document_source: result.data?.document_source || 'regulatory_database'
    }
  }

  // Fallback to direct AI if PDF processing fails
  return await generateQuestionsDirectAI(domain, topic, difficulty, count, strategy)
}

/**
 * Generate questions using Hybrid approach
 */
async function generateQuestionsHybrid(
  domain: string,
  topic: string,
  difficulty: string,
  count: number,
  strategy: any
) {
  const halfCount = Math.ceil(count / 2)

  try {
    // Generate half questions via direct AI (fundamentals)
    const directAIStrategy = {
      ...strategy,
      approach: 'direct_ai',
      smart_code: `HERA.EDU.${domain.toUpperCase()}.LRN.AI.DIRECT.v1`
    }
    const fundamentalQuestions = await generateQuestionsDirectAI(
      domain,
      topic,
      difficulty,
      halfCount,
      directAIStrategy
    )

    // Generate half questions via PDF processing (current applications)
    const pdfStrategy = {
      ...strategy,
      approach: 'pdf_processing',
      smart_code: `HERA.EDU.${domain.toUpperCase()}.CNT.AI.PROCESS.v1`
    }
    const currentQuestions = await generateQuestionsPDF(
      domain,
      topic,
      difficulty,
      count - halfCount,
      pdfStrategy
    )

    return {
      questions: [...(fundamentalQuestions.questions || []), ...(currentQuestions.questions || [])],
      source: 'hybrid',
      sources: {
        fundamental: fundamentalQuestions.source,
        current: currentQuestions.source
      }
    }
  } catch (error) {
    console.error('Hybrid question generation error:', error)

    // Fallback to direct AI only
    return await generateQuestionsDirectAI(domain, topic, difficulty, count, strategy)
  }
}

/**
 * Create fallback questions for any domain
 */
function createFallbackQuestions(domain: string, topic: string, difficulty: string, count: number) {
  const questions = []

  for (let i = 0; i < count; i++) {
    questions.push({
      id: `fallback_${domain}_${i + 1}`,
      question: `${domain} ${topic} practice question ${i + 1}`,
      options: [
        `Option A for ${topic}`,
        `Option B for ${topic}`,
        `Option C for ${topic}`,
        `Option D for ${topic}`
      ],
      correct_answer: i % 4, // Rotate correct answers
      explanation: `This is a practice question for ${topic} in ${domain}. The correct answer demonstrates key concepts in this subject area.`,
      difficulty,
      topic,
      domain,
      source: 'fallback'
    })
  }

  return questions
}

/**
 * Handle study plan creation
 */
async function handleStudyPlanCreation(params: {
  domain: string
  student_level?: string
  time_available?: string
  weak_areas: string[]
  goals: string[]
}) {
  // This would use the router to create domain-appropriate study plans
  return NextResponse.json({
    success: true,
    action: 'study_plan_created',
    message: 'Study plan creation - implementation in progress',
    data: {
      domain: params.domain,
      recommendations: [
        'Focus on weak areas first',
        'Use appropriate learning approach for domain',
        'Regular practice and assessment'
      ]
    }
  })
}

/**
 * Handle performance analysis
 */
async function handlePerformanceAnalysis(params: {
  domain: string
  student_data: any
  recent_activities: any[]
}) {
  // This would analyze performance using domain-appropriate metrics
  return NextResponse.json({
    success: true,
    action: 'performance_analyzed',
    message: 'Performance analysis - implementation in progress',
    data: {
      domain: params.domain,
      analysis: 'Performance analysis results would be generated here'
    }
  })
}

/**
 * Get domain information and characteristics
 */
async function handleDomainInfo(domain: string) {
  try {
    const characteristics = heraRouter.getDomainCharacteristics(domain)

    if (!characteristics) {
      return NextResponse.json(
        {
          success: false,
          error: `Domain '${domain}' not found`,
          available_domains: [
            'MATH',
            'PHYSICS',
            'CHEMISTRY',
            'ENGLISH',
            'HISTORY',
            'CA',
            'MEDICINE',
            'LAW',
            'BUSINESS_COMPLIANCE',
            'ENGINEERING',
            'BUSINESS',
            'TECHNOLOGY'
          ]
        },
        { status: 404 }
      )
    }

    const strategy = await heraRouter.determineOptimalStrategy({
      domain,
      topic: 'general',
      student_query: 'general information'
    })

    return NextResponse.json({
      success: true,
      domain: domain.toUpperCase(),
      characteristics,
      optimal_strategy: strategy,
      recommendations: {
        learning_approach: strategy.approach,
        expected_response_time: strategy.response_time,
        cost_factor: strategy.cost_factor,
        advantages: strategy.advantages
      }
    })
  } catch (error) {
    console.error('Domain info error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get domain information'
      },
      { status: 500 }
    )
  }
}

// GET endpoint for domain information
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')
  const action = searchParams.get('action') || 'info'

  if (!domain) {
    return NextResponse.json(
      {
        success: false,
        error: 'Domain parameter required',
        usage: '/api/v1/learning/universal?domain=MATH&action=info'
      },
      { status: 400 }
    )
  }

  switch (action) {
    case 'info':
    case 'characteristics':
      return await handleDomainInfo(domain)

    default:
      return NextResponse.json(
        {
          success: false,
          error: `Unknown GET action: ${action}`,
          available_actions: ['info', 'characteristics']
        },
        { status: 400 }
      )
  }
}
