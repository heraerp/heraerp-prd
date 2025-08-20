'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/DualAuthProvider'
import { getHeraApi } from '@/lib/hera-api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { JewelryTeamsSidebar } from '@/components/jewelry-progressive/JewelryTeamsSidebar'
import { 
  Users, 
  Search, 
  Plus, 
  Filter,
  Download,
  Upload,
  Crown,
  Star,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Edit,
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBag,
  Heart,
  Gift,
  Award,
  Gem,
  X,
  Camera,
  Sparkles,
  User,
  CreditCard,
  Loader2,
  ArrowUpDown,
  UserPlus,
  History,
  Tag
} from 'lucide-react'

// Status display mapping
const statusDisplayMap = {
  active: 'Active',
  inactive: 'Inactive', 
  archived: 'Archived',
  draft: 'Draft'
}

// Status color mapping
const statusColorMap = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-red-100 text-red-800',
  archived: 'bg-gray-100 text-gray-800', 
  draft: 'bg-yellow-100 text-yellow-800'
}

// Jewelry CRM Customer interface
interface JewelryCustomer {
  id: string
  customerCode: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth?: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  preferences: {
    metalTypes: string[]
    stoneTypes: string[]
    categories: string[]
    budgetRange: string
    occasions: string[]
  }
  vipLevel: 'Standard' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond'
  totalSpent: number
  totalOrders: number
  averageOrderValue: number
  lastPurchaseDate?: string
  customerSince: string
  favoriteProducts: string[]
  specialDates: {
    type: string // birthday, anniversary, etc
    date: string
    notes?: string
  }[]
  notes: string
  tags: string[]
  communicationPreferences: {
    email: boolean
    sms: boolean
    phone: boolean
    mail: boolean
  }
  loyaltyPoints: number
  referralSource: string
  assignedSalesRep?: string
  status: 'active' | 'inactive' | 'archived' | 'draft'
  createdAt: string
  updatedAt: string
}

// Demo customer data with realistic jewelry customer profiles
const demoCustomers: JewelryCustomer[] = [
  {
    id: 'CUST-001',
    customerCode: 'VIP-001',
    firstName: 'Elizabeth',
    lastName: 'Montgomery',
    email: 'elizabeth.montgomery@email.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1985-03-15',
    address: {
      street: '123 Luxury Lane',
      city: 'Beverly Hills',
      state: 'CA',
      zipCode: '90210',
      country: 'USA'
    },
    preferences: {
      metalTypes: ['18K White Gold', 'Platinum'],
      stoneTypes: ['Diamond', 'Sapphire'],
      categories: ['Engagement Rings', 'Necklaces'],
      budgetRange: '$10,000+',
      occasions: ['Anniversary', 'Special Events']
    },
    vipLevel: 'Diamond',
    totalSpent: 45250,
    totalOrders: 12,
    averageOrderValue: 3771,
    lastPurchaseDate: '2024-12-15',
    customerSince: '2019-06-20',
    favoriteProducts: ['SOL-DIA-001', 'NECK-PRL-002'],
    specialDates: [
      { type: 'Birthday', date: '1985-03-15' },
      { type: 'Anniversary', date: '2010-09-25', notes: '15th wedding anniversary' }
    ],
    notes: 'Prefers contemporary designs. Interested in investment pieces. Very loyal customer.',
    tags: ['VIP', 'high-value', 'referral-source', 'anniversary-buyer'],
    communicationPreferences: {
      email: true,
      sms: true,
      phone: false,
      mail: true
    },
    loyaltyPoints: 4525,
    referralSource: 'Word of Mouth',
    assignedSalesRep: 'Sarah Mitchell',
    status: 'active',
    createdAt: '2019-06-20',
    updatedAt: '2024-12-15'
  },
  {
    id: 'CUST-002',
    customerCode: 'GOLD-045',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@email.com',
    phone: '+1 (555) 234-5678',
    dateOfBirth: '1978-11-08',
    address: {
      street: '456 Oak Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA'
    },
    preferences: {
      metalTypes: ['14K Yellow Gold', '18K Rose Gold'],
      stoneTypes: ['Ruby', 'Emerald'],
      categories: ['Watches', 'Cufflinks'],
      budgetRange: '$2,000-$10,000',
      occasions: ['Business', 'Casual']
    },
    vipLevel: 'Gold',
    totalSpent: 18750,
    totalOrders: 8,
    averageOrderValue: 2344,
    lastPurchaseDate: '2024-11-28',
    customerSince: '2020-02-14',
    favoriteProducts: ['RNG-COC-005'],
    specialDates: [
      { type: 'Birthday', date: '1978-11-08' },
      { type: 'Anniversary', date: '2005-06-12' }
    ],
    notes: 'Tech executive. Appreciates craftsmanship and unique designs.',
    tags: ['professional', 'tech-industry', 'collector'],
    communicationPreferences: {
      email: true,
      sms: false,
      phone: true,
      mail: false
    },
    loyaltyPoints: 1875,
    referralSource: 'Google Search',
    assignedSalesRep: 'James Wilson',
    status: 'active',
    createdAt: '2020-02-14',
    updatedAt: '2024-11-28'
  },
  {
    id: 'CUST-003',
    customerCode: 'SILV-128',
    firstName: 'Amanda',
    lastName: 'Rodriguez',
    email: 'amanda.rodriguez@email.com',
    phone: '+1 (555) 345-6789',
    dateOfBirth: '1992-07-22',
    address: {
      street: '789 Fashion Ave',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    preferences: {
      metalTypes: ['Sterling Silver', '14K White Gold'],
      stoneTypes: ['Pearl', 'Diamond'],
      categories: ['Earrings', 'Bracelets'],
      budgetRange: '$500-$2,000',
      occasions: ['Daily Wear', 'Date Night']
    },
    vipLevel: 'Silver',
    totalSpent: 4250,
    totalOrders: 6,
    averageOrderValue: 708,
    lastPurchaseDate: '2024-10-05',
    customerSince: '2022-01-10',
    favoriteProducts: ['EAR-STD-004'],
    specialDates: [
      { type: 'Birthday', date: '1992-07-22' }
    ],
    notes: 'Young professional. Loves trendy, wearable pieces.',
    tags: ['millennial', 'trendy', 'social-media'],
    communicationPreferences: {
      email: true,
      sms: true,
      phone: false,
      mail: false
    },
    loyaltyPoints: 425,
    referralSource: 'Instagram',
    assignedSalesRep: 'Sarah Mitchell',
    status: 'active',
    createdAt: '2022-01-10',
    updatedAt: '2024-10-05'
  }
]

// VIP Level configuration
const vipLevels = {
  'Standard': { threshold: 0, color: 'gray', icon: User, benefits: 'Standard service' },
  'Silver': { threshold: 2500, color: 'slate', icon: Award, benefits: '5% discount, priority service' },
  'Gold': { threshold: 10000, color: 'amber', icon: Star, benefits: '10% discount, exclusive events' },
  'Platinum': { threshold: 25000, color: 'purple', icon: Crown, benefits: '15% discount, personal shopper' },
  'Diamond': { threshold: 50000, color: 'blue', icon: Gem, benefits: '20% discount, concierge service' }
}

function JewelryCustomers() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState<JewelryCustomer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVipLevel, setSelectedVipLevel] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [selectedCustomer, setSelectedCustomer] = useState<JewelryCustomer | null>(null)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  // Load customers from HERA Universal API
  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setIsLoading(true)
      const heraApi = getHeraApi()
      
      console.log('🔗 HERA CRM API Connection Test - Loading jewelry customers...')
      
      // Test API connectivity first
      try {
        const testResponse = await fetch('/api/v1/test-jewelry-crud')
        const testData = await testResponse.json()
        console.log('✅ HERA API Test:', testData)
      } catch (testError) {
        console.log('⚠️ API Test Error:', testError)
      }
      
      // Fetch jewelry customers from universal entities
      const entities = await heraApi.getEntities('jewelry_customer')
      
      // If no entities found, use demo data
      if (!entities || entities.length === 0) {
        setCustomers(demoCustomers)
        console.log('👥 Using demo customer data - No entities found in universal API')
        console.log('🏗️ Universal Architecture: core_entities -> entity_type="jewelry_customer"')
        console.log('👑 Demo Customers Loaded:', demoCustomers.length)
      } else {
        // Transform HERA entities to JewelryCustomer format
        const jewelryCustomers = await Promise.all(entities.map(async (entity: any) => {
          // Get dynamic data for this entity
          const dynamicData = await heraApi.getDynamicData(entity.id)
          
          return {
            id: entity.id,
            customerCode: entity.entity_code,
            firstName: dynamicData.first_name || entity.entity_name.split(' ')[0],
            lastName: dynamicData.last_name || entity.entity_name.split(' ')[1] || '',
            email: dynamicData.email || '',
            phone: dynamicData.phone || '',
            dateOfBirth: dynamicData.date_of_birth,
            address: dynamicData.address ? JSON.parse(dynamicData.address) : {},
            preferences: dynamicData.preferences ? JSON.parse(dynamicData.preferences) : {},
            vipLevel: dynamicData.vip_level || 'Standard',
            totalSpent: parseFloat(dynamicData.total_spent) || 0,
            totalOrders: parseInt(dynamicData.total_orders) || 0,
            averageOrderValue: parseFloat(dynamicData.average_order_value) || 0,
            lastPurchaseDate: dynamicData.last_purchase_date,
            customerSince: entity.created_at,
            favoriteProducts: dynamicData.favorite_products ? JSON.parse(dynamicData.favorite_products) : [],
            specialDates: dynamicData.special_dates ? JSON.parse(dynamicData.special_dates) : [],
            notes: dynamicData.notes || '',
            tags: dynamicData.tags ? JSON.parse(dynamicData.tags) : [],
            communicationPreferences: dynamicData.communication_preferences ? JSON.parse(dynamicData.communication_preferences) : {},
            loyaltyPoints: parseInt(dynamicData.loyalty_points) || 0,
            referralSource: dynamicData.referral_source || '',
            assignedSalesRep: dynamicData.assigned_sales_rep,
            status: entity.status || 'active',
            createdAt: entity.created_at,
            updatedAt: entity.updated_at || entity.created_at
          }
        }))
        
        setCustomers(jewelryCustomers)
        console.log('👥 Loaded customers from Universal API:', jewelryCustomers.length)
      }
    } catch (error) {
      console.error('Failed to load customers:', error)
      // Fall back to demo data on error
      setCustomers(demoCustomers)
    } finally {
      setIsLoading(false)
    }
  }

  // Create new jewelry customer using Universal API
  const createJewelryCustomer = async (customerData: Partial<JewelryCustomer>) => {
    try {
      setIsSaving(true)
      const heraApi = getHeraApi()
      
      console.log('👤 Creating new jewelry customer:', customerData.firstName, customerData.lastName)
      
      // Create entity in core_entities
      const entity = await heraApi.createEntity({
        entity_type: 'jewelry_customer',
        entity_code: customerData.customerCode || `CUST-${Date.now()}`,
        entity_name: `${customerData.firstName} ${customerData.lastName}`,
        status: customerData.status || 'active',
        organization_id: user?.organizationId
      })
      
      // Save all customer-specific data to core_dynamic_data
      const dynamicFields = {
        first_name: customerData.firstName,
        last_name: customerData.lastName,
        email: customerData.email,
        phone: customerData.phone,
        date_of_birth: customerData.dateOfBirth,
        address: JSON.stringify(customerData.address || {}),
        preferences: JSON.stringify(customerData.preferences || {}),
        vip_level: customerData.vipLevel || 'Standard',
        total_spent: customerData.totalSpent?.toString() || '0',
        total_orders: customerData.totalOrders?.toString() || '0',
        average_order_value: customerData.averageOrderValue?.toString() || '0',
        last_purchase_date: customerData.lastPurchaseDate,
        favorite_products: JSON.stringify(customerData.favoriteProducts || []),
        special_dates: JSON.stringify(customerData.specialDates || []),
        notes: customerData.notes || '',
        tags: JSON.stringify(customerData.tags || []),
        communication_preferences: JSON.stringify(customerData.communicationPreferences || {}),
        loyalty_points: customerData.loyaltyPoints?.toString() || '0',
        referral_source: customerData.referralSource || '',
        assigned_sales_rep: customerData.assignedSalesRep || user?.name
      }
      
      // Save each dynamic field
      for (const [fieldName, fieldValue] of Object.entries(dynamicFields)) {
        if (fieldValue !== undefined && fieldValue !== null) {
          await heraApi.updateDynamicData(entity.id, fieldName, fieldValue)
        }
      }
      
      console.log('✅ Customer created successfully:', entity.id)
      
      // Reload customers
      await loadCustomers()
      
      return entity
    } catch (error) {
      console.error('Failed to create jewelry customer:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  // Update jewelry customer using Universal API
  const updateJewelryCustomer = async (customerId: string, updates: Partial<JewelryCustomer>) => {
    try {
      setIsSaving(true)
      const heraApi = getHeraApi()
      
      console.log('👤 Updating customer:', customerId, updates)
      
      // Update entity basic info if needed
      if (updates.firstName || updates.lastName || updates.customerCode) {
        await heraApi.updateEntity(customerId, {
          entity_name: `${updates.firstName} ${updates.lastName}`,
          entity_code: updates.customerCode,
          status: updates.status
        })
      }
      
      // Update dynamic data fields
      const dynamicUpdates: Record<string, string> = {}
      if (updates.email !== undefined) dynamicUpdates.email = updates.email
      if (updates.phone !== undefined) dynamicUpdates.phone = updates.phone
      if (updates.vipLevel !== undefined) dynamicUpdates.vip_level = updates.vipLevel
      if (updates.totalSpent !== undefined) dynamicUpdates.total_spent = updates.totalSpent.toString()
      if (updates.notes !== undefined) dynamicUpdates.notes = updates.notes
      if (updates.tags !== undefined) dynamicUpdates.tags = JSON.stringify(updates.tags)
      
      for (const [fieldName, fieldValue] of Object.entries(dynamicUpdates)) {
        await heraApi.updateDynamicData(customerId, fieldName, fieldValue)
      }
      
      console.log('✅ Customer updated successfully')
      
      // Reload customers
      await loadCustomers()
    } catch (error) {
      console.error('Failed to update jewelry customer:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  // Filter and sort customers
  const filteredCustomers = customers
    .filter(customer => {
      const matchesSearch = searchTerm === '' || 
        customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customerCode.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesVipLevel = selectedVipLevel === 'all' || customer.vipLevel === selectedVipLevel
      
      return matchesSearch && matchesVipLevel
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
        case 'spent': return b.totalSpent - a.totalSpent
        case 'recent': return new Date(b.lastPurchaseDate || 0).getTime() - new Date(a.lastPurchaseDate || 0).getTime()
        case 'vip': return Object.keys(vipLevels).indexOf(b.vipLevel) - Object.keys(vipLevels).indexOf(a.vipLevel)
        default: return 0
      }
    })

  // Calculate customer metrics
  const totalCustomers = customers.length
  const vipCustomers = customers.filter(c => c.vipLevel !== 'Standard').length
  const totalLifetimeValue = customers.reduce((sum, c) => sum + c.totalSpent, 0)
  const avgLifetimeValue = totalCustomers > 0 ? totalLifetimeValue / totalCustomers : 0

  // Public access - no authentication required
  const publicUser = user || {
    id: 'public-user',
    name: 'Guest User',
    email: 'guest@jewelry.com',
    organization_id: 'public-org',
    organization_name: 'Public Demo'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => window.location.href = '/jewelry'} className="text-gray-600 hover:text-gray-900">
                ← Back
              </button>
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-purple-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">VIP Customer Management</h1>
                  <p className="text-xs text-gray-500">Jewelry CRM with purchase history</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Quick Navigation */}
              <JewelryTeamsSidebar />
              
              {/* API Status Indicator */}
              <div className="flex items-center gap-2 px-3 py-1 bg-white/80 rounded-full text-xs">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-gray-700">HERA Universal API</span>
              </div>
              
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                size="sm"
                disabled={isSaving}
                onClick={() => setShowAddCustomer(true)}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Add Customer
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <p className="text-gray-600">Loading jewelry customers...</p>
              <p className="text-sm text-gray-500 mt-2">Connecting to HERA Universal API</p>
            </div>
          </div>
        ) : (
          <>
        {/* Customer Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">VIP Customers</p>
                <p className="text-2xl font-bold text-gray-900">{vipCustomers}</p>
              </div>
              <Crown className="w-8 h-8 text-amber-500" />
            </div>
          </Card>

          <Card className="p-4 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total LTV</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalLifetimeValue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg LTV</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${avgLifetimeValue.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-4 mb-6 bg-white/90 backdrop-blur">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or customer code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-3">
              <select
                value={selectedVipLevel}
                onChange={(e) => setSelectedVipLevel(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-white text-sm"
              >
                <option value="all">All VIP Levels</option>
                <option value="Diamond">Diamond</option>
                <option value="Platinum">Platinum</option>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Standard">Standard</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-white text-sm"
              >
                <option value="name">Sort by Name</option>
                <option value="spent">Sort by Total Spent</option>
                <option value="recent">Sort by Recent Activity</option>
                <option value="vip">Sort by VIP Level</option>
              </select>

              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-r-none"
                >
                  List
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-l-none"
                >
                  Grid
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Customer Table/Grid */}
        {viewMode === 'list' ? (
          <Card className="overflow-hidden bg-white/90 backdrop-blur">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      VIP Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchase History
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preferences
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => {
                    const VipIcon = vipLevels[customer.vipLevel].icon
                    return (
                      <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium">
                              {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {customer.firstName} {customer.lastName}
                              </p>
                              <p className="text-sm text-gray-600">{customer.customerCode}</p>
                              <div className="flex gap-1 mt-1">
                                {customer.tags.slice(0, 2).map(tag => (
                                  <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <VipIcon className={`w-5 h-5 text-${vipLevels[customer.vipLevel].color}-500`} />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{customer.vipLevel}</p>
                              <p className="text-xs text-gray-600">{customer.loyaltyPoints} points</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-3 h-3" />
                              <span>{customer.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-3 h-3" />
                              <span>{customer.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              ${customer.totalSpent.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-600">
                              {customer.totalOrders} orders • Avg ${customer.averageOrderValue.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              Last: {customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toLocaleDateString() : 'Never'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-xs text-gray-600">
                            <p>Metals: {customer.preferences.metalTypes?.slice(0, 2).join(', ')}</p>
                            <p>Stones: {customer.preferences.stoneTypes?.slice(0, 2).join(', ')}</p>
                            <p>Budget: {customer.preferences.budgetRange}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCustomer(customer)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => {
              const VipIcon = vipLevels[customer.vipLevel].icon
              return (
                <Card key={customer.id} className="p-6 hover:shadow-lg transition-shadow bg-white/90 backdrop-blur">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium">
                        {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {customer.firstName} {customer.lastName}
                        </h3>
                        <p className="text-xs text-gray-500">{customer.customerCode}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <VipIcon className={`w-5 h-5 text-${vipLevels[customer.vipLevel].color}-500`} />
                      <span className="text-sm font-medium">{customer.vipLevel}</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{customer.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{customer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span>${customer.totalSpent.toLocaleString()} lifetime value</span>
                    </div>
                  </div>

                  <div className="flex gap-1 mb-4 flex-wrap">
                    {customer.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Customer Detail Modal */}
        {selectedCustomer && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <Card className="max-w-6xl w-full max-h-[90vh] overflow-y-auto bg-white">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium text-xl">
                      {selectedCustomer.firstName.charAt(0)}{selectedCustomer.lastName.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedCustomer.firstName} {selectedCustomer.lastName}
                      </h2>
                      <p className="text-gray-600">{selectedCustomer.customerCode} • {selectedCustomer.vipLevel} Member</p>
                      <div className="flex gap-2 mt-2">
                        {selectedCustomer.tags.map(tag => (
                          <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCustomer(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left Column - Contact & Personal Info */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <User className="w-5 h-5 text-purple-600" />
                        Contact Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{selectedCustomer.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{selectedCustomer.phone}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {selectedCustomer.dateOfBirth ? new Date(selectedCustomer.dateOfBirth).toLocaleDateString() : 'Not provided'}
                          </span>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div className="text-sm">
                            <p>{selectedCustomer.address.street}</p>
                            <p>{selectedCustomer.address.city}, {selectedCustomer.address.state} {selectedCustomer.address.zipCode}</p>
                            <p>{selectedCustomer.address.country}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-purple-600" />
                        Jewelry Preferences
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-gray-500">Preferred Metals:</span>
                          <div className="flex gap-1 mt-1">
                            {selectedCustomer.preferences.metalTypes?.map(metal => (
                              <span key={metal} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {metal}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Preferred Stones:</span>
                          <div className="flex gap-1 mt-1">
                            {selectedCustomer.preferences.stoneTypes?.map(stone => (
                              <span key={stone} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {stone}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Categories:</span>
                          <div className="flex gap-1 mt-1">
                            {selectedCustomer.preferences.categories?.map(category => (
                              <span key={category} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                {category}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Budget Range:</span>
                          <span className="ml-2 font-medium">{selectedCustomer.preferences.budgetRange}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Special Dates</h3>
                      <div className="space-y-2">
                        {selectedCustomer.specialDates.map((date, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">{date.type}:</span>
                            <span className="font-medium">{new Date(date.date).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Purchase History & Analytics */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-purple-600" />
                        Purchase Analytics
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900">${selectedCustomer.totalSpent.toLocaleString()}</p>
                          <p className="text-xs text-gray-600">Lifetime Value</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900">{selectedCustomer.totalOrders}</p>
                          <p className="text-xs text-gray-600">Total Orders</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900">${selectedCustomer.averageOrderValue.toLocaleString()}</p>
                          <p className="text-xs text-gray-600">Average Order</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900">{selectedCustomer.loyaltyPoints}</p>
                          <p className="text-xs text-gray-600">Loyalty Points</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Award className="w-5 h-5 text-purple-600" />
                        VIP Status & Benefits
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Current Level:</span>
                          <span className="font-medium">{selectedCustomer.vipLevel}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>{vipLevels[selectedCustomer.vipLevel].benefits}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Member Since:</span>
                          <span className="font-medium">
                            {new Date(selectedCustomer.customerSince).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Sales Rep:</span>
                          <span className="font-medium">{selectedCustomer.assignedSalesRep}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Customer Notes</h3>
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {selectedCustomer.notes || 'No notes available'}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Communication Preferences</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span className={selectedCustomer.communicationPreferences.email ? 'text-green-600' : 'text-gray-400'}>
                            Email {selectedCustomer.communicationPreferences.email ? '✓' : '✗'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span className={selectedCustomer.communicationPreferences.phone ? 'text-green-600' : 'text-gray-400'}>
                            Phone {selectedCustomer.communicationPreferences.phone ? '✓' : '✗'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t flex justify-end gap-3">
                  <Button variant="outline">
                    <History className="w-4 h-4 mr-2" />
                    Purchase History
                  </Button>
                  <Button variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Customer
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    onClick={() => {
                      // Test update functionality
                      updateJewelryCustomer(selectedCustomer.id, {
                        notes: selectedCustomer.notes + ' - Updated via CRM',
                        tags: [...selectedCustomer.tags, 'updated']
                      })
                    }}
                  >
                    <Tag className="w-4 h-4 mr-2" />
                    Update Customer
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Add Customer Modal */}
        {showAddCustomer && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Add New Customer</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddCustomer(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="text-center py-8">
                  <Crown className="w-16 h-16 mx-auto mb-4 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Customer Creation</h3>
                  <p className="text-gray-600 mb-6">Click the button below to test HERA Universal API customer creation</p>
                  
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    disabled={isSaving}
                    onClick={() => {
                      // Test customer creation
                      createJewelryCustomer({
                        customerCode: `TEST-${Date.now()}`,
                        firstName: 'Test',
                        lastName: 'Customer',
                        email: 'test@customer.com',
                        phone: '+1 (555) 000-0000',
                        vipLevel: 'Silver',
                        totalSpent: 1500,
                        totalOrders: 2,
                        averageOrderValue: 750,
                        preferences: {
                          metalTypes: ['14K Gold'],
                          stoneTypes: ['Diamond'],
                          categories: ['Rings'],
                          budgetRange: '$1,000-$5,000',
                          occasions: ['Special Events']
                        },
                        tags: ['test-customer', 'api-generated'],
                        notes: 'Test customer created via HERA Universal API',
                        referralSource: 'API Test',
                        loyaltyPoints: 150,
                        status: 'Active'
                      }).then(() => {
                        setShowAddCustomer(false)
                      })
                    }}
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                    Create Test Customer
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
          </>
        )}
      </main>

      {/* Floating Inventory Access */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          onClick={() => window.location.href = '/jewelry-progressive/inventory'}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xl hover:from-purple-700 hover:to-pink-700 hover:scale-110 transition-all duration-300"
          title="Quick Access to Inventory"
        >
          <Package className="w-6 h-6" />
        </Button>
      </div>
    </div>
  )
}

function JewelryCustomersPage() {
  const { isRegistered, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center animate-pulse">
            <Users className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading jewelry CRM...</p>
        </div>
      </div>
    )
  }

  // Public access - jewelry-progressive is publicly accessible

  return <JewelryCustomers />
}

export default function JewelryCustomerManagement() {
  return <JewelryCustomersPage />
}