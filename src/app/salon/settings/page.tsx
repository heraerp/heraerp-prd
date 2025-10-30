'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
  ArrowRight
} from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { useToast } from '@/hooks/use-toast'
import { entityCRUD } from '@/lib/universal-api-v2-client'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

export default function SalonSettingsPage() {
  const router = useRouter()
  const { organizationId, role, user: contextUser, organizationDetails } = useSecuredSalonContext()
  const { user } = useHERAAuth()  // Get actor user ID for RPC
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('general')

  // Form state for organization settings
  const [organizationName, setOrganizationName] = useState('')
  const [legalName, setLegalName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [trn, setTrn] = useState('')
  const [currency, setCurrency] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Initialize form state from context when data loads
  useEffect(() => {
    if (organizationDetails) {
      setOrganizationName(organizationDetails.name || '')
      setLegalName(organizationDetails.legal_name || '')
      setPhone(organizationDetails.phone || '')
      setEmail(organizationDetails.email || '')
      setAddress(organizationDetails.address || '')
      setTrn(organizationDetails.trn || '')
      setCurrency(organizationDetails.currency || 'AED')
    }
  }, [organizationDetails])

  // Save organization settings using direct RPC call
  const handleSaveOrganizationSettings = async () => {
    if (!organizationId) {
      toast({
        title: 'Error',
        description: 'No organization context found',
        variant: 'destructive'
      })
      return
    }

    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User session not found',
        variant: 'destructive'
      })
      return
    }

    setIsSaving(true)

    // Build dynamic fields in SIMPLE RPC format (matches useUniversalEntityV1 pattern)
    // ✅ FIXED: Use simple { value, type, smart_code } format that matches hera_entities_crud_v1
    const p_dynamic = {
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
      console.log('[Settings] 🔍 Calling entityCRUD UPDATE with:', {
        entity_id: organizationId,
        actor_user_id: user.id,
        organization_id: organizationId,
        dynamic_fields_count: Object.keys(p_dynamic).length
      })

      // Call RPC directly with SIMPLE format (matches useUniversalEntityV1's transformDynamicFieldsToRPCSimple)
      const { data, error } = await entityCRUD({
        p_action: 'UPDATE',
        p_actor_user_id: user.id,
        p_organization_id: organizationId,
        p_entity: {
          entity_id: organizationId
        },
        p_dynamic,
        p_options: {
          include_dynamic: true
        }
      })

      if (error) {
        console.error('[Settings] RPC Error:', error)
        throw new Error(typeof error === 'string' ? error : JSON.stringify(error))
      }

      console.log('[Settings] Save successful:', data)

      toast({
        title: 'Success',
        description: 'Organization settings saved successfully',
        variant: 'default'
      })

      // ✅ FIXED: Don't reload the page (services page pattern)
      // The form already has the updated values (user just entered them)
      // Changes are persisted to database and will be loaded on next visit
      // SecuredSalonProvider will load latest data when context is reinitialized

      console.log('[Settings] ✅ Settings saved successfully - no page reload needed')
    } catch (error: any) {
      console.error('[Settings] Error saving organization settings:', {
        error,
        errorMessage: error.message,
        errorString: String(error),
        organizationId,
        userId: user?.id,
        dynamicFields: Object.keys(p_dynamic || {})
      })

      toast({
        title: 'Error',
        description: error.message || 'Failed to save organization settings',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: LUXE_COLORS.charcoal }}>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light mb-2" style={{ color: LUXE_COLORS.gold }}>
            System Settings
          </h1>
          <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
            Configure system settings and manage users for{' '}
            {user?.user_metadata?.full_name || 'Administrator'}
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList
            className="bg-transparent border"
            style={{ borderColor: `${LUXE_COLORS.bronze}30` }}
          >
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="grid gap-6">
              {/* Salon Information */}
              <Card
                className="border-0"
                style={{
                  backgroundColor: LUXE_COLORS.charcoalLight,
                  border: `1px solid ${LUXE_COLORS.bronze}30`
                }}
              >
                <CardHeader>
                  <CardTitle style={{ color: LUXE_COLORS.gold }}>Organization Information</CardTitle>
                  <CardDescription style={{ color: LUXE_COLORS.bronze }}>
                    Basic information about your organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label style={{ color: LUXE_COLORS.bronze }}>Organization Name</Label>
                      <Input
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        placeholder="Enter organization name"
                        style={{
                          backgroundColor: LUXE_COLORS.charcoal,
                          border: `1px solid ${LUXE_COLORS.bronze}30`,
                          color: LUXE_COLORS.champagne
                        }}
                      />
                    </div>
                    <div>
                      <Label style={{ color: LUXE_COLORS.bronze }}>Legal Name</Label>
                      <Input
                        value={legalName}
                        onChange={(e) => setLegalName(e.target.value)}
                        placeholder="Enter legal name (optional)"
                        style={{
                          backgroundColor: LUXE_COLORS.charcoal,
                          border: `1px solid ${LUXE_COLORS.bronze}30`,
                          color: LUXE_COLORS.champagne
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label style={{ color: LUXE_COLORS.bronze }}>Phone Number</Label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+971 4 123 4567"
                        style={{
                          backgroundColor: LUXE_COLORS.charcoal,
                          border: `1px solid ${LUXE_COLORS.bronze}30`,
                          color: LUXE_COLORS.champagne
                        }}
                      />
                    </div>
                    <div>
                      <Label style={{ color: LUXE_COLORS.bronze }}>Email Address</Label>
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="info@example.com"
                        type="email"
                        style={{
                          backgroundColor: LUXE_COLORS.charcoal,
                          border: `1px solid ${LUXE_COLORS.bronze}30`,
                          color: LUXE_COLORS.champagne
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label style={{ color: LUXE_COLORS.bronze }}>Address</Label>
                    <Input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter complete address"
                      style={{
                        backgroundColor: LUXE_COLORS.charcoal,
                        border: `1px solid ${LUXE_COLORS.bronze}30`,
                        color: LUXE_COLORS.champagne
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label style={{ color: LUXE_COLORS.bronze }}>Tax Registration Number (TRN)</Label>
                      <Input
                        value={trn}
                        onChange={(e) => setTrn(e.target.value)}
                        placeholder="Enter TRN"
                        style={{
                          backgroundColor: LUXE_COLORS.charcoal,
                          border: `1px solid ${LUXE_COLORS.bronze}30`,
                          color: LUXE_COLORS.champagne
                        }}
                      />
                    </div>
                    <div>
                      <Label style={{ color: LUXE_COLORS.bronze }}>Currency</Label>
                      <Input
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        placeholder="AED"
                        style={{
                          backgroundColor: LUXE_COLORS.charcoal,
                          border: `1px solid ${LUXE_COLORS.bronze}30`,
                          color: LUXE_COLORS.champagne
                        }}
                      />
                      <p className="text-xs mt-1" style={{ color: LUXE_COLORS.bronze }}>
                        Current symbol: {organizationDetails?.currencySymbol || 'AED'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveOrganizationSettings}
                      disabled={isSaving}
                      style={{ backgroundColor: LUXE_COLORS.gold, color: LUXE_COLORS.black }}
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
                className="border-0"
                style={{
                  backgroundColor: LUXE_COLORS.charcoalLight,
                  border: `1px solid ${LUXE_COLORS.bronze}30`
                }}
              >
                <CardHeader>
                  <CardTitle style={{ color: LUXE_COLORS.gold }}>Business Hours</CardTitle>
                  <CardDescription style={{ color: LUXE_COLORS.bronze }}>
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
                      <div key={day} className="flex items-center justify-between">
                        <span style={{ color: LUXE_COLORS.champagne }}>{day}</span>
                        <div className="flex items-center gap-4">
                          <span style={{ color: LUXE_COLORS.bronze }}>9:00 AM - 8:00 PM</span>
                          <Switch />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Inventory Settings */}
              <Card
                className="border-0"
                style={{
                  backgroundColor: LUXE_COLORS.charcoalLight,
                  border: `1px solid ${LUXE_COLORS.bronze}30`
                }}
              >
                <CardHeader>
                  <CardTitle style={{ color: LUXE_COLORS.gold }}>
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Inventory Management
                    </div>
                  </CardTitle>
                  <CardDescription style={{ color: LUXE_COLORS.bronze }}>
                    Configure inventory tracking and stock management settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ color: LUXE_COLORS.champagne }}>
                        Enable inventory tracking, manage stock levels, and configure
                        branch-specific inventory settings.
                      </p>
                      <p className="text-sm mt-2" style={{ color: LUXE_COLORS.bronze }}>
                        Control which products require inventory tracking and set organization-wide
                        defaults.
                      </p>
                    </div>
                    <Button
                      onClick={() => router.push('/salon/settings/inventory')}
                      style={{ backgroundColor: LUXE_COLORS.gold, color: LUXE_COLORS.black }}
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
              className="border-0"
              style={{
                backgroundColor: LUXE_COLORS.charcoalLight,
                border: `1px solid ${LUXE_COLORS.bronze}30`
              }}
            >
              <CardHeader>
                <CardTitle style={{ color: LUXE_COLORS.gold }}>User Management</CardTitle>
                <CardDescription style={{ color: LUXE_COLORS.bronze }}>
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
                        className="flex items-center justify-between p-4 rounded-lg"
                        style={{ backgroundColor: LUXE_COLORS.charcoal }}
                      >
                        <div>
                          <div style={{ color: LUXE_COLORS.champagne }}>{user.name}</div>
                          <div className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                            {user.email}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className="text-sm px-2 py-1 rounded"
                            style={{
                              backgroundColor: LUXE_COLORS.emerald + '20',
                              color: LUXE_COLORS.emerald
                            }}
                          >
                            {user.status}
                          </span>
                          <span className="text-sm" style={{ color: LUXE_COLORS.gold }}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button style={{ backgroundColor: LUXE_COLORS.gold, color: LUXE_COLORS.black }}>
                      <Users className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <div className="grid gap-6">
              {/* Password Policy */}
              <Card
                className="border-0"
                style={{
                  backgroundColor: LUXE_COLORS.charcoalLight,
                  border: `1px solid ${LUXE_COLORS.bronze}30`
                }}
              >
                <CardHeader>
                  <CardTitle style={{ color: LUXE_COLORS.gold }}>Password Policy</CardTitle>
                  <CardDescription style={{ color: LUXE_COLORS.bronze }}>
                    Configure password requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label style={{ color: LUXE_COLORS.champagne }}>Minimum password length</Label>
                    <Input
                      type="number"
                      defaultValue="8"
                      className="w-20"
                      style={{
                        backgroundColor: LUXE_COLORS.charcoal,
                        border: `1px solid ${LUXE_COLORS.bronze}30`,
                        color: LUXE_COLORS.champagne
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label style={{ color: LUXE_COLORS.champagne }}>
                      Require uppercase letters
                    </Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label style={{ color: LUXE_COLORS.champagne }}>
                      Require special characters
                    </Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label style={{ color: LUXE_COLORS.champagne }}>Require numbers</Label>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              {/* Session Management */}
              <Card
                className="border-0"
                style={{
                  backgroundColor: LUXE_COLORS.charcoalLight,
                  border: `1px solid ${LUXE_COLORS.bronze}30`
                }}
              >
                <CardHeader>
                  <CardTitle style={{ color: LUXE_COLORS.gold }}>Session Management</CardTitle>
                  <CardDescription style={{ color: LUXE_COLORS.bronze }}>
                    Configure session timeout and security settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label style={{ color: LUXE_COLORS.champagne }}>
                      Session timeout (minutes)
                    </Label>
                    <Input
                      type="number"
                      defaultValue="30"
                      className="w-20"
                      style={{
                        backgroundColor: LUXE_COLORS.charcoal,
                        border: `1px solid ${LUXE_COLORS.bronze}30`,
                        color: LUXE_COLORS.champagne
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label style={{ color: LUXE_COLORS.champagne }}>
                      Enable two-factor authentication
                    </Label>
                    <Switch />
                  </div>
                  <div className="flex justify-end">
                    <Button style={{ backgroundColor: LUXE_COLORS.gold, color: LUXE_COLORS.black }}>
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
              className="border-0"
              style={{
                backgroundColor: LUXE_COLORS.charcoalLight,
                border: `1px solid ${LUXE_COLORS.bronze}30`
              }}
            >
              <CardHeader>
                <CardTitle style={{ color: LUXE_COLORS.gold }}>API & Integrations</CardTitle>
                <CardDescription style={{ color: LUXE_COLORS.bronze }}>
                  Manage third-party integrations and API keys
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label style={{ color: LUXE_COLORS.bronze }}>API Key</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      defaultValue="sk_live_****************************"
                      readOnly
                      style={{
                        backgroundColor: LUXE_COLORS.charcoal,
                        border: `1px solid ${LUXE_COLORS.bronze}30`,
                        color: LUXE_COLORS.champagne
                      }}
                    />
                    <Button variant="outline" style={{ borderColor: LUXE_COLORS.bronze }}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-medium" style={{ color: LUXE_COLORS.champagne }}>
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
                        className="flex items-center justify-between p-3 rounded"
                        style={{ backgroundColor: LUXE_COLORS.charcoal }}
                      >
                        <div className="flex items-center gap-3">
                          <span>{integration.icon}</span>
                          <span style={{ color: LUXE_COLORS.champagne }}>{integration.name}</span>
                        </div>
                        <span
                          className="text-sm"
                          style={{
                            color:
                              integration.status === 'Connected'
                                ? LUXE_COLORS.emerald
                                : LUXE_COLORS.bronze
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
        </Tabs>

        {/* Role and Permissions Info */}
        <div className="mt-8 text-sm text-center" style={{ color: LUXE_COLORS.bronze }}>
          Logged in as: {role?.toUpperCase()} • Organization: {organizationId}
          <br />
          Access: User Management, System Settings, Security Configuration, API Management
        </div>
      </div>
    </div>
  )
}
