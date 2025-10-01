'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Checkbox } from '@/components/ui/checkbox'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

export default function ProductTestPage() {
  const { organization } = useHERAAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [productData, setProductData] = useState({
    name: 'Professional Shampoo 250ml',
    code: 'SHMP-001',
    category: 'Hair Care',
    price: 89.99,
    currency: 'AED',
    description: 'Premium sulfate-free shampoo for all hair types',
    requires_inventory: true,
    reorder_point: 10,
    brand: 'HERA Professional',
    barcode: '123456789012'
  })
  
  const [products, setProducts] = useState<any[]>([])
  
  const handleCreateProduct = async () => {
    if (!organization?.id) {
      toast({
        title: 'No organization',
        description: 'Please select an organization first',
        variant: 'destructive'
      })
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/salon/products-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create product')
      }
      
      toast({
        title: 'Product created!',
        description: `${result.data.entity_name} has been added successfully`,
      })
      
      // Clear form
      setProductData({
        ...productData,
        name: '',
        code: `SKU-${Date.now()}`,
        description: ''
      })
      
      // Refresh products list
      await fetchProducts()
      
    } catch (error: any) {
      console.error('Error creating product:', error)
      toast({
        title: 'Failed to create product',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }
  
  const fetchProducts = async () => {
    if (!organization?.id) return
    
    try {
      const response = await fetch('/api/salon/products-v2?limit=10')
      const result = await response.json()
      
      if (response.ok && result.success) {
        setProducts(result.data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }
  
  const handleDeleteProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/salon/products-v2/${productId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast({
          title: 'Product archived',
          description: 'Product has been archived successfully'
        })
        await fetchProducts()
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      toast({
        title: 'Failed to archive product',
        variant: 'destructive'
      })
    }
  }
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Product Creation Test (HERA RPCs)</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create New Product</CardTitle>
          <CardDescription>
            This uses the new HERA RPC functions: hera_entity_upsert_v1, hera_dynamic_data_upsert_v1
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={productData.name}
                onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                placeholder="e.g., Professional Shampoo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="code">SKU Code</Label>
              <Input
                id="code"
                value={productData.code}
                onChange={(e) => setProductData({ ...productData, code: e.target.value })}
                placeholder="e.g., SHMP-001"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={productData.category}
                onChange={(e) => setProductData({ ...productData, category: e.target.value })}
                placeholder="e.g., Hair Care"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={productData.brand}
                onChange={(e) => setProductData({ ...productData, brand: e.target.value })}
                placeholder="e.g., HERA Professional"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Price (AED)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={productData.price}
                onChange={(e) => setProductData({ ...productData, price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                value={productData.barcode}
                onChange={(e) => setProductData({ ...productData, barcode: e.target.value })}
                placeholder="e.g., 123456789012"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reorder">Reorder Point</Label>
              <Input
                id="reorder"
                type="number"
                value={productData.reorder_point}
                onChange={(e) => setProductData({ ...productData, reorder_point: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="inventory"
                checked={productData.requires_inventory}
                onCheckedChange={(checked) => 
                  setProductData({ ...productData, requires_inventory: checked as boolean })
                }
              />
              <Label htmlFor="inventory" className="cursor-pointer">
                Track inventory for this product
              </Label>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={productData.description}
              onChange={(e) => setProductData({ ...productData, description: e.target.value })}
              placeholder="Product description..."
            />
          </div>
          
          <Button 
            onClick={handleCreateProduct} 
            disabled={loading || !productData.name}
            className="w-full"
          >
            {loading ? 'Creating...' : 'Create Product'}
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Products</CardTitle>
          <CardDescription>
            Products created using HERA entity system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No products yet. Create one above!</p>
          ) : (
            <div className="space-y-2">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{product.entity_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {product.entity_code} • {product.currency} {product.price || 0} • {product.category || 'General'}
                    </p>
                    {product.brand && (
                      <p className="text-xs text-muted-foreground">Brand: {product.brand}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    Archive
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-medium mb-2">Smart Codes Used:</h3>
        <ul className="text-sm space-y-1 font-mono">
          <li>Entity: HERA.SALON.CATALOG.PRODUCT.RETAIL.V1</li>
          <li>Price: HERA.SALON.CATALOG.PRODUCT.FIELD.PRICE.V1</li>
          <li>Brand: HERA.SALON.CATALOG.PRODUCT.FIELD.BRAND.V1</li>
          <li>Barcode: HERA.SALON.CATALOG.PRODUCT.FIELD.BARCODE.V1</li>
          <li>Inventory: HERA.SALON.INVENTORY.TRACKING.V1</li>
        </ul>
      </div>
    </div>
  )
}