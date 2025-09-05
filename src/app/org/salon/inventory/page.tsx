'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, AlertTriangle, TrendingDown, Plus, X } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { UniversalApiClient } from '@/lib/universal-api'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

const universalApi = new UniversalApiClient()

function SalonInventoryContent() {

  const { currentOrganization } = useMultiOrgAuth()
  const searchParams = useSearchParams()
  const action = searchParams.get('action')
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { toast } = useToast()

  // Form state for new product
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    sku: '',
    price: '',
    cost: '',
    stock: '',
    reorderPoint: '',
    supplier: ''
  })

  // Product categories
  const categories = [
    'Hair Care',
    'Hair Color',
    'Nail Care',
    'Skincare',
    'Styling Products',
    'Tools & Equipment',
    'Retail Products'
  ]

  // Load products on mount and refresh
  useEffect(() => {
    loadProducts()
  }, [refreshTrigger, currentOrganization])

  const loadProducts = async () => {
    if (!currentOrganization) return
    
    try {
      const response = await fetch(`/api/v1/salon/products?organization_id=${currentOrganization.id}`)
      if (response.ok) {
        const data = await response.json()
        // Config factory returns data as { products: [...], analytics: {...} }
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/v1/salon/products?organization_id=${currentOrganization?.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: currentOrganization?.id,
          entity_name: formData.name,
          entity_type: 'product',
          smart_code: 'HERA.SALON.PRODUCT.INVENTORY.v1',
          metadata: {
            category: formData.category,
            sku: formData.sku,
            description: formData.description
          },
          dynamic_fields: {
            price: parseFloat(formData.price),
            cost: parseFloat(formData.cost),
            stock_quantity: parseInt(formData.stock),
            reorder_point: parseInt(formData.reorderPoint),
            supplier: formData.supplier
          }
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product added successfully",
        })
        setShowAddModal(false)
        setFormData({
          name: '',
          category: '',
          description: '',
          sku: '',
          price: '',
          cost: '',
          stock: '',
          reorderPoint: '',
          supplier: ''
        })
        setRefreshTrigger(prev => prev + 1)
      } else {
        throw new Error('Failed to add product')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Transform products data for display
  const inventory = products.map((product: any) => {
    // Config factory merges dynamic fields directly into the object
    const stock = product.stock_quantity || 0
    const reorderPoint = product.reorder_point || 10
    
    let status = 'good'
    if (stock === 0) status = 'critical'
    else if (stock <= reorderPoint) status = 'warning'
    
    return {
      id: product.id,
      name: product.entity_name,
      stock: stock,
      reorderPoint: reorderPoint,
      status: status,
      category: product.metadata?.category || 'Uncategorized',
      price: product.price || 0,
      sku: product.metadata?.sku || product.entity_code || 'N/A'
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  
return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Inventory Management
          </h1>
          <p className="text-gray-600 mt-1">Track product stock levels and reorder points</p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
              <Package className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold">{inventory.filter(p => p.status === 'warning').length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold">{inventory.filter(p => p.status === 'critical').length}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inventory Value</p>
                <p className="text-2xl font-bold">
                  ${(inventory.reduce((sum, p) => sum + (p.stock * p.price), 0) / 1000).toFixed(1)}K
                </p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Product</th>
                  <th className="text-left py-3">SKU</th>
                  <th className="text-left py-3">Category</th>
                  <th className="text-center py-3">Stock</th>
                  <th className="text-center py-3">Reorder Point</th>
                  <th className="text-center py-3">Status</th>
                  <th className="text-center py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No products found. Click "Add Product" to get started.
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-3">{item.name}</td>
                      <td className="py-3 text-gray-600">{item.sku}</td>
                      <td className="py-3 text-gray-600">{item.category}</td>
                      <td className="py-3 text-center font-semibold">{item.stock}</td>
                      <td className="py-3 text-center">{item.reorderPoint}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <Button size="sm" variant="outline">Restock</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Product Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Professional Shampoo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g., SHMP-001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Retail Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost Price</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Initial Stock *</Label>
                <Input
                  id="stock"
                  type="number"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorderPoint">Reorder Point</Label>
                <Input
                  id="reorderPoint"
                  type="number"
                  value={formData.reorderPoint}
                  onChange={(e) => setFormData({ ...formData, reorderPoint: e.target.value })}
                  placeholder="10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Supplier name"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddModal(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                {loading ? 'Adding...' : 'Add Product'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )

}

export default function SalonInventoryPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto">Loading...</div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <SalonInventoryContent />
    </Suspense>
  )
}