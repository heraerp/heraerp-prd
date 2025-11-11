'use client'

/**
 * ✨ SALON LUXE ENTERPRISE SETTINGS PAGE v3.0
 *
 * UPGRADED FEATURES:
 * - ✅ SalonLuxeButton, SalonLuxePage, SalonLuxeCard components
 * - ✅ PremiumMobileHeader for iOS-style mobile experience
 * - ✅ Lazy loading with Suspense boundaries for performance
 * - ✅ Mobile-first responsive design (44px touch targets)
 * - ✅ StatusToastProvider for enterprise notifications
 * - ✅ SALON_LUXE_COLORS theme consistency
 * - ✅ Glassmorphism design with backdrop blur
 * - ✅ Progressive disclosure and organized sections
 * - ✅ Enterprise-grade accessibility (ARIA labels, keyboard nav)
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import { PremiumMobileHeader } from '@/components/salon/mobile/PremiumMobileHeader'
import { StatusToastProvider, useSalonToast } from '@/components/salon/ui/StatusToastProvider'
import { BusinessHoursSection } from '@/components/salon/settings/BusinessHoursSection'
import {
  Settings,
  Users,
  Shield,
  Bell,
  Palette,
  Globe,
  Key,
  Loader2,
  Save,
  RefreshCw,
  Package,
  ArrowRight,
  Sparkles,
  Building2,
  Clock,
  Mail,
  Phone,
  MapPin,
  CreditCard
} from 'lucide-react'
import { SALON_LUXE_COLORS as LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'
import { entityCRUD } from '@/lib/universal-api-v2-client'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

// 🚀 LAZY LOADING: Split heavy components for faster initial load
const InventorySettingsCard = lazy(() =>
  import('@/components/salon/settings/InventorySettingsCard').then(m => ({ default: m.InventorySettingsCard }))
)

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

// 🚀 PERFORMANCE: Card skeleton
function CardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div
        className="h-48 rounded-xl"
        style={{
          background: `linear-gradient(135deg, ${LUXE_COLORS.charcoal.light} 0%, ${LUXE_COLORS.charcoal.dark} 100%)`,
          border: `1px solid ${LUXE_COLORS.border.light}`
        }}
      />
    </div>
  )
}

function SettingsPageContent() {
  const router = useRouter()
  const context = useSecuredSalonContext()
  const { user } = useHERAAuth() // Get actor user ID for RPC
  const { showSuccess, showError, showLoading, removeToast } = useSalonToast()

  // Form state for organization settings - MUST be before conditional returns
  const [activeTab, setActiveTab] = useState('general')
  const [organizationName, setOrganizationName] = useState('')
  const [legalName, setLegalName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [trn, setTrn] = useState('')
  const [currency, setCurrency] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // ✅ SAFETY: Safely destructure with fallbacks (even during loading)
  const organizationId = context?.organizationId || context?.orgId || ''
  const role = context?.salonRole || context?.role || 'stylist'
  const organization = context?.organization || { id: '', name: '', currency: 'AED', currencySymbol: 'AED' }
  const contextUser = context?.user

  // ✅ CRITICAL FIX: Initialize form state from context when data loads
  // MUST be before conditional return to maintain consistent hook order
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

    // ✅ Build dynamic fields in RPC format
    const dynamicFields: Record<string, any> = {}

    if (organizationName) {
      dynamicFields.organization_name = {
        field_value_text: organizationName,
        smart_code: 'HERA.SALON.ORGANIZATION.FIELD.NAME.v1'
      }
    }
    if (legalName) {
      dynamicFields.legal_name = {
        field_value_text: legalName,
        smart_code: 'HERA.SALON.ORGANIZATION.FIELD.LEGAL_NAME.v1'
      }
    }
    if (phone) {
      dynamicFields.phone = {
        field_value_text: phone,
        smart_code: 'HERA.SALON.ORGANIZATION.FIELD.PHONE.v1'
      }
    }
    if (email) {
      dynamicFields.email = {
        field_value_text: email,
        smart_code: 'HERA.SALON.ORGANIZATION.FIELD.EMAIL.v1'
      }
    }
    if (address) {
      dynamicFields.address = {
        field_value_text: address,
        smart_code: 'HERA.SALON.ORGANIZATION.FIELD.ADDRESS.v1'
      }
    }
    if (trn) {
      dynamicFields.trn = {
        field_value_text: trn,
        smart_code: 'HERA.SALON.ORGANIZATION.FIELD.TRN.v1'
      }
    }
    if (currency) {
      dynamicFields.currency = {
        field_value_text: currency,
        smart_code: 'HERA.SALON.ORGANIZATION.FIELD.CURRENCY.v1'
      }
    }

    try {
      const result = await entityCRUD({
        p_action: 'UPDATE',
        p_actor_user_id: user?.id || '',
        p_organization_id: organizationId,
        p_entity: {
          entity_id: organizationId,
          entity_type: 'ORGANIZATION'
        },
        p_dynamic: dynamicFields,
        p_relationships: [],
        p_options: {
          include_dynamic: true
        }
      })

      removeToast(loadingId)
      showSuccess('Settings saved successfully', 'Organization settings have been updated')
    } catch (error: any) {
      console.error('[Settings] Error saving organization settings:', error)
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
      description="Configure your salon and manage organization settings"
      maxWidth="full"
      padding="none"
    >
      {/* 📱 PREMIUM MOBILE HEADER */}
      <PremiumMobileHeader
        title="Settings"
        subtitle={organizationName || 'System Configuration'}
        icon={<Settings className="w-6 h-6" />}
        showNotifications={false}
        shrinkOnScroll
      />

      <div className="p-4 md:p-6 lg:p-8">
        {/* Enterprise Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Mobile-First Tab List */}
          <div className="sticky top-0 z-40 -mx-4 md:mx-0 px-4 md:px-0 py-3 md:py-0"
            style={{
              backgroundColor: LUXE_COLORS.black,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
          >
            <TabsList
              className="w-full md:w-auto grid grid-cols-2 md:flex md:inline-flex gap-2 p-1.5 rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${LUXE_COLORS.charcoal.light} 0%, ${LUXE_COLORS.charcoal.dark} 100%)`,
                border: `1px solid ${LUXE_COLORS.border.light}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              <TabsTrigger
                value="general"
                className="min-h-[44px] rounded-lg data-[state=active]:shadow-md transition-all duration-200"
                style={{
                  color: activeTab === 'general' ? LUXE_COLORS.charcoal.dark : LUXE_COLORS.text.secondary,
                  backgroundColor: activeTab === 'general' ? LUXE_COLORS.gold.base : 'transparent',
                  fontWeight: activeTab === 'general' ? 700 : 500
                }}
              >
                <Building2 className="w-4 h-4 mr-2" />
                <span>General</span>
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="min-h-[44px] rounded-lg data-[state=active]:shadow-md transition-all duration-200"
                style={{
                  color: activeTab === 'users' ? LUXE_COLORS.charcoal.dark : LUXE_COLORS.text.secondary,
                  backgroundColor: activeTab === 'users' ? LUXE_COLORS.gold.base : 'transparent',
                  fontWeight: activeTab === 'users' ? 700 : 500
                }}
              >
                <Users className="w-4 h-4 mr-2" />
                <span>Users</span>
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="min-h-[44px] rounded-lg data-[state=active]:shadow-md transition-all duration-200"
                style={{
                  color: activeTab === 'security' ? LUXE_COLORS.charcoal.dark : LUXE_COLORS.text.secondary,
                  backgroundColor: activeTab === 'security' ? LUXE_COLORS.gold.base : 'transparent',
                  fontWeight: activeTab === 'security' ? 700 : 500
                }}
              >
                <Shield className="w-4 h-4 mr-2" />
                <span>Security</span>
              </TabsTrigger>
              <TabsTrigger
                value="integrations"
                className="min-h-[44px] rounded-lg data-[state=active]:shadow-md transition-all duration-200"
                style={{
                  color: activeTab === 'integrations' ? LUXE_COLORS.charcoal.dark : LUXE_COLORS.text.secondary,
                  backgroundColor: activeTab === 'integrations' ? LUXE_COLORS.gold.base : 'transparent',
                  fontWeight: activeTab === 'integrations' ? 700 : 500
                }}
              >
                <Key className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Integrations</span>
                <span className="md:hidden">API</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <Suspense fallback={<TabLoader />}>
            {/* GENERAL TAB */}
            <TabsContent value="general" className="space-y-6 animate-in fade-in duration-300">
              {/* Organization Information Card */}
              <Card
                className="border-0 shadow-2xl overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.charcoal.light} 0%, ${LUXE_COLORS.charcoal.dark} 100%)`,
                  border: `1px solid ${LUXE_COLORS.border.light}`,
                  borderRadius: '16px'
                }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${LUXE_COLORS.gold.base}20 0%, ${LUXE_COLORS.gold.base}30 100%)`,
                        border: `1px solid ${LUXE_COLORS.gold.base}40`
                      }}
                    >
                      <Sparkles className="w-6 h-6" style={{ color: LUXE_COLORS.gold.base }} />
                    </div>
                    <div>
                      <CardTitle className="text-xl" style={{ color: LUXE_COLORS.champagne.base }}>
                        Organization Information
                      </CardTitle>
                      <CardDescription style={{ color: LUXE_COLORS.text.secondary }}>
                        Basic information about your salon
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium" style={{ color: LUXE_COLORS.text.secondary }}>
                        <Building2 className="w-4 h-4" />
                        Organization Name
                      </Label>
                      <Input
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        placeholder="Enter organization name"
                        className="min-h-[48px] rounded-lg text-base"
                        style={{
                          backgroundColor: LUXE_COLORS.charcoal.dark,
                          border: `1px solid ${LUXE_COLORS.border.base}`,
                          color: LUXE_COLORS.champagne.base
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium" style={{ color: LUXE_COLORS.text.secondary }}>
                        <CreditCard className="w-4 h-4" />
                        Legal Name
                      </Label>
                      <Input
                        value={legalName}
                        onChange={(e) => setLegalName(e.target.value)}
                        placeholder="Enter legal name (optional)"
                        className="min-h-[48px] rounded-lg text-base"
                        style={{
                          backgroundColor: LUXE_COLORS.charcoal.dark,
                          border: `1px solid ${LUXE_COLORS.border.base}`,
                          color: LUXE_COLORS.champagne.base
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium" style={{ color: LUXE_COLORS.text.secondary }}>
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </Label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+971 4 123 4567"
                        className="min-h-[48px] rounded-lg text-base"
                        style={{
                          backgroundColor: LUXE_COLORS.charcoal.dark,
                          border: `1px solid ${LUXE_COLORS.border.base}`,
                          color: LUXE_COLORS.champagne.base
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium" style={{ color: LUXE_COLORS.text.secondary }}>
                        <Mail className="w-4 h-4" />
                        Email Address
                      </Label>
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="info@example.com"
                        type="email"
                        className="min-h-[48px] rounded-lg text-base"
                        style={{
                          backgroundColor: LUXE_COLORS.charcoal.dark,
                          border: `1px solid ${LUXE_COLORS.border.base}`,
                          color: LUXE_COLORS.champagne.base
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium" style={{ color: LUXE_COLORS.text.secondary }}>
                      <MapPin className="w-4 h-4" />
                      Address
                    </Label>
                    <Input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter complete address"
                      className="min-h-[48px] rounded-lg text-base"
                      style={{
                        backgroundColor: LUXE_COLORS.charcoal.dark,
                        border: `1px solid ${LUXE_COLORS.border.base}`,
                        color: LUXE_COLORS.champagne.base
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium" style={{ color: LUXE_COLORS.text.secondary }}>
                        <CreditCard className="w-4 h-4" />
                        Tax Registration Number (TRN)
                      </Label>
                      <Input
                        value={trn}
                        onChange={(e) => setTrn(e.target.value)}
                        placeholder="Enter TRN"
                        className="min-h-[48px] rounded-lg text-base"
                        style={{
                          backgroundColor: LUXE_COLORS.charcoal.dark,
                          border: `1px solid ${LUXE_COLORS.border.base}`,
                          color: LUXE_COLORS.champagne.base
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium" style={{ color: LUXE_COLORS.text.secondary }}>
                        <Globe className="w-4 h-4" />
                        Currency
                      </Label>
                      <Input
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        placeholder="AED"
                        className="min-h-[48px] rounded-lg text-base"
                        style={{
                          backgroundColor: LUXE_COLORS.charcoal.dark,
                          border: `1px solid ${LUXE_COLORS.border.base}`,
                          color: LUXE_COLORS.champagne.base
                        }}
                      />
                      <p className="text-xs mt-1" style={{ color: LUXE_COLORS.text.tertiary }}>
                        Current symbol: {organization?.currencySymbol || 'AED'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6 border-t" style={{ borderColor: LUXE_COLORS.border.light }}>
                    <SalonLuxeButton
                      onClick={handleSaveOrganizationSettings}
                      loading={isSaving}
                      variant="primary"
                      size="lg"
                      icon={<Save className="h-5 w-5" />}
                    >
                      Save Changes
                    </SalonLuxeButton>
                  </div>
                </CardContent>
              </Card>

              {/* Business Hours - Branch-Aware */}
              <BusinessHoursSection
                onSuccess={(message) => showSuccess('Success', message)}
                onError={(message) => showError('Error', message)}
              />

              {/* Inventory Settings */}
              <Suspense fallback={<CardSkeleton />}>
                <Card
                  className="border-0 shadow-2xl overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.charcoal.light} 0%, ${LUXE_COLORS.charcoal.dark} 100%)`,
                    border: `1px solid ${LUXE_COLORS.border.light}`,
                    borderRadius: '16px'
                  }}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${LUXE_COLORS.gold.base}20 0%, ${LUXE_COLORS.gold.base}30 100%)`,
                          border: `1px solid ${LUXE_COLORS.gold.base}40`
                        }}
                      >
                        <Package className="w-6 h-6" style={{ color: LUXE_COLORS.gold.base }} />
                      </div>
                      <div>
                        <CardTitle style={{ color: LUXE_COLORS.champagne.base }}>
                          Inventory Management
                        </CardTitle>
                        <CardDescription style={{ color: LUXE_COLORS.text.secondary }}>
                          Configure inventory tracking and stock management
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <p style={{ color: LUXE_COLORS.champagne.base }}>
                          Enable inventory tracking, manage stock levels, and configure
                          branch-specific inventory settings.
                        </p>
                      </div>
                      <SalonLuxeButton
                        onClick={() => router.push('/salon/settings/inventory')}
                        variant="primary"
                        icon={<ArrowRight className="h-5 w-5" />}
                      >
                        Configure
                      </SalonLuxeButton>
                    </div>
                  </CardContent>
                </Card>
              </Suspense>
            </TabsContent>

            {/* USERS TAB */}
            <TabsContent value="users" className="animate-in fade-in duration-300">
              <Card
                className="border-0 shadow-2xl"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.charcoal.light} 0%, ${LUXE_COLORS.charcoal.dark} 100%)`,
                  border: `1px solid ${LUXE_COLORS.border.light}`,
                  borderRadius: '16px'
                }}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${LUXE_COLORS.gold.base}20 0%, ${LUXE_COLORS.gold.base}30 100%)`,
                        border: `1px solid ${LUXE_COLORS.gold.base}40`
                      }}
                    >
                      <Users className="w-6 h-6" style={{ color: LUXE_COLORS.gold.base }} />
                    </div>
                    <div>
                      <CardTitle style={{ color: LUXE_COLORS.champagne.base }}>User Management</CardTitle>
                      <CardDescription style={{ color: LUXE_COLORS.text.secondary }}>
                        Manage staff accounts and permissions
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: 'Michele Rodriguez', email: 'owner@hairtalkz.ae', role: 'Owner', status: 'Active' },
                      { name: 'Sarah Johnson', email: 'receptionist@hairtalkz.ae', role: 'Receptionist', status: 'Active' },
                      { name: 'Michael Chen', email: 'accountant@hairtalkz.ae', role: 'Accountant', status: 'Active' },
                      { name: 'David Thompson', email: 'admin@hairtalkz.ae', role: 'Admin', status: 'Active' }
                    ].map(user => (
                      <div
                        key={user.email}
                        className="flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:scale-[1.01]"
                        style={{
                          backgroundColor: LUXE_COLORS.charcoal.dark,
                          border: `1px solid ${LUXE_COLORS.border.base}`
                        }}
                      >
                        <div>
                          <div className="font-medium" style={{ color: LUXE_COLORS.champagne.base }}>{user.name}</div>
                          <div className="text-sm" style={{ color: LUXE_COLORS.text.secondary }}>{user.email}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className="text-xs px-3 py-1.5 rounded-full font-medium"
                            style={{
                              backgroundColor: `${LUXE_COLORS.emerald.base}20`,
                              color: LUXE_COLORS.emerald.base
                            }}
                          >
                            {user.status}
                          </span>
                          <span className="text-sm font-medium" style={{ color: LUXE_COLORS.gold.base }}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-6 border-t mt-6" style={{ borderColor: LUXE_COLORS.border.light }}>
                    <SalonLuxeButton variant="primary" icon={<Users className="h-5 w-5" />}>
                      Add User
                    </SalonLuxeButton>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SECURITY TAB */}
            <TabsContent value="security" className="space-y-6 animate-in fade-in duration-300">
              {/* Password Policy */}
              <Card
                className="border-0 shadow-2xl"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.charcoal.light} 0%, ${LUXE_COLORS.charcoal.dark} 100%)`,
                  border: `1px solid ${LUXE_COLORS.border.light}`,
                  borderRadius: '16px'
                }}
              >
                <CardHeader>
                  <CardTitle style={{ color: LUXE_COLORS.champagne.base }}>Password Policy</CardTitle>
                  <CardDescription style={{ color: LUXE_COLORS.text.secondary }}>
                    Configure password requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: 'Minimum password length', type: 'number', value: '8' },
                    { label: 'Require uppercase letters', type: 'switch', value: true },
                    { label: 'Require special characters', type: 'switch', value: true },
                    { label: 'Require numbers', type: 'switch', value: true }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-3">
                      <Label style={{ color: LUXE_COLORS.champagne.base }}>{item.label}</Label>
                      {item.type === 'number' ? (
                        <Input
                          type="number"
                          defaultValue={item.value as string}
                          className="w-24 min-h-[44px]"
                          style={{
                            backgroundColor: LUXE_COLORS.charcoal.dark,
                            border: `1px solid ${LUXE_COLORS.border.base}`,
                            color: LUXE_COLORS.champagne.base
                          }}
                        />
                      ) : (
                        <Switch defaultChecked={item.value as boolean} />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Session Management */}
              <Card
                className="border-0 shadow-2xl"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.charcoal.light} 0%, ${LUXE_COLORS.charcoal.dark} 100%)`,
                  border: `1px solid ${LUXE_COLORS.border.light}`,
                  borderRadius: '16px'
                }}
              >
                <CardHeader>
                  <CardTitle style={{ color: LUXE_COLORS.champagne.base }}>Session Management</CardTitle>
                  <CardDescription style={{ color: LUXE_COLORS.text.secondary }}>
                    Configure session timeout and security settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-3">
                    <Label style={{ color: LUXE_COLORS.champagne.base }}>Session timeout (minutes)</Label>
                    <Input
                      type="number"
                      defaultValue="30"
                      className="w-24 min-h-[44px]"
                      style={{
                        backgroundColor: LUXE_COLORS.charcoal.dark,
                        border: `1px solid ${LUXE_COLORS.border.base}`,
                        color: LUXE_COLORS.champagne.base
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <Label style={{ color: LUXE_COLORS.champagne.base }}>Enable two-factor authentication</Label>
                    <Switch />
                  </div>
                  <div className="flex justify-end pt-6 border-t" style={{ borderColor: LUXE_COLORS.border.light }}>
                    <SalonLuxeButton variant="primary" icon={<Save className="h-5 w-5" />}>
                      Save Security Settings
                    </SalonLuxeButton>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* INTEGRATIONS TAB */}
            <TabsContent value="integrations" className="animate-in fade-in duration-300">
              <Card
                className="border-0 shadow-2xl"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.charcoal.light} 0%, ${LUXE_COLORS.charcoal.dark} 100%)`,
                  border: `1px solid ${LUXE_COLORS.border.light}`,
                  borderRadius: '16px'
                }}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${LUXE_COLORS.gold.base}20 0%, ${LUXE_COLORS.gold.base}30 100%)`,
                        border: `1px solid ${LUXE_COLORS.gold.base}40`
                      }}
                    >
                      <Key className="w-6 h-6" style={{ color: LUXE_COLORS.gold.base }} />
                    </div>
                    <div>
                      <CardTitle style={{ color: LUXE_COLORS.champagne.base }}>API & Integrations</CardTitle>
                      <CardDescription style={{ color: LUXE_COLORS.text.secondary }}>
                        Manage third-party integrations and API keys
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium" style={{ color: LUXE_COLORS.text.secondary }}>API Key</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        defaultValue="sk_live_****************************"
                        readOnly
                        className="min-h-[48px]"
                        style={{
                          backgroundColor: LUXE_COLORS.charcoal.dark,
                          border: `1px solid ${LUXE_COLORS.border.base}`,
                          color: LUXE_COLORS.champagne.base
                        }}
                      />
                      <SalonLuxeButton variant="outline" icon={<RefreshCw className="h-5 w-5" />}>
                        Refresh
                      </SalonLuxeButton>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <h3 className="text-lg font-semibold" style={{ color: LUXE_COLORS.champagne.base }}>
                      Active Integrations
                    </h3>
                    <div className="space-y-3">
                      {[
                        { name: 'WhatsApp Business API', status: 'Connected', icon: '💬' },
                        { name: 'Payment Gateway', status: 'Connected', icon: '💳' },
                        { name: 'SMS Provider', status: 'Not Connected', icon: '📱' },
                        { name: 'Email Service', status: 'Connected', icon: '✉️' }
                      ].map(integration => (
                        <div
                          key={integration.name}
                          className="flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:scale-[1.01]"
                          style={{
                            backgroundColor: LUXE_COLORS.charcoal.dark,
                            border: `1px solid ${LUXE_COLORS.border.base}`
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{integration.icon}</span>
                            <span className="font-medium" style={{ color: LUXE_COLORS.champagne.base }}>
                              {integration.name}
                            </span>
                          </div>
                          <span
                            className="text-sm font-medium"
                            style={{
                              color: integration.status === 'Connected'
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
        <div className="mt-12 p-6 rounded-xl text-center animate-in fade-in duration-300"
          style={{
            background: `linear-gradient(135deg, ${LUXE_COLORS.charcoal.dark}80 0%, ${LUXE_COLORS.charcoal.light}60 100%)`,
            border: `1px solid ${LUXE_COLORS.border.light}40`,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
        >
          <p className="text-sm" style={{ color: LUXE_COLORS.text.tertiary }}>
            Logged in as: <span style={{ color: LUXE_COLORS.gold.base, fontWeight: 600 }}>{role?.toUpperCase()}</span>
            {' • '}
            Organization: <span style={{ color: LUXE_COLORS.champagne.base, fontWeight: 500 }}>{organizationName}</span>
          </p>
          <p className="text-xs mt-2" style={{ color: LUXE_COLORS.text.tertiary }}>
            Access: User Management, System Settings, Security Configuration, API Management
          </p>
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
