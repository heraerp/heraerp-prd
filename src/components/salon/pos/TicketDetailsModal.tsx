'use client'

import { useState, useEffect } from 'react'
import {
  X,
  User,
  Scissors,
  Package,
  Plus,
  Trash2,
  Edit3,
  CreditCard,
  Building2,
  AlertCircle,
  Save,
  XCircle,
  UserPlus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/luxe-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useHeraStaff } from '@/hooks/useHeraStaff'
import { EnhancedCustomerModal } from './EnhancedCustomerModal'

// Salon Luxe Color Palette
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
  emerald: '#0F6F5C',
  red: '#EF4444'
}

interface StaffAssignment {
  staff_id: string
  staff_name: string
}

interface TicketLineItem {
  id: string
  entity_id: string
  entity_type: 'service' | 'product'
  entity_name: string
  quantity: number
  unit_price: number
  line_amount: number
  stylist_id?: string
  stylist_name?: string
  staff_assignments?: StaffAssignment[]
  notes?: string
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
  discountAmount: number
  tipAmount: number
  taxAmount: number
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
  onPayment?: () => void
  organizationId?: string
  branchId?: string
  branchName?: string
  availableBranches?: Array<{
    id: string
    entity_name: string
  }>
  onBranchChange?: (branchId: string) => void
  onCustomerSelect?: (customer: any) => void
}

export function TicketDetailsModal({
  open,
  onClose,
  ticket,
  totals,
  onUpdateItem,
  onRemoveItem,
  onPayment,
  organizationId,
  branchId,
  branchName,
  availableBranches = [],
  onBranchChange,
  onCustomerSelect
}: TicketDetailsModalProps) {
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editQuantity, setEditQuantity] = useState<number>(1)
  const [editPrice, setEditPrice] = useState<number>(0)
  const [selectedBranchForBill, setSelectedBranchForBill] = useState<string>(branchId || '')
  const [showBranchWarning, setShowBranchWarning] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [addingStaffToItem, setAddingStaffToItem] = useState<string | null>(null)

  // Update selected branch when prop changes
  useEffect(() => {
    if (branchId) {
      setSelectedBranchForBill(branchId)
    }
  }, [branchId])

  // Load staff for the selected branch
  const { staff, isLoading: isLoadingStaff } = useHeraStaff({
    organizationId: organizationId || '',
    filters: {
      include_dynamic: true,
      include_relationships: true,
      ...(selectedBranchForBill && selectedBranchForBill !== 'all'
        ? { branch_id: selectedBranchForBill }
        : {}),
      limit: 100
    }
  })

  const getInitials = (name: string) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleEditItem = (item: TicketLineItem) => {
    setEditingItem(item.id)
    setEditQuantity(item.quantity)
    setEditPrice(item.unit_price)
  }

  const handleSaveEdit = () => {
    if (editingItem) {
      onUpdateItem(editingItem, {
        quantity: editQuantity,
        unit_price: editPrice,
        line_amount: editQuantity * editPrice
      })
      setEditingItem(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
  }

  const handleAddStaff = (itemId: string, staffId: string) => {
    const item = ticket.lineItems.find(i => i.id === itemId)
    const selectedStaff = staff?.find(s => s.id === staffId)

    if (!item || !selectedStaff) return

    const currentAssignments = item.staff_assignments || []

    // Check if staff is already assigned
    if (currentAssignments.some(a => a.staff_id === staffId)) {
      return
    }

    const updatedAssignments = [
      ...currentAssignments,
      {
        staff_id: staffId,
        staff_name: selectedStaff.entity_name
      }
    ]

    onUpdateItem(itemId, {
      staff_assignments: updatedAssignments
    })

    setAddingStaffToItem(null)
  }

  const handleRemoveStaff = (itemId: string, staffId: string) => {
    const item = ticket.lineItems.find(i => i.id === itemId)
    if (!item) return

    const updatedAssignments = (item.staff_assignments || []).filter(a => a.staff_id !== staffId)

    onUpdateItem(itemId, {
      staff_assignments: updatedAssignments
    })
  }

  const handleCustomerSelectInternal = (customer: any) => {
    if (onCustomerSelect) {
      onCustomerSelect(customer)
    }
    setShowCustomerModal(false)
  }

  const handleBranchSelection = (newBranchId: string) => {
    setSelectedBranchForBill(newBranchId)
    setShowBranchWarning(false)
    if (onBranchChange) {
      onBranchChange(newBranchId)
    }
  }

  const handlePayment = () => {
    // Check if branch is selected when "all" was initially selected
    if (
      (!branchId || branchId === 'all') &&
      (!selectedBranchForBill || selectedBranchForBill === 'all')
    ) {
      setShowBranchWarning(true)
      return
    }

    if (onPayment) {
      onPayment()
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'Invalid time'
    }
  }

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden border animate-in fade-in-0 zoom-in-95 duration-300"
        style={{
          backgroundColor: COLORS.charcoal,
          borderColor: `${COLORS.gold}30`,
          boxShadow: `0 25px 50px -12px ${COLORS.black}80, 0 0 0 1px ${COLORS.gold}20`
        }}
        aria-describedby="ticket-details-description"
      >
        {/* Subtle gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${COLORS.gold}60 0%, transparent 60%)`
          }}
        />
        {/* Header */}
        <DialogHeader
          className="p-6 border-b flex-shrink-0 relative z-10"
          style={{ borderColor: `${COLORS.gold}20` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="p-3 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                  boxShadow: `0 8px 20px ${COLORS.gold}30`
                }}
              >
                <CreditCard className="w-6 h-6" style={{ color: COLORS.black }} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold" style={{ color: COLORS.champagne }}>
                  Bill Details
                </DialogTitle>
                <p className="text-sm font-normal mt-0.5" style={{ color: COLORS.bronze }}>
                  {ticket?.created_at ? formatTime(ticket.created_at) : 'New bill'} •{' '}
                  {ticket.lineItems.length} {ticket.lineItems.length === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>
          </div>

          {/* Branch Selection - Always Editable */}
          {availableBranches && availableBranches.length > 0 && (
            <div className="mt-4 space-y-2">
              <Label
                className="text-sm font-semibold flex items-center gap-2"
                style={{ color: COLORS.champagne }}
              >
                <Building2 className="w-4 h-4" style={{ color: COLORS.gold }} />
                Branch for This Bill
                {(!branchId || branchId === 'all') && <span style={{ color: COLORS.red }}>*</span>}
              </Label>
              <Select
                value={selectedBranchForBill || branchId || ''}
                onValueChange={handleBranchSelection}
              >
                <SelectTrigger
                  className="h-11 border-2 transition-all hover:scale-[1.01]"
                  style={{
                    backgroundColor: COLORS.charcoalDark,
                    borderColor: showBranchWarning
                      ? COLORS.red
                      : selectedBranchForBill
                        ? `${COLORS.gold}50`
                        : `${COLORS.gold}30`,
                    color: COLORS.champagne
                  }}
                >
                  <SelectValue placeholder="Choose a branch...">
                    {selectedBranchForBill && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" style={{ color: COLORS.gold }} />
                        <span style={{ color: COLORS.champagne }}>
                          {availableBranches.find(b => b.id === selectedBranchForBill)
                            ?.entity_name || branchName}
                        </span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableBranches
                    .filter(b => b.id !== 'all')
                    .map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" style={{ color: COLORS.gold }} />
                          {branch.entity_name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {showBranchWarning && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs animate-in fade-in-0 slide-in-from-top-1 duration-200"
                  style={{
                    background: `${COLORS.red}15`,
                    border: `1px solid ${COLORS.red}40`,
                    color: COLORS.red
                  }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Please select a branch before proceeding to payment</span>
                </div>
              )}
            </div>
          )}

          <p id="ticket-details-description" className="sr-only">
            View and manage bill details including line items, stylists, adjustments, and payment
            options.
          </p>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex min-h-0">
          {/* Left Section - Line Items */}
          <div
            className="flex-1 flex flex-col border-r min-h-0"
            style={{ borderColor: `${COLORS.gold}20` }}
          >
            {/* Customer Info */}
            <div className="p-4 border-b flex-shrink-0" style={{ borderColor: `${COLORS.gold}20` }}>
              {ticket?.customer_name ? (
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: `${COLORS.gold}20`,
                      border: `1px solid ${COLORS.gold}40`
                    }}
                  >
                    <User className="w-5 h-5" style={{ color: COLORS.gold }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm" style={{ color: COLORS.champagne }}>
                      {ticket.customer_name}
                    </h3>
                    <div className="text-xs" style={{ color: COLORS.bronze }}>
                      {ticket.customer_email && `${ticket.customer_email} • `}
                      {ticket.customer_phone}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCustomerModal(true)}
                    style={{
                      borderColor: `${COLORS.gold}40`,
                      color: COLORS.gold
                    }}
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                    Change
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowCustomerModal(true)}
                  className="w-full"
                  style={{
                    borderColor: `${COLORS.gold}40`,
                    color: COLORS.gold,
                    borderStyle: 'dashed'
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Customer (Walk-in or Search)
                </Button>
              )}
            </div>

            {/* Line Items */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4">
                {ticket.lineItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 mx-auto mb-3" style={{ color: COLORS.bronze }} />
                    <p className="text-sm" style={{ color: COLORS.bronze }}>
                      No items in bill
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ticket.lineItems.map(item => (
                      <Card
                        key={item.id}
                        className="border transition-all"
                        style={{
                          backgroundColor: COLORS.charcoalLight,
                          borderColor: `${COLORS.gold}20`
                        }}
                      >
                        <CardContent className="p-3">
                          {editingItem === item.id ? (
                            /* Edit Mode */
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {item.entity_type === 'service' ? (
                                    <Scissors className="w-4 h-4" style={{ color: COLORS.gold }} />
                                  ) : (
                                    <Package className="w-4 h-4" style={{ color: COLORS.gold }} />
                                  )}
                                  <span
                                    className="font-medium text-sm"
                                    style={{ color: COLORS.champagne }}
                                  >
                                    {item.entity_name}
                                  </span>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                  style={{
                                    background: `${COLORS.gold}15`,
                                    borderColor: `${COLORS.gold}40`,
                                    color: COLORS.gold
                                  }}
                                >
                                  Editing
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs" style={{ color: COLORS.bronze }}>
                                    Quantity
                                  </Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={editQuantity}
                                    onChange={e => setEditQuantity(parseInt(e.target.value) || 1)}
                                    className="h-9 mt-1"
                                    style={{
                                      backgroundColor: COLORS.charcoalDark,
                                      borderColor: `${COLORS.gold}30`,
                                      color: COLORS.champagne
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs" style={{ color: COLORS.bronze }}>
                                    Price (AED)
                                  </Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editPrice}
                                    onChange={e => setEditPrice(parseFloat(e.target.value) || 0)}
                                    className="h-9 mt-1"
                                    style={{
                                      backgroundColor: COLORS.charcoalDark,
                                      borderColor: `${COLORS.gold}30`,
                                      color: COLORS.champagne
                                    }}
                                  />
                                </div>
                              </div>

                              <div
                                className="flex items-center justify-between p-2.5 rounded-lg"
                                style={{
                                  background: `${COLORS.gold}10`,
                                  border: `1px solid ${COLORS.gold}30`
                                }}
                              >
                                <span
                                  className="text-xs font-medium"
                                  style={{ color: COLORS.bronze }}
                                >
                                  Total
                                </span>
                                <span className="text-sm font-bold" style={{ color: COLORS.gold }}>
                                  AED {((editQuantity || 0) * (editPrice || 0)).toFixed(2)}
                                </span>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  className="flex-1"
                                  style={{
                                    borderColor: `${COLORS.bronze}60`,
                                    color: COLORS.bronze
                                  }}
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-1.5" />
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleSaveEdit}
                                  className="flex-1"
                                  style={{
                                    background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                                    color: COLORS.black
                                  }}
                                >
                                  <Save className="w-3.5 h-3.5 mr-1.5" />
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            /* Display Mode */
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1">
                                  {item.entity_type === 'service' ? (
                                    <Scissors className="w-4 h-4" style={{ color: COLORS.gold }} />
                                  ) : (
                                    <Package className="w-4 h-4" style={{ color: COLORS.bronze }} />
                                  )}
                                  <span
                                    className="font-medium text-sm"
                                    style={{ color: COLORS.champagne }}
                                  >
                                    {item.entity_name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditItem(item)}
                                    className="h-7 w-7 p-0"
                                    style={{ color: COLORS.gold }}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onRemoveItem(item.id)}
                                    className="h-7 w-7 p-0"
                                    style={{ color: COLORS.red }}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs">
                                <span style={{ color: COLORS.bronze }}>
                                  {item.quantity} × AED {(item.unit_price || 0).toFixed(2)}
                                </span>
                                <span className="font-semibold" style={{ color: COLORS.gold }}>
                                  AED {(item.line_amount || 0).toFixed(2)}
                                </span>
                              </div>

                              {/* Staff Assignments */}
                              {item.entity_type === 'service' && (
                                <div
                                  className="pt-2 border-t space-y-2"
                                  style={{ borderColor: `${COLORS.gold}15` }}
                                >
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs" style={{ color: COLORS.bronze }}>
                                      Staff Assigned
                                    </Label>
                                    {addingStaffToItem === item.id ? (
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => setAddingStaffToItem(null)}
                                          className="h-6 px-2 text-xs"
                                          style={{ color: COLORS.bronze }}
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setAddingStaffToItem(item.id)}
                                        className="h-6 px-2 text-xs"
                                        style={{ color: COLORS.gold }}
                                        disabled={isLoadingStaff}
                                      >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Add Staff
                                      </Button>
                                    )}
                                  </div>

                                  {/* Add Staff Dropdown */}
                                  {addingStaffToItem === item.id && (
                                    <Select
                                      value=""
                                      onValueChange={value => handleAddStaff(item.id, value)}
                                      disabled={isLoadingStaff}
                                    >
                                      <SelectTrigger
                                        className="h-8 text-xs"
                                        style={{
                                          backgroundColor: COLORS.charcoalDark,
                                          borderColor: `${COLORS.gold}40`,
                                          color: COLORS.champagne
                                        }}
                                      >
                                        <SelectValue
                                          placeholder={
                                            isLoadingStaff ? 'Loading...' : 'Select staff to add'
                                          }
                                        />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {staff
                                          ?.filter(
                                            s =>
                                              !(item.staff_assignments || []).some(
                                                a => a.staff_id === s.id
                                              )
                                          )
                                          .map((stylist: any) => (
                                            <SelectItem key={stylist.id} value={stylist.id}>
                                              <div className="flex items-center gap-2">
                                                <div
                                                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                                                  style={{
                                                    background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                                                    color: COLORS.black
                                                  }}
                                                >
                                                  {getInitials(stylist.entity_name)}
                                                </div>
                                                <div>
                                                  <div className="font-medium">
                                                    {stylist.entity_name}
                                                  </div>
                                                  {stylist.role_title && (
                                                    <div className="text-xs opacity-70">
                                                      {stylist.role_title}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                  )}

                                  {/* Assigned Staff List */}
                                  {item.staff_assignments && item.staff_assignments.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                      {item.staff_assignments.map(assignment => (
                                        <Badge
                                          key={assignment.staff_id}
                                          variant="outline"
                                          className="pl-1 pr-1.5 py-1 text-xs gap-1.5"
                                          style={{
                                            background: `${COLORS.gold}15`,
                                            borderColor: `${COLORS.gold}40`,
                                            color: COLORS.champagne
                                          }}
                                        >
                                          <div
                                            className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
                                            style={{
                                              background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                                              color: COLORS.black
                                            }}
                                          >
                                            {getInitials(assignment.staff_name)}
                                          </div>
                                          <span>{assignment.staff_name}</span>
                                          <button
                                            onClick={() =>
                                              handleRemoveStaff(item.id, assignment.staff_id)
                                            }
                                            className="ml-1 hover:opacity-70"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <div
                                      className="text-xs text-center py-2 rounded"
                                      style={{
                                        color: COLORS.bronze,
                                        background: `${COLORS.charcoalDark}60`
                                      }}
                                    >
                                      No staff assigned yet
                                    </div>
                                  )}
                                </div>
                              )}

                              {item.notes && (
                                <div
                                  className="text-xs p-2 rounded"
                                  style={{
                                    background: `${COLORS.charcoalDark}80`,
                                    color: COLORS.bronze,
                                    border: `1px solid ${COLORS.gold}20`
                                  }}
                                >
                                  <span className="font-medium" style={{ color: COLORS.champagne }}>
                                    Note:{' '}
                                  </span>
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
            </ScrollArea>
          </div>

          {/* Right Section - Summary */}
          <div className="w-80 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-5 space-y-4">
                {/* Totals */}
                <Card
                  className="border"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    borderColor: `${COLORS.gold}30`
                  }}
                >
                  <CardContent className="p-4 space-y-2.5">
                    <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.champagne }}>
                      Bill Summary
                    </h3>

                    <div className="flex justify-between text-xs">
                      <span style={{ color: COLORS.bronze }}>Subtotal</span>
                      <span className="font-medium" style={{ color: COLORS.champagne }}>
                        AED {(totals?.subtotal || 0).toFixed(2)}
                      </span>
                    </div>

                    {(totals?.discountAmount || 0) > 0 && (
                      <div className="flex justify-between text-xs">
                        <span style={{ color: COLORS.emerald }}>Discount</span>
                        <span className="font-medium" style={{ color: COLORS.emerald }}>
                          -AED {(totals?.discountAmount || 0).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {(totals?.tipAmount || 0) > 0 && (
                      <div className="flex justify-between text-xs">
                        <span style={{ color: COLORS.gold }}>Gratuity</span>
                        <span className="font-medium" style={{ color: COLORS.gold }}>
                          +AED {(totals?.tipAmount || 0).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {(totals?.taxAmount || 0) > 0 && (
                      <div className="flex justify-between text-xs">
                        <span style={{ color: COLORS.bronze }}>Tax</span>
                        <span className="font-medium" style={{ color: COLORS.champagne }}>
                          AED {(totals?.taxAmount || 0).toFixed(2)}
                        </span>
                      </div>
                    )}

                    <Separator style={{ backgroundColor: `${COLORS.gold}30`, height: '1px' }} />

                    <div
                      className="flex justify-between p-3 rounded-lg"
                      style={{
                        background: `${COLORS.gold}15`,
                        border: `1px solid ${COLORS.gold}40`
                      }}
                    >
                      <span className="font-semibold text-sm" style={{ color: COLORS.champagne }}>
                        Total
                      </span>
                      <span className="font-bold text-lg" style={{ color: COLORS.gold }}>
                        AED {(totals?.total || 0).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="p-4 border-t flex-shrink-0" style={{ borderColor: `${COLORS.gold}20` }}>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  style={{
                    borderColor: `${COLORS.bronze}60`,
                    color: COLORS.bronze
                  }}
                >
                  Close
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={!onPayment || ticket.lineItems.length === 0}
                  className="flex-1"
                  style={{
                    background:
                      !onPayment || ticket.lineItems.length === 0
                        ? COLORS.charcoalDark
                        : `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                    color:
                      !onPayment || ticket.lineItems.length === 0 ? COLORS.bronze : COLORS.black,
                    opacity: !onPayment || ticket.lineItems.length === 0 ? 0.5 : 1
                  }}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Payment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Customer Selection Modal */}
      {organizationId && (
        <EnhancedCustomerModal
          open={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          organizationId={organizationId}
          onCustomerSelect={handleCustomerSelectInternal}
        />
      )}
    </Dialog>
  )
}
