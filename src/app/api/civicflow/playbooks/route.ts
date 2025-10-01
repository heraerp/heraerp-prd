import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  console.log('🔍 Playbooks API called')

  try {
    const orgId = request.headers.get('X-Organization-Id')
    console.log('🔍 Organization ID:', orgId)

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const q = searchParams.get('q')

    // Build query
    let query = supabase
      .from('core_entities')
      .select('*', { count: 'exact' })
      .eq('organization_id', orgId)
      .eq('entity_type', 'playbook')
      .order('created_at', { ascending: false })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (category && category !== 'all') {
      query = query.contains('metadata', { category })
    }

    if (q) {
      query = query.or(`entity_name.ilike.%${q}%,metadata->description.ilike.%${q}%`)
    }

    // Pagination
    const offset = (page - 1) * pageSize
    query = query.range(offset, offset + pageSize - 1)

    const { data, error, count } = await query

    console.log('🔍 Query result:', { dataLength: data?.length, count, error })

    if (error) {
      console.error('🔍 Query error:', error)
      throw error
    }

    console.log('🔍 Raw data sample:', data?.[0])

    // Transform data to match PlaybookListItem interface
    const items = data.map((entity: any) => ({
      id: entity.id,
      name: entity.entity_name,
      description: entity.metadata?.description || null,
      status: entity.status || 'draft',
      category: entity.metadata?.category || 'service',
      steps_count: entity.metadata?.steps_count || 0,
      total_runs: entity.metadata?.total_runs || null,
      success_rate: entity.metadata?.success_rate || null,
      last_run_at: entity.metadata?.last_run_at || null,
      created_at: entity.created_at,
      updated_at: entity.updated_at
    }))

    return NextResponse.json({
      items,
      total: count || 0,
      page,
      pageSize
    })
  } catch (error) {
    console.error('Error fetching playbooks:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch playbooks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id')

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const body = await request.json()
    const { name, description, status, category, steps } = body

    // Create playbook entity
    const { data: playbook, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'playbook',
        entity_name: name,
        entity_code: `PLAYBOOK-${name.replace(/\s+/g, '-').toUpperCase()}`,
        smart_code: `HERA.CIVICFLOW.PLAYBOOK.${category.toUpperCase()}.ENTITY.CONFIG.v1`,
        status: status || 'draft',
        metadata: {
          description,
          category,
          steps_count: steps?.length || 0,
          version: '1.0.0'
        }
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Create steps if provided
    if (steps && steps.length > 0) {
      for (const step of steps) {
        const { data: stepEntity, error: stepError } = await supabase
          .from('core_entities')
          .insert({
            organization_id: orgId,
            entity_type: 'playbook_step',
            entity_name: step.name,
            entity_code: `STEP-${playbook.id}-${step.sequence}`,
            smart_code: `HERA.CIVICFLOW.PLAYBOOK.STEP.${step.step_type.toUpperCase()}.CONFIG.v1`,
            status: 'active',
            metadata: {
              ...step,
              playbook_id: playbook.id
            }
          })
          .select()
          .single()

        if (stepError) {
          console.error(`Error creating step ${step.name}:`, stepError)
          continue
        }

        // Create relationship
        await supabase.from('core_relationships').insert({
          organization_id: orgId,
          from_entity_id: playbook.id,
          to_entity_id: stepEntity.id,
          relationship_type: 'has_step',
          smart_code: 'HERA.CIVICFLOW.RELATIONSHIP.PLAYBOOK.STEP.CONFIG.V1',
          metadata: {
            sequence: step.sequence
          }
        })
      }
    }

    // Return formatted response
    return NextResponse.json({
      id: playbook.id,
      name: playbook.entity_name,
      description: playbook.metadata?.description || null,
      status: playbook.status,
      category: playbook.metadata?.category,
      steps_count: playbook.metadata?.steps_count || 0,
      version: playbook.metadata?.version || '1.0.0',
      steps: [],
      relationships: {
        services: [],
        programs: []
      },
      created_at: playbook.created_at,
      updated_at: playbook.updated_at
    })
  } catch (error) {
    console.error('Error creating playbook:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create playbook' },
      { status: 500 }
    )
  }
}
