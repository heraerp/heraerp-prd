'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  Crown,
  Star,
  Heart,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Gift,
  ShoppingBag,
  TrendingUp,
  Download,
  Upload,
  UserPlus,
  MoreVertical,
  Trash2,
  X,
  RefreshCw,
  CheckCircle,
  DollarSign,
  Clock,
  Award,
  Sparkles
} from 'lucide-react'
import '@/styles/jewelry-glassmorphism.css'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  vipStatus: 'none' | 'silver' | 'gold' | 'platinum' | 'diamond'
  totalSpent: number
  totalOrders: number
  lastOrderDate: string
  joinDate: string
  loyaltyPoints: number
  preferredCategory: string
  notes: string
  birthday?: string
  anniversary?: string
  status: 'active' | 'inactive' | 'blacklisted'
  communicationPrefs: {
    email: boolean
    sms: boolean
    phone: boolean
    whatsapp: boolean
  }
  tags: string[]
}

export default function JewelryCustomersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVipStatus, setSelectedVipStatus] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filterValues, setFilterValues] = useState({
    minSpent: '',
    maxSpent: '',
    minOrders: '',
    maxOrders: '',
    city: 'all',
    country: 'all',
    hasUpcomingEvents: false
  })

  // Mock customer data
  const customers: Customer[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+971 50 123 4567',
      address: '123 Marina Walk',
      city: 'Dubai',
      country: 'UAE',
      vipStatus: 'diamond',
      totalSpent: 125000,
      totalOrders: 23,
      lastOrderDate: '2024-01-15',
      joinDate: '2022-03-10',
      loyaltyPoints: 2500,
      preferredCategory: 'Engagement Rings',
      notes: 'Prefers classic designs, high-value customer',
      birthday: '1985-07-22',
      anniversary: '2020-06-15',
      status: 'active',
      communicationPrefs: { email: true, sms: true, phone: false, whatsapp: true },
      tags: ['High Value', 'Referral Source', 'Anniversary Client']
    },
    {
      id: '2',
      name: 'Ahmed Al-Rashid',
      email: 'ahmed.alrashid@email.com',
      phone: '+971 55 987 6543',
      address: '456 Business Bay',
      city: 'Dubai',
      country: 'UAE',
      vipStatus: 'platinum',
      totalSpent: 78000,
      totalOrders: 15,
      lastOrderDate: '2024-01-12',
      joinDate: '2021-11-20',
      loyaltyPoints: 1560,
      preferredCategory: 'Luxury Watches',
      notes: 'Corporate gifting, bulk orders',
      status: 'active',
      communicationPrefs: { email: true, sms: false, phone: true, whatsapp: false },
      tags: ['Corporate', 'Bulk Orders', 'Watches']
    },
    {
      id: '3',
      name: 'Maria Rodriguez',
      email: 'maria.rodriguez@email.com',
      phone: '+971 52 456 7890',
      address: '789 JBR District',
      city: 'Dubai',
      country: 'UAE',
      vipStatus: 'gold',
      totalSpent: 35000,
      totalOrders: 8,
      lastOrderDate: '2024-01-08',
      joinDate: '2023-01-15',
      loyaltyPoints: 700,
      preferredCategory: 'Necklaces',
      notes: 'Fashion-forward, prefers contemporary designs',
      birthday: '1990-12-03',
      status: 'active',
      communicationPrefs: { email: true, sms: true, phone: false, whatsapp: true },
      tags: ['Fashion Forward', 'Social Media']
    },
    {
      id: '4',
      name: 'Jennifer Chen',
      email: 'jennifer.chen@email.com',
      phone: '+971 56 234 5678',
      address: '321 Downtown Dubai',
      city: 'Dubai',
      country: 'UAE',
      vipStatus: 'silver',
      totalSpent: 18000,
      totalOrders: 5,
      lastOrderDate: '2023-12-20',
      joinDate: '2023-06-08',
      loyaltyPoints: 360,
      preferredCategory: 'Earrings',
      notes: 'Young professional, price-conscious',
      status: 'active',
      communicationPrefs: { email: true, sms: true, phone: false, whatsapp: false },
      tags: ['Young Professional', 'Price Conscious']
    },
    {
      id: '5',
      name: 'Robert Thompson',
      email: 'robert.thompson@email.com',
      phone: '+971 50 876 5432',
      address: '654 Palm Jumeirah',
      city: 'Dubai',
      country: 'UAE',
      vipStatus: 'platinum',
      totalSpent: 95000,
      totalOrders: 12,
      lastOrderDate: '2024-01-10',
      joinDate: '2022-08-25',
      loyaltyPoints: 1900,
      preferredCategory: 'Cufflinks',
      notes: 'Executive client, prefers understated luxury',
      anniversary: '2018-09-12',
      status: 'active',
      communicationPrefs: { email: true, sms: false, phone: true, whatsapp: false },
      tags: ['Executive', 'Understated Luxury', 'Male Client']
    },
    {
      id: '6',
      name: 'Lisa Williams',
      email: 'lisa.williams@email.com',
      phone: '+971 55 345 6789',
      address: '987 Al Barsha',
      city: 'Dubai',
      country: 'UAE',
      vipStatus: 'none',
      totalSpent: 5000,
      totalOrders: 2,
      lastOrderDate: '2023-11-15',
      joinDate: '2023-10-01',
      loyaltyPoints: 100,
      preferredCategory: 'Bracelets',
      notes: 'New customer, potential for growth',
      status: 'active',
      communicationPrefs: { email: true, sms: false, phone: false, whatsapp: true },
      tags: ['New Customer', 'Growth Potential']
    }
  ]

  const vipStatuses = ['all', 'none', 'silver', 'gold', 'platinum', 'diamond']
  const statuses = ['all', 'active', 'inactive', 'blacklisted']
  const cities = ['all', 'Dubai', 'Abu Dhabi', 'Sharjah', 'London', 'New York']
  const countries = ['all', 'UAE', 'UK', 'USA', 'Canada', 'Australia']

  // Calculate summary metrics
  const totalCustomers = customers.length
  const activeCustomers = customers.filter(c => c.status === 'active').length
  const vipCustomers = customers.filter(c => c.vipStatus !== 'none').length
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)
  const averageOrderValue = totalRevenue / customers.reduce((sum, c) => sum + c.totalOrders, 0)

  // Enhanced filtering
  const filteredCustomers = customers
    .filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.phone.includes(searchTerm)
      const matchesVipStatus = selectedVipStatus === 'all' || customer.vipStatus === selectedVipStatus
      const matchesStatus = selectedStatus === 'all' || customer.status === selectedStatus
      
      // Advanced filters
      const matchesMinSpent = !filterValues.minSpent || customer.totalSpent >= parseFloat(filterValues.minSpent)
      const matchesMaxSpent = !filterValues.maxSpent || customer.totalSpent <= parseFloat(filterValues.maxSpent)
      const matchesMinOrders = !filterValues.minOrders || customer.totalOrders >= parseInt(filterValues.minOrders)
      const matchesMaxOrders = !filterValues.maxOrders || customer.totalOrders <= parseInt(filterValues.maxOrders)
      const matchesCity = filterValues.city === 'all' || customer.city === filterValues.city
      const matchesCountry = filterValues.country === 'all' || customer.country === filterValues.country
      
      // Upcoming events filter
      const hasUpcomingEvents = filterValues.hasUpcomingEvents ? 
        (customer.birthday || customer.anniversary) : true

      return matchesSearch && matchesVipStatus && matchesStatus && 
             matchesMinSpent && matchesMaxSpent && matchesMinOrders && 
             matchesMaxOrders && matchesCity && matchesCountry && hasUpcomingEvents
    })
    .sort((a, b) => {
      const direction = sortOrder === 'asc' ? 1 : -1
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name) * direction
        case 'totalSpent':
          return (a.totalSpent - b.totalSpent) * direction
        case 'totalOrders':
          return (a.totalOrders - b.totalOrders) * direction
        case 'joinDate':
          return (new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime()) * direction
        case 'lastOrder':
          return (new Date(a.lastOrderDate).getTime() - new Date(b.lastOrderDate).getTime()) * direction
        default:
          return 0
      }
    })

  const getVipIcon = (vipStatus: string) => {
    switch (vipStatus) {
      case 'diamond': return <Crown className="jewelry-icon-gold" size={16} />
      case 'platinum': return <Star className="jewelry-icon-gold" size={16} />
      case 'gold': return <Award className="jewelry-icon-gold" size={16} />
      case 'silver': return <Sparkles className="jewelry-icon-gold" size={16} />
      default: return null
    }
  }

  const getVipColor = (vipStatus: string) => {
    switch (vipStatus) {
      case 'diamond': return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30'
      case 'platinum': return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30'
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30'
      case 'silver': return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30'
      default: return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/30'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'jewelry-status-active'
      case 'inactive': return 'jewelry-status-pending'
      case 'blacklisted': return 'jewelry-status-inactive'
      default: return 'jewelry-status-inactive'
    }
  }

  // Bulk operations functions
  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([])
    } else {
      setSelectedCustomers(filteredCustomers.map(customer => customer.id))
    }
  }

  const clearSelection = () => {
    setSelectedCustomers([])
  }

  const handleBulkDelete = () => {
    if (selectedCustomers.length === 0) return
    if (confirm(`Are you sure you want to delete ${selectedCustomers.length} customers?`)) {
      console.log('Bulk delete:', selectedCustomers)
      setSelectedCustomers([])
    }
  }

  const handleBulkExport = () => {
    if (selectedCustomers.length === 0) return
    console.log('Bulk export:', selectedCustomers)
  }

  const handleBulkStatusUpdate = (newStatus: string) => {
    if (selectedCustomers.length === 0) return
    console.log('Bulk status update:', selectedCustomers, newStatus)
    setSelectedCustomers([])
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedVipStatus('all')
    setSelectedStatus('all')
    setFilterValues({
      minSpent: '',
      maxSpent: '',
      minOrders: '',
      maxOrders: '',
      city: 'all',
      country: 'all',
      hasUpcomingEvents: false
    })
  }

  // Update bulk actions visibility
  React.useEffect(() => {
    setShowBulkActions(selectedCustomers.length > 0)
  }, [selectedCustomers])

  return (
    <div className="min-h-screen jewelry-gradient-premium">
      <div className="jewelry-glass-backdrop min-h-screen">
        <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
          
          {/* Page Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="jewelry-heading text-4xl md:text-5xl mb-4">
              <Users className="inline-block mr-3 mb-2 jewelry-icon-gold" size={48} />
              Customer Management
            </h1>
            <p className="jewelry-text-luxury text-lg md:text-xl">
              Comprehensive CRM for luxury jewelry clientele
            </p>
          </motion.div>

          {/* Summary Metrics */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
          >
            <div className="jewelry-glass-card jewelry-float p-6 text-center">
              <Users className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">{totalCustomers}</h3>
              <p className="jewelry-text-muted text-sm font-medium">Total Customers</p>
            </div>
            
            <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.1s' }}>
              <CheckCircle className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">{activeCustomers}</h3>
              <p className="jewelry-text-muted text-sm font-medium">Active Customers</p>
            </div>
            
            <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.2s' }}>
              <Crown className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">{vipCustomers}</h3>
              <p className="jewelry-text-muted text-sm font-medium">VIP Members</p>
            </div>
            
            <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.3s' }}>
              <DollarSign className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">${totalRevenue.toLocaleString()}</h3>
              <p className="jewelry-text-muted text-sm font-medium">Total Revenue</p>
            </div>
            
            <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.4s' }}>
              <TrendingUp className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">${averageOrderValue.toLocaleString()}</h3>
              <p className="jewelry-text-muted text-sm font-medium">Avg Order Value</p>
            </div>
          </motion.div>

          {/* Bulk Actions Bar */}
          {showBulkActions && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="jewelry-glass-panel-strong border-l-4 border-jewelry-gold-500"
            >
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="jewelry-text-high-contrast font-semibold">
                    {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? 's' : ''} selected
                  </span>
                  <button 
                    onClick={clearSelection}
                    className="jewelry-btn-secondary text-sm px-3 py-1"
                  >
                    Clear Selection
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={handleBulkExport}
                    className="jewelry-btn-secondary flex items-center space-x-2 px-3 py-2 text-sm"
                  >
                    <Download className="jewelry-icon-gold" size={16} />
                    <span>Export Selected</span>
                  </button>
                  
                  <select
                    onChange={(e) => handleBulkStatusUpdate(e.target.value)}
                    className="jewelry-input text-sm"
                    defaultValue=""
                  >
                    <option value="" disabled>Update Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="blacklisted">Blacklisted</option>
                  </select>
                  
                  <button 
                    onClick={handleBulkDelete}
                    className="jewelry-btn-secondary flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="jewelry-icon-gold" size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="jewelry-glass-panel"
          >
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 items-center flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 jewelry-icon-gold" size={20} />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="jewelry-input pl-10 w-64"
                  />
                </div>
                
                <select
                  value={selectedVipStatus}
                  onChange={(e) => setSelectedVipStatus(e.target.value)}
                  className="jewelry-input"
                >
                  {vipStatuses.map(status => (
                    <option key={status} value={status}>
                      {status === 'all' ? 'All VIP Levels' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
                
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="jewelry-input"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`jewelry-btn-secondary flex items-center space-x-2 px-4 py-2 ${showAdvancedFilters ? 'bg-jewelry-gold-500/20' : ''}`}
                >
                  <Filter className="jewelry-icon-gold" size={18} />
                  <span>Advanced</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button 
                  onClick={toggleSelectAll}
                  className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2"
                >
                  <CheckCircle className="jewelry-icon-gold" size={18} />
                  <span>{selectedCustomers.length === filteredCustomers.length ? 'Deselect All' : 'Select All'}</span>
                </button>
                <button className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2">
                  <Download className="jewelry-icon-gold" size={18} />
                  <span>Export</span>
                </button>
                <button className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2">
                  <Upload className="jewelry-icon-gold" size={18} />
                  <span>Import</span>
                </button>
                <button className="jewelry-btn-primary flex items-center space-x-2 px-4 py-2">
                  <UserPlus className="jewelry-icon-gold" size={18} />
                  <span>Add Customer</span>
                </button>
              </div>
            </div>

            {/* Sort and View Options */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mt-4 pt-4 border-t border-jewelry-blue-200">
              <div className="flex items-center space-x-4">
                <span className="jewelry-text-luxury text-sm font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="jewelry-input text-sm"
                >
                  <option value="name">Name</option>
                  <option value="totalSpent">Total Spent</option>
                  <option value="totalOrders">Total Orders</option>
                  <option value="joinDate">Join Date</option>
                  <option value="lastOrder">Last Order</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="jewelry-btn-secondary p-2"
                >
                  {sortOrder === 'asc' ? <TrendingUp className="jewelry-icon-gold" size={16} /> : <TrendingUp className="jewelry-icon-gold rotate-180" size={16} />}
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <span className="jewelry-text-luxury text-sm font-medium">View:</span>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'jewelry-btn-primary' : 'jewelry-btn-secondary'}`}
                >
                  <Users size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'jewelry-btn-primary' : 'jewelry-btn-secondary'}`}
                >
                  <CheckCircle size={16} />
                </button>
              </div>
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 pt-4 border-t border-jewelry-blue-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Spending Range */}
                  <div className="space-y-2">
                    <label className="jewelry-text-luxury text-sm font-medium">Total Spent ($)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filterValues.minSpent}
                        onChange={(e) => setFilterValues(prev => ({ ...prev, minSpent: e.target.value }))}
                        className="jewelry-input text-sm flex-1"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filterValues.maxSpent}
                        onChange={(e) => setFilterValues(prev => ({ ...prev, maxSpent: e.target.value }))}
                        className="jewelry-input text-sm flex-1"
                      />
                    </div>
                  </div>

                  {/* Order Count Range */}
                  <div className="space-y-2">
                    <label className="jewelry-text-luxury text-sm font-medium">Total Orders</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filterValues.minOrders}
                        onChange={(e) => setFilterValues(prev => ({ ...prev, minOrders: e.target.value }))}
                        className="jewelry-input text-sm flex-1"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filterValues.maxOrders}
                        onChange={(e) => setFilterValues(prev => ({ ...prev, maxOrders: e.target.value }))}
                        className="jewelry-input text-sm flex-1"
                      />
                    </div>
                  </div>

                  {/* Location Filters */}
                  <div className="space-y-2">
                    <label className="jewelry-text-luxury text-sm font-medium">City</label>
                    <select
                      value={filterValues.city}
                      onChange={(e) => setFilterValues(prev => ({ ...prev, city: e.target.value }))}
                      className="jewelry-input text-sm w-full"
                    >
                      {cities.map(city => (
                        <option key={city} value={city}>
                          {city === 'all' ? 'All Cities' : city}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Country Filter */}
                  <div className="space-y-2">
                    <label className="jewelry-text-luxury text-sm font-medium">Country</label>
                    <select
                      value={filterValues.country}
                      onChange={(e) => setFilterValues(prev => ({ ...prev, country: e.target.value }))}
                      className="jewelry-input text-sm w-full"
                    >
                      {countries.map(country => (
                        <option key={country} value={country}>
                          {country === 'all' ? 'All Countries' : country}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Special Filters */}
                  <div className="space-y-2">
                    <label className="jewelry-text-luxury text-sm font-medium">Special Filters</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filterValues.hasUpcomingEvents}
                        onChange={(e) => setFilterValues(prev => ({ ...prev, hasUpcomingEvents: e.target.checked }))}
                        className="jewelry-checkbox"
                      />
                      <span className="jewelry-text-high-contrast text-sm">Has upcoming events</span>
                    </div>
                  </div>

                  {/* Filter Actions */}
                  <div className="space-y-2">
                    <label className="jewelry-text-luxury text-sm font-medium">Actions</label>
                    <div className="flex gap-2">
                      <button
                        onClick={clearAllFilters}
                        className="jewelry-btn-secondary flex items-center space-x-2 px-3 py-2 text-sm flex-1"
                      >
                        <RefreshCw className="jewelry-icon-gold" size={16} />
                        <span>Clear All</span>
                      </button>
                      <button
                        onClick={() => setShowAdvancedFilters(false)}
                        className="jewelry-btn-secondary p-2"
                      >
                        <X className="jewelry-icon-gold" size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Customer Grid/List */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="jewelry-glass-panel"
          >
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCustomers.map((customer, index) => (
                  <motion.div
                    key={customer.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`jewelry-glass-card jewelry-scale-hover p-6 relative ${selectedCustomers.includes(customer.id) ? 'ring-2 ring-jewelry-gold-500/50' : ''}`}
                  >
                    {/* Selection Checkbox */}
                    <div className="absolute top-4 left-4">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={() => toggleCustomerSelection(customer.id)}
                        className="jewelry-checkbox"
                      />
                    </div>

                    {/* VIP Badge */}
                    {customer.vipStatus !== 'none' && (
                      <div className="absolute top-4 right-4">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getVipColor(customer.vipStatus)}`}>
                          {getVipIcon(customer.vipStatus)}
                          {customer.vipStatus.charAt(0).toUpperCase() + customer.vipStatus.slice(1)}
                        </div>
                      </div>
                    )}

                    {/* Customer Header */}
                    <div className="mb-4 ml-8">
                      <h3 className="jewelry-text-high-contrast font-semibold text-lg mb-1">{customer.name}</h3>
                      <p className="jewelry-text-muted text-sm">{customer.email}</p>
                      <p className="jewelry-text-muted text-sm">{customer.phone}</p>
                    </div>

                    {/* Customer Details */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="jewelry-text-muted text-sm">Total Spent:</span>
                        <span className="jewelry-text-high-contrast text-sm font-bold">${customer.totalSpent.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="jewelry-text-muted text-sm">Orders:</span>
                        <span className="jewelry-text-high-contrast text-sm font-medium">{customer.totalOrders}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="jewelry-text-muted text-sm">Loyalty Points:</span>
                        <span className="jewelry-text-high-contrast text-sm font-medium">{customer.loyaltyPoints}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="jewelry-text-muted text-sm">Preferred:</span>
                        <span className="jewelry-text-high-contrast text-sm font-medium">{customer.preferredCategory}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="jewelry-text-muted text-sm">Status:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(customer.status)}`}>
                          {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-jewelry-blue-200">
                        <span className="jewelry-text-muted text-sm">Last Order:</span>
                        <span className="jewelry-text-high-contrast text-sm">{new Date(customer.lastOrderDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {customer.tags && customer.tags.length > 0 && (
                      <div className="mt-4">
                        <div className="flex flex-wrap gap-1">
                          {customer.tags.slice(0, 2).map((tag) => (
                            <span 
                              key={tag}
                              className="text-xs jewelry-text-muted bg-white/5 px-2 py-1 rounded-md"
                            >
                              {tag}
                            </span>
                          ))}
                          {customer.tags.length > 2 && (
                            <span className="text-xs jewelry-text-muted">
                              +{customer.tags.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Customer Actions */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-jewelry-blue-200">
                      <div className="flex items-center space-x-1">
                        <MapPin className="jewelry-icon-gold" size={14} />
                        <span className="jewelry-text-muted text-xs">{customer.city}, {customer.country}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 rounded jewelry-btn-secondary hover:scale-105 transition-transform">
                          <Eye className="jewelry-icon-gold" size={16} />
                        </button>
                        <button className="p-2 rounded jewelry-btn-secondary hover:scale-105 transition-transform">
                          <Edit className="jewelry-icon-gold" size={16} />
                        </button>
                        <button className="p-2 rounded jewelry-btn-secondary hover:scale-105 transition-transform">
                          <MoreVertical className="jewelry-icon-gold" size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-2">
                {/* List Header */}
                <div className="grid grid-cols-12 gap-4 p-4 jewelry-glass-card-subtle">
                  <div className="col-span-1 jewelry-text-luxury text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                      onChange={toggleSelectAll}
                      className="jewelry-checkbox"
                    />
                  </div>
                  <div className="col-span-3 jewelry-text-luxury text-sm font-semibold">Customer</div>
                  <div className="col-span-2 jewelry-text-luxury text-sm font-semibold">Contact</div>
                  <div className="col-span-1 jewelry-text-luxury text-sm font-semibold">VIP Level</div>
                  <div className="col-span-2 jewelry-text-luxury text-sm font-semibold">Total Spent</div>
                  <div className="col-span-1 jewelry-text-luxury text-sm font-semibold">Orders</div>
                  <div className="col-span-1 jewelry-text-luxury text-sm font-semibold">Status</div>
                  <div className="col-span-1 jewelry-text-luxury text-sm font-semibold">Actions</div>
                </div>

                {/* List Items */}
                {filteredCustomers.map((customer, index) => (
                  <motion.div
                    key={customer.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`grid grid-cols-12 gap-4 p-4 jewelry-glass-card hover:scale-[1.01] transition-transform ${selectedCustomers.includes(customer.id) ? 'ring-2 ring-jewelry-gold-500/50' : ''}`}
                  >
                    <div className="col-span-1">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={() => toggleCustomerSelection(customer.id)}
                        className="jewelry-checkbox"
                      />
                    </div>
                    <div className="col-span-3">
                      <h3 className="jewelry-text-high-contrast font-medium">{customer.name}</h3>
                      <p className="jewelry-text-muted text-sm">{customer.city}, {customer.country}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="jewelry-text-high-contrast text-sm">{customer.email}</p>
                      <p className="jewelry-text-muted text-sm">{customer.phone}</p>
                    </div>
                    <div className="col-span-1">
                      {customer.vipStatus !== 'none' ? (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border w-fit ${getVipColor(customer.vipStatus)}`}>
                          {getVipIcon(customer.vipStatus)}
                          {customer.vipStatus.charAt(0).toUpperCase() + customer.vipStatus.slice(1)}
                        </div>
                      ) : (
                        <span className="text-xs jewelry-text-muted">Regular</span>
                      )}
                    </div>
                    <div className="col-span-2 jewelry-text-high-contrast font-bold">${customer.totalSpent.toLocaleString()}</div>
                    <div className="col-span-1 jewelry-text-high-contrast font-medium">{customer.totalOrders}</div>
                    <div className="col-span-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(customer.status)}`}>
                        {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                      </span>
                    </div>
                    <div className="col-span-1 flex items-center space-x-1">
                      <button className="p-1 rounded jewelry-btn-secondary hover:scale-105 transition-transform">
                        <Eye className="jewelry-icon-gold" size={14} />
                      </button>
                      <button className="p-1 rounded jewelry-btn-secondary hover:scale-105 transition-transform">
                        <Edit className="jewelry-icon-gold" size={14} />
                      </button>
                      <button className="p-1 rounded jewelry-btn-secondary hover:scale-105 transition-transform">
                        <MoreVertical className="jewelry-icon-gold" size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto mb-4 jewelry-icon-gold opacity-50" size={64} />
                <h3 className="jewelry-text-luxury text-xl font-semibold mb-2">No Customers Found</h3>
                <p className="jewelry-text-muted">Try adjusting your search criteria or add new customers.</p>
              </div>
            )}
          </motion.div>

          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-center mt-12 mb-6"
          >
            <p className="text-jewelry-platinum-500 text-sm">
              Professional customer relationship management powered by <span className="jewelry-text-luxury font-semibold">HERA Jewelry System</span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}