import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isDemoMode } from '@/lib/demo-guard'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const entityId = params.id
    const isDemo = isDemoMode(orgId)

    // In production, would fetch from engagement_journey entity type
    // For now, return demo data
    if (isDemo) {
      const mockHistory = generateMockHistory()

      return NextResponse.json({
        journey_id: `journey-${entityId}`,
        stage: 'Active',
        stage_ordinal: 3,
        score: 75,
        score_trend: 'up',
        last_activity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        next_best_actions: [
          'Schedule quarterly business review',
          'Share latest impact report',
          'Invite to upcoming roundtable',
          'Update contact information'
        ],
        history: mockHistory
      })
    }

    // Production logic would be:
    // 1. Find engagement_journey where subject_entity_id = entityId
    // 2. Get current stage from relationships
    // 3. Calculate score from transactions
    // 4. Determine trend from score history
    // 5. Get next best actions from rules

    return NextResponse.json({
      stage: 'Discover',
      stage_ordinal: 1,
      score: 25,
      score_trend: 'stable',
      last_activity: new Date().toISOString(),
      next_best_actions: ['Initial outreach', 'Share program information'],
      history: []
    })
  } catch (error) {
    console.error('Error fetching engagement data:', error)
    return NextResponse.json({ error: 'Failed to fetch engagement data' }, { status: 500 })
  }
}

function generateMockHistory() {
  const stages = [
    { stage: 'Discover', ordinal: 1, baseScore: 25 },
    { stage: 'Nurture', ordinal: 2, baseScore: 45 },
    { stage: 'Active', ordinal: 3, baseScore: 70 }
  ]

  const history = []
  const now = new Date()
  let currentScore = 10

  // Generate 90 days of history
  for (let i = 89; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)

    // Simulate score changes
    if (i % 7 === 0) {
      // Weekly changes
      currentScore += Math.floor(Math.random() * 5) - 1
      currentScore = Math.max(0, Math.min(100, currentScore))
    }

    // Determine stage based on score
    let stage = stages[0]
    if (currentScore >= 60) stage = stages[2]
    else if (currentScore >= 40) stage = stages[1]

    history.push({
      date: date.toISOString(),
      score: currentScore,
      stage: stage.stage,
      stage_ordinal: stage.ordinal,
      events:
        i % 10 === 0
          ? [
              {
                type: ['email_opened', 'event_attended', 'form_submitted'][
                  Math.floor(Math.random() * 3)
                ],
                description: 'Engagement activity'
              }
            ]
          : []
    })
  }

  return history
}
