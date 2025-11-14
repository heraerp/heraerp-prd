'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
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
import { useToast } from '@/components/ui/useToast'

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
    redirectPath: '/salon/pos'
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
    redirectPath: '/salon/settings'
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

export function HairTalkzAuth() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (session?.user) {
        const userMetadata = session.user.user_metadata
        const storedRole = localStorage.getItem('salonRole')
        const storedOrgId = localStorage.getItem('organizationId')

        // Check if user has complete auth setup
        const hasCompleteAuth =
          storedOrgId === HAIRTALKZ_ORG_ID &&
          storedRole &&
          userMetadata?.role &&
          userMetadata?.organization_id === HAIRTALKZ_ORG_ID

        if (hasCompleteAuth) {
          const roleConfig = USER_ROLES.find(r => r.value === storedRole.toLowerCase())
          if (roleConfig) {
            router.replace(roleConfig.redirectPath)
          }
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password || !selectedRole) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields and select your role',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      if (data.session) {
        // Update user metadata with organization and role
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            organization_id: HAIRTALKZ_ORG_ID,
            role: selectedRole,
            full_name: email.split('@')[0], // Use email prefix as name
            roles: [selectedRole], // Array of roles for RBAC
            permissions: getRolePermissions(selectedRole) // Add role-specific permissions
          }
        })

        if (updateError) {
          console.error('Error updating user metadata:', updateError)
        }

        // Set local storage for organization context and RBAC
        localStorage.setItem('organizationId', HAIRTALKZ_ORG_ID)
        localStorage.setItem('salonRole', selectedRole)
        localStorage.setItem('userPermissions', JSON.stringify(getRolePermissions(selectedRole)))

        // Get redirect path based on role
        const roleConfig = USER_ROLES.find(r => r.value === selectedRole)
        const redirectPath = roleConfig?.redirectPath || '/salon/dashboard'

        // Refresh session to ensure JWT contains updated metadata
        const {
          data: { session: refreshedSession }
        } = await supabase.auth.refreshSession()

        if (refreshedSession) {
          // JWT now contains role information in user_metadata
          console.log('JWT Token updated with role:', refreshedSession.user.user_metadata.role)
          console.log('JWT Token permissions:', refreshedSession.user.user_metadata.permissions)
        }

        toast({
          title: 'Welcome to HairTalkz',
          description: `Logged in as ${roleConfig?.label}`
        })

        router.push(redirectPath)
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
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label
              htmlFor="role"
              className="text-sm font-light tracking-wider uppercase"
              style={{ color: COLORS.bronze }}
            >
              Access Level
            </Label>
            <Select value={selectedRole} onValueChange={setSelectedRole} disabled={loading}>
              <SelectTrigger
                className="h-12 font-light"
                style={{
                  backgroundColor: COLORS.charcoal,
                  border: `1px solid ${COLORS.bronze}50`,
                  color: COLORS.champagne
                }}
              >
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent
                className="hera-select-content hairtalkz-select-content"
                style={{
                  backgroundColor: COLORS.charcoalLight,
                  border: `1px solid ${COLORS.bronze}50`
                }}
              >
                {USER_ROLES.map(role => (
                  <SelectItem
                    key={role.value}
                    value={role.value}
                    className="cursor-pointer hera-select-item"
                    style={{
                      color: COLORS.champagne
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <role.icon className="h-4 w-4" style={{ color: COLORS.gold }} />
                      <div>
                        <div style={{ color: COLORS.champagne }}>{role.label}</div>
                        <div className="text-xs" style={{ color: COLORS.bronze }}>
                          {role.description}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
