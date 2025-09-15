// Re-export the singleton instance from supabase.ts to prevent multiple instances
export { supabase as supabaseClient } from './supabase'
export { supabase as getSupabaseClient } from './supabase'
