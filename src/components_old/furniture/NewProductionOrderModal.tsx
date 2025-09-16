'use client'

import { useState, useEffect }
from 'react'
import { X, Plus, Trash2, Calendar, Factory, Package, AlertCircle, Clock }
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
import { Badge }
from '@/components/ui/badge'
import { Alert, AlertDescription }
from '@/components/ui/alert'
import { format }
from 'date-fns'
import { universalApi }
from '@/lib/universal-api'
import { useUniversalEndpointData }
from '@/lib/dna/patterns/universal-api-endpoint-pattern'
import { cn }
from '@/lib/utils'


interface NewProductionOrderModalProps {
  open: boolean
  onClose: () => void
  organizationId: string
  onSuccess?: () => void
}

interface OrderLine {
  productId: string
  productName?: string
  quantity: number
  unitTime?: number // Production time per unit
}

export default function NewProductionOrderModal({ open, onClose, organizationId, onSuccess
}: NewProductionOrderModalProps) {
  const [loading, setLoading] = useState(false)

const [error, setError] = useState('')

const [formData, setFormData] = useState({ productId: '', workCenterId: '', plannedQuantity: 1, plannedStartDate: format(new Date(), 'yyyy-MM-dd'), plannedEndDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), priority: 'medium', batchNumber: '', notes: '' }) // Load data using API endpoint const { data: responseData } = useUniversalEndpointData({ endpoint: '/api/furniture/production', organizationId, enabled: open && !!organizationId })

const products = responseData?.entities?.filter((e: any) => e.entity_type === 'product') || [] const workCenters = responseData?.entities?.filter((e: any) => e.entity_type === 'work_center') || [] // Generate batch number const generateBatchNumber = () => { const date = new Date()

const year = date.getFullYear().toString().slice(-2)

const month = (date.getMonth() + 1).toString().padStart(2, '0')

const day = date.getDate().toString().padStart(2, '0')

const random = Math.random().toString(36).substring(2, 6).toUpperCase() return `BATCH-${year}${month}${day}-${random}` } // Reset form when modal opens useEffect(() => { if (open) {
  setFormData({ productId: '', workCenterId: '', plannedQuantity: 1, plannedStartDate: format(new Date(), 'yyyy-MM-dd'), plannedEndDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), priority: 'medium', batchNumber: generateBatchNumber(), notes: '' }) setError(''  ) }, [open])

const generateOrderCode = () => { const timestamp = Date.now().toString(36).toUpperCase() return `PROD-${timestamp}` }

const handleSubmit = async (e: React.FormEvent) => { e.preventDefault() setError('') if (!formData.productId) {
  setError('Please select a product to produce') return } if (!formData.workCenterId) {
  setError('Please select a work center') return } setLoading(true) try { universalApi.setOrganizationId(organizationId) // Create the production order transaction const orderData = { organization_id: organizationId, transaction_type: 'production_order' as const, transaction_code: generateOrderCode(), transaction_date: new Date().toISOString(), source_entity_id: formData.productId, // Product to produce target_entity_id: formData.workCenterId, // Work center total_amount: formData.plannedQuantity, description: `Production order for ${products.find(p => p.id === formData.productId)?.entity_name}`, smart_code: 'HERA.FURNITURE.MFG.PROD.ORDER.v1', metadata: { batch_number: formData.batchNumber, planned_start: formData.plannedStartDate, planned_end: formData.plannedEndDate, priority: formData.priority, notes: formData.notes, status: 'planned', created_at: new Date().toISOString(  ) } // Create order with line items const result = await universalApi.createTransaction({ ...orderData, line_items: [ { organization_id: organizationId, line_number: 1, entity_id: formData.productId, quantity: formData.plannedQuantity.toString(), unit_price: 0, // Internal production line_amount: 0, description: `Output: ${products.find(p => p.id === formData.productId)?.entity_name}`, smart_code: 'HERA.FURNITURE.PROD.LINE.OUTPUT.v1', metadata: { line_type: 'output', completed_quantity: 0, scrap_quantity: 0 } } ] }) if (!result.success) {
  throw new Error(result.error || 'Failed to create production order'  ) // Success - close modal and refresh onSuccess?.() onClose()   } catch (err) {
  console.error('Error creating production order:', err) setError('Failed to create production order. Please try again.')   } finally {
    setLoading(false)
  }
} return ( <Dialog open={open} onOpenChange={onClose}> <DialogContent className="max-w-2xl bg-[var(--color-body)] border-[var(--color-border)] text-[var(--color-text-primary)]"> <DialogHeader> <DialogTitle className="text-xl font-semibold text-[var(--color-text-primary)] flex items-center gap-2"> <Factory className="h-5 w-5 text-[#37353E]" /> New Production Order </DialogTitle> </DialogHeader> {error && ( <Alert variant="destructive" className="bg-red-900/20 border-red-800"> <AlertCircle className="h-4 w-4" /> <AlertDescription>{error}</AlertDescription> </Alert> )} <form onSubmit={handleSubmit} className="bg-[var(--color-body)] space-y-6"> {/* Product and Work Center */} <div className="grid grid-cols-2 gap-4"> <div className="space-y-2"> <Label htmlFor="product" className="bg-[var(--color-body)] text-gray-300"> Product to Produce </Label> <Select value={formData.productId} onValueChange={value => setFormData({ ...formData, productId: value })} > <SelectTrigger id="product" className="bg-[var(--color-body)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-accent" > <SelectValue placeholder="Select product" /> </SelectTrigger> <SelectContent className="bg-[var(--color-body)] border-[var(--color-border)] z-[9999]"> {products.map((product: any) => ( <SelectItem key={product.id} value={product.id} className="text-gray-200 hover:bg-[var(--color-sidebar)]/30 focus:bg-muted-foreground/10 focus:text-[var(--color-text-primary)] cursor-pointer" > <div className="flex items-center gap-2"> <Package className="h-4 w-4 text-[#37353E]" /> {product.entity_name} </div> </SelectItem> ))} </SelectContent> </Select> </div> <div className="space-y-2"> <Label htmlFor="workcenter" className="bg-[var(--color-body)] text-gray-300"> Work Center </Label> <Select value={formData.workCenterId} onValueChange={value => setFormData({ ...formData, workCenterId: value })} > <SelectTrigger id="workcenter" className="bg-[var(--color-body)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-accent" > <SelectValue placeholder="Select work center" /> </SelectTrigger> <SelectContent className="bg-[var(--color-body)] border-[var(--color-border)] z-[9999]"> {workCenters.map((center: any) => ( <SelectItem key={center.id} value={center.id} className="text-gray-200 hover:bg-[var(--color-sidebar)]/30 focus:bg-muted-foreground/10 focus:text-[var(--color-text-primary)] cursor-pointer" > <div className="flex items-center gap-2"> <Factory className="h-4 w-4 text-[#37353E]" /> {center.entity_name} </div> </SelectItem> ))} </SelectContent> </Select> </div> </div> {/* Quantity and Batch */} <div className="grid grid-cols-2 gap-4"> <div className="space-y-2"> <Label htmlFor="quantity" className="bg-[var(--color-body)] text-gray-300"> Planned Quantity </Label> <Input id="quantity" type="number" min="1" value={formData.plannedQuantity} onChange={e => setFormData({ ...formData, plannedQuantity: parseInt(e.target.value) || 1 }  ) className="bg-[var(--color-body)] border-[var(--color-border)] text-[var(--color-text-primary)]" required /> </div> <div className="space-y-2"> <Label htmlFor="batch" className="bg-[var(--color-body)] text-gray-300"> Batch Number </Label> <Input id="batch" value={formData.batchNumber} onChange={e => setFormData({ ...formData, batchNumber: e.target.value })} className="bg-[var(--color-body)] border-[var(--color-border)] text-[var(--color-text-primary)] font-mono" required /> </div> </div> {/* Dates */} <div className="grid grid-cols-2 gap-4"> <div className="space-y-2"> <Label htmlFor="start-date" className="bg-[var(--color-body)] text-gray-300"> Planned Start Date </Label> <div className="relative"> <Input id="start-date" type="date" value={formData.plannedStartDate} onChange={e => setFormData({ ...formData, plannedStartDate: e.target.value })} className="bg-[var(--color-body)] border-[var(--color-border)] text-[var(--color-text-primary)] pl-10" required /> <Calendar className="absolute left-3 top-3 h-4 w-4 text-[var(--color-text-secondary)]" /> </div> </div> <div className="space-y-2"> <Label htmlFor="end-date" className="bg-[var(--color-body)] text-gray-300"> Planned End Date </Label> <div className="relative"> <Input id="end-date" type="date" value={formData.plannedEndDate} onChange={e => setFormData({ ...formData, plannedEndDate: e.target.value })} className="bg-[var(--color-body)] border-[var(--color-border)] text-[var(--color-text-primary)] pl-10" required /> <Calendar className="absolute left-3 top-3 h-4 w-4 text-[var(--color-text-secondary)]" /> </div> </div> </div> {/* Priority */} <div className="space-y-2"> <Label htmlFor="priority" className="bg-[var(--color-body)] text-gray-300"> Priority </Label> <Select value={formData.priority} onValueChange={value => setFormData({ ...formData, priority: value })} > <SelectTrigger id="priority" className="bg-[var(--color-body)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-accent" > <SelectValue /> </SelectTrigger> <SelectContent className="bg-[var(--color-body)] border-[var(--color-border)] z-[9999]"> <SelectItem value="low" className="text-gray-200 hover:bg-[var(--color-sidebar)]/30 focus:bg-muted-foreground/10 focus:text-[var(--color-text-primary)] cursor-pointer" > <div className="flex items-center gap-2"> <Badge className="bg-muted-foreground/20 text-[var(--color-text-secondary)] border-0"> Low </Badge> </div> </SelectItem> <SelectItem value="medium" className="text-gray-200 hover:bg-[var(--color-sidebar)]/30 focus:bg-muted-foreground/10 focus:text-[var(--color-text-primary)] cursor-pointer" > <div className="flex items-center gap-2"> <Badge className="bg-[var(--color-body)]/20 text-[var(--color-text-secondary)] border-0">Medium</Badge> </div> </SelectItem> <SelectItem value="high" className="text-gray-200 hover:bg-[var(--color-sidebar)]/30 focus:bg-muted-foreground/10 focus:text-[var(--color-text-primary)] cursor-pointer" > <div className="bg-[var(--color-body)] flex items-center gap-2"> <Badge className="bg-[var(--color-accent-indigo)]/20 text-[var(--color-text-secondary)] border-0">High</Badge> </div> </SelectItem> <SelectItem value="urgent" className="text-gray-200 hover:bg-[var(--color-sidebar)]/30 focus:bg-muted-foreground/10 focus:text-[var(--color-text-primary)] cursor-pointer" > <div className="bg-[var(--color-body)] flex items-center gap-2"> <Badge className="bg-red-600/20 text-red-400 border-0">Urgent</Badge> </div> </SelectItem> </SelectContent> </Select> </div> {/* Notes */} <div className="space-y-2"> <Label htmlFor="notes" className="bg-[var(--color-body)] text-gray-300"> Production Notes </Label> <Textarea id="notes" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={3} className="bg-[var(--color-body)] border-[var(--color-border)] text-[var(--color-text-primary)] resize-none" placeholder="Special instructions, materials needed, quality requirements..." /> </div> {/* Production Summary */} {formData.productId && ( <div className="p-4 bg-[var(--color-body)]/50 rounded-lg border border-[var(--color-border)]"> <h4 className="bg-[var(--color-body)] text-sm font-medium text-gray-300 mb-2">Production Summary</h4> <div className="space-y-1 text-sm"> <div className="bg-[var(--color-body)] flex justify-between"> <span className="text-[var(--color-text-secondary)]">Product:</span> <span className="text-[var(--color-text-primary)] font-medium"> {products.find(p => p.id === formData.productId)?.entity_name} </span> </div> <div className="bg-[var(--color-body)] flex justify-between"> <span className="text-[var(--color-text-secondary)]">Quantity:</span> <span className="text-[var(--color-text-primary)] font-medium"> {formData.plannedQuantity} units </span> </div> <div className="bg-[var(--color-body)] flex justify-between"> <span className="text-[var(--color-text-secondary)]">Duration:</span> <span className="text-[var(--color-text-primary)] font-medium"> {Math.ceil( (new Date(formData.plannedEndDate).getTime() - new Date(formData.plannedStartDate).getTime()) / (1000 * 60 * 60 * 24) )}{' '} days </span> </div> </div> </div> )} {/* Actions */} <div className="bg-[var(--color-body)] flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]"> <Button type="button" variant="outline" onClick={onClose} className="bg-transparent border-[var(--color-border)] text-gray-300 hover:bg-[var(--color-body)] hover:text-[var(--color-text-primary)]" > Cancel </Button> <Button type="submit" disabled={loading} className="bg-gradient-to-r from-[var(--color-accent-indigo)] to-[var(--color-accent-teal)] hover:from-[var(--color-accent-indigo)] hover:to-[var(--color-accent-teal)] text-[var(--color-text-primary)] border-0" > {loading ? ( <> <div className="bg-[var(--color-body)] animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> Creating... </> ) : ( <> <Plus className="h-4 w-4 mr-2" /> Create Production Order </> )} </Button> </div> </form> </DialogContent> </Dialog> )
}
