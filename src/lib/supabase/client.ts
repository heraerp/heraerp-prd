// Re-export from the main supabase singleton to prevent multiple instances
import { getSupabase } from '../supabase'
export { supabase, getSupabase } from '../supabase'

// Legacy support - some files might expect createClient
export const createClient = () => {
  return getSupabase()
}
