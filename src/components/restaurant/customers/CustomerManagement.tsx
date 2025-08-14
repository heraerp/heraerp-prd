'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  MetricCard,
  AnimatedCounter,
  StatusIndicator,
  FloatingNotification,
  GlowButton
} from '../JobsStyleMicroInteractions'
import {
  Users,
  Star,
  Heart,
  Gift,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  MessageSquare,
  Award,
  Clock,
  Activity,
  User,
  Crown,
  Sparkles,
  Coffee,
  Utensils,
  ThumbsUp,
  Target,
  Download,
  Upload,
  UserPlus,
  ChevronRight,
  History,
  CreditCard,
  Cake
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

// Steve Jobs: "People don't know what they want until you show it to them"

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  tier: 'regular' | 'vip' | 'diamond'
  totalSpent: number
  visitCount: number
  lastVisit: string
  favoriteItems: string[]
  dietaryRestrictions: string[]
  birthday?: string
  notes?: string
  loyaltyPoints: number
  satisfaction: number
  createdAt: string
  tags: string[]
  address?: {
    street: string
    city: string
    state: string
    zip: string
  }
}

export function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'lastVisit' | 'totalSpent'>('lastVisit')
  const [showNotification, setShowNotification] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Customer stats
  const [stats, setStats] = useState({
    totalCustomers: 1247,
    newThisMonth: 89,
    vipCustomers: 124,
    averageSpent: 67,
    retentionRate: 78,
    satisfaction: 4.6
  })

  // Load customers data
  const loadCustomers = async () => {
    try {
      setIsLoading(true)
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockCustomers: Customer[] = [
        {
          id: '1',
          name: 'Sarah Johnson',
          email: 'sarah.j@email.com',
          phone: '+1-555-0123',
          avatar: '/api/placeholder/32/32',
          tier: 'vip',
          totalSpent: 2845.50,
          visitCount: 47,
          lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          favoriteItems: ['Margherita Pizza', 'Caesar Salad', 'Tiramisu'],
          dietaryRestrictions: ['Vegetarian'],
          birthday: '1985-06-15',
          loyaltyPoints: 1420,
          satisfaction: 4.8,
          createdAt: '2023-01-15',
          tags: ['Frequent', 'High Value', 'Birthday Club'],
          notes: 'Prefers table by the window. Allergic to nuts.',
          address: {
            street: '123 Oak Street',
            city: 'San Francisco',
            state: 'CA',
            zip: '94102'
          }
        },
        {
          id: '2',
          name: 'Michael Chen',
          email: 'mchen@company.com',
          phone: '+1-555-0124',
          tier: 'diamond',
          totalSpent: 5240.75,
          visitCount: 73,
          lastVisit: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          favoriteItems: ['Wagyu Steak', 'Lobster Bisque', 'Chocolate Soufflé'],
          dietaryRestrictions: [],
          loyaltyPoints: 2620,
          satisfaction: 4.9,
          createdAt: '2022-08-20',
          tags: ['VIP', 'Business Dining', 'Wine Enthusiast'],
          notes: 'CEO of tech company. Often books private dining room.'
        },
        {
          id: '3',
          name: 'Emily Rodriguez',
          email: 'emily.r@gmail.com',
          phone: '+1-555-0125',
          tier: 'regular',
          totalSpent: 485.25,
          visitCount: 12,
          lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          favoriteItems: ['Chicken Sandwich', 'Sweet Potato Fries'],
          dietaryRestrictions: ['Gluten-Free'],
          birthday: '1992-11-28',
          loyaltyPoints: 242,
          satisfaction: 4.2,
          createdAt: '2024-03-10',
          tags: ['New Customer', 'Dietary Needs']
        },
        {
          id: '4',
          name: 'David Park',
          email: 'dpark@email.com',
          phone: '+1-555-0126',
          tier: 'vip',
          totalSpent: 1650.00,
          visitCount: 31,
          lastVisit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          favoriteItems: ['Ramen Bowl', 'Gyoza', 'Green Tea Ice Cream'],
          dietaryRestrictions: [],
          loyaltyPoints: 825,
          satisfaction: 4.5,
          createdAt: '2023-05-22',
          tags: ['Regular', 'Japanese Cuisine']
        }
      ]
      
      setCustomers(mockCustomers)
    } catch (error) {
      console.error('Error loading customers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  // Filter and sort customers
  const filteredCustomers = customers
    .filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           customer.phone.includes(searchQuery)
      const matchesTier = filterTier === 'all' || customer.tier === filterTier
      return matchesSearch && matchesTier
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'totalSpent':
          return b.totalSpent - a.totalSpent
        case 'lastVisit':
          return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
        default:
          return 0
      }
    })

  const getTierConfig = (tier: string) => {
    switch (tier) {
      case 'diamond':
        return { 
          color: 'bg-purple-100 text-purple-800', 
          icon: <Crown className="w-3 h-3" />,
          label: 'Diamond'
        }
      case 'vip':
        return { 
          color: 'bg-yellow-100 text-yellow-800', 
          icon: <Star className="w-3 h-3" />,
          label: 'VIP'
        }
      default:
        return { 
          color: 'bg-gray-100 text-gray-800', 
          icon: <User className="w-3 h-3" />,
          label: 'Regular'
        }
    }
  }

  const getLastVisitColor = (lastVisit: string) => {
    const daysSince = Math.floor((Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSince <= 7) return 'text-green-600'
    if (daysSince <= 30) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4">
            <div className="animate-spin w-full h-full border-4 border-green-200 border-t-green-500 rounded-full" />
          </div>
          <p className="text-gray-600">Loading customers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Total Customers"
          value={stats.totalCustomers}
          change={12.5}
          trend="up"
          icon={<Users className="w-5 h-5 text-white" />}
          color="from-blue-500 to-indigo-600"
        />
        
        <MetricCard
          title="New This Month"
          value={stats.newThisMonth}
          change={24.3}
          trend="up"
          icon={<UserPlus className="w-5 h-5 text-white" />}
          color="from-green-500 to-emerald-600"
        />
        
        <MetricCard
          title="VIP Customers"
          value={stats.vipCustomers}
          change={5.1}
          trend="up"
          icon={<Crown className="w-5 h-5 text-white" />}
          color="from-purple-500 to-violet-600"
        />
        
        <MetricCard
          title="Avg Spent"
          value={`$${stats.averageSpent}`}
          change={8.7}
          trend="up"
          icon={<DollarSign className="w-5 h-5 text-white" />}
          color="from-orange-500 to-red-600"
        />
        
        <MetricCard
          title="Retention Rate"
          value={`${stats.retentionRate}%`}
          change={-2.1}
          trend="down"
          icon={<Heart className="w-5 h-5 text-white" />}
          color="from-pink-500 to-rose-600"
        />
        
        <MetricCard
          title="Satisfaction"
          value={stats.satisfaction}
          change={0.3}
          trend="up"
          icon={<ThumbsUp className="w-5 h-5 text-white" />}
          color="from-yellow-500 to-amber-600"
        />
      </div>

      {/* Controls */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tiers</option>
              <option value="regular">Regular</option>
              <option value="vip">VIP</option>
              <option value="diamond">Diamond</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="lastVisit">Last Visit</option>
              <option value="name">Name</option>
              <option value="totalSpent">Total Spent</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="text-xs"
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="text-xs"
              >
                List
              </Button>
            </div>
            
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            
            <GlowButton
              onClick={() => console.log('Add customer')}
              glowColor="rgba(34, 197, 94, 0.4)"
              className="bg-gradient-to-r from-green-500 to-emerald-600"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Customer
            </GlowButton>
          </div>
        </div>
      </Card>

      {/* Customers Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCustomers.map((customer) => {
            const tierConfig = getTierConfig(customer.tier)
            const daysSinceLastVisit = Math.floor((Date.now() - new Date(customer.lastVisit).getTime()) / (1000 * 60 * 60 * 24))
            
            return (
              <Card 
                key={customer.id} 
                className="p-6 cursor-pointer transition-all hover:shadow-xl hover:scale-105 group"
                onClick={() => setSelectedCustomer(customer)}
              >
                {/* Customer Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={customer.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {customer.name}
                      </h3>
                      <p className="text-sm text-gray-500">{customer.email}</p>
                    </div>
                  </div>
                  <Badge className={tierConfig.color}>
                    {tierConfig.icon}
                    <span className="ml-1">{tierConfig.label}</span>
                  </Badge>
                </div>

                {/* Customer Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Spent</p>
                    <p className="font-semibold text-gray-900">
                      $<AnimatedCounter value={customer.totalSpent} />
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Visits</p>
                    <p className="font-semibold text-gray-900">
                      <AnimatedCounter value={customer.visitCount} />
                    </p>
                  </div>
                </div>

                {/* Last Visit */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Last visit:</span>
                    <span className={`font-medium ${getLastVisitColor(customer.lastVisit)}`}>
                      {daysSinceLastVisit === 0 ? 'Today' : 
                       daysSinceLastVisit === 1 ? 'Yesterday' :
                       `${daysSinceLastVisit} days ago`}
                    </span>
                  </div>
                </div>

                {/* Loyalty Points */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Loyalty Points:</span>
                    <div className="flex items-center space-x-1">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium text-yellow-600">
                        <AnimatedCounter value={customer.loyaltyPoints} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Satisfaction */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Satisfaction:</span>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${
                            i < Math.floor(customer.satisfaction) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                      <span className="ml-1 font-medium text-gray-900">
                        {customer.satisfaction}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {customer.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {customer.tags.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{customer.tags.length - 2}
                    </Badge>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </Card>
            )
          })}
        </div>
      ) : (
        // List View
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Visit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Satisfaction
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => {
                  const tierConfig = getTierConfig(customer.tier)
                  const daysSinceLastVisit = Math.floor((Date.now() - new Date(customer.lastVisit).getTime()) / (1000 * 60 * 60 * 24))
                  
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={customer.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                              {customer.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{customer.name}</p>
                            <p className="text-sm text-gray-500">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={tierConfig.color}>
                          {tierConfig.icon}
                          <span className="ml-1">{tierConfig.label}</span>
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${customer.totalSpent.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.visitCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={getLastVisitColor(customer.lastVisit)}>
                          {daysSinceLastVisit === 0 ? 'Today' : 
                           daysSinceLastVisit === 1 ? 'Yesterday' :
                           `${daysSinceLastVisit} days ago`}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${
                                i < Math.floor(customer.satisfaction) 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`} 
                            />
                          ))}
                          <span className="ml-1 text-sm text-gray-900">
                            {customer.satisfaction}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Floating Notification */}
      <FloatingNotification
        show={showNotification}
        message="Customer updated successfully"
        type="success"
        duration={3000}
        onClose={() => setShowNotification(false)}
      />
    </div>
  )
}