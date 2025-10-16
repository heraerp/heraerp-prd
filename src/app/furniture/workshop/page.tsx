'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Wrench,
  Hammer,
  Settings,
  Activity,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Factory,
  Package,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
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
  Calendar,
  MapPin,
  Phone,
  Mail,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Building2,
  Truck,
  Shield,
  Lightbulb,
  Rocket,
  Brain,
  Compass,
  Globe,
  DollarSign,
  Percent,
  Layers,
  Database,
  Network,
  Cpu,
  Scissors,
  Ruler,
  Paintbrush,
  Drill,
  Saw,
  Screwdriver,
  HardHat,
  ShoppingCart,
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
  Flame,
  Snowflake,
  Droplets,
  Wind,
  Sun,
  Thermometer,
  Wifi,
  Bluetooth,
  Power,
  Battery,
  MemoryStick,
  HardDrive
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface WorkstationStatus {
  id: string
  name: string
  department: string
  operator: string
  status: 'active' | 'idle' | 'maintenance' | 'offline'
  currentJob: string
  progress: number
  efficiency: number
  quality: number
  lastMaintenance: string
  nextMaintenance: string
  tools: string[]
  safety: 'excellent' | 'good' | 'warning' | 'critical'
}

interface ProductionJob {
  id: string
  jobNumber: string
  product: string
  customer: string
  quantity: number
  completed: number
  status: 'queued' | 'in_progress' | 'quality_check' | 'completed' | 'delayed'
  priority: 'urgent' | 'high' | 'normal' | 'low'
  startDate: string
  dueDate: string
  estimatedHours: number
  actualHours: number
  workstations: string[]
  assignedTeam: string[]
}

interface WorkshopMetric {
  id: string
  label: string
  value: string | number
  change: string
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: React.ElementType
  color: string
  target?: string
}

interface SafetyIncident {
  id: string
  type: 'minor' | 'major' | 'near_miss'
  description: string
  location: string
  reportedBy: string
  date: string
  status: 'open' | 'investigating' | 'resolved'
  corrective_actions: string[]
}

function WorkshopPage() {
  const [selectedShift, setSelectedShift] = useState('current')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [liveMonitoring, setLiveMonitoring] = useState(true)

  // Workshop Performance Metrics
  const workshopMetrics: WorkshopMetric[] = [
    {
      id: 'overall-efficiency',
      label: 'Overall Efficiency',
      value: '87%',
      change: '+5.2%',
      changeType: 'increase',
      icon: Gauge,
      color: 'text-[var(--jewelry-gold-500)]',
      target: '90%'
    },
    {
      id: 'active-workstations',
      label: 'Active Workstations',
      value: '24/30',
      change: '+3',
      changeType: 'increase',
      icon: Factory,
      color: 'text-[var(--jewelry-blue-500)]'
    },
    {
      id: 'production-rate',
      label: 'Production Rate',
      value: '142 units/day',
      change: '+18 units',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'text-[var(--jewelry-gold-500)]'
    },
    {
      id: 'quality-score',
      label: 'Quality Score',
      value: '96.8%',
      change: '+1.2%',
      changeType: 'increase',
      icon: Star,
      color: 'text-[var(--jewelry-gold-500)]',
      target: '98%'
    },
    {
      id: 'safety-days',
      label: 'Safety Days',
      value: '47',
      change: '+1',
      changeType: 'increase',
      icon: Shield,
      color: 'text-[var(--jewelry-blue-500)]'
    },
    {
      id: 'on-time-delivery',
      label: 'On-Time Delivery',
      value: '92%',
      change: '+3%',
      changeType: 'increase',
      icon: Clock,
      color: 'text-[var(--jewelry-gold-500)]'
    }
  ]

  // Workstation Status Data
  const workstations: WorkstationStatus[] = [
    {
      id: 'ws-001',
      name: 'CNC Router Station 1',
      department: 'Cutting',
      operator: 'Rajesh Kumar',
      status: 'active',
      currentJob: 'Hotel Bed Frame - Premium',
      progress: 78,
      efficiency: 94,
      quality: 98,
      lastMaintenance: '2025-01-10',
      nextMaintenance: '2025-01-25',
      tools: ['CNC Router', 'Vacuum System', 'Dust Collector'],
      safety: 'excellent'
    },
    {
      id: 'ws-002',
      name: 'Assembly Station A',
      department: 'Assembly',
      operator: 'Priya Nair',
      status: 'active',
      currentJob: 'Luxury Sofa Set',
      progress: 45,
      efficiency: 89,
      quality: 96,
      lastMaintenance: '2025-01-12',
      nextMaintenance: '2025-01-27',
      tools: ['Pneumatic Tools', 'Assembly Jigs', 'Quality Meters'],
      safety: 'good'
    },
    {
      id: 'ws-003',
      name: 'Finishing Station 2',
      department: 'Finishing',
      operator: 'Mohammed Ali',
      status: 'active',
      currentJob: 'Office Desk Polishing',
      progress: 92,
      efficiency: 91,
      quality: 97,
      lastMaintenance: '2025-01-08',
      nextMaintenance: '2025-01-23',
      tools: ['Spray Booth', 'Sanders', 'Polishing Equipment'],
      safety: 'excellent'
    },
    {
      id: 'ws-004',
      name: 'Upholstery Station',
      department: 'Upholstery',
      operator: 'Lakshmi Devi',
      status: 'idle',
      currentJob: 'Waiting for Materials',
      progress: 0,
      efficiency: 85,
      quality: 99,
      lastMaintenance: '2025-01-15',
      nextMaintenance: '2025-01-30',
      tools: ['Sewing Machines', 'Cutting Tools', 'Steam Press'],
      safety: 'excellent'
    },
    {
      id: 'ws-005',
      name: 'Quality Control Station',
      department: 'QC',
      operator: 'Suresh Menon',
      status: 'active',
      currentJob: 'Final Inspection - Export Order',
      progress: 67,
      efficiency: 96,
      quality: 99,
      lastMaintenance: '2025-01-14',
      nextMaintenance: '2025-01-29',
      tools: ['Measuring Instruments', 'Testing Equipment', 'Documentation'],
      safety: 'excellent'
    },
    {
      id: 'ws-006',
      name: 'Packaging Station',
      department: 'Packaging',
      operator: 'Anil Joseph',
      status: 'maintenance',
      currentJob: 'Scheduled Maintenance',
      progress: 0,
      efficiency: 88,
      quality: 95,
      lastMaintenance: '2025-01-16',
      nextMaintenance: '2025-01-31',
      tools: ['Packaging Equipment', 'Wrapping Machines', 'Labels'],
      safety: 'warning'
    }
  ]

  // Production Jobs
  const productionJobs: ProductionJob[] = [
    {
      id: 'job-001',
      jobNumber: 'FUR-2025-0134',
      product: 'Executive Office Suite',
      customer: 'Corporate Interiors Ltd',
      quantity: 25,
      completed: 18,
      status: 'in_progress',
      priority: 'high',
      startDate: '2025-01-10',
      dueDate: '2025-01-25',
      estimatedHours: 120,
      actualHours: 98,
      workstations: ['ws-001', 'ws-002', 'ws-003'],
      assignedTeam: ['Rajesh Kumar', 'Priya Nair', 'Mohammed Ali']
    },
    {
      id: 'job-002',
      jobNumber: 'FUR-2025-0135',
      product: 'Luxury Hotel Bedroom Set',
      customer: 'Grand Palace Hotel',
      quantity: 50,
      completed: 35,
      status: 'in_progress',
      priority: 'urgent',
      startDate: '2025-01-08',
      dueDate: '2025-01-22',
      estimatedHours: 200,
      actualHours: 145,
      workstations: ['ws-001', 'ws-004', 'ws-005'],
      assignedTeam: ['Rajesh Kumar', 'Lakshmi Devi', 'Suresh Menon']
    },
    {
      id: 'job-003',
      jobNumber: 'FUR-2025-0136',
      product: 'Custom Dining Set',
      customer: 'Premium Homes',
      quantity: 8,
      completed: 8,
      status: 'quality_check',
      priority: 'normal',
      startDate: '2025-01-12',
      dueDate: '2025-01-20',
      estimatedHours: 64,
      actualHours: 59,
      workstations: ['ws-002', 'ws-003', 'ws-005'],
      assignedTeam: ['Priya Nair', 'Mohammed Ali', 'Suresh Menon']
    },
    {
      id: 'job-004',
      jobNumber: 'FUR-2025-0137',
      product: 'Export Furniture Collection',
      customer: 'International Furnishings',
      quantity: 100,
      completed: 0,
      status: 'queued',
      priority: 'high',
      startDate: '2025-01-20',
      dueDate: '2025-02-15',
      estimatedHours: 320,
      actualHours: 0,
      workstations: ['ws-001', 'ws-002', 'ws-003', 'ws-004'],
      assignedTeam: ['All Teams']
    }
  ]

  // Safety Incidents
  const safetyIncidents: SafetyIncident[] = [
    {
      id: 'inc-001',
      type: 'near_miss',
      description: 'Loose safety guard on saw noticed during routine check',
      location: 'Cutting Department - Station 3',
      reportedBy: 'Safety Officer',
      date: '2025-01-15',
      status: 'resolved',
      corrective_actions: ['Guard tightened', 'Daily safety checks implemented']
    },
    {
      id: 'inc-002',
      type: 'minor',
      description: 'Worker slipped on sawdust, no injury',
      location: 'Workshop Floor - Section B',
      reportedBy: 'Floor Supervisor',
      date: '2025-01-12',
      status: 'resolved',
      corrective_actions: ['Enhanced cleaning schedule', 'Non-slip mats installed']
    }
  ]

  // Department Performance
  const departmentPerformance = [
    {
      department: 'Cutting & Preparation',
      efficiency: 94,
      capacity: 87,
      quality: 96,
      activeStations: 8,
      totalStations: 10,
      status: 'optimal'
    },
    {
      department: 'Assembly',
      efficiency: 89,
      capacity: 92,
      quality: 94,
      activeStations: 6,
      totalStations: 7,
      status: 'good'
    },
    {
      department: 'Finishing',
      efficiency: 91,
      capacity: 85,
      quality: 97,
      activeStations: 5,
      totalStations: 6,
      status: 'good'
    },
    {
      department: 'Upholstery',
      efficiency: 85,
      capacity: 78,
      quality: 99,
      activeStations: 3,
      totalStations: 4,
      status: 'average'
    },
    {
      department: 'Quality Control',
      efficiency: 96,
      capacity: 90,
      quality: 99,
      activeStations: 2,
      totalStations: 2,
      status: 'optimal'
    },
    {
      department: 'Packaging',
      efficiency: 88,
      capacity: 82,
      quality: 95,
      activeStations: 3,
      totalStations: 4,
      status: 'maintenance'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-[var(--jewelry-success)] bg-green-500/20'
      case 'idle': return 'text-[var(--jewelry-warning)] bg-yellow-500/20'
      case 'maintenance': return 'text-[var(--jewelry-info)] bg-blue-500/20'
      case 'offline': return 'text-[var(--jewelry-error)] bg-red-500/20'
      case 'optimal': return 'text-[var(--jewelry-success)]'
      case 'good': return 'text-[var(--jewelry-warning)]'
      case 'average': return 'text-[var(--jewelry-info)]'
      case 'poor': return 'text-[var(--jewelry-error)]'
      default: return 'text-gray-300'
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

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'quality_check': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'delayed': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'queued': return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getSafetyColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'text-[var(--jewelry-success)]'
      case 'good': return 'text-[var(--jewelry-warning)]'
      case 'warning': return 'text-[var(--jewelry-error)]'
      case 'critical': return 'text-red-500'
      default: return 'text-gray-300'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--jewelry-blue-500)] to-[var(--jewelry-blue-700)] flex items-center justify-center">
                <Factory className="h-6 w-6 text-[var(--jewelry-gold-400)]" />
              </div>
              Workshop Management
            </h1>
            <p className="text-gray-300 mt-2">
              Real-time workshop monitoring, production tracking, and safety management
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="px-3 py-2 rounded-md border bg-black/20 border-gray-600 text-white focus:border-[var(--jewelry-gold-500)]"
              >
                <option value="current">Current Shift</option>
                <option value="morning">Morning Shift</option>
                <option value="afternoon">Afternoon Shift</option>
                <option value="night">Night Shift</option>
              </select>
            </div>
            <Button 
              variant="outline" 
              className="gap-2 text-white border-gray-400 hover:border-white hover:text-white"
              onClick={() => setLiveMonitoring(!liveMonitoring)}
            >
              <Activity className={`h-4 w-4 ${liveMonitoring ? 'animate-pulse' : ''}`} />
              <span className="text-white">{liveMonitoring ? 'Live' : 'Paused'}</span>
            </Button>
            <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
              <Download className="h-4 w-4" />
              <span className="text-white">Export Report</span>
            </Button>
            <Button className="gap-2 bg-[var(--jewelry-gold-500)] text-black hover:bg-[var(--jewelry-gold-600)] border-0">
              <Eye className="h-4 w-4" />
              <span className="text-black font-medium">Live Monitor</span>
            </Button>
          </div>
        </div>

        {/* Workshop Status Bar */}
        <div className="jewelry-glass-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[var(--jewelry-success)]" />
              <span className="text-white font-medium">Workshop Status</span>
              <div className="w-2 h-2 bg-[var(--jewelry-success)] rounded-full animate-pulse"></div>
              <span className="text-gray-400 text-sm">All Systems Operational</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-400">Active Jobs</p>
                <p className="font-semibold text-[var(--jewelry-gold-500)]">12</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Workers On Duty</p>
                <p className="font-semibold text-white">28</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Efficiency</p>
                <p className="font-semibold text-[var(--jewelry-success)]">87%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Safety Status</p>
                <p className="font-semibold text-[var(--jewelry-success)]">47 Days</p>
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
          {workshopMetrics.map((metric) => (
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

        {/* Workshop Tabs */}
        <Tabs defaultValue="workstations" className="space-y-6">
          <TabsList className="bg-black/20 border border-gray-600">
            <TabsTrigger value="workstations" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Workstations
            </TabsTrigger>
            <TabsTrigger value="production" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Production Jobs
            </TabsTrigger>
            <TabsTrigger value="departments" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Departments
            </TabsTrigger>
            <TabsTrigger value="safety" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Safety
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workstations" className="space-y-6">
            {/* Workstation Monitoring */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Settings className="h-6 w-6 text-[var(--jewelry-blue-500)]" />
                  <h3 className="text-xl font-semibold text-white">Live Workstation Status</h3>
                  <Badge className="bg-[var(--jewelry-success)]/20 text-[var(--jewelry-success)] border-[var(--jewelry-success)]/30">
                    Real-time
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="px-3 py-2 rounded-md border bg-black/20 border-gray-600 text-white focus:border-[var(--jewelry-gold-500)]"
                  >
                    <option value="all">All Departments</option>
                    <option value="cutting">Cutting</option>
                    <option value="assembly">Assembly</option>
                    <option value="finishing">Finishing</option>
                    <option value="upholstery">Upholstery</option>
                    <option value="qc">Quality Control</option>
                    <option value="packaging">Packaging</option>
                  </select>
                  <Button variant="outline" size="sm" className="text-white border-gray-400 hover:border-white hover:text-white">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {workstations.map((station) => (
                  <div key={station.id} className="bg-black/20 rounded-lg p-4 border border-gray-600 hover:border-[var(--jewelry-gold-500)]/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">{station.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs border ${getStatusColor(station.status)}`}>
                          {station.status}
                        </Badge>
                        <div className={`w-2 h-2 rounded-full ${getSafetyColor(station.safety)} ${
                          station.safety === 'excellent' ? 'bg-green-500' :
                          station.safety === 'good' ? 'bg-yellow-500' :
                          station.safety === 'warning' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}></div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Operator:</span>
                          <span className="text-white">{station.operator}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Current Job:</span>
                          <span className="text-white text-xs">{station.currentJob}</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400 text-sm">Progress</span>
                          <span className="text-white font-medium">{station.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-[var(--jewelry-gold-500)] h-2 rounded-full"
                            style={{ width: `${station.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400 text-xs">Efficiency</p>
                          <p className="text-[var(--jewelry-gold-500)] font-semibold">{station.efficiency}%</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Quality</p>
                          <p className="text-[var(--jewelry-success)] font-semibold">{station.quality}%</p>
                        </div>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Next Maintenance: {formatDate(station.nextMaintenance)}</span>
                        <Button size="sm" variant="outline" className="text-[var(--jewelry-gold-500)] border-[var(--jewelry-gold-500)]/50 hover:bg-[var(--jewelry-gold-500)]/10">
                          <span className="text-[var(--jewelry-gold-500)]">Details</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="production" className="space-y-6">
            {/* Production Jobs */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-[var(--jewelry-gold-500)]" />
                  <h3 className="text-xl font-semibold text-white">Active Production Jobs</h3>
                </div>
                <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
                  <Calendar className="h-4 w-4" />
                  <span className="text-white">Schedule View</span>
                </Button>
              </div>

              <div className="space-y-4">
                {productionJobs.map((job) => (
                  <div key={job.id} className="bg-black/20 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-white">{job.product}</h4>
                        <Badge className={`text-xs border ${getPriorityColor(job.priority)}`}>
                          {job.priority}
                        </Badge>
                        <Badge className={`text-xs border ${getJobStatusColor(job.status)}`}>
                          {job.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <span className="text-gray-400 text-sm">Job #{job.jobNumber}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Customer</p>
                        <p className="text-white font-medium">{job.customer}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Due Date</p>
                        <p className="text-white font-medium">{formatDate(job.dueDate)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Assigned Team</p>
                        <p className="text-white font-medium text-xs">{job.assignedTeam.join(', ')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400 text-sm">Progress</span>
                          <span className="text-white font-medium">{job.completed}/{job.quantity}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-[var(--jewelry-gold-500)] h-2 rounded-full"
                            style={{ width: `${(job.completed / job.quantity) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">Est. Hours</p>
                        <p className="text-white font-semibold">{job.estimatedHours}h</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">Actual Hours</p>
                        <p className="text-[var(--jewelry-gold-500)] font-semibold">{job.actualHours}h</p>
                      </div>
                      <div className="text-center">
                        <Button size="sm" variant="outline" className="text-white border-gray-400 hover:border-white hover:text-white">
                          <span className="text-white">View Details</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="departments" className="space-y-6">
            {/* Department Performance */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-[var(--jewelry-blue-500)]" />
                  <h3 className="text-xl font-semibold text-white">Department Performance Overview</h3>
                </div>
                <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-white">Performance Analytics</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departmentPerformance.map((dept, index) => (
                  <div key={index} className="bg-black/20 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-white">{dept.department}</h4>
                      <span className={`text-sm font-medium px-2 py-1 rounded ${getStatusColor(dept.status)} bg-black/20`}>
                        {dept.status}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400 text-sm">Efficiency</span>
                          <span className="text-white font-medium">{dept.efficiency}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-[var(--jewelry-gold-500)] h-2 rounded-full"
                            style={{ width: `${dept.efficiency}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400 text-sm">Capacity</span>
                          <span className="text-white font-medium">{dept.capacity}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-[var(--jewelry-blue-500)] h-2 rounded-full"
                            style={{ width: `${dept.capacity}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400 text-sm">Quality</span>
                          <span className="text-white font-medium">{dept.quality}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${dept.quality}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Active Stations</span>
                        <span className="text-[var(--jewelry-gold-500)] font-medium">
                          {dept.activeStations}/{dept.totalStations}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="safety" className="space-y-6">
            {/* Safety Management */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-[var(--jewelry-blue-500)]" />
                  <h3 className="text-xl font-semibold text-white">Workshop Safety Management</h3>
                  <Badge className="bg-[var(--jewelry-success)]/20 text-[var(--jewelry-success)] border-[var(--jewelry-success)]/30">
                    47 Days Incident-Free
                  </Badge>
                </div>
                <Button className="gap-2 bg-[var(--jewelry-gold-500)] text-black hover:bg-[var(--jewelry-gold-600)] border-0">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-black font-medium">Report Incident</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Safety Metrics */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">Safety Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-black/20 rounded-lg">
                      <div className="w-12 h-12 bg-[var(--jewelry-success)]/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Shield className="h-6 w-6 text-[var(--jewelry-success)]" />
                      </div>
                      <p className="text-2xl font-bold text-white">47</p>
                      <p className="text-gray-400 text-sm">Incident-Free Days</p>
                    </div>
                    <div className="text-center p-4 bg-black/20 rounded-lg">
                      <div className="w-12 h-12 bg-[var(--jewelry-gold-500)]/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <CheckCircle className="h-6 w-6 text-[var(--jewelry-gold-500)]" />
                      </div>
                      <p className="text-2xl font-bold text-white">98%</p>
                      <p className="text-gray-400 text-sm">Safety Compliance</p>
                    </div>
                    <div className="text-center p-4 bg-black/20 rounded-lg">
                      <div className="w-12 h-12 bg-[var(--jewelry-blue-500)]/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Users className="h-6 w-6 text-[var(--jewelry-blue-500)]" />
                      </div>
                      <p className="text-2xl font-bold text-white">28</p>
                      <p className="text-gray-400 text-sm">Workers Trained</p>
                    </div>
                    <div className="text-center p-4 bg-black/20 rounded-lg">
                      <div className="w-12 h-12 bg-[var(--jewelry-warning)]/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <AlertTriangle className="h-6 w-6 text-[var(--jewelry-warning)]" />
                      </div>
                      <p className="text-2xl font-bold text-white">2</p>
                      <p className="text-gray-400 text-sm">This Month</p>
                    </div>
                  </div>
                </div>

                {/* Recent Incidents */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">Recent Safety Incidents</h4>
                  <div className="space-y-3">
                    {safetyIncidents.map((incident) => (
                      <div key={incident.id} className="bg-black/20 rounded-lg p-3 border border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={`text-xs border ${
                            incident.type === 'minor' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                            incident.type === 'major' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                            'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          }`}>
                            {incident.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-gray-400">{formatDate(incident.date)}</span>
                        </div>
                        <p className="text-white text-sm mb-2">{incident.description}</p>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">{incident.location}</span>
                          <span className={`font-medium ${
                            incident.status === 'resolved' ? 'text-[var(--jewelry-success)]' :
                            incident.status === 'investigating' ? 'text-[var(--jewelry-warning)]' :
                            'text-[var(--jewelry-error)]'
                          }`}>
                            {incident.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Workshop Summary Footer */}
        <div className="jewelry-glass-card p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Crown className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
              <h3 className="text-2xl font-bold text-white">Workshop Excellence</h3>
            </div>
            <p className="text-gray-400">Precision manufacturing with safety and quality at the forefront</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-gold-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Factory className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">30</p>
              <p className="text-gray-400">Total Workstations</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-blue-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-8 w-8 text-[var(--jewelry-blue-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">45</p>
              <p className="text-gray-400">Skilled Workers</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-gold-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">96.8%</p>
              <p className="text-gray-400">Quality Standard</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-blue-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="h-8 w-8 text-[var(--jewelry-blue-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-gray-400">Safety Compliant</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(WorkshopPage)