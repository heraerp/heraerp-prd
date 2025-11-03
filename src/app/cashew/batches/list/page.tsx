/**
 * Cashew Production Batches List Page
 * Smart Code: HERA.CASHEW.BATCHES.LIST.v1
 * 
 * Track cashew processing batches from start to finish
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useCashewAuth } from '@/components/auth/CashewAuthProvider'
import { 
  Factory, 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Download,
  ArrowLeft,
  Calendar,
  Clock,
  TrendingUp
} from 'lucide-react'

export default function CashewBatchesListPage() {
  const { user, organization, isAuthenticated, isLoading } = useCashewAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')

  // Sample production batches
  const [batches, setBatches] = useState([
    {
      id: 1,
      batchNumber: 'CB-2024-001',
      startDate: '2024-01-15',
      endDate: '2024-01-18',
      status: 'Completed',
      inputMaterial: 'Raw Cashew Nuts - W320',
      inputQuantity: 1000.0,
      outputProduct: 'Cashew Kernels - W320',
      outputQuantity: 285.5,
      yieldPercentage: 28.55,
      actualCost: 285500.00,
      standardCost: 280000.00,
      variance: 5500.00,
      workCenter: 'Processing Line A',
      operator: 'Ravi Kumar'
    },
    {
      id: 2,
      batchNumber: 'CB-2024-002',
      startDate: '2024-01-20',
      endDate: null,
      status: 'In Progress',
      inputMaterial: 'Raw Cashew Nuts - W240',
      inputQuantity: 800.0,
      outputProduct: 'Cashew Kernels - W240',
      outputQuantity: 0,
      yieldPercentage: 0,
      actualCost: 232000.00,
      standardCost: 230000.00,
      variance: 2000.00,
      workCenter: 'Processing Line B',
      operator: 'Meera Nair'
    },
    {
      id: 3,
      batchNumber: 'CB-2024-003',
      startDate: '2024-01-22',
      endDate: null,
      status: 'Started',
      inputMaterial: 'Raw Cashew Nuts - W450',
      inputQuantity: 1200.0,
      outputProduct: 'Cashew Kernels - W450',
      outputQuantity: 0,
      yieldPercentage: 0,
      actualCost: 145600.00,
      standardCost: 140000.00,
      variance: 5600.00,
      workCenter: 'Processing Line A',
      operator: 'Suresh Pillai'
    },
    {
      id: 4,
      batchNumber: 'CB-2024-004',
      startDate: '2024-01-18',
      endDate: '2024-01-21',
      status: 'Completed',
      inputMaterial: 'Raw Cashew Nuts - Mixed',
      inputQuantity: 500.0,
      outputProduct: 'Large White Pieces (LWP)',
      outputQuantity: 135.2,
      yieldPercentage: 27.04,
      actualCost: 87880.00,
      standardCost: 85000.00,
      variance: 2880.00,
      workCenter: 'Processing Line C',
      operator: 'Lakshmi Menon'
    },
    {
      id: 5,
      batchNumber: 'CB-2024-005',
      startDate: '2024-01-25',
      endDate: null,
      status: 'Planned',
      inputMaterial: 'Raw Cashew Nuts - W320',
      inputQuantity: 1500.0,
      outputProduct: 'Cashew Kernels - W320',
      outputQuantity: 0,
      yieldPercentage: 0,
      actualCost: 0,
      standardCost: 420000.00,
      variance: 0,
      workCenter: 'Processing Line A',
      operator: 'TBD'
    }
  ])

  // Authentication guard
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading batches...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
            <Button onClick={() => window.location.href = '/cashew/login'}>
              Login to Cashew ERP
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statuses = ['all', 'Planned', 'Started', 'In Progress', 'Completed', 'On Hold']
  
  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.inputMaterial.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.outputProduct.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || batch.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'In Progress': return 'bg-blue-100 text-blue-800'
      case 'Started': return 'bg-yellow-100 text-yellow-800'
      case 'Planned': return 'bg-gray-100 text-gray-800'
      case 'On Hold': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/cashew'}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                <Factory className="w-8 h-8 text-green-600" />
                Production Batches
              </h1>
              <p className="text-slate-600 mt-1">
                Track cashew processing from raw nuts to graded kernels
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              New Batch
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white shadow-sm border-0 ring-1 ring-slate-200">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search batches by number, material, or product..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                {statuses.map(status => (
                  <Button
                    key={status}
                    variant={selectedStatus === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatus(status)}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Batches List */}
        <div className="space-y-4">
          {filteredBatches.map((batch) => (
            <Card key={batch.id} className="bg-white shadow-sm hover:shadow-md transition-shadow border-0 ring-1 ring-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <CardTitle className="text-lg font-semibold text-slate-900">
                        {batch.batchNumber}
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        {batch.inputMaterial} → {batch.outputProduct}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(batch.status)}>
                      {batch.status}
                    </Badge>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Start Date
                    </p>
                    <p className="font-semibold text-slate-900">
                      {new Date(batch.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Duration
                    </p>
                    <p className="font-semibold text-slate-900">
                      {batch.endDate 
                        ? `${Math.ceil((new Date(batch.endDate).getTime() - new Date(batch.startDate).getTime()) / (1000 * 60 * 60 * 24))} days`
                        : 'Ongoing'
                      }
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-slate-500">Input Qty</p>
                    <p className="font-semibold text-slate-900">
                      {batch.inputQuantity.toLocaleString()} KG
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-slate-500">Output Qty</p>
                    <p className="font-semibold text-slate-900">
                      {batch.outputQuantity.toLocaleString()} KG
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-slate-500 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Yield %
                    </p>
                    <p className={`font-semibold ${batch.yieldPercentage > 0 ? 'text-green-700' : 'text-slate-900'}`}>
                      {batch.yieldPercentage > 0 ? `${batch.yieldPercentage.toFixed(2)}%` : 'TBD'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-slate-500">Cost Variance</p>
                    <p className={`font-semibold ${batch.variance > 0 ? 'text-red-700' : batch.variance < 0 ? 'text-green-700' : 'text-slate-900'}`}>
                      {batch.variance !== 0 ? `₹${Math.abs(batch.variance).toLocaleString()}` : '₹0'}
                      {batch.variance > 0 && ' (Over)'}
                      {batch.variance < 0 && ' (Under)'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-slate-500">Work Center: </span>
                      <span className="font-medium text-slate-700">{batch.workCenter}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Operator: </span>
                      <span className="font-medium text-slate-700">{batch.operator}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Actual Cost: </span>
                      <span className="font-semibold text-slate-900">₹{batch.actualCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Stats */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-0 ring-1 ring-green-200 shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-900">{batches.length}</p>
                <p className="text-green-700 text-sm">Total Batches</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">
                  {batches.filter(b => b.status === 'Completed').length}
                </p>
                <p className="text-blue-700 text-sm">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-900">
                  {batches.filter(b => ['Started', 'In Progress'].includes(b.status)).length}
                </p>
                <p className="text-yellow-700 text-sm">Active</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900">
                  {Math.round(
                    batches
                      .filter(b => b.yieldPercentage > 0)
                      .reduce((sum, b) => sum + b.yieldPercentage, 0) / 
                    batches.filter(b => b.yieldPercentage > 0).length * 100
                  ) / 100}%
                </p>
                <p className="text-purple-700 text-sm">Avg Yield</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}