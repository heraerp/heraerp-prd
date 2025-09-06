import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'
import { verifyAuth } from '@/lib/auth/verify-auth'

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

    const orgId = organization_id || 'demo-org-123'
    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    universalApi.setOrganizationId(orgId)

    // Get current session to check line number
    const existingLines = await universalApi.readTransactionLines({
      transaction_id: sessionId,
      organization_id: orgId
    })

    const lineNumber = (existingLines.data?.length || 0) + 1

    // Create answer as transaction line
    const answer = await universalApi.createTransactionLine({
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
    })

    // Update session progress
    const session = await universalApi.readTransaction(sessionId)
    if (session.data) {
      const currentProgress = session.data.metadata?.completionRate || 0
      const totalQuestions = session.data.metadata?.totalQuestions || 100
      const newProgress = Math.min(100, currentProgress + (100 / totalQuestions))
      
      await universalApi.updateTransaction(sessionId, {
        metadata: {
          ...session.data.metadata,
          completionRate: newProgress,
          last_answered: new Date().toISOString()
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: answer.data
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
    const organizationId = searchParams.get('organization_id') || 'demo-org-123'
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    universalApi.setOrganizationId(organizationId)

    const answers = await universalApi.readTransactionLines({
      transaction_id: sessionId,
      organization_id: organizationId,
      order_by: 'line_number',
      order: 'asc'
    })

    return NextResponse.json({
      success: true,
      data: answers.data || []
    })
  } catch (error) {
    console.error('Failed to fetch answers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch answers' },
      { status: 500 }
    )
  }
}