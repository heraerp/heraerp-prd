'use client'
/**
 * Services Management System
 * Smart Code: HERA.SALON.SERVICES.MANAGEMENT.v1
 * 
 * Complete CRUD system for salon services and categories
 * Features:
 * - Service Categories CRUD (Hair, Spa, Nails, etc.)
 * - Services CRUD with category assignment
 * - Advanced filtering and search
 * - Bulk operations and export
 * - Enterprise-grade UI with glassmorphism
 * - HERA Universal 6-table architecture
 */

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Plus,
  Search, 
  Filter, 
  Edit,
  Trash2,
  Download,
  Upload,
  X,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Scissors,
  Sparkles,
  Palette,
  Crown,
  Gem,
  Zap,
  Clock,
  DollarSign,
  Tag,
  Grid3X3,
  List,
  Eye,
  Users,
  TrendingUp,
  Save,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ----------------------------- Types & Interfaces ------------------------------------

interface ServiceCategory {
  id: string
  name: string
  description: string
  color: string
  icon: string
  active: boolean
  serviceCount: number
  createdAt: Date
  updatedAt: Date
}

interface Service {
  id: string
  name: string
  description: string
  categoryId: string
  categoryName: string
  duration: number // minutes
  price: number // AED
  cost: number // cost basis
  active: boolean
  popular: boolean
  online: boolean // bookable online
  staffRequired: number
  tags: string[]
  instructions: string
  aftercare: string
  createdAt: Date
  updatedAt: Date
}

interface ServiceFormData {
  name: string
  description: string
  categoryId: string
  duration: number
  price: number
  cost: number
  active: boolean
  popular: boolean
  online: boolean
  staffRequired: number
  tags: string
  instructions: string
  aftercare: string
}

interface CategoryFormData {
  name: string
  description: string
  color: string
  icon: string
  active: boolean
}

// ----------------------------- Mock Data ------------------------------------

const mockCategories: ServiceCategory[] = [
  {
    id: '1',
    name: 'Hair Services',
    description: 'Professional hair cutting, styling, and treatments',
    color: '#8B5CF6',
    icon: 'Scissors',
    active: true,
    serviceCount: 12,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-20')
  },
  {
    id: '2', 
    name: 'Spa Treatments',
    description: 'Relaxing facial and body treatments',
    color: '#10B981',
    icon: 'Sparkles',
    active: true,
    serviceCount: 8,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-02-18')
  },
  {
    id: '3',
    name: 'Nail Care',
    description: 'Manicure and pedicure services',
    color: '#F59E0B',
    icon: 'Palette',
    active: true,
    serviceCount: 6,
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-02-15')
  },
  {
    id: '4',
    name: 'Premium Services',
    description: 'Luxury treatments and VIP services',
    color: '#EC4899',
    icon: 'Crown',
    active: true,
    serviceCount: 4,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-10')
  }
]

const mockServices: Service[] = [
  {
    id: '1',
    name: 'Premium Cut & Style',
    description: 'Professional haircut with personalized styling consultation',
    categoryId: '1',
    categoryName: 'Hair Services',
    duration: 90,
    price: 180,
    cost: 45,
    active: true,
    popular: true,
    online: true,
    staffRequired: 1,
    tags: ['premium', 'consultation', 'styling'],
    instructions: 'Discuss desired look before starting. Include wash and blow-dry.',
    aftercare: 'Use recommended products for best results. Book follow-up in 6-8 weeks.',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-20')
  },
  {
    id: '2',
    name: 'Brazilian Blowout',
    description: 'Professional keratin treatment for smooth, frizz-free hair',
    categoryId: '1',
    categoryName: 'Hair Services',
    duration: 180,
    price: 450,
    cost: 120,
    active: true,
    popular: true,
    online: true,
    staffRequired: 1,
    tags: ['treatment', 'keratin', 'smoothing'],
    instructions: 'Shampoo with clarifying shampoo. Apply treatment section by section.',
    aftercare: 'Do not wash hair for 72 hours. Use sulfate-free products only.',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-02-18')
  },
  {
    id: '3',
    name: 'Signature Facial',
    description: 'Customized facial treatment with premium products',
    categoryId: '2',
    categoryName: 'Spa Treatments',
    duration: 75,
    price: 220,
    cost: 55,
    active: true,
    popular: false,
    online: true,
    staffRequired: 1,
    tags: ['facial', 'customized', 'premium'],
    instructions: 'Skin analysis first. Customize treatment based on skin type.',
    aftercare: 'Avoid sun exposure for 24 hours. Apply recommended moisturizer.',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-02-15')
  }
]

// ----------------------------- Main Component ------------------------------------

export default function ServicesManagement() {
  // ----------------------------- State Management ------------------------------------
  const [activeTab, setActiveTab] = useState<'services' | 'categories'>('services')
  const [services, setServices] = useState<Service[]>(mockServices)
  const [categories, setCategories] = useState<ServiceCategory[]>(mockCategories)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [showInactiveServices, setShowInactiveServices] = useState(false)
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'duration' | 'popularity'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  
  const [serviceForm, setServiceForm] = useState<ServiceFormData>({
    name: '',
    description: '',
    categoryId: '',
    duration: 60,
    price: 0,
    cost: 0,
    active: true,
    popular: false,
    online: true,
    staffRequired: 1,
    tags: '',
    instructions: '',
    aftercare: ''
  })

  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: '#8B5CF6',
    icon: 'Scissors',
    active: true
  })

  // ----------------------------- Computed Values ------------------------------------
  const filteredServices = useMemo(() => {
    let filtered = services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           service.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = !selectedCategory || service.categoryId === selectedCategory
      const matchesStatus = showInactiveServices || service.active
      
      return matchesSearch && matchesCategory && matchesStatus
    })

    // Sort services
    filtered.sort((a, b) => {
      let aVal: any, bVal: any
      switch (sortBy) {
        case 'price':
          aVal = a.price
          bVal = b.price
          break
        case 'duration':
          aVal = a.duration
          bVal = b.duration
          break
        case 'popularity':
          aVal = a.popular ? 1 : 0
          bVal = b.popular ? 1 : 0
          break
        default:
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return filtered
  }, [services, searchQuery, selectedCategory, showInactiveServices, sortBy, sortOrder])

  const filteredCategories = useMemo(() => {
    return categories.filter(category => 
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [categories, searchQuery])

  // ----------------------------- Event Handlers ------------------------------------
  const handleServiceSave = () => {
    const newService: Service = {
      id: editingService?.id || Date.now().toString(),
      ...serviceForm,
      categoryName: categories.find(c => c.id === serviceForm.categoryId)?.name || '',
      tags: serviceForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      createdAt: editingService?.createdAt || new Date(),
      updatedAt: new Date()
    }

    if (editingService) {
      setServices(prev => prev.map(s => s.id === editingService.id ? newService : s))
    } else {
      setServices(prev => [...prev, newService])
    }

    setShowServiceForm(false)
    setEditingService(null)
    setServiceForm({
      name: '',
      description: '',
      categoryId: '',
      duration: 60,
      price: 0,
      cost: 0,
      active: true,
      popular: false,
      online: true,
      staffRequired: 1,
      tags: '',
      instructions: '',
      aftercare: ''
    })
  }

  const handleServiceEdit = (service: Service) => {
    setEditingService(service)
    setServiceForm({
      name: service.name,
      description: service.description,
      categoryId: service.categoryId,
      duration: service.duration,
      price: service.price,
      cost: service.cost,
      active: service.active,
      popular: service.popular,
      online: service.online,
      staffRequired: service.staffRequired,
      tags: service.tags.join(', '),
      instructions: service.instructions,
      aftercare: service.aftercare
    })
    setShowServiceForm(true)
  }

  const handleServiceDelete = (serviceId: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      setServices(prev => prev.filter(s => s.id !== serviceId))
    }
  }

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedServices.length === 0) return

    if (action === 'delete') {
      if (confirm(`Are you sure you want to delete ${selectedServices.length} services?`)) {
        setServices(prev => prev.filter(s => !selectedServices.includes(s.id)))
        setSelectedServices([])
      }
    } else {
      const isActive = action === 'activate'
      setServices(prev => prev.map(s => 
        selectedServices.includes(s.id) ? { ...s, active: isActive, updatedAt: new Date() } : s
      ))
      setSelectedServices([])
    }
  }

  // ----------------------------- Category Event Handlers ------------------------------------
  const handleCategorySave = () => {
    const newCategory: ServiceCategory = {
      id: editingCategory?.id || Date.now().toString(),
      ...categoryForm,
      serviceCount: editingCategory?.serviceCount || 0,
      createdAt: editingCategory?.createdAt || new Date(),
      updatedAt: new Date()
    }

    if (editingCategory) {
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? newCategory : c))
    } else {
      setCategories(prev => [...prev, newCategory])
    }

    setShowCategoryForm(false)
    setEditingCategory(null)
    setCategoryForm({
      name: '',
      description: '',
      color: '#8B5CF6',
      icon: 'Scissors',
      active: true
    })
  }

  const handleCategoryEdit = (category: ServiceCategory) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      active: category.active
    })
    setShowCategoryForm(true)
  }

  const handleCategoryDelete = (categoryId: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      setCategories(prev => prev.filter(c => c.id !== categoryId))
      // Also update services that were using this category
      setServices(prev => prev.map(s => 
        s.categoryId === categoryId 
          ? { ...s, categoryId: '', categoryName: '', updatedAt: new Date() }
          : s
      ))
    }
  }

  // ----------------------------- Render ------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-900 dark:to-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-20 px-6 py-4 mb-0 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-[1600px] mx-auto">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Services Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your salon services, categories, and pricing
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => {/* Export logic */}}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            
            <Button
              onClick={() => setShowServiceForm(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Service
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 py-4">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
            <Button
              variant={activeTab === 'services' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('services')}
              className={cn(
                'px-6 py-2 rounded-md transition-all duration-200',
                activeTab === 'services' 
                  ? 'bg-white dark:bg-gray-700 shadow-sm' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              <Scissors className="w-4 h-4 mr-2" />
              Services ({filteredServices.length})
            </Button>
            <Button
              variant={activeTab === 'categories' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('categories')}
              className={cn(
                'px-6 py-2 rounded-md transition-all duration-200',
                activeTab === 'categories' 
                  ? 'bg-white dark:bg-gray-700 shadow-sm' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              <Grid3X3 className="w-4 h-4 mr-2" />
              Categories ({filteredCategories.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-6 pb-6">
        <div className="max-w-[1600px] mx-auto">
          <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-xl">
            {activeTab === 'services' ? (
              <div>
                {/* Services Controls */}
                <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full lg:w-auto">
                      {/* Search */}
                      <div className="relative flex-1 lg:flex-none">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Search services..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 lg:w-64 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900"
                        />
                      </div>

                      {/* Category Filter */}
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white dark:focus:bg-gray-900"
                      >
                        <option value="">All Categories</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>

                      {/* Show Inactive Toggle */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={showInactiveServices}
                          onCheckedChange={setShowInactiveServices}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Show inactive
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* View Mode Toggle */}
                      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        <Button
                          variant={viewMode === 'grid' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('grid')}
                        >
                          <Grid3X3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={viewMode === 'table' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('table')}
                        >
                          <List className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Sort Controls */}
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm focus:bg-white dark:focus:bg-gray-900"
                      >
                        <option value="name">Sort by Name</option>
                        <option value="price">Sort by Price</option>
                        <option value="duration">Sort by Duration</option>
                        <option value="popularity">Sort by Popularity</option>
                      </select>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      >
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Bulk Actions */}
                  {selectedServices.length > 0 && (
                    <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mt-4">
                      <span className="text-sm text-purple-700 dark:text-purple-300">
                        {selectedServices.length} services selected
                      </span>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')}>
                          Activate
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleBulkAction('deactivate')}>
                          Deactivate
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleBulkAction('delete')} className="text-red-600">
                          Delete
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedServices([])}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardHeader>

                {/* Services Content */}
                <CardContent className="p-6">
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredServices.map((service) => (
                        <div
                          key={service.id}
                          className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-purple-200 dark:hover:border-purple-600"
                        >
                          {/* Selection Checkbox */}
                          <div className="absolute top-4 left-4">
                            <Checkbox
                              checked={selectedServices.includes(service.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedServices(prev => [...prev, service.id])
                                } else {
                                  setSelectedServices(prev => prev.filter(id => id !== service.id))
                                }
                              }}
                            />
                          </div>

                          {/* Status and Popular Badges */}
                          <div className="absolute top-4 right-4 flex gap-2">
                            {service.popular && (
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 text-xs">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Popular
                              </Badge>
                            )}
                            <Badge
                              className={cn(
                                "text-xs",
                                service.active
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200"
                              )}
                            >
                              {service.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>

                          {/* Service Details */}
                          <div className="mt-8">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                              {service.name}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                              {service.description}
                            </p>
                            
                            {/* Category */}
                            <div className="flex items-center gap-2 mb-4">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: categories.find(c => c.id === service.categoryId)?.color }}
                              />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {service.categoryName}
                              </span>
                            </div>

                            {/* Metrics */}
                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{service.duration}m</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{service.staffRequired}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  AED {service.price}
                                </span>
                              </div>
                            </div>

                            {/* Tags */}
                            {service.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-4">
                                {service.tags.slice(0, 3).map((tag, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs px-2 py-1"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {service.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs px-2 py-1">
                                    +{service.tags.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleServiceEdit(service)}
                                className="flex-1"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleServiceDelete(service.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                              <Checkbox
                                checked={selectedServices.length === filteredServices.length && filteredServices.length > 0}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedServices(filteredServices.map(s => s.id))
                                  } else {
                                    setSelectedServices([])
                                  }
                                }}
                              />
                            </th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Service</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Category</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Duration</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Price</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredServices.map((service) => (
                            <tr
                              key={service.id}
                              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            >
                              <td className="py-4 px-4">
                                <Checkbox
                                  checked={selectedServices.includes(service.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedServices(prev => [...prev, service.id])
                                    } else {
                                      setSelectedServices(prev => prev.filter(id => id !== service.id))
                                    }
                                  }}
                                />
                              </td>
                              <td className="py-4 px-4">
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {service.name}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                    {service.description}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: categories.find(c => c.id === service.categoryId)?.color }}
                                  />
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {service.categoryName}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                                {service.duration}m
                              </td>
                              <td className="py-4 px-4 text-sm font-medium text-gray-900 dark:text-white">
                                AED {service.price}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    className={cn(
                                      "text-xs",
                                      service.active
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                                        : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200"
                                    )}
                                  >
                                    {service.active ? 'Active' : 'Inactive'}
                                  </Badge>
                                  {service.popular && (
                                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 text-xs">
                                      Popular
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2 justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleServiceEdit(service)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleServiceDelete(service.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Empty State */}
                  {filteredServices.length === 0 && (
                    <div className="text-center py-24">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/20 mb-6">
                        <Scissors className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No services found
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                        {searchQuery || selectedCategory
                          ? 'Try adjusting your search or filters'
                          : 'Create your first service to get started'
                        }
                      </p>
                      {!searchQuery && !selectedCategory && (
                        <Button
                          onClick={() => setShowServiceForm(true)}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Service
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </div>
            ) : (
              /* Categories Tab */
              <div>
                <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">Service Categories</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Organize your services into categories
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="relative flex-1 sm:flex-none">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Search categories..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 sm:w-64 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900"
                        />
                      </div>
                      
                      <Button
                        onClick={() => setShowCategoryForm(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Category
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCategories.map((category) => (
                      <div
                        key={category.id}
                        className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200"
                        style={{ borderTopColor: category.color, borderTopWidth: '4px' }}
                      >
                        {/* Category Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${category.color}20` }}
                            >
                              {category.icon === 'Scissors' && <Scissors className="w-5 h-5" style={{ color: category.color }} />}
                              {category.icon === 'Sparkles' && <Sparkles className="w-5 h-5" style={{ color: category.color }} />}
                              {category.icon === 'Palette' && <Palette className="w-5 h-5" style={{ color: category.color }} />}
                              {category.icon === 'Crown' && <Crown className="w-5 h-5" style={{ color: category.color }} />}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {category.name}
                              </h3>
                              <Badge
                                className={cn(
                                  "text-xs mt-1",
                                  category.active
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200"
                                )}
                              >
                                {category.active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                          {category.description}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-6">
                          <div className="flex items-center gap-1">
                            <Scissors className="w-4 h-4" />
                            <span>{category.serviceCount} services</span>
                          </div>
                          <span className="text-xs">
                            Updated {category.updatedAt.toLocaleDateString()}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCategoryEdit(category)}
                            className="flex-1"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCategoryDelete(category.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredCategories.length === 0 && (
                    <div className="text-center py-24">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/20 mb-6">
                        <Grid3X3 className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No categories found
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                        Create service categories to organize your salon offerings.
                      </p>
                      <Button
                        onClick={() => setShowCategoryForm(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Category
                      </Button>
                    </div>
                  )}
                </CardContent>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Service Form Modal */}
      {showServiceForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="flex items-center justify-between">
                <span>{editingService ? 'Edit Service' : 'Create New Service'}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowServiceForm(false)
                    setEditingService(null)
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Service Name</label>
                  <Input
                    placeholder="e.g., Premium Cut & Style"
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-gray-50 dark:focus:bg-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={serviceForm.categoryId}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-purple-500 focus:bg-gray-50 dark:focus:bg-gray-900"
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Input
                  placeholder="Brief description of the service"
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-gray-50 dark:focus:bg-gray-900"
                />
              </div>

              {/* Pricing and Duration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                  <Input
                    type="number"
                    placeholder="60"
                    value={serviceForm.duration}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, duration: Number(e.target.value) }))}
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-gray-50 dark:focus:bg-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Price (AED)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-gray-50 dark:focus:bg-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Cost (AED)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="37.50"
                    value={serviceForm.cost}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, cost: Number(e.target.value) }))}
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-gray-50 dark:focus:bg-gray-900"
                  />
                </div>
              </div>

              {/* Staff and Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Staff Required</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={serviceForm.staffRequired}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, staffRequired: Number(e.target.value) }))}
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-gray-50 dark:focus:bg-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                  <Input
                    placeholder="premium, consultation, styling"
                    value={serviceForm.tags}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, tags: e.target.value }))}
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-gray-50 dark:focus:bg-gray-900"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={serviceForm.active}
                      onCheckedChange={(checked) => setServiceForm(prev => ({ ...prev, active: !!checked }))}
                    />
                    <span className="text-sm">Active service</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={serviceForm.popular}
                      onCheckedChange={(checked) => setServiceForm(prev => ({ ...prev, popular: !!checked }))}
                    />
                    <span className="text-sm">Popular service</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={serviceForm.online}
                      onCheckedChange={(checked) => setServiceForm(prev => ({ ...prev, online: !!checked }))}
                    />
                    <span className="text-sm">Online bookable</span>
                  </label>
                </div>
              </div>

              {/* Instructions and Aftercare */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Service Instructions</label>
                  <textarea
                    placeholder="Instructions for staff performing this service..."
                    value={serviceForm.instructions}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, instructions: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none focus:bg-gray-50 dark:focus:bg-gray-900"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Aftercare Instructions</label>
                  <textarea
                    placeholder="Instructions for client aftercare..."
                    value={serviceForm.aftercare}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, aftercare: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none focus:bg-gray-50 dark:focus:bg-gray-900"
                    rows={3}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowServiceForm(false)
                    setEditingService(null)
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleServiceSave}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingService ? 'Update Service' : 'Create Service'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto m-4 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="flex items-center justify-between">
                <span>{editingCategory ? 'Edit Category' : 'Create New Category'}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCategoryForm(false)
                    setEditingCategory(null)
                    setCategoryForm({
                      name: '',
                      description: '',
                      color: '#8B5CF6',
                      icon: 'Scissors',
                      active: true
                    })
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category Name</label>
                  <Input
                    placeholder="e.g., Hair Services"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-gray-50 dark:focus:bg-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Input
                    placeholder="Brief description of the category"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-gray-50 dark:focus:bg-gray-900"
                  />
                </div>
              </div>

              {/* Visual Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                      className="w-10 h-10 rounded-md border border-gray-200 dark:border-gray-600 cursor-pointer"
                    />
                    <Input
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#8B5CF6"
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Icon</label>
                  <select
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, icon: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Scissors">Scissors (Hair Services)</option>
                    <option value="Sparkles">Sparkles (Spa Treatments)</option>
                    <option value="Palette">Palette (Nail Care)</option>
                    <option value="Crown">Crown (Premium Services)</option>
                    <option value="Gem">Gem (Luxury Services)</option>
                    <option value="Zap">Zap (Quick Services)</option>
                  </select>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <label className="block text-sm font-medium mb-3">Preview</label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${categoryForm.color}20` }}
                  >
                    {categoryForm.icon === 'Scissors' && <Scissors className="w-5 h-5" style={{ color: categoryForm.color }} />}
                    {categoryForm.icon === 'Sparkles' && <Sparkles className="w-5 h-5" style={{ color: categoryForm.color }} />}
                    {categoryForm.icon === 'Palette' && <Palette className="w-5 h-5" style={{ color: categoryForm.color }} />}
                    {categoryForm.icon === 'Crown' && <Crown className="w-5 h-5" style={{ color: categoryForm.color }} />}
                    {categoryForm.icon === 'Gem' && <Gem className="w-5 h-5" style={{ color: categoryForm.color }} />}
                    {categoryForm.icon === 'Zap' && <Zap className="w-5 h-5" style={{ color: categoryForm.color }} />}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {categoryForm.name || 'Category Name'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {categoryForm.description || 'Category description'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={categoryForm.active}
                    onCheckedChange={(checked) => setCategoryForm(prev => ({ ...prev, active: !!checked }))}
                  />
                  <span className="text-sm">Active category</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCategoryForm(false)
                    setEditingCategory(null)
                    setCategoryForm({
                      name: '',
                      description: '',
                      color: '#8B5CF6',
                      icon: 'Scissors',
                      active: true
                    })
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCategorySave}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={!categoryForm.name.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}