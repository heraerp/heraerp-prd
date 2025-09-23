import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { usePathname } from 'next/navigation'

/**
 * Hook to maintain Supabase session across salon page navigations
 * This prevents auth loss when switching between pages
 */
export function useSalonSession() {
  const pathname = usePathname()
  const lastPathname = useRef(pathname)
  const sessionCheckInterval = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Function to check and refresh session
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error
        } = await supabase.auth.getSession()

        if (error) {
          console.error('Session check error:', error)
          return
        }

        // If session exists but is close to expiring, refresh it
        if (session) {
          const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : null
          const now = new Date()
          const timeUntilExpiry = expiresAt ? expiresAt.getTime() - now.getTime() : 0

          // Refresh if less than 5 minutes until expiry
          if (timeUntilExpiry < 5 * 60 * 1000) {
            console.log('Session expiring soon, refreshing...')
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
            if (refreshError) {
              console.error('Session refresh error:', refreshError)
            } else if (refreshData.session) {
              console.log('Session refreshed successfully')
            }
          }
        }
      } catch (err) {
        console.error('Session check failed:', err)
      }
    }

    // Check session on mount and pathname changes
    checkSession()

    // Set up periodic session check (every 30 seconds)
    sessionCheckInterval.current = setInterval(checkSession, 30000)

    // Log navigation
    if (pathname !== lastPathname.current) {
      console.log(`Navigating from ${lastPathname.current} to ${pathname}`)
      lastPathname.current = pathname
    }

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current)
      }
    }
  }, [pathname])

  // Also listen for visibility changes to refresh when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        console.log('Tab became visible, checking session...')
        const {
          data: { session }
        } = await supabase.auth.getSession()
        if (session) {
          console.log('Session active:', session.user.email)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
}
