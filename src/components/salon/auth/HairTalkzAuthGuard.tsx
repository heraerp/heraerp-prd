'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Loader2, Crown } from 'lucide-react'

// Luxe color palette
const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  plum: '#B794F4',
  emerald: '#0F6F5C'
}

const HAIRTALKZ_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

interface RouteConfig {
  path: string
  allowedRoles: string[]
  redirectTo?: string
}

const routeConfigs: RouteConfig[] = [
  // Owner routes
  { path: '/salon/dashboard', allowedRoles: ['owner', 'admin'] },
  { path: '/salon/owner', allowedRoles: ['owner', 'admin'] },
  { path: '/salon/staff', allowedRoles: ['owner', 'admin'] },
  { path: '/salon/settings', allowedRoles: ['owner', 'admin'] },
  
  // Receptionist routes
  { path: '/salon/receptionist', allowedRoles: ['receptionist', 'owner', 'admin'] },
  { path: '/salon/appointments', allowedRoles: ['receptionist', 'owner', 'admin'] },
  { path: '/salon/customers', allowedRoles: ['receptionist', 'owner', 'admin'] },
  { path: '/salon/pos2', allowedRoles: ['receptionist', 'owner', 'admin'] },
  { path: '/salon/whatsapp', allowedRoles: ['receptionist', 'owner', 'admin'] },
  
  // Accountant routes
  { path: '/salon/accountant', allowedRoles: ['accountant', 'owner', 'admin'] },
  { path: '/salon/finance', allowedRoles: ['accountant', 'owner', 'admin'] },
  { path: '/salon/reports', allowedRoles: ['accountant', 'owner', 'admin'] },
  { path: '/salon-data/financials', allowedRoles: ['accountant', 'owner', 'admin'] },
  { path: '/salon-data/payroll', allowedRoles: ['accountant', 'owner', 'admin'] },
  
  // Admin routes
  { path: '/salon/admin', allowedRoles: ['admin'] },
  
  // Common routes
  { path: '/salon/services', allowedRoles: ['receptionist', 'owner', 'admin'] },
  { path: '/salon/products', allowedRoles: ['receptionist', 'owner', 'admin'] },
]

export function HairTalkzAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [pathname])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        router.push('/salon/auth')
        return
      }

      const userMetadata = session.user.user_metadata
      
      // Check organization
      if (userMetadata?.organization_id !== HAIRTALKZ_ORG_ID) {
        router.push('/salon/auth')
        return
      }

      const role = userMetadata.role?.toLowerCase() || 'owner'
      setUserRole(role)

      // Check route authorization
      const routeConfig = routeConfigs.find(config => 
        pathname.startsWith(config.path)
      )

      if (routeConfig && !routeConfig.allowedRoles.includes(role)) {
        // Redirect to role-specific dashboard
        const redirectMap: Record<string, string> = {
          owner: '/salon/dashboard',
          receptionist: '/salon/receptionist',
          accountant: '/salon/accountant',
          admin: '/salon/admin'
        }
        
        router.push(redirectMap[role] || '/salon/auth')
        return
      }

      setAuthorized(true)
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/salon/auth')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.charcoal }}
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-6">
            <div 
              className="h-16 w-16 rounded-full flex items-center justify-center animate-pulse"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                boxShadow: '0 0 40px rgba(212, 175, 55, 0.4)'
              }}
            >
              <Crown className="h-8 w-8" style={{ color: COLORS.black }} />
            </div>
          </div>
          
          <Loader2 
            className="h-6 w-6 animate-spin mx-auto mb-4" 
            style={{ color: COLORS.gold }} 
          />
          
          <p 
            style={{ color: COLORS.bronze }} 
            className="font-light tracking-wider"
          >
            Authenticating...
          </p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return <>{children}</>
}

export function useHairTalkzAuth() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          setRole(session.user.user_metadata?.role?.toLowerCase() || null)
        }
      } catch (error) {
        console.error('Error getting user:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        setRole(session.user.user_metadata?.role?.toLowerCase() || null)
      } else {
        setUser(null)
        setRole(null)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  return { user, role, loading }
}