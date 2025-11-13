/**
 * HERA Universal Workspace API Endpoint (Fully Dynamic)
 * Smart Code: HERA.API.WORKSPACE.UNIVERSAL.v1
 *
 * Dynamic workspace data loader that works with ANY app
 * Route: /api/v2/workspace/[app]/[domain]/[section]/[workspace]
 *
 * Examples:
 * - GET /api/v2/workspace/retail/analytics/fin/main
 * - GET /api/v2/workspace/agro/farm/crops/planning
 * - GET /api/v2/workspace/central/admin/users/main
 *
 * Database-Driven Discovery Flow:
 * 1. Find APP entity (entity_type='APP', entity_code=[app])
 * 2. Find DOMAIN entity via APP_HAS_DOMAIN relationship
 * 3. Find SECTION entity via HAS_SECTION relationship
 * 4. Find WORKSPACE entity via HAS_WORKSPACE relationship
 * 5. Load layout_config from workspace dynamic data
 * 6. Return complete workspace configuration
 *
 * All data is loaded from Sacred Six tables using relationships.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ app: string; domain: string; section: string; workspace: string }> }
) {
  try {
    const { app, domain, section, workspace } = await params

    console.log('🔍 API: Loading workspace data for:', { app, domain, section, workspace })

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Step 1: Find the APP entity
    const { data: appEntity, error: appError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code, smart_code')
      .eq('entity_type', 'APP')
      .eq('entity_code', app)
      .eq('organization_id', '00000000-0000-0000-0000-000000000000') // Platform org
      .single()

    if (appError || !appEntity) {
      console.error('❌ API: App entity not found:', { app, error: appError })
      return NextResponse.json(
        { error: `App "${app}" not found` },
        { status: 404 }
      )
    }

    console.log('✅ API: Found app entity:', appEntity)

    // Step 2: Find DOMAIN entity via APP_HAS_DOMAIN relationship
    const { data: domainRelationship, error: domainRelError } = await supabase
      .from('core_relationships')
      .select(`
        to_entity_id,
        to_entity:core_entities!core_relationships_to_entity_id_fkey(
          id,
          entity_name,
          entity_code,
          entity_type,
          smart_code
        )
      `)
      .eq('from_entity_id', appEntity.id)
      .eq('relationship_type', 'APP_HAS_DOMAIN')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')

    if (domainRelError || !domainRelationship || domainRelationship.length === 0) {
      console.error('❌ API: Domain relationship not found:', { app, domain, error: domainRelError })
      return NextResponse.json(
        { error: `Domain "${domain}" not found for app "${app}"` },
        { status: 404 }
      )
    }

    // Find the specific domain by entity_code
    const domainEntity = domainRelationship.find((rel: any) =>
      rel.to_entity?.entity_code === domain
    )?.to_entity

    if (!domainEntity) {
      console.error('❌ API: Domain entity not found:', { app, domain })
      return NextResponse.json(
        { error: `Domain "${domain}" not found` },
        { status: 404 }
      )
    }

    console.log('✅ API: Found domain entity:', domainEntity)

    // Step 3: Find SECTION entity via HAS_SECTION relationship
    const { data: sectionRelationship, error: sectionRelError } = await supabase
      .from('core_relationships')
      .select(`
        to_entity_id,
        to_entity:core_entities!core_relationships_to_entity_id_fkey(
          id,
          entity_name,
          entity_code,
          entity_type,
          smart_code
        )
      `)
      .eq('from_entity_id', domainEntity.id)
      .eq('relationship_type', 'HAS_SECTION')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')

    if (sectionRelError || !sectionRelationship || sectionRelationship.length === 0) {
      console.error('❌ API: Section relationship not found:', { domain, section, error: sectionRelError })
      return NextResponse.json(
        { error: `Section "${section}" not found for domain "${domain}"` },
        { status: 404 }
      )
    }

    // Find the specific section by entity_code
    const sectionEntity = sectionRelationship.find((rel: any) =>
      rel.to_entity?.entity_code === section
    )?.to_entity

    if (!sectionEntity) {
      console.error('❌ API: Section entity not found:', { domain, section })
      return NextResponse.json(
        { error: `Section "${section}" not found` },
        { status: 404 }
      )
    }

    console.log('✅ API: Found section entity:', sectionEntity)

    // Step 4: Find WORKSPACE entity via HAS_WORKSPACE relationship
    const { data: workspaceRelationship, error: workspaceRelError } = await supabase
      .from('core_relationships')
      .select(`
        to_entity_id,
        to_entity:core_entities!core_relationships_to_entity_id_fkey(
          id,
          entity_name,
          entity_code,
          entity_type,
          smart_code,
          metadata
        )
      `)
      .eq('from_entity_id', sectionEntity.id)
      .eq('relationship_type', 'HAS_WORKSPACE')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')

    if (workspaceRelError || !workspaceRelationship || workspaceRelationship.length === 0) {
      console.error('❌ API: Workspace relationship not found:', { section, workspace, error: workspaceRelError })
      return NextResponse.json(
        { error: `Workspace "${workspace}" not found for section "${section}"` },
        { status: 404 }
      )
    }

    // Find the specific workspace by entity_code
    const workspaceEntity = workspaceRelationship.find((rel: any) =>
      rel.to_entity?.entity_code === workspace
    )?.to_entity

    if (!workspaceEntity) {
      console.error('❌ API: Workspace entity not found:', { section, workspace })
      return NextResponse.json(
        { error: `Workspace "${workspace}" not found` },
        { status: 404 }
      )
    }

    console.log('✅ API: Found workspace entity:', workspaceEntity)

    // Step 5: Load layout_config from dynamic data
    const { data: layoutData, error: layoutError } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_text, field_value_json')
      .eq('entity_id', workspaceEntity.id)
      .eq('field_name', 'layout_config')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')
      .single()

    let layoutConfig
    if (layoutError || !layoutData) {
      console.warn('⚠️ API: Layout config not found, using default:', layoutError)
      // Default layout configuration
      layoutConfig = {
        default_nav_code: 'overview',
        nav_items: [
          { code: 'overview', label: 'Overview' }
        ],
        sections: [
          {
            nav_code: 'overview',
            title: 'Overview',
            cards: [
              {
                label: 'Getting Started',
                subtitle: 'Start using this workspace',
                icon: 'Activity',
                view_slug: 'getting-started',
                target_type: 'info'
              }
            ]
          }
        ]
      }
    } else {
      layoutConfig = layoutData.field_value_json || JSON.parse(layoutData.field_value_text || '{}')
    }

    console.log('✅ API: Loaded layout config:', layoutConfig)

    // Step 6: Build complete workspace response
    const workspaceData = {
      workspace: {
        id: workspaceEntity.id,
        entity_name: workspaceEntity.entity_name,
        entity_code: workspaceEntity.entity_code,
        slug: workspaceEntity.entity_code,
        subtitle: workspaceEntity.metadata?.subtitle || `${app} › ${domain} › ${section}`,
        icon: workspaceEntity.metadata?.icon || 'Grid3x3',
        color: workspaceEntity.metadata?.color || '#6366f1',
        persona_label: workspaceEntity.metadata?.persona_label || '',
        visible_roles: workspaceEntity.metadata?.visible_roles || [],
        route: `/${app}/domains/${domain}/sections/${section}/workspaces/${workspace}`
      },
      layout_config: layoutConfig
    }

    console.log('✅ API: Returning complete workspace data:', workspaceData)

    return NextResponse.json(workspaceData, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    })

  } catch (error) {
    console.error('❌ API: Error loading workspace:', error)
    return NextResponse.json(
      { error: 'Failed to load workspace', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
