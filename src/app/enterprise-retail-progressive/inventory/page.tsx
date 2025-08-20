'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/DualAuthProvider'
import { EnterpriseRetailSolutionSidebar } from '@/components/enterprise-retail-progressive/EnterpriseRetailSolutionSidebar'
import { UniversalTourProvider, TourElement } from '@/components/tours/SimpleTourProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Package, 
  Search, 
  Filter,
  Plus,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Eye,
  Edit3,
  Trash2,
  RefreshCw,
  BarChart3,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Target,
  Star,
  DollarSign,
  Percent,
  Activity,
  Layers,
  Box,
  Truck,
  ShoppingCart,
  Warehouse,
  MapPin,
  Users,
  Brain,
  Sparkles,
  Award,
  Crown,
  Flame,
  Snowflake,
  Sun,
  CloudRain,
  Settings,
  Download,
  Upload,
  FileText,
  PieChart,
  LineChart,
  Grid3X3,
  List,
  ScanLine,
  QrCode,
  Hash,
  Tag,
  Bookmark,
  Archive,
  AlertCircle,
  Info,
  HelpCircle,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff
} from 'lucide-react'

// Enterprise Retail Inventory Sample Data with AI Insights
const sampleInventoryData = {
  inventoryItems: [
    // Electronics Category
    {
      id: 'INV001',
      product_id: 'PROD001',
      name: 'iPhone 15 Pro Max',
      sku: 'ELEC-IP15-PM-256',
      barcode: '194253000000',
      category: 'Electronics',
      subcategory: 'Smartphones',
      brand: 'Apple',
      current_stock: 45,
      min_stock_level: 10,
      max_stock_level: 100,
      reorder_point: 15,
      cost_per_unit: 899.00,
      selling_price: 1199.00,
      margin_percent: 25.0,
      supplier: 'Apple Distribution',
      location: 'Warehouse A - Bay 12',
      last_received: '2024-08-05',
      last_sold: '2024-08-08',
      image: '📱',
      status: 'active',
      seasonal_factor: 1.2,
      velocity_class: 'A', // A=Fast moving, B=Medium, C=Slow
      abc_analysis: 'A',
      xyz_analysis: 'X', // X=Predictable demand, Y=Variable, Z=Unpredictable
      ai_insights: {
        demand_forecast_next_30_days: 28,
        stockout_risk: 'low',
        optimal_reorder_quantity: 35,
        price_elasticity: 0.8,
        competitive_price_position: 'market_leader',
        seasonal_trend: 'high_demand',
        customer_satisfaction_score: 9.2,
        return_rate: 2.1,
        profit_contribution: 'high',
        inventory_turn_prediction: 8.5,
        dead_stock_risk: 'very_low',
        cross_sell_opportunities: ['Phone Cases', 'Wireless Chargers', 'AirPods'],
        price_optimization_suggestion: 'maintain',
        inventory_health_score: 9.1
      }
    },
    {
      id: 'INV002',
      product_id: 'PROD002',
      name: 'MacBook Pro 14"',
      sku: 'ELEC-MBP-14-512',
      barcode: '194253000001',
      category: 'Electronics',
      subcategory: 'Laptops',
      brand: 'Apple',
      current_stock: 12,
      min_stock_level: 5,
      max_stock_level: 30,
      reorder_point: 8,
      cost_per_unit: 1499.00,
      selling_price: 1999.00,
      margin_percent: 25.0,
      supplier: 'Apple Distribution',
      location: 'Warehouse A - Bay 15',
      last_received: '2024-08-03',
      last_sold: '2024-08-07',
      image: '💻',
      status: 'active',
      seasonal_factor: 0.9,
      velocity_class: 'B',
      abc_analysis: 'A',
      xyz_analysis: 'Y',
      ai_insights: {
        demand_forecast_next_30_days: 8,
        stockout_risk: 'medium',
        optimal_reorder_quantity: 15,
        price_elasticity: 1.2,
        competitive_price_position: 'premium',
        seasonal_trend: 'stable',
        customer_satisfaction_score: 9.5,
        return_rate: 1.8,
        profit_contribution: 'very_high',
        inventory_turn_prediction: 4.2,
        dead_stock_risk: 'low',
        cross_sell_opportunities: ['Laptop Cases', 'External Monitors', 'Wireless Mouse'],
        price_optimization_suggestion: 'slight_increase',
        inventory_health_score: 8.7
      }
    },
    {
      id: 'INV003',
      product_id: 'PROD003',
      name: 'AirPods Pro (3rd Gen)',
      sku: 'ELEC-APP-PRO3',
      barcode: '194253000002',
      category: 'Electronics',
      subcategory: 'Audio',
      brand: 'Apple',
      current_stock: 78,
      min_stock_level: 20,
      max_stock_level: 150,
      reorder_point: 30,
      cost_per_unit: 179.00,
      selling_price: 249.00,
      margin_percent: 28.1,
      supplier: 'Apple Distribution',
      location: 'Warehouse A - Bay 8',
      last_received: '2024-08-06',
      last_sold: '2024-08-08',
      image: '🎧',
      status: 'active',
      seasonal_factor: 1.1,
      velocity_class: 'A',
      abc_analysis: 'A',
      xyz_analysis: 'X',
      ai_insights: {
        demand_forecast_next_30_days: 45,
        stockout_risk: 'low',
        optimal_reorder_quantity: 60,
        price_elasticity: 0.9,
        competitive_price_position: 'competitive',
        seasonal_trend: 'high_demand',
        customer_satisfaction_score: 9.0,
        return_rate: 3.2,
        profit_contribution: 'high',
        inventory_turn_prediction: 12.5,
        dead_stock_risk: 'very_low',
        cross_sell_opportunities: ['Phone Cases', 'Cleaning Kits', 'Carrying Cases'],
        price_optimization_suggestion: 'maintain',
        inventory_health_score: 9.3
      }
    },
    // Fashion Category
    {
      id: 'INV004',
      product_id: 'PROD004',
      name: 'Premium Leather Jacket',
      sku: 'FASH-LJ-BLK-L',
      barcode: '194253000003',
      category: 'Fashion',
      subcategory: 'Outerwear',
      brand: 'Urban Style',
      current_stock: 23,
      min_stock_level: 8,
      max_stock_level: 50,
      reorder_point: 12,
      cost_per_unit: 149.99,
      selling_price: 299.99,
      margin_percent: 50.0,
      supplier: 'Fashion Forward Inc',
      location: 'Warehouse B - Section C3',
      last_received: '2024-07-28',
      last_sold: '2024-08-06',
      image: '🧥',
      status: 'active',
      seasonal_factor: 1.5, // High demand in fall/winter
      velocity_class: 'B',
      abc_analysis: 'B',
      xyz_analysis: 'Y',
      ai_insights: {
        demand_forecast_next_30_days: 18,
        stockout_risk: 'medium',
        optimal_reorder_quantity: 25,
        price_elasticity: 1.1,
        competitive_price_position: 'premium',
        seasonal_trend: 'increasing', // Approaching fall season
        customer_satisfaction_score: 8.5,
        return_rate: 5.8,
        profit_contribution: 'high',
        inventory_turn_prediction: 6.2,
        dead_stock_risk: 'low',
        cross_sell_opportunities: ['Belts', 'Boots', 'Scarves'],
        price_optimization_suggestion: 'seasonal_increase',
        inventory_health_score: 8.2
      }
    },
    {
      id: 'INV005',
      product_id: 'PROD005',
      name: 'Designer Denim Jeans',
      sku: 'FASH-DJ-BLU-32',
      barcode: '194253000004',
      category: 'Fashion',
      subcategory: 'Bottoms',
      brand: 'Denim Co',
      current_stock: 56,
      min_stock_level: 15,
      max_stock_level: 80,
      reorder_point: 25,
      cost_per_unit: 44.99,
      selling_price: 89.99,
      margin_percent: 50.0,
      supplier: 'Fashion Forward Inc',
      location: 'Warehouse B - Section D1',
      last_received: '2024-08-02',
      last_sold: '2024-08-08',
      image: '👖',
      status: 'active',
      seasonal_factor: 1.0, // Year-round item
      velocity_class: 'A',
      abc_analysis: 'A',
      xyz_analysis: 'X',
      ai_insights: {
        demand_forecast_next_30_days: 32,
        stockout_risk: 'low',
        optimal_reorder_quantity: 40,
        price_elasticity: 1.3,
        competitive_price_position: 'competitive',
        seasonal_trend: 'stable',
        customer_satisfaction_score: 8.8,
        return_rate: 8.5, // Higher return rate for clothing
        profit_contribution: 'medium',
        inventory_turn_prediction: 9.1,
        dead_stock_risk: 'low',
        cross_sell_opportunities: ['Belts', 'T-Shirts', 'Sneakers'],
        price_optimization_suggestion: 'bundle_discount',
        inventory_health_score: 8.6
      }
    },
    {
      id: 'INV006',
      product_id: 'PROD006',
      name: 'Athletic Sneakers',
      sku: 'FASH-AS-WHT-10',
      barcode: '194253000005',
      category: 'Fashion',
      subcategory: 'Footwear',
      brand: 'SportMax',
      current_stock: 34,
      min_stock_level: 12,
      max_stock_level: 60,
      reorder_point: 18,
      cost_per_unit: 64.99,
      selling_price: 129.99,
      margin_percent: 50.0,
      supplier: 'Athletic Wear Ltd',
      location: 'Warehouse B - Section E2',
      last_received: '2024-08-04',
      last_sold: '2024-08-08',
      image: '👟',
      status: 'active',
      seasonal_factor: 1.1, // Slight increase in summer/spring
      velocity_class: 'A',
      abc_analysis: 'B',
      xyz_analysis: 'X',
      ai_insights: {
        demand_forecast_next_30_days: 25,
        stockout_risk: 'low',
        optimal_reorder_quantity: 30,
        price_elasticity: 1.0,
        competitive_price_position: 'competitive',
        seasonal_trend: 'high_demand',
        customer_satisfaction_score: 9.1,
        return_rate: 4.2,
        profit_contribution: 'medium',
        inventory_turn_prediction: 8.8,
        dead_stock_risk: 'low',
        cross_sell_opportunities: ['Athletic Socks', 'Shoe Care', 'Insoles'],
        price_optimization_suggestion: 'maintain',
        inventory_health_score: 8.9
      }
    },
    // Accessories Category
    {
      id: 'INV007',
      product_id: 'PROD007',
      name: 'Phone Case Pro Max',
      sku: 'ACC-PC-CLR',
      barcode: '194253000006',
      category: 'Accessories',
      subcategory: 'Phone Cases',
      brand: 'ProtectTech',
      current_stock: 125,
      min_stock_level: 30,
      max_stock_level: 200,
      reorder_point: 50,
      cost_per_unit: 12.99,
      selling_price: 29.99,
      margin_percent: 56.7,
      supplier: 'Mobile Accessories Inc',
      location: 'Warehouse C - Shelf A15',
      last_received: '2024-08-07',
      last_sold: '2024-08-08',
      image: '📱💎',
      status: 'active',
      seasonal_factor: 1.0, // Stable year-round
      velocity_class: 'A',
      abc_analysis: 'C', // Low value per unit but high volume
      xyz_analysis: 'X',
      ai_insights: {
        demand_forecast_next_30_days: 75,
        stockout_risk: 'very_low',
        optimal_reorder_quantity: 100,
        price_elasticity: 1.5,
        competitive_price_position: 'value_leader',
        seasonal_trend: 'stable',
        customer_satisfaction_score: 8.7,
        return_rate: 2.8,
        profit_contribution: 'medium',
        inventory_turn_prediction: 15.2,
        dead_stock_risk: 'very_low',
        cross_sell_opportunities: ['Screen Protectors', 'Wireless Chargers', 'Phone Stands'],
        price_optimization_suggestion: 'volume_discount',
        inventory_health_score: 9.0
      }
    },
    {
      id: 'INV008',
      product_id: 'PROD008',
      name: 'Wireless Charger Stand',
      sku: 'ACC-WC-BLK',
      barcode: '194253000007',
      category: 'Accessories',
      subcategory: 'Chargers',
      brand: 'ChargeFast',
      current_stock: 67,
      min_stock_level: 15,
      max_stock_level: 100,
      reorder_point: 25,
      cost_per_unit: 24.99,
      selling_price: 49.99,
      margin_percent: 50.0,
      supplier: 'Mobile Accessories Inc',
      location: 'Warehouse C - Shelf B8',
      last_received: '2024-08-05',
      last_sold: '2024-08-07',
      image: '⚡',
      status: 'active',
      seasonal_factor: 1.0,
      velocity_class: 'B',
      abc_analysis: 'B',
      xyz_analysis: 'Y',
      ai_insights: {
        demand_forecast_next_30_days: 22,
        stockout_risk: 'low',
        optimal_reorder_quantity: 35,
        price_elasticity: 1.2,
        competitive_price_position: 'competitive',
        seasonal_trend: 'stable',
        customer_satisfaction_score: 8.9,
        return_rate: 3.5,
        profit_contribution: 'medium',
        inventory_turn_prediction: 7.3,
        dead_stock_risk: 'low',
        cross_sell_opportunities: ['Phone Cases', 'Cables', 'Power Banks'],
        price_optimization_suggestion: 'bundle_promote',
        inventory_health_score: 8.4
      }
    },
    // Problem Items for Demo
    {
      id: 'INV009',
      product_id: 'PROD009',
      name: 'Smart Watch Series 8',
      sku: 'ELEC-SW-S8-44',
      barcode: '194253000008',
      category: 'Electronics',
      subcategory: 'Wearables',
      brand: 'TechTime',
      current_stock: 3, // Low stock - approaching stockout
      min_stock_level: 8,
      max_stock_level: 40,
      reorder_point: 12,
      cost_per_unit: 299.00,
      selling_price: 399.99,
      margin_percent: 25.2,
      supplier: 'Tech Distributors LLC',
      location: 'Warehouse A - Bay 20',
      last_received: '2024-07-15',
      last_sold: '2024-08-01',
      image: '⌚',
      status: 'active',
      seasonal_factor: 0.8,
      velocity_class: 'C', // Slow moving
      abc_analysis: 'B',
      xyz_analysis: 'Z', // Unpredictable demand
      ai_insights: {
        demand_forecast_next_30_days: 12,
        stockout_risk: 'very_high',
        optimal_reorder_quantity: 20,
        price_elasticity: 1.8,
        competitive_price_position: 'above_market',
        seasonal_trend: 'declining',
        customer_satisfaction_score: 7.8,
        return_rate: 6.5,
        profit_contribution: 'low',
        inventory_turn_prediction: 2.1,
        dead_stock_risk: 'medium',
        cross_sell_opportunities: ['Watch Bands', 'Screen Protectors', 'Charging Docks'],
        price_optimization_suggestion: 'discount_promotion',
        inventory_health_score: 4.2
      }
    },
    {
      id: 'INV010',
      product_id: 'PROD010',
      name: 'Vintage Sunglasses',
      sku: 'ACC-SG-VIN-M',
      barcode: '194253000009',
      category: 'Accessories',
      subcategory: 'Eyewear',
      brand: 'RetroVision',
      current_stock: 85, // Overstock situation
      min_stock_level: 10,
      max_stock_level: 30,
      reorder_point: 15,
      cost_per_unit: 35.00,
      selling_price: 79.99,
      margin_percent: 56.3,
      supplier: 'Fashion Accessories Plus',
      location: 'Warehouse C - Shelf C12',
      last_received: '2024-06-20',
      last_sold: '2024-07-18',
      image: '🕶️',
      status: 'active',
      seasonal_factor: 0.6, // End of summer, declining demand
      velocity_class: 'C',
      abc_analysis: 'C',
      xyz_analysis: 'Y',
      ai_insights: {
        demand_forecast_next_30_days: 5,
        stockout_risk: 'very_low',
        optimal_reorder_quantity: 0, // Don't reorder
        price_elasticity: 2.1,
        competitive_price_position: 'above_market',
        seasonal_trend: 'declining',
        customer_satisfaction_score: 7.2,
        return_rate: 8.9,
        profit_contribution: 'very_low',
        inventory_turn_prediction: 1.2,
        dead_stock_risk: 'high',
        cross_sell_opportunities: ['Cleaning Cloths', 'Cases', 'Straps'],
        price_optimization_suggestion: 'clearance_sale',
        inventory_health_score: 2.8
      }
    }
  ],
  warehouses: [
    {
      id: 'WH001',
      name: 'Main Warehouse A',
      location: 'Downtown Distribution Center',
      capacity: 10000,
      current_utilization: 7500,
      manager: 'David Kim',
      categories: ['Electronics', 'High-Value Items']
    },
    {
      id: 'WH002',
      name: 'Fashion Warehouse B',
      location: 'Fashion District Center',
      capacity: 8000,
      current_utilization: 5200,
      manager: 'Lisa Chen',
      categories: ['Fashion', 'Apparel', 'Footwear']
    },
    {
      id: 'WH003',
      name: 'Accessories Hub C',
      location: 'Quick Access Center',
      capacity: 5000,
      current_utilization: 3800,
      manager: 'Mike Rodriguez',
      categories: ['Accessories', 'Small Items', 'Fast-Moving']
    }
  ],
  suppliers: [
    {
      id: 'SUP001',
      name: 'Apple Distribution',
      reliability_score: 9.5,
      lead_time_days: 3,
      categories: ['Electronics']
    },
    {
      id: 'SUP002', 
      name: 'Fashion Forward Inc',
      reliability_score: 8.2,
      lead_time_days: 7,
      categories: ['Fashion']
    },
    {
      id: 'SUP003',
      name: 'Mobile Accessories Inc',
      reliability_score: 8.8,
      lead_time_days: 5,
      categories: ['Accessories']
    }
  ]
}

export default function EnterpriseInventoryPage() {
  const { user, workspace } = useAuth()
  
  // State Management
  const [inventoryItems, setInventoryItems] = useState(sampleInventoryData.inventoryItems)
  const [filteredItems, setFilteredItems] = useState(sampleInventoryData.inventoryItems)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedVelocity, setSelectedVelocity] = useState('All')
  const [viewMode, setViewMode] = useState('grid') // grid, table, analytics
  const [sortBy, setSortBy] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  
  // Modal States
  const [showItemDetail, setShowItemDetail] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showReorderModal, setShowReorderModal] = useState(false)
  
  // Analytics State
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(false)

  // Calculate inventory analytics
  const calculateAnalytics = useCallback(() => {
    const totalItems = inventoryItems.length
    const totalValue = inventoryItems.reduce((sum, item) => sum + (item.current_stock * item.cost_per_unit), 0)
    const lowStockItems = inventoryItems.filter(item => item.current_stock <= item.min_stock_level).length
    const overstockItems = inventoryItems.filter(item => item.current_stock > item.max_stock_level).length
    const stockoutItems = inventoryItems.filter(item => item.current_stock === 0).length
    const avgTurnover = inventoryItems.reduce((sum, item) => sum + (item.ai_insights?.inventory_turn_prediction || 0), 0) / totalItems
    const avgHealthScore = inventoryItems.reduce((sum, item) => sum + (item.ai_insights?.inventory_health_score || 0), 0) / totalItems
    const highRiskItems = inventoryItems.filter(item => item.ai_insights?.stockout_risk === 'high' || item.ai_insights?.stockout_risk === 'very_high').length
    const deadStockRisk = inventoryItems.filter(item => item.ai_insights?.dead_stock_risk === 'high').length

    return {
      totalItems,
      totalValue,
      lowStockItems,
      overstockItems,
      stockoutItems,
      avgTurnover,
      avgHealthScore,
      highRiskItems,
      deadStockRisk,
      categories: [...new Set(inventoryItems.map(item => item.category))].length,
      suppliers: [...new Set(inventoryItems.map(item => item.supplier))].length
    }
  }, [inventoryItems])

  // Filter and search functionality
  useEffect(() => {
    let filtered = inventoryItems

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.barcode.includes(searchQuery) ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    // Status filter
    if (selectedStatus !== 'All') {
      if (selectedStatus === 'Low Stock') {
        filtered = filtered.filter(item => item.current_stock <= item.min_stock_level)
      } else if (selectedStatus === 'Overstock') {
        filtered = filtered.filter(item => item.current_stock > item.max_stock_level)
      } else if (selectedStatus === 'In Stock') {
        filtered = filtered.filter(item => item.current_stock > item.min_stock_level && item.current_stock <= item.max_stock_level)
      } else if (selectedStatus === 'Out of Stock') {
        filtered = filtered.filter(item => item.current_stock === 0)
      }
    }

    // Velocity filter
    if (selectedVelocity !== 'All') {
      filtered = filtered.filter(item => item.velocity_class === selectedVelocity)
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      if (sortBy === 'health_score') {
        aValue = a.ai_insights?.inventory_health_score || 0
        bValue = b.ai_insights?.inventory_health_score || 0
      }
      
      if (typeof aValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }
    })

    setFilteredItems(filtered)
    setAnalyticsData(calculateAnalytics())
  }, [inventoryItems, searchQuery, selectedCategory, selectedStatus, selectedVelocity, sortBy, sortDirection, calculateAnalytics])

  // Get stock status styling
  const getStockStatus = (item) => {
    if (item.current_stock === 0) {
      return { status: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle }
    } else if (item.current_stock <= item.min_stock_level) {
      return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertTriangle }
    } else if (item.current_stock > item.max_stock_level) {
      return { status: 'Overstock', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: TrendingUp }
    } else {
      return { status: 'In Stock', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle }
    }
  }

  // Get AI insight styling
  const getAIInsightColor = (value, type) => {
    if (type === 'risk') {
      if (value === 'very_high' || value === 'high') return 'text-red-600'
      if (value === 'medium') return 'text-yellow-600'
      return 'text-green-600'
    } else if (type === 'score') {
      if (value >= 8) return 'text-green-600'
      if (value >= 6) return 'text-yellow-600'
      return 'text-red-600'
    }
    return 'text-gray-600'
  }

  const categories = ['All', ...new Set(inventoryItems.map(item => item.category))]
  const velocityClasses = ['All', 'A', 'B', 'C']

  return (
    <UniversalTourProvider industryKey="enterprise-inventory" autoStart={true}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex">
        <EnterpriseRetailSolutionSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <TourElement tourId="inventory-header">
            <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/50 flex items-center justify-between px-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">Inventory Management</h1>
                    <p className="text-xs text-gray-500">{user?.organizationName || 'HERA Retail Store'}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {analyticsData && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500/10 to-emerald-600/10 rounded-lg border border-green-200/30">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-800">${analyticsData.totalValue.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500/10 to-indigo-600/10 rounded-lg border border-blue-200/30">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-800">{analyticsData.totalItems} items</span>
                    </div>
                  </div>
                )}
                
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-purple-600 to-indigo-700"
                  onClick={() => setShowAddItem(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </header>
          </TourElement>

          {/* Filters and Search */}
          <TourElement tourId="inventory-filters">
            <div className="p-6 border-b border-gray-200/50 bg-gray-50/30">
              <div className="flex flex-col gap-4">
                {/* Search and View Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search by name, SKU, barcode, or brand..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-80 bg-white"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <QrCode className="w-4 h-4 mr-2" />
                      Scan
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'analytics' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('analytics')}
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Filter Controls */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-gray-700">Category:</Label>
                    <div className="flex gap-2">
                      {categories.map(category => (
                        <Button
                          key={category}
                          variant={selectedCategory === category ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedCategory(category)}
                          className={selectedCategory === category 
                            ? "bg-gradient-to-r from-purple-600 to-indigo-700" 
                            : "hover:bg-purple-50"
                          }
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-gray-700">Status:</Label>
                    <div className="flex gap-2">
                      {['All', 'In Stock', 'Low Stock', 'Overstock', 'Out of Stock'].map(status => (
                        <Button
                          key={status}
                          variant={selectedStatus === status ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedStatus(status)}
                          className={selectedStatus === status 
                            ? "bg-gradient-to-r from-purple-600 to-indigo-700" 
                            : "hover:bg-purple-50"
                          }
                        >
                          {status}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-gray-700">Velocity:</Label>
                    <div className="flex gap-2">
                      {velocityClasses.map(velocity => (
                        <Button
                          key={velocity}
                          variant={selectedVelocity === velocity ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedVelocity(velocity)}
                          className={selectedVelocity === velocity 
                            ? "bg-gradient-to-r from-purple-600 to-indigo-700" 
                            : "hover:bg-purple-50"
                          }
                        >
                          {velocity === 'All' ? 'All' : `Class ${velocity}`}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TourElement>

          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            {viewMode === 'analytics' && analyticsData && (
              <TourElement tourId="inventory-analytics">
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Key Metrics Cards */}
                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-600 font-medium">Total Inventory Value</p>
                            <p className="text-2xl font-bold text-green-800">${analyticsData.totalValue.toLocaleString()}</p>
                          </div>
                          <DollarSign className="w-8 h-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-600 font-medium">Total Items</p>
                            <p className="text-2xl font-bold text-blue-800">{analyticsData.totalItems.toLocaleString()}</p>
                            <p className="text-xs text-blue-600">{analyticsData.categories} categories</p>
                          </div>
                          <Package className="w-8 h-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-yellow-600 font-medium">Low Stock Alerts</p>
                            <p className="text-2xl font-bold text-yellow-800">{analyticsData.lowStockItems}</p>
                            <p className="text-xs text-yellow-600">Requires attention</p>
                          </div>
                          <AlertTriangle className="w-8 h-8 text-yellow-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-purple-600 font-medium">Avg Health Score</p>
                            <p className="text-2xl font-bold text-purple-800">{analyticsData.avgHealthScore.toFixed(1)}/10</p>
                            <p className="text-xs text-purple-600">AI assessment</p>
                          </div>
                          <Brain className="w-8 h-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-red-600 font-medium">High Risk Items</p>
                            <p className="text-2xl font-bold text-red-800">{analyticsData.highRiskItems}</p>
                            <p className="text-xs text-red-600">Stockout risk</p>
                          </div>
                          <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-orange-600 font-medium">Dead Stock Risk</p>
                            <p className="text-2xl font-bold text-orange-800">{analyticsData.deadStockRisk}</p>
                            <p className="text-xs text-orange-600">Items to clear</p>
                          </div>
                          <Archive className="w-8 h-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-teal-600 font-medium">Avg Turnover</p>
                            <p className="text-2xl font-bold text-teal-800">{analyticsData.avgTurnover.toFixed(1)}x</p>
                            <p className="text-xs text-teal-600">Annual turns</p>
                          </div>
                          <RefreshCw className="w-8 h-8 text-teal-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-indigo-600 font-medium">Overstock Items</p>
                            <p className="text-2xl font-bold text-indigo-800">{analyticsData.overstockItems}</p>
                            <p className="text-xs text-indigo-600">Excess inventory</p>
                          </div>
                          <TrendingUp className="w-8 h-8 text-indigo-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* AI Insights Section */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-600" />
                        AI-Powered Inventory Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Top Recommendations */}
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                          <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Priority Actions
                          </h4>
                          <div className="space-y-2">
                            <div className="text-sm p-2 bg-white rounded border-l-4 border-red-400">
                              <p className="font-medium text-red-800">Smart Watch Series 8</p>
                              <p className="text-red-600">Critical: Only 3 units left, reorder immediately</p>
                            </div>
                            <div className="text-sm p-2 bg-white rounded border-l-4 border-orange-400">
                              <p className="font-medium text-orange-800">Vintage Sunglasses</p>
                              <p className="text-orange-600">Overstock: 85 units, consider clearance sale</p>
                            </div>
                            <div className="text-sm p-2 bg-white rounded border-l-4 border-green-400">
                              <p className="font-medium text-green-800">iPhone 15 Pro Max</p>
                              <p className="text-green-600">Optimal: Strong performance, maintain levels</p>
                            </div>
                          </div>
                        </div>

                        {/* Demand Forecast */}
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Demand Forecast (30 days)
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-blue-700">AirPods Pro (3rd Gen)</span>
                              <span className="font-semibold text-blue-800">45 units</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-blue-700">Designer Denim Jeans</span>
                              <span className="font-semibold text-blue-800">32 units</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-blue-700">iPhone 15 Pro Max</span>
                              <span className="font-semibold text-blue-800">28 units</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-blue-700">Athletic Sneakers</span>
                              <span className="font-semibold text-blue-800">25 units</span>
                            </div>
                          </div>
                        </div>

                        {/* Price Optimization */}
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Price Optimization
                          </h4>
                          <div className="space-y-2">
                            <div className="text-sm p-2 bg-white rounded">
                              <p className="font-medium text-green-800">MacBook Pro 14"</p>
                              <p className="text-green-600">Increase by 5% - Premium positioning</p>
                            </div>
                            <div className="text-sm p-2 bg-white rounded">
                              <p className="font-medium text-green-800">Designer Jeans</p>
                              <p className="text-green-600">Bundle discount - Cross-sell opportunity</p>
                            </div>
                            <div className="text-sm p-2 bg-white rounded">
                              <p className="font-medium text-green-800">Phone Case Pro</p>
                              <p className="text-green-600">Volume discount - High turnover</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TourElement>
            )}

            {viewMode === 'grid' && (
              <TourElement tourId="inventory-grid">
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.map(item => {
                      const stockStatus = getStockStatus(item)
                      const StatusIcon = stockStatus.icon
                      
                      return (
                        <Card 
                          key={item.id}
                          className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                          onClick={() => {
                            setSelectedItem(item)
                            setShowItemDetail(true)
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="text-center mb-4">
                              <div className="text-3xl mb-2">{item.image}</div>
                              <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2 h-8">
                                {item.name}
                              </h3>
                              <p className="text-xs text-gray-500">{item.brand}</p>
                              <p className="text-xs text-gray-400">{item.sku}</p>
                            </div>
                            
                            <div className="space-y-3">
                              {/* Stock Status */}
                              <div className="flex items-center justify-center">
                                <Badge className={`${stockStatus.color} flex items-center gap-1`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {stockStatus.status}
                                </Badge>
                              </div>
                              
                              {/* Stock Level */}
                              <div className="text-center">
                                <p className="text-lg font-bold text-gray-900">{item.current_stock} units</p>
                                <p className="text-xs text-gray-500">
                                  Min: {item.min_stock_level} | Max: {item.max_stock_level}
                                </p>
                              </div>
                              
                              {/* Price and Margin */}
                              <div className="flex justify-between text-sm">
                                <div className="text-center">
                                  <p className="text-gray-500">Cost</p>
                                  <p className="font-semibold">${item.cost_per_unit.toFixed(2)}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-gray-500">Price</p>
                                  <p className="font-semibold">${item.selling_price.toFixed(2)}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-gray-500">Margin</p>
                                  <p className="font-semibold text-green-600">{item.margin_percent.toFixed(1)}%</p>
                                </div>
                              </div>
                              
                              {/* AI Insights */}
                              {item.ai_insights && (
                                <div className="p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded border border-purple-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1">
                                      <Brain className="w-3 h-3 text-purple-600" />
                                      <span className="text-xs font-medium text-purple-900">AI Health Score</span>
                                    </div>
                                    <span className={`text-xs font-bold ${getAIInsightColor(item.ai_insights.inventory_health_score, 'score')}`}>
                                      {item.ai_insights.inventory_health_score}/10
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-purple-700">Demand (30d):</span>
                                      <span className="font-medium">{item.ai_insights.demand_forecast_next_30_days}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-purple-700">Stockout Risk:</span>
                                      <span className={`font-medium capitalize ${getAIInsightColor(item.ai_insights.stockout_risk, 'risk')}`}>
                                        {item.ai_insights.stockout_risk.replace('_', ' ')}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-purple-700">Turnover:</span>
                                      <span className="font-medium">{item.ai_insights.inventory_turn_prediction}x</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Velocity Class */}
                              <div className="flex justify-center">
                                <Badge variant="outline" className={`text-xs ${
                                  item.velocity_class === 'A' 
                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                    : item.velocity_class === 'B'
                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                    : 'bg-gray-50 text-gray-700 border-gray-200'
                                }`}>
                                  Velocity Class {item.velocity_class}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              </TourElement>
            )}

            {viewMode === 'table' && (
              <TourElement tourId="inventory-table">
                <div className="p-6">
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="text-left p-4 font-semibold text-gray-900">Item</th>
                            <th className="text-left p-4 font-semibold text-gray-900">Stock</th>
                            <th className="text-left p-4 font-semibold text-gray-900">Status</th>
                            <th className="text-left p-4 font-semibold text-gray-900">Price</th>
                            <th className="text-left p-4 font-semibold text-gray-900">Margin</th>
                            <th className="text-left p-4 font-semibold text-gray-900">Velocity</th>
                            <th className="text-left p-4 font-semibold text-gray-900">AI Score</th>
                            <th className="text-left p-4 font-semibold text-gray-900">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredItems.map(item => {
                            const stockStatus = getStockStatus(item)
                            const StatusIcon = stockStatus.icon
                            
                            return (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="text-xl">{item.image}</div>
                                    <div>
                                      <p className="font-medium text-gray-900">{item.name}</p>
                                      <p className="text-sm text-gray-500">{item.sku}</p>
                                      <p className="text-xs text-gray-400">{item.brand}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <p className="font-semibold text-gray-900">{item.current_stock}</p>
                                  <p className="text-xs text-gray-500">Min: {item.min_stock_level}</p>
                                </td>
                                <td className="p-4">
                                  <Badge className={`${stockStatus.color} flex items-center gap-1 w-fit`}>
                                    <StatusIcon className="w-3 h-3" />
                                    {stockStatus.status}
                                  </Badge>
                                </td>
                                <td className="p-4">
                                  <p className="font-semibold">${item.selling_price.toFixed(2)}</p>
                                  <p className="text-xs text-gray-500">Cost: ${item.cost_per_unit.toFixed(2)}</p>
                                </td>
                                <td className="p-4">
                                  <p className="font-semibold text-green-600">{item.margin_percent.toFixed(1)}%</p>
                                </td>
                                <td className="p-4">
                                  <Badge variant="outline" className={`${
                                    item.velocity_class === 'A' 
                                      ? 'bg-green-50 text-green-700 border-green-200' 
                                      : item.velocity_class === 'B'
                                      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                      : 'bg-gray-50 text-gray-700 border-gray-200'
                                  }`}>
                                    Class {item.velocity_class}
                                  </Badge>
                                </td>
                                <td className="p-4">
                                  {item.ai_insights && (
                                    <div className="flex items-center gap-2">
                                      <Brain className="w-4 h-4 text-purple-600" />
                                      <span className={`font-semibold ${getAIInsightColor(item.ai_insights.inventory_health_score, 'score')}`}>
                                        {item.ai_insights.inventory_health_score}/10
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedItem(item)
                                        setShowItemDetail(true)
                                      }}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      <Edit3 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </TourElement>
            )}
          </div>
        </div>

        {/* Item Detail Modal */}
        {showItemDetail && selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{selectedItem.image}</div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedItem.name}</h2>
                      <p className="text-gray-600">{selectedItem.brand} • {selectedItem.sku}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowItemDetail(false)}
                  >
                    ×
                  </Button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Stock Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Stock Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Stock:</span>
                        <span className="font-semibold">{selectedItem.current_stock} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Min Level:</span>
                        <span>{selectedItem.min_stock_level} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Level:</span>
                        <span>{selectedItem.max_stock_level} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reorder Point:</span>
                        <span>{selectedItem.reorder_point} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="text-sm">{selectedItem.location}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pricing Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Pricing & Profitability</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cost Price:</span>
                        <span className="font-semibold">${selectedItem.cost_per_unit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Selling Price:</span>
                        <span className="font-semibold">${selectedItem.selling_price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Margin:</span>
                        <span className="font-semibold text-green-600">{selectedItem.margin_percent.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Profit per Unit:</span>
                        <span className="font-semibold text-green-600">
                          ${(selectedItem.selling_price - selectedItem.cost_per_unit).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Value:</span>
                        <span className="font-semibold">
                          ${(selectedItem.current_stock * selectedItem.cost_per_unit).toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Performance Metrics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Velocity Class:</span>
                        <Badge variant="outline" className={
                          selectedItem.velocity_class === 'A' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : selectedItem.velocity_class === 'B'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }>
                          Class {selectedItem.velocity_class}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ABC Analysis:</span>
                        <span className="font-semibold">{selectedItem.abc_analysis}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">XYZ Analysis:</span>
                        <span className="font-semibold">{selectedItem.xyz_analysis}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Received:</span>
                        <span>{selectedItem.last_received}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Sold:</span>
                        <span>{selectedItem.last_sold}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Insights Section */}
                {selectedItem.ai_insights && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-600" />
                        AI-Powered Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900">Demand & Risk</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">30-Day Forecast:</span>
                              <span className="font-semibold">{selectedItem.ai_insights.demand_forecast_next_30_days} units</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Stockout Risk:</span>
                              <span className={`font-semibold capitalize ${getAIInsightColor(selectedItem.ai_insights.stockout_risk, 'risk')}`}>
                                {selectedItem.ai_insights.stockout_risk.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Dead Stock Risk:</span>
                              <span className={`font-semibold capitalize ${getAIInsightColor(selectedItem.ai_insights.dead_stock_risk, 'risk')}`}>
                                {selectedItem.ai_insights.dead_stock_risk.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900">Performance</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Health Score:</span>
                              <span className={`font-semibold ${getAIInsightColor(selectedItem.ai_insights.inventory_health_score, 'score')}`}>
                                {selectedItem.ai_insights.inventory_health_score}/10
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Turnover Rate:</span>
                              <span className="font-semibold">{selectedItem.ai_insights.inventory_turn_prediction}x/year</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Customer Satisfaction:</span>
                              <span className="font-semibold">{selectedItem.ai_insights.customer_satisfaction_score}/10</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900">Optimization</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Optimal Reorder:</span>
                              <span className="font-semibold">{selectedItem.ai_insights.optimal_reorder_quantity} units</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Price Suggestion:</span>
                              <span className="font-semibold capitalize">
                                {selectedItem.ai_insights.price_optimization_suggestion.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Return Rate:</span>
                              <span className="font-semibold">{selectedItem.ai_insights.return_rate}%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <h4 className="font-semibold text-purple-900 mb-2">Cross-Sell Opportunities</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedItem.ai_insights.cross_sell_opportunities.map(opportunity => (
                            <Badge key={opportunity} variant="outline" className="bg-white text-purple-700 border-purple-200">
                              {opportunity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowItemDetail(false)}>
                  Close
                </Button>
                <Button variant="outline">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Item
                </Button>
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-700">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reorder Now
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </UniversalTourProvider>
  )
}