'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/MultiOrgAuthProvider'
import { EnterpriseRetailSolutionSidebar } from '@/components/enterprise-retail-progressive/EnterpriseRetailSolutionSidebar'
import { UniversalTourProvider, TourElement } from '@/components/tours/SimpleTourProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Target,
  ShoppingCart,
  Package,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle,
  Edit3,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Users,
  Store,
  Zap,
  DollarSign,
  Percent,
  Activity,
  List,
  Grid3X3
} from 'lucide-react'

// Sample Enterprise Planning Data - ERP-style comprehensive planning
const samplePlanningData = {
  assortmentPlans: [
    {
      id: 1,
      plan_name: 'FW2025 Outerwear Collection',
      season: 'FW2025',
      category: 'Outerwear',
      planning_horizon: '6-months',
      status: 'active',
      target_revenue: 850000,
      planned_units: 2400,
      avg_selling_price: 354.17,
      margin_target: 58.5,
      buyer: 'Sarah Chen',
      launch_date: '2024-09-01',
      completion: 78
    },
    {
      id: 2,
      plan_name: 'SS2025 Footwear Launch',
      season: 'SS2025',
      category: 'Footwear',
      planning_horizon: '4-months',
      status: 'planning',
      target_revenue: 680000,
      planned_units: 1800,
      avg_selling_price: 377.78,
      margin_target: 62.0,
      buyer: 'Michael Rodriguez',
      launch_date: '2025-03-01',
      completion: 45
    },
    {
      id: 3,
      plan_name: 'Holiday Accessories Drive',
      season: 'FW2024',
      category: 'Accessories',
      planning_horizon: '3-months',
      status: 'approved',
      target_revenue: 320000,
      planned_units: 4500,
      avg_selling_price: 71.11,
      margin_target: 72.5,
      buyer: 'Emma Thompson',
      launch_date: '2024-11-01',
      completion: 95
    }
  ],
  demandForecasts: [
    {
      category: 'Outerwear',
      current_demand: 2400,
      forecasted_demand: 2850,
      variance_percent: 18.8,
      confidence_level: 85,
      trend: 'increasing'
    },
    {
      category: 'Footwear',
      current_demand: 1800,
      forecasted_demand: 1650,
      variance_percent: -8.3,
      confidence_level: 78,
      trend: 'stable'
    },
    {
      category: 'Accessories',
      current_demand: 4500,
      forecasted_demand: 5200,
      variance_percent: 15.6,
      confidence_level: 92,
      trend: 'increasing'
    }
  ],
  buyingWorkflows: [
    {
      id: 'WF001',
      workflow_name: 'FW2025 Pre-Season Buy',
      vendor: 'Premium Outerwear Ltd',
      category: 'Outerwear',
      order_value: 485000,
      units_ordered: 1350,
      delivery_window: 'Aug 15 - Sep 30, 2024',
      payment_terms: 'NET60',
      status: 'po_issued',
      risk_level: 'medium'
    },
    {
      id: 'WF002',
      workflow_name: 'SS2025 Footwear Collection',
      vendor: 'SportStyle Global',
      category: 'Footwear',
      order_value: 620000,
      units_ordered: 1640,
      delivery_window: 'Jan 15 - Feb 28, 2025',
      payment_terms: 'NET45',
      status: 'negotiation',
      risk_level: 'low'
    },
    {
      id: 'WF003',
      workflow_name: 'Holiday Accessories Rush',
      vendor: 'Luxury Accessories Inc',
      category: 'Accessories',
      order_value: 180000,
      units_ordered: 2500,
      delivery_window: 'Oct 1 - Oct 15, 2024',
      payment_terms: 'NET30',
      status: 'urgent_review',
      risk_level: 'high'
    }
  ],
  kpis: {
    total_planned_revenue: 1850000,
    total_planned_units: 8700,
    avg_margin_target: 64.3,
    active_workflows: 3,
    plans_on_schedule: 2,
    forecast_accuracy: 84
  }
}

export default function PlanningPage() {
  const { user, workspace } = useAuth()
  const [assortmentPlans, setAssortmentPlans] = useState(samplePlanningData.assortmentPlans)
  const [demandForecasts] = useState(samplePlanningData.demandForecasts)
  const [buyingWorkflows] = useState(samplePlanningData.buyingWorkflows)
  const [kpis] = useState(samplePlanningData.kpis)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('assortment') // 'assortment', 'demand', 'buying'
  const [viewMode, setViewMode] = useState('grid')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  
  // Form state for new plan
  const [formData, setFormData] = useState({
    plan_name: '',
    season: 'FW2025',
    category: 'Outerwear',
    planning_horizon: '6-months',
    status: 'planning',
    target_revenue: '',
    planned_units: '',
    margin_target: '',
    buyer: '',
    launch_date: '',
    notes: ''
  })

  useEffect(() => {
    // Load data using HERA Progressive Auth pattern
    const loadData = () => {
      if (organization?.organization_id) {
        const storedData = localStorage.getItem(`hera_data_${organization?.organization_id}`)
        const data = storedData ? JSON.parse(storedData) : {}
        const planningData = data.enterprise_planning || samplePlanningData.assortmentPlans
        setAssortmentPlans(planningData)
      } else {
        setAssortmentPlans(samplePlanningData.assortmentPlans)
      }
      setLoading(false)
    }
    
    loadData()
  }, [workspace])

  // Save plans to localStorage
  const savePlans = (updatedPlans) => {
    if (organization?.organization_id) {
      const existingData = JSON.parse(localStorage.getItem(`hera_data_${organization?.organization_id}`) || '{}')
      existingData.enterprise_planning = updatedPlans
      localStorage.setItem(`hera_data_${organization?.organization_id}`, JSON.stringify(existingData))
    }
    setAssortmentPlans(updatedPlans)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'planning': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-blue-100 text-blue-800'
      case 'on_hold': return 'bg-gray-100 text-gray-800'
      case 'po_issued': return 'bg-indigo-100 text-indigo-800'
      case 'negotiation': return 'bg-orange-100 text-orange-800'
      case 'urgent_review': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-red-500" />
      case 'stable': return <Activity className="w-4 h-4 text-blue-500" />
      default: return <BarChart3 className="w-4 h-4 text-gray-500" />
    }
  }

  const filteredPlans = assortmentPlans.filter(plan => {
    const matchesCategory = selectedCategory === 'all' || plan.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || plan.status === selectedStatus
    return matchesCategory && matchesStatus
  })

  // Handle form changes
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle add new plan
  const handleAddPlan = () => {
    const newPlan = {
      ...formData,
      id: Math.max(...assortmentPlans.map(p => p.id), 0) + 1,
      target_revenue: parseFloat(formData.target_revenue) || 0,
      planned_units: parseInt(formData.planned_units) || 0,
      margin_target: parseFloat(formData.margin_target) || 0,
      avg_selling_price: formData.planned_units > 0 && formData.target_revenue > 0 
        ? Math.round((parseFloat(formData.target_revenue) / parseInt(formData.planned_units)) * 100) / 100
        : 0,
      completion: 0
    }
    
    const updatedPlans = [...assortmentPlans, newPlan]
    savePlans(updatedPlans)
    
    // Reset form and close modal
    setFormData({
      plan_name: '',
      season: 'FW2025',
      category: 'Outerwear',
      planning_horizon: '6-months',
      status: 'planning',
      target_revenue: '',
      planned_units: '',
      margin_target: '',
      buyer: '',
      launch_date: '',
      notes: ''
    })
    setShowAddModal(false)
  }

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Loading Enterprise Planning Suite...</p>
      </div>
    </div>
  }

  return (


    <UniversalTourProvider industryKey="retail-planning" autoStart={true}>

    <div className="min-h-screen bg-white flex">
      <EnterpriseRetailSolutionSidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <TourElement tourId="header">
          <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <div>
            <h1 className="text-2xl font-light text-gray-900">Enterprise Planning Suite</h1>
            <p className="text-sm text-gray-500">{user?.organizationName || 'Enterprise Retail'}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Plan
            </Button>
          </div>
        </header>
        </TourElement>

        <main className="flex-1 overflow-auto bg-gray-50">
          {/* KPIs Dashboard */}
          <div className="p-8 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Planned Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">${(kpis.total_planned_revenue / 1000000).toFixed(1)}M</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Planned Units</p>
                      <p className="text-2xl font-bold text-gray-900">{(kpis.total_planned_units / 1000).toFixed(1)}K</p>
                    </div>
                    <Package className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avg Margin Target</p>
                      <p className="text-2xl font-bold text-gray-900">{kpis.avg_margin_target}%</p>
                    </div>
                    <Percent className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Workflows</p>
                      <p className="text-2xl font-bold text-gray-900">{kpis.active_workflows}</p>
                    </div>
                    <Zap className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">On Schedule</p>
                      <p className="text-2xl font-bold text-gray-900">{kpis.plans_on_schedule}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Forecast Accuracy</p>
                      <p className="text-2xl font-bold text-gray-900">{kpis.forecast_accuracy}%</p>
                    </div>
                    <Target className="w-8 h-8 text-indigo-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 mb-6">
              <Button
                variant={activeTab === 'assortment' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('assortment')}
                className={activeTab === 'assortment' ? 'bg-blue-600 text-white' : ''}
              >
                <Package className="w-4 h-4 mr-2" />
                Assortment Planning
              </Button>
              <Button
                variant={activeTab === 'demand' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('demand')}
                className={activeTab === 'demand' ? 'bg-blue-600 text-white' : ''}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Demand Forecasting
              </Button>
              <Button
                variant={activeTab === 'buying' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('buying')}
                className={activeTab === 'buying' ? 'bg-blue-600 text-white' : ''}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Buying Workflows
              </Button>
            </div>

            {/* Filters for Assortment Planning */}
            {activeTab === 'assortment' && (
              <div className="flex gap-4 mb-6">
                <select 
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="Outerwear">Outerwear</option>
                  <option value="Footwear">Footwear</option>
                  <option value="Accessories">Accessories</option>
                </select>

                <select 
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="approved">Approved</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>


            )}
          </div>

          {/* Content Area */}
          <div className="px-8 pb-8">
            {/* Assortment Planning Tab */}
            {activeTab === 'assortment' && (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
              }>
                {filteredPlans.map((plan) => (
                  <Card key={plan.id} className="hover:shadow-lg transition-all duration-200 group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {plan.plan_name}
                          </CardTitle>
                          <p className="text-sm text-gray-500 mt-1">{plan.category} • {plan.season}</p>
                        </div>
                        <Badge className={getStatusColor(plan.status)}>
                          {plan.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Target Revenue</span>
                          <span className="text-lg font-bold text-green-600">
                            ${(plan.target_revenue / 1000).toFixed(0)}K
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Planned Units</span>
                          <span className="text-sm font-medium">{plan.planned_units.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Avg Selling Price</span>
                          <span className="text-sm font-medium">${plan.avg_selling_price}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Margin Target</span>
                          <span className="text-sm font-medium text-purple-600">{plan.margin_target}%</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Buyer</span>
                          <span className="text-sm font-medium">{plan.buyer}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Launch Date</span>
                          <span className="text-sm font-medium">{new Date(plan.launch_date).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Completion</span>
                            <span className="text-sm font-medium">{plan.completion}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${plan.completion}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Demand Forecasting Tab */}
            {activeTab === 'demand' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {demandForecasts.map((forecast, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        {forecast.category}
                        {getTrendIcon(forecast.trend)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Current Demand</span>
                          <span className="text-lg font-bold text-gray-900">{forecast.current_demand.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Forecasted Demand</span>
                          <span className="text-lg font-bold text-blue-600">{forecast.forecasted_demand.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Variance</span>
                          <span className={`text-lg font-bold ${forecast.variance_percent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {forecast.variance_percent > 0 ? '+' : ''}{forecast.variance_percent}%
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Confidence Level</span>
                          <span className="text-sm font-medium">{forecast.confidence_level}%</span>
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Confidence</span>
                            <span className="text-sm font-medium">{forecast.confidence_level}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${forecast.confidence_level}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Buying Workflows Tab */}
            {activeTab === 'buying' && (
              <div className="space-y-4">
                {buyingWorkflows.map((workflow) => (
                  <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{workflow.workflow_name}</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Vendor:</span>
                              <p className="font-medium">{workflow.vendor}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Category:</span>
                              <p className="font-medium">{workflow.category}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Order Value:</span>
                              <p className="font-bold text-green-600">${(workflow.order_value / 1000).toFixed(0)}K</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Units:</span>
                              <p className="font-medium">{workflow.units_ordered.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Delivery Window:</span>
                              <p className="font-medium">{workflow.delivery_window}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Payment Terms:</span>
                              <p className="font-medium">{workflow.payment_terms}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Risk Level:</span>
                              <p className={`font-medium ${getRiskColor(workflow.risk_level)}`}>
                                {workflow.risk_level.toUpperCase()}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Status:</span>
                              <Badge className={getStatusColor(workflow.status)}>
                                {workflow.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {workflow.status === 'urgent_review' && (
                            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                              <AlertTriangle className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add New Plan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create New Assortment Plan</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowAddModal(false)}
                >
                  ×
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="plan_name">Plan Name</Label>
                  <Input
                    id="plan_name"
                    value={formData.plan_name}
                    onChange={(e) => handleFormChange('plan_name', e.target.value)}
                    placeholder="e.g., FW2025 Outerwear Collection"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="season">Season</Label>
                  <select
                    id="season"
                    value={formData.season}
                    onChange={(e) => handleFormChange('season', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="FW2025">FW2025</option>
                    <option value="SS2025">SS2025</option>
                    <option value="FW2024">FW2024</option>
                    <option value="SS2024">SS2024</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Outerwear">Outerwear</option>
                    <option value="Footwear">Footwear</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Denim">Denim</option>
                    <option value="Tops">Tops</option>
                    <option value="Bottoms">Bottoms</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="planning_horizon">Planning Horizon</Label>
                  <select
                    id="planning_horizon"
                    value={formData.planning_horizon}
                    onChange={(e) => handleFormChange('planning_horizon', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="3-months">3 months</option>
                    <option value="6-months">6 months</option>
                    <option value="9-months">9 months</option>
                    <option value="12-months">12 months</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="approved">Approved</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="target_revenue">Target Revenue ($)</Label>
                  <Input
                    id="target_revenue"
                    type="number"
                    value={formData.target_revenue}
                    onChange={(e) => handleFormChange('target_revenue', e.target.value)}
                    placeholder="850000"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="planned_units">Planned Units</Label>
                  <Input
                    id="planned_units"
                    type="number"
                    value={formData.planned_units}
                    onChange={(e) => handleFormChange('planned_units', e.target.value)}
                    placeholder="2400"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="margin_target">Margin Target (%)</Label>
                  <Input
                    id="margin_target"
                    type="number"
                    step="0.1"
                    value={formData.margin_target}
                    onChange={(e) => handleFormChange('margin_target', e.target.value)}
                    placeholder="58.5"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="buyer">Buyer</Label>
                  <Input
                    id="buyer"
                    value={formData.buyer}
                    onChange={(e) => handleFormChange('buyer', e.target.value)}
                    placeholder="e.g., Sarah Chen"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="launch_date">Launch Date</Label>
                  <Input
                    id="launch_date"
                    type="date"
                    value={formData.launch_date}
                    onChange={(e) => handleFormChange('launch_date', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Additional planning notes..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
              
              {/* Auto-calculated fields preview */}
              {formData.target_revenue && formData.planned_units && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Calculated Average Selling Price:</strong> $
                    {formData.planned_units > 0 && formData.target_revenue > 0 
                      ? Math.round((parseFloat(formData.target_revenue) / parseInt(formData.planned_units)) * 100) / 100
                      : 0
                    }
                  </p>
                </div>
              )}
              
              <div className="flex gap-4 mt-6">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700"
                  onClick={handleAddPlan}
                  disabled={!formData.plan_name || !formData.target_revenue || !formData.planned_units}
                >
                  Create Plan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </UniversalTourProvider>
  )
}