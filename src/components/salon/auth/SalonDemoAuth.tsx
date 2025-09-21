'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, User, Shield, Calculator, UserCheck, Scissors, Phone, CreditCard, BarChart3 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface DemoUser {
  id: string
  email: string
  password: string
  fullName: string
  role: string
  department: string
  description: string
  icon: React.ElementType
  capabilities: string[]
}

// Hair Talkz Salon Organization ID
const SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

const DEMO_USERS: DemoUser[] = [
  {
    id: 'owner-001',
    email: 'owner@hairtalkz-demo.com',
    password: 'HairTalkzDemo2025!',
    fullName: 'Sarah Martinez',
    role: 'Owner',
    department: 'Management',
    description: 'Full system access, business overview, and strategic decisions',
    icon: Shield,
    capabilities: [
      'Full dashboard access',
      'Financial reports',
      'Staff management',
      'Business analytics',
      'System settings',
      'All features'
    ]
  },
  {
    id: 'receptionist-001',
    email: 'receptionist@hairtalkz-demo.com',
    password: 'HairTalkzDemo2025!',
    fullName: 'Emily Johnson',
    role: 'Receptionist',
    department: 'Front Desk',
    description: 'Manage appointments, customers, and front desk operations',
    icon: Phone,
    capabilities: [
      'Appointment booking',
      'Customer check-in/out',
      'Payment processing',
      'Customer management',
      'Daily schedule view',
      'WhatsApp notifications'
    ]
  },
  {
    id: 'accountant-001',
    email: 'accountant@hairtalkz-demo.com',
    password: 'HairTalkzDemo2025!',
    fullName: 'Michael Chen',
    role: 'Accountant',
    department: 'Finance',
    description: 'Financial management, reports, and compliance',
    icon: Calculator,
    capabilities: [
      'Financial dashboard',
      'Revenue reports',
      'Expense tracking',
      'Payroll management',
      'Tax reporting',
      'Audit trails'
    ]
  },
  {
    id: 'admin-001',
    email: 'admin@hairtalkz-demo.com',
    password: 'HairTalkzDemo2025!',
    fullName: 'David Thompson',
    role: 'Administrator',
    department: 'IT & Operations',
    description: 'System administration, user management, and technical support',
    icon: UserCheck,
    capabilities: [
      'User management',
      'System settings',
      'Data backup',
      'Security settings',
      'Integration management',
      'Technical support'
    ]
  }
]

export function SalonDemoAuth() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedUser, setSelectedUser] = useState<DemoUser | null>(null)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  // Check if already authenticated
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    // Check if user wants to force logout (for debugging)
    const forceLogout = new URLSearchParams(window.location.search).get('logout')
    if (forceLogout) {
      await supabase.auth.signOut()
      localStorage.removeItem('organizationId')
      localStorage.removeItem('salonRole')
      localStorage.removeItem('salonUserName')
      // Remove logout param from URL
      window.history.replaceState({}, '', '/salon/auth')
      return
    }

    // Check current Supabase session
    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (session?.user) {
      // Check if this is a Hair Talkz salon user
      const userMetadata = session.user.user_metadata
      if (userMetadata?.organization_id === SALON_ORG_ID) {
        // Valid salon user, set context and redirect
        localStorage.setItem('organizationId', SALON_ORG_ID)
        localStorage.setItem('salonRole', userMetadata.role || 'Staff')
        localStorage.setItem('salonUserName', userMetadata.full_name || 'User')
        
        // Redirect based on role
        const roleRedirects: Record<string, string> = {
          'Owner': '/salon/dashboard',
          'Receptionist': '/salon/pos',
          'Accountant': '/salon/finance',
          'Administrator': '/salon/settings'
        }
        
        const redirectPath = roleRedirects[userMetadata.role] || '/salon'
        router.push(redirectPath)
      } else {
        // Different org user, sign them out for salon
        await supabase.auth.signOut()
        localStorage.removeItem('organizationId')
        localStorage.removeItem('salonRole')
        localStorage.removeItem('salonUserName')
      }
    }
  }

  const handleDemoLogin = async (user: DemoUser) => {
    setLoading(true)
    setError('')
    setSelectedUser(user)

    try {
      // Sign in with salon demo user
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      })

      if (error) {
        throw error
      }

      if (data.session) {
        // Set organization context
        localStorage.setItem('organizationId', SALON_ORG_ID)
        localStorage.setItem('salonRole', user.role)
        localStorage.setItem('salonUserName', user.fullName)

        // Update user metadata in Supabase
        await supabase.auth.updateUser({
          data: {
            organization_id: SALON_ORG_ID,
            role: user.role,
            full_name: user.fullName,
            department: user.department
          }
        })

        // Redirect based on role
        const roleRedirects: Record<string, string> = {
          'Owner': '/salon/dashboard',
          'Receptionist': '/salon/pos',
          'Accountant': '/salon/finance',
          'Administrator': '/salon/settings'
        }
        
        const redirectPath = roleRedirects[user.role] || '/salon'
        router.push(redirectPath)
      }
    } catch (err: any) {
      console.error('Demo login error:', err)
      if (err.message.includes('Invalid login credentials')) {
        setError('Demo user not found. Please ensure the demo users are set up.')
      } else {
        setError(err.message || 'Failed to login with demo account')
      }
    } finally {
      setLoading(false)
      setSelectedUser(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Scissors className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Hair Talkz Salon
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300">Select your role to access the salon management system</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Enterprise-grade salon management with role-based access</p>
        </div>

        {error && (
          <div className="mb-6 mx-auto max-w-2xl p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DEMO_USERS.map(user => {
            const isExpanded = expandedCard === user.id
            const isSelected = selectedUser?.email === user.email
            
            return (
              <div
                key={user.email}
                className={`
                  relative cursor-pointer transition-all duration-300 rounded-2xl border-2
                  ${isSelected 
                    ? 'border-purple-500 shadow-2xl shadow-purple-500/25' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                  }
                  ${loading && !isSelected ? 'opacity-50' : ''}
                  bg-white dark:bg-gray-800 overflow-hidden
                  transform hover:scale-[1.02] hover:shadow-xl
                `}
                onClick={() => !loading && handleDemoLogin(user)}
                onMouseEnter={() => setExpandedCard(user.id)}
                onMouseLeave={() => setExpandedCard(null)}
              >
                {/* Role-specific gradient background */}
                <div className={`absolute inset-0 opacity-5 bg-gradient-to-br
                  ${user.role === 'Owner' ? 'from-purple-500 to-pink-500' : ''}
                  ${user.role === 'Receptionist' ? 'from-blue-500 to-cyan-500' : ''}
                  ${user.role === 'Accountant' ? 'from-green-500 to-emerald-500' : ''}
                  ${user.role === 'Administrator' ? 'from-orange-500 to-red-500' : ''}
                `} />
                
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center
                        ${user.role === 'Owner' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : ''}
                        ${user.role === 'Receptionist' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : ''}
                        ${user.role === 'Accountant' ? 'bg-gradient-to-br from-green-500 to-emerald-500' : ''}
                        ${user.role === 'Administrator' ? 'bg-gradient-to-br from-orange-500 to-red-500' : ''}
                      `}>
                        <user.icon className="h-7 w-7 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{user.fullName}</h3>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {user.role}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user.department}
                        </p>
                      </div>
                    </div>
                    {isSelected && loading && (
                      <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                    )}
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">{user.description}</p>
                  
                  {/* Capabilities list with smooth expansion */}
                  <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-48' : 'max-h-0'}`}>
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                        Capabilities
                      </h4>
                      <div className="grid grid-cols-1 gap-1">
                        {user.capabilities.map((capability, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-purple-400" />
                            <span className="text-xs text-gray-600 dark:text-gray-300">{capability}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Login hint */}
                  {!isExpanded && (
                    <div className="absolute bottom-2 right-2">
                      <span className="text-xs text-gray-400 dark:text-gray-500">Click to login</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-10 text-center space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This is a demonstration environment with sample Hair Talkz salon data
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            WhatsApp integrations and external communications are simulated in demo mode
          </p>
          
          {/* Quick logout info */}
          <div className="mt-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg max-w-md mx-auto">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <strong>Tip:</strong> To switch between demo users, click the Logout button in the top-right corner or visit{' '}
              <a href="/salon/auth?logout" className="underline font-medium">
                /salon/auth?logout
              </a>
            </p>
          </div>
          
          <div className="pt-4">
            <a
              href="/salon"
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
            >
              ← Back to Salon Overview
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}