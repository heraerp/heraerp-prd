import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'
import { verifyAuth } from '@/lib/auth/verify-auth'

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

    universalApi.setOrganizationId(organizationId)

    // Fetch questionnaire sessions (stored as transactions)
    console.log('🔍 Fetching transactions for org:', organizationId)
    const allTransactions = await universalApi.getTransactions(organizationId)
    console.log('📊 All transactions response:', allTransactions)
    
    // Filter for readiness assessments
    const sessions = {
      success: allTransactions.success,
      data: allTransactions.success && allTransactions.data ? 
        allTransactions.data.filter((t: any) => t.transaction_type === 'readiness_assessment') : 
        [],
      error: allTransactions.error
    }
    
    console.log('📝 Filtered sessions:', sessions.data?.length || 0)

    // For each session, fetch the answer lines
    const sessionsWithAnswers = await Promise.all(
      (sessions.data || []).map(async (session) => {
        try {
          // Get all transaction lines and filter for this session
          const allLines = await universalApi.read('universal_transaction_lines', undefined, organizationId)
          const answers = {
            success: allLines.success,
            data: allLines.success && allLines.data ? 
              allLines.data.filter((line: any) => line.transaction_id === session.id) : 
              []
          }
          
          // Get AI insights from dynamic data (simplified for now)
          let insights = null
          try {
            // Query dynamic data for AI insights
            const dynamicData = await universalApi.read('core_dynamic_data', undefined, organizationId)
            const insightsData = dynamicData.success && dynamicData.data ? 
              dynamicData.data.find((d: any) => d.entity_id === session.id && d.field_name === 'ai_insights') : 
              null
            insights = insightsData?.field_value_text ? JSON.parse(insightsData.field_value_text) : null
          } catch (e) {
            console.warn('Failed to parse AI insights for session', session.id, e)
          }

          return {
            ...session,
            answers: answers.data || [],
            insights,
            completionRate: session.metadata?.completionRate || 0,
            totalQuestions: session.metadata?.totalQuestions || 0
          }
        } catch (error) {
          console.error('Error processing session', session.id, error)
          return {
            ...session,
            answers: [],
            insights: null,
            completionRate: 0,
            totalQuestions: 0
          }
        }
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

    universalApi.setOrganizationId(orgId)

    // Create session as a transaction
    console.log('🔄 Creating readiness session with org:', orgId)
    const transactionCode = `READINESS-${Date.now()}`
    const session = await universalApi.createTransaction({
      organization_id: orgId,
      transaction_type: 'readiness_assessment',
      transaction_code: transactionCode,
      transaction_date: new Date().toISOString(),
      total_amount: 0, // Score will be updated as answers come in
      status: 'in_progress',
      smart_code: 'HERA.GEN.READINESS.ASSESS.SESSION.v1',
      metadata: {
        template_id,
        industry_type: industry_type || 'general',
        started_at: new Date().toISOString(),
        completionRate: 0,
        totalQuestions: 0, // Will be updated
        user_id: 'demo-user',
        user_email: 'demo@example.com'
      }
    })

    console.log('🔍 Universal API response:', JSON.stringify(session, null, 2))

    // Check if session creation was successful
    if (!session || !session.success || !session.data || !session.data.id) {
      console.error('❌ Session creation failed:', session)
      throw new Error(`Failed to create session in database: ${session?.error || 'Unknown error'}`)
    }

    const sessionId = session.data.id

    // Ensure we return the expected format
    const responseData = {
      id: sessionId,
      transaction_id: sessionId,
      transaction_date: session.data?.transaction_date || new Date().toISOString(),
      smart_code: 'HERA.ERP.READINESS.SESSION.CREATED.v1',
      template_id,
      industry_type: industry_type || 'general',
      status: 'in_progress',
      ...session.data
    }

    console.log('✅ Session created successfully:', responseData.id)

    return NextResponse.json({
      success: true,
      data: responseData
    })
  } catch (error) {
    console.error('Failed to create session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}