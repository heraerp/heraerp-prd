'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Store, Scissors, Heart, Factory, Briefcase, Building2, LogOut, User } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

const demos = [
  {
    id: 'salon',
    name: 'Hair Talkz Salon',
    description: 'Beauty salon with appointment booking, inventory, and commission tracking',
    icon: Scissors,
    href: '/demo/salon',
    color: 'purple',
    bgColor: 'bg-purple-600',
    bgColorLight: 'bg-purple-100',
    textColor: 'text-purple-600',
    hoverColor: 'hover:bg-purple-700',
    available: true
  },
  {
    id: 'civicflow',
    name: 'CivicFlow Public Sector',
    description: 'Public sector CRM with constituent services, grants management, and outreach',
    icon: Building2,
    href: '/civicflow-auth',
    color: 'blue',
    bgColor: 'bg-blue-600',
    bgColorLight: 'bg-blue-100',
    textColor: 'text-blue-600',
    hoverColor: 'hover:bg-blue-700',
    available: true
  },
  {
    id: 'restaurant',
    name: "Mario's Restaurant",
    description: 'Full-service restaurant with POS, inventory, and kitchen management',
    icon: Store,
    href: '/demo/restaurant',
    color: 'orange',
    bgColor: 'bg-orange-600',
    bgColorLight: 'bg-orange-100',
    textColor: 'text-orange-600',
    hoverColor: 'hover:bg-orange-700',
    available: false
  },
  {
    id: 'healthcare',
    name: 'Medical Clinic',
    description: 'Healthcare practice with patient records and appointment scheduling',
    icon: Heart,
    href: '/demo/healthcare',
    color: 'red',
    bgColor: 'bg-red-600',
    bgColorLight: 'bg-red-100',
    textColor: 'text-red-600',
    hoverColor: 'hover:bg-red-700',
    available: false
  },
  {
    id: 'manufacturing',
    name: 'TechParts Manufacturing',
    description: 'Manufacturing with production planning and quality control',
    icon: Factory,
    href: '/demo/manufacturing',
    color: 'blue',
    bgColor: 'bg-blue-600',
    bgColorLight: 'bg-blue-100',
    textColor: 'text-blue-600',
    hoverColor: 'hover:bg-blue-700',
    available: false
  },
  {
    id: 'professional',
    name: 'Consulting Services',
    description: 'Professional services with time tracking and project management',
    icon: Briefcase,
    href: '/demo/professional',
    color: 'green',
    bgColor: 'bg-green-600',
    bgColorLight: 'bg-green-100',
    textColor: 'text-green-600',
    hoverColor: 'hover:bg-green-700',
    available: false
  }
]

interface CurrentSession {
  user: any
  organizationId: string | null
  demoType: string | null
  userRole: string | null
}

export default function DemoPage() {
  const [currentSession, setCurrentSession] = useState<CurrentSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    console.log('🎨 Demo page mounted')
    console.log('📍 Current pathname:', window.location.pathname)
    console.log('📍 Current href:', window.location.href)

    checkCurrentSession()

    // Check if something is causing a redirect
    const checkRedirect = setInterval(() => {
      if (window.location.pathname !== '/demo') {
        console.log('🚨 REDIRECT DETECTED! New path:', window.location.pathname)
        console.trace('Redirect stack trace')
        clearInterval(checkRedirect)
      }
    }, 100)

    // Prevent any redirects
    window.history.replaceState(null, '', '/demo')

    // Listen for navigation events
    window.addEventListener('popstate', e => {
      console.log('🔄 Popstate event:', e)
    })

    return () => {
      clearInterval(checkRedirect)
    }
  }, [])

  const checkCurrentSession = async () => {
    try {
      console.log('🔍 Checking current session...')

      // Check Supabase session
      const {
        data: { session },
        error
      } = await supabase.auth.getSession()

      if (error) {
        console.log('❌ Session error:', error)
        setLoading(false)
        return
      }

      if (session?.user) {
        console.log('👤 Found user session:', session.user.email)

        // Check localStorage for demo context
        const organizationId = localStorage.getItem('organizationId')
        const currentRole = localStorage.getItem('currentRole')

        console.log('🏢 Organization ID:', organizationId)
        console.log('👔 Current role:', currentRole)

        // Determine demo type based on organization ID
        let demoType = null
        if (organizationId === 'hair-talkz-salon-org-uuid') {
          demoType = 'salon'
        } else if (organizationId === '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77') {
          demoType = 'civicflow'
        }

        setCurrentSession({
          user: session.user,
          organizationId,
          demoType,
          userRole: currentRole
        })

        console.log('✅ Current session detected:', {
          email: session.user.email,
          demoType,
          role: currentRole
        })
      } else {
        console.log('🚫 No active session found')
      }
    } catch (error) {
      console.error('💥 Error checking session:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out...')

      // Clear localStorage
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (
          key.includes('auth') ||
          key.includes('org') ||
          key.includes('demo') ||
          key.includes('supabase') ||
          key.includes('Role')
        ) {
          console.log(`🗑️ Removing localStorage key: ${key}`)
          localStorage.removeItem(key)
        }
      })

      // Sign out from Supabase
      await supabase.auth.signOut()

      // Clear current session state
      setCurrentSession(null)
      setShowLogoutConfirm(false)

      console.log('✅ Logged out successfully')
    } catch (error) {
      console.error('💥 Logout error:', error)
    }
  }

  const getDemoDisplayName = (demoType: string | null) => {
    const demo = demos.find(d => d.id === demoType)
    return demo?.name || 'Unknown Demo'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking current session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">HERA Demo Gallery</h1>
          <p className="text-xl text-gray-600">
            Experience HERA&apos;s universal architecture across different industries
          </p>
        </div>

        {/* Current Session Banner */}
        {currentSession && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Currently logged into: {getDemoDisplayName(currentSession.demoType)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    User: {currentSession.user.email} • Role:{' '}
                    {currentSession.userRole || 'Demo User'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
            <div className="mt-4 text-sm text-blue-800 bg-blue-100 rounded-md p-3">
              💡 <strong>Tip:</strong> You&apos;re currently in a demo session. To try a different
              demo, please logout first to ensure a clean experience.
            </div>
          </div>
        )}

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Logout</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to logout from{' '}
                <strong>{getDemoDisplayName(currentSession?.demoType)}</strong>? This will end your
                current demo session.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Yes, Logout
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demos.map(demo => {
            const Icon = demo.icon
            return (
              <div
                key={demo.id}
                className={`
                  relative bg-white rounded-lg shadow-md overflow-hidden
                  ${!demo.available ? 'opacity-60' : 'hover:shadow-lg transition-shadow'}
                `}
              >
                <div className={`h-2 ${demo.bgColor}`} />

                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg ${demo.bgColorLight}`}>
                      <Icon className={`w-6 h-6 ${demo.textColor}`} />
                    </div>
                    <h3 className="ml-3 text-xl font-semibold text-gray-900">{demo.name}</h3>
                  </div>

                  <p className="text-gray-600 mb-4 h-12">{demo.description}</p>

                  {demo.available ? (
                    <div>
                      <Link
                        href={demo.href}
                        className={`
                          block w-full text-center py-2 px-4 rounded-md
                          ${demo.bgColor} text-white font-medium
                          ${demo.hoverColor} transition-colors
                        `}
                      >
                        Launch Demo
                      </Link>
                      {(demo as any).autoLogin && (
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          Auto-login as {(demo as any).defaultUser}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-2 px-4 rounded-md bg-gray-100 text-gray-500">
                      Coming Soon
                    </div>
                  )}
                </div>

                {!demo.available && <div className="absolute inset-0 bg-gray-50 bg-opacity-50" />}
              </div>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">Each demo runs on the same universal 6-table architecture</p>
          <p className="text-sm text-gray-500 mt-2">
            Demo sessions expire after 30 minutes for security
          </p>
        </div>
      </div>
    </div>
  )
}
