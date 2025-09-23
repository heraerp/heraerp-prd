import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Salon-specific Supabase client with enhanced session persistence
 */
export const salonSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'salon-supabase-auth',
    storage: {
      getItem: (key: string) => {
        if (typeof window === 'undefined') return null
        return window.localStorage.getItem(key)
      },
      setItem: (key: string, value: string) => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(key, value)
      },
      removeItem: (key: string) => {
        if (typeof window === 'undefined') return
        window.localStorage.removeItem(key)
      }
    }
  }
})

// Add session recovery helper
export async function recoverSalonSession() {
  try {
    // First try to get existing session
    const { data: { session }, error } = await salonSupabase.auth.getSession()
    
    if (session) {
      console.log('Salon session active:', session.user.email)
      return session
    }
    
    // Try to refresh if no session
    const { data: refreshData, error: refreshError } = await salonSupabase.auth.refreshSession()
    
    if (refreshData.session) {
      console.log('Salon session recovered:', refreshData.session.user.email)
      return refreshData.session
    }
    
    console.log('No salon session available')
    return null
  } catch (err) {
    console.error('Session recovery error:', err)
    return null
  }
}