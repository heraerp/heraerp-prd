import { NextRequest, NextResponse } from 'next/server'
import { seedCivicFlowCases, clearCivicFlowCases } from '@/lib/civicflow/seed-cases'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

export async function POST(request: NextRequest) {
  try {
    // Check organization ID from header
    const orgId = request.headers.get('X-Organization-Id')

    // Only allow seeding for the CivicFlow demo organization
    if (orgId !== CIVICFLOW_ORG_ID) {
      return NextResponse.json(
        { error: 'Seed data only available for CivicFlow demo organization' },
        { status: 403 }
      )
    }

    const { action } = await request.json()

    if (action === 'clear') {
      await clearCivicFlowCases()
      return NextResponse.json({
        success: true,
        message: 'All cases cleared successfully'
      })
    }

    // Default action is to seed
    const cases = await seedCivicFlowCases()

    return NextResponse.json({
      success: true,
      message: 'Seed data created successfully',
      cases_created: cases?.length || 0
    })
  } catch (error) {
    console.error('Seed data error:', error)
    return NextResponse.json({ error: 'Failed to create seed data' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'CivicFlow seed endpoint',
    usage: {
      method: 'POST',
      body: {
        action: 'seed | clear'
      },
      headers: {
        'X-Organization-Id': CIVICFLOW_ORG_ID
      }
    }
  })
}
