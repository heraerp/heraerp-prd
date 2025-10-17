'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Globe,
  Users,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Package,
  TrendingUp,
  DollarSign,
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Building,
  Truck,
  Ship,
  Plane,
  Award,
  Target,
  CheckCircle,
  AlertCircle,
  Clock,
  ShoppingCart,
  BarChart3,
  Download,
  Upload,
  Settings
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface ExportClient {
  id: string
  name: string
  country: string
  region: 'North America' | 'Europe' | 'Asia Pacific' | 'Middle East' | 'Africa' | 'South America'
  contactPerson: string
  phone: string
  email: string
  establishedYear: number
  totalOrders: number
  annualRevenue: number
  lastOrderDate: string
  status: 'active' | 'prospect' | 'inactive' | 'negotiating'
  clientType: 'distributor' | 'retailer' | 'hotel_chain' | 'government' | 'corporate'
  preferredShipping: 'sea' | 'air' | 'land'
  paymentTerms: string
  specialRequirements: string[]
  website?: string
}

function ExportClientsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedClientType, setSelectedClientType] = useState<string>('all')

  // Sample export client data
  const exportClients: ExportClient[] = [
    {
      id: '1',
      name: 'Royal Furniture Group UAE',
      country: 'United Arab Emirates',
      region: 'Middle East',
      contactPerson: 'Ahmed Al Mansouri',
      phone: '+971 4 567 8901',
      email: 'ahmed.mansouri@royalfurniture.ae',
      establishedYear: 1995,
      totalOrders: 156,
      annualRevenue: 2800000,
      lastOrderDate: '2025-01-15',
      status: 'active',
      clientType: 'distributor',
      preferredShipping: 'sea',
      paymentTerms: '30 days LC',
      specialRequirements: ['Islamic Design Elements', 'Gold Accents', 'Premium Packaging'],
      website: 'www.royalfurniture.ae'
    },
    {
      id: '2',
      name: 'European Luxury Interiors',
      country: 'Germany',
      region: 'Europe',
      contactPerson: 'Klaus Mueller',
      phone: '+49 30 123 4567',
      email: 'klaus.mueller@eli-interiors.de',
      establishedYear: 1988,
      totalOrders: 89,
      annualRevenue: 1900000,
      lastOrderDate: '2025-01-12',
      status: 'active',
      clientType: 'retailer',
      preferredShipping: 'sea',
      paymentTerms: '60 days TT',
      specialRequirements: ['FSC Certified Wood', 'EU Compliance', 'Eco-Friendly Finish'],
      website: 'www.eli-interiors.de'
    },
    {
      id: '3',
      name: 'Marriott Hotels Asia Pacific',
      country: 'Singapore',
      region: 'Asia Pacific',
      contactPerson: 'Li Wei Chen',
      phone: '+65 6789 0123',
      email: 'liwei.chen@marriott.com',
      establishedYear: 1972,
      totalOrders: 234,
      annualRevenue: 4200000,
      lastOrderDate: '2025-01-10',
      status: 'active',
      clientType: 'hotel_chain',
      preferredShipping: 'sea',
      paymentTerms: '45 days NET',
      specialRequirements: ['Fire Retardant Materials', 'Hotel Standards', 'Bulk Discounts']
    },
    {
      id: '4',
      name: 'American Furniture Distributors',
      country: 'United States',
      region: 'North America',
      contactPerson: 'John Richardson',
      phone: '+1 555 123 4567',
      email: 'j.richardson@afd-usa.com',
      establishedYear: 2001,
      totalOrders: 67,
      annualRevenue: 1500000,
      lastOrderDate: '2024-12-28',
      status: 'negotiating',
      clientType: 'distributor',
      preferredShipping: 'sea',
      paymentTerms: '90 days LC',
      specialRequirements: ['California Fire Standards', 'Anti-Dumping Compliance']
    },
    {
      id: '5',
      name: 'South African Government',
      country: 'South Africa',
      region: 'Africa',
      contactPerson: 'Nomsa Khumalo',
      phone: '+27 11 234 5678',
      email: 'n.khumalo@gov.za',
      establishedYear: 1994,
      totalOrders: 12,
      annualRevenue: 850000,
      lastOrderDate: '2024-11-15',
      status: 'prospect',
      clientType: 'government',
      preferredShipping: 'sea',
      paymentTerms: '120 days LC',
      specialRequirements: ['Government Tenders', 'Local Content Requirements']
    },
    {
      id: '6',
      name: 'Brazilian Corporate Solutions',
      country: 'Brazil',
      region: 'South America',
      contactPerson: 'Carlos Santos',
      phone: '+55 11 9876 5432',
      email: 'carlos.santos@bcs.com.br',
      establishedYear: 2010,
      totalOrders: 45,
      annualRevenue: 1200000,
      lastOrderDate: '2025-01-05',
      status: 'active',
      clientType: 'corporate',
      preferredShipping: 'sea',
      paymentTerms: '60 days TT',
      specialRequirements: ['Portuguese Documentation', 'INMETRO Certification']
    }
  ]

  // Filter clients based on search and filters
  const filteredClients = exportClients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRegion = selectedRegion === 'all' || client.region === selectedRegion
    const matchesStatus = selectedStatus === 'all' || client.status === selectedStatus
    const matchesClientType = selectedClientType === 'all' || client.clientType === selectedClientType
    
    return matchesSearch && matchesRegion && matchesStatus && matchesClientType
  })

  // Summary stats
  const totalClients = exportClients.length
  const activeClients = exportClients.filter(c => c.status === 'active').length
  const totalRevenue = exportClients.reduce((sum, c) => sum + c.annualRevenue, 0)
  const totalOrders = exportClients.reduce((sum, c) => sum + c.totalOrders, 0)

  const getRegionColor = (region: string) => {
    switch (region) {
      case 'North America': return 'from-blue-500 to-blue-700'
      case 'Europe': return 'from-green-500 to-green-700'
      case 'Asia Pacific': return 'from-red-500 to-red-700'
      case 'Middle East': return 'from-yellow-500 to-yellow-700'
      case 'Africa': return 'from-orange-500 to-orange-700'
      case 'South America': return 'from-purple-500 to-purple-700'
      default: return 'from-gray-500 to-gray-700'
    }
  }

  const getStatusColor = (status: ExportClient['status']) => {
    switch (status) {
      case 'active': return 'bg-[var(--jewelry-success)] text-white'
      case 'prospect': return 'bg-[var(--jewelry-warning)] text-white'
      case 'negotiating': return 'bg-[var(--jewelry-info)] text-white'
      case 'inactive': return 'bg-[var(--jewelry-error)] text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getClientTypeIcon = (type: ExportClient['clientType']) => {
    switch (type) {
      case 'distributor': return Truck
      case 'retailer': return ShoppingCart
      case 'hotel_chain': return Building
      case 'government': return Award
      case 'corporate': return Target
      default: return Building
    }
  }

  const getShippingIcon = (shipping: ExportClient['preferredShipping']) => {
    switch (shipping) {
      case 'sea': return Ship
      case 'air': return Plane
      case 'land': return Truck
      default: return Ship
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--jewelry-blue-500)] to-[var(--jewelry-blue-700)] flex items-center justify-center">
                <Globe className="h-6 w-6 text-[var(--jewelry-gold-400)]" />
              </div>
              Export Clients
            </h1>
            <p className="text-gray-300 mt-2">
              Manage international clients and export business relationships
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/furniture/export-clients/analytics">
              <Button variant="outline" className="gap-2 jewelry-glass-btn text-white border-gray-400 hover:border-white hover:text-white">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
            </Link>
            <Link href="/furniture/export-clients/export">
              <Button variant="outline" className="gap-2 jewelry-glass-btn text-white border-gray-400 hover:border-white hover:text-white">
                <Download className="h-4 w-4" />
                Export Data
              </Button>
            </Link>
            <Link href="/furniture/export-clients/new">
              <Button className="gap-2 bg-[var(--jewelry-gold-500)] text-[var(--jewelry-text-on-dark)] hover:bg-[var(--jewelry-gold-600)] border-0">
                <Plus className="h-4 w-4" />
                Add Client
              </Button>
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Total Clients</p>
                <p className="text-2xl font-bold text-white">{totalClients}</p>
                <p className="text-sm text-[var(--jewelry-success)]">{activeClients} active</p>
              </div>
              <Globe className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
            </div>
          </div>

          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Annual Revenue</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
                <p className="text-sm text-[var(--jewelry-success)]">+22% this year</p>
              </div>
              <DollarSign className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
            </div>
          </div>

          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Total Orders</p>
                <p className="text-2xl font-bold text-white">{totalOrders}</p>
                <p className="text-sm text-[var(--jewelry-warning)]">8 pending</p>
              </div>
              <Package className="h-8 w-8 text-[var(--jewelry-blue-500)]" />
            </div>
          </div>

          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Global Regions</p>
                <p className="text-2xl font-bold text-white">6</p>
                <p className="text-sm text-[var(--jewelry-success)]">Worldwide reach</p>
              </div>
              <MapPin className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="jewelry-glass-card p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search clients by name, country, or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/20 border-gray-600 text-white placeholder:text-gray-400 focus:border-[var(--jewelry-gold-500)]"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-3 py-2 rounded-md border bg-black/20 border-gray-600 text-white focus:border-[var(--jewelry-gold-500)]"
              >
                <option value="all">All Regions</option>
                <option value="North America">North America</option>
                <option value="Europe">Europe</option>
                <option value="Asia Pacific">Asia Pacific</option>
                <option value="Middle East">Middle East</option>
                <option value="Africa">Africa</option>
                <option value="South America">South America</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 rounded-md border bg-black/20 border-gray-600 text-white focus:border-[var(--jewelry-gold-500)]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="prospect">Prospect</option>
                <option value="negotiating">Negotiating</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={selectedClientType}
                onChange={(e) => setSelectedClientType(e.target.value)}
                className="px-3 py-2 rounded-md border bg-black/20 border-gray-600 text-white focus:border-[var(--jewelry-gold-500)]"
              >
                <option value="all">All Types</option>
                <option value="distributor">Distributor</option>
                <option value="retailer">Retailer</option>
                <option value="hotel_chain">Hotel Chain</option>
                <option value="government">Government</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>
          </div>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map((client) => {
            const ClientTypeIcon = getClientTypeIcon(client.clientType)
            const ShippingIcon = getShippingIcon(client.preferredShipping)
            
            return (
              <div key={client.id} className="jewelry-glass-card p-6 hover:scale-105 transition-transform">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-white text-lg">{client.name}</h3>
                        <Badge className={getStatusColor(client.status)}>
                          {client.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-300">{client.country}</span>
                        <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-200">
                          {client.region}
                        </Badge>
                      </div>
                    </div>
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getRegionColor(client.region)} flex items-center justify-center`}>
                      <ClientTypeIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">{client.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">{client.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">{client.email}</span>
                    </div>
                  </div>

                  {/* Business Details */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-600">
                    <div>
                      <p className="text-sm text-gray-400">Total Orders</p>
                      <p className="font-semibold text-white">{client.totalOrders}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Annual Revenue</p>
                      <p className="font-semibold text-white">{formatCurrency(client.annualRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Last Order</p>
                      <p className="font-semibold text-white">{client.lastOrderDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Payment Terms</p>
                      <p className="font-semibold text-white">{client.paymentTerms}</p>
                    </div>
                  </div>

                  {/* Shipping & Requirements */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-300">
                      <ShippingIcon className="h-4 w-4" />
                      <span className="text-sm capitalize">{client.preferredShipping} shipping</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Special Requirements</p>
                      <div className="flex flex-wrap gap-1">
                        {client.specialRequirements.slice(0, 2).map((req) => (
                          <Badge key={req} variant="secondary" className="text-xs bg-gray-700 text-gray-200">
                            {req}
                          </Badge>
                        ))}
                        {client.specialRequirements.length > 2 && (
                          <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-200">
                            +{client.specialRequirements.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-600">
                    <Link href={`/furniture/export-clients/${client.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-2 text-white border-gray-400 hover:border-white hover:text-white">
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/furniture/export-clients/${client.id}/edit`}>
                      <Button variant="outline" size="sm" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="gap-2 text-[var(--jewelry-error)] border-red-400 hover:border-red-300">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredClients.length === 0 && (
          <div className="jewelry-glass-card p-12 text-center">
            <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No export clients found</h3>
            <p className="text-gray-300 mb-6">
              Try adjusting your search criteria or add a new export client to get started.
            </p>
            <Link href="/furniture/export-clients/new">
              <Button className="gap-2 bg-[var(--jewelry-gold-500)] text-[var(--jewelry-text-on-dark)] hover:bg-[var(--jewelry-gold-600)] border-0">
                <Plus className="h-4 w-4" />
                Add Your First Export Client
              </Button>
            </Link>
          </div>
        )}

        {/* Quick Stats Footer */}
        <div className="jewelry-glass-card p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--jewelry-gold-500)]">{totalClients}</p>
              <p className="text-sm text-gray-300">Total Export Partners</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--jewelry-blue-500)]">{formatCurrency(totalRevenue)}</p>
              <p className="text-sm text-gray-300">Annual Export Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--jewelry-gold-500)]">{totalOrders}</p>
              <p className="text-sm text-gray-300">Total Export Orders</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--jewelry-blue-500)]">6</p>
              <p className="text-sm text-gray-300">Global Regions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(ExportClientsPage)