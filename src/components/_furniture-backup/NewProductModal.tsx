'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Plus, Package, X, Info, DollarSign, Ruler, Palette, Shield, BarChart, Tag, Image as ImageIcon, Upload, Save } from 'lucide-react'
import { universalApi } from '@/lib/universal-api'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface NewProductModalProps {
  trigger?: React.ReactNode
  onProductCreated?: (productId: string) => void
  organizationId?: string
  organizationName?: string
}

const productCategories = [
  { value: 'seating', label: 'Seating', icon: '🪑' },
  { value: 'tables', label: 'Tables', icon: '🏓' },
  { value: 'storage', label: 'Storage', icon: '📦' },
  { value: 'office', label: 'Office', icon: '💼' },
  { value: 'beds', label: 'Beds', icon: '🛏️' },
  { value: 'outdoor', label: 'Outdoor', icon: '🌳' },
  { value: 'decor', label: 'Decor', icon: '🖼️' },
  { value: 'lighting', label: 'Lighting', icon: '💡' }
]

const materials = [
  'wood', 'metal', 'fabric', 'leather', 'glass', 'plastic', 'marble', 'granite', 'veneer', 'composite'
]

const finishes = [
  'matte', 'glossy', 'satin', 'polished', 'brushed', 'natural', 'painted', 'stained', 'lacquered', 'textured'
]

export default function NewProductModal({ 
  trigger, 
  onProductCreated, 
  organizationId: propOrgId, 
  organizationName 
}: NewProductModalProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  
  const [productData, setProductData] = useState({
    name: '',
    sku: '',
    category: '',
    subCategory: '',
    brand: '',
    description: '',
    costPrice: 0,
    sellingPrice: 0,
    taxRate: 5,
    discountPercent: 0,
    stockQuantity: 0,
    minStockLevel: 5,
    reorderQuantity: 10,
    location: '',
    material: '',
    finish: '',
    color: '',
    lengthCm: 0,
    widthCm: 0,
    heightCm: 0,
    weightKg: 0,
    warranty: '1 year',
    isActive: true,
    isFeatured: false,
    tags: [] as string[],
    notes: ''
  })
  
  const [newTag, setNewTag] = useState('')

  const handleChange = (field: string, value: any) => {
    setProductData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddTag = () => {
    if (newTag.trim() && !productData.tags.includes(newTag.trim())) {
      setProductData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setProductData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }

  const generateSKU = () => {
    const categoryPrefix = productData.category.slice(0, 3).toUpperCase()
    const timestamp = Date.now().toString().slice(-6)
    const sku = `FRN-${categoryPrefix}-${timestamp}`
    handleChange('sku', sku)
  }

  const calculateMargin = () => {
    if (productData.costPrice && productData.sellingPrice) {
      const margin = ((productData.sellingPrice - productData.costPrice) / productData.sellingPrice) * 100
      return margin.toFixed(1)
    }
    return '0'
  }

  const handleSubmit = async () => {
    if (!productData.name.trim()) {
      toast({ title: 'Validation Error', description: 'Product name is required.', variant: 'destructive' })
      return
    }
    
    if (!productData.sku.trim()) {
      toast({ title: 'Validation Error', description: 'SKU is required.', variant: 'destructive' })
      return
    }

    setIsSubmitting(true)

    try {
      if (propOrgId) {
        universalApi.setOrganizationId(propOrgId)
      }

      const result = await universalApi.createEntity({
        entity_type: 'product',
        entity_name: productData.name,
        entity_code: productData.sku,
        smart_code: 'HERA.FURNITURE.PRODUCT.V1',
        description: productData.description
      })

      if (result.success && result.data) {
        const entityId = result.data

        // Set dynamic fields
        const dynamicFields = [
          { field_name: 'category', field_value_text: productData.category },
          { field_name: 'sub_category', field_value_text: productData.subCategory },
          { field_name: 'brand', field_value_text: productData.brand },
          { field_name: 'cost_price', field_value_number: productData.costPrice },
          { field_name: 'selling_price', field_value_number: productData.sellingPrice },
          { field_name: 'tax_rate', field_value_number: productData.taxRate },
          { field_name: 'stock_quantity', field_value_number: productData.stockQuantity },
          { field_name: 'min_stock_level', field_value_number: productData.minStockLevel },
          { field_name: 'material', field_value_text: productData.material },
          { field_name: 'finish', field_value_text: productData.finish },
          { field_name: 'color', field_value_text: productData.color },
          { field_name: 'length_cm', field_value_number: productData.lengthCm },
          { field_name: 'width_cm', field_value_number: productData.widthCm },
          { field_name: 'height_cm', field_value_number: productData.heightCm },
          { field_name: 'weight_kg', field_value_number: productData.weightKg },
          { field_name: 'warranty', field_value_text: productData.warranty },
          { field_name: 'is_active', field_value_boolean: productData.isActive },
          { field_name: 'is_featured', field_value_boolean: productData.isFeatured },
          { field_name: 'notes', field_value_text: productData.notes }
        ]

        for (const field of dynamicFields) {
          await universalApi.setDynamicField(
            entityId,
            field.field_name,
            field.field_value_text || field.field_value_number || field.field_value_boolean,
            `HERA.FURNITURE.PRODUCT.DYN.${field.field_name.toUpperCase()}.V1`
          )
        }

        toast({
          title: 'Success',
          description: 'Product created successfully!'
        })

        onProductCreated?.(entityId)
        setIsOpen(false)
        
        // Reset form
        setProductData({
          name: '',
          sku: '',
          category: '',
          subCategory: '',
          brand: '',
          description: '',
          costPrice: 0,
          sellingPrice: 0,
          taxRate: 5,
          discountPercent: 0,
          stockQuantity: 0,
          minStockLevel: 5,
          reorderQuantity: 10,
          location: '',
          material: '',
          finish: '',
          color: '',
          lengthCm: 0,
          widthCm: 0,
          heightCm: 0,
          weightKg: 0,
          warranty: '1 year',
          isActive: true,
          isFeatured: false,
          tags: [],
          notes: ''
        })
      } else {
        throw new Error(result.error || 'Failed to create product')
      }
    } catch (error) {
      console.error('Error creating product:', error)
      toast({
        title: 'Error',
        description: 'Failed to create product. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Product
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Create New Furniture Product
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="physical">Physical</TabsTrigger>
            <TabsTrigger value="additional">Additional</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={productData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Luxury Office Chair"
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU *</Label>
                <div className="flex gap-2">
                  <Input
                    id="sku"
                    value={productData.sku}
                    onChange={(e) => handleChange('sku', e.target.value)}
                    placeholder="Product SKU"
                  />
                  <Button type="button" variant="outline" onClick={generateSKU}>
                    Generate
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={productData.category} onValueChange={(value) => handleChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {productCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={productData.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                  placeholder="Brand name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={productData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Product description"
                rows={4}
              />
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="costPrice">Cost Price</Label>
                <Input
                  id="costPrice"
                  type="number"
                  value={productData.costPrice}
                  onChange={(e) => handleChange('costPrice', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="sellingPrice">Selling Price</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  value={productData.sellingPrice}
                  onChange={(e) => handleChange('sellingPrice', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {productData.costPrice > 0 && productData.sellingPrice > 0 && (
              <Card className="p-4">
                <div className="flex justify-between items-center">
                  <span>Profit Margin:</span>
                  <span className="font-semibold">{calculateMargin()}%</span>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  value={productData.taxRate}
                  onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
                  placeholder="5"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="stockQuantity">Stock Quantity</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  value={productData.stockQuantity}
                  onChange={(e) => handleChange('stockQuantity', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="minStockLevel">Min Stock Level</Label>
                <Input
                  id="minStockLevel"
                  type="number"
                  value={productData.minStockLevel}
                  onChange={(e) => handleChange('minStockLevel', parseInt(e.target.value) || 0)}
                  placeholder="5"
                  min="0"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="physical" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="material">Material</Label>
                <Select value={productData.material} onValueChange={(value) => handleChange('material', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((material) => (
                      <SelectItem key={material} value={material}>
                        {material.charAt(0).toUpperCase() + material.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="finish">Finish</Label>
                <Select value={productData.finish} onValueChange={(value) => handleChange('finish', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select finish" />
                  </SelectTrigger>
                  <SelectContent>
                    {finishes.map((finish) => (
                      <SelectItem key={finish} value={finish}>
                        {finish.charAt(0).toUpperCase() + finish.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={productData.color}
                  onChange={(e) => handleChange('color', e.target.value)}
                  placeholder="e.g., Walnut Brown"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Dimensions (cm)</Label>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="lengthCm" className="text-sm">Length</Label>
                  <Input
                    id="lengthCm"
                    type="number"
                    value={productData.lengthCm}
                    onChange={(e) => handleChange('lengthCm', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label htmlFor="widthCm" className="text-sm">Width</Label>
                  <Input
                    id="widthCm"
                    type="number"
                    value={productData.widthCm}
                    onChange={(e) => handleChange('widthCm', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label htmlFor="heightCm" className="text-sm">Height</Label>
                  <Input
                    id="heightCm"
                    type="number"
                    value={productData.heightCm}
                    onChange={(e) => handleChange('heightCm', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label htmlFor="weightKg" className="text-sm">Weight (kg)</Label>
                  <Input
                    id="weightKg"
                    type="number"
                    value={productData.weightKg}
                    onChange={(e) => handleChange('weightKg', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="additional" className="space-y-4">
            <div>
              <Label htmlFor="warranty">Warranty</Label>
              <Input
                id="warranty"
                value={productData.warranty}
                onChange={(e) => handleChange('warranty', e.target.value)}
                placeholder="e.g., 1 year"
              />
            </div>

            <div className="space-y-3">
              <Label>Status</Label>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={productData.isActive}
                    onCheckedChange={(checked) => handleChange('isActive', checked)}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isFeatured"
                    checked={productData.isFeatured}
                    onCheckedChange={(checked) => handleChange('isFeatured', checked)}
                  />
                  <Label htmlFor="isFeatured">Featured</Label>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={productData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Internal notes, care instructions, etc."
                rows={3}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Product
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}