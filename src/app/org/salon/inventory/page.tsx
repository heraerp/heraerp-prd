'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, AlertTriangle, TrendingDown, Plus } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export default function SalonInventoryPage() {
  const searchParams = useSearchParams()
  const action = searchParams.get('action')

  const inventory = [
    { id: 1, name: 'Professional Shampoo - Sulfate Free', stock: 45, reorderPoint: 15, status: 'good', category: 'Hair Care' },
    { id: 2, name: 'Moisturizing Conditioner', stock: 38, reorderPoint: 12, status: 'good', category: 'Hair Care' },
    { id: 3, name: 'Gel Polish - Ruby Red', stock: 8, reorderPoint: 8, status: 'warning', category: 'Nail Care' },
    { id: 4, name: 'Gentle Face Cleanser', stock: 3, reorderPoint: 10, status: 'critical', category: 'Skincare' },
    { id: 5, name: 'Hair Color - Blonde', stock: 12, reorderPoint: 5, status: 'good', category: 'Hair Color' }
  ]

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
        <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
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
                <p className="text-2xl font-bold">285</p>
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
                <p className="text-2xl font-bold">12</p>
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
                <p className="text-2xl font-bold">3</p>
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
                <p className="text-2xl font-bold">$18.7K</p>
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
                  <th className="text-left py-3">Category</th>
                  <th className="text-center py-3">Stock</th>
                  <th className="text-center py-3">Reorder Point</th>
                  <th className="text-center py-3">Status</th>
                  <th className="text-center py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">{item.name}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}