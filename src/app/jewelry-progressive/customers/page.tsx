'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/MultiOrgAuthProvider'
import { JewelryTeamsSidebar } from '@/components/jewelry-progressive/JewelryTeamsSidebar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
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
  User,
  CreditCard,
  Loader2,
  ArrowUpDown,
  UserPlus,
  History,
  Tag,
  X,
  ArrowLeft,
  Sparkles
} from 'lucide-react'

// Progressive Jewelry Customer Management - HERA Universal Architecture
// Smart Code: HERA.JWLY.CRM.PROGRESSIVE.v1

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

// Enhanced demo customer data for progressive experience
const progressiveCustomers: JewelryCustomer[] = [
  {
    id: 'PROG-001',
    customerCode: 'VIP-PROG-001',
    firstName: 'Isabella',
    lastName: 'Chen',
    email: 'isabella.chen@progressive.com',
    phone: '+1 (555) 987-6543',
    dateOfBirth: '1988-05-12',
    address: {
      street: '456 Diamond District',
      city: 'New York',
      state: 'NY',
      zipCode: '10036',
      country: 'USA'
    },
    preferences: {
      metalTypes: ['Platinum', '18K White Gold'],
      stoneTypes: ['Diamond', 'Emerald'],
      categories: ['Engagement Rings', 'Luxury Necklaces'],
      budgetRange: '$15,000+',
      occasions: ['Engagement', 'Anniversary', 'Investment']
    },
    vipLevel: 'Diamond',
    totalSpent: 78500,
    totalOrders: 18,
    averageOrderValue: 4361,
    lastPurchaseDate: '2024-12-20',
    customerSince: '2018-03-15',
    favoriteProducts: ['ENG-PLAT-001', 'NECK-DIA-003'],
    specialDates: [
      { type: 'Birthday', date: '1988-05-12' },
      { type: 'Engagement', date: '2023-09-14', notes: 'Anniversary coming up' }
    ],
    notes: 'Ultra-premium customer. Investment-grade jewelry collector. Prefers exclusive pieces.',
    tags: ['diamond-vip', 'collector', 'referral-champion', 'investment-grade'],
    communicationPreferences: {
      email: true,
      sms: true,
      phone: true,
      mail: true
    },
    loyaltyPoints: 7850,
    referralSource: 'Personal Referral',
    assignedSalesRep: 'Alexandra Sterling',
    status: 'active',
    createdAt: '2018-03-15',
    updatedAt: '2024-12-20'
  },
  {
    id: 'PROG-002',
    customerCode: 'GOLD-PROG-002',
    firstName: 'Marcus',
    lastName: 'Thompson',
    email: 'marcus.thompson@progressive.com',
    phone: '+1 (555) 876-5432',
    dateOfBirth: '1982-11-28',
    address: {
      street: '789 Luxury Avenue',
      city: 'Beverly Hills',
      state: 'CA',
      zipCode: '90210',
      country: 'USA'
    },
    preferences: {
      metalTypes: ['18K Yellow Gold', '14K Rose Gold'],
      stoneTypes: ['Ruby', 'Sapphire'],
      categories: ['Luxury Watches', 'Cufflinks', 'Rings'],
      budgetRange: '$5,000-$15,000',
      occasions: ['Business', 'Special Events', 'Gifts']
    },
    vipLevel: 'Gold',
    totalSpent: 32400,
    totalOrders: 11,
    averageOrderValue: 2945,
    lastPurchaseDate: '2024-11-15',
    customerSince: '2020-07-22',
    favoriteProducts: ['WATCH-GOLD-005', 'CUFF-RUBY-002'],
    specialDates: [
      { type: 'Birthday', date: '1982-11-28' },
      { type: 'Anniversary', date: '2008-06-19' }
    ],
    notes: 'Executive client. Appreciates craftsmanship and business-appropriate pieces.',
    tags: ['executive', 'watch-collector', 'gold-preference'],
    communicationPreferences: {
      email: true,
      sms: false,
      phone: true,
      mail: false
    },
    loyaltyPoints: 3240,
    referralSource: 'LinkedIn Network',
    assignedSalesRep: 'James Mitchell',
    status: 'active',
    createdAt: '2020-07-22',
    updatedAt: '2024-11-15'
  },
  {
    id: 'PROG-003',
    customerCode: 'SILV-PROG-003',
    firstName: 'Emma',
    lastName: 'Rodriguez',
    email: 'emma.rodriguez@progressive.com',
    phone: '+1 (555) 765-4321',
    dateOfBirth: '1995-03-08',
    address: {
      street: '321 Fashion Street',
      city: 'Miami',
      state: 'FL',
      zipCode: '33139',
      country: 'USA'
    },
    preferences: {
      metalTypes: ['Sterling Silver', '14K White Gold'],
      stoneTypes: ['Pearl', 'Aquamarine'],
      categories: ['Earrings', 'Bracelets', 'Rings'],
      budgetRange: '$1,000-$5,000',
      occasions: ['Daily Wear', 'Date Night', 'Travel']
    },
    vipLevel: 'Silver',
    totalSpent: 8750,
    totalOrders: 12,
    averageOrderValue: 729,
    lastPurchaseDate: '2024-10-28',
    customerSince: '2021-09-12',
    favoriteProducts: ['EAR-PEARL-004', 'BRAC-SILV-006'],
    specialDates: [
      { type: 'Birthday', date: '1995-03-08' }
    ],
    notes: 'Young professional. Loves contemporary and travel-friendly pieces.',
    tags: ['millennial', 'contemporary', 'travel-friendly'],
    communicationPreferences: {
      email: true,
      sms: true,
      phone: false,
      mail: false
    },
    loyaltyPoints: 875,
    referralSource: 'Instagram Ads',
    assignedSalesRep: 'Sofia Martinez',
    status: 'active',
    createdAt: '2021-09-12',
    updatedAt: '2024-10-28'
  }
]

// VIP Level configuration  
const vipLevels = {
  'Standard': { threshold: 0, color: 'gray', icon: User, benefits: 'Standard service' },
  'Silver': { threshold: 2500, color: 'slate', icon: Award, benefits: '5% discount, priority service' },
  'Gold': { threshold: 10000, color: 'amber', icon: Star, benefits: '10% discount, exclusive events' },
  'Platinum': { threshold: 25000, color: 'purple', icon: Crown, benefits: '15% discount, personal shopper' },
  'Diamond': { threshold: 50000, color: 'blue', icon: Sparkles, benefits: '20% discount, concierge service' }
}

export default function ProgressiveCustomersPage() {
  const { workspace, isAnonymous } = useAuth()
  const router = useRouter()
  
  // Helper function for safe string access
  const safeString = (str: any, fallback: string = '?'): string => {
    if (str === null || str === undefined || str === '') {
      return fallback
    }
    return String(str)
  }
  
  // Helper function for safe number access
  const safeNumber = (num: any, fallback: number = 0): number => {
    if (num === null || num === undefined || isNaN(num)) {
      return fallback
    }
    return Number(num)
  }
  const [customers, setCustomers] = useState<JewelryCustomer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVipLevel, setSelectedVipLevel] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [selectedCustomer, setSelectedCustomer] = useState<JewelryCustomer | null>(null)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  // Load customers from localStorage for progressive workspace
  useEffect(() => {
    loadProgressiveCustomers()
  }, [workspace])

  const loadProgressiveCustomers = async () => {
    try {
      setIsLoading(true)
      
      if (workspace) {
        const storedData = localStorage.getItem(`hera_data_${workspace.organization_id}`)
        if (storedData) {
          try {
            const data = JSON.parse(storedData)
            const savedCustomers = data.customers || []
            
            if (savedCustomers.length > 0) {
              setCustomers(savedCustomers)
              console.log('💎 Loaded saved customers:', savedCustomers.length)
            } else {
              // Use demo customers and save them
              setCustomers(progressiveCustomers)
              data.customers = progressiveCustomers
              localStorage.setItem(`hera_data_${workspace.organization_id}`, JSON.stringify(data))
              console.log('💎 Initialized with demo customers:', progressiveCustomers.length)
            }
          } catch (e) {
            console.error('Failed to parse saved data:', e)
            setCustomers(progressiveCustomers)
          }
        } else {
          // Initialize with demo customers
          setCustomers(progressiveCustomers)
          const initData = { customers: progressiveCustomers }
          localStorage.setItem(`hera_data_${workspace.organization_id}`, JSON.stringify(initData))
          console.log('💎 Created initial customer data')
        }
      }
    } catch (error) {
      console.error('Failed to load customers:', error)
      setCustomers(progressiveCustomers)
    } finally {
      setIsLoading(false)
    }
  }

  // Create new customer in progressive workspace
  const createProgressiveCustomer = async (customerData: Partial<JewelryCustomer>) => {
    try {
      setIsSaving(true)
      
      const newCustomer: JewelryCustomer = {
        id: `PROG-${Date.now()}`,
        customerCode: customerData.customerCode || `PROG-${Date.now()}`,
        firstName: customerData.firstName || '',
        lastName: customerData.lastName || '',
        email: customerData.email || '',
        phone: customerData.phone || '',
        dateOfBirth: customerData.dateOfBirth,
        address: customerData.address || { street: '', city: '', state: '', zipCode: '', country: 'USA' },
        preferences: customerData.preferences || {
          metalTypes: [], stoneTypes: [], categories: [], budgetRange: '$1,000-$5,000', occasions: []
        },
        vipLevel: customerData.vipLevel || 'Standard',
        totalSpent: customerData.totalSpent || 0,
        totalOrders: customerData.totalOrders || 0,
        averageOrderValue: customerData.averageOrderValue || 0,
        lastPurchaseDate: customerData.lastPurchaseDate,
        customerSince: new Date().toISOString(),
        favoriteProducts: customerData.favoriteProducts || [],
        specialDates: customerData.specialDates || [],
        notes: customerData.notes || '',
        tags: customerData.tags || [],
        communicationPreferences: customerData.communicationPreferences || {
          email: true, sms: false, phone: false, mail: false
        },
        loyaltyPoints: customerData.loyaltyPoints || 0,
        referralSource: customerData.referralSource || 'Progressive Workspace',
        assignedSalesRep: customerData.assignedSalesRep,
        status: customerData.status || 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      // Save to workspace
      if (workspace) {
        const storedData = localStorage.getItem(`hera_data_${workspace.organization_id}`) || '{}'
        const data = JSON.parse(storedData)
        data.customers = data.customers || []
        data.customers.push(newCustomer)
        localStorage.setItem(`hera_data_${workspace.organization_id}`, JSON.stringify(data))
      }
      
      console.log('💎 Customer created:', newCustomer.firstName, newCustomer.lastName)
      
      // Reload customers
      await loadProgressiveCustomers()
      
      return newCustomer
    } catch (error) {
      console.error('Failed to create customer:', error)
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
  const vipCustomers = customers.filter(c => c && c.vipLevel && c.vipLevel !== 'Standard').length
  const totalLifetimeValue = customers.reduce((sum, c) => sum + safeNumber(c?.totalSpent), 0)
  const avgLifetimeValue = totalCustomers > 0 ? totalLifetimeValue / totalCustomers : 0

  // Show loading state
  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center animate-pulse">
            <Users className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Setting up customer management...</p>
          <p className="text-sm text-gray-500 mt-2">Progressive workspace initializing</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      {/* Teams-Style Sidebar */}
      <JewelryTeamsSidebar />
      
      
      <div className="ml-16">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/jewelry-progressive')}
                  className="p-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">VIP Customer Management</h1>
                    <p className="text-sm text-gray-500">
                      {isAnonymous ? 'Progressive workspace - try it free' : 'Premium customer experience'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-600">{workspace.organization_name}</p>
                <p className="text-xs text-gray-400">
                  {workspace.type === 'anonymous' ? 'Anonymous Session' : 'Registered User'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-64">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
                <p className="text-gray-600">Loading jewelry customers...</p>
                <p className="text-sm text-gray-500 mt-2">Progressive workspace ready</p>
              </div>
            </div>
          ) : (
            <>
              {/* Customer Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4 bg-white/90 backdrop-blur border-0 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Customers</p>
                      <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </Card>

                <Card className="p-4 bg-white/90 backdrop-blur border-0 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">VIP Customers</p>
                      <p className="text-2xl font-bold text-gray-900">{vipCustomers}</p>
                    </div>
                    <Crown className="w-8 h-8 text-amber-500" />
                  </div>
                </Card>

                <Card className="p-4 bg-white/90 backdrop-blur border-0 shadow-md">
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

                <Card className="p-4 bg-white/90 backdrop-blur border-0 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avg LTV</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${Math.round(avgLifetimeValue).toLocaleString()}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-500" />
                  </div>
                </Card>
              </div>

              {/* Search and Filters */}
              <Card className="p-4 mb-6 bg-white/90 backdrop-blur border-0 shadow-md">
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
              </Card>

              {/* Customer List */}
              <Card className="overflow-hidden bg-white/90 backdrop-blur border-0 shadow-md">
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
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredCustomers.filter(customer => customer && customer.id).map((customer) => {
                        console.log('Rendering customer:', customer)
                        const vipLevel = vipLevels[customer.vipLevel] || vipLevels['Standard']
                        const VipIcon = vipLevel.icon
                        return (
                          <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium">
                                  {safeString(customer.firstName).charAt(0)}{safeString(customer.lastName).charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {customer.firstName || 'Unknown'} {customer.lastName || 'Customer'}
                                  </p>
                                  <p className="text-sm text-gray-600">{customer.customerCode}</p>
                                  <div className="flex gap-1 mt-1">
                                    {(customer.tags || []).slice(0, 2).map(tag => (
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
                                <VipIcon className={`w-5 h-5 text-${vipLevel.color}-500`} />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{customer.vipLevel}</p>
                                  <p className="text-xs text-gray-600">{safeNumber(customer.loyaltyPoints)} points</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Mail className="w-3 h-3" />
                                  <span>{customer.email || 'No email'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Phone className="w-3 h-3" />
                                  <span>{customer.phone || 'No phone'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  ${safeNumber(customer.totalSpent).toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {safeNumber(customer.totalOrders)} orders • Avg ${safeNumber(customer.averageOrderValue).toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Last: {customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toLocaleDateString() : 'Never'}
                                </p>
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
            </>
          )}
        </main>

        {/* Customer Detail Modal */}
        {selectedCustomer && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <Card className="max-w-6xl w-full max-h-[90vh] overflow-y-auto bg-white">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium text-xl">
                      {safeString(selectedCustomer.firstName).charAt(0)}{safeString(selectedCustomer.lastName).charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedCustomer.firstName || 'Unknown'} {selectedCustomer.lastName || 'Customer'}
                      </h2>
                      <p className="text-gray-600">{selectedCustomer.customerCode} • {selectedCustomer.vipLevel} Member</p>
                      <div className="flex gap-2 mt-2">
                        {(selectedCustomer.tags || []).map(tag => (
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
                          <span className="text-sm">{selectedCustomer.email || 'No email provided'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{selectedCustomer.phone || 'No phone provided'}</span>
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
                            <p>{selectedCustomer.address?.street || 'No street address'}</p>
                            <p>{selectedCustomer.address?.city || 'No city'}, {selectedCustomer.address?.state || 'No state'} {selectedCustomer.address?.zipCode || 'No zip'}</p>
                            <p>{selectedCustomer.address?.country || 'No country'}</p>
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
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {selectedCustomer.preferences.metalTypes?.map(metal => (
                              <span key={metal} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {metal}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Preferred Stones:</span>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {selectedCustomer.preferences.stoneTypes?.map(stone => (
                              <span key={stone} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {stone}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Categories:</span>
                          <div className="flex gap-1 mt-1 flex-wrap">
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
                          <p className="text-2xl font-bold text-gray-900">${safeNumber(selectedCustomer.totalSpent).toLocaleString()}</p>
                          <p className="text-xs text-gray-600">Lifetime Value</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900">{safeNumber(selectedCustomer.totalOrders)}</p>
                          <p className="text-xs text-gray-600">Total Orders</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900">${safeNumber(selectedCustomer.averageOrderValue).toLocaleString()}</p>
                          <p className="text-xs text-gray-600">Average Order</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900">{safeNumber(selectedCustomer.loyaltyPoints)}</p>
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
                          <p>{vipLevels[selectedCustomer.vipLevel || 'Standard']?.benefits || 'Standard benefits'}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Member Since:</span>
                          <span className="font-medium">
                            {new Date(selectedCustomer.customerSince).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Sales Rep:</span>
                          <span className="font-medium">{selectedCustomer.assignedSalesRep || 'Unassigned'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Customer Notes</h3>
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {selectedCustomer.notes || 'No notes available'}
                      </div>
                    </div>
                  </div>
                </div>

                {isAnonymous && (
                  <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-800">
                      ✨ This customer profile is saved in your progressive workspace! 
                      Save your work with an email to keep all your customer data.
                    </p>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t flex justify-end gap-3">
                  <Button variant="outline">
                    <History className="w-4 h-4 mr-2" />
                    Purchase History
                  </Button>
                  <Button variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Customer
                  </Button>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Create Sale
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Progressive Customer Creation</h3>
                  <p className="text-gray-600 mb-6">Add a new customer to your progressive workspace</p>
                  
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    disabled={isSaving}
                    onClick={() => {
                      // Create test customer in progressive workspace
                      createProgressiveCustomer({
                        customerCode: `PROG-${Date.now()}`,
                        firstName: 'Victoria',
                        lastName: 'Williams',
                        email: 'victoria.williams@progressive.com',
                        phone: '+1 (555) 654-3210',
                        vipLevel: 'Gold',
                        totalSpent: 12500,
                        totalOrders: 5,
                        averageOrderValue: 2500,
                        preferences: {
                          metalTypes: ['18K Rose Gold'],
                          stoneTypes: ['Diamond', 'Rose Quartz'],
                          categories: ['Rings', 'Necklaces'],
                          budgetRange: '$2,000-$10,000',
                          occasions: ['Anniversary', 'Birthday']
                        },
                        tags: ['progressive-customer', 'gold-tier'],
                        notes: 'Customer created in progressive workspace',
                        referralSource: 'Progressive Demo',
                        loyaltyPoints: 1250,
                        status: 'active'
                      }).then(() => {
                        setShowAddCustomer(false)
                      })
                    }}
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                    Create Demo Customer
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}