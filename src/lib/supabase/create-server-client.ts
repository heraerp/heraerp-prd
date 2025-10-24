import { createServerClient as createSupabaseSSR } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerClient() {
  const cookieStore = await cookies()
  
  return createSupabaseSSR(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Production-safe cookie settings for heraerp.com
          cookieStore.set({
            name,
            value,
            ...options,
            secure: true,
            sameSite: 'none',
            domain: process.env.NODE_ENV === 'production' ? '.heraerp.com' : undefined,
            httpOnly: false, // Allow client-side access for auth
            path: '/'
          })
        },
        remove(name: string, options: any) {
          cookieStore.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
            secure: true,
            sameSite: 'none',
            domain: process.env.NODE_ENV === 'production' ? '.heraerp.com' : undefined,
            path: '/'
          })
        }
      }
    }
  )
}

// Back-compat alias if some code imports { createClient }
export const createClient = createServerClient
