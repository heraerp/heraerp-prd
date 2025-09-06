import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAuth } from '@/lib/auth/verify-auth'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// POST /api/v1/readiness/sessions/:sessionId/answers - Save answer
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    // Authentication temporarily disabled for testing
    // const authResult = await verifyAuth(request)
    // if (!authResult.success || !authResult.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const sessionId = params.sessionId
    const body = await request.json()
    const { 
      question_id, 
      question_text, 
      answer_value, 
      answer_type, 
      category,
      organization_id 
    } = body

    const orgId = organization_id || '550e8400-e29b-41d4-a716-446655440000'
    console.log('📝 Saving answer with org ID:', orgId)
    
    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Get current session to check line number
    const { data: existingLines } = await supabase
      .from('universal_transaction_lines')
      .select('line_number')
      .eq('transaction_id', sessionId)
      .order('line_number', { ascending: false })
      .limit(1)

    const lineNumber = (existingLines && existingLines[0]?.line_number || 0) + 1

    // Create answer as transaction line
    const answerData = {
      organization_id: orgId,
      transaction_id: sessionId,
      line_number: lineNumber,
      line_entity_id: question_id, // Link to question entity if exists
      line_type: answer_type,
      description: question_text,
      quantity: 1,
      unit_amount: answer_value === 'yes' ? 100 : answer_value === 'partial' ? 50 : 0,
      line_amount: answer_value === 'yes' ? 100 : answer_value === 'partial' ? 50 : 0,
      smart_code: 'HERA.ERP.Readiness.Answer.Line.V1',
      line_data: {
        question_id,
        answer_value,
        answer_type,
        category,
        answered_at: new Date().toISOString(),
        user_id: 'demo-user'
      }
    }

    const { data: answer, error: answerError } = await supabase
      .from('universal_transaction_lines')
      .insert([answerData])
      .select()
      .single()

    if (answerError) {
      console.error('Failed to save answer:', answerError)
      return NextResponse.json(
        { error: 'Failed to save answer' },
        { status: 500 }
      )
    }

    // Update session progress
    const { data: session } = await supabase
      .from('universal_transactions')
      .select('metadata')
      .eq('id', sessionId)
      .single()

    if (session) {
      const currentProgress = session.metadata?.completionRate || 0
      const totalQuestions = session.metadata?.totalQuestions || 100
      const newProgress = Math.min(100, currentProgress + (100 / totalQuestions))
      
      await supabase
        .from('universal_transactions')
        .update({
          metadata: {
            ...session.metadata,
            completionRate: newProgress,
            last_answered: new Date().toISOString()
          }
        })
        .eq('id', sessionId)
    }

    return NextResponse.json({
      success: true,
      data: answer
    })
  } catch (error) {
    console.error('Failed to save answer:', error)
    return NextResponse.json(
      { error: 'Failed to save answer' },
      { status: 500 }
    )
  }
}

// GET /api/v1/readiness/sessions/:sessionId/answers - Get all answers for session
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    // Authentication temporarily disabled for testing
    // const authResult = await verifyAuth(request)
    // if (!authResult.success || !authResult.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const sessionId = params.sessionId
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id') || '550e8400-e29b-41d4-a716-446655440000'
    
    console.log('📖 Fetching answers for session:', sessionId, 'org:', organizationId)
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const { data: answers, error } = await supabase
      .from('universal_transaction_lines')
      .select('*')
      .eq('transaction_id', sessionId)
      .eq('organization_id', organizationId)
      .order('line_number', { ascending: true })

    if (error) {
      console.error('Failed to fetch answers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch answers' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: answers || []
    })
  } catch (error) {
    console.error('Failed to fetch answers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch answers' },
      { status: 500 }
    )
  }
}