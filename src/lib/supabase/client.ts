// Re-export from the main supabase singleton to prevent multiple instances
export { supabase, getSupabase } from '../supabase'

// Legacy support - some files might expect createClient
export const createClient = () => {
  const { getSupabase } = require('../supabase')
  return getSupabase()
}
