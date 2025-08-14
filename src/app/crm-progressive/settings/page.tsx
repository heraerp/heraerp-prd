'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ModernModal, CRMFormModal } from '@/components/ui/modern-modal'
import { 
  Settings, Users, Building2, Plus, Save, AlertCircle, CheckCircle,
  ArrowLeft, UserPlus, Shield, Key, Database, Sparkles, Heart,
  Calendar, Camera, Music, Flower2, Cake, MapPin, DollarSign,
  Target, CheckSquare, Activity, User
} from 'lucide-react'
import Link from 'next/link'
import { heraApi } from '@/lib/hera-api'
import { useProgressiveAuth } from "@/components/auth/ProgressiveAuthProvider"
import { CRMLayout } from '@/components/layout/crm-layout'

// CRM Demo Setup - Wedding Planner is just an example
const CRM_DEMO_CONFIG = {
  // Example organization - could be any business
  organization: {
    organization_name: "Demo Company Inc",
    organization_code: "DEMO001",
    organization_type: "business",
    industry: "Professional Services",
    business_size: "small",
    email: "info@democompany.com",
    phone: "+1-555-0100",
    website: "www.democompany.com",
    address: {
      street: "123 Business Street",
      city: "Los Angeles",
      state: "CA",
      zip: "90028",
      country: "USA"
    },
    settings: {
      currency: "USD",
      timezone: "America/Los_Angeles",
      fiscal_year_start: "01-01",
      default_payment_terms: "Net 30"
    }
  },
  users: [
    {
      name: "John Smith",
      email: "john@democompany.com",
      role: "admin",
      title: "Sales Manager",
      department: "Sales"
    },
    {
      name: "Emily Johnson",
      email: "emily@democompany.com",
      role: "user",
      title: "Account Executive",
      department: "Sales"
    },
    {
      name: "Michael Brown",
      email: "michael@democompany.com",
      role: "user",
      title: "Customer Success Manager",
      department: "Customer Success"
    }
  ],
  // Standard CRM entity types that work for any business
  crmEntityTypes: [
    { type: "contact", name: "Contacts", icon: Users, description: "People you do business with" },
    { type: "company", name: "Companies", icon: Building2, description: "Organizations and businesses" },
    { type: "deal", name: "Deals/Opportunities", icon: DollarSign, description: "Sales opportunities" },
    { type: "lead", name: "Leads", icon: Target, description: "Potential customers" },
    { type: "task", name: "Tasks", icon: CheckSquare, description: "Things to do" },
    { type: "activity", name: "Activities", icon: Activity, description: "Calls, emails, meetings" }
  ]
}

export default function CRMSettingsPage() {
  const { user, isLoading: authLoading } = useProgressiveAuth()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('organization')
  const [isLoading, setIsLoading] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted || authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Organization state
  const [organization, setOrganization] = useState(CRM_DEMO_CONFIG.organization)
  const [existingOrg, setExistingOrg] = useState<any>(null)
  
  // Users state
  const [users, setUsers] = useState<any[]>([])
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({
    entity_name: '',
    entity_code: '',
    email: '',
    role: 'user',
    title: ''
  })

  // Load existing organization data
  useEffect(() => {
    loadOrganizationData()
  }, [])

  const loadOrganizationData = async () => {
    try {
      setIsLoading(true)
      
      // Check if organization already exists
      const orgs = await heraApi.getOrganizations()
      const demoOrg = orgs.find((org: any) => 
        org.organization_code === CRM_DEMO_CONFIG.organization.organization_code
      )
      
      if (demoOrg) {
        setExistingOrg(demoOrg)
        setOrganization(demoOrg)
        
        // Load users for this organization
        const entities = await heraApi.getEntities('user')
        const orgUsers = entities.filter((entity: any) => 
          entity.organization_id === demoOrg.id
        )
        setUsers(orgUsers)
      }
    } catch (error) {
      console.error('Error loading organization:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Create or update organization
  const handleSaveOrganization = async () => {
    try {
      setIsLoading(true)
      setMessage(null)
      
      if (existingOrg) {
        // Update existing organization
        await heraApi.updateOrganization(existingOrg.id, organization)
        setMessage({ type: 'success', text: 'Organization updated successfully!' })
      } else {
        // Create new organization
        const newOrg = await heraApi.createOrganization({
          ...organization,
          status: 'active',
          subscription_tier: 'professional'
        })
        setExistingOrg(newOrg)
        setMessage({ type: 'success', text: 'CRM organization created successfully!' })
      }
      
      await loadOrganizationData()
    } catch (error) {
      console.error('Error saving organization:', error)
      setMessage({ type: 'error', text: 'Failed to save organization. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  // Add user to organization
  const handleAddUser = async () => {
    try {
      setIsLoading(true)
      setMessage(null)
      
      if (!existingOrg) {
        setMessage({ type: 'error', text: 'Please create organization first!' })
        return
      }
      
      // Create user as entity with universal schema
      const userEntity = await heraApi.createEntity({
        organization_id: existingOrg.id,
        entity_type: 'user',
        entity_name: newUser.entity_name,
        entity_code: newUser.entity_code || `USER_${Date.now()}`,
        entity_category: 'staff',
        entity_subcategory: newUser.role,
        status: 'active',
        metadata: {
          email: newUser.email,
          title: newUser.title,
          role: newUser.role
        }
      })
      
      // Add email as dynamic data
      await heraApi.createDynamicData({
        organization_id: existingOrg.id,
        entity_id: userEntity.id,
        field_name: 'email',
        field_value: newUser.email,
        field_type: 'text',
        field_category: 'contact'
      })
      
      // Add title as dynamic data
      await heraApi.createDynamicData({
        organization_id: existingOrg.id,
        entity_id: userEntity.id,
        field_name: 'job_title',
        field_value: newUser.title,
        field_type: 'text',
        field_category: 'profile'
      })
      
      setMessage({ type: 'success', text: 'User added successfully!' })
      setShowAddUser(false)
      setNewUser({ entity_name: '', entity_code: '', email: '', role: 'user', title: '' })
      await loadOrganizationData()
      
    } catch (error) {
      console.error('Error adding user:', error)
      setMessage({ type: 'error', text: 'Failed to add user. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  // Quick demo setup - create everything at once
  const handleQuickDemoSetup = async () => {
    try {
      setIsLoading(true)
      setMessage(null)
      
      // Step 1: Create organization if not exists
      if (!existingOrg) {
        await handleSaveOrganization()
      }
      
      // Wait a bit for org creation
      await new Promise(resolve => setTimeout(resolve, 1000))
      await loadOrganizationData()
      
      // Step 2: Create all demo users
      for (const demoUser of CRM_DEMO_CONFIG.users) {
        try {
          const userEntity = await heraApi.createEntity({
            organization_id: existingOrg?.id || organization.id,
            entity_type: 'user',
            entity_name: demoUser.name,
            entity_code: `USER_${demoUser.name.replace(/\s+/g, '_').toUpperCase()}`,
            entity_category: 'staff',
            entity_subcategory: demoUser.role,
            status: 'active',
            metadata: {
              email: demoUser.email,
              title: demoUser.title,
              role: demoUser.role,
              department: demoUser.department
            }
          })
          
          // Add contact info as dynamic data
          await heraApi.createDynamicData({
            organization_id: existingOrg?.id || organization.id,
            entity_id: userEntity.id,
            field_name: 'email',
            field_value: demoUser.email,
            field_type: 'text',
            field_category: 'contact'
          })
        } catch (userError) {
          console.error(`Error creating user ${demoUser.name}:`, userError)
        }
      }
      
      setMessage({ 
        type: 'success', 
        text: '🎊 CRM demo setup complete! Organization and users created.' 
      })
      
      await loadOrganizationData()
      
    } catch (error) {
      console.error('Error in quick demo setup:', error)
      setMessage({ type: 'error', text: 'Demo setup failed. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <CRMLayout>
      <div className="min-h-screen bg-white">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link href="/crm-progressive" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <Settings className="h-6 w-6 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-900">CRM Settings</h1>
              </div>
              <p className="text-gray-600">Configure your CRM with Universal Schema</p>
            </div>
            
            <Button 
              onClick={handleQuickDemoSetup}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Quick Demo Setup
            </Button>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200' : 'border-red-200'}`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Settings Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Universal CRM Configuration</CardTitle>
            <CardDescription>
              Set up your CRM using HERA's 6-table universal architecture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="organization">
                  <Building2 className="h-4 w-4 mr-2" />
                  Organization
                </TabsTrigger>
                <TabsTrigger value="users" data-testid="users-tab">
                  <Users className="h-4 w-4 mr-2" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="entities">
                  <Database className="h-4 w-4 mr-2" />
                  Entity Types
                </TabsTrigger>
              </TabsList>

              {/* Organization Tab */}
              <TabsContent value="organization" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Organization Name</Label>
                    <Input
                      id="org-name"
                      value={organization.organization_name}
                      onChange={(e) => setOrganization({...organization, organization_name: e.target.value})}
                      placeholder="Enter organization name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="org-code">Organization Code</Label>
                    <Input
                      id="org-code"
                      value={organization.organization_code}
                      onChange={(e) => setOrganization({...organization, organization_code: e.target.value})}
                      placeholder="UNIQUE_CODE"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="org-type">Organization Type</Label>
                    <Select 
                      value={organization.organization_type}
                      onValueChange={(value) => setOrganization({...organization, organization_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="corporation">Corporation</SelectItem>
                        <SelectItem value="llc">LLC</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={organization.industry}
                      onChange={(e) => setOrganization({...organization, industry: e.target.value})}
                      placeholder="e.g., Technology, Healthcare, Finance"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={organization.email}
                      onChange={(e) => setOrganization({...organization, email: e.target.value})}
                      placeholder="contact@company.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={organization.phone}
                      onChange={(e) => setOrganization({...organization, phone: e.target.value})}
                      placeholder="+1-555-123-4567"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    data-testid="org-website"
                    value={organization.website}
                    onChange={(e) => setOrganization({...organization, website: e.target.value})}
                    placeholder="www.yourcompany.com"
                  />
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={handleSaveOrganization}
                    disabled={isLoading}
                    data-testid="save-organization"
                    className="w-full md:w-auto"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {existingOrg ? 'Update Organization' : 'Create Organization'}
                  </Button>
                  
                  {existingOrg && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-green-800 font-medium">Organization Active</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        Organization ID: {existingOrg.id}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-4">
                {!existingOrg ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Organization Required</AlertTitle>
                    <AlertDescription>
                      Please create an organization first before adding users.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <h3 className="text-lg font-semibold">Organization Users</h3>
                      <Button
                        onClick={() => setShowAddUser(true)}
                        data-testid="add-user-btn"
                        className="w-full sm:w-auto"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </div>

                    {/* Modern Add User Modal */}
                    <CRMFormModal
                      isOpen={showAddUser}
                      onClose={() => setShowAddUser(false)}
                      title="Add New User"
                      subtitle="Create a new user in the organization using universal entities"
                      size="md"
                      isLoading={isLoading}
                      onSubmit={handleAddUser}
                      onCancel={() => setShowAddUser(false)}
                      submitText="Add User"
                      submitVariant="success"
                    >
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="user-name" className="text-gray-900 font-medium">Full Name *</Label>
                          <Input
                            id="user-name"
                            value={newUser.entity_name}
                            onChange={(e) => setNewUser({...newUser, entity_name: e.target.value})}
                            placeholder="John Doe"
                            className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="user-email" className="text-gray-900 font-medium">Email *</Label>
                          <Input
                            id="user-email"
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                            placeholder="john@company.com"
                            className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="user-title" className="text-gray-900 font-medium">Job Title</Label>
                          <Input
                            id="user-title"
                            value={newUser.title}
                            onChange={(e) => setNewUser({...newUser, title: e.target.value})}
                            placeholder="Account Manager"
                            className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="user-role" className="text-gray-900 font-medium">Role</Label>
                          <Select 
                            value={newUser.role}
                            onValueChange={(value) => setNewUser({...newUser, role: value})}
                          >
                            <SelectTrigger id="user-role" className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="owner">Owner</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="sales_rep">Sales Rep</SelectItem>
                              <SelectItem value="coordinator">Coordinator</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CRMFormModal>
                    
                    {/* Users List */}
                    <div className="space-y-3">
                      {users.length === 0 ? (
                        <Card className="p-8 text-center">
                          <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                          <p className="text-gray-600">No users added yet</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Click "Add User" or use the quick demo setup
                          </p>
                        </Card>
                      ) : (
                        users.map((user) => (
                          <Card key={user.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                  <User className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium">{user.entity_name}</h4>
                                  <p className="text-sm text-gray-600">
                                    {user.metadata?.email || 'No email'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline">
                                  {user.entity_subcategory || user.metadata?.role || 'User'}
                                </Badge>
                                <p className="text-xs text-gray-500 mt-1">
                                  {user.metadata?.title || 'Team Member'}
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Entity Types Tab */}
              <TabsContent value="entities" className="space-y-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">CRM Entity Types</h3>
                  <p className="text-sm text-gray-600">
                    These entity types will be created in the universal schema for your CRM
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CRM_DEMO_CONFIG.crmEntityTypes.map((entityType) => {
                    const Icon = entityType.icon
                    return (
                      <Card key={entityType.type} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{entityType.name}</h4>
                            <p className="text-sm text-gray-600 mb-1">
                              {entityType.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              Type: <code className="bg-gray-100 px-1 rounded text-blue-600">{entityType.type}</code>
                            </p>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
                
                <Alert className="border-blue-200 bg-blue-50">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-900">Universal Schema Advantage</AlertTitle>
                  <AlertDescription className="text-blue-800">
                    All these entity types use the same core_entities table with different entity_type values.
                    No schema changes needed - infinitely extensible architecture!
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      </div>
    </CRMLayout>
  )
}