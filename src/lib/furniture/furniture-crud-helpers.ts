import { universalApi } from '@/lib/universal-api'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/hera-database.types'

// Helper functions for furniture/tender CRUD operations with proper auth

export async function createTenderWithAuth(tenderData: any, organizationId: string) {
  // Method 1: Using Universal API (Recommended)
  try {
    universalApi.setOrganizationId(organizationId)
    
    const result = await universalApi.createEntity({
      entity_type: tenderData.entity_type,
      entity_code: tenderData.entity_code,
      entity_name: tenderData.entity_name,
      entity_description: tenderData.entity_description,
      smart_code: tenderData.smart_code,
      metadata: tenderData.metadata,
      // organization_id is added automatically by universalApi
    })
    
    return { data: result, error: null }
  } catch (error) {
    console.error('Universal API error:', error)
    return { data: null, error }
  }
}

export async function createTenderDirectly(tenderData: any) {
  // Method 2: Direct Supabase with auth check
  const supabase = createClientComponentClient<Database>()
  
  // Check auth first
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return { 
      data: null, 
      error: new Error('Not authenticated. Please log in.') 
    }
  }
  
  // Get user's organization
  const organizationId = session.user.user_metadata.organization_id
  
  if (!organizationId) {
    return { 
      data: null, 
      error: new Error('No organization context. Please select an organization.') 
    }
  }
  
  // Now insert with organization_id
  const { data, error } = await supabase
    .from('core_entities')
    .insert({
      ...tenderData,
      organization_id: organizationId,
      created_by: session.user.id
    })
    .select()
    .single()
  
  return { data, error }
}

// For server-side operations (API routes)
export async function createTenderServerSide(tenderData: any, organizationId: string) {
  const { createServiceClient } = await import('@/lib/supabase/service-client')
  const supabase = createServiceClient()
  
  const { data, error } = await supabase
    .from('core_entities')
    .insert({
      ...tenderData,
      organization_id: organizationId
    })
    .select()
    .single()
  
  return { data, error }
}