'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ModernModal, CRMFormModal } from '@/components/ui/modern-modal'
import { CRMLayout } from '@/components/layout/crm-layout'
import { 
  Users, Building2, Target, CheckSquare, BarChart3, Settings, 
  Plus, Search, Filter, Mail, Phone, Calendar, DollarSign,
  User, Building, Star, Clock, TrendingUp, ArrowRight,
  UserPlus, Briefcase, AlertCircle, Trophy, Zap,
  Home, Activity, ChevronRight, Upload, Database, CheckCircle,
  LogIn, Eye, EyeOff
} from 'lucide-react'
import Link from 'next/link'
import { heraApi } from '@/lib/hera-api'
import { useAuth } from '@/components/auth/MultiOrgAuthProvider'
import { CRMErrorProvider } from '@/components/crm/error-provider'
import { ErrorDisplay } from '@/components/crm/error-display'
import { useCRMError, useCRMFormValidation } from '@/hooks/use-crm-error'
import AdvancedSearchFilter, { type SearchFilters, type SortOptions } from '@/components/crm/AdvancedSearchFilter'
import { createCRMSearchService, type CRMEntity } from '@/lib/crm/search-service'
import ActivityHistory from '@/components/crm/ActivityHistory'
import { createActivityTracker } from '@/lib/crm/activity-tracker'

// Demo data
const demoContacts = [
  {
    id: 1,
    name: 'Sarah Johnson',
    company: 'Tech Solutions Inc',
    email: 'sarah@techsolutions.com',
    phone: '(555) 123-4567',
    status: 'customer',
    lastContact: '2024-01-15',
    value: 25000,
    tags: ['Hot Lead', 'Enterprise']
  },
  {
    id: 2,
    name: 'Mike Chen',
    company: 'StartupCo',
    email: 'mike@startupco.com',
    phone: '(555) 987-6543',
    status: 'prospect',
    lastContact: '2024-01-10',
    value: 5000,
    tags: ['Cold Lead']
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    company: 'Global Enterprises',
    email: 'emily@global.com',
    phone: '(555) 456-7890',
    status: 'customer',
    lastContact: '2024-01-18',
    value: 50000,
    tags: ['VIP', 'Renewal']
  }
]

const demoOpportunities = [
  {
    id: 1,
    name: 'Tech Solutions - Q1 Implementation',
    contact: 'Sarah Johnson',
    stage: 'proposal',
    value: 25000,
    closeDate: '2024-02-15',
    probability: 75
  },
  {
    id: 2,
    name: 'StartupCo - Pilot Program',
    contact: 'Mike Chen',
    stage: 'discovery',
    value: 5000,
    closeDate: '2024-03-01',
    probability: 25
  },
  {
    id: 3,
    name: 'Global Enterprises - Enterprise License',
    contact: 'Emily Rodriguez',
    stage: 'negotiation',
    value: 50000,
    closeDate: '2024-01-30',
    probability: 90
  }
]

const demoTasks = [
  {
    id: 1,
    title: 'Follow up with Sarah Johnson',
    contact: 'Sarah Johnson',
    dueDate: '2024-01-20',
    priority: 'high',
    completed: false
  },
  {
    id: 2,
    title: 'Send proposal to Mike Chen',
    contact: 'Mike Chen',
    dueDate: '2024-01-22',
    priority: 'medium',
    completed: false
  },
  {
    id: 3,
    title: 'Contract negotiation call',
    contact: 'Emily Rodriguez',
    dueDate: '2024-01-19',
    priority: 'high',
    completed: true
  }
]

const stages = [
  { value: 'lead', label: 'Lead', color: 'bg-gray-500' },
  { value: 'qualified', label: 'Qualified', color: 'bg-blue-500' },
  { value: 'discovery', label: 'Discovery', color: 'bg-yellow-500' },
  { value: 'proposal', label: 'Proposal', color: 'bg-orange-500' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-purple-500' },
  { value: 'closed_won', label: 'Closed Won', color: 'bg-green-500' },
  { value: 'closed_lost', label: 'Closed Lost', color: 'bg-red-500' }
]

// CRM Login Component
function CRMLogin() {
  const { isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      const result = await login(email, password)
      if (!result.success) {
        setError(result.error || 'Login failed')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    }
  }

  const handleDemoLogin = () => {
    setEmail('mario@restaurant.com')
    setPassword('securepass123')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{background: 'linear-gradient(to right, #1E293B, #0F172A)'}}>
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-light text-gray-900 mb-2">Welcome to CRM</h1>
          <p className="text-gray-600">Sign in to access your customer management system</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="h-12 px-4 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-12 px-4 pr-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-white font-medium"
                style={{background: 'linear-gradient(to right, #1E293B, #0F172A)'}}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Demo Account */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-3">Try our demo account:</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDemoLogin}
                  className="w-full h-10 border-gray-300 hover:bg-gray-50"
                >
                  <User className="h-4 w-4 mr-2" />
                  Use Demo Account
                </Button>
                <div className="mt-2 text-xs text-gray-500">
                  <p>Email: mario@restaurant.com</p>
                  <p>Password: securepass123</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Powered by HERA ERP • Secure & Professional
          </p>
        </div>
      </div>
    </div>
  )
}

function CRMPageContent() {
  const { user, isLoading, logout } = useAuth()
  const isAuthenticated = !!user
  const organization = { name: user?.organizationName || 'Sample Business' }
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [contacts, setContacts] = useState<any[]>(demoContacts)
  const [opportunities, setOpportunities] = useState<any[]>(demoOpportunities)
  
  // Error handling
  const {
    error,
    isLoading: errorLoading,
    handleError,
    handleApiError,
    executeWithErrorHandling,
    clearError
  } = useCRMError({
    showToast: true,
    autoRetry: true,
    maxRetries: 3
  })
  
  // Form validation
  const contactValidation = useCRMFormValidation('contact')
  const [tasks, setTasks] = useState<any[]>(demoTasks)
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedContact, setSelectedContact] = useState(null)
  const [showContactForm, setShowContactForm] = useState(false)
  const [showOpportunityForm, setShowOpportunityForm] = useState(false)
  const [crmLoading, setCrmLoading] = useState(true)

  // Advanced search state
  const [searchResults, setSearchResults] = useState<CRMEntity[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(null)
  const [searchService] = useState(() => createCRMSearchService(organization?.id || 'demo-org'))
  
  // Filtered data based on search
  const [filteredContacts, setFilteredContacts] = useState(contacts)
  const [filteredOpportunities, setFilteredOpportunities] = useState(opportunities)
  const [filteredTasks, setFilteredTasks] = useState(tasks)

  // Activity tracking state
  const [activityTracker] = useState(() => 
    createActivityTracker(
      organization?.id || 'demo-org',
      user?.id || 'demo-user',
      user?.full_name || 'Demo User',
      user?.email || 'demo@company.com'
    )
  )
  const [showActivityHistory, setShowActivityHistory] = useState(false)
  const [activityEntityFilter, setActivityEntityFilter] = useState<{
    type: 'contact' | 'opportunity' | 'task'
    id: string
    name: string
  } | undefined>(undefined)
  
  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'prospect',
    tags: '',
    notes: ''
  })

  // Opportunity form state
  const [opportunityForm, setOpportunityForm] = useState({
    name: '',
    contact: '',
    stage: 'lead',
    value: '',
    closeDate: '',
    probability: 50,
    description: ''
  })
  
  // Fetch CRM data function - must be defined before useEffect
  const loadCRMData = useCallback(async () => {
    if (!organization?.id) {
      handleError('ORG_NOT_FOUND', null, { component: 'CRMPage', action: 'loadData' })
      return
    }
    
    await executeWithErrorHandling(async () => {
      setCrmLoading(true)
      
      // Load contacts
      const contactEntities = await heraApi.getEntities('contact')
      const contactsWithData = await Promise.all(
        contactEntities.map(async (contact: any) => {
          const dynamicData = await heraApi.getDynamicData(contact.id, ['email', 'phone', 'company', 'status', 'last_contact', 'value', 'tags'])
          return {
            ...contact,
            ...dynamicData,
            // Ensure name is always defined and is a string
            name: contact.entity_name || contact.name || 'Unknown Contact',
            // Ensure other fields are properly typed
            email: dynamicData.email || '',
            phone: dynamicData.phone || '',
            company: dynamicData.company || '',
            status: dynamicData.status || 'prospect',
            lastContact: dynamicData.last_contact || new Date().toISOString().split('T')[0],
            value: Number(dynamicData.value) || 0,
            tags: Array.isArray(dynamicData.tags) ? dynamicData.tags : (dynamicData.tags ? dynamicData.tags.split(',').map((tag: string) => tag.trim()) : [])
          }
        })
      )
      setContacts(contactsWithData)

      // Load companies
      const companyEntities = await heraApi.getEntities('company')
      const companiesWithData = await Promise.all(
        companyEntities.map(async (company: any) => {
          const dynamicData = await heraApi.getDynamicData(company.id, ['industry', 'size', 'website', 'phone', 'email'])
          return {
            ...company,
            ...dynamicData
          }
        })
      )
      setCompanies(companiesWithData)

      // Load opportunities
      const opportunityEntities = await heraApi.getEntities('opportunity')
      const opportunitiesWithData = await Promise.all(
        opportunityEntities.map(async (opp: any) => {
          const dynamicData = await heraApi.getDynamicData(opp.id, ['stage', 'value', 'probability', 'close_date', 'contact_id', 'company_id'])
          return {
            ...opp,
            ...dynamicData
          }
        })
      )
      setOpportunities(opportunitiesWithData)

      // Load tasks
      const taskEntities = await heraApi.getEntities('task')
      const tasksWithData = await Promise.all(
        taskEntities.map(async (task: any) => {
          const dynamicData = await heraApi.getDynamicData(task.id, ['due_date', 'priority', 'status', 'assigned_to', 'contact_id'])
          return {
            ...task,
            ...dynamicData
          }
        })
      )
      setTasks(tasksWithData)
      
      return true // Success indicator
    }, { component: 'CRMPage', action: 'loadCRMData' })
    
    setCrmLoading(false)
  }, [organization, executeWithErrorHandling, handleError])

  // Advanced search functions
  const handleSearch = async (filters: SearchFilters, sort: SortOptions) => {
    setIsSearching(true)
    try {
      const results = await searchService.search(filters, sort)
      setSearchResults(results.results)
      setSearchFilters(filters)
      
      // Apply search results to filtered data
      applySearchResults(results.results, filters)
      
      return results
    } catch (error) {
      console.error('Search error:', error)
      throw error
    } finally {
      setIsSearching(false)
    }
  }

  const applySearchResults = (results: CRMEntity[], filters: SearchFilters) => {
    // Filter contacts
    const searchContacts = results.filter(item => 
      'company' in item || filters.entityType === 'contact' || filters.entityType === 'all'
    )
    setFilteredContacts(searchContacts.length > 0 ? searchContacts as any[] : 
      filters.entityType === 'contact' ? [] : contacts
    )

    // Filter opportunities
    const searchOpportunities = results.filter(item => 
      'stage' in item || filters.entityType === 'opportunity' || filters.entityType === 'all'
    )
    setFilteredOpportunities(searchOpportunities.length > 0 ? searchOpportunities as any[] : 
      filters.entityType === 'opportunity' ? [] : opportunities
    )

    // Filter tasks
    const searchTasks = results.filter(item => 
      'priority' in item || filters.entityType === 'task' || filters.entityType === 'all'
    )
    setFilteredTasks(searchTasks.length > 0 ? searchTasks as any[] : 
      filters.entityType === 'task' ? [] : tasks
    )
  }

  const resetSearch = () => {
    setSearchResults([])
    setSearchFilters(null)
    setFilteredContacts(contacts)
    setFilteredOpportunities(opportunities)
    setFilteredTasks(tasks)
  }

  // Update filtered data when original data changes
  useEffect(() => {
    if (!searchFilters) {
      setFilteredContacts(contacts)
      setFilteredOpportunities(opportunities)
      setFilteredTasks(tasks)
    }
  }, [contacts, opportunities, tasks, searchFilters])

  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Fetch CRM data on component mount
  useEffect(() => {
    if (mounted && organization?.id) {
      loadCRMData()
    }
  }, [organization, mounted, loadCRMData])
  
  if (!mounted || isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <CRMLogin />
  }
  



  const handleCreateContact = async () => {
    // Validate contact data
    if (!contactValidation.validateForm(contactForm)) {
      return
    }

    await executeWithErrorHandling(async () => {
      const newContact = {
        id: Date.now(),
        ...contactForm,
        lastContact: new Date().toISOString().split('T')[0],
        value: 0,
        tags: contactForm.tags ? contactForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
      }
      
      // Check for duplicate email
      const existingContact = contacts.find(c => c.email === contactForm.email)
      if (existingContact) {
        handleError('DUPLICATE_CONTACT', { email: contactForm.email }, 
          { component: 'CRMPage', action: 'createContact' })
        return
      }

      // Track contact creation activity
      await activityTracker.trackContactActivity(
        'create',
        newContact.id.toString(),
        newContact.name
      )

      setContacts([...contacts, newContact])
      setContactForm({
        name: '',
        company: '',
        email: '',
        phone: '',
        status: 'prospect',
        tags: '',
        notes: ''
      })
      setShowContactForm(false)
      
      return newContact
    }, { component: 'CRMPage', action: 'createContact' })
  }

  const handleCreateOpportunity = () => {
    const newOpportunity = {
      id: Date.now(),
      ...opportunityForm,
      value: parseFloat(opportunityForm.value) || 0
    }
    setOpportunities([...opportunities, newOpportunity])
    setOpportunityForm({
      name: '',
      contact: '',
      stage: 'lead',
      value: '',
      closeDate: '',
      probability: 50,
      description: ''
    })
    setShowOpportunityForm(false)
  }

  const totalRevenue = opportunities.reduce((sum, opp) => sum + (opp.value * opp.probability / 100), 0)
  const totalDeals = opportunities.length
  const avgDealSize = totalDeals > 0 ? totalRevenue / totalDeals : 0
  const pendingTasks = tasks.filter(task => !task.completed).length
  const weightedPipeline = Math.round(totalRevenue / 1000)

  return (
    <CRMLayout>
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                💼 HERA CRM
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                Manage relationships and grow revenue. Everything you need in one place.
              </p>
              {user && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-gray-500">Welcome back,</span>
                  <span className="text-sm font-medium text-gray-700">{user.full_name}</span>
                </div>
              )}
            </div>
            {/* Mobile: Stack buttons vertically, Desktop: Horizontal */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button size="sm" asChild className="justify-start text-white hover:bg-gray-800" style={{background: 'linear-gradient(to right, #1E293B, #0F172A)'}}>
                <Link href="/crm-progressive/deals">
                  <Target className="w-4 h-4 mr-2" />
                  <span className="hidden xs:inline">Deals</span>
                  <span className="xs:hidden">Deals</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="justify-start">
                <Link href="/crm-progressive/dashboards/main">
                  <Home className="w-4 h-4 mr-2" />
                  <span className="hidden xs:inline">Executive View</span>
                  <span className="xs:hidden">Executive</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="justify-start">
                <Link href="/crm-progressive/dashboards/sales">
                  <Target className="w-4 h-4 mr-2" />
                  <span className="hidden xs:inline">Sales Pipeline</span>
                  <span className="xs:hidden">Sales</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="justify-start">
                <Link href="/crm-progressive/dashboards/tasks">
                  <CheckSquare className="w-4 h-4 mr-2" />
                  <span className="hidden xs:inline">Tasks & Activities</span>
                  <span className="xs:hidden">Tasks</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="justify-start">
                <Link href="/crm-progressive/data-import">
                  <Upload className="w-4 h-4 mr-2" />
                  <span className="hidden xs:inline">Import Data</span>
                  <span className="xs:hidden">Import</span>
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowActivityHistory(true)}
                className="justify-start"
              >
                <Activity className="w-4 h-4 mr-2" />
                <span className="hidden xs:inline">Activity History</span>
                <span className="xs:hidden">History</span>
              </Button>
              <Button variant="outline" size="sm" asChild className="justify-start">
                <Link href="/crm-progressive/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  <span className="hidden xs:inline">Settings</span>
                  <span className="xs:hidden">Setup</span>
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => logout()}
                className="justify-start border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <LogIn className="w-4 h-4 mr-2 rotate-180" />
                <span className="hidden xs:inline">Logout</span>
                <span className="xs:hidden">Exit</span>
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile: Scrollable horizontal tabs, Desktop: Grid */}
          <div className="overflow-x-auto mb-8">
            <TabsList className="grid w-full grid-cols-6 min-w-[600px] sm:min-w-0">
              <TabsTrigger value="dashboard" data-testid="dashboard-tab" className="flex items-center gap-1 text-xs sm:text-sm">
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Dashboard</span>
                <span className="xs:hidden">Home</span>
              </TabsTrigger>
              <TabsTrigger value="contacts" data-testid="contacts-tab" className="flex items-center gap-1 text-xs sm:text-sm">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Contacts</span>
                <span className="xs:hidden">People</span>
              </TabsTrigger>
              <TabsTrigger value="opportunities" data-testid="opportunities-tab" className="flex items-center gap-1 text-xs sm:text-sm">
                <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Pipeline</span>
                <span className="xs:hidden">Deals</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" data-testid="activities-tab" className="flex items-center gap-1 text-xs sm:text-sm">
                <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Tasks</span>
                <span className="xs:hidden">Tasks</span>
              </TabsTrigger>
              <TabsTrigger value="reports" data-testid="reports-tab" className="flex items-center gap-1 text-xs sm:text-sm">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Reports</span>
                <span className="xs:hidden">Stats</span>
              </TabsTrigger>
              <TabsTrigger value="settings" data-testid="settings-tab" className="flex items-center gap-1 text-xs sm:text-sm">
                <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Settings</span>
                <span className="xs:hidden">Config</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard Tab - Navigation to specialized dashboards */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Error Display */}
            {error && (
              <ErrorDisplay 
                error={error} 
                onRetry={() => loadCRMData()} 
                onDismiss={clearError}
                showDetails={true}
              />
            )}
            
            {/* Featured Deals Card - Steve Jobs style prominence */}
            <Card className="text-white hover:shadow-2xl transition-all duration-300 cursor-pointer border-0" style={{background: 'linear-gradient(to right, #1E293B, #0F172A)'}}>
              <Link href="/crm-progressive/deals">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center">
                      <Target className="h-8 w-8 text-white" />
                    </div>
                    <ChevronRight className="h-6 w-6 text-white/70" />
                  </div>
                  <h2 className="text-2xl font-light mb-3">Your Deals</h2>
                  <p className="text-white/80 mb-6 text-lg">
                    Simple deal management. No complexity. Just results.
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-light">$80K</div>
                      <div className="text-white/70 text-sm">Pipeline</div>
                    </div>
                    <div>
                      <div className="text-2xl font-light">2</div>
                      <div className="text-white/70 text-sm">Active</div>
                    </div>
                    <div>
                      <div className="text-2xl font-light text-green-300">$50K</div>
                      <div className="text-white/70 text-sm">Won</div>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Executive Dashboard Card */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link href="/crm-progressive/dashboards/main">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Home className="h-6 w-6 text-blue-600" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="text-lg font-semibold mb-2">Executive Dashboard</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      High-level overview for executives and founders. See your business at a glance with key metrics, recent activities, and critical insights.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Business metrics overview
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Activity className="h-4 w-4 mr-2" />
                        Recent activity highlights
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Briefcase className="h-4 w-4 mr-2" />
                        Hot opportunities snapshot
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-gray-500">Best for: Founders, CEOs, Executives</p>
                    </div>
                  </CardContent>
                </Link>
              </Card>

              {/* Sales Dashboard Card */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link href="/crm-progressive/dashboards/sales">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Target className="h-6 w-6 text-green-600" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="text-lg font-semibold mb-2">Sales Dashboard</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Detailed view for managing your sales pipeline. Track deals, monitor revenue forecasts, and analyze sales performance.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Pipeline management
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Revenue tracking
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Trophy className="h-4 w-4 mr-2" />
                        Performance analytics
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-gray-500">Best for: Sales Managers, Sales Reps</p>
                    </div>
                  </CardContent>
                </Link>
              </Card>

              {/* Tasks Dashboard Card */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link href="/crm-progressive/dashboards/tasks">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <CheckSquare className="h-6 w-6 text-orange-600" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="text-lg font-semibold mb-2">Tasks & Activities</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Stay on top of your daily work. Manage follow-ups, track activities, and ensure nothing falls through the cracks.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-2" />
                        Task management
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-2" />
                        Follow-up tracking
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="h-4 w-4 mr-2" />
                        Activity monitoring
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-gray-500">Best for: Sales Reps, Support Staff</p>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Total Contacts</p>
                    <p className="text-xl font-bold" data-testid="dashboard-contact-count">{contacts.length}</p>
                  </div>
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Active Deals</p>
                    <p className="text-xl font-bold" data-testid="active-deals">{totalDeals}</p>
                  </div>
                  <Target className="h-6 w-6 text-gray-400" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Pipeline Value</p>
                    <p className="text-xl font-bold" data-testid="pipeline-value">${(totalRevenue / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-gray-500" data-testid="weighted-pipeline">Weighted: ${weightedPipeline}K</p>
                  </div>
                  <DollarSign className="h-6 w-6 text-gray-400" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Tasks Due</p>
                    <p className="text-xl font-bold">{pendingTasks}</p>
                  </div>
                  <Clock className="h-6 w-6 text-gray-400" />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-6">
            {/* Advanced Search & Filters */}
            <AdvancedSearchFilter
              onFiltersChange={(filters, sort) => {
                // Update search state when filters change
                setSearchFilters(filters)
              }}
              onSearch={handleSearch}
              initialFilters={{ entityType: 'contact' }}
              availableFilters={{
                contactStatuses: ['prospect', 'customer', 'partner', 'inactive'],
                stages: ['discovery', 'proposal', 'negotiation', 'closed-won', 'closed-lost'],
                priorities: ['low', 'medium', 'high', 'urgent'],
                assignees: ['Me', 'Team Lead', 'Sales Rep', 'Support'],
                tags: ['Hot Lead', 'Enterprise', 'VIP', 'Renewal', 'Cold Lead', 'Demo']
              }}
              isLoading={isSearching}
              resultCount={filteredContacts.length}
            />

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {searchFilters ? (
                    <>
                      Showing {filteredContacts.length} of {contacts.length} contacts
                      <Button
                        variant="link"
                        size="sm"
                        onClick={resetSearch}
                        className="ml-2 h-auto p-0 text-blue-600"
                      >
                        Clear search
                      </Button>
                    </>
                  ) : (
                    `${contacts.length} contacts`
                  )}
                </div>
              </div>
              <Button onClick={() => setShowContactForm(true)} data-testid="add-contact-btn" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredContacts.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts yet</h3>
                <p className="text-gray-600 mb-4">Get started by adding your first contact</p>
                <Button onClick={() => setShowContactForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Contact
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" data-testid="contacts-grid">
                {filteredContacts.map((contact, index) => (
                <Card key={contact.id} data-testid={`contact-${index}`} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <Avatar className="flex-shrink-0">
                          <AvatarFallback>{contact.name && typeof contact.name === 'string' ? contact.name.split(' ').map((n: string) => n[0]).join('') : '?'}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold truncate">{contact.name}</h3>
                          <p className="text-sm text-gray-600 truncate">{contact.company}</p>
                        </div>
                      </div>
                      <Badge variant={contact.status === 'customer' ? 'default' : 'secondary'} data-testid="status-badge" className="flex-shrink-0 text-xs">
                        {contact.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600 min-w-0">
                        <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{contact.phone}</span>
                      </div>
                    </div>

                    {contact.tags && contact.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {contact.tags.slice(0, 2).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {contact.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{contact.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <span className="text-xs sm:text-sm text-gray-600">
                        Last: {contact.lastContact}
                      </span>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs"
                          onClick={() => {
                            // Track contact view activity
                            activityTracker.trackContactActivity(
                              'view',
                              contact.id.toString(),
                              contact.name
                            )
                            // Show activity history for this contact
                            setActivityEntityFilter({
                              type: 'contact',
                              id: contact.id.toString(),
                              name: contact.name
                            })
                            setShowActivityHistory(true)
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-xs"
                          onClick={() => {
                            setActivityEntityFilter({
                              type: 'contact',
                              id: contact.id.toString(),
                              name: contact.name
                            })
                            setShowActivityHistory(true)
                          }}
                        >
                          <Activity className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            )}

            {/* Modern Contact Form Modal */}
            <CRMFormModal
              isOpen={showContactForm}
              onClose={() => setShowContactForm(false)}
              title="Add New Contact"
              subtitle="Create a new contact in your CRM system"
              size="md"
              isLoading={isLoading}
              onSubmit={handleCreateContact}
              onCancel={() => setShowContactForm(false)}
              submitText="Create Contact"
              submitVariant="success"
              data-testid="crm-form-modal"
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-900 font-medium">Full Name *</Label>
                  <Input
                    id="name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                    placeholder="Enter full name"
                    className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-gray-900 font-medium">Company</Label>
                  <Input
                    id="company"
                    value={contactForm.company}
                    onChange={(e) => setContactForm({...contactForm, company: e.target.value})}
                    placeholder="Company name"
                    className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-900 font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                      placeholder="email@company.com"
                      className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-900 font-medium">Phone</Label>
                    <Input
                      id="phone"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                      placeholder="(555) 123-4567"
                      className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-gray-900 font-medium">Status</Label>
                  <Select value={contactForm.status} onValueChange={(value) => setContactForm({...contactForm, status: value})}>
                    <SelectTrigger className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-gray-900 font-medium">Tags</Label>
                  <Input
                    id="tags"
                    value={contactForm.tags}
                    onChange={(e) => setContactForm({...contactForm, tags: e.target.value})}
                    placeholder="Hot Lead, Enterprise, VIP (comma separated)"
                    className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CRMFormModal>
          </TabsContent>

          {/* Pipeline Tab - Redirect to New Deal System */}
          <TabsContent value="opportunities" className="space-y-6">
            <div className="text-center py-16">
              <div className="max-w-2xl mx-auto">
                <div className="h-24 w-24 bg-gradient-to-br from-black to-gray-700 rounded-3xl mx-auto mb-8 flex items-center justify-center">
                  <Target className="h-12 w-12 text-white" />
                </div>
                <h2 className="text-3xl font-light text-gray-900 mb-4">
                  Your Deals Have Been Upgraded
                </h2>
                <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                  We've created a dedicated deal management experience with configurable pipelines. 
                  Choose from 3 templates or build your own custom pipeline.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                  <Button asChild size="lg" className="text-white hover:bg-gray-800 px-8 py-6 text-lg rounded-xl" style={{background: 'linear-gradient(to right, #1E293B, #0F172A)'}}>
                    <Link href="/crm-progressive/deals">
                      <Target className="w-5 h-5 mr-2" />
                      Go to Deals
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="px-8 py-6 text-lg rounded-xl">
                    <Link href="/crm-progressive/deals/dashboard">
                      <Settings className="w-5 h-5 mr-2" />
                      Configure Pipeline
                    </Link>
                  </Button>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">What's New:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>3 Pipeline Templates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Custom Stage Builder</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Steve Jobs Simplicity</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Tasks & Reminders</h2>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tasks.filter(task => !task.completed).map(task => (
                      <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            className="rounded"
                            onChange={(e) => {
                              const updatedTasks = tasks.map(t => 
                                t.id === task.id ? {...t, completed: e.target.checked} : t
                              )
                              setTasks(updatedTasks)
                            }}
                          />
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-gray-600">{task.contact}</p>
                            <p className="text-xs text-gray-500">Due: {task.dueDate}</p>
                          </div>
                        </div>
                        <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}>
                          {task.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Completed Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tasks.filter(task => task.completed).map(task => (
                      <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={true}
                            onChange={(e) => {
                              const updatedTasks = tasks.map(t => 
                                t.id === task.id ? {...t, completed: e.target.checked} : t
                              )
                              setTasks(updatedTasks)
                            }}
                          />
                          <div>
                            <p className="font-medium line-through text-gray-500">{task.title}</p>
                            <p className="text-sm text-gray-400">{task.contact}</p>
                          </div>
                        </div>
                        <Badge variant="outline">completed</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <h2 className="text-2xl font-bold">Sales Reports & Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Sales Funnel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stages.slice(0, 5).map(stage => {
                      const stageOpportunities = opportunities.filter(opp => opp.stage === stage.value)
                      const percentage = totalDeals > 0 ? (stageOpportunities.length / totalDeals) * 100 : 0
                      
                      return (
                        <div key={stage.value} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{stage.label}</span>
                            <span>{stageOpportunities.length} deals</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${stage.color}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Revenue Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        ${totalRevenue.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Weighted Pipeline</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Best Case:</span>
                        <span>${opportunities.reduce((sum, opp) => sum + opp.value, 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Average Deal Size:</span>
                        <span>${avgDealSize.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Active Deals:</span>
                        <span>{totalDeals}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                      <p className="font-semibold">Emily Rodriguez</p>
                      <p className="text-sm text-gray-600">Top Customer</p>
                      <p className="text-lg font-bold text-green-600">$50,000</p>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Customers:</span>
                          <span>{contacts.filter(c => c.status === 'customer').length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Prospects:</span>
                          <span>{contacts.filter(c => c.status === 'prospect').length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Conversion Rate:</span>
                          <span>65%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold">CRM Settings</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>AD</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Admin User</p>
                        <p className="text-sm text-gray-600">admin@company.com</p>
                      </div>
                    </div>
                    <Badge>Admin</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>SR</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Sales Rep</p>
                        <p className="text-sm text-gray-600">sales@company.com</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Sales Rep</Badge>
                  </div>
                  <Button className="w-full">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Integration Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-medium">Email Integration</p>
                        <p className="text-sm text-gray-600">Connect Gmail/Outlook</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium">Calendar Sync</p>
                        <p className="text-sm text-gray-600">Google/Outlook Calendar</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Zap className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="font-medium">Automation</p>
                        <p className="text-sm text-gray-600">Workflow automation</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Setup</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Activity History Modal */}
        {showActivityHistory && (
          <ActivityHistory
            organizationId={organization?.id || 'demo-org'}
            userId={user?.id || 'demo-user'}
            userName={user?.full_name || 'Demo User'}
            userEmail={user?.email || 'demo@company.com'}
            isOpen={showActivityHistory}
            onClose={() => {
              setShowActivityHistory(false)
              setActivityEntityFilter(undefined)
            }}
            entityFilter={activityEntityFilter}
          />
        )}
      </div>
    </CRMLayout>
  )
}

export default function CRMPage() {
  return (
    <CRMErrorProvider>
      <CRMPageContent />
    </CRMErrorProvider>
  )
}