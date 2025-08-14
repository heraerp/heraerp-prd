import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'
    const organizationId = searchParams.get('organization_id')
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    universalApi.setOrganizationId(organizationId)

    switch (action) {
      case 'list':
        const entities = await universalApi.getEntities({
          entity_type: 'ap',
          limit: parseInt(searchParams.get('limit') || '50'),
          offset: parseInt(searchParams.get('offset') || '0')
        })
        return NextResponse.json({ success: true, data: entities })

      case 'get':
        const entityId = searchParams.get('id')
        if (!entityId) {
          return NextResponse.json({ error: 'Entity ID is required' }, { status: 400 })
        }
        
        const entity = await universalApi.getEntity(entityId)
        return NextResponse.json({ success: true, data: entity })

      case 'stats':
        const stats = await this.calculateStats(organizationId)
        return NextResponse.json({ success: true, data: stats })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('AP API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data, organizationId } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    universalApi.setOrganizationId(organizationId)

    switch (action) {
      case 'create':
        if (!data) {
          return NextResponse.json({ error: 'Data is required' }, { status: 400 })
        }

        const newEntity = await universalApi.createEntity({
          entity_type: 'ap',
          entity_name: data.name || data.title || `New ${moduleName}`,
          entity_code: data.code || `${moduleName.toUpperCase()}-${Date.now()}`,
          organization_id: organizationId,
          status: 'active',
          ...data
        })

        // Add dynamic data fields
        if (data.customFields) {
          for (const [key, value] of Object.entries(data.customFields)) {
            await universalApi.setDynamicField(newEntity.id, key, value)
          }
        }

        return NextResponse.json({ success: true, data: newEntity })

      case 'validate':
        const validation = await this.validateData(data)
        return NextResponse.json({ success: true, data: validation })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('AP API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, data, organizationId } = body

    if (!id || !data || !organizationId) {
      return NextResponse.json({ error: 'ID, data, and organization ID are required' }, { status: 400 })
    }

    universalApi.setOrganizationId(organizationId)

    const updatedEntity = await universalApi.updateEntity(id, {
      ...data,
      updated_at: new Date().toISOString()
    })

    // Update dynamic data fields
    if (data.customFields) {
      for (const [key, value] of Object.entries(data.customFields)) {
        await universalApi.setDynamicField(id, key, value)
      }
    }

    return NextResponse.json({ success: true, data: updatedEntity })
  } catch (error) {
    console.error('AP API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const organizationId = searchParams.get('organization_id')

    if (!id || !organizationId) {
      return NextResponse.json({ error: 'ID and organization ID are required' }, { status: 400 })
    }

    universalApi.setOrganizationId(organizationId)

    // Soft delete by updating status
    const deletedEntity = await universalApi.updateEntity(id, {
      status: 'deleted',
      deleted_at: new Date().toISOString()
    })

    return NextResponse.json({ success: true, data: deletedEntity })
  } catch (error) {
    console.error('AP API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

async function calculateStats(organizationId: string) {
  try {
    universalApi.setOrganizationId(organizationId)
    
    const entities = await universalApi.getEntities({
      entity_type: 'ap',
      limit: 1000
    })

    const stats = {
      total: entities.length,
      active: entities.filter(e => e.status === 'active').length,
      inactive: entities.filter(e => e.status === 'inactive').length,
      recent: entities.filter(e => {
        const createdAt = new Date(e.created_at)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return createdAt > weekAgo
      }).length
    }

    return stats
  } catch (error) {
    console.error('Stats calculation error:', error)
    return { total: 0, active: 0, inactive: 0, recent: 0 }
  }
}

async function validateData(data: any) {
  const errors: string[] = []
  
  if (!data.name && !data.title) {
    errors.push('Name or title is required')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}