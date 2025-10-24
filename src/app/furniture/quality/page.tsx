'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Camera,
  Ruler,
  Scale,
  Clock,
  FileText,
  Award,
  Target,
  TrendingUp,
  BarChart3,
  Zap,
  Settings,
  Search,
  Filter,
  Download,
  Upload,
  Share2,
  Edit,
  Save,
  X,
  Plus,
  Minus,
  RefreshCw,
  Calendar,
  MapPin,
  User,
  Package,
  TreePine,
  Hammer,
  Building2,
  Globe,
  Star,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Info,
  HelpCircle,
  ExternalLink,
  Microscope,
  Scan,
  Clipboard,
  CheckSquare,
  Square,
  Activity,
  PieChart,
  LineChart,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Percent,
  Hash
} from 'lucide-react'

interface QualityCheck {
  id: string
  productId: string
  productName: string
  checklistType: string
  inspector: string
  date: string
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'needs_rework'
  score: number
  checkedItems: number
  totalItems: number
  defects: QualityDefect[]
  stage: 'raw_material' | 'cutting' | 'assembly' | 'finishing' | 'final_inspection' | 'packaging'
  craftsman: string
  notes: string
}

interface QualityDefect {
  id: string
  category: string
  severity: 'minor' | 'major' | 'critical'
  description: string
  location: string
  image?: string
  action: string
  status: 'open' | 'fixed' | 'accepted'
}

interface QualityStandard {
  id: string
  name: string
  category: string
  description: string
  tolerance: string
  measurement: string
  passCriteria: string
  testMethod: string
}

interface QualityMetrics {
  passRate: number
  defectRate: number
  reworkRate: number
  customerReturns: number
  averageScore: number
  timeToCompletion: number
}

export default function QualityControl() {
  const [activeTab, setActiveTab] = useState('inspections')
  const [selectedCheck, setSelectedCheck] = useState<QualityCheck | null>(null)
  const [isInspecting, setIsInspecting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStage, setFilterStage] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Sample quality check data
  const qualityChecks: QualityCheck[] = [
    {
      id: 'QC-2024-001',
      productId: 'PRD-001',
      productName: 'Executive Dining Table Set',
      checklistType: 'Final Inspection',
      inspector: 'Priya Menon',
      date: '2024-01-15',
      status: 'passed',
      score: 95,
      checkedItems: 38,
      totalItems: 40,
      defects: [
        {
          id: 'D001',
          category: 'Surface Finish',
          severity: 'minor',
          description: 'Small scratch on table edge',
          location: 'Table edge - front right',
          action: 'Polish and buff',
          status: 'fixed'
        }
      ],
      stage: 'final_inspection',
      craftsman: 'Raman Master',
      notes: 'Overall excellent quality. Minor finish touch-up completed.'
    },
    {
      id: 'QC-2024-002',
      productId: 'PRD-002',
      productName: 'Traditional Kerala Chair',
      checklistType: 'Assembly Check',
      inspector: 'Suresh Kumar',
      date: '2024-01-14',
      status: 'needs_rework',
      score: 72,
      checkedItems: 29,
      totalItems: 35,
      defects: [
        {
          id: 'D002',
          category: 'Joint Quality',
          severity: 'major',
          description: 'Loose mortise and tenon joint',
          location: 'Back leg - left side',
          action: 'Re-glue and clamp for 24 hours',
          status: 'open'
        },
        {
          id: 'D003',
          category: 'Alignment',
          severity: 'minor',
          description: 'Slight wobble when weight applied',
          location: 'Overall stability',
          action: 'Adjust leg height',
          status: 'open'
        }
      ],
      stage: 'assembly',
      craftsman: 'Anitha Nair',
      notes: 'Joint needs reinforcement. Otherwise craftsmanship is good.'
    },
    {
      id: 'QC-2024-003',
      productId: 'PRD-003',
      productName: 'Hotel Wardrobe System',
      checklistType: 'Material Check',
      inspector: 'Radhika Nair',
      date: '2024-01-13',
      status: 'in_progress',
      score: 0,
      checkedItems: 12,
      totalItems: 25,
      defects: [],
      stage: 'raw_material',
      craftsman: 'Pradeep Chandran',
      notes: 'Material inspection in progress. Checking wood moisture content.'
    }
  ]

  // Quality standards for Kerala furniture
  const qualityStandards: QualityStandard[] = [
    {
      id: 'STD-001',
      name: 'Wood Moisture Content',
      category: 'Raw Material',
      description: 'Moisture content in hardwood',
      tolerance: '8-12%',
      measurement: 'Moisture meter reading',
      passCriteria: 'Within tolerance range',
      testMethod: 'Electronic moisture meter at multiple points'
    },
    {
      id: 'STD-002',
      name: 'Joint Strength',
      category: 'Assembly',
      description: 'Mortise and tenon joint integrity',
      tolerance: 'No movement under 50kg load',
      measurement: 'Load test',
      passCriteria: 'Zero movement, no cracking sounds',
      testMethod: 'Graduated load application'
    },
    {
      id: 'STD-003',
      name: 'Surface Finish',
      category: 'Finishing',
      description: 'Smoothness and polish quality',
      tolerance: '220 grit smoothness',
      measurement: 'Visual and tactile inspection',
      passCriteria: 'No visible tool marks, smooth to touch',
      testMethod: 'Grid inspection under 60W light'
    },
    {
      id: 'STD-004',
      name: 'Dimensional Accuracy',
      category: 'Cutting',
      description: 'Precision of cuts and dimensions',
      tolerance: '±2mm',
      measurement: 'Digital calipers',
      passCriteria: 'All dimensions within tolerance',
      testMethod: 'Multi-point measurement verification'
    }
  ]

  // Sample metrics
  const qualityMetrics: QualityMetrics = {
    passRate: 92.5,
    defectRate: 3.2,
    reworkRate: 4.8,
    customerReturns: 0.8,
    averageScore: 88.7,
    timeToCompletion: 2.3
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-gray-500/10 text-gray-300 border-gray-500/20',
      'in_progress': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      'passed': 'bg-green-500/10 text-green-600 border-green-500/20',
      'failed': 'bg-red-500/10 text-red-600 border-red-500/20',
      'needs_rework': 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    }
    return colors[status] || colors.pending
  }

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      'minor': 'text-yellow-500',
      'major': 'text-orange-500',
      'critical': 'text-red-500'
    }
    return colors[severity] || colors.minor
  }

  const getStageIcon = (stage: string) => {
    const icons: Record<string, React.ElementType> = {
      'raw_material': TreePine,
      'cutting': Ruler,
      'assembly': Hammer,
      'finishing': Eye,
      'final_inspection': Shield,
      'packaging': Package
    }
    return icons[stage] || Package
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 80) return 'text-blue-500'
    if (score >= 70) return 'text-amber-500'
    return 'text-red-500'
  }

  const filteredChecks = qualityChecks.filter(check => {
    const matchesSearch = check.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         check.inspector.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         check.craftsman.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStage = filterStage === 'all' || check.stage === filterStage
    const matchesStatus = filterStatus === 'all' || check.status === filterStatus
    
    return matchesSearch && matchesStage && matchesStatus
  })

  const startInspection = (check: QualityCheck) => {
    setSelectedCheck(check)
    setIsInspecting(true)
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
                  <Shield className="h-8 w-8 jewelry-text-gold" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold jewelry-text-luxury">Quality Control</h1>
                  <p className="text-lg text-gray-300">Kerala Furniture Quality Assurance & Standards</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {qualityMetrics.passRate}% Pass Rate
                </Badge>
                <Button className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold">
                  <Plus className="h-4 w-4" />
                  New Inspection
                </Button>
              </div>
            </div>
          </div>

          {/* Quality Metrics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="jewelry-glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Pass Rate</p>
                  <p className="text-2xl font-bold text-green-500">{qualityMetrics.passRate}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-2">
                <Progress value={qualityMetrics.passRate} className="h-2" />
              </div>
            </div>

            <div className="jewelry-glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Defect Rate</p>
                  <p className="text-2xl font-bold text-red-500">{qualityMetrics.defectRate}%</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <div className="mt-2">
                <Progress value={qualityMetrics.defectRate} className="h-2" />
              </div>
            </div>

            <div className="jewelry-glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Avg Score</p>
                  <p className="text-2xl font-bold jewelry-text-gold">{qualityMetrics.averageScore}</p>
                </div>
                <Target className="h-8 w-8 jewelry-text-gold" />
              </div>
              <div className="mt-2">
                <Progress value={qualityMetrics.averageScore} className="h-2" />
              </div>
            </div>

            <div className="jewelry-glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Customer Returns</p>
                  <p className="text-2xl font-bold text-blue-500">{qualityMetrics.customerReturns}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-2">
                <Progress value={100 - qualityMetrics.customerReturns * 10} className="h-2" />
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="jewelry-glass-panel">
              <TabsTrigger value="inspections" className="jewelry-glass-btn jewelry-text-luxury">
                Active Inspections
              </TabsTrigger>
              <TabsTrigger value="standards" className="jewelry-glass-btn jewelry-text-luxury">
                Quality Standards
              </TabsTrigger>
              <TabsTrigger value="defects" className="jewelry-glass-btn jewelry-text-luxury">
                Defect Tracking
              </TabsTrigger>
              <TabsTrigger value="reports" className="jewelry-glass-btn jewelry-text-luxury">
                Reports & Analytics
              </TabsTrigger>
            </TabsList>

            {/* Active Inspections */}
            <TabsContent value="inspections" className="space-y-6">
              {/* Search and Filters */}
              <div className="jewelry-glass-card p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by product, inspector, or craftsman..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 jewelry-glass-input"
                    />
                  </div>
                  <select
                    value={filterStage}
                    onChange={(e) => setFilterStage(e.target.value)}
                    className="px-3 py-2 jewelry-glass-input w-40"
                  >
                    <option value="all">All Stages</option>
                    <option value="raw_material">Raw Material</option>
                    <option value="cutting">Cutting</option>
                    <option value="assembly">Assembly</option>
                    <option value="finishing">Finishing</option>
                    <option value="final_inspection">Final Inspection</option>
                    <option value="packaging">Packaging</option>
                  </select>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 jewelry-glass-input w-40"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                    <option value="needs_rework">Needs Rework</option>
                  </select>
                </div>
              </div>

              {/* Inspection List */}
              <div className="space-y-4">
                {filteredChecks.map((check) => {
                  const StageIcon = getStageIcon(check.stage)
                  return (
                    <div key={check.id} className="jewelry-glass-card p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <StageIcon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold jewelry-text-luxury">{check.productName}</h3>
                              <Badge className={getStatusColor(check.status)}>
                                {check.status.replace('_', ' ')}
                              </Badge>
                              {check.score > 0 && (
                                <Badge variant="outline" className="jewelry-badge-text">
                                  Score: {check.score}%
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300">
                              <div>
                                <span className="jewelry-text-luxury">Inspection ID:</span> {check.id}
                              </div>
                              <div>
                                <span className="jewelry-text-luxury">Inspector:</span> {check.inspector}
                              </div>
                              <div>
                                <span className="jewelry-text-luxury">Craftsman:</span> {check.craftsman}
                              </div>
                              <div>
                                <span className="jewelry-text-luxury">Date:</span> {check.date}
                              </div>
                            </div>
                            {check.checkedItems > 0 && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span className="jewelry-text-luxury">Progress: {check.checkedItems}/{check.totalItems} items</span>
                                  <span className="text-gray-300">{Math.round((check.checkedItems / check.totalItems) * 100)}%</span>
                                </div>
                                <Progress value={(check.checkedItems / check.totalItems) * 100} className="h-2" />
                              </div>
                            )}
                            {check.defects.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm jewelry-text-luxury mb-1">Defects Found:</p>
                                <div className="flex flex-wrap gap-2">
                                  {check.defects.map((defect) => (
                                    <Badge
                                      key={defect.id}
                                      variant="outline"
                                      className={`text-xs ${getSeverityColor(defect.severity)}`}
                                    >
                                      {defect.category} ({defect.severity})
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold"
                            onClick={() => startInspection(check)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            {check.status === 'in_progress' ? 'Continue' : 'View'}
                          </Button>
                          <Button size="sm" variant="outline" className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>

            {/* Quality Standards */}
            <TabsContent value="standards" className="space-y-6">
              <div className="jewelry-glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold jewelry-text-luxury">Quality Standards & Specifications</h2>
                  <Button className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold">
                    <Plus className="h-4 w-4" />
                    Add Standard
                  </Button>
                </div>

                <div className="space-y-4">
                  {qualityStandards.map((standard) => (
                    <div key={standard.id} className="jewelry-glass-card p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold jewelry-text-luxury">{standard.name}</h3>
                            <Badge variant="outline" className="jewelry-badge-text">
                              {standard.category}
                            </Badge>
                          </div>
                          <p className="text-gray-300 mb-4">{standard.description}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white/5 p-3 rounded-lg">
                              <p className="text-sm font-medium jewelry-text-luxury">Tolerance</p>
                              <p className="text-sm text-gray-300">{standard.tolerance}</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-lg">
                              <p className="text-sm font-medium jewelry-text-luxury">Measurement</p>
                              <p className="text-sm text-gray-300">{standard.measurement}</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-lg">
                              <p className="text-sm font-medium jewelry-text-luxury">Pass Criteria</p>
                              <p className="text-sm text-gray-300">{standard.passCriteria}</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-lg">
                              <p className="text-sm font-medium jewelry-text-luxury">Test Method</p>
                              <p className="text-sm text-gray-300">{standard.testMethod}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Defect Tracking */}
            <TabsContent value="defects" className="space-y-6">
              <div className="jewelry-glass-card p-6">
                <h2 className="text-xl font-semibold jewelry-text-luxury mb-6">Defect Analysis & Tracking</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Defect Categories */}
                  <div>
                    <h3 className="text-lg font-medium jewelry-text-luxury mb-4">Common Defect Categories</h3>
                    <div className="space-y-3">
                      {[
                        { name: 'Surface Finish', count: 12, trend: 'down' },
                        { name: 'Joint Quality', count: 8, trend: 'up' },
                        { name: 'Dimensional Accuracy', count: 5, trend: 'stable' },
                        { name: 'Material Defects', count: 3, trend: 'down' },
                        { name: 'Assembly Issues', count: 7, trend: 'up' }
                      ].map((category, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="h-4 w-4 jewelry-text-gold" />
                            <span className="jewelry-text-luxury">{category.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="jewelry-badge-text">
                              {category.count}
                            </Badge>
                            {category.trend === 'up' && <ArrowUp className="h-3 w-3 text-red-500" />}
                            {category.trend === 'down' && <ArrowDown className="h-3 w-3 text-green-500" />}
                            {category.trend === 'stable' && <Minus className="h-3 w-3 text-gray-400" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Severity Distribution */}
                  <div>
                    <h3 className="text-lg font-medium jewelry-text-luxury mb-4">Defect Severity Distribution</h3>
                    <div className="space-y-4">
                      <div className="bg-white/5 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-yellow-500">Minor Defects</span>
                          <span className="jewelry-text-luxury">65%</span>
                        </div>
                        <Progress value={65} className="h-2" />
                      </div>
                      <div className="bg-white/5 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-orange-500">Major Defects</span>
                          <span className="jewelry-text-luxury">28%</span>
                        </div>
                        <Progress value={28} className="h-2" />
                      </div>
                      <div className="bg-white/5 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-red-500">Critical Defects</span>
                          <span className="jewelry-text-luxury">7%</span>
                        </div>
                        <Progress value={7} className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Reports & Analytics */}
            <TabsContent value="reports" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quality Trends */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Quality Trends</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <TrendingUp className="h-4 w-4" />
                        Quality Improvement
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        Pass rate improved by 5.2% over the last quarter due to enhanced craftsman training.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="flex items-center gap-2 text-blue-600 font-medium">
                        <BarChart3 className="h-4 w-4" />
                        Seasonal Pattern
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        Quality scores tend to be higher during monsoon months when indoor work increases.
                      </p>
                    </div>

                    <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <div className="flex items-center gap-2 text-amber-600 font-medium">
                        <AlertCircle className="h-4 w-4" />
                        Focus Area
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        Joint quality issues increased by 15% - recommend additional training for assembly team.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Export & Compliance */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Export Quality & Compliance</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 jewelry-text-gold" />
                        <span className="jewelry-text-luxury">Export Quality Score</span>
                      </div>
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        96.8%
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Award className="h-4 w-4 jewelry-text-gold" />
                        <span className="jewelry-text-luxury">FSC Compliance</span>
                      </div>
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        100%
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 jewelry-text-gold" />
                        <span className="jewelry-text-luxury">Safety Standards</span>
                      </div>
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        Certified
                      </Badge>
                    </div>

                    <div className="mt-6">
                      <Button className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold w-full">
                        <Download className="h-4 w-4" />
                        Download Quality Report
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance by Craftsman */}
              <div className="jewelry-glass-card p-6">
                <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Craftsman Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { name: 'Raman Master', score: 95, items: 28, defects: 2 },
                    { name: 'Suresh Kumar', score: 88, items: 22, defects: 5 },
                    { name: 'Anitha Nair', score: 92, items: 19, defects: 3 },
                    { name: 'Pradeep Chandran', score: 89, items: 25, defects: 4 }
                  ].map((craftsman, index) => (
                    <div key={index} className="bg-white/5 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <User className="h-4 w-4 jewelry-text-gold" />
                        <span className="font-medium jewelry-text-luxury">{craftsman.name}</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Quality Score:</span>
                          <span className={getScoreColor(craftsman.score)}>{craftsman.score}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Items Completed:</span>
                          <span className="jewelry-text-luxury">{craftsman.items}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Defects Found:</span>
                          <span className="text-red-400">{craftsman.defects}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Inspection Modal */}
          {isInspecting && selectedCheck && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="jewelry-glass-card p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold jewelry-text-luxury">
                    Quality Inspection: {selectedCheck.productName}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsInspecting(false)}
                    className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium jewelry-text-luxury mb-4">Inspection Details</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-white/5 rounded-lg">
                        <span className="text-sm jewelry-text-luxury">Inspection ID:</span>
                        <p className="text-gray-300">{selectedCheck.id}</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg">
                        <span className="text-sm jewelry-text-luxury">Inspector:</span>
                        <p className="text-gray-300">{selectedCheck.inspector}</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg">
                        <span className="text-sm jewelry-text-luxury">Stage:</span>
                        <p className="text-gray-300">{selectedCheck.stage.replace('_', ' ')}</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg">
                        <span className="text-sm jewelry-text-luxury">Progress:</span>
                        <p className="text-gray-300">{selectedCheck.checkedItems}/{selectedCheck.totalItems} items</p>
                        <Progress value={(selectedCheck.checkedItems / selectedCheck.totalItems) * 100} className="h-2 mt-2" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium jewelry-text-luxury mb-4">Defects Found</h3>
                    <div className="space-y-3">
                      {selectedCheck.defects.length > 0 ? (
                        selectedCheck.defects.map((defect) => (
                          <div key={defect.id} className="p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium jewelry-text-luxury">{defect.category}</span>
                              <Badge className={`${getSeverityColor(defect.severity)} border`}>
                                {defect.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-300 mb-2">{defect.description}</p>
                            <p className="text-xs text-gray-400">Location: {defect.location}</p>
                            <p className="text-xs text-gray-400">Action: {defect.action}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-300 text-center py-8">No defects found</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
                  <Button variant="outline" className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Inspection
                  </Button>
                  <Button className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                    <Save className="h-4 w-4 mr-2" />
                    Complete Inspection
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}