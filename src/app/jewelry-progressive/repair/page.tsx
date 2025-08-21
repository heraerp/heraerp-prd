'use client'

import React, { useState, useEffect } from 'react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { JewelryTeamsSidebar } from '@/components/jewelry-progressive/JewelryTeamsSidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Wrench, Crown, Clock, CheckCircle, 
  AlertTriangle, Users, DollarSign, Camera, 
  Phone, MessageCircle, Calendar, Star,
  Plus, Eye, Edit, TrendingUp, Package,
  Sparkles, Heart, Gift, Award, Gem,
  Bell, Settings, RefreshCw, Search,
  Filter, Download, Upload
} from 'lucide-react'

// HERA Jewelry Repair & Custom Order Management System
// Smart Code: HERA.JWL.REP.DASHBOARD.v1

interface RepairJob {
  id: string
  jobNumber: string
  customerName: string
  itemType: string
  itemDescription: string
  status: 'received' | 'in_progress' | 'quality_check' | 'ready' | 'delivered'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimatedValue: number
  repairType: string[]
  dateReceived: string
  estimatedCompletion: string
  assignedTechnician?: string
  photos: string[]
  smartCode: string
  aiTimeEstimate?: number
  customerNotes?: string
  technicianNotes?: string
}

interface DashboardMetrics {
  totalActiveJobs: number
  overdueJobs: number
  completedThisWeek: number
  avgCompletionTime: number
  totalRevenue: number
  customerSatisfaction: number
  techniciansOnDuty: number
  pendingDeliveries: number
}

export default function JewelryRepairDashboard() {
  const { workspace, isAnonymous } = useMultiOrgAuth()
  const router = useRouter()
  
  const [jobs, setJobs] = useState<RepairJob[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  
  // Load repair jobs from progressive workspace
  useEffect(() => {
    if (workspace) {
      loadRepairData()
    }
  }, [workspace])
  
  const loadRepairData = async () => {
    try {
      setIsLoading(true)
      
      const storedData = localStorage.getItem(`hera_data_${organization?.organization_id}`) || '{}'
      const data = JSON.parse(storedData)
      
      // Load existing repair jobs or create demo data
      if (data.repairJobs && data.repairJobs.length > 0) {
        setJobs(data.repairJobs)
        setMetrics(calculateMetrics(data.repairJobs))
      } else {
        const demoJobs = createDemoRepairJobs()
        setJobs(demoJobs)
        setMetrics(calculateMetrics(demoJobs))
        
        // Save demo data
        data.repairJobs = demoJobs
        localStorage.setItem(`hera_data_${organization?.organization_id}`, JSON.stringify(data))
      }
      
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load repair data:', error)
      const demoJobs = createDemoRepairJobs()
      setJobs(demoJobs)
      setMetrics(calculateMetrics(demoJobs))
      setIsLoading(false)
    }
  }
  
  const createDemoRepairJobs = (): RepairJob[] => {
    return [
      {
        id: 'REP-001',
        jobNumber: 'JR-2024-001',
        customerName: 'Isabella Chen',
        itemType: 'Engagement Ring',
        itemDescription: '2ct Diamond Solitaire - 18K White Gold',
        status: 'in_progress',
        priority: 'high',
        estimatedValue: 12000,
        repairType: ['Prong Tightening', 'Polish & Clean'],
        dateReceived: '2024-01-15',
        estimatedCompletion: '2024-01-20',
        assignedTechnician: 'Master John Chen',
        photos: ['ring-before-1.jpg', 'ring-damage-detail.jpg'],
        smartCode: 'HERA.JWL.REP.TXN.JOB.v1',
        aiTimeEstimate: 3.5,
        customerNotes: 'Wedding anniversary gift - very sentimental value',
        technicianNotes: 'Center prong needs reinforcement'
      },
      {
        id: 'REP-002',
        jobNumber: 'JR-2024-002',
        customerName: 'Marcus Thompson',
        itemType: 'Luxury Watch',
        itemDescription: 'Rolex Submariner - Battery & Service',
        status: 'quality_check',
        priority: 'medium',
        estimatedValue: 8500,
        repairType: ['Battery Replacement', 'Seal Replacement', 'Pressure Test'],
        dateReceived: '2024-01-10',
        estimatedCompletion: '2024-01-18',
        assignedTechnician: 'Watch Specialist Sarah Kim',
        photos: ['watch-back.jpg', 'movement.jpg'],
        smartCode: 'HERA.JWL.REP.TXN.JOB.v1',
        aiTimeEstimate: 2.0,
        customerNotes: 'Needs to be waterproof for diving',
        technicianNotes: 'All seals replaced, pressure tested to 300m'
      },
      {
        id: 'CUS-001',
        jobNumber: 'JC-2024-001',
        customerName: 'Emma Rodriguez',
        itemType: 'Custom Necklace',
        itemDescription: 'Birthstone Family Pendant - 14K Gold',
        status: 'received',
        priority: 'medium',
        estimatedValue: 950,
        repairType: ['Custom Design', 'Stone Setting', 'Chain Assembly'],
        dateReceived: '2024-01-18',
        estimatedCompletion: '2024-02-05',
        assignedTechnician: 'Designer Maria Santos',
        photos: ['sketch-design.jpg'],
        smartCode: 'HERA.JWL.CUS.TXN.ORDER.v1',
        aiTimeEstimate: 12.0,
        customerNotes: '4 birthstones for children, modern design preferred',
        technicianNotes: 'Design approved, stones ordered'
      },
      {
        id: 'REP-003',
        jobNumber: 'JR-2024-003',
        customerName: 'David Kim',
        itemType: 'Tennis Bracelet',
        itemDescription: 'Diamond Tennis Bracelet - Clasp Repair',
        status: 'ready',
        priority: 'low',
        estimatedValue: 3200,
        repairType: ['Clasp Replacement', 'Safety Chain Install'],
        dateReceived: '2024-01-12',
        estimatedCompletion: '2024-01-17',
        assignedTechnician: 'Master John Chen',
        photos: ['bracelet-clasp.jpg', 'finished-repair.jpg'],
        smartCode: 'HERA.JWL.REP.TXN.JOB.v1',
        aiTimeEstimate: 1.5,
        customerNotes: 'Clasp keeps opening unexpectedly',
        technicianNotes: 'Installed heavy-duty clasp with safety chain'
      },
      {
        id: 'REP-004',
        jobNumber: 'JR-2024-004',
        customerName: 'Lisa Chen',
        itemType: 'Pearl Necklace',
        itemDescription: 'Vintage Pearl Strand - Restringing',
        status: 'delivered',
        priority: 'medium',
        estimatedValue: 1800,
        repairType: ['Restring Pearls', 'Clasp Cleaning', 'Quality Inspection'],
        dateReceived: '2024-01-05',
        estimatedCompletion: '2024-01-12',
        assignedTechnician: 'Pearl Specialist Amy Wong',
        photos: ['pearls-before.jpg', 'pearls-after.jpg'],
        smartCode: 'HERA.JWL.REP.TXN.JOB.v1',
        aiTimeEstimate: 2.5,
        customerNotes: 'Grandmother\'s pearls - family heirloom',
        technicianNotes: 'Used silk thread, pearls in excellent condition'
      }
    ]
  }
  
  const calculateMetrics = (jobList: RepairJob[]): DashboardMetrics => {
    const activeJobs = jobList.filter(j => j.status !== 'delivered').length
    const overdueJobs = jobList.filter(j => 
      new Date(j.estimatedCompletion) < new Date() && j.status !== 'delivered'
    ).length
    const completedThisWeek = jobList.filter(j => 
      j.status === 'delivered' && 
      new Date(j.estimatedCompletion) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length
    
    const completedJobs = jobList.filter(j => j.status === 'delivered')
    const avgCompletionTime = completedJobs.length > 0 
      ? completedJobs.reduce((sum, job) => sum + (job.aiTimeEstimate || 3), 0) / completedJobs.length
      : 0
    
    const totalRevenue = jobList.filter(j => j.status === 'delivered')
      .reduce((sum, job) => sum + (job.estimatedValue * 0.15), 0) // 15% service fee
    
    return {
      totalActiveJobs: activeJobs,
      overdueJobs: overdueJobs,
      completedThisWeek: completedThisWeek,
      avgCompletionTime: avgCompletionTime,
      totalRevenue: totalRevenue,
      customerSatisfaction: 4.8,
      techniciansOnDuty: 4,
      pendingDeliveries: jobList.filter(j => j.status === 'ready').length
    }
  }
  
  const getStatusColor = (status: string) => {
    const colors = {
      received: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      quality_check: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }
  
  const getPriorityIcon = (priority: string) => {
    const icons = {
      urgent: <AlertTriangle className="w-4 h-4 text-red-500" />,
      high: <TrendingUp className="w-4 h-4 text-orange-500" />,
      medium: <Clock className="w-4 h-4 text-blue-500" />,
      low: <CheckCircle className="w-4 h-4 text-green-500" />
    }
    return icons[priority as keyof typeof icons] || <Clock className="w-4 h-4 text-gray-500" />
  }
  
  const filteredJobs = selectedStatus === 'all' 
    ? jobs 
    : jobs.filter(job => job.status === selectedStatus)
  
  // Show loading state
  if (!workspace || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl flex items-center justify-center animate-pulse">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading repair dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">HERA Jewelry Repair System</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Teams-Style Sidebar */}
      <JewelryTeamsSidebar />
      
      
      <div className="ml-16">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/jewelry-progressive')}
                  className="p-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Repair & Custom Orders</h1>
                    <p className="text-sm text-gray-500">
                      {isAnonymous ? 'Progressive workspace - HERA Repair Management' : 'Professional Repair Dashboard'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">{organization?.organization_name}</p>
                  <p className="text-xs text-gray-400">
                    Smart Code: HERA.JWL.REP.DASHBOARD.v1
                  </p>
                </div>
                
                <Button
                  onClick={() => router.push('/jewelry-progressive/repair/create')}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Job
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8 max-w-7xl">
          {/* Dashboard Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/90 backdrop-blur border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                <Package className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalActiveJobs}</div>
                <div className="flex items-center text-xs text-gray-600 mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  {metrics?.overdueJobs} overdue
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed This Week</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.completedThisWeek}</div>
                <div className="text-xs text-gray-600 mt-1">
                  Avg {metrics?.avgCompletionTime?.toFixed(1)}h completion time
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${metrics?.totalRevenue?.toLocaleString()}</div>
                <div className="text-xs text-gray-600 mt-1">
                  Service fees earned
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customer Rating</CardTitle>
                <Star className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.customerSatisfaction}/5.0</div>
                <div className="text-xs text-gray-600 mt-1">
                  {metrics?.techniciansOnDuty} technicians on duty
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Filter */}
          <Card className="bg-white/90 backdrop-blur border-0 shadow-md mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="font-semibold text-gray-900">Job Status Filter:</h3>
                  <div className="flex gap-2">
                    {['all', 'received', 'in_progress', 'quality_check', 'ready', 'delivered'].map(status => (
                      <Button
                        key={status}
                        variant={selectedStatus === status ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedStatus(status)}
                        className="capitalize"
                      >
                        {status.replace('_', ' ')}
                        <span className="ml-1 text-xs">
                          ({status === 'all' ? jobs.length : jobs.filter(j => j.status === status).length})
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jobs List */}
          <div className="space-y-4">
            {filteredJobs.map(job => (
              <Card key={job.id} className="bg-white/90 backdrop-blur border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{job.jobNumber}</h3>
                        <Badge className={getStatusColor(job.status)}>
                          {job.status.replace('_', ' ')}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {getPriorityIcon(job.priority)}
                          <span className="text-sm text-gray-600 capitalize">{job.priority}</span>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-amber-500" />
                            <span className="font-medium">{job.customerName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Gem className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-gray-700">{job.itemType}: {job.itemDescription}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-gray-700">Est. Value: ${job.estimatedValue.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-500" />
                            <span className="text-sm text-gray-700">{job.assignedTechnician || 'Unassigned'}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-gray-700">Received: {new Date(job.dateReceived).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-gray-700">Due: {new Date(job.estimatedCompletion).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-pink-500" />
                            <span className="text-sm text-gray-700">AI Est: {job.aiTimeEstimate}h</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Camera className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-gray-700">{job.photos.length} photos</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex flex-wrap gap-1 mb-2">
                          {job.repairType.map((type, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                        {job.customerNotes && (
                          <p className="text-sm text-gray-600 italic">
                            Customer: "{job.customerNotes}"
                          </p>
                        )}
                        {job.technicianNotes && (
                          <p className="text-sm text-blue-600 mt-1">
                            Technician: "{job.technicianNotes}"
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <Phone className="w-4 h-4 mr-1" />
                        Notify
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Progressive CTA */}
          {isAnonymous && (
            <Card className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  HERA Jewelry Repair Management
                </h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  This is a complete repair and custom order management system built on HERA's universal architecture. 
                  Track jobs, manage customers, schedule deliveries, and use AI-powered insights.
                </p>
                <div className="grid md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Job tracking with smart codes</li>
                    <li>• Customer notifications (SMS/WhatsApp)</li>
                    <li>• Photo documentation system</li>
                  </ul>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• AI-powered time prediction</li>
                    <li>• Technician task assignment</li>
                    <li>• Delivery route optimization</li>
                  </ul>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Quality control workflow</li>
                    <li>• Revenue and performance metrics</li>
                    <li>• Customer satisfaction tracking</li>
                  </ul>
                </div>
                
                <Button
                  size="lg"
                  className="mt-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                  onClick={() => {
                    const banner = document.querySelector('[data-save-button]')
                    if (banner) {
                      (banner as HTMLButtonElement).click()
                    }
                  }}
                >
                  <Heart className="h-5 w-5 mr-2" />
                  Save Repair System
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}