'use client'

// Force dynamic rendering - skip SSG for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0 // no static cache
export const fetchCache = 'force-no-store'
/**
 * HERA Admin Provisioning Dashboard
 * Smart Code: HERA.ADMIN.PROVISIONING.V1
 *
 * Manage tenant provisioning, modules, and entitlements
 */

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Building2,
  Package,
  User,
  Settings,
  Check,
  X,
  Loader2,
  Search,
  Plus,
  Key,
  Globe,
  Calendar,
  CreditCard,
  Shield,
  Zap,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Copy,
  ExternalLink,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MODULE_REGISTRY, ModuleCategory } from '@/lib/modules/registry'

interface Tenant {
  id: string
  name: string
  subdomain: string
  industry: string
  country: string
  plan: string
  status: 'active' | 'trial' | 'suspended'
  modules: string[]
  createdAt: string
  trialEndsAt?: string
}

// Mock data for demonstration
const mockTenants: Tenant[] = [
  {
    id: '1',
    name: 'SK Cuts Premium Salon',
    subdomain: 'skcuts',
    industry: 'salon',
    country: 'US',
    plan: 'Professional',
    status: 'active',
    modules: [
      'HERA.SALON.POS.MODULE.V1',
      'HERA.FIN.ACCOUNTING.MODULE.V1',
      'HERA.FIN.AUTO.JOURNAL.MODULE.V1'
    ],
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    name: "Mario's Restaurant",
    subdomain: 'marios',
    industry: 'restaurant',
    country: 'IT',
    plan: 'Enterprise',
    status: 'active',
    modules: [
      'HERA.REST.POS.MODULE.V1',
      'HERA.REST.KITCHEN.MODULE.V1',
      'HERA.FIN.ACCOUNTING.MODULE.V1'
    ],
    createdAt: '2024-02-20'
  },
  {
    id: '3',
    name: 'City Medical Center',
    subdomain: 'citymed',
    industry: 'healthcare',
    country: 'AE',
    plan: 'Starter',
    status: 'trial',
    modules: ['HERA.HEALTH.EMR.MODULE.V1', 'HERA.FIN.ACCOUNTING.MODULE.V1'],
    createdAt: '2024-03-10',
    trialEndsAt: '2024-04-10'
  }
]

export default function ProvisioningDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('tenants')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [isProvisioning, setIsProvisioning] = useState(false)

  // New tenant form state
  const [newTenant, setNewTenant] = useState({
    organizationName: '',
    organizationCode: '',
    subdomain: '',
    industryType: 'general',
    country: 'US',
    ownerEmail: '',
    ownerName: '',
    modules: [] as string[],
    trialDays: 30
  })

  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const [checkingSubdomain, setCheckingSubdomain] = useState(false)

  // Check subdomain availability
  useEffect(() => {
    const checkSubdomain = async () => {
      if (newTenant.subdomain.length < 3) {
        setSubdomainAvailable(null)
        return
      }

      setCheckingSubdomain(true)
      try {
        const response = await fetch(
          `/api/v1/provisioning?action=check&subdomain=${newTenant.subdomain}`
        )
        const data = await response.json()
        setSubdomainAvailable(data.available)
      } catch (error) {
        console.error('Error checking subdomain:', error)
        setSubdomainAvailable(null)
      } finally {
        setCheckingSubdomain(false)
      }
    }

    const timer = setTimeout(checkSubdomain, 500)
    return () => clearTimeout(timer)
  }, [newTenant.subdomain])

  // Auto-generate subdomain from organization name
  useEffect(() => {
    if (newTenant.organizationName && !newTenant.subdomain) {
      const suggested = newTenant.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 30)

      setNewTenant(prev => ({
        ...prev,
        subdomain: suggested,
        organizationCode: suggested.toUpperCase()
      }))
    }
  }, [newTenant.organizationName])

  const handleProvisionTenant = async () => {
    if (!subdomainAvailable) {
      alert('Please choose an available subdomain')
      return
    }

    setIsProvisioning(true)
    try {
      const response = await fetch('/api/v1/provisioning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTenant)
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Successfully provisioned ${newTenant.organizationName}!`)
        // Reset form
        setNewTenant({
          organizationName: '',
          organizationCode: '',
          subdomain: '',
          industryType: 'general',
          country: 'US',
          ownerEmail: '',
          ownerName: '',
          modules: [],
          trialDays: 30
        })
        setActiveTab('tenants')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Failed to provision tenant')
    } finally {
      setIsProvisioning(false)
    }
  }

  const filteredTenants = mockTenants.filter(
    tenant =>
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getModuleInfo = (smartCode: string) => {
    return MODULE_REGISTRY.get(smartCode)
  }

  return (
    <div className="min-h-screen bg-muted dark:bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 dark:text-foreground flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary" />
              Tenant Provisioning
            </h1>
            <p className="text-muted-foreground dark:text-muted-foreground mt-1">
              Manage multi-tenant provisioning and module entitlements
            </p>
          </div>

          <Button onClick={() => router.push('/admin')}>Back to Admin</Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Total Tenants
                  </p>
                  <p className="text-2xl font-bold">{mockTenants.length}</p>
                </div>
                <Building2 className="w-8 h-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {mockTenants.filter(t => t.status === 'active').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">Trial</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {mockTenants.filter(t => t.status === 'trial').length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Revenue/Month
                  </p>
                  <p className="text-2xl font-bold text-purple-600">$45,230</p>
                </div>
                <CreditCard className="w-8 h-8 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Tenant Management</CardTitle>
            <CardDescription>Provision and manage HERA tenants</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="tenants">Existing Tenants</TabsTrigger>
                <TabsTrigger value="provision">Provision New</TabsTrigger>
                <TabsTrigger value="modules">Module Catalog</TabsTrigger>
              </TabsList>
              <TabsContent value="tenants" className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search tenants..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Tenant List */}
                <div className="space-y-4">
                  {filteredTenants.map(tenant => (
                    <Card
                      key={tenant.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setSelectedTenant(tenant)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div>
                              <h3 className="font-semibold text-lg">{tenant.name}</h3>
                              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                                {tenant.subdomain}.heraerp.com
                              </p>
                            </div>

                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {tenant.industry}
                              </div>
                              <div className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {tenant.country}
                              </div>
                              <div className="flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                {tenant.modules.length} modules
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {tenant.modules.map(moduleCode => {
                                const module = getModuleInfo(moduleCode)
                                return module ? (
                                  <Badge key={moduleCode} variant="secondary" className="text-xs">
                                    {module.name}
                                  </Badge>
                                ) : null
                              })}
                            </div>
                          </div>

                          <div className="text-right space-y-2">
                            <Badge
                              className={cn(
                                tenant.status === 'active' &&
                                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                                tenant.status === 'trial' &&
                                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                                tenant.status === 'suspended' &&
                                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              )}
                            >
                              {tenant.status}
                            </Badge>

                            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                              {tenant.plan}
                            </p>

                            {tenant.trialEndsAt && (
                              <p className="text-xs text-yellow-600">
                                Trial ends: {new Date(tenant.trialEndsAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="provision" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Organization Details */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Organization Details</h3>

                    <div>
                      <Label>Organization Name</Label>
                      <Input
                        placeholder="e.g., SK Cuts Premium Salon"
                        value={newTenant.organizationName}
                        onChange={e =>
                          setNewTenant({ ...newTenant, organizationName: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Label>Subdomain</Label>
                      <div className="relative">
                        <Input
                          placeholder="e.g., skcuts"
                          value={newTenant.subdomain}
                          onChange={e =>
                            setNewTenant({ ...newTenant, subdomain: e.target.value.toLowerCase() })
                          }
                          className={cn(
                            'pr-10',
                            subdomainAvailable === true && 'border-green-500',
                            subdomainAvailable === false && 'border-red-500'
                          )}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {checkingSubdomain && <Loader2 className="w-4 h-4 animate-spin" />}
                          {!checkingSubdomain && subdomainAvailable === true && (
                            <Check className="w-4 h-4 text-green-500" />
                          )}
                          {!checkingSubdomain && subdomainAvailable === false && (
                            <X className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                        {newTenant.subdomain}.heraerp.com
                      </p>
                    </div>

                    <div>
                      <Label>Industry Type</Label>
                      <Select
                        value={newTenant.industryType}
                        onValueChange={v => setNewTenant({ ...newTenant, industryType: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="salon">Salon & Beauty</SelectItem>
                          <SelectItem value="restaurant">Restaurant</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="general">General Business</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Country</Label>
                      <Select
                        value={newTenant.country}
                        onValueChange={v => setNewTenant({ ...newTenant, country: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="AE">UAE</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                          <SelectItem value="IT">Italy</SelectItem>
                          <SelectItem value="FR">France</SelectItem>
                          <SelectItem value="IN">India</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Owner Email</Label>
                      <Input
                        type="email"
                        placeholder="owner@example.com"
                        value={newTenant.ownerEmail}
                        onChange={e => setNewTenant({ ...newTenant, ownerEmail: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Owner Name</Label>
                      <Input
                        placeholder="John Smith"
                        value={newTenant.ownerName}
                        onChange={e => setNewTenant({ ...newTenant, ownerName: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Trial Period (days)</Label>
                      <Input
                        type="number"
                        value={newTenant.trialDays}
                        onChange={e =>
                          setNewTenant({ ...newTenant, trialDays: parseInt(e.target.value) || 30 })
                        }
                      />
                    </div>
                  </div>

                  {/* Module Selection */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Select Modules</h3>

                    {(['core', 'industry', 'addon', 'enterprise'] as ModuleCategory[]).map(
                      category => {
                        const modules = Array.from(MODULE_REGISTRY.values()).filter(
                          m => m.category === category
                        )
                        return modules.length > 0 ? (
                          <div key={category} className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground uppercase">
                              {category}
                            </h4>

                            <div className="space-y-2">
                              {modules.map(module => (
                                <div
                                  key={module.smartCode}
                                  className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted dark:hover:bg-muted"
                                >
                                  <Checkbox
                                    checked={newTenant.modules.includes(module.smartCode)}
                                    onCheckedChange={checked => {
                                      if (checked) {
                                        setNewTenant({
                                          ...newTenant,
                                          modules: [...newTenant.modules, module.smartCode]
                                        })
                                      } else {
                                        setNewTenant({
                                          ...newTenant,
                                          modules: newTenant.modules.filter(
                                            m => m !== module.smartCode
                                          )
                                        })
                                      }
                                    }}
                                    disabled={module.category === 'core'}
                                  />

                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{module.name}</div>
                                    <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                                      {module.description}
                                    </div>
                                    {module.dependencies.length > 0 && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Requires: {module.dependencies.join(', ')}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null
                      }
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setActiveTab('tenants')}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleProvisionTenant}
                    disabled={
                      !subdomainAvailable ||
                      isProvisioning ||
                      !newTenant.organizationName ||
                      !newTenant.ownerEmail
                    }
                  >
                    {isProvisioning ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Provisioning...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Provision Tenant
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="modules" className="space-y-6">
                {(['core', 'industry', 'addon', 'enterprise'] as ModuleCategory[]).map(category => {
                  const modules = Array.from(MODULE_REGISTRY.values()).filter(
                    m => m.category === category
                  )
                  return modules.length > 0 ? (
                    <div key={category} className="space-y-4">
                      <h3 className="text-lg font-semibold capitalize">{category} Modules</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {modules.map(module => (
                          <Card key={module.smartCode}>
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="text-base">{module.name}</CardTitle>
                                  <CardDescription className="text-xs mt-1">
                                    {module.smartCode}
                                  </CardDescription>
                                </div>
                                <Badge
                                  variant={module.category === 'core' ? 'default' : 'secondary'}
                                >
                                  {module.category}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-3">
                                {module.description}
                              </p>

                              <div className="space-y-2">
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground dark:text-muted-foreground mb-1">
                                    Features:
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {module.features.map((feature: any) => (
                                      <Badge key={feature} variant="outline" className="text-xs">
                                        {feature}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                {module.dependencies.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground dark:text-muted-foreground">
                                      Dependencies: {module.dependencies.join(', ')}
                                    </p>
                                  </div>
                                )}

                                {module.permissions.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground dark:text-muted-foreground">
                                      Required Permissions: {module.permissions.length}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : null
                })}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Selected Tenant Details */}
        {selectedTenant && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tenant Details: {selectedTenant.name}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTenant(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Access URL</h4>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted dark:bg-muted px-2 py-1 rounded">
                      {selectedTenant.subdomain}.heraerp.com
                    </code>
                    <Button size="sm" variant="ghost">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Configuration</h4>
                  <div className="space-y-1 text-sm">
                    <div>
                      Industry: <span className="font-medium">{selectedTenant.industry}</span>
                    </div>
                    <div>
                      Country: <span className="font-medium">{selectedTenant.country}</span>
                    </div>
                    <div>
                      Plan: <span className="font-medium">{selectedTenant.plan}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Provisioning Info</h4>
                  <div className="space-y-1 text-sm">
                    <div>
                      Created:{' '}
                      <span className="font-medium">
                        {new Date(selectedTenant.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      Status:{' '}
                      <Badge
                        className="ml-2"
                        variant={selectedTenant.status === 'active' ? 'default' : 'secondary'}
                      >
                        {selectedTenant.status}
                      </Badge>
                    </div>
                    {selectedTenant.trialEndsAt && (
                      <div>
                        Trial Ends:{' '}
                        <span className="font-medium text-yellow-600">
                          {new Date(selectedTenant.trialEndsAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button size="sm">
                  <Settings className="w-3 h-3 mr-1" />
                  Manage Modules
                </Button>
                <Button size="sm" variant="outline">
                  <User className="w-3 h-3 mr-1" />
                  View Users
                </Button>
                <Button size="sm" variant="outline">
                  <Key className="w-3 h-3 mr-1" />
                  API Keys
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
