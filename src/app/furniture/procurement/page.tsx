'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ShoppingCart,
  Package,
  Truck,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Building2,
  Factory,
  Globe,
  Star,
  Award,
  Crown,
  Gem,
  Zap,
  Eye,
  Download,
  Share2,
  RefreshCw,
  Filter,
  Search,
  Settings,
  MapPin,
  Phone,
  Mail,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Target,
  Lightbulb,
  Rocket,
  Brain,
  Compass,
  Shield,
  Layers,
  Database,
  Network,
  Cpu,
  FileText,
  Clipboard,
  Timer,
  PlayCircle,
  PauseCircle,
  StopCircle,
  RotateCcw,
  CheckSquare,
  Square,
  AlertCircle,
  Info,
  ThumbsUp,
  Gauge,
  Percent,
  Scissors,
  Wrench,
  Hammer,
  Ruler,
  Paintbrush,
  Drill,
  Saw,
  TreePine,
  Mountain,
  Leaf,
  Droplets,
  Wind,
  Sun,
  Thermometer,
  Wifi,
  Bluetooth,
  Power,
  Battery,
  MemoryStick,
  HardDrive,
  Scale,
  Calculator,
  CreditCard,
  Banknote,
  Receipt,
  FileBarChart,
  TrendingUpIcon,
  BarChart,
  Box,
  Warehouse,
  Forklift
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface ProcurementMetric {
  id: string
  label: string
  value: string | number
  change: string
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: React.ElementType
  color: string
  target?: string
}

interface Supplier {
  id: string
  name: string
  category: string
  rating: number
  reliability: number
  costScore: number
  location: string
  contact: string
  email: string
  lastOrder: string
  totalOrders: number
  totalValue: number
  status: 'active' | 'pending' | 'suspended' | 'preferred'
  leadTime: number
  paymentTerms: string
  certifications: string[]
}

interface PurchaseOrder {
  id: string
  poNumber: string
  supplier: string
  category: string
  items: number
  totalValue: number
  orderDate: string
  expectedDelivery: string
  actualDelivery?: string
  status: 'draft' | 'sent' | 'confirmed' | 'shipped' | 'delivered' | 'completed' | 'cancelled'
  priority: 'urgent' | 'high' | 'normal' | 'low'
  approval: 'pending' | 'approved' | 'rejected'
  requestedBy: string
  approvedBy?: string
}

interface MaterialRequest {
  id: string
  requestNumber: string
  department: string
  requestedBy: string
  items: {
    material: string
    quantity: number
    unit: string
    urgency: 'immediate' | 'urgent' | 'normal' | 'future'
    specification: string
  }[]
  totalEstimatedCost: number
  dateRequested: string
  dateRequired: string
  status: 'pending' | 'approved' | 'ordered' | 'received' | 'rejected'
  priority: 'critical' | 'high' | 'normal' | 'low'
  justification: string
}

interface InventoryItem {
  id: string
  material: string
  category: string
  currentStock: number
  minimumStock: number
  maximumStock: number
  unit: string
  unitCost: number
  totalValue: number
  lastReceived: string
  supplier: string
  leadTime: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'on_order'
  usage30Days: number
  forecastDemand: number
}

function ProcurementPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Procurement Performance Metrics
  const procurementMetrics: ProcurementMetric[] = [
    {
      id: 'total-procurement',
      label: 'Total Procurement',
      value: '₹45.2L',
      change: '+12.8%',
      changeType: 'increase',
      icon: ShoppingCart,
      color: 'text-[var(--jewelry-gold-500)]'
    },
    {
      id: 'active-suppliers',
      label: 'Active Suppliers',
      value: 28,
      change: '+3',
      changeType: 'increase',
      icon: Building2,
      color: 'text-[var(--jewelry-blue-500)]'
    },
    {
      id: 'cost-savings',
      label: 'Cost Savings',
      value: '₹8.7L',
      change: '+18.5%',
      changeType: 'increase',
      icon: TrendingDown,
      color: 'text-[var(--jewelry-gold-500)]'
    },
    {
      id: 'on-time-delivery',
      label: 'On-Time Delivery',
      value: '94%',
      change: '+2.1%',
      changeType: 'increase',
      icon: Truck,
      color: 'text-[var(--jewelry-blue-500)]',
      target: '96%'
    },
    {
      id: 'supplier-rating',
      label: 'Avg Supplier Rating',
      value: '4.6/5',
      change: '+0.2',
      changeType: 'increase',
      icon: Star,
      color: 'text-[var(--jewelry-gold-500)]'
    },
    {
      id: 'purchase-orders',
      label: 'Active POs',
      value: 47,
      change: '+8',
      changeType: 'increase',
      icon: FileText,
      color: 'text-[var(--jewelry-blue-500)]'
    }
  ]

  // Supplier Data
  const suppliers: Supplier[] = [
    {
      id: 'sup-001',
      name: 'Kerala Timber Industries',
      category: 'Raw Materials',
      rating: 4.8,
      reliability: 96,
      costScore: 88,
      location: 'Thiruvananthapuram, Kerala',
      contact: '+91 98765 43210',
      email: 'sales@keralatimber.com',
      lastOrder: '2025-01-14',
      totalOrders: 156,
      totalValue: 12500000,
      status: 'preferred',
      leadTime: 7,
      paymentTerms: '30 days',
      certifications: ['FSC Certified', 'ISO 9001', 'CARB Compliant']
    },
    {
      id: 'sup-002',
      name: 'Premium Hardware Solutions',
      category: 'Hardware & Fittings',
      rating: 4.5,
      reliability: 92,
      costScore: 85,
      location: 'Bangalore, Karnataka',
      contact: '+91 98765 43211',
      email: 'orders@premiumhardware.com',
      lastOrder: '2025-01-12',
      totalOrders: 89,
      totalValue: 6800000,
      status: 'active',
      leadTime: 5,
      paymentTerms: '45 days',
      certifications: ['ISO 9001', 'BIS Approved']
    },
    {
      id: 'sup-003',
      name: 'Fabric & Upholstery Co.',
      category: 'Textiles',
      rating: 4.7,
      reliability: 94,
      costScore: 90,
      location: 'Chennai, Tamil Nadu',
      contact: '+91 98765 43212',
      email: 'info@fabricupholstery.com',
      lastOrder: '2025-01-10',
      totalOrders: 67,
      totalValue: 4200000,
      status: 'preferred',
      leadTime: 10,
      paymentTerms: '30 days',
      certifications: ['OEKO-TEX', 'GREENGUARD Gold']
    },
    {
      id: 'sup-004',
      name: 'Industrial Adhesives Ltd',
      category: 'Chemicals',
      rating: 4.3,
      reliability: 89,
      costScore: 82,
      location: 'Mumbai, Maharashtra',
      contact: '+91 98765 43213',
      email: 'sales@industrialadhesives.com',
      lastOrder: '2025-01-08',
      totalOrders: 45,
      totalValue: 2800000,
      status: 'active',
      leadTime: 12,
      paymentTerms: '60 days',
      certifications: ['ISO 14001', 'REACH Compliant']
    },
    {
      id: 'sup-005',
      name: 'Packaging Specialists',
      category: 'Packaging',
      rating: 4.4,
      reliability: 91,
      costScore: 87,
      location: 'Kochi, Kerala',
      contact: '+91 98765 43214',
      email: 'orders@packagingspecialists.com',
      lastOrder: '2025-01-15',
      totalOrders: 78,
      totalValue: 3500000,
      status: 'active',
      leadTime: 6,
      paymentTerms: '30 days',
      certifications: ['FSC Certified', 'Recyclable Materials']
    }
  ]

  // Purchase Orders
  const purchaseOrders: PurchaseOrder[] = [
    {
      id: 'po-001',
      poNumber: 'PO-2025-0089',
      supplier: 'Kerala Timber Industries',
      category: 'Raw Materials',
      items: 15,
      totalValue: 280000,
      orderDate: '2025-01-14',
      expectedDelivery: '2025-01-21',
      status: 'confirmed',
      priority: 'high',
      approval: 'approved',
      requestedBy: 'Production Manager',
      approvedBy: 'Procurement Head'
    },
    {
      id: 'po-002',
      poNumber: 'PO-2025-0090',
      supplier: 'Premium Hardware Solutions',
      category: 'Hardware',
      items: 8,
      totalValue: 125000,
      orderDate: '2025-01-15',
      expectedDelivery: '2025-01-20',
      status: 'shipped',
      priority: 'urgent',
      approval: 'approved',
      requestedBy: 'Assembly Department',
      approvedBy: 'Plant Manager'
    },
    {
      id: 'po-003',
      poNumber: 'PO-2025-0091',
      supplier: 'Fabric & Upholstery Co.',
      category: 'Textiles',
      items: 12,
      totalValue: 195000,
      orderDate: '2025-01-13',
      expectedDelivery: '2025-01-23',
      status: 'confirmed',
      priority: 'normal',
      approval: 'approved',
      requestedBy: 'Upholstery Department',
      approvedBy: 'Quality Manager'
    },
    {
      id: 'po-004',
      poNumber: 'PO-2025-0092',
      supplier: 'Industrial Adhesives Ltd',
      category: 'Chemicals',
      items: 6,
      totalValue: 89000,
      orderDate: '2025-01-16',
      expectedDelivery: '2025-01-28',
      status: 'sent',
      priority: 'normal',
      approval: 'approved',
      requestedBy: 'Production Manager',
      approvedBy: 'Safety Officer'
    }
  ]

  // Material Requests
  const materialRequests: MaterialRequest[] = [
    {
      id: 'req-001',
      requestNumber: 'REQ-2025-0134',
      department: 'Production',
      requestedBy: 'Floor Supervisor',
      items: [
        { material: 'Teak Wood Planks', quantity: 200, unit: 'sq ft', urgency: 'urgent', specification: '1" thick, premium grade' },
        { material: 'Wood Screws', quantity: 500, unit: 'pieces', urgency: 'normal', specification: '2.5" stainless steel' }
      ],
      totalEstimatedCost: 85000,
      dateRequested: '2025-01-16',
      dateRequired: '2025-01-22',
      status: 'approved',
      priority: 'high',
      justification: 'Required for luxury hotel furniture order completion'
    },
    {
      id: 'req-002',
      requestNumber: 'REQ-2025-0135',
      department: 'Quality Control',
      requestedBy: 'QC Manager',
      items: [
        { material: 'Testing Equipment', quantity: 2, unit: 'units', urgency: 'immediate', specification: 'Digital moisture meter' },
        { material: 'Calibration Tools', quantity: 1, unit: 'set', urgency: 'normal', specification: 'Precision measuring set' }
      ],
      totalEstimatedCost: 45000,
      dateRequested: '2025-01-15',
      dateRequired: '2025-01-20',
      status: 'pending',
      priority: 'critical',
      justification: 'Essential for maintaining quality standards compliance'
    },
    {
      id: 'req-003',
      requestNumber: 'REQ-2025-0136',
      department: 'Maintenance',
      requestedBy: 'Maintenance Head',
      items: [
        { material: 'Machine Oil', quantity: 50, unit: 'liters', urgency: 'urgent', specification: 'ISO VG 68 hydraulic oil' },
        { material: 'Replacement Belts', quantity: 10, unit: 'pieces', urgency: 'normal', specification: 'V-belt size A42' }
      ],
      totalEstimatedCost: 28000,
      dateRequested: '2025-01-14',
      dateRequired: '2025-01-25',
      status: 'ordered',
      priority: 'normal',
      justification: 'Preventive maintenance schedule requirements'
    }
  ]

  // Inventory Items
  const inventoryItems: InventoryItem[] = [
    {
      id: 'inv-001',
      material: 'Teak Wood',
      category: 'Raw Materials',
      currentStock: 1200,
      minimumStock: 500,
      maximumStock: 2000,
      unit: 'sq ft',
      unitCost: 280,
      totalValue: 336000,
      lastReceived: '2025-01-12',
      supplier: 'Kerala Timber Industries',
      leadTime: 7,
      status: 'in_stock',
      usage30Days: 450,
      forecastDemand: 600
    },
    {
      id: 'inv-002',
      material: 'Premium Hinges',
      category: 'Hardware',
      currentStock: 150,
      minimumStock: 200,
      maximumStock: 500,
      unit: 'pieces',
      unitCost: 125,
      totalValue: 18750,
      lastReceived: '2025-01-10',
      supplier: 'Premium Hardware Solutions',
      leadTime: 5,
      status: 'low_stock',
      usage30Days: 180,
      forecastDemand: 220
    },
    {
      id: 'inv-003',
      material: 'Luxury Fabric',
      category: 'Textiles',
      currentStock: 0,
      minimumStock: 100,
      maximumStock: 300,
      unit: 'meters',
      unitCost: 450,
      totalValue: 0,
      lastReceived: '2025-01-05',
      supplier: 'Fabric & Upholstery Co.',
      leadTime: 10,
      status: 'out_of_stock',
      usage30Days: 120,
      forecastDemand: 150
    },
    {
      id: 'inv-004',
      material: 'Wood Adhesive',
      category: 'Chemicals',
      currentStock: 45,
      minimumStock: 20,
      maximumStock: 80,
      unit: 'kg',
      unitCost: 185,
      totalValue: 8325,
      lastReceived: '2025-01-14',
      supplier: 'Industrial Adhesives Ltd',
      leadTime: 12,
      status: 'in_stock',
      usage30Days: 25,
      forecastDemand: 30
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'confirmed': case 'in_stock': case 'approved': case 'completed': 
        return 'text-[var(--jewelry-success)] bg-green-500/20'
      case 'pending': case 'sent': case 'ordered': case 'low_stock':
        return 'text-[var(--jewelry-warning)] bg-yellow-500/20'
      case 'shipped': case 'delivered': case 'received':
        return 'text-[var(--jewelry-info)] bg-blue-500/20'
      case 'suspended': case 'cancelled': case 'rejected': case 'out_of_stock':
        return 'text-[var(--jewelry-error)] bg-red-500/20'
      case 'preferred': case 'draft':
        return 'text-[var(--jewelry-gold-500)] bg-amber-500/20'
      case 'on_order':
        return 'text-[var(--jewelry-info)] bg-blue-500/20'
      default: return 'text-gray-300 bg-gray-500/20'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      case 'normal': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'low': case 'future': return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      case 'immediate': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return 'out_of_stock'
    if (item.currentStock <= item.minimumStock) return 'low_stock'
    return 'in_stock'
  }

  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--jewelry-blue-500)] to-[var(--jewelry-blue-700)] flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-[var(--jewelry-gold-400)]" />
              </div>
              Procurement Management
            </h1>
            <p className="text-gray-300 mt-2">
              Strategic sourcing, supplier management, and procurement operations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 rounded-md border bg-black/20 border-gray-600 text-white focus:border-[var(--jewelry-gold-500)]"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
            <Button 
              variant="outline" 
              className="gap-2 text-white border-gray-400 hover:border-white hover:text-white"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span className="text-white">Auto Refresh</span>
            </Button>
            <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
              <Download className="h-4 w-4" />
              <span className="text-white">Export Report</span>
            </Button>
            <Button className="gap-2 bg-[var(--jewelry-gold-500)] text-black hover:bg-[var(--jewelry-gold-600)] border-0">
              <Eye className="h-4 w-4" />
              <span className="text-black font-medium">Procurement Dashboard</span>
            </Button>
          </div>
        </div>

        {/* Procurement Status Bar */}
        <div className="jewelry-glass-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[var(--jewelry-success)]" />
              <span className="text-white font-medium">Procurement Operations</span>
              <div className="w-2 h-2 bg-[var(--jewelry-success)] rounded-full animate-pulse"></div>
              <span className="text-gray-400 text-sm">All Systems Active</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-400">Pending Approvals</p>
                <p className="font-semibold text-[var(--jewelry-warning)]">3</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Active POs</p>
                <p className="font-semibold text-white">47</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Suppliers</p>
                <p className="font-semibold text-[var(--jewelry-gold-500)]">28</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Monthly Spend</p>
                <p className="font-semibold text-[var(--jewelry-success)]">₹45.2L</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Last Update</p>
              <p className="text-sm text-white">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        {/* Key Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {procurementMetrics.map((metric) => (
            <div key={metric.id} className="jewelry-glass-card p-6 hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center">
                    <metric.icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{metric.label}</p>
                    <p className="text-2xl font-bold text-white">{metric.value}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {metric.changeType === 'increase' ? (
                    <ArrowUp className="h-4 w-4 text-[var(--jewelry-success)]" />
                  ) : metric.changeType === 'decrease' ? (
                    <ArrowDown className="h-4 w-4 text-[var(--jewelry-error)]" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                  <span className={`text-sm font-medium ${
                    metric.changeType === 'increase' ? 'text-[var(--jewelry-success)]' : 
                    metric.changeType === 'decrease' ? 'text-[var(--jewelry-error)]' : 
                    'text-gray-400'
                  }`}>
                    {metric.change}
                  </span>
                </div>
                {metric.target && (
                  <span className="text-xs text-gray-400">Target: {metric.target}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Procurement Tabs */}
        <Tabs defaultValue="suppliers" className="space-y-6">
          <TabsList className="bg-black/20 border border-gray-600">
            <TabsTrigger value="suppliers" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Suppliers
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Purchase Orders
            </TabsTrigger>
            <TabsTrigger value="requests" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Material Requests
            </TabsTrigger>
            <TabsTrigger value="inventory" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Inventory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suppliers" className="space-y-6">
            {/* Supplier Management */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-[var(--jewelry-blue-500)]" />
                  <h3 className="text-xl font-semibold text-white">Supplier Portfolio</h3>
                  <Badge className="bg-[var(--jewelry-gold-500)]/20 text-[var(--jewelry-gold-500)] border-[var(--jewelry-gold-500)]/30">
                    28 Active Suppliers
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 rounded-md border bg-black/20 border-gray-600 text-white focus:border-[var(--jewelry-gold-500)]"
                  >
                    <option value="all">All Categories</option>
                    <option value="raw_materials">Raw Materials</option>
                    <option value="hardware">Hardware & Fittings</option>
                    <option value="textiles">Textiles</option>
                    <option value="chemicals">Chemicals</option>
                    <option value="packaging">Packaging</option>
                  </select>
                  <Button variant="outline" size="sm" className="text-white border-gray-400 hover:border-white hover:text-white">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {suppliers.map((supplier) => (
                  <div key={supplier.id} className="bg-black/20 rounded-lg p-4 border border-gray-600 hover:border-[var(--jewelry-gold-500)]/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">{supplier.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs border ${getStatusColor(supplier.status)}`}>
                          {supplier.status}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-[var(--jewelry-gold-500)]" />
                          <span className="text-xs text-white">{supplier.rating}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Category</p>
                          <p className="text-white">{supplier.category}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Lead Time</p>
                          <p className="text-white">{supplier.leadTime} days</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Total Orders</p>
                          <p className="text-white">{supplier.totalOrders}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Total Value</p>
                          <p className="text-[var(--jewelry-gold-500)] font-medium">{formatCurrency(supplier.totalValue)}</p>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400 text-sm">Reliability</span>
                          <span className="text-white font-medium">{supplier.reliability}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-[var(--jewelry-success)] h-2 rounded-full"
                            style={{ width: `${supplier.reliability}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400 text-sm">Cost Score</span>
                          <span className="text-white font-medium">{supplier.costScore}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-[var(--jewelry-gold-500)] h-2 rounded-full"
                            style={{ width: `${supplier.costScore}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs">
                          <p className="text-gray-400">Last Order: {formatDate(supplier.lastOrder)}</p>
                          <p className="text-gray-400">Payment: {supplier.paymentTerms}</p>
                        </div>
                        <Button size="sm" variant="outline" className="text-[var(--jewelry-gold-500)] border-[var(--jewelry-gold-500)]/50 hover:bg-[var(--jewelry-gold-500)]/10">
                          <span className="text-[var(--jewelry-gold-500)]">Contact</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            {/* Purchase Orders */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-[var(--jewelry-gold-500)]" />
                  <h3 className="text-xl font-semibold text-white">Purchase Orders Management</h3>
                </div>
                <Button className="gap-2 bg-[var(--jewelry-gold-500)] text-black hover:bg-[var(--jewelry-gold-600)] border-0">
                  <Package className="h-4 w-4" />
                  <span className="text-black font-medium">Create New PO</span>
                </Button>
              </div>

              <div className="space-y-4">
                {purchaseOrders.map((order) => (
                  <div key={order.id} className="bg-black/20 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-white">PO #{order.poNumber}</h4>
                        <Badge className={`text-xs border ${getPriorityColor(order.priority)}`}>
                          {order.priority}
                        </Badge>
                        <Badge className={`text-xs border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </Badge>
                      </div>
                      <span className="text-[var(--jewelry-gold-500)] font-bold text-lg">{formatCurrency(order.totalValue)}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Supplier</p>
                        <p className="text-white font-medium">{order.supplier}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Category</p>
                        <p className="text-white">{order.category}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Items</p>
                        <p className="text-white">{order.items} items</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Expected Delivery</p>
                        <p className="text-white">{formatDate(order.expectedDelivery)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <p className="text-gray-400">Requested by: <span className="text-white">{order.requestedBy}</span></p>
                        <p className="text-gray-400">Order Date: <span className="text-white">{formatDate(order.orderDate)}</span></p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-white border-gray-400 hover:border-white hover:text-white">
                          <Eye className="h-3 w-3 mr-1" />
                          <span className="text-white">View</span>
                        </Button>
                        <Button size="sm" variant="outline" className="text-[var(--jewelry-gold-500)] border-[var(--jewelry-gold-500)]/50 hover:bg-[var(--jewelry-gold-500)]/10">
                          <span className="text-[var(--jewelry-gold-500)]">Track</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            {/* Material Requests */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Clipboard className="h-6 w-6 text-[var(--jewelry-blue-500)]" />
                  <h3 className="text-xl font-semibold text-white">Material Requests</h3>
                </div>
                <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
                  <Calendar className="h-4 w-4" />
                  <span className="text-white">Request Schedule</span>
                </Button>
              </div>

              <div className="space-y-4">
                {materialRequests.map((request) => (
                  <div key={request.id} className="bg-black/20 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-white">REQ #{request.requestNumber}</h4>
                        <Badge className={`text-xs border ${getPriorityColor(request.priority)}`}>
                          {request.priority}
                        </Badge>
                        <Badge className={`text-xs border ${getStatusColor(request.status)}`}>
                          {request.status}
                        </Badge>
                      </div>
                      <span className="text-[var(--jewelry-gold-500)] font-bold">{formatCurrency(request.totalEstimatedCost)}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Department</p>
                        <p className="text-white font-medium">{request.department}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Requested By</p>
                        <p className="text-white">{request.requestedBy}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Required By</p>
                        <p className="text-white">{formatDate(request.dateRequired)}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-400 text-sm mb-2">Requested Items</p>
                      <div className="space-y-2">
                        {request.items.slice(0, 2).map((item, index) => (
                          <div key={index} className="flex justify-between items-center bg-black/30 rounded p-2">
                            <div>
                              <span className="text-white text-sm font-medium">{item.material}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-gray-400 text-xs">{item.quantity} {item.unit}</span>
                                <Badge className={`text-xs ${getPriorityColor(item.urgency)}`}>
                                  {item.urgency}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                        {request.items.length > 2 && (
                          <p className="text-gray-400 text-xs">+{request.items.length - 2} more items</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs">
                        <p className="text-gray-400">Justification:</p>
                        <p className="text-white">{request.justification}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-white border-gray-400 hover:border-white hover:text-white">
                          <Eye className="h-3 w-3 mr-1" />
                          <span className="text-white">Review</span>
                        </Button>
                        {request.status === 'pending' && (
                          <Button size="sm" className="bg-[var(--jewelry-gold-500)] text-black hover:bg-[var(--jewelry-gold-600)]">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            <span className="text-black">Approve</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            {/* Inventory Management */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Warehouse className="h-6 w-6 text-[var(--jewelry-gold-500)]" />
                  <h3 className="text-xl font-semibold text-white">Inventory Overview</h3>
                </div>
                <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-white">Stock Analysis</span>
                </Button>
              </div>

              <div className="space-y-4">
                {inventoryItems.map((item) => (
                  <div key={item.id} className="bg-black/20 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-white">{item.material}</h4>
                        <Badge className={`text-xs border ${getStatusColor(getStockStatus(item))}`}>
                          {getStockStatus(item).replace('_', ' ')}
                        </Badge>
                      </div>
                      <span className="text-[var(--jewelry-gold-500)] font-bold">{formatCurrency(item.totalValue)}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Current Stock</p>
                        <p className="text-white font-bold">{item.currentStock} {item.unit}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Min Stock</p>
                        <p className="text-[var(--jewelry-warning)]">{item.minimumStock} {item.unit}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Unit Cost</p>
                        <p className="text-white">{formatCurrency(item.unitCost)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">30-Day Usage</p>
                        <p className="text-white">{item.usage30Days} {item.unit}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Lead Time</p>
                        <p className="text-white">{item.leadTime} days</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400 text-sm">Stock Level</span>
                        <span className="text-white font-medium">
                          {item.currentStock}/{item.maximumStock} {item.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            getStockStatus(item) === 'out_of_stock' ? 'bg-red-500' :
                            getStockStatus(item) === 'low_stock' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.max((item.currentStock / item.maximumStock) * 100, 5)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs">
                        <p className="text-gray-400">Supplier: <span className="text-white">{item.supplier}</span></p>
                        <p className="text-gray-400">Last Received: <span className="text-white">{formatDate(item.lastReceived)}</span></p>
                      </div>
                      <div className="flex gap-2">
                        {getStockStatus(item) === 'low_stock' && (
                          <Button size="sm" className="bg-[var(--jewelry-warning)] text-black hover:bg-yellow-600">
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            <span className="text-black">Reorder</span>
                          </Button>
                        )}
                        {getStockStatus(item) === 'out_of_stock' && (
                          <Button size="sm" className="bg-red-500 text-white hover:bg-red-600">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            <span className="text-white">Urgent Order</span>
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="text-white border-gray-400 hover:border-white hover:text-white">
                          <Eye className="h-3 w-3 mr-1" />
                          <span className="text-white">Details</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Procurement Summary Footer */}
        <div className="jewelry-glass-card p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Crown className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
              <h3 className="text-2xl font-bold text-white">Strategic Procurement Excellence</h3>
            </div>
            <p className="text-gray-400">Optimizing supply chain efficiency and cost management</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-gold-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Building2 className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">28</p>
              <p className="text-gray-400">Active Suppliers</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-blue-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="h-8 w-8 text-[var(--jewelry-blue-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">₹45.2L</p>
              <p className="text-gray-400">Monthly Procurement</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-gold-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingDown className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">₹8.7L</p>
              <p className="text-gray-400">Cost Savings</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-blue-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="h-8 w-8 text-[var(--jewelry-blue-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">4.6/5</p>
              <p className="text-gray-400">Supplier Rating</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(ProcurementPage)