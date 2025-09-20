'use client'

import { useState, useMemo } from 'react'
import { X, User, Calendar, Scissors, Package, Plus, Minus, Trash2, Percent, DollarSign, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  plum: '#5A2A40',
  emerald: '#0F6F5C'
}

interface TicketLineItem {
  id: string
  entity_id: string
  entity_type: 'service' | 'product'
  entity_name: string
  quantity: number
  unit_price: number
  line_amount: number  // Changed from line_total to match usePosTicket
  stylist_id?: string
  stylist_name?: string
  notes?: string
}

interface Discount {
  id: string
  type: 'percentage' | 'fixed'  // Changed to match usePosTicket
  value: number
  description: string  // Changed from reason to match usePosTicket
  applied_to: 'subtotal' | 'item'  // Added to match usePosTicket
  item_id?: string  // Added to match usePosTicket
}

interface Tip {
  id: string
  amount: number  // Changed from type/value to match usePosTicket
  method: 'cash' | 'card'  // Added to match usePosTicket
  stylist_id?: string  // Added to match usePosTicket
  stylist_name?: string  // Added to match usePosTicket
}

interface PosTicket {
  id?: string
  customer_id?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  appointment_id?: string
  lineItems: TicketLineItem[]
  discounts: Discount[]
  tips: Tip[]
  notes?: string
  created_at?: string
}

interface TicketTotals {
  subtotal: number
  discountAmount: number  // Changed to match usePosTicket
  tipAmount: number  // Changed to match usePosTicket
  taxAmount: number  // Changed to match usePosTicket
  total: number
}

interface TicketDetailsModalProps {
  open: boolean
  onClose: () => void
  ticket: PosTicket
  totals: TicketTotals | null
  onUpdateItem: (itemId: string, updates: Partial<TicketLineItem>) => void
  onRemoveItem: (itemId: string) => void
  onAddDiscount: (discount: Omit<Discount, 'id'>) => void
  onAddTip: (tip: Omit<Tip, 'id'>) => void
}

export function TicketDetailsModal({
  open,
  onClose,
  ticket,
  totals,
  onUpdateItem,
  onRemoveItem,
  onAddDiscount,
  onAddTip
}: TicketDetailsModalProps) {
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editQuantity, setEditQuantity] = useState<number>(1)
  const [editPrice, setEditPrice] = useState<number>(0)
  const [editStylistId, setEditStylistId] = useState<string>('')
  const [editStylistName, setEditStylistName] = useState<string>('')
  const [showDiscountForm, setShowDiscountForm] = useState(false)
  const [showTipForm, setShowTipForm] = useState(false)
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState<number>(0)
  const [discountReason, setDiscountReason] = useState<string>('')
  const [tipAmount, setTipAmount] = useState<number>(0)
  const [tipMethod, setTipMethod] = useState<'cash' | 'card'>('card')
  const [tipStylistId, setTipStylistId] = useState<string>('')
  const [tipStylistName, setTipStylistName] = useState<string>('')

  const handleEditItem = (item: TicketLineItem) => {
    setEditingItem(item.id)
    setEditQuantity(item.quantity)
    setEditPrice(item.unit_price)
    setEditStylistId(item.stylist_id || '')
    setEditStylistName(item.stylist_name || '')
  }

  const handleSaveEdit = () => {
    if (editingItem) {
      onUpdateItem(editingItem, {
        quantity: editQuantity,
        unit_price: editPrice,
        line_amount: editQuantity * editPrice,
        stylist_id: editStylistId || undefined,
        stylist_name: editStylistName || undefined
      })
      setEditingItem(null)
      setEditStylistId('')
      setEditStylistName('')
    }
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
  }

  const handleAddDiscount = () => {
    onAddDiscount({
      type: discountType,
      value: discountValue,
      description: discountReason,
      applied_to: 'subtotal'
    })
    setShowDiscountForm(false)
    setDiscountValue(0)
    setDiscountReason('')
  }

  const handleAddTip = () => {
    onAddTip({
      amount: tipAmount,
      method: tipMethod,
      stylist_id: tipStylistId || undefined,
      stylist_name: tipStylistName || undefined
    })
    setShowTipForm(false)
    setTipAmount(0)
    setTipStylistId('')
    setTipStylistName('')
  }

  // Get unique stylists from line items
  const availableStylists = useMemo(() => {
    const stylists = ticket?.lineItems
      ?.filter(item => item.stylist_name && item.stylist_id)
      ?.map(item => ({ id: item.stylist_id!, name: item.stylist_name! }))
      ?.filter((stylist, index, self) => 
        self.findIndex(s => s.id === stylist.id) === index
      ) || []
    return stylists
  }, [ticket?.lineItems])

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'Invalid time'
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-5xl h-[800px] p-0 gap-0"
        style={{
          backgroundColor: COLORS.charcoal,
          borderColor: COLORS.bronze + '33'
        }}
      >
        <DialogHeader className="p-6 border-b" style={{ borderColor: COLORS.bronze + '20' }}>
          <div className="flex items-center justify-between">
            <DialogTitle style={{ color: COLORS.champagne }}>Ticket Details</DialogTitle>
            <div className="text-sm" style={{ color: COLORS.bronze }}>
              {ticket?.created_at ? formatTime(ticket.created_at) : 'New ticket'}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex">
          {/* Left Section - Line Items */}
          <div className="flex-1 flex flex-col border-r" style={{ borderColor: COLORS.bronze + '20' }}>
            {/* Customer Info */}
            {ticket?.customer_name && (
              <div className="p-4 border-b" style={{ borderColor: COLORS.bronze + '20' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                       style={{ backgroundColor: COLORS.gold + '20' }}>
                    <User className="w-5 h-5" style={{ color: COLORS.gold }} />
                  </div>
                  <div>
                    <h3 className="font-medium" style={{ color: COLORS.champagne }}>
                      {ticket.customer_name}
                    </h3>
                    <div className="text-sm" style={{ color: COLORS.bronze }}>
                      {ticket.customer_email} • {ticket.customer_phone}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Line Items */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <h3 className="font-medium mb-4" style={{ color: COLORS.champagne }}>
                  Items ({ticket?.lineItems?.length || 0})
                </h3>
                
                {(ticket?.lineItems?.length || 0) === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                         style={{ backgroundColor: COLORS.charcoalLight }}>
                      <Scissors className="w-8 h-8" style={{ color: COLORS.bronze }} />
                    </div>
                    <p style={{ color: COLORS.lightText, opacity: 0.7 }}>
                      No items added yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(ticket?.lineItems || []).map(item => (
                      <Card
                        key={item.id}
                        style={{
                          backgroundColor: COLORS.charcoalLight,
                          borderColor: COLORS.bronze + '33'
                        }}
                      >
                        <CardContent className="p-4">
                          {editingItem === item.id ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                {item.entity_type === 'service' ? (
                                  <Scissors className="w-4 h-4" style={{ color: COLORS.gold }} />
                                ) : (
                                  <Package className="w-4 h-4" style={{ color: COLORS.gold }} />
                                )}
                                <span className="font-medium" style={{ color: COLORS.champagne }}>
                                  {item.entity_name}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label style={{ color: COLORS.bronze }}>Quantity</Label>
                                  <Input
                                    type="number"
                                    value={editQuantity}
                                    onChange={(e) => setEditQuantity(Number(e.target.value))}
                                    min="1"
                                    step="1"
                                    style={{
                                      backgroundColor: COLORS.charcoalDark,
                                      borderColor: COLORS.bronze + '33',
                                      color: COLORS.lightText
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label style={{ color: COLORS.bronze }}>Unit Price</Label>
                                  <Input
                                    type="number"
                                    value={editPrice}
                                    onChange={(e) => setEditPrice(Number(e.target.value))}
                                    min="0"
                                    step="0.01"
                                    style={{
                                      backgroundColor: COLORS.charcoalDark,
                                      borderColor: COLORS.bronze + '33',
                                      color: COLORS.lightText
                                    }}
                                  />
                                </div>
                              </div>
                              
                              {/* Stylist Assignment for Services */}
                              {item.entity_type === 'service' && (
                                <div>
                                  <Label style={{ color: COLORS.bronze }}>Assigned Stylist</Label>
                                  <select
                                    value={editStylistId}
                                    onChange={(e) => {
                                      const selectedStylist = availableStylists.find(s => s.id === e.target.value)
                                      setEditStylistId(e.target.value)
                                      setEditStylistName(selectedStylist?.name || '')
                                    }}
                                    className="w-full p-2 rounded-md border text-sm"
                                    style={{
                                      backgroundColor: COLORS.charcoalDark,
                                      borderColor: COLORS.bronze + '33',
                                      color: COLORS.lightText
                                    }}
                                  >
                                    <option value="">No stylist assigned</option>
                                    {availableStylists.map(stylist => (
                                      <option key={stylist.id} value={stylist.id}>
                                        {stylist.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                              
                              <div className="flex justify-between items-center">
                                <div className="text-lg font-medium" style={{ color: COLORS.gold }}>
                                  Total: ${(editQuantity * editPrice).toFixed(2)}
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={handleCancelEdit}
                                          style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}>
                                    Cancel
                                  </Button>
                                  <Button size="sm" onClick={handleSaveEdit}
                                          style={{
                                            background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                                            color: COLORS.black
                                          }}>
                                    Save
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {item.entity_type === 'service' ? (
                                    <Scissors className="w-4 h-4" style={{ color: COLORS.gold }} />
                                  ) : (
                                    <Package className="w-4 h-4" style={{ color: COLORS.gold }} />
                                  )}
                                  <span className="font-medium" style={{ color: COLORS.champagne }}>
                                    {item.entity_name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="ghost" onClick={() => handleEditItem(item)}
                                          style={{ color: COLORS.bronze }}>
                                    <Edit3 className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => onRemoveItem(item.id)}
                                          style={{ color: '#DC2626' }}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between text-sm">
                                <div style={{ color: COLORS.bronze }}>
                                  {item.quantity} × ${item.unit_price.toFixed(2)}
                                  {item.stylist_name && (
                                    <span className="ml-2">• {item.stylist_name}</span>
                                  )}
                                </div>
                                <div className="font-medium" style={{ color: COLORS.gold }}>
                                  ${item.line_amount.toFixed(2)}
                                </div>
                              </div>
                              
                              {item.notes && (
                                <div className="mt-2 text-sm" style={{ color: COLORS.lightText, opacity: 0.8 }}>
                                  {item.notes}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Section - Totals and Actions */}
          <div className="w-96 flex flex-col">
            {/* Totals */}
            <div className="p-6">
              <h3 className="font-medium mb-4" style={{ color: COLORS.champagne }}>Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span style={{ color: COLORS.bronze }}>Subtotal</span>
                  <span style={{ color: COLORS.lightText }}>${(totals?.subtotal || 0).toFixed(2)}</span>
                </div>
                
                {(totals?.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#DC2626' }}>Discount</span>
                    <span style={{ color: '#DC2626' }}>-${(totals?.discountAmount || 0).toFixed(2)}</span>
                  </div>
                )}
                
                {(totals?.tipAmount || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: COLORS.emerald }}>Tip</span>
                    <span style={{ color: COLORS.emerald }}>+${(totals?.tipAmount || 0).toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span style={{ color: COLORS.bronze }}>Tax</span>
                  <span style={{ color: COLORS.lightText }}>${(totals?.taxAmount || 0).toFixed(2)}</span>
                </div>
                
                <Separator style={{ backgroundColor: COLORS.bronze + '33' }} />
                
                <div className="flex justify-between text-lg font-bold">
                  <span style={{ color: COLORS.champagne }}>Total</span>
                  <span style={{ color: COLORS.gold }}>${(totals?.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 space-y-3 border-t" style={{ borderColor: COLORS.bronze + '20' }}>
              {/* Discount Section */}
              {!showDiscountForm ? (
                <Button
                  variant="outline"
                  onClick={() => setShowDiscountForm(true)}
                  className="w-full"
                  style={{
                    borderColor: COLORS.bronze,
                    color: COLORS.champagne
                  }}
                >
                  <Percent className="w-4 h-4 mr-2" />
                  Add Discount
                </Button>
              ) : (
                <Card style={{ backgroundColor: COLORS.charcoalLight, borderColor: COLORS.bronze + '33' }}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={discountType === 'percentage' ? 'default' : 'outline'}
                        onClick={() => setDiscountType('percentage')}
                        style={{
                          backgroundColor: discountType === 'percentage' ? COLORS.gold : 'transparent',
                          color: discountType === 'percentage' ? COLORS.black : COLORS.champagne,
                          borderColor: COLORS.bronze
                        }}
                      >
                        %
                      </Button>
                      <Button
                        size="sm"
                        variant={discountType === 'fixed' ? 'default' : 'outline'}
                        onClick={() => setDiscountType('fixed')}
                        style={{
                          backgroundColor: discountType === 'fixed' ? COLORS.gold : 'transparent',
                          color: discountType === 'fixed' ? COLORS.black : COLORS.champagne,
                          borderColor: COLORS.bronze
                        }}
                      >
                        $
                      </Button>
                      <Input
                        type="number"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                        placeholder={discountType === 'percentage' ? '10' : '5.00'}
                        style={{
                          backgroundColor: COLORS.charcoalDark,
                          borderColor: COLORS.bronze + '33',
                          color: COLORS.lightText
                        }}
                      />
                    </div>
                    <Input
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      placeholder="Reason (optional)"
                      style={{
                        backgroundColor: COLORS.charcoalDark,
                        borderColor: COLORS.bronze + '33',
                        color: COLORS.lightText
                      }}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setShowDiscountForm(false)}
                              style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleAddDiscount}
                              style={{
                                background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                                color: COLORS.black
                              }}>
                        Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tip Section */}
              {!showTipForm ? (
                <Button
                  variant="outline"
                  onClick={() => setShowTipForm(true)}
                  className="w-full"
                  style={{
                    borderColor: COLORS.bronze,
                    color: COLORS.champagne
                  }}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Add Tip
                </Button>
              ) : (
                <Card style={{ backgroundColor: COLORS.charcoalLight, borderColor: COLORS.bronze + '33' }}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={tipMethod === 'cash' ? 'default' : 'outline'}
                        onClick={() => setTipMethod('cash')}
                        style={{
                          backgroundColor: tipMethod === 'cash' ? COLORS.gold : 'transparent',
                          color: tipMethod === 'cash' ? COLORS.black : COLORS.champagne,
                          borderColor: COLORS.bronze
                        }}
                      >
                        Cash
                      </Button>
                      <Button
                        size="sm"
                        variant={tipMethod === 'card' ? 'default' : 'outline'}
                        onClick={() => setTipMethod('card')}
                        style={{
                          backgroundColor: tipMethod === 'card' ? COLORS.gold : 'transparent',
                          color: tipMethod === 'card' ? COLORS.black : COLORS.champagne,
                          borderColor: COLORS.bronze
                        }}
                      >
                        Card
                      </Button>
                      <Input
                        type="number"
                        value={tipAmount}
                        onChange={(e) => setTipAmount(Number(e.target.value))}
                        placeholder="10.00"
                        style={{
                          backgroundColor: COLORS.charcoalDark,
                          borderColor: COLORS.bronze + '33',
                          color: COLORS.lightText
                        }}
                      />
                    </div>
                    
                    {/* Stylist Selection */}
                    <div>
                      <Label style={{ color: COLORS.bronze }}>Stylist (optional)</Label>
                      <select
                        value={tipStylistId}
                        onChange={(e) => {
                          const selectedStylist = availableStylists.find(s => s.id === e.target.value)
                          setTipStylistId(e.target.value)
                          setTipStylistName(selectedStylist?.name || '')
                        }}
                        className="w-full p-2 rounded-md border text-sm"
                        style={{
                          backgroundColor: COLORS.charcoalDark,
                          borderColor: COLORS.bronze + '33',
                          color: COLORS.lightText
                        }}
                      >
                        <option value="">General tip</option>
                        {availableStylists.map(stylist => (
                          <option key={stylist.id} value={stylist.id}>
                            {stylist.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setShowTipForm(false)}
                              style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleAddTip}
                              style={{
                                background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                                color: COLORS.black
                              }}>
                        Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t mt-auto" style={{ borderColor: COLORS.bronze + '20' }}>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}
                        style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}>
                  Close
                </Button>
                <Button className="flex-1"
                        style={{
                          background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                          color: COLORS.black
                        }}>
                  Continue to Payment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}