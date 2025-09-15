import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Sample questions for testing
const sampleQuestions = [
  { id: 'q1', text: 'Do you have a defined business strategy?', category: 'strategy' },
  { id: 'q2', text: 'Are your business processes documented?', category: 'processes' },
  { id: 'q3', text: 'Do you have a data management system?', category: 'data_management' },
  { id: 'q4', text: 'Is your team trained on current systems?', category: 'people' },
  { id: 'q5', text: 'Do you have integration capabilities?', category: 'technology' },
  { id: 'q6', text: 'Are your KPIs clearly defined?', category: 'strategy' },
  { id: 'q7', text: 'Do you have change management processes?', category: 'change_management' },
  { id: 'q8', text: 'Is data security a priority?', category: 'data_management' }
]

// POST /api/v1/readiness/populate-test-data - Populate test answers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, organization_id } = body

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const orgId = organization_id || '550e8400-e29b-41d4-a716-446655440000'

    // Create sample answers
    const answerPromises = sampleQuestions.map(async (question, index) => {
      const answerValue = index % 3 === 0 ? 'yes' : index % 3 === 1 ? 'partial' : 'no'
      const score = answerValue === 'yes' ? 100 : answerValue === 'partial' ? 50 : 0

      const answerData = {
        organization_id: orgId,
        transaction_id: session_id,
        line_number: index + 1,
        line_entity_id: question.id,
        line_type: 'multiple_choice',
        description: question.text,
        quantity: 1,
        unit_amount: score,
        line_amount: score,
        smart_code: 'HERA.ERP.Readiness.Answer.Line.V1',
        line_data: {
          question_id: question.id,
          answer_value: answerValue,
          answer_type: 'multiple_choice',
          category: question.category,
          answered_at: new Date().toISOString(),
          user_id: 'demo-user'
        }
      }

      return supabase.from('universal_transaction_lines').insert([answerData]).select().single()
    })

    const results = await Promise.all(answerPromises)

    // Calculate category scores
    const categoryScores: Record<string, { total: number; count: number; score: number }> = {}
    sampleQuestions.forEach((q, i) => {
      const score = i % 3 === 0 ? 100 : i % 3 === 1 ? 50 : 0
      if (!categoryScores[q.category]) {
        categoryScores[q.category] = { total: 0, count: 0, score: 0 }
      }
      categoryScores[q.category].total += score
      categoryScores[q.category].count += 1
      categoryScores[q.category].score = Math.round(
        categoryScores[q.category].total / categoryScores[q.category].count
      )
    })

    // Update session with completion data
    const overallScore = Math.round(
      Object.values(categoryScores).reduce((sum, cat) => sum + cat.score, 0) /
        Object.keys(categoryScores).length
    )

    await supabase
      .from('universal_transactions')
      .update({
        transaction_status: 'completed',
        total_amount: overallScore,
        metadata: {
          completionRate: 100,
          totalQuestions: sampleQuestions.length,
          overallScore,
          categoryScores,
          completed_at: new Date().toISOString(),
          user_email: 'test@example.com',
          industry_type: 'general'
        }
      })
      .eq('id', session_id)

    // Add AI insights
    const insights = {
      overallScore,
      readinessLevel: overallScore >= 80 ? 'High' : overallScore >= 60 ? 'Medium' : 'Low',
      strengths: ['strategy', 'technology'],
      improvements: ['data_management', 'change_management'],
      recommendations: [
        'Focus on improving data management practices',
        'Implement formal change management procedures',
        'Continue building on strong strategic foundation'
      ],
      categoryScores
    }

    await supabase.from('core_dynamic_data').insert([
      {
        organization_id: orgId,
        entity_id: session_id,
        field_name: 'ai_insights',
        field_value_text: JSON.stringify(insights),
        smart_code: 'HERA.ERP.Readiness.Insights.V1'
      }
    ])

    return NextResponse.json({
      success: true,
      message: 'Test data populated successfully',
      data: {
        answers_created: results.length,
        overall_score: overallScore,
        session_status: 'completed'
      }
    })
  } catch (error) {
    console.error('Failed to populate test data:', error)
    return NextResponse.json(
      { error: 'Failed to populate test data', details: String(error) },
      { status: 500 }
    )
  }
}
