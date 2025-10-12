'use client'

import { useState, useEffect }
from 'react'
import { X, Save, Package, Ruler, DollarSign, Layers, AlertCircle }
from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle }
from '@/components/ui/dialog'
import { Button }
from '@/components/ui/button'
import { Input }
from '@/components/ui/input'
import { Label }
from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue
}
from '@/components/ui/select'
import { Textarea }
from '@/components/ui/textarea'
import { Alert, AlertDescription }
from '@/components/ui/alert'
import { universalApi }
from '@/lib/universal-api'


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

export default function EditProductModal({ open, onClose, product, organizationId, onSuccess
}: EditProductModalProps) {
  const [loading, setLoading] = useState(false)

const [error, setError] = useState('')

const [formData, setFormData] = useState({ entity_name: '', entity_code: '', category: '', sub_category: '', material: '', length_cm: 0, width_cm: 0, height_cm: 0, price: 0, cost: 0, stock_quantity: 0, reorder_point: 10, description: '' }) // Load product data when modal opens useEffect(() => { if (open && product) {
  setFormData({ entity_name: product.entity_name || '', entity_code: product.entity_code || '', category: product.category || '', sub_category: product.sub_category || '', material: product.material || '', length_cm: product.length_cm || 0, width_cm: product.width_cm || 0, height_cm: product.height_cm || 0, price: product.price || 0, cost: product.cost || 0, stock_quantity: product.stock_quantity || 0, reorder_point: product.reorder_point || 10, description: product.description || '' }) setError(''  ) }, [open, product])

const handleSubmit = async (e: React.FormEvent) => { e.preventDefault() setError('') if (!formData.entity_name) {
  setError('Product name is required') return } setLoading(true) try { universalApi.setOrganizationId(organizationId) // Update entity basic fields
  const updateResult = await universalApi.updateEntity(product.id, { entity_name: formData.entity_name, entity_code: formData.entity_code }) if (!updateResult.success) {
  throw new Error(updateResult.error || 'Failed to update product'  ) // Update dynamic fields
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
] // Set each dynamic field for (const field of dynamicFields) {
  await universalApi.setDynamicField( product.id, field.field_name, field.field_value_text || field.field_value_number, `HERA.FURNITURE.PRODUCT.DYN.${field.field_name.toUpperCase()}.V1`   ) // Success - close modal and refresh onSuccess?.() onClose()   } catch (err) {
  console.error('Error updating product:', err) setError('Failed to update product. Please try again.')   } finally {
    setLoading(false)
  }
} 
    return ( <Dialog open={open} onOpenChange={onClose}> <DialogContent className="max-w-2xl bg-[var(--color-body)] border-[var(--color-border)] text-[var(--color-text-primary)]"> <DialogHeader> <DialogTitle className="text-xl font-semibold text-[var(--color-text-primary)] flex items-center gap-2"> <Package className="h-5 w-5 text-[var(--color-icon-secondary)]" /> Edit Product </DialogTitle> </DialogHeader> {error && ( <Alert variant="destructive" className="bg-red-900/20 border-red-800"> <AlertCircle className="h-4 w-4" /> <AlertDescription>{error}</AlertDescription> </Alert> )} <form onSubmit={handleSubmit} className="bg-[var(--color-body)] space-y-6"> {/* Basic Information */} <div className="grid grid-cols-2 gap-4"> <div className="space-y-2"> <Label htmlFor="entity_name" className="bg-[var(--color-body)] text-[var(--color-text-secondary)]"> Product Name </Label> <Input id="entity_name" value={formData.entity_name} onChange={e => setFormData({ ...formData, entity_name: e.target.value })} className="bg-[var(--color-body)] border-[var(--color-border)] text-[var(--color-text-primary)]" required /> </div> <div className="space-y-2"> <Label htmlFor="entity_code" className="bg-[var(--color-body)] text-[var(--color-text-secondary)]"> SKU Code </Label> <Input id="entity_code" value={formData.entity_code} onChange={e => setFormData({ ...formData, entity_code: e.target.value })} className="bg-[var(--color-body)] border-[var(--color-border)] text-[var(--color-text-primary)] font-mono" placeholder="FUR-XXX-XXX" required /> </div> </div> {/* Category and Material */} <div className="grid grid-cols-2 gap-4"> <div className="space-y-2"> <Label htmlFor="category" className="bg-[var(--color-body)] text-[var(--color-text-secondary)]"> Category </Label> <Select value={formData.category} onValueChange={value => setFormData({ ...formData, category: value })} > <SelectTrigger id="category" className="bg-[var(--color-body)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-accent" > <SelectValue placeholder="Select category" /> </SelectTrigger> <SelectContent className="bg-[var(--color-body)] border-[var(--color-border)] z-[9999]"> {categories.map(cat => ( <SelectItem key={cat.value} value={cat.value} className="text-gray-200 hover:bg-[var(--color-sidebar)]/30 focus:bg-muted-foreground/10 focus:text-[var(--color-text-primary)] cursor-pointer" > {cat.label} </SelectItem> ))} </SelectContent> </Select> </div> <div className="space-y-2"> <Label htmlFor="material" className="bg-[var(--color-body)] text-[var(--color-text-secondary)]"> Material </Label> <Select value={formData.material} onValueChange={value => setFormData({ ...formData, material: value })} > <SelectTrigger id="material" className="bg-[var(--color-body)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-accent" > <SelectValue placeholder="Select material" /> </SelectTrigger> <SelectContent className="bg-[var(--color-body)] border-[var(--color-border)] z-[9999]"> {materials.map(mat => ( <SelectItem key={mat.value} value={mat.value} className="text-gray-200 hover:bg-[var(--color-sidebar)]/30 focus:bg-muted-foreground/10 focus:text-[var(--color-text-primary)] cursor-pointer" > {mat.label} </SelectItem> ))} </SelectContent> </Select> </div> </div> {/* Dimensions */} <div className="space-y-2"> <Label className="text-[var(--color-text-secondary)] flex items-center gap-2"> <Ruler className="h-4 w-4" /> Dimensions (in cm) </Label> <div className="grid grid-cols-3 gap-4"> <div> <Label htmlFor="length" className="bg-[var(--color-body)] text-xs text-[var(--color-text-secondary)]"> Length </Label> <Input id="length" type="number" min="0" value={formData.length_cm} onChange={e => setFormData({ ...formData, length_cm: parseFloat(e.target.value) || 0 }  ) className="bg-[var(--color-body)] border-[var(--color-border)] text-[var(--color-text-primary)]" /> </div> <div> <Label htmlFor="width" className="bg-[var(--color-body)] text-xs text-[var(--color-text-secondary)]"> Width </Label> <Input id="width" type="number" min="0" value={formData.width_cm} onChange={e => setFormData({ ...formData, width_cm: parseFloat(e.target.value) || 0 }  ) className="bg-[var(--color-body)] border-[var(--color-border)] text-[var(--color-text-primary)]" /> </div> <div> <Label htmlFor="height" className="bg-[var(--color-body)] text-xs text-[var(--color-text-secondary)]"> Height </Label> <Input id="height" type="number" min="0" value={formData.height_cm} onChange={e => setFormData({ ...formData, height_cm: parseFloat(e.target.value) || 0 }  ) className="bg-[var(--color-body)] border-[var(--color-border)] text-[var(--color-text-primary)]" /> </div> </div> </div> {/* Pricing and Inventory */} <div className="grid grid-cols-2 gap-4"> <div className="space-y-2"> <Label htmlFor="price" className="bg-[var(--color-body)] text-[var(--color-text-secondary)] flex items-center gap-2"> <DollarSign className="h-4 w-4" /> Selling Price </Label> <Input id="price" type="number" min="0" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} className="bg-[var(--color-body)] border-[var(--color-border)] text-[var(--color-text-primary)]" required /> </div> <div className="space-y-2"> <Label htmlFor="cost" className="bg-[var(--color-body)] text-[var(--color-text-secondary)]"> Cost Price </Label> <Input id="cost" type="number" min="0" step="0.01" value={formData.cost} onChange={e => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })} className="bg-[var(--color-body)] border-[var(--color-border)] text-[var(--color-text-primary)]" /> </div> </div> <div className="grid grid-cols-2 gap-4"> <div className="space-y-2"> <Label htmlFor="stock" className="bg-[var(--color-body)] text-[var(--color-text-secondary)] flex items-center gap-2"> <Layers className="h-4 w-4" /> Stock Quantity </Label> <Input id="stock" type="number" min="0" value={formData.stock_quantity} onChange={e => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 }  ) className="bg-[var(--color-body)] border-[var(--color-border)] text-[var(--color-text-primary)]" /> </div> <div className="space-y-2"> <Label htmlFor="reorder" className="bg-[var(--color-body)] text-[var(--color-text-secondary)]"> Reorder Point </Label> <Input id="reorder" type="number" min="0" value={formData.reorder_point} onChange={e => setFormData({ ...formData, reorder_point: parseInt(e.target.value) || 0 }  ) className="bg-[var(--color-body)] border-[var(--color-border)] text-[var(--color-text-primary)]" /> </div> </div> {/* Description */} <div className="space-y-2"> <Label htmlFor="description" className="bg-[var(--color-body)] text-[var(--color-text-secondary)]"> Description </Label> <Textarea id="description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="bg-[var(--color-body)] border-[var(--color-border)] text-[var(--color-text-primary)] resize-none" placeholder="Product features, specifications, and details..." /> </div> {/* Actions */} <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]"> <Button type="button" variant="outline" onClick={onClose} className="bg-transparent border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-body)] hover:text-[var(--color-text-primary)]" > Cancel </Button> <Button type="submit" disabled={loading} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-[var(--color-text-primary)] border-0" > {loading ? ( <> <div className="bg-[var(--color-body)] animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> Saving... </> ) : ( <> <Save className="h-4 w-4 mr-2" /> Save Changes </> )} </Button> </div> </form> </DialogContent> </Dialog> )
}
