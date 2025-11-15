'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Loader2,
  Eye,
  EyeOff,
  Crown,
  Shield,
  Calculator,
  User,
  Lock,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { clearInvalidTokens } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
// Demo authentication removed - using proper HERA v2.2 authentication

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

// Michele's salon organization ID
const HAIRTALKZ_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

interface UserRole {
  value: string
  label: string
  description: string
  icon: React.ElementType
  redirectPath: string
}

const USER_ROLES: UserRole[] = [
  {
    value: 'owner',
    label: 'Owner',
    description: 'Full system access & business intelligence',
    icon: Crown,
    redirectPath: '/salon/dashboard'
  },
  {
    value: 'receptionist',
    label: 'Receptionist',
    description: 'Front desk operations & appointments',
    icon: User,
    redirectPath: '/salon/receptionist/dashboard'
  },
  {
    value: 'accountant',
    label: 'Accountant',
    description: 'Financial reports & compliance',
    icon: Calculator,
    redirectPath: '/salon/finance'
  },
  {
    value: 'admin',
    label: 'Administrator',
    description: 'System settings & user management',
    icon: Shield,
    redirectPath: '/salon/admin/dashboard'
  }
]

// Define permissions for each role
function getRolePermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    owner: [
      'view_dashboard',
      'view_financial_reports',
      'manage_appointments',
      'manage_customers',
      'manage_staff',
      'manage_inventory',
      'manage_services',
      'manage_settings',
      'export_data',
      'view_analytics',
      'manage_organization'
    ],
    receptionist: [
      'view_appointments',
      'create_appointments',
      'update_appointments',
      'cancel_appointments',
      'view_customers',
      'create_customers',
      'update_customers',
      'process_payments',
      'view_services',
      'view_staff_availability'
    ],
    accountant: [
      'view_financial_reports',
      'export_financial_data',
      'view_transactions',
      'manage_invoices',
      'view_expenses',
      'manage_expenses',
      'view_payroll',
      'generate_reports',
      'view_tax_reports',
      'manage_reconciliation'
    ],
    admin: [
      'manage_users',
      'manage_roles',
      'manage_permissions',
      'view_system_logs',
      'manage_integrations',
      'manage_backups',
      'manage_security',
      'view_audit_logs',
      'manage_organization_settings',
      'manage_api_keys'
    ]
  }

  return permissions[role] || []
}

// Helper function to determine role from email
function determineRoleFromEmail(email: string): string {
  const emailLower = email.toLowerCase()

  if (emailLower.includes('michele') || emailLower.includes('owner')) {
    return 'owner'
  } else if (emailLower.includes('manager')) {
    return 'manager'
  } else if (emailLower.includes('receptionist')) {
    return 'receptionist'
  } else if (emailLower.includes('stylist')) {
    return 'stylist'
  } else if (emailLower.includes('accountant')) {
    return 'accountant'
  } else if (emailLower.includes('admin')) {
    return 'admin'
  }

  // Default to receptionist for unrecognized emails
  return 'receptionist'
}

export function HairTalkzAuthSimple() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  // Demo users removed - using proper Supabase authentication

  // Clear any invalid tokens on mount to prevent refresh errors
  useEffect(() => {
    const handleAuthError = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        // If there's an error or no valid session, clear storage
        if (error || !session) {
          await supabase.auth.signOut()
          clearInvalidTokens()
          console.log('🧹 Cleared invalid auth tokens on mount')
        }
      } catch (error) {
        console.error('Error checking session:', error)
        // Clear tokens on any error
        clearInvalidTokens()
      }
    }

    handleAuthError()
  }, [])

  // Demo user selection removed - using proper authentication flow

  const handleLogin = async (
    e: React.FormEvent | null,
    loginEmail?: string,
    loginPassword?: string
  ) => {
    if (e) e.preventDefault()

    const currentEmail = loginEmail || email
    const currentPassword = loginPassword || password

    if (!currentEmail || !currentPassword) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in email and password',
        variant: 'destructive'
      })
      return
    }

    // Automatically determine role from email
    const currentRole = determineRoleFromEmail(currentEmail)

    setLoading(true)

    try {
      // First sign out to clear any existing session
      await supabase.auth.signOut()

      // Clear localStorage
      localStorage.clear()

      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password: currentPassword
      })

      if (error) throw error

      if (data.session) {
        // ✅ CORRECT: No business logic in auth metadata
        // Business data is now stored in HERA entities and dynamic data

        // Set local storage for organization context and RBAC
        localStorage.setItem('organizationId', HAIRTALKZ_ORG_ID)
        localStorage.setItem('salonRole', currentRole)
        localStorage.setItem(
          'userPermissions',
          JSON.stringify(getRolePermissions(currentRole))
        )

        // Get redirect path based on role
        const roleConfig = USER_ROLES.find(r => r.value === currentRole)
        const redirectPath = roleConfig?.redirectPath || '/salon/dashboard'

        toast({
          title: 'Welcome to HairTalkz',
          description: `Logged in as ${roleConfig?.label}`
        })

        // Wait for auth/attach endpoint to complete before redirecting
        console.log('🔗 Calling auth/attach endpoint...')
        try {
          const attachResponse = await fetch('/api/v2/auth/attach', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${data.session.access_token}`,
              'x-hera-org-id': HAIRTALKZ_ORG_ID,
              'Content-Type': 'application/json'
            }
          })

          if (attachResponse.ok) {
            console.log('✅ Auth attach completed successfully')
            
            // Give a moment for the auth provider to update state
            setTimeout(() => {
              window.location.href = redirectPath
            }, 500)
          } else {
            console.error('❌ Auth attach failed:', await attachResponse.text())
            // Still redirect but show warning
            toast({
              title: 'Warning',
              description: 'Authentication completed but user setup had issues',
              variant: 'destructive'
            })
            setTimeout(() => {
              window.location.href = redirectPath
            }, 1000)
          }
        } catch (error) {
          console.error('❌ Auth attach error:', error)
          // Still redirect but show warning
          toast({
            title: 'Warning', 
            description: 'Authentication completed but user setup had issues',
            variant: 'destructive'
          })
          setTimeout(() => {
            window.location.href = redirectPath
          }, 1000)
        }
      }
    } catch (error: any) {
      console.error('Login error:', error)
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid credentials. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: COLORS.black,
        backgroundImage: `radial-gradient(circle at 20% 50%, ${COLORS.charcoal} 0%, ${COLORS.black} 50%)`
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-6">
            <div
              className="h-20 w-20 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                boxShadow: '0 0 40px rgba(212, 175, 55, 0.4)'
              }}
            >
              <Crown className="h-10 w-10" style={{ color: COLORS.black }} />
            </div>
          </div>

          <h1
            className="text-5xl font-light mb-3 tracking-wider"
            style={{
              background: `linear-gradient(135deg, ${COLORS.champagne} 0%, ${COLORS.gold} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            HAIRTALKZ
          </h1>

          <p
            className="text-lg font-light tracking-widest uppercase"
            style={{ color: COLORS.bronze }}
          >
            Professional Access Portal
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="space-y-6 p-8 rounded-2xl"
          style={{
            backgroundColor: COLORS.charcoalLight,
            border: `1px solid ${COLORS.bronze}30`,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Email Input */}
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-light tracking-wider uppercase"
              style={{ color: COLORS.bronze }}
            >
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
              className="h-12 px-4 font-light"
              style={{
                backgroundColor: COLORS.charcoal,
                border: `1px solid ${COLORS.bronze}50`,
                color: COLORS.champagne
              }}
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-light tracking-wider uppercase"
              style={{ color: COLORS.bronze }}
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                className="h-12 px-4 pr-12 font-light"
                style={{
                  backgroundColor: COLORS.charcoal,
                  border: `1px solid ${COLORS.bronze}50`,
                  color: COLORS.champagne
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: COLORS.bronze }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p
              className="text-xs font-light italic mt-1"
              style={{ color: COLORS.bronze + '80' }}
            >
              Your access level is automatically determined from your email
            </p>
          </div>

          {/* Remember Me */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={checked => setRememberMe(checked as boolean)}
              disabled={loading}
              className="border-bronze data-[state=checked]:bg-gold data-[state=checked]:border-gold"
            />
            <Label
              htmlFor="remember"
              className="text-sm font-light cursor-pointer"
              style={{ color: COLORS.bronze }}
            >
              Remember me for 30 days
            </Label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 text-base font-light tracking-wider uppercase transition-all duration-300"
            style={{
              backgroundColor: COLORS.gold,
              color: COLORS.black,
              boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)'
            }}
            onMouseEnter={e => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = COLORS.goldDark
                e.currentTarget.style.boxShadow = '0 0 40px rgba(212, 175, 55, 0.5)'
              }
            }}
            onMouseLeave={e => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = COLORS.gold
                e.currentTarget.style.boxShadow = '0 0 30px rgba(212, 175, 55, 0.3)'
              }
            }}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-5 w-5" />
                Secure Login
                <ChevronRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>

          {/* Forgot Password */}
          <div className="text-center">
            <a
              href="#"
              className="text-sm font-light transition-colors hover:underline"
              style={{ color: COLORS.bronze }}
              onMouseEnter={e => (e.currentTarget.style.color = COLORS.gold)}
              onMouseLeave={e => (e.currentTarget.style.color = COLORS.bronze)}
            >
              Forgot your password?
            </a>
          </div>
        </form>

        {/* Authentication Notice */}
        <div className="mt-6 text-center">
          <p className="text-sm font-light tracking-wider" style={{ color: COLORS.bronze + '80' }}>
            Using secure HERA v2.2 authentication
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs font-light" style={{ color: COLORS.bronze + '80' }}>
            Protected by enterprise-grade security
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <Sparkles className="h-3 w-3" style={{ color: COLORS.gold }} />
            <p className="text-xs font-light tracking-wider" style={{ color: COLORS.bronze }}>
              Powered by HERA ERP
            </p>
            <Sparkles className="h-3 w-3" style={{ color: COLORS.gold }} />
          </div>
        </div>
      </div>
    </div>
  )
}
