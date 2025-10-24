'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Wrench,
  Cog,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  Star,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  FileText,
  Settings,
  Target,
  Zap,
  Award,
  Building2,
  Truck,
  Package,
  Timer,
  ClipboardCheck,
  AlertCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Shield,
  Gauge,
  Lightbulb,
  HardHat,
  Clipboard
} from 'lucide-react'

interface MaintenanceTask {
  id: string
  title: string
  description: string
  type: 'preventive' | 'corrective' | 'emergency' | 'scheduled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled'
  assignedTo: string
  equipment: string
  location: string
  scheduledDate: string
  completedDate?: string
  estimatedDuration: number
  actualDuration?: number
  cost?: number
  notes: string[]
  requiredParts: string[]
  tags: string[]
}

interface Equipment {
  id: string
  name: string
  type: 'machinery' | 'tool' | 'vehicle' | 'building' | 'software'
  location: string
  status: 'operational' | 'maintenance' | 'broken' | 'retired'
  lastMaintenance: string
  nextMaintenance: string
  healthScore: number
  specifications: Record<string, string>
  maintenanceHistory: number
  downtime: number
  efficiency: number
}

interface MaintenanceSchedule {
  id: string
  equipmentId: string
  taskType: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  nextDue: string
  description: string
  estimatedTime: number
  assignedTeam: string
}

interface Technician {
  id: string
  name: string
  specialization: string[]
  certification: string[]
  experience: number
  rating: number
  currentTasks: number
  availability: 'available' | 'busy' | 'on_leave'
  contact: string
  location: string
}

export default function MaintenancePage() {
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Sample maintenance tasks data
  const sampleTasks: MaintenanceTask[] = [
    {
      id: '1',
      title: 'CNC Machine Calibration',
      description: 'Routine calibration and precision check for main CNC machinery',
      type: 'preventive',
      priority: 'high',
      status: 'in_progress',
      assignedTo: 'Rajesh Kumar',
      equipment: 'CNC Router CR-500',
      location: 'Production Floor - Station A',
      scheduledDate: '2024-01-15',
      estimatedDuration: 4,
      actualDuration: 2.5,
      cost: 15000,
      notes: ['Spindle bearing replacement needed', 'Software update completed'],
      requiredParts: ['Bearing Set', 'Calibration Tools'],
      tags: ['precision', 'machinery', 'critical']
    },
    {
      id: '2',
      title: 'Wood Dryer Ventilation System',
      description: 'Clean and service wood drying chamber ventilation system',
      type: 'scheduled',
      priority: 'medium',
      status: 'pending',
      assignedTo: 'Suresh Menon',
      equipment: 'Wood Drying Chamber WD-200',
      location: 'Drying Section - Chamber 2',
      scheduledDate: '2024-01-16',
      estimatedDuration: 3,
      cost: 8500,
      notes: ['Monthly cleaning due', 'Check humidity sensors'],
      requiredParts: ['Filter Cartridges', 'Sensor Kit'],
      tags: ['ventilation', 'humidity', 'routine']
    },
    {
      id: '3',
      title: 'Emergency Belt Replacement',
      description: 'Conveyor belt snapped on main assembly line - immediate repair needed',
      type: 'emergency',
      priority: 'critical',
      status: 'completed',
      assignedTo: 'Anitha Pillai',
      equipment: 'Assembly Conveyor AC-100',
      location: 'Assembly Line 1',
      scheduledDate: '2024-01-14',
      completedDate: '2024-01-14',
      estimatedDuration: 2,
      actualDuration: 1.5,
      cost: 25000,
      notes: ['Production stopped for 1.5 hours', 'Backup belt installed'],
      requiredParts: ['Heavy Duty Belt', 'Belt Fasteners'],
      tags: ['emergency', 'production', 'urgent']
    },
    {
      id: '4',
      title: 'Sanding Machine Dust Collection',
      description: 'Replace dust collection filters and check suction power',
      type: 'preventive',
      priority: 'medium',
      status: 'overdue',
      assignedTo: 'Mohammed Ali',
      equipment: 'Wide Belt Sander WBS-300',
      location: 'Finishing Section',
      scheduledDate: '2024-01-10',
      estimatedDuration: 2,
      cost: 5500,
      notes: ['Filter replacement overdue by 5 days', 'Reduced suction noticed'],
      requiredParts: ['HEPA Filters', 'Rubber Gaskets'],
      tags: ['dust', 'safety', 'overdue']
    },
    {
      id: '5',
      title: 'Forklift Annual Inspection',
      description: 'Annual safety inspection and certification for material handling',
      type: 'scheduled',
      priority: 'high',
      status: 'pending',
      assignedTo: 'Priya Nair',
      equipment: 'Electric Forklift EF-25',
      location: 'Warehouse Section',
      scheduledDate: '2024-01-18',
      estimatedDuration: 4,
      cost: 12000,
      notes: ['Certification renewal required', 'Battery health check needed'],
      requiredParts: ['Battery Kit', 'Safety Inspection Kit'],
      tags: ['safety', 'certification', 'vehicle']
    },
    {
      id: '6',
      title: 'Polish Spray Booth Cleaning',
      description: 'Deep clean polish spray booth and replace filters',
      type: 'preventive',
      priority: 'low',
      status: 'pending',
      assignedTo: 'Kumar Krishnan',
      equipment: 'Spray Booth SB-150',
      location: 'Finishing Department',
      scheduledDate: '2024-01-20',
      estimatedDuration: 3,
      cost: 7500,
      notes: ['Quarterly deep clean', 'Check ventilation efficiency'],
      requiredParts: ['Air Filters', 'Cleaning Solvents'],
      tags: ['cleaning', 'finishing', 'quarterly']
    }
  ]

  const sampleEquipment: Equipment[] = [
    {
      id: '1',
      name: 'CNC Router CR-500',
      type: 'machinery',
      location: 'Production Floor - Station A',
      status: 'maintenance',
      lastMaintenance: '2024-01-10',
      nextMaintenance: '2024-02-10',
      healthScore: 92,
      specifications: {
        'Max Cutting Size': '4x8 feet',
        'Spindle Power': '15 HP',
        'Year': '2020',
        'Manufacturer': 'Precision Tools Ltd'
      },
      maintenanceHistory: 24,
      downtime: 2,
      efficiency: 94
    },
    {
      id: '2',
      name: 'Wood Drying Chamber WD-200',
      type: 'machinery',
      location: 'Drying Section - Chamber 2',
      status: 'operational',
      lastMaintenance: '2023-12-15',
      nextMaintenance: '2024-01-16',
      healthScore: 88,
      specifications: {
        'Capacity': '50 cubic meters',
        'Temperature Range': '40-80°C',
        'Humidity Control': 'Digital',
        'Year': '2019'
      },
      maintenanceHistory: 18,
      downtime: 0.5,
      efficiency: 96
    },
    {
      id: '3',
      name: 'Assembly Conveyor AC-100',
      type: 'machinery',
      location: 'Assembly Line 1',
      status: 'operational',
      lastMaintenance: '2024-01-14',
      nextMaintenance: '2024-03-14',
      healthScore: 85,
      specifications: {
        'Length': '50 meters',
        'Speed': 'Variable 0.5-5 m/min',
        'Load Capacity': '500 kg/meter',
        'Year': '2018'
      },
      maintenanceHistory: 32,
      downtime: 1.5,
      efficiency: 89
    },
    {
      id: '4',
      name: 'Wide Belt Sander WBS-300',
      type: 'machinery',
      location: 'Finishing Section',
      status: 'broken',
      lastMaintenance: '2024-01-05',
      nextMaintenance: '2024-01-10',
      healthScore: 65,
      specifications: {
        'Belt Width': '1500mm',
        'Motor Power': '25 HP',
        'Feed Speed': '3-30 m/min',
        'Year': '2017'
      },
      maintenanceHistory: 45,
      downtime: 8,
      efficiency: 72
    },
    {
      id: '5',
      name: 'Electric Forklift EF-25',
      type: 'vehicle',
      location: 'Warehouse Section',
      status: 'operational',
      lastMaintenance: '2023-11-20',
      nextMaintenance: '2024-01-18',
      healthScore: 91,
      specifications: {
        'Capacity': '2.5 tons',
        'Lift Height': '6 meters',
        'Battery Type': 'Lithium-ion',
        'Year': '2021'
      },
      maintenanceHistory: 12,
      downtime: 0.2,
      efficiency: 97
    }
  ]

  const sampleTechnicians: Technician[] = [
    {
      id: '1',
      name: 'Rajesh Kumar',
      specialization: ['CNC Machinery', 'Precision Tools', 'Electronics'],
      certification: ['Certified Machinist', 'CNC Programming'],
      experience: 12,
      rating: 4.8,
      currentTasks: 2,
      availability: 'busy',
      contact: '+91 94474 12345',
      location: 'Production Floor'
    },
    {
      id: '2',
      name: 'Suresh Menon',
      specialization: ['HVAC Systems', 'Ventilation', 'Climate Control'],
      certification: ['HVAC Technician', 'Safety Inspector'],
      experience: 8,
      rating: 4.6,
      currentTasks: 1,
      availability: 'available',
      contact: '+91 98765 43210',
      location: 'Drying Section'
    },
    {
      id: '3',
      name: 'Anitha Pillai',
      specialization: ['Conveyor Systems', 'Mechanical Repair', 'Welding'],
      certification: ['Mechanical Engineer', 'Welding Certificate'],
      experience: 15,
      rating: 4.9,
      currentTasks: 0,
      availability: 'available',
      contact: '+91 97441 67890',
      location: 'Assembly Section'
    },
    {
      id: '4',
      name: 'Mohammed Ali',
      specialization: ['Dust Collection', 'Air Filtration', 'Safety Systems'],
      certification: ['Safety Officer', 'Environmental Compliance'],
      experience: 6,
      rating: 4.4,
      currentTasks: 3,
      availability: 'busy',
      contact: '+91 99474 55555',
      location: 'Finishing Section'
    }
  ]

  useEffect(() => {
    setMaintenanceTasks(sampleTasks)
    setEquipment(sampleEquipment)
    setTechnicians(sampleTechnicians)
  }, [])

  const filteredTasks = maintenanceTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.assignedTo.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || task.type === filterType
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      'in_progress': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      'completed': 'bg-green-500/10 text-green-600 border-green-500/20',
      'overdue': 'bg-red-500/10 text-red-600 border-red-500/20',
      'cancelled': 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
    return colors[status] || colors.pending
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-gray-500/10 text-gray-600 border-gray-500/20',
      'medium': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      'high': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      'critical': 'bg-red-500/10 text-red-600 border-red-500/20'
    }
    return colors[priority] || colors.medium
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ElementType> = {
      'preventive': Shield,
      'corrective': Wrench,
      'emergency': AlertTriangle,
      'scheduled': Calendar
    }
    return icons[type] || Wrench
  }

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ElementType> = {
      'pending': Clock,
      'in_progress': PlayCircle,
      'completed': CheckCircle,
      'overdue': AlertCircle,
      'cancelled': XCircle
    }
    return icons[status] || Clock
  }

  const getEquipmentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'operational': 'bg-green-500/10 text-green-600 border-green-500/20',
      'maintenance': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      'broken': 'bg-red-500/10 text-red-600 border-red-500/20',
      'retired': 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
    return colors[status] || colors.operational
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-yellow-600'
    if (score >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const getTotalMaintenanceCost = () => {
    return maintenanceTasks.reduce((sum, task) => sum + (task.cost || 0), 0)
  }

  const getOverdueTasks = () => {
    return maintenanceTasks.filter(task => task.status === 'overdue').length
  }

  const getInProgressTasks = () => {
    return maintenanceTasks.filter(task => task.status === 'in_progress').length
  }

  const getAvailableTechnicians = () => {
    return technicians.filter(tech => tech.availability === 'available').length
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
                  <Wrench className="h-8 w-8 jewelry-text-gold" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold jewelry-text-luxury">Maintenance Management</h1>
                  <p className="text-lg text-gray-300">Kerala Furniture Workshop Operations</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                  <HardHat className="h-3 w-3 mr-1" />
                  Workshop Ready
                </Badge>
                <Button className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold">
                  <Plus className="h-4 w-4" />
                  New Task
                </Button>
              </div>
            </div>
          </div>

          {/* KPI Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <Gauge className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Total Maintenance Cost</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">₹{(getTotalMaintenanceCost() / 1000).toFixed(0)}K</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">This month</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Overdue Tasks</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{getOverdueTasks()}</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Needs immediate attention</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Active Tasks</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{getInProgressTasks()}</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Currently in progress</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-violet-500 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Available Technicians</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{getAvailableTechnicians()}</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Ready for assignment</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="jewelry-glass-card p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <Input
                    placeholder="Search tasks, equipment, or technicians..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 jewelry-glass-input"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                  className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold"
                >
                  All Types
                </Button>
                <Button
                  variant={filterType === 'preventive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('preventive')}
                  className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold"
                >
                  <Shield className="h-4 w-4" />
                  Preventive
                </Button>
                <Button
                  variant={filterType === 'emergency' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('emergency')}
                  className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Emergency
                </Button>
                <Button
                  variant={filterStatus === 'overdue' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(filterStatus === 'overdue' ? 'all' : 'overdue')}
                  className="jewelry-glass-btn gap-1 text-red-600 hover:text-red-500"
                >
                  <Clock className="h-4 w-4" />
                  Overdue
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="tasks" className="space-y-4">
            <TabsList className="jewelry-glass-panel">
              <TabsTrigger value="tasks" className="jewelry-glass-btn jewelry-text-luxury">Maintenance Tasks</TabsTrigger>
              <TabsTrigger value="equipment" className="jewelry-glass-btn jewelry-text-luxury">Equipment</TabsTrigger>
              <TabsTrigger value="technicians" className="jewelry-glass-btn jewelry-text-luxury">Technicians</TabsTrigger>
              <TabsTrigger value="analytics" className="jewelry-glass-btn jewelry-text-luxury">Analytics</TabsTrigger>
            </TabsList>

            {/* Maintenance Tasks */}
            <TabsContent value="tasks" className="space-y-4">
              <div className="space-y-4">
                {filteredTasks.map((task) => {
                  const TypeIcon = getTypeIcon(task.type)
                  const StatusIcon = getStatusIcon(task.status)
                  
                  return (
                    <div key={task.id} className="jewelry-glass-card p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                            <TypeIcon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold jewelry-text-luxury">{task.title}</h3>
                              <Badge className={getStatusColor(task.status)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {task.status.replace('_', ' ').charAt(0).toUpperCase() + task.status.replace('_', ' ').slice(1)}
                              </Badge>
                              <Badge className={getPriorityColor(task.priority)}>
                                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                              </Badge>
                            </div>
                            
                            <p className="text-gray-300 mb-4">{task.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300 mb-4">
                              <div>
                                <span className="font-medium">Equipment:</span> {task.equipment}
                              </div>
                              <div>
                                <span className="font-medium">Assigned to:</span> {task.assignedTo}
                              </div>
                              <div>
                                <span className="font-medium">Location:</span> {task.location}
                              </div>
                              <div>
                                <span className="font-medium">Scheduled:</span> {task.scheduledDate}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300 mb-4">
                              <div>
                                <span className="font-medium">Est. Duration:</span> {task.estimatedDuration}h
                              </div>
                              {task.actualDuration && (
                                <div>
                                  <span className="font-medium">Actual Duration:</span> {task.actualDuration}h
                                </div>
                              )}
                              {task.cost && (
                                <div>
                                  <span className="font-medium">Cost:</span> ₹{task.cost.toLocaleString()}
                                </div>
                              )}
                              <div>
                                <span className="font-medium">Type:</span> {task.type.replace('_', ' ').charAt(0).toUpperCase() + task.type.replace('_', ' ').slice(1)}
                              </div>
                            </div>

                            {task.requiredParts.length > 0 && (
                              <div className="mb-4">
                                <p className="text-sm font-medium jewelry-text-luxury mb-2">Required Parts:</p>
                                <div className="flex flex-wrap gap-2">
                                  {task.requiredParts.map((part, index) => (
                                    <Badge key={index} variant="outline" className="text-xs jewelry-badge-text">
                                      <Package className="h-3 w-3 mr-1" />
                                      {part}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {task.notes.length > 0 && (
                              <div className="mb-4">
                                <p className="text-sm font-medium jewelry-text-luxury mb-2">Notes:</p>
                                <div className="space-y-1">
                                  {task.notes.map((note, index) => (
                                    <div key={index} className="text-sm text-gray-300 flex items-center gap-2">
                                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                      {note}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {task.tags.length > 0 && (
                              <div>
                                <div className="flex flex-wrap gap-2">
                                  {task.tags.map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button size="sm" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          {task.status === 'pending' && (
                            <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 text-green-600">
                              <PlayCircle className="h-3 w-3" />
                              Start
                            </Button>
                          )}
                          {task.status === 'in_progress' && (
                            <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 text-blue-600">
                              <CheckCircle className="h-3 w-3" />
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>

            {/* Equipment */}
            <TabsContent value="equipment" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {equipment.map((item) => (
                  <div key={item.id} className="jewelry-glass-card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-center">
                          <Settings className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold jewelry-text-luxury">{item.name}</h3>
                          <p className="text-sm text-gray-300">{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getEquipmentStatusColor(item.status)}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Health Score</span>
                        <span className={`text-sm font-bold ${getHealthScoreColor(item.healthScore)}`}>
                          {item.healthScore}%
                        </span>
                      </div>
                      <Progress value={item.healthScore} className="h-2" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{item.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Next: {item.nextMaintenance}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          <span>Efficiency: {item.efficiency}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Downtime: {item.downtime}h</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium jewelry-text-luxury mb-2">Specifications:</p>
                        <div className="space-y-1">
                          {Object.entries(item.specifications).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm text-gray-300">
                              <span>{key}:</span>
                              <span>{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Technicians */}
            <TabsContent value="technicians" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {technicians.map((tech) => (
                  <div key={tech.id} className="jewelry-glass-card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold jewelry-text-luxury">{tech.name}</h3>
                          <p className="text-sm text-gray-300">{tech.experience} years experience</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-500" />
                          <span className="font-medium jewelry-text-luxury">{tech.rating}/5</span>
                        </div>
                        <Badge className={
                          tech.availability === 'available' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                          tech.availability === 'busy' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                          'bg-gray-500/10 text-gray-600 border-gray-500/20'
                        }>
                          {tech.availability.replace('_', ' ').charAt(0).toUpperCase() + tech.availability.replace('_', ' ').slice(1)}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{tech.contact}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{tech.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ClipboardCheck className="h-3 w-3" />
                          <span>Current Tasks: {tech.currentTasks}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium jewelry-text-luxury mb-2">Specializations:</p>
                        <div className="flex flex-wrap gap-2">
                          {tech.specialization.map((spec, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium jewelry-text-luxury mb-2">Certifications:</p>
                        <div className="flex flex-wrap gap-2">
                          {tech.certification.map((cert, index) => (
                            <Badge key={index} variant="outline" className="text-xs jewelry-badge-text">
                              <Award className="h-3 w-3 mr-1" />
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Maintenance Performance */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Maintenance Performance</h3>
                  <div className="space-y-4">
                    {[
                      { metric: 'Equipment Uptime', value: '94.5%', trend: '+2.1%', status: 'good' },
                      { metric: 'Average Response Time', value: '2.3 hours', trend: '-15 min', status: 'good' },
                      { metric: 'Task Completion Rate', value: '89%', trend: '+5%', status: 'good' },
                      { metric: 'Preventive vs Reactive', value: '70/30', trend: '+10%', status: 'good' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <div className="font-medium jewelry-text-luxury">{item.metric}</div>
                          <div className="text-sm text-gray-300">Performance metric</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold jewelry-text-luxury">{item.value}</div>
                          <div className={`text-sm ${item.trend.includes('+') ? 'text-green-500' : 'text-blue-500'}`}>
                            {item.trend}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cost Analysis */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Cost Analysis</h3>
                  <div className="space-y-4">
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <TrendingDown className="h-4 w-4" />
                        Preventive Maintenance Savings
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        ₹2.5L saved this quarter through proactive maintenance scheduling.
                      </p>
                    </div>
                    
                    <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <div className="flex items-center gap-2 text-amber-600 font-medium">
                        <AlertTriangle className="h-4 w-4" />
                        Emergency Repair Costs
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        ₹85K spent on emergency repairs this month - 15% increase from last month.
                      </p>
                    </div>

                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="flex items-center gap-2 text-blue-600 font-medium">
                        <BarChart3 className="h-4 w-4" />
                        Equipment ROI
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        Average equipment ROI improved to 142% through optimized maintenance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Performance Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="jewelry-glass-card p-6 text-center">
                  <div className="text-3xl font-bold jewelry-text-gold">95.2%</div>
                  <div className="text-sm text-gray-300">Equipment Uptime</div>
                  <div className="text-xs text-gray-300 mt-1">Target: &gt;95%</div>
                </div>
                <div className="jewelry-glass-card p-6 text-center">
                  <div className="text-3xl font-bold jewelry-text-gold">1.8 hrs</div>
                  <div className="text-sm text-gray-300">Avg Response Time</div>
                  <div className="text-xs text-gray-300 mt-1">Target: &lt;2 hrs</div>
                </div>
                <div className="jewelry-glass-card p-6 text-center">
                  <div className="text-3xl font-bold jewelry-text-gold">₹4.2L</div>
                  <div className="text-sm text-gray-300">Monthly Maintenance Budget</div>
                  <div className="text-xs text-gray-300 mt-1">82% utilized</div>
                </div>
                <div className="jewelry-glass-card p-6 text-center">
                  <div className="text-3xl font-bold jewelry-text-gold">24</div>
                  <div className="text-sm text-gray-300">Tasks Completed</div>
                  <div className="text-xs text-gray-300 mt-1">This week</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}