'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Truck,
  Package,
  MapPin,
  Route,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
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
  Navigation,
  Plane,
  Ship,
  Train,
  Car,
  Bus,
  Fuel,
  Container,
  Warehouse,
  Forklift,
  Scale,
  Calculator,
  CreditCard,
  Receipt,
  FileBarChart,
  Box,
  ShoppingCart,
  PackageCheck,
  PackageX,
  PackagePlus,
  PackageMinus,
  PackageOpen,
  PackageSearch,
  Scan,
  QrCode,
  Barcode,
  Radio,
  Wifi,
  Bluetooth,
  Signal,
  Antenna,
  Satellite,
  Radar,
  Navigation2,
  Map,
  Crosshair,
  Move,
  MoveRight,
  MoveLeft,
  MoveUp,
  MoveDown,
  CornerDownRight,
  CornerUpRight
} from 'lucide-react'
import { Motorcycle } from '@/icons/lucide-shims'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface LogisticsMetric {
  id: string
  label: string
  value: string | number
  change: string
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: React.ElementType
  color: string
  target?: string
}

interface Shipment {
  id: string
  shipmentNumber: string
  customer: string
  destination: string
  items: number
  weight: number
  value: number
  status: 'preparing' | 'dispatched' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'delayed' | 'returned'
  priority: 'urgent' | 'high' | 'normal' | 'low'
  carrier: string
  trackingNumber: string
  dispatchDate: string
  expectedDelivery: string
  actualDelivery?: string
  currentLocation: string
  progress: number
  vehicleType: string
  driver: string
  driverContact: string
}

interface Vehicle {
  id: string
  vehicleNumber: string
  type: 'truck' | 'van' | 'trailer' | 'pickup'
  capacity: number
  currentLoad: number
  status: 'available' | 'in_transit' | 'loading' | 'maintenance' | 'offline'
  driver: string
  currentLocation: string
  fuelLevel: number
  lastMaintenance: string
  nextMaintenance: string
  totalDistance: number
  efficiency: number
  assignments: number
}

interface Route {
  id: string
  routeName: string
  origin: string
  destination: string
  distance: number
  estimatedTime: number
  actualTime?: number
  status: 'active' | 'completed' | 'delayed' | 'cancelled'
  vehicle: string
  driver: string
  shipments: string[]
  stops: {
    location: string
    estimatedTime: string
    actualTime?: string
    status: 'pending' | 'reached' | 'delivered' | 'skipped'
  }[]
  cost: number
  fuelConsumption: number
}

interface Warehouse {
  id: string
  name: string
  location: string
  type: 'main' | 'regional' | 'transit' | 'distribution'
  capacity: number
  currentOccupancy: number
  inboundToday: number
  outboundToday: number
  status: 'operational' | 'busy' | 'maintenance' | 'closed'
  manager: string
  staff: number
  zones: number
  temperature: number
  humidity: number
  security: 'high' | 'medium' | 'standard'
}

function LogisticsPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('today')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [liveTracking, setLiveTracking] = useState(true)

  // Logistics Performance Metrics
  const logisticsMetrics: LogisticsMetric[] = [
    {
      id: 'active-shipments',
      label: 'Active Shipments',
      value: 89,
      change: '+12',
      changeType: 'increase',
      icon: Package,
      color: 'text-[var(--jewelry-gold-500)]'
    },
    {
      id: 'on-time-delivery',
      label: 'On-Time Delivery',
      value: '96.8%',
      change: '+2.3%',
      changeType: 'increase',
      icon: Clock,
      color: 'text-[var(--jewelry-blue-500)]',
      target: '98%'
    },
    {
      id: 'fleet-utilization',
      label: 'Fleet Utilization',
      value: '87%',
      change: '+5%',
      changeType: 'increase',
      icon: Truck,
      color: 'text-[var(--jewelry-gold-500)]'
    },
    {
      id: 'delivery-cost',
      label: 'Avg Delivery Cost',
      value: '₹840',
      change: '-8%',
      changeType: 'decrease',
      icon: DollarSign,
      color: 'text-[var(--jewelry-blue-500)]'
    },
    {
      id: 'distance-covered',
      label: 'Distance Today',
      value: '2,847 km',
      change: '+340 km',
      changeType: 'increase',
      icon: Route,
      color: 'text-[var(--jewelry-gold-500)]'
    },
    {
      id: 'customer-satisfaction',
      label: 'Customer Rating',
      value: '4.7/5',
      change: '+0.2',
      changeType: 'increase',
      icon: Star,
      color: 'text-[var(--jewelry-blue-500)]'
    }
  ]

  // Shipment Data
  const shipments: Shipment[] = [
    {
      id: 'ship-001',
      shipmentNumber: 'SHP-2025-0234',
      customer: 'Grand Palace Hotel',
      destination: 'Dubai, UAE',
      items: 45,
      weight: 2800,
      value: 1850000,
      status: 'in_transit',
      priority: 'urgent',
      carrier: 'International Express',
      trackingNumber: 'IE2025234789',
      dispatchDate: '2025-01-14',
      expectedDelivery: '2025-01-20',
      currentLocation: 'Mumbai Port',
      progress: 65,
      vehicleType: 'Container Ship',
      driver: 'Capt. Rajesh Nair',
      driverContact: '+91 98765 43210'
    },
    {
      id: 'ship-002',
      shipmentNumber: 'SHP-2025-0235',
      customer: 'Corporate Interiors Ltd',
      destination: 'Bangalore, Karnataka',
      items: 25,
      weight: 1200,
      value: 680000,
      status: 'out_for_delivery',
      priority: 'high',
      carrier: 'Express Logistics',
      trackingNumber: 'EL2025987654',
      dispatchDate: '2025-01-15',
      expectedDelivery: '2025-01-17',
      currentLocation: 'Bangalore Hub',
      progress: 95,
      vehicleType: 'Truck',
      driver: 'Suresh Kumar',
      driverContact: '+91 98765 43211'
    },
    {
      id: 'ship-003',
      shipmentNumber: 'SHP-2025-0236',
      customer: 'Premium Homes',
      destination: 'Chennai, Tamil Nadu',
      items: 8,
      weight: 450,
      value: 280000,
      status: 'preparing',
      priority: 'normal',
      carrier: 'Regional Transport',
      trackingNumber: 'RT2025567890',
      dispatchDate: '2025-01-17',
      expectedDelivery: '2025-01-19',
      currentLocation: 'Warehouse A',
      progress: 15,
      vehicleType: 'Van',
      driver: 'Mohammed Ali',
      driverContact: '+91 98765 43212'
    },
    {
      id: 'ship-004',
      shipmentNumber: 'SHP-2025-0237',
      customer: 'International Furnishings',
      destination: 'Singapore',
      items: 120,
      weight: 8500,
      value: 4200000,
      status: 'dispatched',
      priority: 'high',
      carrier: 'Global Shipping Co',
      trackingNumber: 'GS2025789123',
      dispatchDate: '2025-01-16',
      expectedDelivery: '2025-01-25',
      currentLocation: 'Kochi Port',
      progress: 25,
      vehicleType: 'Cargo Ship',
      driver: 'Capt. Vijay Menon',
      driverContact: '+91 98765 43213'
    }
  ]

  // Vehicle Fleet
  const vehicles: Vehicle[] = [
    {
      id: 'veh-001',
      vehicleNumber: 'KL-07-AB-1234',
      type: 'truck',
      capacity: 5000,
      currentLoad: 3200,
      status: 'in_transit',
      driver: 'Ravi Pillai',
      currentLocation: 'NH-66, Kozhikode',
      fuelLevel: 78,
      lastMaintenance: '2025-01-10',
      nextMaintenance: '2025-02-10',
      totalDistance: 45600,
      efficiency: 6.5,
      assignments: 3
    },
    {
      id: 'veh-002',
      vehicleNumber: 'KL-01-CD-5678',
      type: 'van',
      capacity: 1500,
      currentLoad: 890,
      status: 'loading',
      driver: 'Anil Joseph',
      currentLocation: 'Warehouse B',
      fuelLevel: 92,
      lastMaintenance: '2025-01-05',
      nextMaintenance: '2025-02-05',
      totalDistance: 28900,
      efficiency: 8.2,
      assignments: 2
    },
    {
      id: 'veh-003',
      vehicleNumber: 'KA-05-EF-9012',
      type: 'trailer',
      capacity: 15000,
      currentLoad: 12500,
      status: 'in_transit',
      driver: 'Prakash Kumar',
      currentLocation: 'NH-48, Hosur',
      fuelLevel: 45,
      lastMaintenance: '2025-01-12',
      nextMaintenance: '2025-02-12',
      totalDistance: 78200,
      efficiency: 4.2,
      assignments: 1
    },
    {
      id: 'veh-004',
      vehicleNumber: 'TN-09-GH-3456',
      type: 'pickup',
      capacity: 800,
      currentLoad: 0,
      status: 'available',
      driver: 'Lakshman Rao',
      currentLocation: 'Service Center',
      fuelLevel: 100,
      lastMaintenance: '2025-01-14',
      nextMaintenance: '2025-02-14',
      totalDistance: 15600,
      efficiency: 12.5,
      assignments: 0
    },
    {
      id: 'veh-005',
      vehicleNumber: 'MH-12-IJ-7890',
      type: 'truck',
      capacity: 7500,
      currentLoad: 0,
      status: 'maintenance',
      driver: 'Deepak Sharma',
      currentLocation: 'Service Center',
      fuelLevel: 25,
      lastMaintenance: '2025-01-16',
      nextMaintenance: '2025-02-16',
      totalDistance: 92400,
      efficiency: 5.8,
      assignments: 0
    }
  ]

  // Routes
  const routes: Route[] = [
    {
      id: 'route-001',
      routeName: 'Kerala-Karnataka Express',
      origin: 'Thiruvananthapuram',
      destination: 'Bangalore',
      distance: 685,
      estimatedTime: 12,
      actualTime: 11.5,
      status: 'active',
      vehicle: 'KL-07-AB-1234',
      driver: 'Ravi Pillai',
      shipments: ['SHP-2025-0235'],
      stops: [
        { location: 'Kollam', estimatedTime: '09:30', actualTime: '09:25', status: 'reached' },
        { location: 'Kochi', estimatedTime: '11:45', actualTime: '11:40', status: 'reached' },
        { location: 'Thrissur', estimatedTime: '13:15', status: 'pending' },
        { location: 'Palakkad', estimatedTime: '15:30', status: 'pending' },
        { location: 'Bangalore', estimatedTime: '21:00', status: 'pending' }
      ],
      cost: 15400,
      fuelConsumption: 105
    },
    {
      id: 'route-002',
      routeName: 'Local Delivery - Kochi',
      origin: 'Warehouse B',
      destination: 'Multiple Stops',
      distance: 145,
      estimatedTime: 8,
      status: 'active',
      vehicle: 'KL-01-CD-5678',
      driver: 'Anil Joseph',
      shipments: ['SHP-2025-0236'],
      stops: [
        { location: 'Edappally', estimatedTime: '10:00', actualTime: '09:55', status: 'delivered' },
        { location: 'Kakkanad', estimatedTime: '11:30', status: 'pending' },
        { location: 'Palarivattom', estimatedTime: '13:00', status: 'pending' },
        { location: 'Marine Drive', estimatedTime: '15:30', status: 'pending' }
      ],
      cost: 3200,
      fuelConsumption: 18
    },
    {
      id: 'route-003',
      routeName: 'International - Port Route',
      origin: 'Warehouse A',
      destination: 'Kochi Port',
      distance: 28,
      estimatedTime: 2,
      actualTime: 1.8,
      status: 'completed',
      vehicle: 'KA-05-EF-9012',
      driver: 'Prakash Kumar',
      shipments: ['SHP-2025-0234', 'SHP-2025-0237'],
      stops: [
        { location: 'Container Terminal', estimatedTime: '14:00', actualTime: '13:55', status: 'delivered' },
        { location: 'Customs Office', estimatedTime: '15:30', actualTime: '15:25', status: 'delivered' }
      ],
      cost: 2800,
      fuelConsumption: 7
    }
  ]

  // Warehouses
  const warehouses: Warehouse[] = [
    {
      id: 'wh-001',
      name: 'Main Distribution Center',
      location: 'Thiruvananthapuram',
      type: 'main',
      capacity: 5000,
      currentOccupancy: 3850,
      inboundToday: 245,
      outboundToday: 189,
      status: 'operational',
      manager: 'Rajesh Nair',
      staff: 28,
      zones: 8,
      temperature: 24,
      humidity: 45,
      security: 'high'
    },
    {
      id: 'wh-002',
      name: 'Regional Hub - Kochi',
      location: 'Kochi',
      type: 'regional',
      capacity: 3000,
      currentOccupancy: 2100,
      inboundToday: 156,
      outboundToday: 134,
      status: 'busy',
      manager: 'Priya Menon',
      staff: 18,
      zones: 6,
      temperature: 23,
      humidity: 50,
      security: 'high'
    },
    {
      id: 'wh-003',
      name: 'Transit Facility - Bangalore',
      location: 'Bangalore',
      type: 'transit',
      capacity: 1500,
      currentOccupancy: 890,
      inboundToday: 67,
      outboundToday: 89,
      status: 'operational',
      manager: 'Suresh Kumar',
      staff: 12,
      zones: 4,
      temperature: 22,
      humidity: 48,
      security: 'medium'
    },
    {
      id: 'wh-004',
      name: 'Export Processing Center',
      location: 'Kochi Port',
      type: 'distribution',
      capacity: 2500,
      currentOccupancy: 1960,
      inboundToday: 234,
      outboundToday: 167,
      status: 'operational',
      manager: 'Mohammed Ali',
      staff: 22,
      zones: 5,
      temperature: 25,
      humidity: 52,
      security: 'high'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': case 'completed': case 'operational': case 'available': case 'reached':
        return 'text-[var(--jewelry-success)] bg-green-500/20'
      case 'in_transit': case 'out_for_delivery': case 'active': case 'loading': case 'busy':
        return 'text-[var(--jewelry-info)] bg-blue-500/20'
      case 'preparing': case 'dispatched': case 'pending':
        return 'text-[var(--jewelry-warning)] bg-yellow-500/20'
      case 'delayed': case 'returned': case 'maintenance': case 'offline': case 'cancelled': case 'closed':
        return 'text-[var(--jewelry-error)] bg-red-500/20'
      case 'delivered': case 'skipped':
        return 'text-gray-400 bg-gray-500/20'
      default: return 'text-gray-300 bg-gray-500/20'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      case 'normal': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'low': return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'truck': return Truck
      case 'van': return Car
      case 'trailer': return Truck
      case 'pickup': return Car
      default: return Truck
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

  const formatWeight = (weight: number) => {
    if (weight >= 1000) return `${(weight / 1000).toFixed(1)}T`
    return `${weight}kg`
  }

  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--jewelry-blue-500)] to-[var(--jewelry-blue-700)] flex items-center justify-center">
                <Truck className="h-6 w-6 text-[var(--jewelry-gold-400)]" />
              </div>
              Logistics Management
            </h1>
            <p className="text-gray-300 mt-2">
              Fleet management, shipment tracking, and delivery optimization
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-3 py-2 rounded-md border bg-black/20 border-gray-600 text-white focus:border-[var(--jewelry-gold-500)]"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>
            <Button 
              variant="outline" 
              className="gap-2 text-white border-gray-400 hover:border-white hover:text-white"
              onClick={() => setLiveTracking(!liveTracking)}
            >
              <Navigation className={`h-4 w-4 ${liveTracking ? 'animate-pulse' : ''}`} />
              <span className="text-white">{liveTracking ? 'Live Tracking' : 'Tracking Off'}</span>
            </Button>
            <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
              <Download className="h-4 w-4" />
              <span className="text-white">Export Routes</span>
            </Button>
            <Button className="gap-2 bg-[var(--jewelry-gold-500)] text-black hover:bg-[var(--jewelry-gold-600)] border-0">
              <Eye className="h-4 w-4" />
              <span className="text-black font-medium">Control Center</span>
            </Button>
          </div>
        </div>

        {/* Logistics Status Bar */}
        <div className="jewelry-glass-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[var(--jewelry-success)]" />
              <span className="text-white font-medium">Logistics Operations</span>
              <div className="w-2 h-2 bg-[var(--jewelry-success)] rounded-full animate-pulse"></div>
              <span className="text-gray-400 text-sm">All Systems Active</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-400">Vehicles Active</p>
                <p className="font-semibold text-[var(--jewelry-gold-500)]">18/25</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">In Transit</p>
                <p className="font-semibold text-white">89</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">On-Time Rate</p>
                <p className="font-semibold text-[var(--jewelry-success)]">96.8%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Distance Today</p>
                <p className="font-semibold text-[var(--jewelry-info)]">2,847km</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Last GPS Update</p>
              <p className="text-sm text-white">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        {/* Key Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {logisticsMetrics.map((metric) => (
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

        {/* Logistics Tabs */}
        <Tabs defaultValue="shipments" className="space-y-6">
          <TabsList className="bg-black/20 border border-gray-600">
            <TabsTrigger value="shipments" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Shipments
            </TabsTrigger>
            <TabsTrigger value="fleet" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Fleet Management
            </TabsTrigger>
            <TabsTrigger value="routes" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Routes
            </TabsTrigger>
            <TabsTrigger value="warehouses" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Warehouses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shipments" className="space-y-6">
            {/* Shipment Tracking */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-[var(--jewelry-blue-500)]" />
                  <h3 className="text-xl font-semibold text-white">Live Shipment Tracking</h3>
                  <Badge className="bg-[var(--jewelry-success)]/20 text-[var(--jewelry-success)] border-[var(--jewelry-success)]/30">
                    Real-time GPS
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="px-3 py-2 rounded-md border bg-black/20 border-gray-600 text-white focus:border-[var(--jewelry-gold-500)]"
                  >
                    <option value="all">All Regions</option>
                    <option value="domestic">Domestic</option>
                    <option value="international">International</option>
                    <option value="local">Local Delivery</option>
                  </select>
                  <Button variant="outline" size="sm" className="text-white border-gray-400 hover:border-white hover:text-white">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {shipments.map((shipment) => (
                  <div key={shipment.id} className="bg-black/20 rounded-lg p-4 border border-gray-600 hover:border-[var(--jewelry-gold-500)]/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-white">{shipment.shipmentNumber}</h4>
                        <Badge className={`text-xs border ${getPriorityColor(shipment.priority)}`}>
                          {shipment.priority}
                        </Badge>
                        <Badge className={`text-xs border ${getStatusColor(shipment.status)}`}>
                          {shipment.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <span className="text-[var(--jewelry-gold-500)] font-bold">{formatCurrency(shipment.value)}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Customer</p>
                        <p className="text-white font-medium">{shipment.customer}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Destination</p>
                        <p className="text-white">{shipment.destination}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Items/Weight</p>
                        <p className="text-white">{shipment.items} items / {formatWeight(shipment.weight)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Expected Delivery</p>
                        <p className="text-white">{formatDate(shipment.expectedDelivery)}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400 text-sm">Progress</span>
                        <span className="text-white font-medium">{shipment.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-[var(--jewelry-gold-500)] h-2 rounded-full"
                          style={{ width: `${shipment.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-400 text-xs">Current: {shipment.currentLocation}</span>
                        <span className="text-gray-400 text-xs">Tracking: {shipment.trackingNumber}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <p className="text-gray-400">Driver: <span className="text-white">{shipment.driver}</span></p>
                        <p className="text-gray-400">Vehicle: <span className="text-white">{shipment.vehicleType}</span></p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-white border-gray-400 hover:border-white hover:text-white">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="text-white">Track</span>
                        </Button>
                        <Button size="sm" variant="outline" className="text-[var(--jewelry-gold-500)] border-[var(--jewelry-gold-500)]/50 hover:bg-[var(--jewelry-gold-500)]/10">
                          <Phone className="h-3 w-3 mr-1" />
                          <span className="text-[var(--jewelry-gold-500)]">Contact</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="fleet" className="space-y-6">
            {/* Fleet Management */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Truck className="h-6 w-6 text-[var(--jewelry-gold-500)]" />
                  <h3 className="text-xl font-semibold text-white">Fleet Status & Management</h3>
                </div>
                <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
                  <Settings className="h-4 w-4" />
                  <span className="text-white">Fleet Settings</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {vehicles.map((vehicle) => {
                  const VehicleIcon = getVehicleIcon(vehicle.type)
                  return (
                    <div key={vehicle.id} className="bg-black/20 rounded-lg p-4 border border-gray-600">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <VehicleIcon className="h-5 w-5 text-[var(--jewelry-gold-500)]" />
                          <h4 className="font-semibold text-white">{vehicle.vehicleNumber}</h4>
                        </div>
                        <Badge className={`text-xs border ${getStatusColor(vehicle.status)}`}>
                          {vehicle.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Driver</p>
                            <p className="text-white">{vehicle.driver}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Type</p>
                            <p className="text-white capitalize">{vehicle.type}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Location</p>
                            <p className="text-white text-xs">{vehicle.currentLocation}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Assignments</p>
                            <p className="text-white">{vehicle.assignments}</p>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-400 text-sm">Load Capacity</span>
                            <span className="text-white font-medium">
                              {formatWeight(vehicle.currentLoad)}/{formatWeight(vehicle.capacity)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-[var(--jewelry-gold-500)] h-2 rounded-full"
                              style={{ width: `${(vehicle.currentLoad / vehicle.capacity) * 100}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-400 text-sm">Fuel Level</span>
                            <span className="text-white font-medium">{vehicle.fuelLevel}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                vehicle.fuelLevel > 50 ? 'bg-green-500' :
                                vehicle.fuelLevel > 25 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${vehicle.fuelLevel}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <p className="text-gray-400">Efficiency: <span className="text-white">{vehicle.efficiency} km/l</span></p>
                            <p className="text-gray-400">Total Distance: <span className="text-white">{vehicle.totalDistance.toLocaleString()} km</span></p>
                          </div>
                          <Button size="sm" variant="outline" className="text-[var(--jewelry-gold-500)] border-[var(--jewelry-gold-500)]/50 hover:bg-[var(--jewelry-gold-500)]/10">
                            <span className="text-[var(--jewelry-gold-500)]">Manage</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="routes" className="space-y-6">
            {/* Route Planning */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Route className="h-6 w-6 text-[var(--jewelry-blue-500)]" />
                  <h3 className="text-xl font-semibold text-white">Route Planning & Optimization</h3>
                </div>
                <Button className="gap-2 bg-[var(--jewelry-gold-500)] text-black hover:bg-[var(--jewelry-gold-600)] border-0">
                  <Navigation className="h-4 w-4" />
                  <span className="text-black font-medium">Plan New Route</span>
                </Button>
              </div>

              <div className="space-y-4">
                {routes.map((route) => (
                  <div key={route.id} className="bg-black/20 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-white">{route.routeName}</h4>
                        <Badge className={`text-xs border ${getStatusColor(route.status)}`}>
                          {route.status}
                        </Badge>
                      </div>
                      <span className="text-[var(--jewelry-gold-500)] font-bold">{formatCurrency(route.cost)}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Route</p>
                        <p className="text-white font-medium">{route.origin} → {route.destination}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Distance</p>
                        <p className="text-white">{route.distance} km</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Estimated Time</p>
                        <p className="text-white">{route.estimatedTime}h</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Fuel Consumption</p>
                        <p className="text-white">{route.fuelConsumption}L</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-400 text-sm mb-2">Route Stops ({route.stops.length})</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                        {route.stops.map((stop, index) => (
                          <div key={index} className="bg-black/30 rounded p-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-white font-medium">{stop.location}</span>
                              <Badge className={`text-xs ${getStatusColor(stop.status)}`}>
                                {stop.status}
                              </Badge>
                            </div>
                            <p className="text-gray-400 mt-1">
                              ETA: {stop.estimatedTime}
                              {stop.actualTime && ` (${stop.actualTime})`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <p className="text-gray-400">Vehicle: <span className="text-white">{route.vehicle}</span></p>
                        <p className="text-gray-400">Driver: <span className="text-white">{route.driver}</span></p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-white border-gray-400 hover:border-white hover:text-white">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="text-white">View Map</span>
                        </Button>
                        <Button size="sm" variant="outline" className="text-[var(--jewelry-gold-500)] border-[var(--jewelry-gold-500)]/50 hover:bg-[var(--jewelry-gold-500)]/10">
                          <span className="text-[var(--jewelry-gold-500)]">Optimize</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="warehouses" className="space-y-6">
            {/* Warehouse Management */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Warehouse className="h-6 w-6 text-[var(--jewelry-gold-500)]" />
                  <h3 className="text-xl font-semibold text-white">Warehouse Operations</h3>
                </div>
                <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-white">Capacity Analysis</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {warehouses.map((warehouse) => (
                  <div key={warehouse.id} className="bg-black/20 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">{warehouse.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs border ${getStatusColor(warehouse.status)}`}>
                          {warehouse.status}
                        </Badge>
                        <Badge className={`text-xs ${
                          warehouse.security === 'high' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                          warehouse.security === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                          'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}>
                          {warehouse.security} security
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Location</p>
                          <p className="text-white">{warehouse.location}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Type</p>
                          <p className="text-white capitalize">{warehouse.type.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Manager</p>
                          <p className="text-white">{warehouse.manager}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Staff</p>
                          <p className="text-white">{warehouse.staff} workers</p>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400 text-sm">Occupancy</span>
                          <span className="text-white font-medium">
                            {warehouse.currentOccupancy}/{warehouse.capacity} units
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              (warehouse.currentOccupancy / warehouse.capacity) > 0.9 ? 'bg-red-500' :
                              (warehouse.currentOccupancy / warehouse.capacity) > 0.7 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${(warehouse.currentOccupancy / warehouse.capacity) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-2 bg-black/30 rounded">
                          <p className="text-[var(--jewelry-success)] font-bold">{warehouse.inboundToday}</p>
                          <p className="text-gray-400 text-xs">Inbound Today</p>
                        </div>
                        <div className="text-center p-2 bg-black/30 rounded">
                          <p className="text-[var(--jewelry-info)] font-bold">{warehouse.outboundToday}</p>
                          <p className="text-gray-400 text-xs">Outbound Today</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <p className="text-gray-400">Environment: <span className="text-white">{warehouse.temperature}°C, {warehouse.humidity}% RH</span></p>
                          <p className="text-gray-400">Zones: <span className="text-white">{warehouse.zones} active zones</span></p>
                        </div>
                        <Button size="sm" variant="outline" className="text-[var(--jewelry-gold-500)] border-[var(--jewelry-gold-500)]/50 hover:bg-[var(--jewelry-gold-500)]/10">
                          <span className="text-[var(--jewelry-gold-500)]">Monitor</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Logistics Summary Footer */}
        <div className="jewelry-glass-card p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Crown className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
              <h3 className="text-2xl font-bold text-white">Logistics Excellence</h3>
            </div>
            <p className="text-gray-400">Optimized delivery operations with real-time tracking and fleet management</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-gold-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Truck className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">25</p>
              <p className="text-gray-400">Fleet Vehicles</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-blue-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="h-8 w-8 text-[var(--jewelry-blue-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">89</p>
              <p className="text-gray-400">Active Shipments</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-gold-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">96.8%</p>
              <p className="text-gray-400">On-Time Delivery</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-blue-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Warehouse className="h-8 w-8 text-[var(--jewelry-blue-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">4</p>
              <p className="text-gray-400">Warehouse Locations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(LogisticsPage)