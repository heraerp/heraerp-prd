'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Crown, Diamond, Users, Shield, Calculator, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import '@/styles/jewelry-glassmorphism.css'

interface DemoUser {
  id: string
  email: string
  password: string
  fullName: string
  role: string
  department: string
  description: string
  icon: React.ElementType
  accessLevel: string
}

const DEMO_USERS: DemoUser[] = [
  {
    id: 'j1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c',
    email: 'owner@jewelry-demo.com',
    password: 'JewelryDemo2024!',
    fullName: 'Isabella Sterling',
    role: 'Owner',
    department: 'Executive',
    description: 'Full system access, financial oversight, strategic decisions',
    icon: Crown,
    accessLevel: 'Full Access'
  },
  {
    id: 'j2b3c4d5-6e7f-8a9b-0c1d-2e3f4a5b6c7d',
    email: 'manager@jewelry-demo.com',
    password: 'JewelryDemo2024!',
    fullName: 'Alexander Gold',
    role: 'Manager',
    department: 'Operations',
    description: 'Inventory management, staff oversight, customer relations',
    icon: Diamond,
    accessLevel: 'Management'
  },
  {
    id: 'j3c4d5e6-7f8a-9b0c-1d2e-3f4a5b6c7d8e',
    email: 'sales@jewelry-demo.com',
    password: 'JewelryDemo2024!',
    fullName: 'Sophia Gemstone',
    role: 'Sales Associate',
    department: 'Sales',
    description: 'Customer service, transactions, product consultation',
    icon: Star,
    accessLevel: 'Sales'
  },
  {
    id: 'j4d5e6f7-8a9b-0c1d-2e3f-4a5b6c7d8e9f',
    email: 'appraiser@jewelry-demo.com',
    password: 'JewelryDemo2024!',
    fullName: 'Marcus Brilliant',
    role: 'Certified Appraiser',
    department: 'Appraisal',
    description: 'Jewelry appraisals, certifications, quality assessments',
    icon: Shield,
    accessLevel: 'Specialist'
  },
  {
    id: 'j5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a',
    email: 'security@jewelry-demo.com',
    password: 'JewelryDemo2024!',
    fullName: 'Victoria Noble',
    role: 'Security Manager',
    department: 'Security',
    description: 'Asset protection, vault management, insurance compliance',
    icon: Calculator,
    accessLevel: 'Security'
  },
  {
    id: 'j6f7a8b9-0c1d-2e3f-4a5b-6c7d8e9f0a1b',
    email: 'staff@jewelry-demo.com',
    password: 'JewelryDemo2024!',
    fullName: 'Emma Precious',
    role: 'Staff Member',
    department: 'General',
    description: 'Basic access, customer assistance, inventory support',
    icon: Users,
    accessLevel: 'Limited'
  }
]

const JEWELRY_DEMO_ORG_ID = 'f8d2c5e7-9a4b-6c8d-0e1f-2a3b4c5d6e7f'

export function JewelryDemoAuth() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedUser, setSelectedUser] = useState<DemoUser | null>(null)

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
      localStorage.removeItem('currentRole')
      localStorage.removeItem('jewelryRole')
      // Remove logout param from URL
      window.history.replaceState({}, '', '/jewelry/demo')
      return
    }

    // Check current Supabase session
    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (session?.user) {
      // Check if this is a Jewelry demo user
      const userMetadata = session.user.user_metadata
      if (userMetadata?.organization_id === JEWELRY_DEMO_ORG_ID) {
        // Valid Jewelry user, set context and redirect
        localStorage.setItem('organizationId', JEWELRY_DEMO_ORG_ID)
        localStorage.setItem('currentRole', userMetadata.role || 'Staff')
        localStorage.setItem('jewelryRole', userMetadata.role || 'Staff')
        router.push('/jewelry/dashboard')
      } else {
        // Different org user, sign them out for Jewelry
        await supabase.auth.signOut()
        localStorage.removeItem('organizationId')
        localStorage.removeItem('currentRole')
        localStorage.removeItem('jewelryRole')
      }
    }
  }

  const handleDemoLogin = async (user: DemoUser) => {
    setLoading(true)
    setError('')
    setSelectedUser(user)

    try {
      // Sign in with Jewelry demo user
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      })

      if (error) {
        throw error
      }

      if (data.session) {
        // Set organization context
        localStorage.setItem('organizationId', JEWELRY_DEMO_ORG_ID)
        localStorage.setItem('currentRole', user.role)
        localStorage.setItem('jewelryRole', user.role)

        // Redirect to Jewelry dashboard
        router.push('/jewelry/dashboard')
      }
    } catch (err: any) {
      console.error('Demo login error:', err)
      if (err.message.includes('Invalid login credentials')) {
        setError('Demo user not found. Please run the setup script first.')
      } else {
        setError(err.message || 'Failed to login with demo account')
      }
    } finally {
      setLoading(false)
      setSelectedUser(null)
    }
  }

  return (
    <div className="min-h-screen jewelry-gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="jewelry-glass-card p-4"
            >
              <Crown className="h-12 w-12 jewelry-text-gold" />
            </motion.div>
            <div>
              <h1 className="jewelry-heading text-5xl font-bold">HERA Jewelry Demo</h1>
              <p className="jewelry-text-luxury text-xl mt-2">
                Select a demo account to explore luxury jewelry management
              </p>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 jewelry-glass-card"
            style={{
              background:
                'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(185, 28, 28, 0.05) 100%)',
              border: '1px solid rgba(220, 38, 38, 0.3)'
            }}
          >
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEMO_USERS.map((user, index) => (
            <motion.div
              key={user.email}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`cursor-pointer transition-all duration-300 jewelry-glass-card jewelry-scale-hover
                ${selectedUser?.email === user.email ? 'jewelry-glow-gold' : ''}
                ${loading ? 'opacity-75' : ''}
              `}
              onClick={() => !loading && handleDemoLogin(user)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl jewelry-crown-glow flex items-center justify-center">
                      <user.icon className="h-8 w-8 jewelry-text-gold" />
                    </div>
                    <div>
                      <h3 className="jewelry-text-high-contrast text-xl font-bold">
                        {user.fullName}
                      </h3>
                      <p className="jewelry-text-muted text-sm">
                        {user.role} • {user.department}
                      </p>
                      <div className="mt-1">
                        <span
                          className="text-xs px-2 py-1 rounded-full jewelry-text-gold font-semibold"
                          style={{
                            background:
                              'linear-gradient(135deg, rgba(212, 175, 0, 0.2) 0%, rgba(184, 150, 11, 0.1) 100%)',
                            border: '1px solid rgba(212, 175, 0, 0.3)'
                          }}
                        >
                          {user.accessLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                  {selectedUser?.email === user.email && loading && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 className="h-6 w-6 jewelry-text-gold" />
                    </motion.div>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="jewelry-text-luxury text-sm leading-relaxed">{user.description}</p>

                  <div className="pt-3 border-t border-gold-500/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs jewelry-text-muted">Role Access</span>
                      <div className="flex gap-1">
                        {['POS', 'Inventory', 'Reports'].map((feature, idx) => (
                          <div
                            key={feature}
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor:
                                idx < (user.role === 'Owner' ? 3 : user.role === 'Manager' ? 2 : 1)
                                  ? '#D4AF00'
                                  : 'rgba(212, 175, 0, 0.3)'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center jewelry-glass-card p-6"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Diamond className="h-5 w-5 jewelry-text-gold" />
            <span className="jewelry-text-luxury font-semibold">Demo Environment</span>
            <Diamond className="h-5 w-5 jewelry-text-gold" />
          </div>
          <p className="jewelry-text-muted text-sm mb-2">
            This is a demonstration environment with realistic jewelry business data
          </p>
          <p className="jewelry-text-muted text-xs">
            External integrations and payments are disabled in demo mode
          </p>
        </motion.div>
      </div>
    </div>
  )
}
