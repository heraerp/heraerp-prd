/**
 * Cashew Products List Page
 * Smart Code: HERA.CASHEW.PRODUCTS.LIST.v1
 * 
 * Product master for cashew kernel grades and finished products
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useCashewAuth } from '@/components/auth/CashewAuthProvider'
import { 
  Package2, 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Download,
  ArrowLeft,
  Star
} from 'lucide-react'

export default function CashewProductsListPage() {
  const { user, organization, isAuthenticated, isLoading } = useCashewAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('all')

  // Sample cashew kernel products
  const [products, setProducts] = useState([
    {
      id: 1,
      code: 'CK-W320',
      name: 'Cashew Kernels - W320 Grade',
      grade: 'W320',
      description: 'Premium white whole kernels, 320 pieces per pound',
      unit: 'KG',
      standardCost: 850.00,
      sellingPrice: 950.00,
      packagingSizes: ['1kg', '10kg', '25kg'],
      exportGrade: 'Premium',
      status: 'Active',
      popularityRating: 5
    },
    {
      id: 2,
      code: 'CK-W240',
      name: 'Cashew Kernels - W240 Grade',
      grade: 'W240',
      description: 'Superior white whole kernels, 240 pieces per pound',
      unit: 'KG',
      standardCost: 920.00,
      sellingPrice: 1050.00,
      packagingSizes: ['1kg', '10kg', '25kg'],
      exportGrade: 'Premium',
      status: 'Active',
      popularityRating: 5
    },
    {
      id: 3,
      code: 'CK-W450',
      name: 'Cashew Kernels - W450 Grade',
      grade: 'W450',
      description: 'Good quality white whole kernels, 450 pieces per pound',
      unit: 'KG',
      standardCost: 780.00,
      sellingPrice: 870.00,
      packagingSizes: ['1kg', '10kg', '25kg'],
      exportGrade: 'Standard',
      status: 'Active',
      popularityRating: 4
    },
    {
      id: 4,
      code: 'CK-LWP',
      name: 'Large White Pieces (LWP)',
      grade: 'LWP',
      description: 'Large broken white kernel pieces',
      unit: 'KG',
      standardCost: 650.00,
      sellingPrice: 720.00,
      packagingSizes: ['1kg', '10kg', '25kg'],
      exportGrade: 'Standard',
      status: 'Active',
      popularityRating: 3
    },
    {
      id: 5,
      code: 'CK-SWP',
      name: 'Small White Pieces (SWP)',
      grade: 'SWP',
      description: 'Small broken white kernel pieces',
      unit: 'KG',
      standardCost: 580.00,
      sellingPrice: 640.00,
      packagingSizes: ['1kg', '10kg', '25kg'],
      exportGrade: 'Commercial',
      status: 'Active',
      popularityRating: 3
    },
    {
      id: 6,
      code: 'CK-DW',
      name: 'Dessert Wholes (DW)',
      grade: 'DW',
      description: 'Desert quality whole kernels with light spots',
      unit: 'KG',
      standardCost: 720.00,
      sellingPrice: 800.00,
      packagingSizes: ['1kg', '10kg', '25kg'],
      exportGrade: 'Commercial',
      status: 'Active',
      popularityRating: 4
    }
  ])

  // Authentication guard
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading products...</p>
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

  const grades = ['all', 'W240', 'W320', 'W450', 'LWP', 'SWP', 'DW']
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.grade.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGrade = selectedGrade === 'all' || product.grade === selectedGrade
    return matchesSearch && matchesGrade
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
                <span className="text-3xl">🥜</span>
                Products Master
              </h1>
              <p className="text-slate-600 mt-1">
                Manage cashew kernel grades and finished products
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
              onClick={() => window.location.href = '/cashew/products/new'}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
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
                    placeholder="Search products by name, code, or grade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                {grades.map(grade => (
                  <Button
                    key={grade}
                    variant={selectedGrade === grade ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedGrade(grade)}
                  >
                    {grade}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="bg-white shadow-sm hover:shadow-md transition-shadow border-0 ring-1 ring-slate-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-slate-900 mb-1">
                      {product.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {product.code}
                      </Badge>
                      <Badge 
                        variant={product.exportGrade === 'Premium' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {product.exportGrade}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-3 h-3 ${i < product.popularityRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                </div>
                
                <CardDescription className="text-slate-600">
                  {product.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Standard Cost</p>
                      <p className="font-semibold text-slate-900">
                        ₹{product.standardCost.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Selling Price</p>
                      <p className="font-semibold text-green-700">
                        ₹{product.sellingPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-slate-500 text-sm">Available Sizes</p>
                    <div className="flex gap-1 mt-1">
                      {product.packagingSizes.map(size => (
                        <Badge key={size} variant="outline" className="text-xs">
                          {size}
                        </Badge>
                      ))}
                    </div>
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
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-0 ring-1 ring-amber-200 shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-amber-900">{products.length}</p>
                <p className="text-amber-700 text-sm">Total Products</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900">
                  {products.filter(p => p.exportGrade === 'Premium').length}
                </p>
                <p className="text-green-700 text-sm">Premium Grades</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">
                  ₹{Math.round(products.reduce((sum, p) => sum + p.sellingPrice, 0) / products.length)}
                </p>
                <p className="text-blue-700 text-sm">Avg Selling Price</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900">
                  {Math.round(products.reduce((sum, p) => sum + p.popularityRating, 0) / products.length * 10) / 10}
                </p>
                <p className="text-purple-700 text-sm">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}