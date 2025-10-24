'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Factory,
  Hammer,
  TreePine,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Target,
  Star,
  Zap,
  Award,
  MapPin,
  Cloud,
  Sun,
  CloudRain,
  Eye,
  Edit,
  Play,
  Pause,
  MoreHorizontal,
  TrendingUp,
  Package,
  Truck,
  Building2,
  Phone
} from 'lucide-react'

interface WorkOrder {
  id: string
  orderNumber: string
  customerName: string
  productName: string
  quantity: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'quality_check' | 'finishing' | 'completed' | 'delayed'
  startDate: string
  dueDate: string
  progress: number
  assignedCraftsman: string
  craftmanSkill: string
  woodType: string
  estimatedHours: number
  actualHours: number
  qualityScore: number
  notes: string[]
  isExport: boolean
}

interface Craftsman {
  id: string
  name: string
  skill: string
  experience: number
  efficiency: number
  currentWorkload: number
  maxCapacity: number
  specialization: string[]
  location: string
  phone: string
  status: 'available' | 'busy' | 'on_leave'
}

interface WorkStation {
  id: string
  name: string
  type: string
  capacity: number
  currentUtilization: number
  maintenanceStatus: 'good' | 'needs_service' | 'under_maintenance'
  location: string
  supervisor: string
}

export default function ProductionPlanning() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [craftsmen, setCraftsmen] = useState<Craftsman[]>([])
  const [workStations, setWorkStations] = useState<WorkStation[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  const [weatherImpact, setWeatherImpact] = useState('favorable')

  // Kerala furniture craftwork sample data
  const sampleWorkOrders: WorkOrder[] = [
    {
      id: '1',
      orderNumber: 'KFW-2024-001',
      customerName: 'ITC Grand Chola',
      productName: 'Executive Room Set (Teak)',
      quantity: 150,
      priority: 'high',
      status: 'in_progress',
      startDate: '2024-01-15',
      dueDate: '2024-02-28',
      progress: 65,
      assignedCraftsman: 'Raman Master',
      craftmanSkill: 'Traditional Carving',
      woodType: 'Premium Teak',
      estimatedHours: 1200,
      actualHours: 780,
      qualityScore: 92,
      notes: ['Customer prefers traditional Kerala finish', 'Export quality standards', 'Site delivery required'],
      isExport: false
    },
    {
      id: '2',
      orderNumber: 'KFW-2024-002',
      customerName: 'Dubai Furniture LLC',
      productName: 'Traditional Kerala Dining Set',
      quantity: 25,
      priority: 'urgent',
      status: 'quality_check',
      startDate: '2024-01-10',
      dueDate: '2024-02-15',
      progress: 85,
      assignedCraftsman: 'Suresh Achari',
      craftmanSkill: 'Fine Woodwork',
      woodType: 'Rosewood',
      estimatedHours: 800,
      actualHours: 720,
      qualityScore: 96,
      notes: ['Export grade finish required', 'Moisture content check', 'International shipping'],
      isExport: true
    },
    {
      id: '3',
      orderNumber: 'KFW-2024-003',
      customerName: 'Taj Kumarakom Resort',
      productName: 'Lakeside Villa Furniture',
      quantity: 50,
      priority: 'medium',
      status: 'finishing',
      startDate: '2024-01-20',
      dueDate: '2024-03-10',
      progress: 75,
      assignedCraftsman: 'Anoop Kumar',
      craftmanSkill: 'Resort Furniture',
      woodType: 'Jackfruit Wood',
      estimatedHours: 600,
      actualHours: 450,
      qualityScore: 88,
      notes: ['Water-resistant coating', 'Monsoon-ready finish', 'Resort delivery timeline'],
      isExport: false
    }
  ]

  const sampleCraftsmen: Craftsman[] = [
    {
      id: '1',
      name: 'Raman Master',
      skill: 'Traditional Carving',
      experience: 25,
      efficiency: 95,
      currentWorkload: 85,
      maxCapacity: 100,
      specialization: ['Teak Carving', 'Traditional Designs', 'Heritage Furniture'],
      location: 'Kozhikode Workshop',
      phone: '+91 98765 12345',
      status: 'busy'
    },
    {
      id: '2',
      name: 'Suresh Achari',
      skill: 'Fine Woodwork',
      experience: 18,
      efficiency: 92,
      currentWorkload: 70,
      maxCapacity: 100,
      specialization: ['Export Quality', 'Precision Work', 'Modern Designs'],
      location: 'Thrissur Unit',
      phone: '+91 94474 67890',
      status: 'busy'
    },
    {
      id: '3',
      name: 'Anoop Kumar',
      skill: 'Resort Furniture',
      experience: 12,
      efficiency: 88,
      currentWorkload: 60,
      maxCapacity: 100,
      specialization: ['Weather Resistant', 'Outdoor Furniture', 'Quick Turnaround'],
      location: 'Kochi Factory',
      phone: '+91 95394 11111',
      status: 'available'
    },
    {
      id: '4',
      name: 'Rajesh Vishwakarma',
      skill: 'Assembly Specialist',
      experience: 15,
      efficiency: 90,
      currentWorkload: 40,
      maxCapacity: 100,
      specialization: ['Large Orders', 'Quality Assembly', 'Team Leadership'],
      location: 'Kozhikode Workshop',
      phone: '+91 98765 22222',
      status: 'available'
    }
  ]

  const sampleWorkStations: WorkStation[] = [
    {
      id: '1',
      name: 'Traditional Carving Station',
      type: 'Handcraft',
      capacity: 8,
      currentUtilization: 75,
      maintenanceStatus: 'good',
      location: 'Kozhikode Workshop - Hall A',
      supervisor: 'Raman Master'
    },
    {
      id: '2',
      name: 'Modern CNC Unit',
      type: 'Automated',
      capacity: 12,
      currentUtilization: 60,
      maintenanceStatus: 'good',
      location: 'Thrissur Unit - Section B',
      supervisor: 'Technical Team'
    },
    {
      id: '3',
      name: 'Finishing & Polish Bay',
      type: 'Finishing',
      capacity: 6,
      currentUtilization: 90,
      maintenanceStatus: 'needs_service',
      location: 'Kochi Factory - Hall C',
      supervisor: 'Quality Team'
    },
    {
      id: '4',
      name: 'Assembly Line',
      type: 'Assembly',
      capacity: 10,
      currentUtilization: 45,
      maintenanceStatus: 'good',
      location: 'Kozhikode Workshop - Hall B',
      supervisor: 'Rajesh Vishwakarma'
    }
  ]

  useEffect(() => {
    setWorkOrders(sampleWorkOrders)
    setCraftsmen(sampleCraftsmen)
    setWorkStations(sampleWorkStations)
  }, [])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-gray-500/10 text-gray-300 border-gray-500/20',
      'in_progress': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      'quality_check': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      'finishing': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      'completed': 'bg-green-500/10 text-green-600 border-green-500/20',
      'delayed': 'bg-red-500/10 text-red-600 border-red-500/20'
    }
    return colors[status] || colors.pending
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-green-500/10 text-green-600',
      'medium': 'bg-amber-500/10 text-amber-600',
      'high': 'bg-orange-500/10 text-orange-600',
      'urgent': 'bg-red-500/10 text-red-600'
    }
    return colors[priority] || colors.medium
  }

  const getTotalCapacityUtilization = () => {
    const totalCapacity = workStations.reduce((sum, station) => sum + station.capacity, 0)
    const totalUtilized = workStations.reduce((sum, station) => sum + (station.capacity * station.currentUtilization / 100), 0)
    return Math.round((totalUtilized / totalCapacity) * 100)
  }

  const getWeatherIcon = (weather: string) => {
    const icons: Record<string, React.ElementType> = {
      'favorable': Sun,
      'monsoon': CloudRain,
      'cloudy': Cloud
    }
    return icons[weather] || Sun
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
                  <Factory className="h-8 w-8 jewelry-text-gold" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold jewelry-text-luxury">Production Planning</h1>
                  <p className="text-lg text-gray-300">Traditional Kerala Furniture Craftwork Management</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  <TreePine className="h-3 w-3 mr-1" />
                  Traditional Craft
                </Badge>
                <Button className="jewelry-glass-btn gap-2">
                  <Target className="h-4 w-4" />
                  New Work Order
                </Button>
              </div>
            </div>
          </div>

          {/* Production Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Factory className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Capacity Utilization</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{getTotalCapacityUtilization()}%</p>
                </div>
              </div>
              <Progress value={getTotalCapacityUtilization()} className="h-2" />
              <p className="text-xs text-gray-300 mt-2">Optimal range: 75-85%</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Active Orders</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{workOrders.filter(o => o.status !== 'completed').length}</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">3 urgent, 2 high priority</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Available Craftsmen</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{craftsmen.filter(c => c.status === 'available').length}</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Out of {craftsmen.length} total craftsmen</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                  {React.createElement(getWeatherIcon(weatherImpact), { className: "h-5 w-5 text-white" })}
                </div>
                <div>
                  <p className="text-sm text-gray-300">Weather Impact</p>
                  <p className="text-lg font-bold jewelry-text-luxury">Favorable</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Good for outdoor drying</p>
            </div>
          </div>

          <Tabs defaultValue="schedule" className="space-y-4">
            <TabsList className="jewelry-glass-panel">
              <TabsTrigger value="schedule" className="jewelry-glass-btn">Production Schedule</TabsTrigger>
              <TabsTrigger value="craftsmen" className="jewelry-glass-btn">Craftsmen</TabsTrigger>
              <TabsTrigger value="workstations" className="jewelry-glass-btn">Work Stations</TabsTrigger>
              <TabsTrigger value="materials" className="jewelry-glass-btn">Materials</TabsTrigger>
            </TabsList>

            {/* Production Schedule */}
            <TabsContent value="schedule" className="space-y-6">
              <div className="space-y-4">
                {workOrders.map((order) => (
                  <div key={order.id} className="jewelry-glass-card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold jewelry-text-luxury">{order.orderNumber}</h3>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.replace('_', ' ').charAt(0).toUpperCase() + order.status.replace('_', ' ').slice(1)}
                          </Badge>
                          <Badge className={getPriorityColor(order.priority)}>
                            {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                          </Badge>
                          {order.isExport && (
                            <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                              Export
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300 mb-4">
                          <div>
                            <span className="font-medium">Customer:</span> {order.customerName}
                          </div>
                          <div>
                            <span className="font-medium">Product:</span> {order.productName}
                          </div>
                          <div>
                            <span className="font-medium">Quantity:</span> {order.quantity} pieces
                          </div>
                          <div>
                            <span className="font-medium">Wood Type:</span> {order.woodType}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300 mb-4">
                          <div>
                            <span className="font-medium">Craftsman:</span> {order.assignedCraftsman}
                          </div>
                          <div>
                            <span className="font-medium">Skill:</span> {order.craftmanSkill}
                          </div>
                          <div>
                            <span className="font-medium">Due Date:</span> {order.dueDate}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Quality Score:</span>
                            <span className="text-green-500">{order.qualityScore}/100</span>
                            <Star className="h-3 w-3 text-green-500" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">Progress</span>
                            <span className="text-sm font-medium jewelry-text-luxury">{order.progress}%</span>
                          </div>
                          <Progress value={order.progress} className="h-2" />
                          <div className="flex items-center justify-between text-xs text-gray-300">
                            <span>Hours: {order.actualHours}/{order.estimatedHours}</span>
                            <span>Efficiency: {Math.round((order.estimatedHours / order.actualHours) * 100)}%</span>
                          </div>
                        </div>

                        {order.notes.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium jewelry-text-luxury mb-2">Notes:</p>
                            <div className="flex flex-wrap gap-2">
                              {order.notes.map((note, index) => (
                                <Badge key={index} variant="outline" className="text-xs jewelry-badge-text">
                                  {note}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button size="sm" className="jewelry-glass-btn gap-1">
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1">
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        {order.status === 'in_progress' ? (
                          <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1">
                            <Pause className="h-3 w-3" />
                            Pause
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1">
                            <Play className="h-3 w-3" />
                            Start
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Craftsmen Tab */}
            <TabsContent value="craftsmen" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {craftsmen.map((craftsman) => (
                  <div key={craftsman.id} className="jewelry-glass-card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <Hammer className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold jewelry-text-luxury">{craftsman.name}</h3>
                          <p className="text-sm text-gray-300">{craftsman.skill}</p>
                        </div>
                      </div>
                      <Badge className={`${
                        craftsman.status === 'available' ? 'bg-green-500/10 text-green-600' :
                        craftsman.status === 'busy' ? 'bg-amber-500/10 text-amber-600' :
                        'bg-gray-500/10 text-gray-300'
                      }`}>
                        {craftsman.status.replace('_', ' ').charAt(0).toUpperCase() + craftsman.status.replace('_', ' ').slice(1)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-300 mb-4">
                      <div>
                        <span className="font-medium">Experience:</span> {craftsman.experience} years
                      </div>
                      <div>
                        <span className="font-medium">Efficiency:</span> {craftsman.efficiency}%
                      </div>
                      <div>
                        <span className="font-medium">Location:</span> {craftsman.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{craftsman.phone}</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Current Workload</span>
                        <span className="text-sm font-medium jewelry-text-luxury">{craftsman.currentWorkload}%</span>
                      </div>
                      <Progress value={craftsman.currentWorkload} className="h-2" />
                    </div>

                    <div>
                      <p className="text-sm font-medium jewelry-text-luxury mb-2">Specializations:</p>
                      <div className="flex flex-wrap gap-2">
                        {craftsman.specialization.map((spec, index) => (
                          <Badge key={index} variant="outline" className="text-xs jewelry-badge-text">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Work Stations Tab */}
            <TabsContent value="workstations" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {workStations.map((station) => (
                  <div key={station.id} className="jewelry-glass-card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold jewelry-text-luxury">{station.name}</h3>
                          <p className="text-sm text-gray-300">{station.type}</p>
                        </div>
                      </div>
                      <Badge className={`${
                        station.maintenanceStatus === 'good' ? 'bg-green-500/10 text-green-600' :
                        station.maintenanceStatus === 'needs_service' ? 'bg-amber-500/10 text-amber-600' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {station.maintenanceStatus.replace('_', ' ').charAt(0).toUpperCase() + station.maintenanceStatus.replace('_', ' ').slice(1)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-300 mb-4">
                      <div>
                        <span className="font-medium">Capacity:</span> {station.capacity} workers
                      </div>
                      <div>
                        <span className="font-medium">Supervisor:</span> {station.supervisor}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Location:</span> {station.location}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Current Utilization</span>
                        <span className="text-sm font-medium jewelry-text-luxury">{station.currentUtilization}%</span>
                      </div>
                      <Progress value={station.currentUtilization} className="h-2" />
                      <div className="text-xs text-gray-300">
                        {Math.round(station.capacity * station.currentUtilization / 100)} of {station.capacity} positions occupied
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Materials Tab */}
            <TabsContent value="materials" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold jewelry-text-luxury">Kerala Wood Inventory</h3>
                
                {[
                  { type: 'Premium Teak', stock: '2.5 tons', location: 'Thrissur Warehouse', quality: 'Export Grade', price: '₹85,000/ton', daysRemaining: 15 },
                  { type: 'Rosewood', stock: '1.8 tons', location: 'Kozhikode Storage', quality: 'AAA Grade', price: '₹1,20,000/ton', daysRemaining: 12 },
                  { type: 'Jackfruit Wood', stock: '3.2 tons', location: 'Kochi Depot', quality: 'Premium', price: '₹45,000/ton', daysRemaining: 25 },
                  { type: 'Mahogany', stock: '1.2 tons', location: 'Thrissur Warehouse', quality: 'Export Grade', price: '₹95,000/ton', daysRemaining: 8 }
                ].map((material, index) => (
                  <div key={index} className="jewelry-glass-card p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                          <TreePine className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold jewelry-text-luxury">{material.type}</h4>
                          <p className="text-sm text-gray-300">{material.quality} • {material.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold jewelry-text-luxury">{material.stock}</div>
                        <div className="text-sm text-gray-300">{material.price}</div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-300" />
                        <span className="text-sm text-gray-300">{material.daysRemaining} days remaining at current usage</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="jewelry-glass-btn">
                          <Package className="h-3 w-3 mr-1" />
                          Reorder
                        </Button>
                        <Button size="sm" variant="outline" className="jewelry-glass-btn">
                          <Truck className="h-3 w-3 mr-1" />
                          Track
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Seasonal Planning */}
              <div className="jewelry-glass-card p-6">
                <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Seasonal Production Planning</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="flex items-center gap-2 text-blue-600 font-medium mb-2">
                      <CloudRain className="h-4 w-4" />
                      Monsoon Season Impact (June - September)
                    </div>
                    <p className="text-sm text-gray-300">
                      • Outdoor work reduced by 40% • Increased indoor capacity planning • Wood drying time +30%
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="flex items-center gap-2 text-green-600 font-medium mb-2">
                      <Sun className="h-4 w-4" />
                      Peak Season (October - March)
                    </div>
                    <p className="text-sm text-gray-300">
                      • Festival & wedding demand +60% • Export orders peak • Hotel industry busy season
                    </p>
                  </div>

                  <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <div className="flex items-center gap-2 text-amber-600 font-medium mb-2">
                      <TrendingUp className="h-4 w-4" />
                      Traditional Craft Considerations
                    </div>
                    <p className="text-sm text-gray-300">
                      • Master craftsmen capacity • Heritage techniques timeline • Quality vs speed balance
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}