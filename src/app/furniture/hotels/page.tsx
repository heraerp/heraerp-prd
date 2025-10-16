'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Building2,
  Users,
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Building,
  Bed,
  Utensils,
  Wifi,
  Car,
  ShieldCheck,
  Award
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Hotel {
  id: string
  name: string
  category: 'luxury' | 'business' | 'budget' | 'resort'
  rating: number
  location: string
  contactPerson: string
  phone: string
  email: string
  totalRooms: number
  currentProjects: number
  totalRevenue: number
  lastOrder: string
  status: 'active' | 'prospect' | 'inactive'
  amenities: string[]
  establishedYear: number
  website?: string
}

function HotelsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // Sample hotel data - in production this would come from Universal API
  const hotels: Hotel[] = [
    {
      id: '1',
      name: 'The Grand Marriott',
      category: 'luxury',
      rating: 5,
      location: 'Mumbai, Maharashtra',
      contactPerson: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      email: 'rajesh.kumar@marriott.com',
      totalRooms: 450,
      currentProjects: 3,
      totalRevenue: 8500000,
      lastOrder: '2025-01-10',
      status: 'active',
      amenities: ['Pool', 'Spa', 'Gym', 'Restaurant', 'Conference'],
      establishedYear: 1995,
      website: 'www.marriott.com'
    },
    {
      id: '2',
      name: 'ITC Hotels Bangalore',
      category: 'luxury',
      rating: 5,
      location: 'Bangalore, Karnataka',
      contactPerson: 'Priya Sharma',
      phone: '+91 98765 43211',
      email: 'priya.sharma@itchotels.in',
      totalRooms: 380,
      currentProjects: 2,
      totalRevenue: 6200000,
      lastOrder: '2025-01-08',
      status: 'active',
      amenities: ['Spa', 'Gym', 'Restaurant', 'Conference', 'Bar'],
      establishedYear: 1988
    },
    {
      id: '3',
      name: 'Taj Business Hotel',
      category: 'business',
      rating: 4,
      location: 'Delhi, NCR',
      contactPerson: 'Arun Verma',
      phone: '+91 98765 43212',
      email: 'arun.verma@tajhotels.com',
      totalRooms: 280,
      currentProjects: 1,
      totalRevenue: 4100000,
      lastOrder: '2025-01-05',
      status: 'active',
      amenities: ['Gym', 'Restaurant', 'Conference', 'Business Center'],
      establishedYear: 2005
    },
    {
      id: '4',
      name: 'Lemon Tree Hotels',
      category: 'business',
      rating: 4,
      location: 'Pune, Maharashtra',
      contactPerson: 'Neha Patil',
      phone: '+91 98765 43213',
      email: 'neha.patil@lemontreehotels.com',
      totalRooms: 180,
      currentProjects: 0,
      totalRevenue: 1200000,
      lastOrder: '2024-12-15',
      status: 'prospect',
      amenities: ['Restaurant', 'Conference', 'Gym'],
      establishedYear: 2010
    },
    {
      id: '5',
      name: 'Ginger Budget Stay',
      category: 'budget',
      rating: 3,
      location: 'Chennai, Tamil Nadu',
      contactPerson: 'Ravi Krishnan',
      phone: '+91 98765 43214',
      email: 'ravi.krishnan@gingerhotels.com',
      totalRooms: 120,
      currentProjects: 1,
      totalRevenue: 800000,
      lastOrder: '2025-01-12',
      status: 'active',
      amenities: ['Restaurant', 'Wifi'],
      establishedYear: 2015
    },
    {
      id: '6',
      name: 'Backwater Resort',
      category: 'resort',
      rating: 4,
      location: 'Alleppey, Kerala',
      contactPerson: 'Maya Nair',
      phone: '+91 98765 43215',
      email: 'maya.nair@backwaterresort.com',
      totalRooms: 85,
      currentProjects: 2,
      totalRevenue: 2100000,
      lastOrder: '2025-01-14',
      status: 'active',
      amenities: ['Pool', 'Spa', 'Restaurant', 'Boat Service'],
      establishedYear: 2008
    }
  ]

  // Filter hotels based on search and filters
  const filteredHotels = hotels.filter(hotel => {
    const matchesSearch = hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hotel.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hotel.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || hotel.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || hotel.status === selectedStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Summary stats
  const totalHotels = hotels.length
  const activeHotels = hotels.filter(h => h.status === 'active').length
  const totalRevenue = hotels.reduce((sum, h) => sum + h.totalRevenue, 0)
  const activeProjects = hotels.reduce((sum, h) => sum + h.currentProjects, 0)

  const getCategoryColor = (category: Hotel['category']) => {
    switch (category) {
      case 'luxury': return 'from-purple-500 to-pink-500'
      case 'business': return 'from-blue-500 to-cyan-500'
      case 'budget': return 'from-green-500 to-emerald-500'
      case 'resort': return 'from-orange-500 to-red-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getStatusColor = (status: Hotel['status']) => {
    switch (status) {
      case 'active': return 'furniture-badge-success'
      case 'prospect': return 'furniture-badge-warning'
      case 'inactive': return 'furniture-badge-error'
      default: return 'furniture-badge'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
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
            <h1 className="text-3xl font-bold jewelry-text-luxury flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--jewelry-blue-500)] to-[var(--jewelry-blue-700)] flex items-center justify-center">
                <Building2 className="h-6 w-6 text-[var(--jewelry-gold-400)]" />
              </div>
              Hotels & Hospitality
            </h1>
            <p className="jewelry-text-secondary mt-2">
              Manage hotel partnerships and hospitality furniture projects
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/furniture/hotels/analytics">
              <Button variant="outline" className="gap-2 jewelry-glass-btn">
                <TrendingUp className="h-4 w-4" />
                Analytics
              </Button>
            </Link>
            <Link href="/furniture/hotels/new">
              <Button className="gap-2 jewelry-glass-btn bg-[var(--jewelry-gold-500)] text-[var(--jewelry-text-on-dark)] hover:bg-[var(--jewelry-gold-600)]">
                <Plus className="h-4 w-4" />
                Add Hotel
              </Button>
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm jewelry-text-secondary">Total Hotels</p>
                <p className="text-2xl font-bold jewelry-text-luxury">{totalHotels}</p>
                <p className="text-sm text-[var(--jewelry-success)]">{activeHotels} active</p>
              </div>
              <Building2 className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
            </div>
          </div>

          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm jewelry-text-secondary">Total Revenue</p>
                <p className="text-2xl font-bold jewelry-text-luxury">{formatCurrency(totalRevenue)}</p>
                <p className="text-sm text-[var(--jewelry-success)]">+18% this year</p>
              </div>
              <DollarSign className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
            </div>
          </div>

          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm jewelry-text-secondary">Active Projects</p>
                <p className="text-2xl font-bold jewelry-text-luxury">{activeProjects}</p>
                <p className="text-sm text-[var(--jewelry-warning)]">5 ending soon</p>
              </div>
              <Package className="h-8 w-8 text-[var(--jewelry-blue-500)]" />
            </div>
          </div>

          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm jewelry-text-secondary">Avg Rating</p>
                <p className="text-2xl font-bold jewelry-text-luxury">4.2</p>
                <p className="text-sm text-[var(--jewelry-success)]">Excellent partners</p>
              </div>
              <Star className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="jewelry-glass-card p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 jewelry-text-secondary" />
                <Input
                  placeholder="Search hotels by name, location, or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 jewelry-glass-input"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-md border jewelry-glass-input"
              >
                <option value="all">All Categories</option>
                <option value="luxury">Luxury</option>
                <option value="business">Business</option>
                <option value="budget">Budget</option>
                <option value="resort">Resort</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 rounded-md border jewelry-glass-input"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="prospect">Prospect</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Hotels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredHotels.map((hotel) => (
            <div key={hotel.id} className="jewelry-glass-card p-6 hover:scale-105 transition-transform">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold jewelry-text-luxury text-lg">{hotel.name}</h3>
                      <Badge className={getStatusColor(hotel.status)}>
                        {hotel.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < hotel.rating
                              ? 'text-[var(--jewelry-gold-500)] fill-current'
                              : 'jewelry-text-secondary'
                          }`}
                        />
                      ))}
                      <span className="text-sm jewelry-text-secondary ml-1">
                        ({hotel.rating}.0)
                      </span>
                    </div>
                  </div>
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getCategoryColor(hotel.category)} flex items-center justify-center`}>
                    {hotel.category === 'luxury' && <Award className="h-8 w-8 text-white" />}
                    {hotel.category === 'business' && <Building className="h-8 w-8 text-white" />}
                    {hotel.category === 'budget' && <DollarSign className="h-8 w-8 text-white" />}
                    {hotel.category === 'resort' && <Bed className="h-8 w-8 text-white" />}
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 jewelry-text-secondary">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{hotel.location}</span>
                </div>

                {/* Contact */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 jewelry-text-secondary">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">{hotel.contactPerson}</span>
                  </div>
                  <div className="flex items-center gap-2 jewelry-text-secondary">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{hotel.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 jewelry-text-secondary">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{hotel.email}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--glass-border)]">
                  <div>
                    <p className="text-sm jewelry-text-secondary">Rooms</p>
                    <p className="font-semibold jewelry-text-luxury">{hotel.totalRooms}</p>
                  </div>
                  <div>
                    <p className="text-sm jewelry-text-secondary">Projects</p>
                    <p className="font-semibold jewelry-text-luxury">{hotel.currentProjects}</p>
                  </div>
                  <div>
                    <p className="text-sm jewelry-text-secondary">Revenue</p>
                    <p className="font-semibold jewelry-text-luxury">{formatCurrency(hotel.totalRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-sm jewelry-text-secondary">Last Order</p>
                    <p className="font-semibold jewelry-text-luxury">{hotel.lastOrder}</p>
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <p className="text-sm jewelry-text-secondary mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-1">
                    {hotel.amenities.slice(0, 3).map((amenity) => (
                      <Badge key={amenity} variant="secondary" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    {hotel.amenities.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{hotel.amenities.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-[var(--glass-border)]">
                  <Link href={`/furniture/hotels/${hotel.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-2 jewelry-glass-btn">
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/furniture/hotels/${hotel.id}/edit`}>
                    <Button variant="outline" size="sm" className="gap-2 jewelry-glass-btn">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" className="gap-2 jewelry-glass-btn text-[var(--jewelry-error)]">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredHotels.length === 0 && (
          <div className="jewelry-glass-card p-12 text-center">
            <Building2 className="h-16 w-16 jewelry-text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold jewelry-text-luxury mb-2">No hotels found</h3>
            <p className="jewelry-text-secondary mb-6">
              Try adjusting your search criteria or add a new hotel to get started.
            </p>
            <Link href="/furniture/hotels/new">
              <Button className="gap-2 jewelry-glass-btn bg-[var(--jewelry-gold-500)] text-[var(--jewelry-text-on-dark)] hover:bg-[var(--jewelry-gold-600)]">
                <Plus className="h-4 w-4" />
                Add Your First Hotel
              </Button>
            </Link>
          </div>
        )}

        {/* Quick Stats Footer */}
        <div className="jewelry-glass-card p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--jewelry-gold-500)]">6</p>
              <p className="text-sm jewelry-text-secondary">Total Partners</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--jewelry-blue-500)]">1,495</p>
              <p className="text-sm jewelry-text-secondary">Total Rooms</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--jewelry-gold-500)]">9</p>
              <p className="text-sm jewelry-text-secondary">Active Projects</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--jewelry-blue-500)]">4.2★</p>
              <p className="text-sm jewelry-text-secondary">Avg Rating</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(HotelsPage)