import { NextRequest, NextResponse } from 'next/server'
import { BOMSeeder } from '@/lib/universal-ui/bom-seeder'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { organizationId, action } = body

  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  const seeder = new BOMSeeder(organizationId)

  try {
    switch (action) {
      case 'seed':
        const result = await seeder.seedBOMData()

        if (!result.success) {
          return NextResponse.json(
            {
              error: result.error || 'Seeding failed'
            },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'BOM demo data created successfully',
          summary: {
            products: result.products.length,
            components: result.components.length,
            relationships: result.relationships.length,
            transactions: result.transactions.length
          }
        })

      case 'cleanup':
        const cleanupResult = await seeder.cleanupBOMData()

        if (!cleanupResult.success) {
          return NextResponse.json(
            {
              error: cleanupResult.error || 'Cleanup failed'
            },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'BOM demo data cleaned up successfully'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('BOM seeding API error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}
