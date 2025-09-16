import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET /api/v1/readiness/debug - Debug endpoint to check data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId =
      searchParams.get('organization_id') || '550e8400-e29b-41d4-a716-446655440000'

    // Get all sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'readiness_assessment')
      .order('created_at', { ascending: false })

    if (sessionsError) {
      return NextResponse.json(
        { error: 'Failed to fetch sessions', details: sessionsError },
        { status: 500 }
      )
    }

    // Get all answer lines for these sessions
    const sessionIds = sessions?.map(s => s.id) || []
    const { data: allAnswers, error: answersError } = await supabase
      .from('universal_transaction_lines')
      .select('*')
      .in('transaction_id', sessionIds)
      .order('created_at', { ascending: false })

    if (answersError) {
      return NextResponse.json(
        { error: 'Failed to fetch answers', details: answersError },
        { status: 500 }
      )
    }

    // Group answers by session
    const answersBySession: Record<string, any[]> = {}
    allAnswers?.forEach(answer => {
      if (!answersBySession[answer.transaction_id]) {
        answersBySession[answer.transaction_id] = []
      }
      answersBySession[answer.transaction_id].push(answer)
    })

    // Build detailed response
    const debugData = {
      organization_id: organizationId,
      total_sessions: sessions?.length || 0,
      total_answers: allAnswers?.length || 0,
      sessions_with_details: sessions?.map(session => ({
        id: session.id,
        status: session.transaction_status,
        created_at: session.created_at,
        metadata: session.metadata,
        answer_count: answersBySession[session.id]?.length || 0,
        sample_answers: answersBySession[session.id]?.slice(0, 3).map(a => ({
          question: a.description,
          answer: a.line_data?.answer_value,
          category: a.line_data?.category,
          score: a.unit_amount
        }))
      })),
      sessions_without_answers: sessions
        ?.filter(s => !answersBySession[s.id] || answersBySession[s.id].length === 0)
        .map(s => s.id),
      raw_sample_answer: allAnswers?.[0]
    }

    return NextResponse.json({
      success: true,
      debug: debugData
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: 'Debug endpoint failed', details: String(error) },
      { status: 500 }
    )
  }
}
