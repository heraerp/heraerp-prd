'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  Package,
  Users,
  ShoppingCart,
  FileText,
  Calendar,
  MapPin,
  Star,
  TreePine,
  Armchair,
  Sofa,
  Bed,
  Table,
  Hammer,
  Truck,
  Building2,
  Phone,
  Mail,
  DollarSign,
  Clock,
  Target,
  Award,
  TrendingUp,
  Eye,
  Edit,
  Download,
  Share2,
  Bookmark,
  BookmarkCheck,
  MoreVertical,
  ChevronDown,
  X
} from 'lucide-react'

interface SearchResult {
  id: string
  type: 'product' | 'customer' | 'order' | 'supplier' | 'document'
  title: string
  description: string
  category: string
  metadata: Record<string, any>
  relevanceScore: number
  lastUpdated: string
  thumbnail?: string
}

interface SearchFilter {
  type: string[]
  category: string[]
  dateRange: string
  priceRange: [number, number]
  location: string[]
  status: string[]
}

export default function FurnitureSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  type SortOption = 'relevance' | 'date' | 'name' | 'price'
  type SortDirection = 'asc' | 'desc'
  
  const [sortBy, setSortBy] = useState<SortOption>('relevance')
  const [sortOrder, setSortOrder] = useState<SortDirection>('desc')
  const [activeFilters, setActiveFilters] = useState<SearchFilter>({
    type: [],
    category: [],
    dateRange: '',
    priceRange: [0, 1000000],
    location: [],
    status: []
  })
  const [showFilters, setShowFilters] = useState(false)
  const [savedSearches, setSavedSearches] = useState<string[]>([])

  // Sample furniture business search results
  const sampleResults: SearchResult[] = [
    {
      id: '1',
      type: 'product',
      title: 'Executive Dining Table Set',
      description: 'Premium teak wood dining table with 8 chairs for hotel use',
      category: 'Dining Sets',
      metadata: {
        material: 'Teak Wood',
        dimensions: '180×90×75 cm',
        price: 125000,
        stock: 12,
        woodType: 'Premium Teak',
        style: 'Traditional Kerala',
        craftsman: 'Raman Master'
      },
      relevanceScore: 95,
      lastUpdated: '2024-01-15',
      thumbnail: '/products/dining-set.jpg'
    },
    {
      id: '2',
      type: 'customer',
      title: 'Marriott Hotels India',
      description: 'Premium hotel chain, regular bulk orders for furniture',
      category: 'Corporate Clients',
      metadata: {
        contactPerson: 'Ajay Kumar',
        location: 'Kochi, Kerala',
        phone: '+91 484 2668888',
        email: 'procurement@marriott.com',
        totalOrders: 25,
        totalValue: 2500000,
        rating: 'Premium',
        preferredWood: ['Teak', 'Rosewood']
      },
      relevanceScore: 92,
      lastUpdated: '2024-01-14'
    },
    {
      id: '3',
      type: 'order',
      title: 'Order #FRN-2024-0156',
      description: 'Hotel room furniture set - 50 rooms for ITC Grand Chola',
      category: 'Hotel Orders',
      metadata: {
        customer: 'ITC Hotels',
        orderValue: 850000,
        status: 'In Production',
        deliveryDate: '2024-02-15',
        items: 150,
        location: 'Chennai',
        craftsmen: ['Suresh Kumar', 'Anitha Nair'],
        completion: 65
      },
      relevanceScore: 88,
      lastUpdated: '2024-01-13'
    },
    {
      id: '4',
      type: 'supplier',
      title: 'Kerala Forest Development Corporation',
      description: 'Premium wood supplier - FSC certified sustainable sourcing',
      category: 'Wood Suppliers',
      metadata: {
        contact: 'Dr. Radhika Menon',
        location: 'Thrissur, Kerala',
        phone: '+91 487 2421234',
        specialization: ['Teak', 'Rosewood', 'Mahogany'],
        certification: ['FSC', 'Sustainable Forestry'],
        rating: 98,
        creditDays: 30,
        yearEstablished: 1971
      },
      relevanceScore: 85,
      lastUpdated: '2024-01-12'
    },
    {
      id: '5',
      type: 'product',
      title: 'Traditional Kerala Chairs',
      description: 'Hand-carved traditional chairs with intricate woodwork',
      category: 'Seating',
      metadata: {
        material: 'Rosewood',
        dimensions: '45×50×85 cm',
        price: 8500,
        stock: 45,
        woodType: 'Malabar Rosewood',
        style: 'Traditional Kerala',
        craftTime: '3 days per chair'
      },
      relevanceScore: 82,
      lastUpdated: '2024-01-11'
    },
    {
      id: '6',
      type: 'document',
      title: 'Export Certificate - Container KFWX2024001',
      description: 'Export documentation for Middle East furniture shipment',
      category: 'Export Documents',
      metadata: {
        containerNumber: 'KFWX2024001',
        destination: 'Dubai, UAE',
        value: 1200000,
        items: 200,
        exportDate: '2024-01-10',
        certification: 'Export Quality',
        customer: 'Arabian Furniture Trading'
      },
      relevanceScore: 78,
      lastUpdated: '2024-01-10'
    }
  ]

  const searchCategories = [
    { id: 'all', name: 'All Categories', icon: Search },
    { id: 'products', name: 'Products', icon: Package },
    { id: 'customers', name: 'Customers', icon: Users },
    { id: 'orders', name: 'Orders', icon: ShoppingCart },
    { id: 'suppliers', name: 'Suppliers', icon: Truck },
    { id: 'documents', name: 'Documents', icon: FileText }
  ]

  const quickSearches = [
    'Teak furniture',
    'Hotel orders',
    'Export items',
    'Traditional Kerala',
    'Premium customers',
    'Craftsman schedules',
    'Wood inventory',
    'Shipping documents'
  ]

  const recentSearches = [
    'Marriott hotel chairs',
    'Rosewood dining sets',
    'Export documentation',
    'Thrissur suppliers'
  ]

  useEffect(() => {
    if (searchQuery.length > 2) {
      performSearch()
    } else {
      setSearchResults([])
    }
  }, [searchQuery, activeFilters, sortBy, sortOrder])

  const performSearch = () => {
    setIsSearching(true)
    
    // Simulate search delay
    setTimeout(() => {
      let results = sampleResults.filter(result => {
        const matchesQuery = result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           result.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           result.category.toLowerCase().includes(searchQuery.toLowerCase())
        
        const matchesType = activeFilters.type.length === 0 || activeFilters.type.includes(result.type)
        const matchesCategory = activeFilters.category.length === 0 || activeFilters.category.includes(result.category)
        
        return matchesQuery && matchesType && matchesCategory
      })

      // Sort results
      results.sort((a, b) => {
        let comparison = 0
        switch (sortBy) {
          case 'relevance':
            comparison = b.relevanceScore - a.relevanceScore
            break
          case 'date':
            comparison = new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
            break
          case 'name':
            comparison = a.title.localeCompare(b.title)
            break
          case 'price':
            const aPrice = a.metadata.price || a.metadata.orderValue || 0
            const bPrice = b.metadata.price || b.metadata.orderValue || 0
            comparison = aPrice - bPrice
            break
        }
        return sortOrder === 'asc' ? comparison : -comparison
      })

      setSearchResults(results)
      setIsSearching(false)
    }, 800)
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      product: Package,
      customer: Users,
      order: ShoppingCart,
      supplier: Truck,
      document: FileText
    }
    return icons[type as keyof typeof icons] || Package
  }

  const getTypeColor = (type: string) => {
    const colors = {
      product: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      customer: 'bg-green-500/10 text-green-600 border-green-500/20',
      order: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      supplier: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      document: 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
    return colors[type as keyof typeof colors] || colors.product
  }

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query)
  }

  const toggleFilter = (filterType: keyof SearchFilter, value: string) => {
    setActiveFilters(prev => {
      const currentValues = prev[filterType] as string[]
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value]
      
      return {
        ...prev,
        [filterType]: newValues
      }
    })
  }

  const clearFilters = () => {
    setActiveFilters({
      type: [],
      category: [],
      dateRange: '',
      priceRange: [0, 1000000],
      location: [],
      status: []
    })
  }

  const saveSearch = () => {
    if (searchQuery && !savedSearches.includes(searchQuery)) {
      setSavedSearches(prev => [searchQuery, ...prev.slice(0, 4)])
    }
  }

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="jewelry-crown-glow p-3 rounded-xl">
                  <Search className="h-8 w-8 jewelry-text-gold" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold jewelry-text-luxury">Universal Search</h1>
                  <p className="text-lg text-gray-300">Find products, customers, orders, suppliers & documents</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                  <Target className="h-3 w-3 mr-1" />
                  AI Powered
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="jewelry-glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search for furniture, customers, orders, suppliers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 jewelry-glass-input text-lg"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <Button 
                onClick={saveSearch}
                variant="outline" 
                className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold"
              >
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Searches */}
            <div className="mt-4 space-y-3">
              <div>
                <h4 className="text-sm font-medium jewelry-text-luxury mb-2">Quick Searches:</h4>
                <div className="flex flex-wrap gap-2">
                  {quickSearches.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickSearch(query)}
                      className="px-3 py-1 text-sm bg-white/5 hover:bg-white/10 rounded-full jewelry-text-luxury hover:jewelry-text-gold transition-colors"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
              
              {recentSearches.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium jewelry-text-luxury mb-2">Recent Searches:</h4>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((query, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickSearch(query)}
                        className="px-3 py-1 text-sm bg-blue-500/10 hover:bg-blue-500/20 rounded-full text-blue-600 hover:text-blue-500 transition-colors flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        {query}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold jewelry-text-luxury">Search Filters</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearFilters}
                  className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold"
                >
                  Clear All
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Type Filters */}
                <div>
                  <h4 className="text-sm font-medium jewelry-text-luxury mb-3">Type</h4>
                  <div className="space-y-2">
                    {['product', 'customer', 'order', 'supplier', 'document'].map(type => (
                      <label key={type} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeFilters.type.includes(type)}
                          onChange={() => toggleFilter('type', type)}
                          className="jewelry-checkbox"
                        />
                        <span className="text-sm jewelry-text-luxury capitalize">{type}s</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Category Filters */}
                <div>
                  <h4 className="text-sm font-medium jewelry-text-luxury mb-3">Category</h4>
                  <div className="space-y-2">
                    {['Dining Sets', 'Seating', 'Hotel Orders', 'Corporate Clients', 'Wood Suppliers'].map(category => (
                      <label key={category} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeFilters.category.includes(category)}
                          onChange={() => toggleFilter('category', category)}
                          className="jewelry-checkbox"
                        />
                        <span className="text-sm jewelry-text-luxury">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Location Filters */}
                <div>
                  <h4 className="text-sm font-medium jewelry-text-luxury mb-3">Location</h4>
                  <div className="space-y-2">
                    {['Kochi', 'Thrissur', 'Kozhikode', 'Chennai', 'Dubai'].map(location => (
                      <label key={location} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeFilters.location.includes(location)}
                          onChange={() => toggleFilter('location', location)}
                          className="jewelry-checkbox"
                        />
                        <span className="text-sm jewelry-text-luxury">{location}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchQuery && (
            <div className="space-y-6">
              {/* Results Header */}
              <div className="jewelry-glass-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <p className="jewelry-text-luxury">
                      {isSearching ? 'Searching...' : `${searchResults.length} results for "${searchQuery}"`}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Sort Controls */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm jewelry-text-luxury">Sort by:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="text-sm bg-white/10 border border-white/20 rounded px-2 py-1 jewelry-text-luxury"
                      >
                        <option value="relevance">Relevance</option>
                        <option value="date">Date</option>
                        <option value="name">Name</option>
                        <option value="price">Price</option>
                      </select>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="p-1 hover:bg-white/10 rounded"
                      >
                        {sortOrder === 'asc' ? 
                          <SortAsc className="h-4 w-4 jewelry-text-luxury" /> : 
                          <SortDesc className="h-4 w-4 jewelry-text-luxury" />
                        }
                      </button>
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-white/10 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'jewelry-text-luxury'}`}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'jewelry-text-luxury'}`}
                      >
                        <List className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Grid/List */}
              {isSearching ? (
                <div className="flex justify-center py-12">
                  <div className="text-center">
                    <div className="jewelry-spinner w-8 h-8 mx-auto mb-4" />
                    <p className="jewelry-text-luxury">Searching across all systems...</p>
                  </div>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 
                  'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 
                  'space-y-4'
                }>
                  {searchResults.map((result) => {
                    const TypeIcon = getTypeIcon(result.type)
                    return (
                      <div key={result.id} className={`jewelry-glass-card p-6 jewelry-scale-hover cursor-pointer ${
                        viewMode === 'list' ? 'flex items-center gap-6' : ''
                      }`}>
                        <div className={viewMode === 'list' ? 'flex-1' : ''}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <TypeIcon className="h-5 w-5 text-white" />
                              </div>
                              <Badge className={getTypeColor(result.type)}>
                                {result.type}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs jewelry-text-luxury">{result.relevanceScore}% match</span>
                              <MoreVertical className="h-4 w-4 jewelry-text-luxury" />
                            </div>
                          </div>

                          <h3 className="text-lg font-semibold jewelry-text-luxury mb-2">{result.title}</h3>
                          <p className="text-sm text-gray-300 mb-3">{result.description}</p>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="jewelry-text-accent">{result.category}</span>
                              <span className="text-gray-400">{result.lastUpdated}</span>
                            </div>
                            
                            {/* Metadata */}
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(result.metadata).slice(0, 3).map(([key, value]) => (
                                <Badge key={key} variant="outline" className="text-xs jewelry-badge-text">
                                  {key}: {value}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        {viewMode === 'list' && (
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                              <Eye className="h-3 w-3" />
                              View
                            </Button>
                            <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                              <Edit className="h-3 w-3" />
                              Edit
                            </Button>
                          </div>
                        )}

                        {viewMode === 'grid' && (
                          <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                                <Share2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button size="sm" className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                              Open
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {!isSearching && searchResults.length === 0 && searchQuery && (
                <div className="jewelry-glass-card p-12 text-center">
                  <Search className="h-12 w-12 jewelry-text-luxury mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-2">No results found</h3>
                  <p className="text-gray-300 mb-4">Try adjusting your search terms or filters</p>
                  <Button 
                    onClick={clearFilters}
                    className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!searchQuery && (
            <div className="jewelry-glass-card p-12 text-center">
              <Search className="h-16 w-16 jewelry-text-luxury mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold jewelry-text-luxury mb-2">Universal Search</h3>
              <p className="text-gray-300 mb-6">Search across products, customers, orders, suppliers, and documents</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="text-center">
                  <Package className="h-8 w-8 jewelry-text-gold mx-auto mb-2" />
                  <h4 className="font-medium jewelry-text-luxury">Products</h4>
                  <p className="text-sm text-gray-300">Furniture inventory & catalog</p>
                </div>
                <div className="text-center">
                  <Users className="h-8 w-8 jewelry-text-gold mx-auto mb-2" />
                  <h4 className="font-medium jewelry-text-luxury">Customers</h4>
                  <p className="text-sm text-gray-300">Hotels, corporate clients</p>
                </div>
                <div className="text-center">
                  <ShoppingCart className="h-8 w-8 jewelry-text-gold mx-auto mb-2" />
                  <h4 className="font-medium jewelry-text-luxury">Orders</h4>
                  <p className="text-sm text-gray-300">Active & completed orders</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}