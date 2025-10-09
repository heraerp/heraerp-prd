'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, User, Phone, Mail, Plus, Sparkles, UserPlus, Clock, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/luxe-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCustomerLookup } from '@/hooks/useCustomerLookup'
import { cn } from '@/lib/utils'

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
  emerald: '#0F6F5C'
}

interface EnhancedCustomerModalProps {
  open: boolean
  onClose: () => void
  organizationId: string
  onCustomerSelect: (customer: any) => void
}

export function EnhancedCustomerModal({
  open,
  onClose,
  organizationId,
  onCustomerSelect
}: EnhancedCustomerModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)

  const { searchCustomers, loading } = useCustomerLookup(organizationId)
  const [customers, setCustomers] = useState<any[]>([])

  // Load customers when search query changes
  useEffect(() => {
    const loadData = async () => {
      if (!organizationId) return
      const results = await searchCustomers({ q: searchQuery })
      setCustomers(results)
    }

    const timeoutId = setTimeout(loadData, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, organizationId, searchCustomers])

  // Filter results
  const filteredCustomers = useMemo(() => {
    return customers.filter(
      customer =>
        searchQuery === '' ||
        customer.entity_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer.phone || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [customers, searchQuery])

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer)
  }

  const handleConfirm = () => {
    if (selectedCustomer) {
      onCustomerSelect(selectedCustomer)
      handleClose()
    }
  }

  const handleClose = () => {
    setSelectedCustomer(null)
    setSearchQuery('')
    onClose()
  }

  const getInitials = (name: string) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) handleClose()
      }}
    >
      <DialogContent
        className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300"
        style={{
          backgroundColor: COLORS.charcoal,
          border: `2px solid ${COLORS.gold}30`,
          boxShadow: `0 25px 50px -12px ${COLORS.black}, 0 0 0 1px ${COLORS.gold}20`
        }}
        aria-describedby="customer-modal-description"
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
          className="p-6 border-b relative z-10"
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
                <User className="w-6 h-6" style={{ color: COLORS.black }} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold" style={{ color: COLORS.champagne }}>
                  Select Customer
                </DialogTitle>
                <p className="text-sm font-normal mt-0.5" style={{ color: COLORS.bronze }}>
                  Search existing or add new customer
                </p>
              </div>
            </div>
          </div>
          <p id="customer-modal-description" className="sr-only">
            Search for existing customers or add a new customer to the bill
          </p>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col relative z-10 min-h-0">
          {/* Search Bar */}
          <div className="p-6 pb-4">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5"
                style={{ color: COLORS.bronze }}
              />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base border-2 transition-all placeholder:text-bronze/60"
                style={
                  {
                    backgroundColor: COLORS.charcoalLight,
                    borderColor: searchQuery ? `${COLORS.gold}50` : `${COLORS.gold}20`,
                    color: COLORS.champagne,
                    '--placeholder-color': `${COLORS.bronze}99`
                  } as React.CSSProperties
                }
                autoFocus
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-6 pb-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Walk-In Customer */}
              <Card
                className={cn(
                  'cursor-pointer transition-all duration-200 border-2 hover:scale-[1.03] active:scale-[0.98]',
                  selectedCustomer?.id === 'walk-in' && 'ring-2'
                )}
                style={
                  {
                    backgroundColor:
                      selectedCustomer?.id === 'walk-in'
                        ? `${COLORS.gold}25`
                        : COLORS.charcoalLight,
                    borderColor:
                      selectedCustomer?.id === 'walk-in' ? COLORS.gold : `${COLORS.gold}40`,
                    '--tw-ring-color': COLORS.gold,
                    '--tw-ring-offset-color': COLORS.charcoal
                  } as React.CSSProperties
                }
                onClick={() =>
                  handleCustomerSelect({
                    id: 'walk-in',
                    entity_name: 'Walk-In Customer',
                    isWalkIn: true
                  })
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`
                      }}
                    >
                      <Sparkles className="w-6 h-6" style={{ color: COLORS.black }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm" style={{ color: COLORS.champagne }}>
                        Walk-In
                      </h3>
                      <p className="text-xs" style={{ color: COLORS.bronze }}>
                        Quick checkout
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Add New Customer */}
              <Card
                className="cursor-pointer transition-all duration-200 border-2 border-dashed hover:scale-[1.03] active:scale-[0.98] hover:border-solid"
                style={{
                  backgroundColor: `${COLORS.emerald}15`,
                  borderColor: `${COLORS.emerald}60`
                }}
                onClick={() => {
                  // TODO: Implement add new customer functionality
                  console.log('Add new customer clicked')
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `${COLORS.emerald}25`,
                        border: `2px solid ${COLORS.emerald}70`
                      }}
                    >
                      <Plus className="w-6 h-6" style={{ color: COLORS.emerald }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm" style={{ color: COLORS.champagne }}>
                        Add New
                      </h3>
                      <p className="text-xs" style={{ color: COLORS.bronze }}>
                        Create customer
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Divider */}
          <div className="px-6 pb-4">
            <div className="relative flex items-center gap-4">
              <div className="flex-1 h-px" style={{ backgroundColor: `${COLORS.gold}20` }} />
              <span
                className="text-xs font-semibold tracking-wider"
                style={{ color: COLORS.bronze }}
              >
                EXISTING CUSTOMERS
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: `${COLORS.gold}20` }} />
            </div>
          </div>

          {/* Customers List */}
          <ScrollArea className="flex-1 px-6 min-h-0">
            {loading ? (
              <div className="text-center py-16">
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `${COLORS.gold}20`,
                    boxShadow: `0 8px 32px ${COLORS.gold}20`
                  }}
                >
                  <div
                    className="animate-spin rounded-full h-10 w-10 border-3"
                    style={{ borderColor: COLORS.gold, borderTopColor: 'transparent' }}
                  />
                </div>
                <p className="text-sm" style={{ color: COLORS.bronze }}>
                  Searching customers...
                </p>
              </div>
            ) : filteredCustomers.length === 0 && searchQuery ? (
              <div className="text-center py-16">
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    border: `2px dashed ${COLORS.bronze}40`
                  }}
                >
                  <User className="w-8 h-8" style={{ color: COLORS.bronze }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: COLORS.champagne }}>
                  No customers found
                </h3>
                <p className="text-sm mb-4" style={{ color: COLORS.bronze }}>
                  Try a different search or add a new customer
                </p>
              </div>
            ) : (
              <div className="space-y-2 pb-4">
                {filteredCustomers.map((customer, index) => {
                  const isSelected = selectedCustomer?.id === customer.id

                  return (
                    <Card
                      key={customer.id}
                      className={cn(
                        'cursor-pointer transition-all duration-200 border-2 hover:scale-[1.02] active:scale-[0.99]',
                        isSelected && 'ring-2'
                      )}
                      style={
                        {
                          backgroundColor: isSelected ? `${COLORS.gold}20` : COLORS.charcoalLight,
                          borderColor: isSelected ? COLORS.gold : `${COLORS.gold}30`,
                          '--tw-ring-color': COLORS.gold,
                          '--tw-ring-offset-color': COLORS.charcoal,
                          animationDelay: `${index * 30}ms`
                        } as React.CSSProperties
                      }
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar
                            className="w-12 h-12 ring-2 flex-shrink-0"
                            style={
                              {
                                '--tw-ring-color': isSelected ? COLORS.gold : `${COLORS.gold}40`
                              } as React.CSSProperties
                            }
                          >
                            <AvatarImage src={customer.avatar_url} />
                            <AvatarFallback
                              className="font-bold text-sm"
                              style={{
                                background: isSelected
                                  ? `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`
                                  : `${COLORS.bronze}50`,
                                color: isSelected ? COLORS.black : COLORS.champagne
                              }}
                            >
                              {getInitials(customer.entity_name)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3
                                className="font-bold truncate"
                                style={{ color: COLORS.champagne }}
                              >
                                {customer.entity_name}
                              </h3>
                              {customer.vip && (
                                <Badge
                                  className="text-xs px-2 py-0 flex-shrink-0"
                                  style={{
                                    backgroundColor: `${COLORS.gold}20`,
                                    borderColor: COLORS.gold,
                                    color: COLORS.gold,
                                    border: `1px solid ${COLORS.gold}`
                                  }}
                                >
                                  VIP
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-0.5">
                              {customer.email && (
                                <div
                                  className="flex items-center gap-2 text-xs"
                                  style={{ color: COLORS.bronze }}
                                >
                                  <Mail className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{customer.email}</span>
                                </div>
                              )}
                              {customer.phone && (
                                <div
                                  className="flex items-center gap-2 text-xs"
                                  style={{ color: COLORS.bronze }}
                                >
                                  <Phone className="w-3 h-3 flex-shrink-0" />
                                  <span>{customer.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {customer.last_visit && (
                            <div className="text-right">
                              <div className="text-xs mb-1" style={{ color: COLORS.bronze }}>
                                Last visit
                              </div>
                              <div
                                className="text-xs font-semibold flex items-center gap-1"
                                style={{ color: isSelected ? COLORS.gold : COLORS.lightText }}
                              >
                                <Clock className="w-3 h-3" />
                                {new Date(customer.last_visit).toLocaleDateString()}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t relative z-10" style={{ borderColor: `${COLORS.gold}20` }}>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-12 font-medium border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: COLORS.charcoalLight,
                borderColor: `${COLORS.bronze}50`,
                color: COLORS.bronze
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedCustomer}
              className="flex-1 h-12 font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 disabled:opacity-50"
              style={{
                background: selectedCustomer
                  ? `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`
                  : COLORS.charcoalDark,
                color: selectedCustomer ? COLORS.black : COLORS.bronze,
                border: selectedCustomer ? 'none' : `2px solid ${COLORS.bronze}40`,
                boxShadow: selectedCustomer ? `0 8px 24px ${COLORS.gold}40` : 'none',
                cursor: selectedCustomer ? 'pointer' : 'not-allowed'
              }}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {selectedCustomer
                ? `Continue with ${selectedCustomer.entity_name}`
                : 'Select a Customer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
