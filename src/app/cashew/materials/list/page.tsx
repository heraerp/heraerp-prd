/**
 * Cashew Materials List Page
 * Smart Code: HERA.CASHEW.MATERIALS.LIST.v1
 * 
 * Master data management for cashew manufacturing materials
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useCashewAuth } from '@/components/auth/CashewAuthProvider'
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Download,
  ArrowLeft,
  Filter
} from 'lucide-react'

export default function CashewMaterialsListPage() {
  const { user, organization, isAuthenticated, isLoading } = useCashewAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Sample materials data for cashew manufacturing
  const [materials, setMaterials] = useState([
    {
      id: 1,
      code: 'RN-W320',
      name: 'Raw Cashew Nuts - W320 Grade',
      category: 'Raw Materials',
      unit: 'KG',
      currentStock: 5200.0,
      standardCost: 285.50,
      supplier: 'Kerala Farmers Cooperative',
      status: 'Active'
    },
    {
      id: 2,
      code: 'RN-W240',
      name: 'Raw Cashew Nuts - W240 Grade',
      category: 'Raw Materials',
      unit: 'KG',
      currentStock: 3800.0,
      standardCost: 325.75,
      supplier: 'Coastal Cashew Traders',
      status: 'Active'
    },
    {
      id: 3,
      code: 'PKG-BAG-10KG',
      name: 'Packaging Bags - 10KG Capacity',
      category: 'Packaging',
      unit: 'PCS',
      currentStock: 1250.0,
      standardCost: 12.50,
      supplier: 'Malabar Packaging Co.',
      status: 'Active'
    },
    {
      id: 4,
      code: 'PKG-LABEL-EXPORT',
      name: 'Export Quality Labels',
      category: 'Packaging',
      unit: 'PCS',
      currentStock: 5000.0,
      standardCost: 0.85,
      supplier: 'Print Solutions Ltd',
      status: 'Active'
    },
    {
      id: 5,
      code: 'CHEM-STEAM-ENHANCER',
      name: 'Steam Processing Enhancer',
      category: 'Consumables',
      unit: 'LTR',
      currentStock: 125.0,
      standardCost: 45.00,
      supplier: 'Agro Chemicals India',
      status: 'Active'
    },
    {
      id: 6,
      code: 'FUEL-BIOMASS',
      name: 'Cashew Shell Biomass Fuel',
      category: 'Fuel',
      unit: 'TON',
      currentStock: 12.5,
      standardCost: 2800.00,
      supplier: 'Renewable Energy Co-op',
      status: 'Active'
    }
  ])

  // Authentication guard
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading materials...</p>
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

  const categories = ['all', 'Raw Materials', 'Packaging', 'Consumables', 'Fuel']
  
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory
    return matchesSearch && matchesCategory
  })

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
                <Package className="w-8 h-8 text-blue-600" />
                Materials Master
              </h1>
              <p className="text-slate-600 mt-1">
                Manage raw materials, packaging, and consumables for cashew processing
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => window.location.href = '/cashew/materials/new'}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Material
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
                    placeholder="Search materials by name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <Card key={material.id} className="bg-white shadow-sm hover:shadow-md transition-shadow border-0 ring-1 ring-slate-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-slate-900 mb-1">
                      {material.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {material.code}
                      </Badge>
                      <Badge 
                        variant={material.status === 'Active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {material.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <CardDescription className="text-slate-600">
                  Category: {material.category} | Unit: {material.unit}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Current Stock</p>
                      <p className="font-semibold text-slate-900">
                        {material.currentStock.toLocaleString()} {material.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Standard Cost</p>
                      <p className="font-semibold text-slate-900">
                        ₹{material.standardCost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-slate-500 text-sm">Supplier</p>
                    <p className="text-slate-700 text-sm">{material.supplier}</p>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Stats */}
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-0 ring-1 ring-blue-200 shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-900">{materials.length}</p>
                <p className="text-blue-700 text-sm">Total Materials</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900">
                  {materials.filter(m => m.category === 'Raw Materials').length}
                </p>
                <p className="text-green-700 text-sm">Raw Materials</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900">
                  ₹{materials.reduce((sum, m) => sum + (m.currentStock * m.standardCost), 0).toLocaleString()}
                </p>
                <p className="text-purple-700 text-sm">Total Inventory Value</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-900">
                  {materials.filter(m => m.status === 'Active').length}
                </p>
                <p className="text-amber-700 text-sm">Active Materials</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}