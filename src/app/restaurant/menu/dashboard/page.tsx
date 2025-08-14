'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  MetricCard,
  AnimatedCounter,
  StatusIndicator,
  FloatingNotification,
  GlowButton
} from '@/components/restaurant/JobsStyleMicroInteractions'
import { 
  Utensils, ChefHat, Clock, DollarSign, Plus, Search, Filter,
  TrendingUp, Star, Users, BarChart3, Settings, Package,
  Coffee, Pizza, Salad, IceCream, Wine, Sandwich,
  AlertCircle, CheckCircle, Eye, Edit, Trash2,
  Sparkles, Target, Award, Zap
} from 'lucide-react'

/**
 * 🍽️ Your Restaurant Menu System
 * Create dishes that sell, track what works, make more money
 * 
 * Steve Jobs: "Simplicity is the ultimate sophistication"
 * Layer 4 of 7-Layer Build Standard
 */

export default function MenuDashboardPage() {
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [isClient, setIsClient] = useState(false)

  // Demo organization ID (Mario's Restaurant)
  const organizationId = '550e8400-e29b-41d4-a716-446655440000'

  // Menu Analytics Stats
  const [menuStats, setMenuStats] = useState({
    totalItems: 47,
    activeItems: 42,
    averagePrice: 18.50,
    topCategory: 'Italian Classics',
    monthlyRevenue: 12450,
    customerFavorites: 8
  })

  // Popular menu categories with icons
  const menuCategories = [
    { id: 'italian_classics', name: 'Italian Classics', icon: Pizza, count: 12, color: 'from-red-500 to-orange-600' },
    { id: 'appetizers', name: 'Appetizers', icon: Sandwich, count: 8, color: 'from-yellow-500 to-amber-600' },
    { id: 'salads', name: 'Fresh Salads', icon: Salad, count: 6, color: 'from-green-500 to-emerald-600' },
    { id: 'desserts', name: 'Desserts', icon: IceCream, count: 9, color: 'from-pink-500 to-purple-600' },
    { id: 'beverages', name: 'Beverages', icon: Coffee, count: 12, color: 'from-blue-500 to-indigo-600' },
    { id: 'wine', name: 'Wine & Spirits', icon: Wine, count: 15, color: 'from-purple-500 to-violet-600' }
  ]

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true)
    loadMenuData()
  }, [])

  // Load menu data
  const loadMenuData = async () => {
    setLoading(true)
    try {
      // Fetch menu items using universal entities API
      const response = await fetch(`/api/v1/menu/entities?organization_id=${organizationId}&entity_type=menu_item&include_dynamic_data=true&include_relationships=true`)
      const result = await response.json()
      
      if (result.success) {
        setMenuItems(result.data || [])
        
        // Update stats based on real data
        const activeItems = result.data.filter(item => item.status === 'active').length
        const totalRevenue = result.data.reduce((sum, item) => {
          const price = item.dynamic_fields?.price?.value || 0
          return sum + (price * 30) // Estimated monthly sales
        }, 0)
        const avgPrice = result.data.reduce((sum, item) => sum + (item.dynamic_fields?.price?.value || 0), 0) / result.data.length
        
        setMenuStats(prev => ({
          ...prev,
          totalItems: result.data.length,
          activeItems,
          averagePrice: avgPrice || 18.50,
          monthlyRevenue: Math.round(totalRevenue)
        }))
      }
      
      // Load categories
      const categoriesResponse = await fetch(`/api/v1/menu/entities?organization_id=${organizationId}&entity_type=menu_category`)
      const categoriesResult = await categoriesResponse.json()
      if (categoriesResult.success) {
        setCategories(categoriesResult.data || [])
      }
      
    } catch (error) {
      console.error('Error loading menu data:', error)
      setNotificationMessage('Failed to load menu data')
      setShowNotification(true)
    } finally {
      setLoading(false)
    }
  }

  // Filter menu items
  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.entity_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || 
      item.dynamic_fields?.category?.value === selectedCategory ||
      item.ai_classification === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Create new menu item
  const createMenuItem = () => {
    // Navigate to menu form or open modal
    window.location.href = '/restaurant/menu/form'
  }

  if (loading && !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4">
            <div className="animate-spin w-full h-full border-4 border-orange-200 border-t-orange-500 rounded-full" />
          </div>
          <p className="text-gray-600">Loading menu system...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">
                🍽️ Your Menu
              </h1>
              <p className="text-gray-600 mt-2">
                Create dishes your customers love, price them right, make more money
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <StatusIndicator 
                  status="success" 
                  text="Mario's Restaurant" 
                  showText={true} 
                />
                <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30">
                  Live Menu
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <GlowButton
                onClick={createMenuItem}
                glowColor="rgba(249, 115, 22, 0.4)"
                className="bg-gradient-to-r from-orange-500 to-red-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Menu Item
              </GlowButton>
            </div>
          </div>
        </div>

        {/* Menu Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <MetricCard
            title="Total Menu Items"
            value={menuStats.totalItems}
            change={12.5}
            trend="up"
            icon={<Utensils className="w-5 h-5 text-white" />}
            color="from-orange-500 to-red-600"
          />
          
          <MetricCard
            title="Active Items"
            value={menuStats.activeItems}
            icon={<CheckCircle className="w-5 h-5 text-white" />}
            color="from-green-500 to-emerald-600"
          />
          
          <MetricCard
            title="Average Price"
            value={`$${menuStats.averagePrice.toFixed(2)}`}
            change={5.2}
            trend="up"
            icon={<DollarSign className="w-5 h-5 text-white" />}
            color="from-blue-500 to-indigo-600"
          />
          
          <MetricCard
            title="Monthly Revenue"
            value={`$${menuStats.monthlyRevenue.toLocaleString()}`}
            change={18.7}
            trend="up"
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            color="from-purple-500 to-violet-600"
          />
          
          <MetricCard
            title="Customer Favorites"
            value={menuStats.customerFavorites}
            icon={<Star className="w-5 h-5 text-white" />}
            color="from-yellow-500 to-amber-600"
          />
          
          <MetricCard
            title="Categories"
            value={menuCategories.length}
            icon={<Package className="w-5 h-5 text-white" />}
            color="from-cyan-500 to-blue-600"
          />
        </div>

        {/* Menu Categories */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pizza className="w-5 h-5" />
              Menu Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {menuCategories.map((category) => {
                const IconComponent = category.icon
                return (
                  <Card 
                    key={category.id} 
                    className={`cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${
                      selectedCategory === category.id ? 'ring-2 ring-orange-500' : ''
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-xl mx-auto mb-3 flex items-center justify-center`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-sm">{category.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{category.count} items</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Menu Items List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="w-5 h-5" />
                Menu Items ({filteredMenuItems.length})
              </CardTitle>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                >
                  All Items
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredMenuItems.length === 0 ? (
              <div className="text-center py-12">
                <ChefHat className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No Menu Items Found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Start building your menu by adding your first item'
                  }
                </p>
                <GlowButton
                  onClick={createMenuItem}
                  glowColor="rgba(249, 115, 22, 0.4)"
                  className="bg-gradient-to-r from-orange-500 to-red-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Menu Item
                </GlowButton>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMenuItems.map((item) => {
                  const price = item.dynamic_fields?.price?.value || 0
                  const description = item.dynamic_fields?.description?.value || 'No description available'
                  const category = item.dynamic_fields?.category?.value || item.ai_classification
                  const allergens = item.dynamic_fields?.allergens?.value || []
                  
                  return (
                    <Card key={item.id} className="hover:shadow-lg transition-all hover:scale-105">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg">{item.entity_name}</h3>
                          <Badge className="bg-green-100 text-green-800">
                            ${price.toFixed(2)}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {description}
                        </p>
                        
                        <div className="flex items-center justify-between mb-4">
                          <Badge variant="outline" className="text-xs">
                            {category || 'Uncategorized'}
                          </Badge>
                          <Badge className={`text-xs ${
                            item.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status}
                          </Badge>
                        </div>
                        
                        {allergens.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-orange-600 font-medium">
                              ⚠️ Contains: {Array.isArray(allergens) ? allergens.join(', ') : allergens}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                        
                        {item.smart_code && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-blue-600 font-mono">{item.smart_code}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Why Your Menu Matters */}
        <Card className="mt-8 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Sparkles className="w-6 h-6 text-orange-500 mr-2" />
              <h3 className="text-lg font-semibold">🎯 Why Your Menu Drives Everything</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl mx-auto mb-2 flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <strong className="text-orange-600">Every Dish Counts:</strong><br/>
                From simple cafes to fine dining - know which dishes make money and which ones don't.
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl mx-auto mb-2 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <strong className="text-emerald-600">Automatic Profit Tracking:</strong><br/>
                Every order updates your sales automatically. See your money flowing in real-time.
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl mx-auto mb-2 flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <strong className="text-blue-600">Start Making Money Today:</strong><br/>
                Set up your menu in minutes, not months. Other systems take forever to get right.
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-violet-500 rounded-xl mx-auto mb-2 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <strong className="text-purple-600">Price It Right:</strong><br/>
                Get suggestions for pricing that customers will pay and you'll profit from.
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Floating Notification */}
        <FloatingNotification
          show={showNotification}
          message={notificationMessage}
          type="success"
          duration={3000}
          onClose={() => setShowNotification(false)}
        />
      </div>
    </div>
  )
}