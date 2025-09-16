import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/src/types/hera-database.types'

// Service client bypasses RLS - use only on server-side
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Helper to create entities with service role
export async function createEntityWithServiceRole(data: any) {
  const supabase = createServiceClient()

  const { data: entity, error } = await supabase
    .from('core_entities')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('Service role insert error:', error)
    throw error
  }

  return entity
}
