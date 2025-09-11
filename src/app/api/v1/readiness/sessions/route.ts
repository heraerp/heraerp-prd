import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAuth } from '@/lib/auth/verify-auth'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET /api/v1/readiness/sessions - List all sessions
export async function GET(request: NextRequest) {
  try {
    // Authentication temporarily disabled for testing
    // const authResult = await verifyAuth(request)
    // if (!authResult.success || !authResult.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id') || '550e8400-e29b-41d4-a716-446655440000'
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Fetch questionnaire sessions (stored as transactions)
    const { data: sessions, error } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'readiness_assessment')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Failed to fetch sessions:', error)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    // For each session, fetch the answer lines
    const sessionsWithAnswers = await Promise.all(
      (sessions || []).map(async (session) => {
        console.log(`📋 Fetching answers for session ${session.id}...`)
        
        // Get transaction lines for this session
        const { data: answers, error: answersError } = await supabase
          .from('universal_transaction_lines')
          .select('*')
          .eq('transaction_id', session.id)
          .order('line_number', { ascending: true })
        
        if (answersError) {
          console.error(`❌ Error fetching answers for session ${session.id}:`, answersError)
        } else {
          console.log(`✅ Found ${answers?.length || 0} answers for session ${session.id}`)
          if (answers && answers.length > 0) {
            console.log(`📝 First answer sample:`, {
              line_number: answers[0].line_number,
              description: answers[0].description,
              line_data: answers[0].line_data,
              unit_amount: answers[0].unit_amount
            })
          }
        }
        
        // Get AI insights from dynamic data
        const { data: insightsData } = await supabase
          .from('core_dynamic_data')
          .select('*')
          .eq('entity_id', session.id)
          .eq('field_name', 'ai_insights')
          .single()

        let insights = null
        try {
          insights = insightsData?.field_value_text ? JSON.parse(insightsData.field_value_text) : null
        } catch (e) {
          console.warn('Failed to parse AI insights for session', session.id)
        }

        const sessionWithAnswers = {
          ...session,
          answers: answers || [],
          insights,
          completionRate: (session.metadata as any)?.completionRate || 0,
          totalQuestions: (session.metadata as any)?.totalQuestions || 0
        }
        
        console.log(`📊 Session ${session.id} summary:`, {
          status: session.transaction_status,
          answers_count: sessionWithAnswers.answers.length,
          has_insights: !!insights,
          completion_rate: sessionWithAnswers.completionRate
        })
        
        return sessionWithAnswers
      })
    )

    return NextResponse.json({
      success: true,
      data: sessionsWithAnswers
    })
  } catch (error) {
    console.error('Failed to fetch sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

// POST /api/v1/readiness/sessions - Create new session
export async function POST(request: NextRequest) {
  try {
    // Authentication temporarily disabled for testing
    // const authResult = await verifyAuth(request)
    // if (!authResult.success || !authResult.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { organization_id, template_id, industry_type } = body

    const orgId = organization_id || '550e8400-e29b-41d4-a716-446655440000'
    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Create session as a transaction
    const transactionCode = `READINESS-${Date.now()}`
    const sessionData = {
      organization_id: orgId,
      transaction_type: 'readiness_assessment',
      transaction_code: transactionCode,
      transaction_date: new Date().toISOString(),
      total_amount: 0, // Score will be updated as answers come in
      transaction_status: 'in_progress',
      smart_code: 'HERA.ERP.Readiness.Session.Transaction.V1',
      metadata: {
        template_id,
        industry_type: industry_type || 'general',
        started_at: new Date().toISOString(),
        completionRate: 0,
        totalQuestions: 0, // Will be updated
        user_id: 'demo-user',
        user_email: 'demo@example.com'
      }
    }

    const { data: session, error } = await supabase
      .from('universal_transactions')
      .insert([sessionData])
      .select()
      .single()

    if (error || !session) {
      console.error('Failed to create session:', error)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: session
    })
  } catch (error) {
    console.error('Failed to create session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}