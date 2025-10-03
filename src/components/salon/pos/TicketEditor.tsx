'use client'

import { useState } from 'react'
import {
  Plus,
  Minus,
  X,
  User,
  Percent,
  DollarSign,
  MessageSquare,
  Gift,
  Tag,
  Edit3,
  UserPlus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { StylistAssignmentModal } from './StylistAssignmentModal'
import { cn } from '@/lib/utils'

interface LineItem {
  id: string
  entity_id: string
  entity_type: 'service' | 'product'
  entity_name: string
  quantity: number
  unit_price: number
  line_amount: number
  stylist_id?: string
  stylist_name?: string
  appointment_id?: string
  notes?: string
  discount_percent?: number
  discount_amount?: number
}

interface Discount {
  id: string
  type: 'percentage' | 'fixed'
  value: number
  description: string
  applied_to: 'subtotal' | 'item'
  item_id?: string
}

interface Tip {
  id: string
  amount: number
  method: 'cash' | 'card'
  stylist_id?: string
  stylist_name?: string
}

interface PosTicket {
  lineItems: LineItem[]
  discounts: Discount[]
  tips: Tip[]
  notes?: string
  customer_id?: string
  customer_name?: string
  appointment_id?: string
}

interface TicketEditorProps {
  ticket: PosTicket
  organizationId: string
  onUpdateItem: (id: string, updates: Partial<LineItem>) => void
  onRemoveItem: (id: string) => void
  onAddDiscount: (discount: Omit<Discount, 'id'>) => void
  onAddTip: (tip: Omit<Tip, 'id'>) => void
}

export function TicketEditor({
  ticket,
  organizationId,
  onUpdateItem,
  onRemoveItem,
  onAddDiscount,
  onAddTip
}: TicketEditorProps) {
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false)
  const [tipDialogOpen, setTipDialogOpen] = useState(false)
  const [stylistModalOpen, setStylistModalOpen] = useState(false)
  const [stylistModalItem, setStylistModalItem] = useState<LineItem | null>(null)

  // Mock stylists - in production this would come from API
  const stylists = [
    { id: 'stylist-1', name: 'Sarah Johnson' },
    { id: 'stylist-2', name: 'Mike Chen' },
    { id: 'stylist-3', name: 'Emma Davis' },
    { id: 'stylist-4', name: 'Alex Rodriguez' }
  ]

  const handleQuantityChange = (itemId: string, change: number) => {
    const item = ticket.lineItems.find(i => i.id === itemId)
    if (!item) return

    const newQuantity = Math.max(0, item.quantity + change)
    if (newQuantity === 0) {
      onRemoveItem(itemId)
    } else {
      onUpdateItem(itemId, {
        quantity: newQuantity,
        line_amount: newQuantity * item.unit_price
      })
    }
  }

  const handlePriceChange = (itemId: string, newPrice: number) => {
    const item = ticket.lineItems.find(i => i.id === itemId)
    if (!item) return

    onUpdateItem(itemId, {
      unit_price: newPrice,
      line_amount: item.quantity * newPrice
    })
  }

  const handleStylistChange = (itemId: string, stylistId: string) => {
    const stylist = stylists.find(s => s.id === stylistId)
    onUpdateItem(itemId, {
      stylist_id: stylistId,
      stylist_name: stylist?.name
    })
  }

  const openStylistModal = (item: LineItem) => {
    setStylistModalItem(item)
    setStylistModalOpen(true)
  }

  const handleStylistAssign = (stylistId: string, stylistName: string) => {
    if (stylistModalItem) {
      onUpdateItem(stylistModalItem.id, {
        stylist_id: stylistId,
        stylist_name: stylistName
      })
    }
    setStylistModalOpen(false)
    setStylistModalItem(null)
  }

  const handleNotesChange = (itemId: string, notes: string) => {
    onUpdateItem(itemId, { notes })
  }

  const AddDiscountDialog = () => {
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
    const [discountValue, setDiscountValue] = useState('')
    const [discountDescription, setDiscountDescription] = useState('')

    const handleAddDiscount = () => {
      const value = parseFloat(discountValue)
      if (isNaN(value) || value <= 0) return

      onAddDiscount({
        type: discountType,
        value,
        description:
          discountDescription ||
          `${discountType === 'percentage' ? value + '%' : '$' + value} discount`,
        applied_to: 'subtotal'
      })

      setDiscountValue('')
      setDiscountDescription('')
      setDiscountDialogOpen(false)
    }

    return (
      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Percent className="w-4 h-4" />
            Add Discount
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Discount</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Discount Type</Label>
              <Select value={discountType} onValueChange={v => setDiscountType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Value</Label>
              <Input
                type="number"
                step="0.01"
                placeholder={discountType === 'percentage' ? 'e.g. 10' : 'e.g. 25.00'}
                value={discountValue}
                onChange={e => setDiscountValue(e.target.value)}
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input
                placeholder="e.g. Senior discount, First time customer"
                value={discountDescription}
                onChange={e => setDiscountDescription(e.target.value)}
              />
            </div>
            <Button onClick={handleAddDiscount} className="w-full">
              Add Discount
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const AddTipDialog = () => {
    const [tipAmount, setTipAmount] = useState('')
    const [tipMethod, setTipMethod] = useState<'cash' | 'card'>('card')
    const [tipStylist, setTipStylist] = useState('')

    const handleAddTip = () => {
      const amount = parseFloat(tipAmount)
      if (isNaN(amount) || amount <= 0) return

      const stylist = stylists.find(s => s.id === tipStylist)

      onAddTip({
        amount,
        method: tipMethod,
        stylist_id: tipStylist || undefined,
        stylist_name: stylist?.name
      })

      setTipAmount('')
      setTipStylist('')
      setTipDialogOpen(false)
    }

    return (
      <Dialog open={tipDialogOpen} onOpenChange={setTipDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Add Tip
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tip</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tip Amount</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 15.00"
                value={tipAmount}
                onChange={e => setTipAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={tipMethod} onValueChange={v => setTipMethod(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>For Stylist (optional)</Label>
              <Select value={tipStylist} onValueChange={setTipStylist}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stylist" />
                </SelectTrigger>
                <SelectContent>
                  {stylists.map(stylist => (
                    <SelectItem key={stylist.id} value={stylist.id}>
                      {stylist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddTip} className="w-full">
              Add Tip
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (ticket.lineItems.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No items in ticket</h3>
          <p className="text-muted-foreground mb-4">
            Search for a customer or appointment to get started, or add services and products from
            the catalog.
          </p>
          <div className="flex justify-center gap-2">
            <AddDiscountDialog />
            <AddTipDialog />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
      {/* Ticket Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold ink dark:text-white">Current Ticket</h2>
          <div className="flex gap-2">
            <AddDiscountDialog />
            <AddTipDialog />
          </div>
        </div>

        {ticket.customer_name && (
          <div className="flex items-center gap-2 text-sm ink-muted dark:text-slate-300">
            <User className="w-4 h-4" />
            <span>Customer: {ticket.customer_name}</span>
          </div>
        )}
      </div>

      {/* Line Items */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {ticket.lineItems.map((item, index) => (
          <Card
            key={item.id}
            className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700"
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Item Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{item.entity_name}</h3>
                      <Badge variant={item.entity_type === 'service' ? 'default' : 'secondary'}>
                        {item.entity_type}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Quantity and Price Controls */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Qty:</Label>
                    <div className="flex items-center border rounded-md">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, -1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Price:</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={e => handlePriceChange(item.id, parseFloat(e.target.value) || 0)}
                      className="w-20 h-8 text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <Label className="text-xs text-muted-foreground">Total:</Label>
                    <span className="font-bold text-lg">${item.line_amount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Stylist Assignment */}
                {item.entity_type === 'service' && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Stylist:</Label>
                    <div className="flex items-center gap-2">
                      {item.stylist_name ? (
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-md">
                          <User className="w-3 h-3 text-blue-600" />
                          <span className="text-sm text-blue-700 dark:text-blue-300">
                            {item.stylist_name}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openStylistModal(item)}
                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openStylistModal(item)}
                          className="h-8 gap-2"
                        >
                          <UserPlus className="w-3 h-3" />
                          Assign Stylist
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3 h-3 text-muted-foreground" />
                    <Label className="text-xs text-muted-foreground">Notes:</Label>
                  </div>
                  <Textarea
                    placeholder="Add notes for this item..."
                    value={item.notes || ''}
                    onChange={e => handleNotesChange(item.id, e.target.value)}
                    className="min-h-[60px] text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Discounts */}
        {ticket.discounts.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <h3 className="font-medium text-sm text-muted-foreground">Discounts</h3>
            {ticket.discounts.map(discount => (
              <div
                key={discount.id}
                className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-md border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-green-600" />
                  <span className="text-sm">{discount.description}</span>
                </div>
                <span className="font-medium text-green-600">
                  -
                  {discount.type === 'percentage'
                    ? `${discount.value}%`
                    : `$${discount.value.toFixed(2)}`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tips */}
        {ticket.tips.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <h3 className="font-medium text-sm text-muted-foreground">Tips</h3>
            {ticket.tips.map(tip => (
              <div
                key={tip.id}
                className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800"
              >
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">
                    Tip {tip.stylist_name ? `for ${tip.stylist_name}` : ''} ({tip.method})
                  </span>
                </div>
                <span className="font-medium text-blue-600">+${tip.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stylist Assignment Modal */}
      {stylistModalItem && (
        <StylistAssignmentModal
          open={stylistModalOpen}
          onClose={() => setStylistModalOpen(false)}
          serviceId={stylistModalItem.entity_id}
          serviceName={stylistModalItem.entity_name}
          organizationId={organizationId}
          currentStylistId={stylistModalItem.stylist_id}
          onAssign={handleStylistAssign}
        />
      )}
    </div>
  )
}
