'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Wrench,
  Settings,
  Hammer,
  Zap,
  Clock,
  User,
  Calendar,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Pause,
  Play,
  RotateCcw,
  Plus,
  Edit,
  Eye,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  Target,
  Award,
  Star,
  Crown,
  Gem,
  Diamond,
  Sparkles,
  Scale,
  Ruler,
  Palette,
  Scissors,
  Flame,
  CircuitBoard,
  Gauge,
  Timer,
  Users,
  MapPin,
  Package,
  FileText,
  Camera,
  MessageSquare,
  Bell,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  AlertCircle
} from 'lucide-react'
import '@/styles/jewelry-glassmorphism.css'

interface WorkshopJob {
  id: string
  jobNumber: string
  customerName: string
  itemType: string
  description: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'quality_check' | 'completed' | 'on_hold' | 'cancelled'
  assignedTo: string
  startDate: string
  dueDate: string
  estimatedHours: number
  actualHours: number
  materials: string[]
  processes: string[]
  images: string[]
  notes: string
  cost: number
  price: number
  profit: number
  createdAt: string
  updatedAt: string
}

interface Craftsman {
  id: string
  name: string
  email: string
  specialization: string[]
  experienceYears: number
  currentJobs: number
  completedJobs: number
  rating: number
  hourlyRate: number
  availability: 'available' | 'busy' | 'offline'
  skills: {
    name: string
    level: number
  }[]
  workstation: string
  phone: string
  avatar?: string
}

interface WorkshopMetrics {
  totalJobs: number
  activeJobs: number
  completedToday: number
  avgCompletionTime: number
  workshopEfficiency: number
  qualityScore: number
  onTimeDelivery: number
  resourceUtilization: number
  revenue: number
  costs: number
  profit: number
  profitMargin: number
}

interface Process {
  id: string
  name: string
  description: string
  estimatedTime: number
  requiredSkills: string[]
  tools: string[]
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold'
  assignedTo?: string
  startTime?: string
  endTime?: string
  notes?: string
}

export default function JewelryWorkshopPage() {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [selectedCraftsman, setSelectedCraftsman] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'calendar'>('kanban')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Mock workshop data
  const workshopMetrics: WorkshopMetrics = {
    totalJobs: 127,
    activeJobs: 34,
    completedToday: 8,
    avgCompletionTime: 4.2,
    workshopEfficiency: 87.5,
    qualityScore: 94.8,
    onTimeDelivery: 91.2,
    resourceUtilization: 78.3,
    revenue: 485000,
    costs: 280000,
    profit: 205000,
    profitMargin: 42.3
  }

  const workshopJobs: WorkshopJob[] = [
    {
      id: '1',
      jobNumber: 'WS-2024-001',
      customerName: 'Sarah Johnson',
      itemType: 'Engagement Ring',
      description: 'Custom 18K white gold solitaire ring with 1.5ct diamond, size 6.5',
      priority: 'high',
      status: 'in_progress',
      assignedTo: 'Ahmed Rahman',
      startDate: '2024-01-15',
      dueDate: '2024-01-22',
      estimatedHours: 12,
      actualHours: 8.5,
      materials: ['18K White Gold', 'Diamond 1.5ct', 'Rhodium Plating'],
      processes: ['CAD Design', 'Casting', 'Setting', 'Polishing'],
      images: [],
      notes: 'Customer requested thinner band profile',
      cost: 8500,
      price: 15000,
      profit: 6500,
      createdAt: '2024-01-10',
      updatedAt: '2024-01-16'
    },
    {
      id: '2',
      jobNumber: 'WS-2024-002',
      customerName: 'Maria Rodriguez',
      itemType: 'Necklace Repair',
      description: 'Repair broken chain link and clean pearl necklace',
      priority: 'normal',
      status: 'quality_check',
      assignedTo: 'Priya Patel',
      startDate: '2024-01-14',
      dueDate: '2024-01-18',
      estimatedHours: 3,
      actualHours: 2.5,
      materials: ['Silver Wire', 'Cleaning Solution'],
      processes: ['Inspection', 'Repair', 'Cleaning', 'Quality Check'],
      images: [],
      notes: 'Original clasp mechanism preserved',
      cost: 150,
      price: 450,
      profit: 300,
      createdAt: '2024-01-12',
      updatedAt: '2024-01-16'
    },
    {
      id: '3',
      jobNumber: 'WS-2024-003',
      customerName: 'Ahmed Al-Rashid',
      itemType: 'Watch Customization',
      description: 'Diamond bezel setting for luxury watch',
      priority: 'urgent',
      status: 'pending',
      assignedTo: 'Raj Gupta',
      startDate: '2024-01-17',
      dueDate: '2024-01-19',
      estimatedHours: 8,
      actualHours: 0,
      materials: ['Diamonds 2.5ct total', 'Platinum Setting'],
      processes: ['Design Review', 'Precision Setting', 'Quality Control'],
      images: [],
      notes: 'Rush order - client traveling next week',
      cost: 12000,
      price: 22000,
      profit: 10000,
      createdAt: '2024-01-15',
      updatedAt: '2024-01-16'
    },
    {
      id: '4',
      jobNumber: 'WS-2024-004',
      customerName: 'Jennifer Chen',
      itemType: 'Earrings',
      description: 'Matching sapphire drop earrings in 14K yellow gold',
      priority: 'normal',
      status: 'completed',
      assignedTo: 'Fatima Hassan',
      startDate: '2024-01-10',
      dueDate: '2024-01-16',
      estimatedHours: 6,
      actualHours: 5.5,
      materials: ['14K Yellow Gold', 'Sapphires 1ct each', 'Earring Posts'],
      processes: ['Design', 'Casting', 'Stone Setting', 'Finishing'],
      images: [],
      notes: 'Client very satisfied with results',
      cost: 2800,
      price: 5500,
      profit: 2700,
      createdAt: '2024-01-08',
      updatedAt: '2024-01-16'
    }
  ]

  const craftsmen: Craftsman[] = [
    {
      id: '1',
      name: 'Ahmed Rahman',
      email: 'ahmed.rahman@workshop.com',
      specialization: ['Ring Making', 'Diamond Setting', 'Custom Design'],
      experienceYears: 15,
      currentJobs: 3,
      completedJobs: 234,
      rating: 4.9,
      hourlyRate: 85,
      availability: 'busy',
      skills: [
        { name: 'CAD Design', level: 95 },
        { name: 'Diamond Setting', level: 98 },
        { name: 'Metal Working', level: 92 },
        { name: 'Quality Control', level: 89 }
      ],
      workstation: 'Station A-1',
      phone: '+971 50 123 4567'
    },
    {
      id: '2',
      name: 'Priya Patel',
      email: 'priya.patel@workshop.com',
      specialization: ['Repair', 'Restoration', 'Cleaning'],
      experienceYears: 8,
      currentJobs: 2,
      completedJobs: 156,
      rating: 4.7,
      hourlyRate: 65,
      availability: 'available',
      skills: [
        { name: 'Repair Techniques', level: 96 },
        { name: 'Antique Restoration', level: 88 },
        { name: 'Precision Work', level: 91 },
        { name: 'Stone Replacement', level: 85 }
      ],
      workstation: 'Station B-2',
      phone: '+971 50 234 5678'
    },
    {
      id: '3',
      name: 'Raj Gupta',
      email: 'raj.gupta@workshop.com',
      specialization: ['Watch Repair', 'Precision Setting', 'Micro Work'],
      experienceYears: 12,
      currentJobs: 1,
      completedJobs: 189,
      rating: 4.8,
      hourlyRate: 75,
      availability: 'available',
      skills: [
        { name: 'Watch Mechanisms', level: 94 },
        { name: 'Precision Setting', level: 97 },
        { name: 'Micro Engraving', level: 86 },
        { name: 'Quality Testing', level: 90 }
      ],
      workstation: 'Station C-1',
      phone: '+971 50 345 6789'
    },
    {
      id: '4',
      name: 'Fatima Hassan',
      email: 'fatima.hassan@workshop.com',
      specialization: ['Earrings', 'Necklaces', 'Finishing'],
      experienceYears: 10,
      currentJobs: 2,
      completedJobs: 198,
      rating: 4.6,
      hourlyRate: 70,
      availability: 'busy',
      skills: [
        { name: 'Chain Making', level: 93 },
        { name: 'Stone Setting', level: 87 },
        { name: 'Polishing', level: 95 },
        { name: 'Design', level: 84 }
      ],
      workstation: 'Station A-3',
      phone: '+971 50 456 7890'
    }
  ]

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'jobs', label: 'Jobs', icon: Wrench },
    { id: 'craftsmen', label: 'Craftsmen', icon: Users },
    { id: 'processes', label: 'Processes', icon: Settings },
    { id: 'quality', label: 'Quality', icon: Award }
  ]

  const statusOptions = ['all', 'pending', 'in_progress', 'quality_check', 'completed', 'on_hold', 'cancelled']
  const priorityOptions = ['all', 'low', 'normal', 'high', 'urgent']

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="jewelry-icon-warning" size={16} />
      case 'in_progress': return <Play className="jewelry-icon-info" size={16} />
      case 'quality_check': return <Eye className="jewelry-icon-warning" size={16} />
      case 'completed': return <CheckCircle className="jewelry-icon-success" size={16} />
      case 'on_hold': return <Pause className="jewelry-icon-error" size={16} />
      case 'cancelled': return <XCircle className="jewelry-icon-error" size={16} />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'jewelry-status-pending'
      case 'in_progress': return 'jewelry-status-active'
      case 'quality_check': return 'jewelry-status-pending'
      case 'completed': return 'jewelry-status-active'
      case 'on_hold': return 'jewelry-status-inactive'
      case 'cancelled': return 'jewelry-status-inactive'
      default: return 'jewelry-status-inactive'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'low': return <ArrowDownRight className="text-blue-500" size={16} />
      case 'normal': return <Activity className="text-gray-500" size={16} />
      case 'high': return <ArrowUpRight className="text-orange-500" size={16} />
      case 'urgent': return <AlertTriangle className="text-red-500" size={16} />
      default: return null
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'normal': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAvailabilityIcon = (availability: string) => {
    switch (availability) {
      case 'available': return <CheckCircle className="jewelry-icon-success" size={16} />
      case 'busy': return <Clock className="jewelry-icon-warning" size={16} />
      case 'offline': return <XCircle className="jewelry-icon-error" size={16} />
      default: return null
    }
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'jewelry-status-active'
      case 'busy': return 'jewelry-status-pending'
      case 'offline': return 'jewelry-status-inactive'
      default: return 'jewelry-status-inactive'
    }
  }

  const filteredJobs = workshopJobs.filter(job => {
    const matchesSearch = job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.itemType.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || job.status === selectedStatus
    const matchesPriority = selectedPriority === 'all' || job.priority === selectedPriority
    const matchesCraftsman = selectedCraftsman === 'all' || job.assignedTo === selectedCraftsman

    return matchesSearch && matchesStatus && matchesPriority && matchesCraftsman
  })

  return (
    <div className="min-h-screen jewelry-gradient-premium">
      <div className="jewelry-glass-backdrop min-h-screen">
        <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
          
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="jewelry-heading text-4xl md:text-5xl mb-4">
              <Wrench className="inline-block mr-3 mb-2 jewelry-icon-gold" size={48} />
              Workshop Management
            </h1>
            <p className="jewelry-text-luxury text-lg md:text-xl">
              Comprehensive workshop operations and production management
            </p>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="jewelry-glass-panel"
          >
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      selectedTab === tab.id
                        ? 'jewelry-btn-primary'
                        : 'jewelry-btn-secondary'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <button className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2">
                  <RefreshCw className="jewelry-icon-gold" size={18} />
                  <span>Refresh</span>
                </button>
                <button className="jewelry-btn-primary flex items-center space-x-2 px-4 py-2">
                  <Plus className="jewelry-icon-gold" size={18} />
                  <span>New Job</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Overview Tab */}
          {selectedTab === 'overview' && (
            <>
              {/* Key Metrics */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                <div className="jewelry-glass-card jewelry-float p-6 text-center">
                  <Wrench className="mx-auto mb-3 jewelry-icon-gold" size={32} />
                  <h3 className="jewelry-text-high-contrast text-3xl font-bold">{workshopMetrics.activeJobs}</h3>
                  <p className="jewelry-text-muted text-sm font-medium">Active Jobs</p>
                  <div className="flex items-center justify-center mt-2 text-blue-500">
                    <Activity size={16} />
                    <span className="text-xs ml-1">{workshopMetrics.totalJobs} total</span>
                  </div>
                </div>
                
                <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.1s' }}>
                  <CheckCircle className="mx-auto mb-3 jewelry-icon-gold" size={32} />
                  <h3 className="jewelry-text-high-contrast text-3xl font-bold">{workshopMetrics.completedToday}</h3>
                  <p className="jewelry-text-muted text-sm font-medium">Completed Today</p>
                  <div className="flex items-center justify-center mt-2 text-green-500">
                    <ArrowUpRight size={16} />
                    <span className="text-xs ml-1">+12% vs yesterday</span>
                  </div>
                </div>
                
                <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.2s' }}>
                  <Timer className="mx-auto mb-3 jewelry-icon-gold" size={32} />
                  <h3 className="jewelry-text-high-contrast text-3xl font-bold">{workshopMetrics.avgCompletionTime}h</h3>
                  <p className="jewelry-text-muted text-sm font-medium">Avg Completion</p>
                  <div className="flex items-center justify-center mt-2 text-green-500">
                    <ArrowDownRight size={16} />
                    <span className="text-xs ml-1">-8% improvement</span>
                  </div>
                </div>
                
                <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.3s' }}>
                  <Award className="mx-auto mb-3 jewelry-icon-gold" size={32} />
                  <h3 className="jewelry-text-high-contrast text-3xl font-bold">{workshopMetrics.qualityScore}%</h3>
                  <p className="jewelry-text-muted text-sm font-medium">Quality Score</p>
                  <div className="flex items-center justify-center mt-2 text-green-500">
                    <Star size={16} />
                    <span className="text-xs ml-1">Excellent</span>
                  </div>
                </div>
              </motion.div>

              {/* Performance Metrics */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                <div className="jewelry-glass-card p-6 text-center">
                  <Gauge className="mx-auto mb-3 jewelry-icon-gold" size={24} />
                  <h4 className="jewelry-text-high-contrast text-xl font-bold">{workshopMetrics.workshopEfficiency}%</h4>
                  <p className="jewelry-text-muted text-sm">Workshop Efficiency</p>
                </div>
                
                <div className="jewelry-glass-card p-6 text-center">
                  <Target className="mx-auto mb-3 jewelry-icon-gold" size={24} />
                  <h4 className="jewelry-text-high-contrast text-xl font-bold">{workshopMetrics.onTimeDelivery}%</h4>
                  <p className="jewelry-text-muted text-sm">On-Time Delivery</p>
                </div>
                
                <div className="jewelry-glass-card p-6 text-center">
                  <Activity className="mx-auto mb-3 jewelry-icon-gold" size={24} />
                  <h4 className="jewelry-text-high-contrast text-xl font-bold">{workshopMetrics.resourceUtilization}%</h4>
                  <p className="jewelry-text-muted text-sm">Resource Utilization</p>
                </div>
                
                <div className="jewelry-glass-card p-6 text-center">
                  <TrendingUp className="mx-auto mb-3 jewelry-icon-gold" size={24} />
                  <h4 className="jewelry-text-high-contrast text-xl font-bold">{workshopMetrics.profitMargin}%</h4>
                  <p className="jewelry-text-muted text-sm">Profit Margin</p>
                </div>
              </motion.div>
            </>
          )}

          {/* Jobs Tab */}
          {selectedTab === 'jobs' && (
            <>
              {/* Filters */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="jewelry-glass-panel"
              >
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 jewelry-icon-gold" size={20} />
                      <input
                        type="text"
                        placeholder="Search jobs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="jewelry-input pl-10 w-64"
                      />
                    </div>
                    
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="jewelry-input"
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>
                          {status === 'all' ? 'All Status' : status.replace('_', ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                    
                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      className="jewelry-input"
                    >
                      {priorityOptions.map(priority => (
                        <option key={priority} value={priority}>
                          {priority === 'all' ? 'All Priority' : priority.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewMode('kanban')}
                        className={`p-2 rounded ${viewMode === 'kanban' ? 'jewelry-btn-primary' : 'jewelry-btn-secondary'}`}
                      >
                        <BarChart3 size={16} />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded ${viewMode === 'list' ? 'jewelry-btn-primary' : 'jewelry-btn-secondary'}`}
                      >
                        <Activity size={16} />
                      </button>
                    </div>
                    
                    <button className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2">
                      <Download className="jewelry-icon-gold" size={18} />
                      <span>Export</span>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Jobs Grid */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="jewelry-glass-panel"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredJobs.map((job, index) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="jewelry-glass-card jewelry-scale-hover p-6"
                    >
                      {/* Job Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="jewelry-text-high-contrast font-semibold text-lg mb-1">{job.jobNumber}</h3>
                          <p className="jewelry-text-muted text-sm">{job.customerName}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(job.status)}
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                            {job.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Priority & Type */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          {getPriorityIcon(job.priority)}
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(job.priority)}`}>
                            {job.priority.toUpperCase()}
                          </span>
                        </div>
                        <span className="jewelry-text-muted text-sm font-medium">{job.itemType}</span>
                      </div>

                      {/* Description */}
                      <p className="jewelry-text-high-contrast text-sm mb-4 line-clamp-2">{job.description}</p>

                      {/* Details */}
                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between">
                          <span className="jewelry-text-muted">Assigned to:</span>
                          <span className="jewelry-text-high-contrast font-medium">{job.assignedTo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="jewelry-text-muted">Due date:</span>
                          <span className="jewelry-text-high-contrast">{job.dueDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="jewelry-text-muted">Progress:</span>
                          <span className="jewelry-text-high-contrast">{job.actualHours}h / {job.estimatedHours}h</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-jewelry-gold-400 to-jewelry-gold-600 transition-all duration-300"
                            style={{ width: `${Math.min((job.actualHours / job.estimatedHours) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Financial Info */}
                      <div className="flex justify-between items-center pt-4 border-t border-jewelry-blue-200">
                        <div className="text-sm">
                          <span className="jewelry-text-muted">Profit: </span>
                          <span className="jewelry-text-high-contrast font-bold">¹{job.profit.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 rounded jewelry-btn-secondary hover:scale-105 transition-transform">
                            <Eye className="jewelry-icon-gold" size={16} />
                          </button>
                          <button className="p-2 rounded jewelry-btn-secondary hover:scale-105 transition-transform">
                            <Edit className="jewelry-icon-gold" size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </>
          )}

          {/* Craftsmen Tab */}
          {selectedTab === 'craftsmen' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="jewelry-glass-panel"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                  <Users className="jewelry-icon-gold" size={24} />
                  Workshop Craftsmen
                </h3>
                <button className="jewelry-btn-primary flex items-center space-x-2 px-4 py-2">
                  <Plus className="jewelry-icon-gold" size={18} />
                  <span>Add Craftsman</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {craftsmen.map((craftsman, index) => (
                  <motion.div
                    key={craftsman.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="jewelry-glass-card jewelry-scale-hover p-6"
                  >
                    {/* Craftsman Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-jewelry-gold-400 to-jewelry-gold-600 flex items-center justify-center">
                          <User className="text-white" size={24} />
                        </div>
                        <div>
                          <h4 className="jewelry-text-high-contrast font-semibold">{craftsman.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            {getAvailabilityIcon(craftsman.availability)}
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getAvailabilityColor(craftsman.availability)}`}>
                              {craftsman.availability.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="jewelry-icon-gold" size={16} />
                          <span className="jewelry-text-high-contrast font-bold">{craftsman.rating}</span>
                        </div>
                        <p className="jewelry-text-muted text-sm">{craftsman.experienceYears} years</p>
                      </div>
                    </div>

                    {/* Specializations */}
                    <div className="mb-4">
                      <p className="jewelry-text-muted text-sm mb-2">Specializations:</p>
                      <div className="flex flex-wrap gap-2">
                        {craftsman.specialization.map((spec, i) => (
                          <span key={i} className="px-2 py-1 bg-jewelry-blue-100 dark:bg-jewelry-blue-800 text-jewelry-blue-800 dark:text-jewelry-blue-200 rounded text-xs">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="mb-4">
                      <p className="jewelry-text-muted text-sm mb-2">Skills:</p>
                      <div className="space-y-2">
                        {craftsman.skills.slice(0, 3).map((skill, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <span className="jewelry-text-high-contrast text-sm">{skill.name}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="h-1.5 rounded-full bg-gradient-to-r from-jewelry-gold-400 to-jewelry-gold-600"
                                  style={{ width: `${skill.level}%` }}
                                ></div>
                              </div>
                              <span className="jewelry-text-muted text-xs w-8">{skill.level}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex justify-between items-center pt-4 border-t border-jewelry-blue-200">
                      <div className="text-sm">
                        <p className="jewelry-text-muted">Current: <span className="jewelry-text-high-contrast font-medium">{craftsman.currentJobs} jobs</span></p>
                        <p className="jewelry-text-muted">Rate: <span className="jewelry-text-high-contrast font-medium">¹{craftsman.hourlyRate}/hr</span></p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 rounded jewelry-btn-secondary hover:scale-105 transition-transform">
                          <Eye className="jewelry-icon-gold" size={16} />
                        </button>
                        <button className="p-2 rounded jewelry-btn-secondary hover:scale-105 transition-transform">
                          <MessageSquare className="jewelry-icon-gold" size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="text-center mt-12 mb-6"
          >
            <p className="jewelry-text-muted text-sm">
              Workshop management powered by <span className="jewelry-text-luxury font-semibold">HERA Production System</span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}