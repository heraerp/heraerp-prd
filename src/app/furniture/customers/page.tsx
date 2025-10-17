'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Users,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  TrendingUp,
  TrendingDown,
  Calendar,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  MessageSquare,
  Package,
  CreditCard,
  Award,
  Clock,
  Target,
  Zap,
  CheckCircle,
  AlertCircle,
  DollarSign,
  FileText,
  Truck,
  Heart,
  Settings,
  BarChart3
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  type: 'hotel' | 'resort' | 'restaurant' | 'export_client' | 'residential' | 'corporate'
  category: 'premium' | 'standard' | 'bulk_order' | 'repeat_customer'
  location: string
  state: string
  country: string
  contactPerson: string
  phone: string
  email: string
  website?: string
  establishedYear?: number
  totalOrders: number
  totalValue: number
  averageOrderValue: number
  lastOrderDate: string
  nextFollowUp?: string
  creditLimit: number
  creditUsed: number
  paymentTerms: string
  rating: number
  preferredWoodTypes: string[]
  specialRequirements: string[]
  notes: string[]
  isActive: boolean
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum'
  referralSource: string
}

interface CustomerInteraction {
  id: string
  customerId: string
  type: 'call' | 'meeting' | 'email' | 'site_visit' | 'quotation' | 'order'
  title: string
  description: string
  date: string
  performedBy: string
  outcome: string
  nextAction?: string
  priority: 'low' | 'medium' | 'high'
}

interface HospitalityInsight {
  category: string
  trend: 'growing' | 'stable' | 'declining'
  description: string
  opportunities: string[]
  challenges: string[]
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [interactions, setInteractions] = useState<CustomerInteraction[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Kerala furniture customer base sample data
  const sampleCustomers: Customer[] = [
    {
      id: '1',
      name: 'ITC Grand Chola',
      type: 'hotel',
      category: 'premium',
      location: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      contactPerson: 'Rajesh Kumar',
      phone: '+91 44 4224 4444',
      email: 'procurement@itchotels.in',
      website: 'www.itchotels.in',
      establishedYear: 1975,
      totalOrders: 45,
      totalValue: 2850000,
      averageOrderValue: 63333,
      lastOrderDate: '2024-01-15',
      nextFollowUp: '2024-02-15',
      creditLimit: 500000,
      creditUsed: 125000,
      paymentTerms: '30 days',
      rating: 4.8,
      preferredWoodTypes: ['Premium Teak', 'Rosewood', 'Mahogany'],
      specialRequirements: ['Export quality finish', 'Custom branding', 'Quick turnaround'],
      notes: ['Prefers traditional Kerala designs', 'Bulk orders during renovation season', 'Long-standing relationship'],
      isActive: true,
      loyaltyTier: 'platinum',
      referralSource: 'Industry Network'
    },
    {
      id: '2',
      name: 'Taj Kumarakom Resort & Spa',
      type: 'resort',
      category: 'premium',
      location: 'Kumarakom',
      state: 'Kerala',
      country: 'India',
      contactPerson: 'Priya Nair',
      phone: '+91 4829 252 711',
      email: 'kumarakom.taj@tajhotels.com',
      website: 'www.tajhotels.com',
      establishedYear: 2001,
      totalOrders: 28,
      totalValue: 1950000,
      averageOrderValue: 69643,
      lastOrderDate: '2024-01-20',
      nextFollowUp: '2024-03-01',
      creditLimit: 400000,
      creditUsed: 85000,
      paymentTerms: '45 days',
      rating: 4.9,
      preferredWoodTypes: ['Teak', 'Jackfruit Wood', 'Bamboo'],
      specialRequirements: ['Weather resistant', 'Local Kerala aesthetics', 'Eco-friendly'],
      notes: ['Focuses on sustainability', 'Prefers local artisan touch', 'Premium quality only'],
      isActive: true,
      loyaltyTier: 'platinum',
      referralSource: 'Taj Group Network'
    },
    {
      id: '3',
      name: 'Dubai Furniture Trading LLC',
      type: 'export_client',
      category: 'bulk_order',
      location: 'Dubai',
      state: 'Dubai',
      country: 'UAE',
      contactPerson: 'Ahmed Al Mansouri',
      phone: '+971 4 123 4567',
      email: 'ahmed@dubaifurniture.ae',
      website: 'www.dubaifurniture.ae',
      establishedYear: 2010,
      totalOrders: 35,
      totalValue: 4200000,
      averageOrderValue: 120000,
      lastOrderDate: '2024-01-10',
      nextFollowUp: '2024-02-20',
      creditLimit: 800000,
      creditUsed: 200000,
      paymentTerms: 'LC at sight',
      rating: 4.6,
      preferredWoodTypes: ['Export Grade Teak', 'Rosewood', 'Mahogany'],
      specialRequirements: ['Export documentation', 'Container loading', 'Quality certificates'],
      notes: ['High volume orders', 'Strict quality standards', 'Growing Middle East market'],
      isActive: true,
      loyaltyTier: 'gold',
      referralSource: 'Export Council'
    },
    {
      id: '4',
      name: 'Leela Palace Bangalore',
      type: 'hotel',
      category: 'premium',
      location: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      contactPerson: 'Sunil Mehta',
      phone: '+91 80 2521 1234',
      email: 'bangalore@theleela.com',
      website: 'www.theleela.com',
      establishedYear: 2001,
      totalOrders: 22,
      totalValue: 1680000,
      averageOrderValue: 76364,
      lastOrderDate: '2023-12-28',
      nextFollowUp: '2024-02-10',
      creditLimit: 350000,
      creditUsed: 45000,
      paymentTerms: '30 days',
      rating: 4.7,
      preferredWoodTypes: ['Teak', 'Mahogany', 'Walnut'],
      specialRequirements: ['Luxury finish', 'Brand compliance', 'Timely delivery'],
      notes: ['Focus on luxury segment', 'Repeat customer', 'Seasonal orders'],
      isActive: true,
      loyaltyTier: 'gold',
      referralSource: 'Leela Group'
    },
    {
      id: '5',
      name: 'Singapore Hotels Pte Ltd',
      type: 'export_client',
      category: 'repeat_customer',
      location: 'Singapore',
      state: 'Singapore',
      country: 'Singapore',
      contactPerson: 'Lim Wei Ming',
      phone: '+65 6123 4567',
      email: 'procurement@sghotels.com.sg',
      website: 'www.singaporehotels.com',
      establishedYear: 2008,
      totalOrders: 18,
      totalValue: 2100000,
      averageOrderValue: 116667,
      lastOrderDate: '2023-12-15',
      nextFollowUp: '2024-03-15',
      creditLimit: 600000,
      creditUsed: 150000,
      paymentTerms: 'LC 60 days',
      rating: 4.5,
      preferredWoodTypes: ['Premium Teak', 'Mahogany'],
      specialRequirements: ['Tropical climate resistance', 'Modern designs', 'Quick shipping'],
      notes: ['Growing Southeast Asian market', 'Quality focus', 'Long-term partnership potential'],
      isActive: true,
      loyaltyTier: 'silver',
      referralSource: 'Trade Fair'
    }
  ]

  const sampleInteractions: CustomerInteraction[] = [
    {
      id: '1',
      customerId: '1',
      type: 'meeting',
      title: 'Q2 Requirements Discussion',
      description: 'Discussed upcoming renovation project for 200 rooms',
      date: '2024-01-25',
      performedBy: 'Sales Manager',
      outcome: 'Positive - quotation requested',
      nextAction: 'Send detailed quotation by Feb 5',
      priority: 'high'
    },
    {
      id: '2',
      customerId: '2',
      type: 'site_visit',
      title: 'Resort Site Inspection',
      description: 'Visited resort to understand new villa requirements',
      date: '2024-01-22',
      performedBy: 'Design Team',
      outcome: 'Custom design needed for 25 villas',
      nextAction: 'Prepare custom design proposal',
      priority: 'medium'
    },
    {
      id: '3',
      customerId: '3',
      type: 'order',
      title: 'Container Load Order',
      description: 'Placed order for 40ft container of mixed furniture',
      date: '2024-01-20',
      performedBy: 'Export Team',
      outcome: 'Order confirmed - production started',
      nextAction: 'Monitor production timeline',
      priority: 'high'
    }
  ]

  const hospitalityInsights: HospitalityInsight[] = [
    {
      category: 'Luxury Hotels',
      trend: 'growing',
      description: 'Premium hotel segment showing 25% growth in Kerala furniture demand',
      opportunities: ['Heritage tourism boom', 'Boutique hotel expansion', 'International chains entering Kerala'],
      challenges: ['Higher quality expectations', 'Faster delivery requirements', 'Price competition']
    },
    {
      category: 'Resort & Hospitality',
      trend: 'growing',
      description: 'Eco-resorts and heritage properties driving demand for authentic Kerala furniture',
      opportunities: ['Sustainable tourism growth', 'Unique design requirements', 'Year-round demand'],
      challenges: ['Weather resistance needs', 'Customization complexity', 'Maintenance requirements']
    },
    {
      category: 'Export Markets',
      trend: 'stable',
      description: 'Middle East and Southeast Asia remain strong markets for Kerala furniture',
      opportunities: ['New geographic markets', 'Premium positioning', 'Cultural authenticity appeal'],
      challenges: ['Logistics complexity', 'Quality certifications', 'Currency fluctuations']
    }
  ]

  useEffect(() => {
    setCustomers(sampleCustomers)
    setInteractions(sampleInteractions)
  }, [])

  const getCustomerTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'hotel': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      'resort': 'bg-green-500/10 text-green-600 border-green-500/20',
      'restaurant': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      'export_client': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      'residential': 'bg-gray-500/10 text-gray-300 border-gray-500/20',
      'corporate': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
    }
    return colors[type] || colors.hotel
  }

  const getLoyaltyTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      'bronze': 'bg-amber-600/10 text-amber-400',
      'silver': 'bg-gray-500/10 text-gray-300',
      'gold': 'bg-yellow-500/10 text-yellow-400',
      'platinum': 'bg-purple-500/10 text-purple-400'
    }
    return colors[tier] || colors.bronze
  }

  const getCreditUtilization = (customer: Customer) => {
    return Math.round((customer.creditUsed / customer.creditLimit) * 100)
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || customer.type === filterType
    return matchesSearch && matchesType
  })

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="jewelry-crown-glow p-3 rounded-xl">
                  <Users className="h-8 w-8 jewelry-text-gold" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold jewelry-text-luxury">Customer Management</h1>
                  <p className="text-lg text-gray-300">Kerala Furniture Business Customer Portal</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                  <Building2 className="h-3 w-3 mr-1" />
                  Hospitality Focus
                </Badge>
                <Button className="jewelry-glass-btn gap-2">
                  <Plus className="h-4 w-4" />
                  Add Customer
                </Button>
              </div>
            </div>
          </div>

          {/* Customer Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Total Customers</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{customers.length}</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">
                {customers.filter(c => c.isActive).length} Active • {customers.filter(c => !c.isActive).length} Inactive
              </p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Total Revenue</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">₹{(customers.reduce((sum, c) => sum + c.totalValue, 0) / 100000).toFixed(1)}L</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Across all customers</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Hotel Clients</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{customers.filter(c => c.type === 'hotel' || c.type === 'resort').length}</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Hospitality sector focus</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Export Clients</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{customers.filter(c => c.type === 'export_client').length}</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">International markets</p>
            </div>
          </div>

          <Tabs defaultValue="customers" className="space-y-4">
            <TabsList className="jewelry-glass-panel">
              <TabsTrigger value="customers" className="jewelry-glass-btn">Customer Directory</TabsTrigger>
              <TabsTrigger value="interactions" className="jewelry-glass-btn">Recent Interactions</TabsTrigger>
              <TabsTrigger value="insights" className="jewelry-glass-btn">Market Insights</TabsTrigger>
              <TabsTrigger value="analytics" className="jewelry-glass-btn">Analytics</TabsTrigger>
            </TabsList>

            {/* Customers Directory */}
            <TabsContent value="customers" className="space-y-6">
              {/* Search and Filters */}
              <div className="jewelry-glass-card p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-300" />
                    <Input
                      placeholder="Search customers, locations, contacts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 jewelry-glass-input"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="jewelry-glass-input min-w-[150px]"
                    >
                      <option value="all">All Types</option>
                      <option value="hotel">Hotels</option>
                      <option value="resort">Resorts</option>
                      <option value="export_client">Export Clients</option>
                      <option value="restaurant">Restaurants</option>
                      <option value="corporate">Corporate</option>
                    </select>
                    <Button variant="outline" className="jewelry-glass-btn">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Customer List */}
              <div className="space-y-4">
                {filteredCustomers.map((customer) => (
                  <div key={customer.id} className="jewelry-glass-card p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold jewelry-text-luxury">{customer.name}</h3>
                            <p className="text-sm text-gray-300">{customer.contactPerson} • {customer.location}, {customer.state}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getCustomerTypeColor(customer.type)}>
                              {customer.type.replace('_', ' ').charAt(0).toUpperCase() + customer.type.replace('_', ' ').slice(1)}
                            </Badge>
                            <Badge className={getLoyaltyTierColor(customer.loyaltyTier)}>
                              {customer.loyaltyTier.charAt(0).toUpperCase() + customer.loyaltyTier.slice(1)}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300 mb-4">
                          <div>
                            <span className="font-medium">Total Orders:</span> {customer.totalOrders}
                          </div>
                          <div>
                            <span className="font-medium">Total Value:</span> ₹{(customer.totalValue / 100000).toFixed(1)}L
                          </div>
                          <div>
                            <span className="font-medium">Avg Order:</span> ₹{(customer.averageOrderValue / 1000).toFixed(0)}K
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Rating:</span>
                            <span className="text-yellow-500">{customer.rating}</span>
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300 mb-4">
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{customer.phone}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{customer.email}</span>
                          </div>
                          <div>
                            <span className="font-medium">Last Order:</span> {customer.lastOrderDate}
                          </div>
                          <div>
                            <span className="font-medium">Payment Terms:</span> {customer.paymentTerms}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-300">Credit Utilization</span>
                              <span className="text-sm jewelry-text-luxury">{getCreditUtilization(customer)}%</span>
                            </div>
                            <Progress value={getCreditUtilization(customer)} className="h-2" />
                            <div className="flex justify-between text-xs text-gray-300 mt-1">
                              <span>Used: ₹{(customer.creditUsed / 1000).toFixed(0)}K</span>
                              <span>Limit: ₹{(customer.creditLimit / 1000).toFixed(0)}K</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-medium jewelry-text-luxury mb-1">Preferred Wood Types:</p>
                            <div className="flex flex-wrap gap-1">
                              {customer.preferredWoodTypes.map((wood, index) => (
                                <Badge key={index} variant="outline" className="text-xs jewelry-badge-text">
                                  {wood}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {customer.specialRequirements.length > 0 && (
                            <div>
                              <p className="text-sm font-medium jewelry-text-luxury mb-1">Special Requirements:</p>
                              <div className="flex flex-wrap gap-1">
                                {customer.specialRequirements.map((req, index) => (
                                  <Badge key={index} variant="outline" className="text-xs bg-amber-500/10 text-amber-600">
                                    {req}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button size="sm" className="jewelry-glass-btn gap-1" onClick={() => setSelectedCustomer(customer)}>
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1">
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1">
                          <MessageSquare className="h-3 w-3" />
                          Contact
                        </Button>
                        <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1">
                          <Package className="h-3 w-3" />
                          Orders
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Recent Interactions */}
            <TabsContent value="interactions" className="space-y-6">
              <div className="space-y-4">
                {interactions.map((interaction) => {
                  const customer = customers.find(c => c.id === interaction.customerId)
                  return (
                    <div key={interaction.id} className="jewelry-glass-card p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                            {interaction.type === 'meeting' && <Users className="h-5 w-5 text-white" />}
                            {interaction.type === 'call' && <Phone className="h-5 w-5 text-white" />}
                            {interaction.type === 'email' && <Mail className="h-5 w-5 text-white" />}
                            {interaction.type === 'site_visit' && <MapPin className="h-5 w-5 text-white" />}
                            {interaction.type === 'order' && <Package className="h-5 w-5 text-white" />}
                            {interaction.type === 'quotation' && <FileText className="h-5 w-5 text-white" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold jewelry-text-luxury">{interaction.title}</h3>
                              <Badge className={`${
                                interaction.priority === 'high' ? 'bg-red-500/10 text-red-600' :
                                interaction.priority === 'medium' ? 'bg-amber-500/10 text-amber-600' :
                                'bg-green-500/10 text-green-600'
                              }`}>
                                {interaction.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-300 mb-2">
                              <strong>{customer?.name}</strong> • {interaction.date} • {interaction.performedBy}
                            </p>
                            <p className="text-sm jewelry-text-luxury mb-2">{interaction.description}</p>
                            <div className="space-y-1">
                              <p className="text-sm"><span className="font-medium">Outcome:</span> {interaction.outcome}</p>
                              {interaction.nextAction && (
                                <p className="text-sm"><span className="font-medium">Next Action:</span> {interaction.nextAction}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="jewelry-glass-btn">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="jewelry-glass-btn">
                            <MessageSquare className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>

            {/* Market Insights */}
            <TabsContent value="insights" className="space-y-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold jewelry-text-luxury">Kerala Furniture Hospitality Market Insights</h3>
                
                {hospitalityInsights.map((insight, index) => (
                  <div key={index} className="jewelry-glass-card p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        insight.trend === 'growing' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                        insight.trend === 'stable' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                        'bg-gradient-to-r from-amber-500 to-orange-500'
                      }`}>
                        {insight.trend === 'growing' ? (
                          <TrendingUp className="h-5 w-5 text-white" />
                        ) : insight.trend === 'stable' ? (
                          <Target className="h-5 w-5 text-white" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold jewelry-text-luxury">{insight.category}</h4>
                        <p className="text-sm text-gray-300 capitalize">{insight.trend} trend</p>
                      </div>
                    </div>

                    <p className="text-sm jewelry-text-luxury mb-4">{insight.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium jewelry-text-luxury mb-2 text-green-600">Opportunities</h5>
                        <ul className="space-y-1">
                          {insight.opportunities.map((opportunity, idx) => (
                            <li key={idx} className="text-sm text-gray-300 flex items-start gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                              {opportunity}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium jewelry-text-luxury mb-2 text-amber-600">Challenges</h5>
                        <ul className="space-y-1">
                          {insight.challenges.map((challenge, idx) => (
                            <li key={idx} className="text-sm text-gray-300 flex items-start gap-1">
                              <AlertCircle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                              {challenge}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Distribution */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Customer Type Distribution</h3>
                  <div className="space-y-3">
                    {['hotel', 'resort', 'export_client', 'restaurant', 'corporate'].map(type => {
                      const count = customers.filter(c => c.type === type).length
                      const percentage = Math.round((count / customers.length) * 100)
                      return (
                        <div key={type} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="jewelry-text-luxury capitalize">{type.replace('_', ' ')}</span>
                            <span className="text-gray-300">{count} ({percentage}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Revenue by Customer Type */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Revenue by Customer Type</h3>
                  <div className="space-y-3">
                    {['hotel', 'resort', 'export_client', 'restaurant', 'corporate'].map(type => {
                      const revenue = customers.filter(c => c.type === type).reduce((sum, c) => sum + c.totalValue, 0)
                      const totalRevenue = customers.reduce((sum, c) => sum + c.totalValue, 0)
                      const percentage = Math.round((revenue / totalRevenue) * 100)
                      return (
                        <div key={type} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="jewelry-text-luxury capitalize">{type.replace('_', ' ')}</span>
                            <span className="text-gray-300">₹{(revenue / 100000).toFixed(1)}L ({percentage}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Top Customers */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Top Customers by Value</h3>
                  <div className="space-y-3">
                    {customers
                      .sort((a, b) => b.totalValue - a.totalValue)
                      .slice(0, 5)
                      .map((customer, index) => (
                        <div key={customer.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium jewelry-text-luxury">{customer.name}</p>
                              <p className="text-xs text-gray-300">{customer.location}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium jewelry-text-luxury">₹{(customer.totalValue / 100000).toFixed(1)}L</p>
                            <p className="text-xs text-gray-300">{customer.totalOrders} orders</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Customer Growth Metrics */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Growth Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                      <div>
                        <p className="text-sm font-medium jewelry-text-luxury">New Customers (Q1)</p>
                        <p className="text-xs text-gray-300">Jan - Mar 2024</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">+8</p>
                        <p className="text-xs text-green-600">+25% growth</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                      <div>
                        <p className="text-sm font-medium jewelry-text-luxury">Customer Retention</p>
                        <p className="text-xs text-gray-300">Last 12 months</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-blue-600">92%</p>
                        <p className="text-xs text-blue-600">High retention</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg">
                      <div>
                        <p className="text-sm font-medium jewelry-text-luxury">Avg Order Growth</p>
                        <p className="text-xs text-gray-300">Year over year</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-purple-600">+18%</p>
                        <p className="text-xs text-purple-600">Strong growth</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}