import { NextRequest, NextResponse } from 'next/server'

// Mock workpapers data for demonstration - Cyprus Trading Ltd focus
const MOCK_WORKPAPERS = [
  {
    id: 'wp_001',
    name: 'Planning Memorandum',
    section: 'planning',
    type: 'memo',
    status: 'approved',
    owner: 'Sarah Johnson',
    reviewer: 'John Smith',
    created_date: '2025-01-10',
    last_modified: '2025-01-15',
    size: '2.4 MB',
    comments: 3,
    locked: true,
    starred: true,
    client: 'Cyprus Trading Ltd',
    engagement_year: '2025',
    version: '1.0',
    entity_type: 'audit_workpaper',
    smart_code: 'HERA.AUD.WP.PLANNING.MEMO.v1'
  },
  {
    id: 'wp_002',
    name: 'Revenue Cycle Testing',
    section: 'substantive',
    type: 'test',
    status: 'in_review',
    owner: 'Michael Chen',
    reviewer: 'Sarah Johnson',
    created_date: '2025-01-15',
    last_modified: '2025-02-01',
    size: '5.7 MB',
    comments: 7,
    locked: false,
    starred: false,
    client: 'Cyprus Trading Ltd',
    engagement_year: '2025',
    version: '2.1',
    entity_type: 'audit_workpaper',
    smart_code: 'HERA.AUD.WP.SUBSTANTIVE.REVENUE.v1'
  },
  {
    id: 'wp_003',
    name: 'Cash and Bank Confirmations',
    section: 'substantive',
    type: 'confirmation',
    status: 'requires_update',
    owner: 'Emily Davis',
    reviewer: 'Sarah Johnson',
    created_date: '2025-01-20',
    last_modified: '2025-01-28',
    size: '1.2 MB',
    comments: 12,
    locked: false,
    starred: true,
    client: 'Cyprus Trading Ltd',
    engagement_year: '2025',
    version: '1.3',
    entity_type: 'audit_workpaper',
    smart_code: 'HERA.AUD.WP.SUBSTANTIVE.CASH.v1'
  },
  {
    id: 'wp_004',
    name: 'Inventory Count Procedures',
    section: 'controls',
    type: 'test',
    status: 'draft',
    owner: 'David Wilson',
    created_date: '2025-01-25',
    last_modified: '2025-02-03',
    size: '890 KB',
    comments: 2,
    locked: false,
    starred: false,
    client: 'Cyprus Trading Ltd',
    engagement_year: '2025',
    version: '0.5',
    entity_type: 'audit_workpaper',
    smart_code: 'HERA.AUD.WP.CONTROLS.INVENTORY.v1'
  },
  {
    id: 'wp_005',
    name: 'Risk Assessment Matrix',
    section: 'risk',
    type: 'schedule',
    status: 'reviewed',
    owner: 'Sarah Johnson',
    reviewer: 'John Smith',
    created_date: '2025-01-12',
    last_modified: '2025-01-20',
    size: '3.1 MB',
    comments: 5,
    locked: true,
    starred: true,
    client: 'Cyprus Trading Ltd',
    engagement_year: '2025',
    version: '1.2',
    entity_type: 'audit_workpaper',
    smart_code: 'HERA.AUD.WP.RISK.ASSESSMENT.v1'
  },
  {
    id: 'wp_006',
    name: 'Management Letter Points',
    section: 'completion',
    type: 'memo',
    status: 'draft',
    owner: 'John Smith',
    created_date: '2025-02-01',
    last_modified: '2025-02-04',
    size: '654 KB',
    comments: 1,
    locked: false,
    starred: false,
    client: 'Cyprus Trading Ltd',
    engagement_year: '2025',
    version: '0.8',
    entity_type: 'audit_workpaper',
    smart_code: 'HERA.AUD.WP.COMPLETION.MGMT_LETTER.v1'
  },
  {
    id: 'wp_007',
    name: 'Accounts Payable Confirmations',
    section: 'substantive',
    type: 'confirmation',
    status: 'reviewed',
    owner: 'Emily Davis',
    reviewer: 'Michael Chen',
    created_date: '2025-01-18',
    last_modified: '2025-01-30',
    size: '2.8 MB',
    comments: 4,
    locked: false,
    starred: false,
    client: 'Cyprus Trading Ltd',
    engagement_year: '2025',
    version: '1.1',
    entity_type: 'audit_workpaper',
    smart_code: 'HERA.AUD.WP.SUBSTANTIVE.PAYABLES.v1'
  },
  {
    id: 'wp_008',
    name: 'Internal Controls Documentation',
    section: 'controls',
    type: 'schedule',
    status: 'approved',
    owner: 'Michael Chen',
    reviewer: 'John Smith',
    created_date: '2025-01-08',
    last_modified: '2025-01-25',
    size: '4.2 MB',
    comments: 8,
    locked: true,
    starred: true,
    client: 'Cyprus Trading Ltd',
    engagement_year: '2025',
    version: '2.0',
    entity_type: 'audit_workpaper',
    smart_code: 'HERA.AUD.WP.CONTROLS.DOCUMENTATION.v1'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const section = searchParams.get('section')
    const status = searchParams.get('status')
    const client = searchParams.get('client')

    // Get specific workpaper by ID
    if (id) {
      const workpaper = MOCK_WORKPAPERS.find(wp => wp.id === id)
      if (!workpaper) {
        return NextResponse.json(
          {
            success: false,
            message: 'Workpaper not found'
          },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          workpaper: {
            ...workpaper,
            organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945'
          }
        }
      })
    }

    // Filter workpapers
    let filteredWorkpapers = MOCK_WORKPAPERS

    if (section && section !== 'all') {
      filteredWorkpapers = filteredWorkpapers.filter(wp => wp.section === section)
    }

    if (status && status !== 'all') {
      filteredWorkpapers = filteredWorkpapers.filter(wp => wp.status === status)
    }

    if (client) {
      filteredWorkpapers = filteredWorkpapers.filter(wp =>
        wp.client.toLowerCase().includes(client.toLowerCase())
      )
    }

    // Add HERA universal format
    const workpapers = filteredWorkpapers.map(wp => ({
      ...wp,
      organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945'
    }))

    // Calculate statistics
    const stats = {
      total: MOCK_WORKPAPERS.length,
      by_status: {
        draft: MOCK_WORKPAPERS.filter(wp => wp.status === 'draft').length,
        in_review: MOCK_WORKPAPERS.filter(wp => wp.status === 'in_review').length,
        reviewed: MOCK_WORKPAPERS.filter(wp => wp.status === 'reviewed').length,
        approved: MOCK_WORKPAPERS.filter(wp => wp.status === 'approved').length,
        requires_update: MOCK_WORKPAPERS.filter(wp => wp.status === 'requires_update').length
      },
      by_section: {
        planning: MOCK_WORKPAPERS.filter(wp => wp.section === 'planning').length,
        risk: MOCK_WORKPAPERS.filter(wp => wp.section === 'risk').length,
        controls: MOCK_WORKPAPERS.filter(wp => wp.section === 'controls').length,
        substantive: MOCK_WORKPAPERS.filter(wp => wp.section === 'substantive').length,
        completion: MOCK_WORKPAPERS.filter(wp => wp.section === 'completion').length,
        review: MOCK_WORKPAPERS.filter(wp => wp.section === 'review').length
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        workpapers,
        total: filteredWorkpapers.length,
        stats
      }
    })
  } catch (error) {
    console.error('Error fetching workpapers:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch workpapers'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    if (action === 'create_workpaper') {
      // In production, this would:
      // 1. Create core_entities record with entity_type='audit_workpaper'
      // 2. Store workpaper details in core_dynamic_data
      // 3. Create universal_transactions for audit trail
      // 4. Link to engagement via core_relationships

      const newWorkpaper = {
        id: `wp_${Date.now()}`,
        ...data,
        status: 'draft',
        version: '0.1',
        comments: 0,
        locked: false,
        starred: false,
        created_date: new Date().toISOString().split('T')[0],
        last_modified: new Date().toISOString().split('T')[0],
        entity_type: 'audit_workpaper',
        organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
        smart_code: `HERA.AUD.WP.${data.section?.toUpperCase()}.${data.type?.toUpperCase()}.v1`
      }

      // Add to mock data (in production, save to HERA database)
      MOCK_WORKPAPERS.push(newWorkpaper)

      console.log('✅ Workpaper created:', newWorkpaper.name)

      return NextResponse.json({
        success: true,
        message: 'Workpaper created successfully',
        data: newWorkpaper
      })
    }

    if (action === 'update_workpaper') {
      const { id, ...updates } = data
      const workpaperIndex = MOCK_WORKPAPERS.findIndex(wp => wp.id === id)

      if (workpaperIndex === -1) {
        return NextResponse.json(
          {
            success: false,
            message: 'Workpaper not found'
          },
          { status: 404 }
        )
      }

      // Update workpaper
      MOCK_WORKPAPERS[workpaperIndex] = {
        ...MOCK_WORKPAPERS[workpaperIndex],
        ...updates,
        last_modified: new Date().toISOString().split('T')[0]
      }

      return NextResponse.json({
        success: true,
        message: 'Workpaper updated successfully',
        data: MOCK_WORKPAPERS[workpaperIndex]
      })
    }

    if (action === 'add_comment') {
      const { workpaper_id, comment } = data

      // In production, would save comment to database
      console.log(`Comment added to workpaper ${workpaper_id}:`, comment)

      return NextResponse.json({
        success: true,
        message: 'Comment added successfully'
      })
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Invalid action'
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error processing workpaper request:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process request'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, updates } = body

    const workpaperIndex = MOCK_WORKPAPERS.findIndex(wp => wp.id === id)
    if (workpaperIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: 'Workpaper not found'
        },
        { status: 404 }
      )
    }

    // Update workpaper
    MOCK_WORKPAPERS[workpaperIndex] = {
      ...MOCK_WORKPAPERS[workpaperIndex],
      ...updates,
      last_modified: new Date().toISOString().split('T')[0]
    }

    return NextResponse.json({
      success: true,
      message: 'Workpaper updated successfully',
      data: MOCK_WORKPAPERS[workpaperIndex]
    })
  } catch (error) {
    console.error('Error updating workpaper:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update workpaper'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Workpaper ID required'
        },
        { status: 400 }
      )
    }

    const workpaperIndex = MOCK_WORKPAPERS.findIndex(wp => wp.id === id)
    if (workpaperIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: 'Workpaper not found'
        },
        { status: 404 }
      )
    }

    // Remove workpaper
    const deletedWorkpaper = MOCK_WORKPAPERS.splice(workpaperIndex, 1)[0]

    return NextResponse.json({
      success: true,
      message: 'Workpaper deleted successfully',
      data: deletedWorkpaper
    })
  } catch (error) {
    console.error('Error deleting workpaper:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete workpaper'
      },
      { status: 500 }
    )
  }
}
