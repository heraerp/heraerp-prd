'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Users,
  Phone,
  Mail,
  Star,
  Route,
  Navigation,
  Home,
  Building2,
  Factory,
  Globe,
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
  DollarSign,
  TrendingUp,
  TrendingDown,
  Car,
  Motorcycle,
  Bus,
  Train,
  Plane,
  Ship,
  Container,
  Box,
  PackageCheck,
  PackageX,
  PackagePlus,
  PackageOpen,
  QrCode,
  Barcode,
  Scan,
  Radio,
  Wifi,
  Signal,
  Smartphone,
  Tablet,
  Monitor,
  Camera,
  Video,
  Image,
  FileImage,
  Paperclip,
  Upload,
  ExternalLink,
  Link,
  Copy,
  Edit,
  Trash,
  Plus,
  Minus,
  X,
  Check,
  AlertOctagon,
  HelpCircle,
  MessageCircle,
  MessageSquare,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Headphones,
  Mic,
  MicOff,
  User,
  UserCheck,
  UserX,
  UserPlus,
  UserMinus,
  Users2,
  Heart,
  ThumbsDown,
  Smile,
  Frown,
  Meh
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface DeliveryMetric {
  id: string
  label: string
  value: string | number
  change: string
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: React.ElementType
  color: string
  target?: string
}

interface Delivery {
  id: string
  deliveryNumber: string
  orderNumber: string
  customer: {
    name: string
    phone: string
    email: string
    address: string
    city: string
    pincode: string
    coordinates: { lat: number; lng: number }
  }
  items: {
    name: string
    quantity: number
    weight: number
    dimensions: string
    value: number
  }[]
  status: 'scheduled' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'rescheduled' | 'returned'
  priority: 'urgent' | 'high' | 'normal' | 'low'
  scheduledDate: string
  scheduledTime: string
  actualDeliveryTime?: string
  deliveryWindow: string
  deliveryTeam: {
    driver: string
    helper: string
    vehicle: string
    contact: string
  }
  specialInstructions: string
  deliveryAttempts: number
  totalValue: number
  paymentMethod: 'prepaid' | 'cod' | 'partial'
  codAmount?: number
  signature?: string
  photos?: string[]
  feedback?: {
    rating: number
    comment: string
  }
}

interface DeliveryAgent {
  id: string
  name: string
  employeeId: string
  phone: string
  email: string
  status: 'active' | 'on_break' | 'offline' | 'busy'
  currentLocation: string
  vehicle: {
    type: 'bike' | 'van' | 'truck'
    number: string
    capacity: number
  }
  todayDeliveries: {
    completed: number
    pending: number
    failed: number
  }
  rating: number
  experience: string
  zone: string
  shift: 'morning' | 'afternoon' | 'evening' | 'night'
  currentDelivery?: string
}

interface DeliveryZone {
  id: string
  name: string
  area: string
  pincode: string[]
  coordinates: { lat: number; lng: number }
  status: 'active' | 'restricted' | 'high_demand' | 'maintenance'
  agents: number
  todayDeliveries: number
  averageTime: number
  successRate: number
  priority: 'high' | 'medium' | 'low'
  restrictions: string[]
  specialRequirements: string[]
}

interface DeliverySlot {
  id: string
  date: string
  timeSlot: string
  capacity: number
  booked: number
  available: number
  zone: string
  premium: boolean
  cost: number
  status: 'available' | 'full' | 'restricted'
}

function DeliveryPage() {
  const [selectedDate, setSelectedDate] = useState('today')
  const [selectedZone, setSelectedZone] = useState('all')
  const [liveTracking, setLiveTracking] = useState(true)

  // Delivery Performance Metrics
  const deliveryMetrics: DeliveryMetric[] = [
    {
      id: 'scheduled-today',
      label: 'Scheduled Today',
      value: 156,
      change: '+28',
      changeType: 'increase',
      icon: Calendar,
      color: 'text-[var(--jewelry-gold-500)]'
    },
    {
      id: 'completed-today',
      label: 'Completed Today',
      value: 142,
      change: '+24',
      changeType: 'increase',
      icon: CheckCircle,
      color: 'text-[var(--jewelry-blue-500)]'
    },
    {
      id: 'success-rate',
      label: 'Success Rate',
      value: '94.8%',
      change: '+1.2%',
      changeType: 'increase',
      icon: Target,
      color: 'text-[var(--jewelry-gold-500)]',
      target: '96%'
    },
    {
      id: 'avg-delivery-time',
      label: 'Avg Delivery Time',
      value: '45 min',
      change: '-3 min',
      changeType: 'decrease',
      icon: Clock,
      color: 'text-[var(--jewelry-blue-500)]'
    },
    {
      id: 'customer-rating',
      label: 'Customer Rating',
      value: '4.6/5',
      change: '+0.1',
      changeType: 'increase',
      icon: Star,
      color: 'text-[var(--jewelry-gold-500)]'
    },
    {
      id: 'active-agents',
      label: 'Active Agents',
      value: 24,
      change: '+2',
      changeType: 'increase',
      icon: Users,
      color: 'text-[var(--jewelry-blue-500)]'
    }
  ]

  // Delivery Data
  const deliveries: Delivery[] = [
    {
      id: 'del-001',
      deliveryNumber: 'DEL-2025-0456',
      orderNumber: 'ORD-2025-1234',
      customer: {
        name: 'Rajesh Kumar',
        phone: '+91 98765 43210',
        email: 'rajesh.kumar@email.com',
        address: '123, MG Road, Fort Kochi',
        city: 'Kochi',
        pincode: '682001',
        coordinates: { lat: 9.9312, lng: 76.2673 }
      },
      items: [
        { name: 'Executive Office Chair', quantity: 2, weight: 45, dimensions: '70x70x120cm', value: 85000 },
        { name: 'Conference Table', quantity: 1, weight: 120, dimensions: '240x120x75cm', value: 125000 }
      ],
      status: 'out_for_delivery',
      priority: 'high',
      scheduledDate: '2025-01-16',
      scheduledTime: '14:00',
      deliveryWindow: '14:00 - 16:00',
      deliveryTeam: {
        driver: 'Anil Joseph',
        helper: 'Suresh Nair',
        vehicle: 'KL-07-AB-1234',
        contact: '+91 98765 43211'
      },
      specialInstructions: 'Assembly required. Customer will be available after 2 PM.',
      deliveryAttempts: 1,
      totalValue: 210000,
      paymentMethod: 'cod',
      codAmount: 210000
    },
    {
      id: 'del-002',
      deliveryNumber: 'DEL-2025-0457',
      orderNumber: 'ORD-2025-1235',
      customer: {
        name: 'Priya Menon',
        phone: '+91 98765 43212',
        email: 'priya.menon@email.com',
        address: '456, Marine Drive, Ernakulam',
        city: 'Kochi',
        pincode: '682011',
        coordinates: { lat: 9.9816, lng: 76.2999 }
      },
      items: [
        { name: 'Luxury Sofa Set', quantity: 1, weight: 180, dimensions: '220x90x85cm', value: 285000 }
      ],
      status: 'delivered',
      priority: 'normal',
      scheduledDate: '2025-01-16',
      scheduledTime: '10:00',
      actualDeliveryTime: '10:25',
      deliveryWindow: '10:00 - 12:00',
      deliveryTeam: {
        driver: 'Mohammed Ali',
        helper: 'Ravi Pillai',
        vehicle: 'KL-01-CD-5678',
        contact: '+91 98765 43213'
      },
      specialInstructions: 'Handle with extreme care. Premium leather upholstery.',
      deliveryAttempts: 1,
      totalValue: 285000,
      paymentMethod: 'prepaid',
      signature: 'P. Menon',
      feedback: {
        rating: 5,
        comment: 'Excellent service! Delivery team was professional and careful.'
      }
    },
    {
      id: 'del-003',
      deliveryNumber: 'DEL-2025-0458',
      orderNumber: 'ORD-2025-1236',
      customer: {
        name: 'Corporate Interiors Ltd',
        phone: '+91 98765 43214',
        email: 'orders@corporateinteriors.com',
        address: '789, Infopark, Kakkanad',
        city: 'Kochi',
        pincode: '682030',
        coordinates: { lat: 10.0203, lng: 76.3487 }
      },
      items: [
        { name: 'Modular Workstations', quantity: 8, weight: 480, dimensions: '150x75x75cm each', value: 480000 }
      ],
      status: 'scheduled',
      priority: 'urgent',
      scheduledDate: '2025-01-17',
      scheduledTime: '09:00',
      deliveryWindow: '09:00 - 11:00',
      deliveryTeam: {
        driver: 'Deepak Sharma',
        helper: 'Lakshman Rao',
        vehicle: 'KA-05-EF-9012',
        contact: '+91 98765 43215'
      },
      specialInstructions: 'Installation team required. Contact facility manager on arrival.',
      deliveryAttempts: 0,
      totalValue: 480000,
      paymentMethod: 'partial',
      codAmount: 150000
    },
    {
      id: 'del-004',
      deliveryNumber: 'DEL-2025-0459',
      orderNumber: 'ORD-2025-1237',
      customer: {
        name: 'Vineeth Pillai',
        phone: '+91 98765 43216',
        email: 'vineeth.pillai@email.com',
        address: '321, Panampilly Nagar',
        city: 'Kochi',
        pincode: '682036',
        coordinates: { lat: 9.9647, lng: 76.2919 }
      },
      items: [
        { name: 'Dining Table Set', quantity: 1, weight: 95, dimensions: '180x90x75cm', value: 125000 }
      ],
      status: 'failed',
      priority: 'normal',
      scheduledDate: '2025-01-16',
      scheduledTime: '16:00',
      deliveryWindow: '16:00 - 18:00',
      deliveryTeam: {
        driver: 'Prakash Kumar',
        helper: 'Ajith Kumar',
        vehicle: 'TN-09-GH-3456',
        contact: '+91 98765 43217'
      },
      specialInstructions: 'Customer not available. Rescheduling required.',
      deliveryAttempts: 2,
      totalValue: 125000,
      paymentMethod: 'cod',
      codAmount: 125000
    }
  ]

  // Delivery Agents
  const deliveryAgents: DeliveryAgent[] = [
    {
      id: 'agent-001',
      name: 'Anil Joseph',
      employeeId: 'EMP-001',
      phone: '+91 98765 43211',
      email: 'anil.joseph@company.com',
      status: 'active',
      currentLocation: 'Fort Kochi Area',
      vehicle: {
        type: 'truck',
        number: 'KL-07-AB-1234',
        capacity: 5000
      },
      todayDeliveries: {
        completed: 8,
        pending: 3,
        failed: 1
      },
      rating: 4.7,
      experience: '3 years',
      zone: 'Central Kochi',
      shift: 'morning',
      currentDelivery: 'DEL-2025-0456'
    },
    {
      id: 'agent-002',
      name: 'Mohammed Ali',
      employeeId: 'EMP-002',
      phone: '+91 98765 43213',
      email: 'mohammed.ali@company.com',
      status: 'active',
      currentLocation: 'Ernakulam Junction',
      vehicle: {
        type: 'van',
        number: 'KL-01-CD-5678',
        capacity: 1500
      },
      todayDeliveries: {
        completed: 12,
        pending: 2,
        failed: 0
      },
      rating: 4.9,
      experience: '5 years',
      zone: 'Ernakulam',
      shift: 'morning'
    },
    {
      id: 'agent-003',
      name: 'Deepak Sharma',
      employeeId: 'EMP-003',
      phone: '+91 98765 43215',
      email: 'deepak.sharma@company.com',
      status: 'busy',
      currentLocation: 'Kakkanad',
      vehicle: {
        type: 'truck',
        number: 'KA-05-EF-9012',
        capacity: 7500
      },
      todayDeliveries: {
        completed: 6,
        pending: 4,
        failed: 0
      },
      rating: 4.5,
      experience: '2 years',
      zone: 'IT Corridor',
      shift: 'afternoon'
    },
    {
      id: 'agent-004',
      name: 'Prakash Kumar',
      employeeId: 'EMP-004',
      phone: '+91 98765 43217',
      email: 'prakash.kumar@company.com',
      status: 'on_break',
      currentLocation: 'Service Center',
      vehicle: {
        type: 'van',
        number: 'TN-09-GH-3456',
        capacity: 2000
      },
      todayDeliveries: {
        completed: 7,
        pending: 2,
        failed: 2
      },
      rating: 4.2,
      experience: '4 years',
      zone: 'South Kochi',
      shift: 'afternoon'
    }
  ]

  // Delivery Zones
  const deliveryZones: DeliveryZone[] = [
    {
      id: 'zone-001',
      name: 'Central Kochi',
      area: 'Fort Kochi, Mattancherry, Marine Drive',
      pincode: ['682001', '682002', '682003'],
      coordinates: { lat: 9.9312, lng: 76.2673 },
      status: 'active',
      agents: 6,
      todayDeliveries: 45,
      averageTime: 42,
      successRate: 96,
      priority: 'high',
      restrictions: ['Heavy vehicle restrictions 9 AM - 6 PM'],
      specialRequirements: ['Heritage zone - careful handling required']
    },
    {
      id: 'zone-002',
      name: 'Ernakulam',
      area: 'MG Road, Broadway, Kadavanthra',
      pincode: ['682011', '682020', '682024'],
      coordinates: { lat: 9.9816, lng: 76.2999 },
      status: 'active',
      agents: 8,
      todayDeliveries: 67,
      averageTime: 38,
      successRate: 94,
      priority: 'high',
      restrictions: ['Traffic restrictions during peak hours'],
      specialRequirements: ['Commercial area - office hour deliveries preferred']
    },
    {
      id: 'zone-003',
      name: 'IT Corridor',
      area: 'Kakkanad, Infopark, Edappally',
      pincode: ['682030', '682024', '682026'],
      coordinates: { lat: 10.0203, lng: 76.3487 },
      status: 'high_demand',
      agents: 5,
      todayDeliveries: 34,
      averageTime: 52,
      successRate: 92,
      priority: 'medium',
      restrictions: ['Security clearance required for IT parks'],
      specialRequirements: ['Corporate deliveries - ID verification mandatory']
    },
    {
      id: 'zone-004',
      name: 'South Kochi',
      area: 'Panampilly Nagar, Thevara, Kundannoor',
      pincode: ['682036', '682013', '682304'],
      coordinates: { lat: 9.9647, lng: 76.2919 },
      status: 'active',
      agents: 5,
      todayDeliveries: 28,
      averageTime: 48,
      successRate: 89,
      priority: 'medium',
      restrictions: ['Narrow roads - size restrictions apply'],
      specialRequirements: ['Residential area - time slot compliance required']
    }
  ]

  // Delivery Slots
  const deliverySlots: DeliverySlot[] = [
    {
      id: 'slot-001',
      date: '2025-01-17',
      timeSlot: '09:00 - 12:00',
      capacity: 25,
      booked: 18,
      available: 7,
      zone: 'Central Kochi',
      premium: false,
      cost: 0,
      status: 'available'
    },
    {
      id: 'slot-002',
      date: '2025-01-17',
      timeSlot: '12:00 - 15:00',
      capacity: 30,
      booked: 30,
      available: 0,
      zone: 'Ernakulam',
      premium: false,
      cost: 0,
      status: 'full'
    },
    {
      id: 'slot-003',
      date: '2025-01-17',
      timeSlot: '15:00 - 18:00',
      capacity: 20,
      booked: 12,
      available: 8,
      zone: 'IT Corridor',
      premium: true,
      cost: 500,
      status: 'available'
    },
    {
      id: 'slot-004',
      date: '2025-01-17',
      timeSlot: '18:00 - 21:00',
      capacity: 15,
      booked: 8,
      available: 7,
      zone: 'South Kochi',
      premium: true,
      cost: 750,
      status: 'available'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': case 'active': case 'available': case 'completed':
        return 'text-[var(--jewelry-success)] bg-green-500/20'
      case 'out_for_delivery': case 'in_transit': case 'picked_up': case 'busy':
        return 'text-[var(--jewelry-info)] bg-blue-500/20'
      case 'scheduled': case 'on_break': case 'high_demand':
        return 'text-[var(--jewelry-warning)] bg-yellow-500/20'
      case 'failed': case 'returned': case 'offline': case 'restricted': case 'full':
        return 'text-[var(--jewelry-error)] bg-red-500/20'
      case 'rescheduled': case 'maintenance':
        return 'text-gray-400 bg-gray-500/20'
      default: return 'text-gray-300 bg-gray-500/20'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      case 'normal': case 'medium': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'low': return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'truck': return Truck
      case 'van': return Car
      case 'bike': return Motorcycle
      default: return Car
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

  const formatTime = (timeString: string) => {
    return new Date(`2025-01-01T${timeString}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--jewelry-blue-500)] to-[var(--jewelry-blue-700)] flex items-center justify-center">
                <Package className="h-6 w-6 text-[var(--jewelry-gold-400)]" />
              </div>
              Delivery Management
            </h1>
            <p className="text-gray-300 mt-2">
              Last-mile delivery operations, tracking, and customer experience management
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 rounded-md border bg-black/20 border-gray-600 text-white focus:border-[var(--jewelry-gold-500)]"
              >
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
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
              <span className="text-white">Export Report</span>
            </Button>
            <Button className="gap-2 bg-[var(--jewelry-gold-500)] text-black hover:bg-[var(--jewelry-gold-600)] border-0">
              <Eye className="h-4 w-4" />
              <span className="text-black font-medium">Delivery Dashboard</span>
            </Button>
          </div>
        </div>

        {/* Delivery Status Bar */}
        <div className="jewelry-glass-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[var(--jewelry-success)]" />
              <span className="text-white font-medium">Delivery Operations</span>
              <div className="w-2 h-2 bg-[var(--jewelry-success)] rounded-full animate-pulse"></div>
              <span className="text-gray-400 text-sm">All Systems Operational</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-400">Out for Delivery</p>
                <p className="font-semibold text-[var(--jewelry-info)]">18</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Completed Today</p>
                <p className="font-semibold text-[var(--jewelry-success)]">142</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Success Rate</p>
                <p className="font-semibold text-[var(--jewelry-gold-500)]">94.8%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Active Agents</p>
                <p className="font-semibold text-white">24</p>
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
          {deliveryMetrics.map((metric) => (
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

        {/* Delivery Tabs */}
        <Tabs defaultValue="deliveries" className="space-y-6">
          <TabsList className="bg-black/20 border border-gray-600">
            <TabsTrigger value="deliveries" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Active Deliveries
            </TabsTrigger>
            <TabsTrigger value="agents" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Delivery Agents
            </TabsTrigger>
            <TabsTrigger value="zones" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Delivery Zones
            </TabsTrigger>
            <TabsTrigger value="slots" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Time Slots
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deliveries" className="space-y-6">
            {/* Active Deliveries */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-[var(--jewelry-blue-500)]" />
                  <h3 className="text-xl font-semibold text-white">Active Delivery Tracking</h3>
                  <Badge className="bg-[var(--jewelry-success)]/20 text-[var(--jewelry-success)] border-[var(--jewelry-success)]/30">
                    Real-time Updates
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    className="px-3 py-2 rounded-md border bg-black/20 border-gray-600 text-white focus:border-[var(--jewelry-gold-500)]"
                  >
                    <option value="all">All Zones</option>
                    <option value="central">Central Kochi</option>
                    <option value="ernakulam">Ernakulam</option>
                    <option value="it_corridor">IT Corridor</option>
                    <option value="south">South Kochi</option>
                  </select>
                  <Button variant="outline" size="sm" className="text-white border-gray-400 hover:border-white hover:text-white">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {deliveries.map((delivery) => (
                  <div key={delivery.id} className="bg-black/20 rounded-lg p-4 border border-gray-600 hover:border-[var(--jewelry-gold-500)]/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-white">{delivery.deliveryNumber}</h4>
                        <Badge className={`text-xs border ${getPriorityColor(delivery.priority)}`}>
                          {delivery.priority}
                        </Badge>
                        <Badge className={`text-xs border ${getStatusColor(delivery.status)}`}>
                          {delivery.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <span className="text-[var(--jewelry-gold-500)] font-bold">{formatCurrency(delivery.totalValue)}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Customer</p>
                        <p className="text-white font-medium">{delivery.customer.name}</p>
                        <p className="text-gray-300 text-xs">{delivery.customer.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Delivery Address</p>
                        <p className="text-white text-sm">{delivery.customer.address}</p>
                        <p className="text-gray-300 text-xs">{delivery.customer.city} - {delivery.customer.pincode}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Scheduled Time</p>
                        <p className="text-white">{delivery.deliveryWindow}</p>
                        <p className="text-gray-300 text-xs">
                          {delivery.actualDeliveryTime ? `Delivered: ${delivery.actualDeliveryTime}` : `Attempts: ${delivery.deliveryAttempts}`}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-400 text-sm mb-2">Items ({delivery.items.length})</p>
                      <div className="space-y-2">
                        {delivery.items.slice(0, 2).map((item, index) => (
                          <div key={index} className="flex justify-between items-center bg-black/30 rounded p-2">
                            <div>
                              <span className="text-white text-sm font-medium">{item.name}</span>
                              <p className="text-gray-400 text-xs">Qty: {item.quantity} | Weight: {item.weight}kg | {item.dimensions}</p>
                            </div>
                            <span className="text-[var(--jewelry-gold-500)] font-medium">{formatCurrency(item.value)}</span>
                          </div>
                        ))}
                        {delivery.items.length > 2 && (
                          <p className="text-gray-400 text-xs">+{delivery.items.length - 2} more items</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <p className="text-gray-400">Delivery Team: <span className="text-white">{delivery.deliveryTeam.driver}</span></p>
                        <p className="text-gray-400">Vehicle: <span className="text-white">{delivery.deliveryTeam.vehicle}</span></p>
                        {delivery.specialInstructions && (
                          <p className="text-gray-400">Note: <span className="text-yellow-300 text-xs">{delivery.specialInstructions}</span></p>
                        )}
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
                        {delivery.feedback && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-[var(--jewelry-gold-500)]" />
                            <span className="text-white text-xs">{delivery.feedback.rating}/5</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            {/* Delivery Agents */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-[var(--jewelry-gold-500)]" />
                  <h3 className="text-xl font-semibold text-white">Delivery Agent Management</h3>
                </div>
                <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
                  <Settings className="h-4 w-4" />
                  <span className="text-white">Agent Settings</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {deliveryAgents.map((agent) => {
                  const VehicleIcon = getVehicleIcon(agent.vehicle.type)
                  return (
                    <div key={agent.id} className="bg-black/20 rounded-lg p-4 border border-gray-600">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-300" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">{agent.name}</h4>
                            <p className="text-gray-400 text-xs">{agent.employeeId}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs border ${getStatusColor(agent.status)}`}>
                            {agent.status.replace('_', ' ')}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-[var(--jewelry-gold-500)]" />
                            <span className="text-white text-xs">{agent.rating}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Zone</p>
                            <p className="text-white">{agent.zone}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Shift</p>
                            <p className="text-white capitalize">{agent.shift}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Experience</p>
                            <p className="text-white">{agent.experience}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Current Location</p>
                            <p className="text-white text-xs">{agent.currentLocation}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <VehicleIcon className="h-4 w-4 text-[var(--jewelry-gold-500)]" />
                          <span className="text-white">{agent.vehicle.number}</span>
                          <span className="text-gray-400">({agent.vehicle.capacity}kg capacity)</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 bg-green-500/20 rounded">
                            <p className="text-[var(--jewelry-success)] font-bold">{agent.todayDeliveries.completed}</p>
                            <p className="text-gray-400 text-xs">Completed</p>
                          </div>
                          <div className="text-center p-2 bg-yellow-500/20 rounded">
                            <p className="text-[var(--jewelry-warning)] font-bold">{agent.todayDeliveries.pending}</p>
                            <p className="text-gray-400 text-xs">Pending</p>
                          </div>
                          <div className="text-center p-2 bg-red-500/20 rounded">
                            <p className="text-[var(--jewelry-error)] font-bold">{agent.todayDeliveries.failed}</p>
                            <p className="text-gray-400 text-xs">Failed</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-xs">
                            <p className="text-gray-400">Phone: <span className="text-white">{agent.phone}</span></p>
                            {agent.currentDelivery && (
                              <p className="text-gray-400">Current: <span className="text-[var(--jewelry-gold-500)]">{agent.currentDelivery}</span></p>
                            )}
                          </div>
                          <Button size="sm" variant="outline" className="text-[var(--jewelry-gold-500)] border-[var(--jewelry-gold-500)]/50 hover:bg-[var(--jewelry-gold-500)]/10">
                            <span className="text-[var(--jewelry-gold-500)]">Contact</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="zones" className="space-y-6">
            {/* Delivery Zones */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-[var(--jewelry-blue-500)]" />
                  <h3 className="text-xl font-semibold text-white">Delivery Zone Management</h3>
                </div>
                <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-white">Zone Analytics</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {deliveryZones.map((zone) => (
                  <div key={zone.id} className="bg-black/20 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">{zone.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs border ${getStatusColor(zone.status)}`}>
                          {zone.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={`text-xs border ${getPriorityColor(zone.priority)}`}>
                          {zone.priority}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-gray-400 text-sm">Coverage Area</p>
                        <p className="text-white text-sm">{zone.area}</p>
                        <p className="text-gray-400 text-xs">Pincodes: {zone.pincode.join(', ')}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Active Agents</p>
                          <p className="text-white font-bold">{zone.agents}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Today's Deliveries</p>
                          <p className="text-white font-bold">{zone.todayDeliveries}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Avg Time</p>
                          <p className="text-white font-bold">{zone.averageTime} min</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Success Rate</p>
                          <p className="text-[var(--jewelry-success)] font-bold">{zone.successRate}%</p>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400 text-sm">Performance</span>
                          <span className="text-white font-medium">{zone.successRate}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              zone.successRate >= 95 ? 'bg-green-500' :
                              zone.successRate >= 90 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${zone.successRate}%` }}
                          ></div>
                        </div>
                      </div>

                      {zone.restrictions.length > 0 && (
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Restrictions</p>
                          <div className="space-y-1">
                            {zone.restrictions.slice(0, 1).map((restriction, index) => (
                              <p key={index} className="text-yellow-300 text-xs">{restriction}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-xs">
                          <p className="text-gray-400">Special Requirements:</p>
                          <p className="text-blue-300 text-xs">{zone.specialRequirements[0]}</p>
                        </div>
                        <Button size="sm" variant="outline" className="text-[var(--jewelry-gold-500)] border-[var(--jewelry-gold-500)]/50 hover:bg-[var(--jewelry-gold-500)]/10">
                          <span className="text-[var(--jewelry-gold-500)]">Manage</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="slots" className="space-y-6">
            {/* Time Slots */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-[var(--jewelry-gold-500)]" />
                  <h3 className="text-xl font-semibold text-white">Delivery Time Slot Management</h3>
                </div>
                <Button className="gap-2 bg-[var(--jewelry-gold-500)] text-black hover:bg-[var(--jewelry-gold-600)] border-0">
                  <Calendar className="h-4 w-4" />
                  <span className="text-black font-medium">Create Slot</span>
                </Button>
              </div>

              <div className="space-y-4">
                {deliverySlots.map((slot) => (
                  <div key={slot.id} className="bg-black/20 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-white">{slot.timeSlot}</h4>
                        <Badge className={`text-xs border ${getStatusColor(slot.status)}`}>
                          {slot.status}
                        </Badge>
                        {slot.premium && (
                          <Badge className="bg-[var(--jewelry-gold-500)]/20 text-[var(--jewelry-gold-500)] border-[var(--jewelry-gold-500)]/30">
                            Premium
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{slot.available}/{slot.capacity}</p>
                        <p className="text-gray-400 text-xs">Available</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Date</p>
                        <p className="text-white">{formatDate(slot.date)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Zone</p>
                        <p className="text-white">{slot.zone}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Bookings</p>
                        <p className="text-white">{slot.booked}/{slot.capacity}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Premium Cost</p>
                        <p className="text-white">{slot.premium ? formatCurrency(slot.cost) : 'Free'}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400 text-sm">Capacity</span>
                        <span className="text-white font-medium">{((slot.booked / slot.capacity) * 100).toFixed(0)}% Full</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            slot.status === 'full' ? 'bg-red-500' :
                            (slot.booked / slot.capacity) > 0.8 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${(slot.booked / slot.capacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <p className="text-gray-400">Slot Type: <span className="text-white">{slot.premium ? 'Premium Express' : 'Standard'}</span></p>
                        <p className="text-gray-400">Zone Coverage: <span className="text-white">{slot.zone}</span></p>
                      </div>
                      <div className="flex gap-2">
                        {slot.status === 'available' && (
                          <Button size="sm" className="bg-[var(--jewelry-gold-500)] text-black hover:bg-[var(--jewelry-gold-600)]">
                            <Plus className="h-3 w-3 mr-1" />
                            <span className="text-black">Book Slot</span>
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="text-white border-gray-400 hover:border-white hover:text-white">
                          <Eye className="h-3 w-3 mr-1" />
                          <span className="text-white">View Details</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Delivery Summary Footer */}
        <div className="jewelry-glass-card p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Crown className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
              <h3 className="text-2xl font-bold text-white">Delivery Excellence</h3>
            </div>
            <p className="text-gray-400">Last-mile delivery perfection with customer satisfaction focus</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-gold-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">156</p>
              <p className="text-gray-400">Scheduled Today</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-blue-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-8 w-8 text-[var(--jewelry-blue-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">94.8%</p>
              <p className="text-gray-400">Success Rate</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-gold-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">4.6/5</p>
              <p className="text-gray-400">Customer Rating</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-blue-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-8 w-8 text-[var(--jewelry-blue-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">24</p>
              <p className="text-gray-400">Active Agents</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(DeliveryPage)