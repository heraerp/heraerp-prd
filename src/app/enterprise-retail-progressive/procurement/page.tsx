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
  ShoppingCart, 
  Truck, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Edit3,
  Eye,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Package,
  Users,
  BarChart3,
  Brain,
  Zap,
  Star,
  Calendar,
  FileText,
  Globe,
  Shield,
  Activity,
  Award,
  Percent
} from 'lucide-react'

// Enterprise Retail Procurement Data with AI Insights
const sampleProcurementData = {
  purchaseOrders: [
    {
      id: 'PO-2024-001',
      supplier: 'Global Fashion Suppliers Ltd',
      supplier_id: 'SUP001',
      supplier_code: 'GFS',
      order_date: '2024-08-01',
      delivery_date: '2024-08-25',
      status: 'approved',
      total_amount: 125000.00,
      currency: 'USD',
      payment_terms: 'NET30',
      category: 'Apparel',
      buyer: 'Sarah Chen',
      priority: 'high',
      line_items: 15,
      supplier_rating: 4.2,
      risk_score: 'low',
      ai_insights: {
        price_variance: -5.2,
        delivery_prediction: 92,
        quality_score: 4.3,
        recommendation: 'Approved - Excellent supplier performance'
      }
    },
    {
      id: 'PO-2024-002', 
      supplier: 'Premium Footwear Manufacturing',
      supplier_id: 'SUP002',
      supplier_code: 'PFM',
      order_date: '2024-08-05',
      delivery_date: '2024-09-15',
      status: 'pending_approval',
      total_amount: 89500.00,
      currency: 'USD',
      payment_terms: 'NET45',
      category: 'Footwear',
      buyer: 'Michael Rodriguez',
      priority: 'medium',
      line_items: 22,
      supplier_rating: 3.8,
      risk_score: 'medium',
      ai_insights: {
        price_variance: 12.3,
        delivery_prediction: 76,
        quality_score: 3.9,
        recommendation: 'Review pricing - 12% above market average'
      }
    },
    {
      id: 'PO-2024-003',
      supplier: 'Luxury Accessories Co',
      supplier_id: 'SUP003', 
      supplier_code: 'LAC',
      order_date: '2024-08-08',
      delivery_date: '2024-08-30',
      status: 'urgent_review',
      total_amount: 45600.00,
      currency: 'USD',
      payment_terms: 'NET15',
      category: 'Accessories',
      buyer: 'Emma Thompson',
      priority: 'urgent',
      line_items: 8,
      supplier_rating: 3.2,
      risk_score: 'high',
      ai_insights: {
        price_variance: 28.7,
        delivery_prediction: 58,
        quality_score: 3.1,
        recommendation: 'High risk - Consider alternative suppliers'
      }
    },
    {
      id: 'PO-2024-004',
      supplier: 'Sustainable Textiles Inc',
      supplier_id: 'SUP004',
      supplier_code: 'STI',
      order_date: '2024-08-10',
      delivery_date: '2024-09-05',
      status: 'processing',
      total_amount: 67800.00,
      currency: 'USD',
      payment_terms: 'NET30',
      category: 'Raw Materials',
      buyer: 'David Kim',
      priority: 'medium',
      line_items: 12,
      supplier_rating: 4.6,
      risk_score: 'low',
      ai_insights: {
        price_variance: -2.1,
        delivery_prediction: 88,
        quality_score: 4.5,
        recommendation: 'Excellent choice - Sustainable and reliable'
      }
    }
  ],
  suppliers: [
    {
      id: 'SUP001',
      name: 'Global Fashion Suppliers Ltd',
      code: 'GFS',
      category: 'Apparel',
      country: 'Vietnam',
      rating: 4.2,
      total_orders: 45,
      total_value: 2850000,
      on_time_delivery: 94,
      quality_score: 4.3,
      payment_terms: 'NET30',
      risk_level: 'low',
      certifications: ['ISO 9001', 'OEKO-TEX', 'GOTS'],
      contact_person: 'James Wang',
      ai_performance: {
        trend: 'improving',
        forecast_reliability: 92,
        cost_competitiveness: 'high',
        sustainability_score: 4.1
      }
    },
    {
      id: 'SUP002',
      name: 'Premium Footwear Manufacturing',
      code: 'PFM',
      category: 'Footwear',
      country: 'Italy',
      rating: 3.8,
      total_orders: 28,
      total_value: 1650000,
      on_time_delivery: 78,
      quality_score: 3.9,
      payment_terms: 'NET45',
      risk_level: 'medium',
      certifications: ['ISO 9001'],
      contact_person: 'Marco Rossi',
      ai_performance: {
        trend: 'stable',
        forecast_reliability: 76,
        cost_competitiveness: 'medium',
        sustainability_score: 3.4
      }
    },
    {
      id: 'SUP003',
      name: 'Luxury Accessories Co',
      code: 'LAC',
      category: 'Accessories', 
      country: 'France',
      rating: 3.2,
      total_orders: 18,
      total_value: 890000,
      on_time_delivery: 65,
      quality_score: 3.1,
      payment_terms: 'NET15',
      risk_level: 'high',
      certifications: [],
      contact_person: 'Pierre Dubois',
      ai_performance: {
        trend: 'declining',
        forecast_reliability: 58,
        cost_competitiveness: 'low',
        sustainability_score: 2.8
      }
    }
  ],
  aiInsights: {
    procurement_efficiency: 87,
    cost_savings_ytd: 245000,
    supplier_risk_alerts: 3,
    delivery_performance: 84,
    quality_incidents: 2,
    budget_utilization: 73,
    top_recommendations: [
      'Consider negotiating better terms with Premium Footwear Manufacturing',
      'Urgent review needed for Luxury Accessories Co supplier performance',
      'Expand partnership with Global Fashion Suppliers Ltd based on excellent performance',
      'Implement supplier diversification for high-risk categories'
    ]
  },
  kpis: {
    total_po_value: 327900,
    avg_processing_time: 2.3,
    supplier_performance: 3.95,
    cost_variance: -1.8,
    delivery_performance: 84.5,
    quality_score: 4.1
  }
}

export default function RetailProcurementPage() {
  const { user, workspace } = useAuth()
  const [purchaseOrders, setPurchaseOrders] = useState(sampleProcurementData.purchaseOrders)
  const [suppliers, setSuppliers] = useState(sampleProcurementData.suppliers)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('purchase_orders') // 'purchase_orders', 'suppliers', 'ai_insights'
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  
  // Modal states
  const [showCreatePOModal, setShowCreatePOModal] = useState(false)
  const [showEditPOModal, setShowEditPOModal] = useState(false)
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [editingPO, setEditingPO] = useState(null)
  const [editingSupplier, setEditingSupplier] = useState(null)
  
  // Form states
  const [poFormData, setPoFormData] = useState({
    supplier: '',
    category: 'Apparel',
    total_amount: '',
    delivery_date: '',
    payment_terms: 'NET30',
    priority: 'medium',
    buyer: '',
    notes: ''
  })
  
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    code: '',
    category: 'Apparel',
    country: '',
    contact_person: '',
    payment_terms: 'NET30'
  })

  useEffect(() => {
    // Load data using HERA Progressive Auth pattern
    const loadData = () => {
      if (organization?.organization_id) {
        const storedData = localStorage.getItem(`hera_data_${organization?.organization_id}`)
        const data = storedData ? JSON.parse(storedData) : {}
        setPurchaseOrders(data.procurement_pos || sampleProcurementData.purchaseOrders)
        setSuppliers(data.procurement_suppliers || sampleProcurementData.suppliers)
      } else {
        setPurchaseOrders(sampleProcurementData.purchaseOrders)
        setSuppliers(sampleProcurementData.suppliers)
      }
      setLoading(false)
    }
    
    loadData()
  }, [workspace])

  // Save data to localStorage
  const saveProcurementData = (newPOs, newSuppliers) => {
    if (organization?.organization_id) {
      const existingData = JSON.parse(localStorage.getItem(`hera_data_${organization?.organization_id}`) || '{}')
      existingData.procurement_pos = newPOs || purchaseOrders
      existingData.procurement_suppliers = newSuppliers || suppliers
      localStorage.setItem(`hera_data_${organization?.organization_id}`, JSON.stringify(existingData))
    }
    if (newPOs) setPurchaseOrders(newPOs)
    if (newSuppliers) setSuppliers(newSuppliers)
  }

  // PO Management Functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'urgent_review': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-blue-100 text-blue-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAIRecommendationColor = (recommendation) => {
    if (recommendation.includes('Excellent') || recommendation.includes('Approved')) return 'text-green-700'
    if (recommendation.includes('Review') || recommendation.includes('Consider')) return 'text-yellow-700'
    if (recommendation.includes('High risk') || recommendation.includes('alternative')) return 'text-red-700'
    return 'text-blue-700'
  }

  // Filter functions
  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = searchQuery === '' || 
      po.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplier.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || po.status === selectedStatus
    const matchesCategory = selectedCategory === 'all' || po.category === selectedCategory
    const matchesPriority = selectedPriority === 'all' || po.priority === selectedPriority
    
    return matchesSearch && matchesStatus && matchesCategory && matchesPriority
  })

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = searchQuery === '' ||
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || supplier.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // CRUD Operations
  const handleCreatePO = () => {
    const newPO = {
      id: `PO-2024-${String(purchaseOrders.length + 5).padStart(3, '0')}`,
      supplier: poFormData.supplier,
      supplier_id: 'SUP' + String(purchaseOrders.length + 5).padStart(3, '0'),
      supplier_code: poFormData.supplier.substring(0, 3).toUpperCase(),
      order_date: new Date().toISOString().split('T')[0],
      delivery_date: poFormData.delivery_date,
      status: 'pending_approval',
      total_amount: parseFloat(poFormData.total_amount),
      currency: 'USD',
      payment_terms: poFormData.payment_terms,
      category: poFormData.category,
      buyer: poFormData.buyer,
      priority: poFormData.priority,
      line_items: Math.floor(Math.random() * 20) + 1,
      supplier_rating: 3.5 + Math.random() * 1.5,
      risk_score: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      ai_insights: {
        price_variance: (Math.random() - 0.5) * 30,
        delivery_prediction: Math.floor(Math.random() * 40) + 60,
        quality_score: 3.0 + Math.random() * 2,
        recommendation: 'AI analysis pending - New purchase order created'
      }
    }
    
    const updatedPOs = [...purchaseOrders, newPO]
    saveProcurementData(updatedPOs, null)
    
    // Reset form
    setPoFormData({
      supplier: '',
      category: 'Apparel',
      total_amount: '',
      delivery_date: '',
      payment_terms: 'NET30',
      priority: 'medium',
      buyer: '',
      notes: ''
    })
    setShowCreatePOModal(false)
  }

  const handleEditPO = (po) => {
    setEditingPO(po)
    setPoFormData({
      supplier: po.supplier,
      category: po.category,
      total_amount: po.total_amount.toString(),
      delivery_date: po.delivery_date,
      payment_terms: po.payment_terms,
      priority: po.priority,
      buyer: po.buyer,
      notes: po.notes || ''
    })
    setShowEditPOModal(true)
  }

  const handleUpdatePO = () => {
    const updatedPOs = purchaseOrders.map(po => 
      po.id === editingPO.id 
        ? { 
            ...po, 
            supplier: poFormData.supplier,
            category: poFormData.category,
            total_amount: parseFloat(poFormData.total_amount),
            delivery_date: poFormData.delivery_date,
            payment_terms: poFormData.payment_terms,
            priority: poFormData.priority,
            buyer: poFormData.buyer
          }
        : po
    )
    
    saveProcurementData(updatedPOs, null)
    setShowEditPOModal(false)
    setEditingPO(null)
  }

  const handleDeletePO = (poId) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      const updatedPOs = purchaseOrders.filter(po => po.id !== poId)
      saveProcurementData(updatedPOs, null)
    }
  }

  const handleCreateSupplier = () => {
    const newSupplier = {
      id: 'SUP' + String(suppliers.length + 5).padStart(3, '0'),
      name: supplierFormData.name,
      code: supplierFormData.code,
      category: supplierFormData.category,
      country: supplierFormData.country,
      rating: 3.5,
      total_orders: 0,
      total_value: 0,
      on_time_delivery: 85,
      quality_score: 3.5,
      payment_terms: supplierFormData.payment_terms,
      risk_level: 'medium',
      certifications: [],
      contact_person: supplierFormData.contact_person,
      ai_performance: {
        trend: 'new',
        forecast_reliability: 70,
        cost_competitiveness: 'medium',
        sustainability_score: 3.0
      }
    }
    
    const updatedSuppliers = [...suppliers, newSupplier]
    saveProcurementData(null, updatedSuppliers)
    
    // Reset form
    setSupplierFormData({
      name: '',
      code: '',
      category: 'Apparel',
      country: '',
      contact_person: '',
      payment_terms: 'NET30'
    })
    setShowSupplierModal(false)
  }

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Loading Retail Procurement...</p>
      </div>
    </div>
  }

  return (
    <UniversalTourProvider industryKey="retail-procurement" autoStart={true}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex">
        <EnterpriseRetailSolutionSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <TourElement tourId="header">
            <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shadow-sm">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                      Retail Procurement
                    </h1>
                    <p className="text-sm text-gray-500">{user?.organizationName || 'Enterprise Retail'} • AI-Powered Sourcing</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search orders, suppliers..."
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-md"
                  onClick={() => activeTab === 'purchase_orders' ? setShowCreatePOModal(true) : setShowSupplierModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {activeTab === 'purchase_orders' ? 'Create PO' : 'Add Supplier'}
                </Button>
              </div>
            </header>
          </TourElement>

          <main className="flex-1 overflow-auto">
            {/* KPIs Dashboard */}
            <TourElement tourId="kpi-dashboard">
              <div className="p-8 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-emerald-700 font-medium">Total PO Value</p>
                          <p className="text-2xl font-bold text-emerald-900">${(sampleProcurementData.kpis.total_po_value / 1000).toFixed(0)}K</p>
                          <p className="text-xs text-emerald-600 mt-1">This month</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-emerald-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-indigo-200 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-indigo-700 font-medium">Processing Time</p>
                          <p className="text-2xl font-bold text-indigo-900">{sampleProcurementData.kpis.avg_processing_time}d</p>
                          <p className="text-xs text-indigo-600 mt-1">Average</p>
                        </div>
                        <Clock className="w-8 h-8 text-indigo-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-violet-200 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-violet-700 font-medium">Supplier Rating</p>
                          <p className="text-2xl font-bold text-violet-900">{sampleProcurementData.kpis.supplier_performance}</p>
                          <p className="text-xs text-violet-600 mt-1">Average score</p>
                        </div>
                        <Star className="w-8 h-8 text-violet-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-amber-200 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-amber-700 font-medium">Cost Variance</p>
                          <p className="text-2xl font-bold text-amber-900">{sampleProcurementData.kpis.cost_variance}%</p>
                          <p className="text-xs text-amber-600 mt-1">Below budget</p>
                        </div>
                        <TrendingDown className="w-8 h-8 text-amber-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-teal-50 to-cyan-100 border-cyan-200 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-cyan-700 font-medium">Delivery Rate</p>
                          <p className="text-2xl font-bold text-cyan-900">{sampleProcurementData.kpis.delivery_performance}%</p>
                          <p className="text-xs text-cyan-600 mt-1">On-time</p>
                        </div>
                        <Truck className="w-8 h-8 text-cyan-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-rose-50 to-pink-100 border-pink-200 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-pink-700 font-medium">Quality Score</p>
                          <p className="text-2xl font-bold text-pink-900">{sampleProcurementData.kpis.quality_score}</p>
                          <p className="text-xs text-pink-600 mt-1">Average rating</p>
                        </div>
                        <Award className="w-8 h-8 text-pink-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Insights Card */}
                <Card className="mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <Brain className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">AI Procurement Intelligence</h3>
                        <p className="text-indigo-100 mb-4">
                          Efficiency: {sampleProcurementData.aiInsights.procurement_efficiency}% • 
                          Cost Savings YTD: ${(sampleProcurementData.aiInsights.cost_savings_ytd / 1000).toFixed(0)}K • 
                          Risk Alerts: {sampleProcurementData.aiInsights.supplier_risk_alerts}
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          {sampleProcurementData.aiInsights.top_recommendations.slice(0, 2).map((rec, index) => (
                            <div key={index} className="bg-white/10 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <Zap className="w-4 h-4 mt-0.5 text-yellow-300" />
                                <p className="text-sm text-white/90">{rec}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Navigation Tabs */}
                <TourElement tourId="navigation-tabs">
                  <div className="flex space-x-1 mb-6">
                    <Button
                      variant={activeTab === 'purchase_orders' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('purchase_orders')}
                      className={activeTab === 'purchase_orders' ? 'bg-blue-600 text-white' : ''}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Purchase Orders
                    </Button>
                    <Button
                      variant={activeTab === 'suppliers' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('suppliers')}
                      className={activeTab === 'suppliers' ? 'bg-blue-600 text-white' : ''}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Suppliers
                    </Button>
                    <Button
                      variant={activeTab === 'ai_insights' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('ai_insights')}
                      className={activeTab === 'ai_insights' ? 'bg-blue-600 text-white' : ''}
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      AI Analytics
                    </Button>
                  </div>
                </TourElement>

                {/* Filters */}
                {(activeTab === 'purchase_orders' || activeTab === 'suppliers') && (
                  <TourElement tourId="filters">
                    <div className="flex gap-4 mb-6">
                      {activeTab === 'purchase_orders' && (
                        <>
                          <select 
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                          >
                            <option value="all">All Statuses</option>
                            <option value="approved">Approved</option>
                            <option value="pending_approval">Pending Approval</option>
                            <option value="processing">Processing</option>
                            <option value="urgent_review">Urgent Review</option>
                          </select>

                          <select 
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedPriority}
                            onChange={(e) => setSelectedPriority(e.target.value)}
                          >
                            <option value="all">All Priorities</option>
                            <option value="urgent">Urgent</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                        </>
                      )}

                      <select 
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        <option value="all">All Categories</option>
                        <option value="Apparel">Apparel</option>
                        <option value="Footwear">Footwear</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Raw Materials">Raw Materials</option>
                      </select>
                    </div>
                  </TourElement>
                )}
              </div>
            </TourElement>

            {/* Content Area */}
            <div className="px-8 pb-8">
              {/* Purchase Orders Tab */}
              {activeTab === 'purchase_orders' && (
                <TourElement tourId="purchase-orders">
                  <div className="space-y-6">
                    {filteredPOs.map((po) => (
                      <Card key={po.id} className="hover:shadow-lg transition-all duration-200 group border-l-4 border-l-blue-500">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2">
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {po.id}
                                </h3>
                                <Badge className={getStatusColor(po.status)}>
                                  {po.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                                <Badge className={getPriorityColor(po.priority)}>
                                  {po.priority.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-lg font-semibold text-gray-700 mb-1">{po.supplier}</p>
                              <p className="text-sm text-gray-500">Buyer: {po.buyer} • Category: {po.category}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600">${po.total_amount.toLocaleString()}</p>
                              <p className="text-sm text-gray-500">{po.currency}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                              <span className="text-sm text-gray-600">Order Date:</span>
                              <p className="font-medium">{new Date(po.order_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Delivery Date:</span>
                              <p className="font-medium">{new Date(po.delivery_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Payment Terms:</span>
                              <p className="font-medium">{po.payment_terms}</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Line Items:</span>
                              <p className="font-medium">{po.line_items}</p>
                            </div>
                          </div>

                          {/* AI Insights Section */}
                          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Brain className="w-5 h-5 text-indigo-600" />
                              <h4 className="font-semibold text-indigo-900">AI Insights</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-indigo-600">
                                  {po.ai_insights.price_variance > 0 ? '+' : ''}{po.ai_insights.price_variance.toFixed(1)}%
                                </p>
                                <p className="text-xs text-gray-600">Price Variance</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-indigo-600">{po.ai_insights.delivery_prediction}%</p>
                                <p className="text-xs text-gray-600">Delivery Confidence</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-indigo-600">{po.ai_insights.quality_score.toFixed(1)}</p>
                                <p className="text-xs text-gray-600">Quality Forecast</p>
                              </div>
                            </div>
                            <div className="bg-white rounded-md p-3">
                              <p className={`text-sm font-medium ${getAIRecommendationColor(po.ai_insights.recommendation)}`}>
                                <Zap className="w-4 h-4 inline mr-1" />
                                {po.ai_insights.recommendation}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span className="text-sm font-medium">{po.supplier_rating.toFixed(1)}</span>
                              </div>
                              <span className={`text-sm font-medium ${getRiskColor(po.risk_score)}`}>
                                Risk: {po.risk_score.toUpperCase()}
                              </span>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditPO(po)}
                              >
                                <Edit3 className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button variant="outline" size="sm">
                                <FileText className="w-4 h-4 mr-1" />
                                Documents
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDeletePO(po.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TourElement>
              )}

              {/* Suppliers Tab */}
              {activeTab === 'suppliers' && (
                <TourElement tourId="suppliers-management">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSuppliers.map((supplier) => (
                      <Card key={supplier.id} className="hover:shadow-lg transition-all duration-200 group">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {supplier.name}
                              </CardTitle>
                              <p className="text-sm text-gray-500 mt-1">{supplier.code} • {supplier.country}</p>
                            </div>
                            <Badge className={`${getRiskColor(supplier.risk_level)} bg-gray-100`}>
                              {supplier.risk_level.toUpperCase()}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Category</span>
                              <span className="text-sm font-medium">{supplier.category}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Rating</span>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span className="text-sm font-medium">{supplier.rating.toFixed(1)}</span>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Total Orders</span>
                              <span className="text-sm font-medium">{supplier.total_orders}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Total Value</span>
                              <span className="text-lg font-bold text-green-600">
                                ${(supplier.total_value / 1000000).toFixed(1)}M
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">On-Time Delivery</span>
                              <span className="text-sm font-medium text-blue-600">{supplier.on_time_delivery}%</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Contact</span>
                              <span className="text-sm font-medium">{supplier.contact_person}</span>
                            </div>
                            
                            {/* AI Performance Indicators */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 mt-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Brain className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-semibold text-blue-900">AI Performance</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-gray-600">Trend:</span>
                                  <p className="font-medium capitalize">{supplier.ai_performance.trend}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Reliability:</span>
                                  <p className="font-medium">{supplier.ai_performance.forecast_reliability}%</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Cost:</span>
                                  <p className="font-medium capitalize">{supplier.ai_performance.cost_competitiveness}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Sustainability:</span>
                                  <p className="font-medium">{supplier.ai_performance.sustainability_score.toFixed(1)}</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Certifications */}
                            {supplier.certifications.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-600 mb-1">Certifications:</p>
                                <div className="flex flex-wrap gap-1">
                                  {supplier.certifications.map((cert, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {cert}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
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
                </TourElement>
              )}

              {/* AI Insights Tab */}
              {activeTab === 'ai_insights' && (
                <TourElement tourId="ai-insights-detail">
                  <div className="space-y-6">
                    {/* Top Recommendations */}
                    <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                          <Brain className="w-6 h-6" />
                          AI Recommendations
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {sampleProcurementData.aiInsights.top_recommendations.map((rec, index) => (
                            <div key={index} className="bg-white/10 rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-bold text-purple-900">{index + 1}</span>
                                </div>
                                <p className="text-white/95">{rec}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Performance Analytics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-green-600" />
                            Procurement Efficiency
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center">
                            <div className="text-4xl font-bold text-green-600 mb-2">
                              {sampleProcurementData.aiInsights.procurement_efficiency}%
                            </div>
                            <p className="text-sm text-gray-600">Overall efficiency score</p>
                            <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                              <div 
                                className="bg-green-500 h-3 rounded-full transition-all duration-500" 
                                style={{ width: `${sampleProcurementData.aiInsights.procurement_efficiency}%` }}
                              ></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                            Cost Savings YTD
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center">
                            <div className="text-4xl font-bold text-blue-600 mb-2">
                              ${(sampleProcurementData.aiInsights.cost_savings_ytd / 1000).toFixed(0)}K
                            </div>
                            <p className="text-sm text-gray-600">Saved this year</p>
                            <div className="flex items-center justify-center gap-1 mt-2">
                              <TrendingDown className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-green-600 font-medium">18% vs last year</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            Risk Alerts
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center">
                            <div className="text-4xl font-bold text-red-600 mb-2">
                              {sampleProcurementData.aiInsights.supplier_risk_alerts}
                            </div>
                            <p className="text-sm text-gray-600">Active alerts</p>
                            <Button size="sm" className="mt-3 bg-red-600 hover:bg-red-700">
                              <AlertTriangle className="w-4 h-4 mr-1" />
                              Review Alerts
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Supplier Performance Matrix */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xl font-bold text-gray-900">AI Supplier Performance Matrix</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {suppliers.map((supplier) => (
                            <div key={supplier.id} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 border">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-gray-900">{supplier.name}</h4>
                                <Badge className={`${getRiskColor(supplier.risk_level)} bg-gray-100`}>
                                  {supplier.risk_level}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-600">AI Trend:</span>
                                  <p className={`font-medium capitalize ${
                                    supplier.ai_performance.trend === 'improving' ? 'text-green-600' :
                                    supplier.ai_performance.trend === 'declining' ? 'text-red-600' : 'text-blue-600'
                                  }`}>
                                    {supplier.ai_performance.trend}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Reliability:</span>
                                  <p className="font-medium">{supplier.ai_performance.forecast_reliability}%</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Cost Score:</span>
                                  <p className="font-medium capitalize">{supplier.ai_performance.cost_competitiveness}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Sustainability:</span>
                                  <p className="font-medium">{supplier.ai_performance.sustainability_score.toFixed(1)}/5</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TourElement>
              )}
            </div>
          </main>
        </div>

        {/* Create PO Modal */}
        {showCreatePOModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Create Purchase Order</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowCreatePOModal(false)}
                  >
                    ×
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="supplier">Supplier Name</Label>
                    <Input
                      id="supplier"
                      value={poFormData.supplier}
                      onChange={(e) => setPoFormData({...poFormData, supplier: e.target.value})}
                      placeholder="Enter supplier name"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={poFormData.category}
                      onChange={(e) => setPoFormData({...poFormData, category: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Apparel">Apparel</option>
                      <option value="Footwear">Footwear</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Raw Materials">Raw Materials</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="total_amount">Total Amount ($)</Label>
                    <Input
                      id="total_amount"
                      type="number"
                      value={poFormData.total_amount}
                      onChange={(e) => setPoFormData({...poFormData, total_amount: e.target.value})}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="delivery_date">Delivery Date</Label>
                    <Input
                      id="delivery_date"
                      type="date"
                      value={poFormData.delivery_date}
                      onChange={(e) => setPoFormData({...poFormData, delivery_date: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="payment_terms">Payment Terms</Label>
                    <select
                      id="payment_terms"
                      value={poFormData.payment_terms}
                      onChange={(e) => setPoFormData({...poFormData, payment_terms: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="NET30">NET30</option>
                      <option value="NET45">NET45</option>
                      <option value="NET60">NET60</option>
                      <option value="NET15">NET15</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <select
                      id="priority"
                      value={poFormData.priority}
                      onChange={(e) => setPoFormData({...poFormData, priority: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="buyer">Buyer</Label>
                    <Input
                      id="buyer"
                      value={poFormData.buyer}
                      onChange={(e) => setPoFormData({...poFormData, buyer: e.target.value})}
                      placeholder="Enter buyer name"
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={poFormData.notes}
                      onChange={(e) => setPoFormData({...poFormData, notes: e.target.value})}
                      placeholder="Additional notes..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowCreatePOModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700"
                    onClick={handleCreatePO}
                    disabled={!poFormData.supplier || !poFormData.total_amount}
                  >
                    Create Purchase Order
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit PO Modal */}
        {showEditPOModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Purchase Order</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowEditPOModal(false)}
                  >
                    ×
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="edit_supplier">Supplier Name</Label>
                    <Input
                      id="edit_supplier"
                      value={poFormData.supplier}
                      onChange={(e) => setPoFormData({...poFormData, supplier: e.target.value})}
                      placeholder="Enter supplier name"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit_total_amount">Total Amount ($)</Label>
                    <Input
                      id="edit_total_amount"
                      type="number"
                      value={poFormData.total_amount}
                      onChange={(e) => setPoFormData({...poFormData, total_amount: e.target.value})}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit_delivery_date">Delivery Date</Label>
                    <Input
                      id="edit_delivery_date"
                      type="date"
                      value={poFormData.delivery_date}
                      onChange={(e) => setPoFormData({...poFormData, delivery_date: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit_priority">Priority</Label>
                    <select
                      id="edit_priority"
                      value={poFormData.priority}
                      onChange={(e) => setPoFormData({...poFormData, priority: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit_buyer">Buyer</Label>
                    <Input
                      id="edit_buyer"
                      value={poFormData.buyer}
                      onChange={(e) => setPoFormData({...poFormData, buyer: e.target.value})}
                      placeholder="Enter buyer name"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowEditPOModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700"
                    onClick={handleUpdatePO}
                  >
                    Update Purchase Order
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Supplier Modal */}
        {showSupplierModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Add New Supplier</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowSupplierModal(false)}
                  >
                    ×
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="supplier_name">Supplier Name</Label>
                    <Input
                      id="supplier_name"
                      value={supplierFormData.name}
                      onChange={(e) => setSupplierFormData({...supplierFormData, name: e.target.value})}
                      placeholder="Enter supplier name"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="supplier_code">Supplier Code</Label>
                    <Input
                      id="supplier_code"
                      value={supplierFormData.code}
                      onChange={(e) => setSupplierFormData({...supplierFormData, code: e.target.value})}
                      placeholder="e.g., ABC123"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="supplier_category">Category</Label>
                    <select
                      id="supplier_category"
                      value={supplierFormData.category}
                      onChange={(e) => setSupplierFormData({...supplierFormData, category: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Apparel">Apparel</option>
                      <option value="Footwear">Footwear</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Raw Materials">Raw Materials</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="supplier_country">Country</Label>
                    <Input
                      id="supplier_country"
                      value={supplierFormData.country}
                      onChange={(e) => setSupplierFormData({...supplierFormData, country: e.target.value})}
                      placeholder="e.g., Vietnam, Italy"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="supplier_contact">Contact Person</Label>
                    <Input
                      id="supplier_contact"
                      value={supplierFormData.contact_person}
                      onChange={(e) => setSupplierFormData({...supplierFormData, contact_person: e.target.value})}
                      placeholder="Enter contact name"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="supplier_payment_terms">Payment Terms</Label>
                    <select
                      id="supplier_payment_terms"
                      value={supplierFormData.payment_terms}
                      onChange={(e) => setSupplierFormData({...supplierFormData, payment_terms: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="NET30">NET30</option>
                      <option value="NET45">NET45</option>
                      <option value="NET60">NET60</option>
                      <option value="NET15">NET15</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowSupplierModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700"
                    onClick={handleCreateSupplier}
                    disabled={!supplierFormData.name || !supplierFormData.code}
                  >
                    Add Supplier
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