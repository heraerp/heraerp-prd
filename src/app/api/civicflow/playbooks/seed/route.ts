import { NextRequest, NextResponse } from 'next/server'
import { seedCivicFlowPlaybooks, clearCivicFlowPlaybooks } from '@/lib/civicflow/seed-playbooks'

export async function POST(request: NextRequest) {
  console.log('📌 Playbooks seed API called')

  try {
    const orgId = request.headers.get('X-Organization-Id')
    console.log('📌 Organization ID:', orgId)

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY not configured')
      return NextResponse.json(
        {
          error:
            'Service role key not configured. Please add SUPABASE_SERVICE_ROLE_KEY to your .env file.'
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { action } = body
    console.log('📌 Action requested:', action)

    if (action === 'seed') {
      const playbooks = await seedCivicFlowPlaybooks()
      return NextResponse.json({
        success: true,
        message: 'Demo playbooks created successfully',
        playbooks_created: playbooks.length
      })
    } else if (action === 'clear') {
      await clearCivicFlowPlaybooks()
      return NextResponse.json({
        success: true,
        message: 'All playbooks cleared successfully'
      })
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "seed" or "clear"' }, { status: 400 })
    }
  } catch (error) {
    console.error('Playbook seed error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    )
  }
}
