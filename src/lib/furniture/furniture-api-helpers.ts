import { universalApi } from '@/lib/universal-api'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/hera-database.types'

// Helper to ensure Universal API has proper auth context
export async function initializeFurnitureApi() {
  const supabase = createClientComponentClient<Database>()
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session?.user) {
    // Set organization from user metadata
    const orgId = session.user.user_metadata.organization_id || 'f0af4ced-9d12-4a55-a649-b484368db249'
    universalApi.setOrganizationId(orgId)
    
    // Optionally set auth token if needed
    if (session.access_token) {
      // Universal API can use this for authenticated requests
      universalApi.setAuthToken(session.access_token)
    }
    
    return {
      isAuthenticated: true,
      organizationId: orgId,
      userId: session.user.id
    }
  } else {
    // Use demo organization if not authenticated
    universalApi.setOrganizationId('f0af4ced-9d12-4a55-a649-b484368db249')
    
    return {
      isAuthenticated: false,
      organizationId: 'f0af4ced-9d12-4a55-a649-b484368db249',
      userId: null
    }
  }
}

// Wrapper for furniture-specific operations
export const furnitureApi = {
  async createTender(data: any) {
    await initializeFurnitureApi()
    
    return universalApi.createEntity({
      entity_type: 'HERA.FURNITURE.TENDER.NOTICE.v1',
      ...data
    })
  },
  
  async createBid(tenderId: string, data: any) {
    await initializeFurnitureApi()
    
    return universalApi.createTransaction({
      transaction_type: 'bid',
      reference_entity_id: tenderId,
      smart_code: 'HERA.FURNITURE.TENDER.BID.SUBMITTED.v1',
      ...data
    })
  },
  
  async getMyTenders() {
    await initializeFurnitureApi()
    
    const result = await universalApi.read({
      table: 'core_entities',
      filter: {
        entity_type: 'HERA.FURNITURE.TENDER.NOTICE.v1'
      }
    })
    
    return result
  },
  
  async getMyBids() {
    await initializeFurnitureApi()
    
    const result = await universalApi.read({
      table: 'universal_transactions',
      filter: {
        transaction_type: 'bid'
      }
    })
    
    return result
  }
}