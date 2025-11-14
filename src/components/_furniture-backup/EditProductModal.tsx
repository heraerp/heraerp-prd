'use client'

import React from 'react'
import { X, Save, Package, Ruler, DollarSign, Layers, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { universalApi } from '@/lib/universal-api'

interface EditProductModalProps {
  open: boolean
  onClose: () => void
  product: any
  organizationId: string
  onSuccess?: () => void
}

const categories = [
  { value: 'office', label: 'Office Furniture' },
  { value: 'seating', label: 'Seating' },
  { value: 'tables', label: 'Tables' },
  { value: 'storage', label: 'Storage' },
  { value: 'beds', label: 'Beds' }
]

const materials = [
  { value: 'wood', label: 'Wood' },
  { value: 'metal', label: 'Metal' },
  { value: 'plastic', label: 'Plastic' },
  { value: 'fabric', label: 'Fabric' },
  { value: 'leather', label: 'Leather' },
  { value: 'glass', label: 'Glass' }
]

export default function EditProductModal({ 
  open, 
  onClose, 
  product, 
  organizationId, 
  onSuccess 
}: EditProductModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    entity_name: '',
    entity_code: '',
    category: '',
    sub_category: '',
    material: '',
    length_cm: 0,
    width_cm: 0,
    height_cm: 0,
    price: 0,
    cost: 0,
    stock_quantity: 0,
    reorder_point: 10,
    description: ''
  })

  // Load product data when modal opens
  useEffect(() => {
    if (open && product) {
      setFormData({
        entity_name: product.entity_name || '',
        entity_code: product.entity_code || '',
        category: product.category || '',
        sub_category: product.sub_category || '',
        material: product.material || '',
        length_cm: product.length_cm || 0,
        width_cm: product.width_cm || 0,
        height_cm: product.height_cm || 0,
        price: product.price || 0,
        cost: product.cost || 0,
        stock_quantity: product.stock_quantity || 0,
        reorder_point: product.reorder_point || 10,
        description: product.description || ''
      })
      setError('')
    }
  }, [open, product])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.entity_name) {
      setError('Product name is required')
      return
    }

    setLoading(true)

    try {
      universalApi.setOrganizationId(organizationId)

      // Update entity basic fields
      const updateResult = await universalApi.updateEntity(product.id, {
        entity_name: formData.entity_name,
        entity_code: formData.entity_code
      })

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update product')
      }

      // Update dynamic fields
      const dynamicFields = [
        { field_name: 'category', field_value_text: formData.category },
        { field_name: 'sub_category', field_value_text: formData.sub_category },
        { field_name: 'material', field_value_text: formData.material },
        { field_name: 'length_cm', field_value_number: formData.length_cm },
        { field_name: 'width_cm', field_value_number: formData.width_cm },
        { field_name: 'height_cm', field_value_number: formData.height_cm },
        { field_name: 'price', field_value_number: formData.price },
        { field_name: 'cost', field_value_number: formData.cost },
        { field_name: 'stock_quantity', field_value_number: formData.stock_quantity },
        { field_name: 'reorder_point', field_value_number: formData.reorder_point },
        { field_name: 'description', field_value_text: formData.description }
      ]

      // Set each dynamic field
      for (const field of dynamicFields) {
        await universalApi.setDynamicField(
          product.id,
          field.field_name,
          field.field_value_text || field.field_value_number,
          `HERA.FURNITURE.PRODUCT.DYN.${field.field_name.toUpperCase()}.V1`
        )
      }

      // Success - close modal and refresh
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Error updating product:', err)
      setError('Failed to update product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Edit Product
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="entity_name">Product Name *</Label>
              <Input
                id="entity_name"
                value={formData.entity_name}
                onChange={(e) => setFormData({ ...formData, entity_name: e.target.value })}
                placeholder="Enter product name"
                required
              />
            </div>
            <div>
              <Label htmlFor="entity_code">Product Code</Label>
              <Input
                id="entity_code"
                value={formData.entity_code}
                onChange={(e) => setFormData({ ...formData, entity_code: e.target.value })}
                placeholder="SKU or product code"
              />
            </div>
          </div>

          {/* Category and Material */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="material">Material</Label>
              <Select value={formData.material} onValueChange={(value) => setFormData({ ...formData, material: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((mat) => (
                    <SelectItem key={mat.value} value={mat.value}>
                      {mat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dimensions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              <Label>Dimensions (cm)</Label>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="length_cm">Length</Label>
                <Input
                  id="length_cm"
                  type="number"
                  value={formData.length_cm}
                  onChange={(e) => setFormData({ ...formData, length_cm: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="width_cm">Width</Label>
                <Input
                  id="width_cm"
                  type="number"
                  value={formData.width_cm}
                  onChange={(e) => setFormData({ ...formData, width_cm: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="height_cm">Height</Label>
                <Input
                  id="height_cm"
                  type="number"
                  value={formData.height_cm}
                  onChange={(e) => setFormData({ ...formData, height_cm: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <Label>Pricing</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cost">Cost Price</Label>
                <Input
                  id="cost"
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="price">Selling Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <Label>Inventory</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock_quantity">Current Stock</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="reorder_point">Reorder Point</Label>
                <Input
                  id="reorder_point"
                  type="number"
                  value={formData.reorder_point}
                  onChange={(e) => setFormData({ ...formData, reorder_point: parseInt(e.target.value) || 0 })}
                  placeholder="10"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Product description"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Product
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}