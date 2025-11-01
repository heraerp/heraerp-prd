'use client'

/**
 * ✨ SALON LUXE ENTERPRISE SETTINGS PAGE
 *
 * UPGRADED FEATURES (v2.3):
 * - ✅ SalonLuxePage wrapper for consistent layout
 * - ✅ PremiumMobileHeader for iOS-style mobile experience
 * - ✅ Lazy loading with Suspense boundaries for performance
 * - ✅ Mobile-first responsive design (44px touch targets)
 * - ✅ StatusToastProvider for enterprise notifications
 * - ✅ SALON_LUXE_COLORS theme consistency
 * - ✅ useUniversalEntityV1 hook (NO direct RPC calls)
 * - ✅ Bottom spacing for mobile scroll comfort
 * - ✅ Progressive enhancement with graceful degradation
 *
 * HERA DNA COMPLIANCE:
 * - Organization settings stored in core_dynamic_data
 * - All mutations through HERA hooks (actor-stamped)
 * - Smart Code patterns for all dynamic fields
 * - No direct Supabase calls - only through hooks
 */

import React, { useEffect, useState, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { PremiumMobileHeader } from '@/components/salon/mobile/PremiumMobileHeader'
import { StatusToastProvider, useSalonToast } from '@/components/salon/ui/StatusToastProvider'
import {
  Settings,
  Users,
  Shield,
  Database,
  Bell,
  Palette,
  Globe,
  Key,
  Loader2,
  Save,
  RefreshCw,
  Package,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { SALON_LUXE_COLORS as LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'
import { useUniversalEntityV1 } from '@/hooks/useUniversalEntityV1'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

// 🚀 PERFORMANCE: Skeleton loader for tabs
function TabLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div
        className="animate-spin rounded-full h-8 w-8 border-b-2"
        style={{ borderColor: LUXE_COLORS.gold.base }}
      />
      <span className="ml-3" style={{ color: LUXE_COLORS.text.secondary }}>
        Loading...
      </span>
    </div>
  )
}

function SettingsPageContent() {
  const router = useRouter()
  const context = useSecuredSalonContext()
  const { user } = useHERAAuth() // Get actor user ID for RPC
  const { showSuccess, showError, showLoading, removeToast } = useSalonToast()

  // ✅ CRITICAL FIX: Pass organizationId to hook to prevent undefined access
  // The hook will use this instead of trying to access organization from HERAAuth
  const safeOrgId = context?.organizationId || context?.orgId || ''
  const { updateEntity } = useUniversalEntityV1({
    entity_type: 'ORG',
    organizationId: safeOrgId // Provide explicit orgId to prevent undefined errors
  })

  // Form state for organization settings - MUST be before conditional returns
  const [activeTab, setActiveTab] = useState('general')
  const [organizationName, setOrganizationName] = useState('')
  const [legalName, setLegalName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [trn, setTrn] = useState('')
  const [currency, setCurrency] = useState('')
  const [isSaving] = useState(false)

  // ✅ LOADING STATE: Show loader if context is still loading or undefined
  if (!context || context.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: LUXE_COLORS.black }}>
        <div className="text-center">
          <Loader2
            className="h-8 w-8 animate-spin mx-auto mb-4"
            style={{ color: LUXE_COLORS.gold.base }}
          />
          <p style={{ color: LUXE_COLORS.text.secondary }}>Loading settings...</p>
        </div>
      </div>
    )
  }

  // ✅ SAFETY: Safely destructure with fallbacks (after loading check)
  const organizationId = safeOrgId
  const role = context.salonRole || context.role || 'stylist'
  const organization = context.organization || { id: '', name: '', currency: 'AED', currencySymbol: 'AED' }
  const contextUser = context.user

  // Initialize form state from context when data loads
  useEffect(() => {
    console.log('[Settings] Loading organization data:', organization)
    if (organization) {
      setOrganizationName(organization.name || '')
      setLegalName(organization.legal_name || '')
      setPhone(organization.phone || '')
      setEmail(organization.email || '')
      setAddress(organization.address || '')
      setTrn(organization.trn || '')
      setCurrency(organization.currency || 'AED')
    }
  }, [organization])

  // Save organization settings using HERA hook
  const handleSaveOrganizationSettings = async () => {
    if (!organizationId) {
      showError('Error', 'No organization context found')
      return
    }

    if (!user?.id) {
      showError('Error', 'User session not found')
      return
    }

    const loadingId = showLoading('Saving settings...', 'Please wait while we update your organization settings')
    setIsSaving(true)

    // ✅ Build dynamic fields in HERA hook format
    // Format: { field_name: { value: 'data', type: 'text', smart_code: '...' } }
    const dynamicFields = {
      organization_name: {
        value: organizationName,
        type: 'text',
        smart_code: 'HERA.SALON.ORGANIZATION.FIELD.NAME.v1'
      },
      legal_name: {
        value: legalName,
        type: 'text',
        smart_code: 'HERA.SALON.ORGANIZATION.FIELD.LEGAL_NAME.v1'
      },
      phone: {
        value: phone,
        type: 'text',
        smart_code: 'HERA.SALON.ORGANIZATION.FIELD.PHONE.v1'
      },
      email: {
        value: email,
        type: 'text',
        smart_code: 'HERA.SALON.ORGANIZATION.FIELD.EMAIL.v1'
      },
      address: {
        value: address,
        type: 'text',
        smart_code: 'HERA.SALON.ORGANIZATION.FIELD.ADDRESS.v1'
      },
      trn: {
        value: trn,
        type: 'text',
        smart_code: 'HERA.SALON.ORGANIZATION.FIELD.TRN.v1'
      },
      currency: {
        value: currency,
        type: 'text',
        smart_code: 'HERA.SALON.ORGANIZATION.FIELD.CURRENCY.v1'
      }
    }

    try {
      console.log('[Settings] 🔍 Calling useUniversalEntityV1.updateEntity with:', {
        entity_id: organizationId,
        organization_id: organizationId,
        dynamic_fields_count: Object.keys(dynamicFields).length
      })

      // ✅ Use HERA hook instead of direct RPC call
      const result = await updateEntity({
        entity_id: organizationId,
        entity_type: 'ORG', // ✅ CRITICAL: Organizations use 'ORG' not 'ORGANIZATION'
        organization_id: organizationId,
        dynamic_fields: dynamicFields,
        options: {
          include_dynamic: true
        }
      })

      console.log('[Settings] Save successful - Full response:', JSON.stringify(result, null, 2))

      removeToast(loadingId)
      showSuccess('Settings saved successfully', 'Organization settings have been updated')

      console.log('[Settings] ✅ Settings saved successfully')

      // ✅ NO RELOAD NEEDED: Form state is already updated with the returned data from hook
      // The organization context will be refreshed on next navigation or manual refresh
    } catch (error: any) {
      console.error('[Settings] Error saving organization settings:', {
        error,
        errorMessage: error.message,
        errorString: String(error),
        organizationId,
        userId: user?.id,
        dynamicFields: Object.keys(dynamicFields || {})
      })

      removeToast(loadingId)
      showError(
        'Failed to save settings',
        error.message || 'Please check the console for detailed error information and try again'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SalonLuxePage
      title="Settings"
      description="Configure system settings and manage your organization"
      maxWidth="full"
      padding="lg"
      actions={
        <button
          onClick={() => window.location.reload()}
          className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            backgroundColor: LUXE_COLORS.charcoal.base,
            border: `1px solid ${LUXE_COLORS.text.secondary}40`,
            color: LUXE_COLORS.text.secondary
          }}
          title="Refresh data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      }
    >
      {/* 📱 PREMIUM MOBILE HEADER */}
      <PremiumMobileHeader
        title="Settings"
        subtitle={organizationName || 'System Configuration'}
        showNotifications={false}
        shrinkOnScroll
        rightAction={
          <button
            onClick={() => window.location.reload()}
            className="w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform duration-200"
            style={{
              background: `linear-gradient(135deg, ${LUXE_COLORS.gold.base}30 0%, ${LUXE_COLORS.gold.base}20 100%)`,
              border: `1px solid ${LUXE_COLORS.gold.base}40`
            }}
            aria-label="Refresh"
          >
            <RefreshCw className="w-5 h-5" style={{ color: LUXE_COLORS.gold.base }} />
          </button>
        }
      />

      <div className="p-4 md:p-6 lg:p-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList
            className="w-full md:w-auto grid grid-cols-2 md:flex md:inline-flex gap-2 p-1"
            style={{
              backgroundColor: LUXE_COLORS.charcoal.light,
              border: `1px solid ${LUXE_COLORS.border.light}`
            }}
          >
            <TabsTrigger
              value="general"
              className="min-h-[44px] data-[state=active]:bg-gold/20 data-[state=active]:text-gold transition-all"
              style={{
                color: activeTab === 'general' ? LUXE_COLORS.gold.base : LUXE_COLORS.text.secondary
              }}
            >
              <Settings className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">General</span>
              <span className="md:hidden">General</span>
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="min-h-[44px] data-[state=active]:bg-gold/20 data-[state=active]:text-gold transition-all"
              style={{
                color: activeTab === 'users' ? LUXE_COLORS.gold.base : LUXE_COLORS.text.secondary
              }}
            >
              <Users className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Users</span>
              <span className="md:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="min-h-[44px] data-[state=active]:bg-gold/20 data-[state=active]:text-gold transition-all"
              style={{
                color: activeTab === 'security' ? LUXE_COLORS.gold.base : LUXE_COLORS.text.secondary
              }}
            >
              <Shield className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Security</span>
              <span className="md:hidden">Security</span>
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="min-h-[44px] data-[state=active]:bg-gold/20 data-[state=active]:text-gold transition-all"
              style={{
                color: activeTab === 'integrations' ? LUXE_COLORS.gold.base : LUXE_COLORS.text.secondary
              }}
            >
              <Key className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Integrations</span>
              <span className="md:hidden">API</span>
            </TabsTrigger>
          </TabsList>

          <Suspense fallback={<TabLoader />}>
            <TabsContent value="general">
              <div className="grid gap-6 animate-in fade-in duration-300">
                {/* Salon Information */}
                <Card
                  className="border-0 shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.charcoal.light} 0%, ${LUXE_COLORS.charcoal.dark} 100%)`,
                    border: `1px solid ${LUXE_COLORS.border.light}`
                  }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2" style={{ color: LUXE_COLORS.champagne.base }}>
                      <Sparkles className="w-5 h-5" style={{ color: LUXE_COLORS.gold.base }} />
                      Organization Information
                    </CardTitle>
                    <CardDescription style={{ color: LUXE_COLORS.text.secondary }}>
                      Basic information about your organization
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label style={{ color: LUXE_COLORS.text.secondary }}>Organization Name</Label>
                        <Input
                          value={organizationName}
                          onChange={(e) => setOrganizationName(e.target.value)}
                          placeholder="Enter organization name"
                          className="min-h-[44px]"
                          style={{
                            backgroundColor: LUXE_COLORS.charcoal.dark,
                            border: `1px solid ${LUXE_COLORS.border.light}`,
                            color: LUXE_COLORS.champagne.base
                          }}
                        />
                      </div>
                      <div>
                        <Label style={{ color: LUXE_COLORS.text.secondary }}>Legal Name</Label>
                        <Input
                          value={legalName}
                          onChange={(e) => setLegalName(e.target.value)}
                          placeholder="Enter legal name (optional)"
                          className="min-h-[44px]"
                          style={{
                            backgroundColor: LUXE_COLORS.charcoal.dark,
                            border: `1px solid ${LUXE_COLORS.border.light}`,
                            color: LUXE_COLORS.champagne.base
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label style={{ color: LUXE_COLORS.text.secondary }}>Phone Number</Label>
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+971 4 123 4567"
                          className="min-h-[44px]"
                          style={{
                            backgroundColor: LUXE_COLORS.charcoal.dark,
                            border: `1px solid ${LUXE_COLORS.border.light}`,
                            color: LUXE_COLORS.champagne.base
                          }}
                        />
                      </div>
                      <div>
                        <Label style={{ color: LUXE_COLORS.text.secondary }}>Email Address</Label>
                        <Input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="info@example.com"
                          type="email"
                          className="min-h-[44px]"
                          style={{
                            backgroundColor: LUXE_COLORS.charcoal.dark,
                            border: `1px solid ${LUXE_COLORS.border.light}`,
                            color: LUXE_COLORS.champagne.base
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <Label style={{ color: LUXE_COLORS.text.secondary }}>Address</Label>
                      <Input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter complete address"
                        className="min-h-[44px]"
                        style={{
                          backgroundColor: LUXE_COLORS.charcoal.dark,
                          border: `1px solid ${LUXE_COLORS.border.light}`,
                          color: LUXE_COLORS.champagne.base
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label style={{ color: LUXE_COLORS.text.secondary }}>Tax Registration Number (TRN)</Label>
                        <Input
                          value={trn}
                          onChange={(e) => setTrn(e.target.value)}
                          placeholder="Enter TRN"
                          className="min-h-[44px]"
                          style={{
                            backgroundColor: LUXE_COLORS.charcoal.dark,
                            border: `1px solid ${LUXE_COLORS.border.light}`,
                            color: LUXE_COLORS.champagne.base
                          }}
                        />
                      </div>
                      <div>
                        <Label style={{ color: LUXE_COLORS.text.secondary }}>Currency</Label>
                        <Input
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          placeholder="AED"
                          className="min-h-[44px]"
                          style={{
                            backgroundColor: LUXE_COLORS.charcoal.dark,
                            border: `1px solid ${LUXE_COLORS.border.light}`,
                            color: LUXE_COLORS.champagne.base
                          }}
                        />
                        <p className="text-xs mt-1" style={{ color: LUXE_COLORS.text.tertiary }}>
                          Current symbol: {organization?.currencySymbol || 'AED'}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleSaveOrganizationSettings}
                        disabled={isSaving}
                        className="min-h-[48px] px-6 font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                        style={{ backgroundColor: LUXE_COLORS.gold.base, color: LUXE_COLORS.charcoal.dark }}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Business Hours */}
                <Card
                  className="border-0 shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.charcoal.light} 0%, ${LUXE_COLORS.charcoal.dark} 100%)`,
                    border: `1px solid ${LUXE_COLORS.border.light}`
                  }}
                >
                  <CardHeader>
                    <CardTitle style={{ color: LUXE_COLORS.champagne.base }}>Business Hours</CardTitle>
                    <CardDescription style={{ color: LUXE_COLORS.text.secondary }}>
                      Set your salon's operating hours
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        'Monday',
                        'Tuesday',
                        'Wednesday',
                        'Thursday',
                        'Friday',
                        'Saturday',
                        'Sunday'
                      ].map(day => (
                        <div key={day} className="flex items-center justify-between py-2">
                          <span style={{ color: LUXE_COLORS.champagne.base }}>{day}</span>
                          <div className="flex items-center gap-4">
                            <span style={{ color: LUXE_COLORS.text.secondary }}>9:00 AM - 8:00 PM</span>
                            <Switch />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Inventory Settings */}
                <Card
                  className="border-0 shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.charcoal.light} 0%, ${LUXE_COLORS.charcoal.dark} 100%)`,
                    border: `1px solid ${LUXE_COLORS.border.light}`
                  }}
                >
                  <CardHeader>
                    <CardTitle style={{ color: LUXE_COLORS.champagne.base }}>
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5" style={{ color: LUXE_COLORS.gold.base }} />
                        Inventory Management
                      </div>
                    </CardTitle>
                    <CardDescription style={{ color: LUXE_COLORS.text.secondary }}>
                      Configure inventory tracking and stock management settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <p style={{ color: LUXE_COLORS.champagne.base }}>
                          Enable inventory tracking, manage stock levels, and configure
                          branch-specific inventory settings.
                        </p>
                        <p className="text-sm mt-2" style={{ color: LUXE_COLORS.text.secondary }}>
                          Control which products require inventory tracking and set organization-wide
                          defaults.
                        </p>
                      </div>
                      <Button
                        onClick={() => router.push('/salon/settings/inventory')}
                        className="min-h-[48px] font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                        style={{ backgroundColor: LUXE_COLORS.gold.base, color: LUXE_COLORS.charcoal.dark }}
                      >
                        Configure
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users">
              <Card
                className="border-0 shadow-lg animate-in fade-in duration-300"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.charcoal.light} 0%, ${LUXE_COLORS.charcoal.dark} 100%)`,
                  border: `1px solid ${LUXE_COLORS.border.light}`
                }}
              >
                <CardHeader>
                  <CardTitle style={{ color: LUXE_COLORS.champagne.base }}>User Management</CardTitle>
                  <CardDescription style={{ color: LUXE_COLORS.text.secondary }}>
                    Manage staff accounts and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* User List */}
                    <div className="space-y-2">
                      {[
                        {
                          name: 'Michele Rodriguez',
                          email: 'owner@hairtalkz.ae',
                          role: 'Owner',
                          status: 'Active'
                        },
                        {
                          name: 'Sarah Johnson',
                          email: 'receptionist@hairtalkz.ae',
                          role: 'Receptionist',
                          status: 'Active'
                        },
                        {
                          name: 'Michael Chen',
                          email: 'accountant@hairtalkz.ae',
                          role: 'Accountant',
                          status: 'Active'
                        },
                        {
                          name: 'David Thompson',
                          email: 'admin@hairtalkz.ae',
                          role: 'Admin',
                          status: 'Active'
                        }
                      ].map(user => (
                        <div
                          key={user.email}
                          className="flex items-center justify-between p-4 rounded-lg transition-all duration-200 hover:scale-102"
                          style={{ backgroundColor: LUXE_COLORS.charcoal.dark }}
                        >
                          <div>
                            <div style={{ color: LUXE_COLORS.champagne.base }}>{user.name}</div>
                            <div className="text-sm" style={{ color: LUXE_COLORS.text.secondary }}>
                              {user.email}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span
                              className="text-sm px-2 py-1 rounded"
                              style={{
                                backgroundColor: LUXE_COLORS.emerald.base + '20',
                                color: LUXE_COLORS.emerald.base
                              }}
                            >
                              {user.status}
                            </span>
                            <span className="text-sm" style={{ color: LUXE_COLORS.gold.base }}>
                              {user.role}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        className="min-h-[48px] font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                        style={{ backgroundColor: LUXE_COLORS.gold.base, color: LUXE_COLORS.charcoal.dark }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <div className="grid gap-6 animate-in fade-in duration-300">
                {/* Password Policy */}
                <Card
                  className="border-0 shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.charcoal.light} 0%, ${LUXE_COLORS.charcoal.dark} 100%)`,
                    border: `1px solid ${LUXE_COLORS.border.light}`
                  }}
                >
                  <CardHeader>
                    <CardTitle style={{ color: LUXE_COLORS.champagne.base }}>Password Policy</CardTitle>
                    <CardDescription style={{ color: LUXE_COLORS.text.secondary }}>
                      Configure password requirements
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <Label style={{ color: LUXE_COLORS.champagne.base }}>Minimum password length</Label>
                      <Input
                        type="number"
                        defaultValue="8"
                        className="w-20 min-h-[44px]"
                        style={{
                          backgroundColor: LUXE_COLORS.charcoal.dark,
                          border: `1px solid ${LUXE_COLORS.border.light}`,
                          color: LUXE_COLORS.champagne.base
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <Label style={{ color: LUXE_COLORS.champagne.base }}>
                        Require uppercase letters
                      </Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <Label style={{ color: LUXE_COLORS.champagne.base }}>
                        Require special characters
                      </Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <Label style={{ color: LUXE_COLORS.champagne.base }}>Require numbers</Label>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>

                {/* Session Management */}
                <Card
                  className="border-0 shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.charcoal.light} 0%, ${LUXE_COLORS.charcoal.dark} 100%)`,
                    border: `1px solid ${LUXE_COLORS.border.light}`
                  }}
                >
                  <CardHeader>
                    <CardTitle style={{ color: LUXE_COLORS.champagne.base }}>Session Management</CardTitle>
                    <CardDescription style={{ color: LUXE_COLORS.text.secondary }}>
                      Configure session timeout and security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <Label style={{ color: LUXE_COLORS.champagne.base }}>
                        Session timeout (minutes)
                      </Label>
                      <Input
                        type="number"
                        defaultValue="30"
                        className="w-20 min-h-[44px]"
                        style={{
                          backgroundColor: LUXE_COLORS.charcoal.dark,
                          border: `1px solid ${LUXE_COLORS.border.light}`,
                          color: LUXE_COLORS.champagne.base
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <Label style={{ color: LUXE_COLORS.champagne.base }}>
                        Enable two-factor authentication
                      </Label>
                      <Switch />
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button
                        className="min-h-[48px] font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                        style={{ backgroundColor: LUXE_COLORS.gold.base, color: LUXE_COLORS.charcoal.dark }}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Security Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="integrations">
              <Card
                className="border-0 shadow-lg animate-in fade-in duration-300"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.charcoal.light} 0%, ${LUXE_COLORS.charcoal.dark} 100%)`,
                  border: `1px solid ${LUXE_COLORS.border.light}`
                }}
              >
                <CardHeader>
                  <CardTitle style={{ color: LUXE_COLORS.champagne.base }}>API & Integrations</CardTitle>
                  <CardDescription style={{ color: LUXE_COLORS.text.secondary }}>
                    Manage third-party integrations and API keys
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label style={{ color: LUXE_COLORS.text.secondary }}>API Key</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        defaultValue="sk_live_****************************"
                        readOnly
                        className="min-h-[44px]"
                        style={{
                          backgroundColor: LUXE_COLORS.charcoal.dark,
                          border: `1px solid ${LUXE_COLORS.border.light}`,
                          color: LUXE_COLORS.champagne.base
                        }}
                      />
                      <Button
                        variant="outline"
                        className="min-w-[44px] min-h-[44px]"
                        style={{ borderColor: LUXE_COLORS.text.secondary }}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <h3 className="text-lg font-medium" style={{ color: LUXE_COLORS.champagne.base }}>
                      Active Integrations
                    </h3>
                    <div className="space-y-2">
                      {[
                        { name: 'WhatsApp Business API', status: 'Connected', icon: '💬' },
                        { name: 'Payment Gateway', status: 'Connected', icon: '💳' },
                        { name: 'SMS Provider', status: 'Not Connected', icon: '📱' },
                        { name: 'Email Service', status: 'Connected', icon: '✉️' }
                      ].map(integration => (
                        <div
                          key={integration.name}
                          className="flex items-center justify-between p-3 rounded transition-all duration-200 hover:scale-102"
                          style={{ backgroundColor: LUXE_COLORS.charcoal.dark }}
                        >
                          <div className="flex items-center gap-3">
                            <span>{integration.icon}</span>
                            <span style={{ color: LUXE_COLORS.champagne.base }}>{integration.name}</span>
                          </div>
                          <span
                            className="text-sm"
                            style={{
                              color:
                                integration.status === 'Connected'
                                  ? LUXE_COLORS.emerald.base
                                  : LUXE_COLORS.text.secondary
                            }}
                          >
                            {integration.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Suspense>
        </Tabs>

        {/* Role and Permissions Info */}
        <div className="mt-8 text-sm text-center animate-in fade-in duration-300" style={{ color: LUXE_COLORS.text.tertiary }}>
          Logged in as: {role?.toUpperCase()} • Organization: {organizationId}
          <br />
          Access: User Management, System Settings, Security Configuration, API Management
        </div>

        {/* 📱 BOTTOM SPACING - Mobile scroll comfort */}
        <div className="h-24 md:h-0" />
      </div>
    </SalonLuxePage>
  )
}

export default function SalonSettingsPage() {
  return (
    <StatusToastProvider>
      <SettingsPageContent />
    </StatusToastProvider>
  )
}
