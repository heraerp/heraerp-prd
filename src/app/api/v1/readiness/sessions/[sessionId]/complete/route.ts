import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAuth } from '@/src/lib/auth/verify-auth'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// POST /api/v1/readiness/sessions/:sessionId/complete - Complete session and generate insights
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Authentication temporarily disabled for testing
    // const authResult = await verifyAuth(request)
    // if (!authResult.success || !authResult.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { sessionId } = await params
    const body = await request.json()
    const { organization_id } = body

    const orgId = organization_id || 'demo-org-123'
    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Get all answers for scoring
    const { data: answers, error: answersError } = await supabase
      .from('universal_transaction_lines')
      .select('*')
      .eq('transaction_id', sessionId)
      .eq('organization_id', orgId)

    if (answersError) {
      console.error('Failed to fetch answers:', answersError)
      return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 })
    }

    // Calculate scores by category
    const categoryScores: Record<string, { total: number; count: number; score: number }> = {}
    let totalScore = 0
    let totalQuestions = 0

    for (const answer of answers || []) {
      const category = answer.line_data?.category || 'general'
      const score = answer.unit_amount || 0

      if (!categoryScores[category]) {
        categoryScores[category] = { total: 0, count: 0, score: 0 }
      }

      categoryScores[category].total += score
      categoryScores[category].count += 1
      totalScore += score
      totalQuestions += 1
    }

    // Calculate average scores per category
    for (const category in categoryScores) {
      categoryScores[category].score =
        categoryScores[category].count > 0
          ? Math.round(categoryScores[category].total / categoryScores[category].count)
          : 0
    }

    const overallScore = totalQuestions > 0 ? Math.round(totalScore / totalQuestions) : 0

    // Generate AI insights (in production, this would call AI service)
    const insights = {
      overallScore,
      categoryScores,
      readinessLevel: overallScore >= 80 ? 'High' : overallScore >= 60 ? 'Medium' : 'Low',
      strengths: Object.entries(categoryScores)
        .filter(([_, data]) => data.score >= 80)
        .map(([cat]) => cat),
      improvements: Object.entries(categoryScores)
        .filter(([_, data]) => data.score < 60)
        .map(([cat]) => cat),
      recommendations: generateRecommendations(categoryScores, overallScore),
      generated_at: new Date().toISOString()
    }

    // Update session with completion data
    const { error: updateError } = await supabase
      .from('universal_transactions')
      .update({
        transaction_status: 'completed',
        total_amount: overallScore, // Store overall score as amount
        metadata: {
          completionRate: 100,
          completed_at: new Date().toISOString(),
          totalQuestions,
          overallScore,
          categoryScores
        }
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Failed to update session:', updateError)
    }

    // Store AI insights as dynamic data
    const { error: insightsError } = await supabase.from('core_dynamic_data').insert([
      {
        organization_id: orgId,
        entity_id: sessionId,
        field_name: 'ai_insights',
        field_value_text: JSON.stringify(insights),
        smart_code: 'HERA.ERP.Readiness.AI.Analysis.V1'
      }
    ])

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        insights,
        overallScore,
        categoryScores
      }
    })
  } catch (error) {
    console.error('Failed to complete session:', error)
    return NextResponse.json({ error: 'Failed to complete session' }, { status: 500 })
  }
}

function generateRecommendations(
  categoryScores: Record<string, any>,
  overallScore: number
): string[] {
  const recommendations: string[] = []

  // Overall recommendations
  if (overallScore >= 80) {
    recommendations.push(
      'Your organization shows strong ERP readiness. Consider starting with advanced modules.'
    )
  } else if (overallScore >= 60) {
    recommendations.push(
      'Your organization has good foundational readiness. Focus on strengthening weak areas before full implementation.'
    )
  } else {
    recommendations.push(
      'Your organization needs preparation before ERP implementation. Start with basic process standardization.'
    )
  }

  // Category-specific recommendations
  for (const [category, data] of Object.entries(categoryScores)) {
    if (data.score < 60) {
      switch (category) {
        case 'technology':
          recommendations.push('Invest in IT infrastructure and training before ERP deployment.')
          break
        case 'process':
          recommendations.push(
            'Document and standardize business processes for better ERP alignment.'
          )
          break
        case 'people':
          recommendations.push('Develop change management and training programs for staff.')
          break
        case 'data':
          recommendations.push('Improve data quality and governance practices.')
          break
        case 'strategy':
          recommendations.push('Align ERP implementation with clear business objectives.')
          break
      }
    }
  }

  return recommendations
}
