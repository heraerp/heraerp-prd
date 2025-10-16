'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Truck,
  Building2,
  MapPin,
  Phone,
  Mail,
  Star,
  TreePine,
  Hammer,
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  FileText,
  Target,
  Award,
  Globe,
  Factory,
  Zap,
  Heart,
  Settings,
  BarChart3,
  CreditCard,
  ShoppingCart,
  Banknote
} from 'lucide-react'

interface Supplier {
  id: string
  name: string
  type: 'wood_supplier' | 'craftsman' | 'hardware' | 'transport' | 'tools' | 'finishing'
  category: 'premium' | 'standard' | 'bulk' | 'specialized'
  location: string
  district: string
  state: string
  contactPerson: string
  phone: string
  email: string
  website?: string
  establishedYear: number
  totalOrders: number
  totalValue: number
  averageOrderValue: number
  lastOrderDate: string
  nextDelivery?: string
  creditTerms: string
  paymentTerms: string
  rating: number
  reliabilityScore: number
  qualityScore: number
  priceCompetitiveness: number
  deliveryPerformance: number
  specializations: string[]
  certifications: string[]
  notes: string[]
  isPreferred: boolean
  isActive: boolean
  riskLevel: 'low' | 'medium' | 'high'
  leadTime: number
  minimumOrder: number
}

interface SupplierPerformance {
  supplierId: string
  metric: string
  currentValue: number
  target: number
  trend: 'up' | 'down' | 'stable'
  lastUpdated: string
}

interface ProcurementOrder {
  id: string
  supplierId: string
  orderNumber: string
  itemDescription: string
  quantity: number
  unit: string
  unitPrice: number
  totalAmount: number
  orderDate: string
  expectedDelivery: string
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'overdue'
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

interface MarketInsight {
  category: string
  trend: 'rising' | 'stable' | 'declining'
  priceChange: number
  description: string
  impact: string
  recommendation: string
}

export default function SupplierManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [orders, setOrders] = useState<ProcurementOrder[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  // Kerala furniture supplier ecosystem sample data
  const sampleSuppliers: Supplier[] = [
    {
      id: '1',
      name: 'Kerala Timber Corporation',
      type: 'wood_supplier',
      category: 'premium',
      location: 'Thrissur',
      district: 'Thrissur',
      state: 'Kerala',
      contactPerson: 'Ravi Menon',
      phone: '+91 487 2421234',
      email: 'ravi@keralatimber.com',
      website: 'www.keralatimber.com',
      establishedYear: 1985,
      totalOrders: 156,
      totalValue: 18500000,
      averageOrderValue: 118590,
      lastOrderDate: '2024-01-25',
      nextDelivery: '2024-02-05',
      creditTerms: '30 days',
      paymentTerms: 'Net 30',
      rating: 4.8,
      reliabilityScore: 92,
      qualityScore: 95,
      priceCompetitiveness: 85,
      deliveryPerformance: 94,
      specializations: ['Premium Teak', 'Rosewood', 'Export Quality Wood'],
      certifications: ['FSC Certified', 'Export License', 'Quality Assurance'],
      notes: ['Preferred supplier for export orders', 'Consistent quality', 'Reliable delivery'],
      isPreferred: true,
      isActive: true,
      riskLevel: 'low',
      leadTime: 7,
      minimumOrder: 50000
    },
    {
      id: '2',
      name: 'Raman Master Craftworks',
      type: 'craftsman',
      category: 'specialized',
      location: 'Kozhikode',
      district: 'Kozhikode',
      state: 'Kerala',
      contactPerson: 'Raman Master',
      phone: '+91 495 2765432',
      email: 'raman@craftworks.com',
      establishedYear: 1978,
      totalOrders: 89,
      totalValue: 12200000,
      averageOrderValue: 137079,
      lastOrderDate: '2024-01-20',
      nextDelivery: '2024-02-15',
      creditTerms: 'COD',
      paymentTerms: 'Advance 50%',
      rating: 4.9,
      reliabilityScore: 96,
      qualityScore: 98,
      priceCompetitiveness: 78,
      deliveryPerformance: 88,
      specializations: ['Traditional Carving', 'Heritage Furniture', 'Custom Designs'],
      certifications: ['Master Craftsman', 'Kerala Heritage Artisan'],
      notes: ['Best in traditional Kerala designs', 'Premium craftsmanship', 'Seasonal availability'],
      isPreferred: true,
      isActive: true,
      riskLevel: 'low',
      leadTime: 21,
      minimumOrder: 25000
    },
    {
      id: '3',
      name: 'Malabar Wood Industries',
      type: 'wood_supplier',
      category: 'bulk',
      location: 'Kochi',
      district: 'Ernakulam',
      state: 'Kerala',
      contactPerson: 'Suresh Kumar',
      phone: '+91 484 2334567',
      email: 'suresh@malabarwood.com',
      website: 'www.malabarwood.com',
      establishedYear: 1992,
      totalOrders: 245,
      totalValue: 24800000,
      averageOrderValue: 101224,
      lastOrderDate: '2024-01-28',
      nextDelivery: '2024-02-08',
      creditTerms: '45 days',
      paymentTerms: 'Net 45',
      rating: 4.6,
      reliabilityScore: 88,
      qualityScore: 90,
      priceCompetitiveness: 92,
      deliveryPerformance: 91,
      specializations: ['Bulk Supply', 'Jackfruit Wood', 'Competitive Pricing'],
      certifications: ['ISO 9001', 'Environmental Compliance'],
      notes: ['Good for large orders', 'Cost effective', 'Reliable supply chain'],
      isPreferred: true,
      isActive: true,
      riskLevel: 'low',
      leadTime: 10,
      minimumOrder: 75000
    },
    {
      id: '4',
      name: 'Trivandrum Hardware Mart',
      type: 'hardware',
      category: 'standard',
      location: 'Trivandrum',
      district: 'Thiruvananthapuram',
      state: 'Kerala',
      contactPerson: 'Ajay Nair',
      phone: '+91 471 2567890',
      email: 'ajay@hardwaremart.com',
      establishedYear: 2005,
      totalOrders: 178,
      totalValue: 8900000,
      averageOrderValue: 50000,
      lastOrderDate: '2024-01-30',
      creditTerms: '15 days',
      paymentTerms: 'Net 15',
      rating: 4.4,
      reliabilityScore: 85,
      qualityScore: 87,
      priceCompetitiveness: 88,
      deliveryPerformance: 92,
      specializations: ['Furniture Hardware', 'Hinges & Locks', 'Quick Delivery'],
      certifications: ['Authorized Dealer', 'Quality Standards'],
      notes: ['Good for hardware needs', 'Quick turnaround', 'Competitive pricing'],
      isPreferred: false,
      isActive: true,
      riskLevel: 'medium',
      leadTime: 3,
      minimumOrder: 10000
    },
    {
      id: '5',
      name: 'Express Logistics Kerala',
      type: 'transport',
      category: 'specialized',
      location: 'Kochi Port',
      district: 'Ernakulam',
      state: 'Kerala',
      contactPerson: 'Mohammed Ali',
      phone: '+91 484 2445678',
      email: 'ali@expresslogistics.com',
      website: 'www.expresslogistics.com',
      establishedYear: 2010,
      totalOrders: 95,
      totalValue: 6500000,
      averageOrderValue: 68421,
      lastOrderDate: '2024-01-29',
      creditTerms: '7 days',
      paymentTerms: 'Net 7',
      rating: 4.7,
      reliabilityScore: 93,
      qualityScore: 89,
      priceCompetitiveness: 86,
      deliveryPerformance: 96,
      specializations: ['Export Shipping', 'Container Loading', 'Documentation'],
      certifications: ['Export License', 'Customs Clearance', 'Insurance'],
      notes: ['Excellent for exports', 'Professional handling', 'Documentation support'],
      isPreferred: true,
      isActive: true,
      riskLevel: 'low',
      leadTime: 2,
      minimumOrder: 15000
    }
  ]

  const sampleOrders: ProcurementOrder[] = [
    {
      id: '1',
      supplierId: '1',
      orderNumber: 'PO-2024-001',
      itemDescription: 'Premium Teak Wood - Export Grade',
      quantity: 2.5,
      unit: 'tons',
      unitPrice: 85000,
      totalAmount: 212500,
      orderDate: '2024-01-25',
      expectedDelivery: '2024-02-05',
      status: 'confirmed',
      paymentStatus: 'pending',
      priority: 'high'
    },
    {
      id: '2',
      supplierId: '2',
      orderNumber: 'PO-2024-002',
      itemDescription: 'Traditional Carving Services - Hotel Project',
      quantity: 150,
      unit: 'pieces',
      unitPrice: 2500,
      totalAmount: 375000,
      orderDate: '2024-01-20',
      expectedDelivery: '2024-02-15',
      status: 'shipped',
      paymentStatus: 'paid',
      priority: 'urgent'
    },
    {
      id: '3',
      supplierId: '3',
      orderNumber: 'PO-2024-003',
      itemDescription: 'Jackfruit Wood - Bulk Order',
      quantity: 3.2,
      unit: 'tons',
      unitPrice: 45000,
      totalAmount: 144000,
      orderDate: '2024-01-28',
      expectedDelivery: '2024-02-08',
      status: 'pending',
      paymentStatus: 'pending',
      priority: 'medium'
    }
  ]

  const marketInsights: MarketInsight[] = [
    {
      category: 'Teak Wood Prices',
      trend: 'rising',
      priceChange: 12,
      description: 'Premium teak prices increased due to export demand',
      impact: 'Cost increase of 12% for premium furniture projects',
      recommendation: 'Consider bulk purchasing or alternative wood types'
    },
    {
      category: 'Craftsman Availability',
      trend: 'declining',
      priceChange: -15,
      description: 'Traditional craftsmen becoming scarce during peak season',
      impact: 'Lead times increased, prices up 15%',
      recommendation: 'Build relationships with multiple craftsmen networks'
    },
    {
      category: 'Hardware Costs',
      trend: 'stable',
      priceChange: 2,
      description: 'Furniture hardware prices remain stable with slight increase',
      impact: 'Minimal impact on overall project costs',
      recommendation: 'Good time for bulk hardware procurement'
    },
    {
      category: 'Logistics Rates',
      trend: 'rising',
      priceChange: 8,
      description: 'Export shipping rates up due to global logistics challenges',
      impact: 'Export margin compression of 2-3%',
      recommendation: 'Negotiate long-term contracts with logistics partners'
    }
  ]

  useEffect(() => {
    setSuppliers(sampleSuppliers)
    setOrders(sampleOrders)
  }, [])

  const getSupplierTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'wood_supplier': 'bg-green-500/10 text-green-600 border-green-500/20',
      'craftsman': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      'hardware': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      'transport': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      'tools': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
      'finishing': 'bg-pink-500/10 text-pink-600 border-pink-500/20'
    }
    return colors[type] || colors.wood_supplier
  }

  const getRiskLevelColor = (risk: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-green-500/10 text-green-600',
      'medium': 'bg-amber-500/10 text-amber-600',
      'high': 'bg-red-500/10 text-red-600'
    }
    return colors[risk] || colors.medium
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      'confirmed': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      'shipped': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
      'delivered': 'bg-green-500/10 text-green-600 border-green-500/20',
      'cancelled': 'bg-red-500/10 text-red-600 border-red-500/20'
    }
    return colors[status] || colors.pending
  }

  const getTrendIcon = (trend: 'rising' | 'stable' | 'declining') => {
    if (trend === 'rising') return <TrendingUp className="h-3 w-3 text-red-500" />
    if (trend === 'declining') return <TrendingDown className="h-3 w-3 text-green-500" />
    return <Target className="h-3 w-3 text-blue-500" />
  }

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supplier.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supplier.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || supplier.type === filterType
    return matchesSearch && matchesType
  })

  const totalSupplierValue = suppliers.reduce((sum, supplier) => sum + supplier.totalValue, 0)
  const preferredSuppliers = suppliers.filter(s => s.isPreferred).length
  const avgRating = suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="jewelry-crown-glow p-3 rounded-xl">
                  <Truck className="h-8 w-8 jewelry-text-gold" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold jewelry-text-luxury">Supplier Management</h1>
                  <p className="text-lg text-gray-300">Kerala Wood & Craftsmen Supplier Network</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  <TreePine className="h-3 w-3 mr-1" />
                  Local Focus
                </Badge>
                <Button className="jewelry-glass-btn gap-2">
                  <Plus className="h-4 w-4" />
                  Add Supplier
                </Button>
              </div>
            </div>
          </div>

          {/* Supplier Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Total Suppliers</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{suppliers.length}</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">
                {preferredSuppliers} Preferred • {suppliers.filter(s => s.isActive).length} Active
              </p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Total Procurement</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">₹{(totalSupplierValue / 10000000).toFixed(1)}Cr</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Lifetime value</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Avg Supplier Rating</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{avgRating.toFixed(1)}</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">High quality network</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Avg Lead Time</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{Math.round(suppliers.reduce((sum, s) => sum + s.leadTime, 0) / suppliers.length)}</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Days average</p>
            </div>
          </div>

          <Tabs defaultValue="suppliers" className="space-y-4">
            <TabsList className="jewelry-glass-panel">
              <TabsTrigger value="suppliers" className="jewelry-glass-btn">Supplier Directory</TabsTrigger>
              <TabsTrigger value="orders" className="jewelry-glass-btn">Purchase Orders</TabsTrigger>
              <TabsTrigger value="performance" className="jewelry-glass-btn">Performance</TabsTrigger>
              <TabsTrigger value="market" className="jewelry-glass-btn">Market Insights</TabsTrigger>
            </TabsList>

            {/* Suppliers Directory */}
            <TabsContent value="suppliers" className="space-y-6">
              {/* Search and Filters */}
              <div className="jewelry-glass-card p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-300" />
                    <Input
                      placeholder="Search suppliers, locations, contacts..."
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
                      <option value="wood_supplier">Wood Suppliers</option>
                      <option value="craftsman">Craftsmen</option>
                      <option value="hardware">Hardware</option>
                      <option value="transport">Transport</option>
                      <option value="tools">Tools</option>
                      <option value="finishing">Finishing</option>
                    </select>
                    <Button variant="outline" className="jewelry-glass-btn">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Supplier List */}
              <div className="space-y-4">
                {filteredSuppliers.map((supplier) => (
                  <div key={supplier.id} className="jewelry-glass-card p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                            {supplier.type === 'wood_supplier' && <TreePine className="h-6 w-6 text-white" />}
                            {supplier.type === 'craftsman' && <Hammer className="h-6 w-6 text-white" />}
                            {supplier.type === 'hardware' && <Package className="h-6 w-6 text-white" />}
                            {supplier.type === 'transport' && <Truck className="h-6 w-6 text-white" />}
                            {supplier.type === 'tools' && <Settings className="h-6 w-6 text-white" />}
                            {supplier.type === 'finishing' && <Star className="h-6 w-6 text-white" />}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold jewelry-text-luxury">{supplier.name}</h3>
                            <p className="text-sm text-gray-300">{supplier.contactPerson} • {supplier.location}, {supplier.district}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getSupplierTypeColor(supplier.type)}>
                              {supplier.type.replace('_', ' ').charAt(0).toUpperCase() + supplier.type.replace('_', ' ').slice(1)}
                            </Badge>
                            <Badge className={getRiskLevelColor(supplier.riskLevel)}>
                              {supplier.riskLevel.charAt(0).toUpperCase() + supplier.riskLevel.slice(1)} Risk
                            </Badge>
                            {supplier.isPreferred && (
                              <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                                <Heart className="h-3 w-3 mr-1" />
                                Preferred
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300 mb-4">
                          <div>
                            <span className="font-medium">Total Orders:</span> {supplier.totalOrders}
                          </div>
                          <div>
                            <span className="font-medium">Total Value:</span> ₹{(supplier.totalValue / 100000).toFixed(1)}L
                          </div>
                          <div>
                            <span className="font-medium">Avg Order:</span> ₹{(supplier.averageOrderValue / 1000).toFixed(0)}K
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Rating:</span>
                            <span className="text-yellow-500">{supplier.rating}</span>
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300 mb-4">
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{supplier.phone}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{supplier.email}</span>
                          </div>
                          <div>
                            <span className="font-medium">Lead Time:</span> {supplier.leadTime} days
                          </div>
                          <div>
                            <span className="font-medium">Payment:</span> {supplier.paymentTerms}
                          </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center p-2 bg-blue-500/10 rounded-lg">
                            <p className="text-sm font-bold jewelry-text-luxury">{supplier.reliabilityScore}%</p>
                            <p className="text-xs text-gray-300">Reliability</p>
                          </div>
                          <div className="text-center p-2 bg-green-500/10 rounded-lg">
                            <p className="text-sm font-bold jewelry-text-luxury">{supplier.qualityScore}%</p>
                            <p className="text-xs text-gray-300">Quality</p>
                          </div>
                          <div className="text-center p-2 bg-amber-500/10 rounded-lg">
                            <p className="text-sm font-bold jewelry-text-luxury">{supplier.priceCompetitiveness}%</p>
                            <p className="text-xs text-gray-300">Price</p>
                          </div>
                          <div className="text-center p-2 bg-purple-500/10 rounded-lg">
                            <p className="text-sm font-bold jewelry-text-luxury">{supplier.deliveryPerformance}%</p>
                            <p className="text-xs text-gray-300">Delivery</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-medium jewelry-text-luxury mb-1">Specializations:</p>
                            <div className="flex flex-wrap gap-1">
                              {supplier.specializations.map((spec, index) => (
                                <Badge key={index} variant="outline" className="text-xs jewelry-badge-text">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {supplier.certifications.length > 0 && (
                            <div>
                              <p className="text-sm font-medium jewelry-text-luxury mb-1">Certifications:</p>
                              <div className="flex flex-wrap gap-1">
                                {supplier.certifications.map((cert, index) => (
                                  <Badge key={index} variant="outline" className="text-xs bg-green-500/10 text-green-600">
                                    <Award className="h-3 w-3 mr-1" />
                                    {cert}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button size="sm" className="jewelry-glass-btn gap-1" onClick={() => setSelectedSupplier(supplier)}>
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1">
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1">
                          <ShoppingCart className="h-3 w-3" />
                          Order
                        </Button>
                        <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1">
                          <BarChart3 className="h-3 w-3" />
                          Analytics
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Purchase Orders */}
            <TabsContent value="orders" className="space-y-6">
              <div className="space-y-4">
                {orders.map((order) => {
                  const supplier = suppliers.find(s => s.id === order.supplierId)
                  return (
                    <div key={order.id} className="jewelry-glass-card p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold jewelry-text-luxury">{order.orderNumber}</h3>
                              <p className="text-sm text-gray-300">{supplier?.name} • {order.orderDate}</p>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={getStatusColor(order.status)}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                              <Badge className={`${
                                order.priority === 'urgent' ? 'bg-red-500/10 text-red-600' :
                                order.priority === 'high' ? 'bg-orange-500/10 text-orange-600' :
                                order.priority === 'medium' ? 'bg-amber-500/10 text-amber-600' :
                                'bg-green-500/10 text-green-600'
                              }`}>
                                {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300 mb-4">
                            <div>
                              <span className="font-medium">Item:</span> {order.itemDescription}
                            </div>
                            <div>
                              <span className="font-medium">Quantity:</span> {order.quantity} {order.unit}
                            </div>
                            <div>
                              <span className="font-medium">Unit Price:</span> ₹{order.unitPrice.toLocaleString()}
                            </div>
                            <div>
                              <span className="font-medium">Total:</span> ₹{order.totalAmount.toLocaleString()}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
                            <div>
                              <span className="font-medium">Expected Delivery:</span> {order.expectedDelivery}
                            </div>
                            <div>
                              <span className="font-medium">Payment Status:</span>
                              <Badge className={`ml-1 ${
                                order.paymentStatus === 'paid' ? 'bg-green-500/10 text-green-600' :
                                order.paymentStatus === 'overdue' ? 'bg-red-500/10 text-red-600' :
                                'bg-amber-500/10 text-amber-600'
                              }`}>
                                {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Ordered: {order.orderDate}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button size="sm" className="jewelry-glass-btn gap-1">
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1">
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1">
                            <Truck className="h-3 w-3" />
                            Track
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Order Summary */}
              <div className="jewelry-glass-card p-6">
                <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Procurement Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-3">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-xl font-bold jewelry-text-luxury">{orders.length}</p>
                    <p className="text-sm text-gray-300">Active Orders</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-3">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-xl font-bold jewelry-text-luxury">₹{(orders.reduce((sum, o) => sum + o.totalAmount, 0) / 100000).toFixed(1)}L</p>
                    <p className="text-sm text-gray-300">Total Value</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center mb-3">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-xl font-bold jewelry-text-luxury">{orders.filter(o => o.status === 'pending').length}</p>
                    <p className="text-sm text-gray-300">Pending</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center mb-3">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-xl font-bold jewelry-text-luxury">{orders.filter(o => o.status === 'delivered').length}</p>
                    <p className="text-sm text-gray-300">Delivered</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Performance */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performing Suppliers */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Top Performing Suppliers</h3>
                  <div className="space-y-3">
                    {suppliers
                      .sort((a, b) => (b.reliabilityScore + b.qualityScore + b.deliveryPerformance) / 3 - (a.reliabilityScore + a.qualityScore + a.deliveryPerformance) / 3)
                      .slice(0, 5)
                      .map((supplier, index) => {
                        const overallScore = Math.round((supplier.reliabilityScore + supplier.qualityScore + supplier.deliveryPerformance) / 3)
                        return (
                          <div key={supplier.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-sm font-medium jewelry-text-luxury">{supplier.name}</p>
                                <p className="text-xs text-gray-300">{supplier.type.replace('_', ' ')}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium jewelry-text-luxury">{overallScore}%</p>
                              <p className="text-xs text-gray-300">Overall Score</p>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>

                {/* Supplier Categories Performance */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Category Performance</h3>
                  <div className="space-y-4">
                    {['wood_supplier', 'craftsman', 'hardware', 'transport'].map(type => {
                      const categorySuppliers = suppliers.filter(s => s.type === type)
                      const avgScore = categorySuppliers.length > 0 
                        ? Math.round(categorySuppliers.reduce((sum, s) => sum + s.rating, 0) / categorySuppliers.length * 20)
                        : 0
                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="jewelry-text-luxury capitalize">{type.replace('_', ' ')}</span>
                            <span className="text-gray-300">{avgScore}% ({categorySuppliers.length} suppliers)</span>
                          </div>
                          <Progress value={avgScore} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Performance Trends */}
              <div className="jewelry-glass-card p-6">
                <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Performance Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="flex items-center gap-2 text-green-600 font-medium mb-2">
                      <CheckCircle className="h-4 w-4" />
                      Quality Excellence
                    </div>
                    <p className="text-sm text-gray-300">
                      {suppliers.filter(s => s.qualityScore >= 90).length} suppliers maintain 90%+ quality scores
                    </p>
                  </div>

                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="flex items-center gap-2 text-blue-600 font-medium mb-2">
                      <Clock className="h-4 w-4" />
                      Delivery Performance
                    </div>
                    <p className="text-sm text-gray-300">
                      Average delivery performance: {Math.round(suppliers.reduce((sum, s) => sum + s.deliveryPerformance, 0) / suppliers.length)}%
                    </p>
                  </div>

                  <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <div className="flex items-center gap-2 text-amber-600 font-medium mb-2">
                      <AlertCircle className="h-4 w-4" />
                      Risk Management
                    </div>
                    <p className="text-sm text-gray-300">
                      {suppliers.filter(s => s.riskLevel === 'low').length} low-risk suppliers in active network
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Market Insights */}
            <TabsContent value="market" className="space-y-6">
              <div className="space-y-4">
                {marketInsights.map((insight, index) => (
                  <div key={index} className="jewelry-glass-card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          insight.trend === 'rising' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                          insight.trend === 'stable' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                          'bg-gradient-to-r from-green-500 to-emerald-500'
                        }`}>
                          {getTrendIcon(insight.trend)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold jewelry-text-luxury">{insight.category}</h3>
                          <p className="text-sm text-gray-300 capitalize">{insight.trend} trend</p>
                        </div>
                      </div>
                      <Badge className={`${
                        insight.trend === 'rising' ? 'bg-red-500/10 text-red-600' :
                        insight.trend === 'stable' ? 'bg-blue-500/10 text-blue-600' :
                        'bg-green-500/10 text-green-600'
                      }`}>
                        {insight.priceChange > 0 ? '+' : ''}{insight.priceChange}%
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium jewelry-text-luxury mb-1">Market Description:</p>
                        <p className="text-sm text-gray-300">{insight.description}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium jewelry-text-luxury mb-1">Business Impact:</p>
                        <p className="text-sm text-gray-300">{insight.impact}</p>
                      </div>
                      <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <p className="text-sm font-medium text-blue-600 mb-1">Recommendation:</p>
                        <p className="text-sm text-blue-600">{insight.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Market Summary */}
              <div className="jewelry-glass-card p-6">
                <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Kerala Furniture Supply Market Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-medium jewelry-text-luxury mb-3 text-green-600">Market Strengths</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-300">Rich ecosystem of traditional craftsmen</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-300">Premium wood availability and quality</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-300">Strong logistics network for exports</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-300">Government support for traditional industries</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-md font-medium jewelry-text-luxury mb-3 text-amber-600">Market Challenges</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-300">Rising material costs affecting margins</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-300">Seasonal availability of skilled craftsmen</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-300">Export logistics cost increases</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-300">Environmental regulations on wood sourcing</p>
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