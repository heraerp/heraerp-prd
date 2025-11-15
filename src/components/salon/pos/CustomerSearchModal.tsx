'use client'

import React, { useState } from 'react'
import { Search, User, Plus, Phone, Mail } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/luxe-dialog'
import { useHeraCustomers } from '@/hooks/useHeraCustomers'
import { useToast } from '@/hooks/use-toast'
import { SalonLuxeModal } from '@/components/salon/shared/SalonLuxeModal'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import { SalonLuxeInput } from '@/components/salon/shared/SalonLuxeInput'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323'
}

interface CustomerSearchInlineProps {
  selectedCustomer: any | null
  onCustomerSelect: (customer: any | null) => void
  organizationId: string
}

export function CustomerSearchInline({
  selectedCustomer,
  onCustomerSelect,
  organizationId
}: CustomerSearchInlineProps) {
  const [customerSearch, setCustomerSearch] = useState('')
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone: '',
    email: ''
  })
  const [creatingCustomer, setCreatingCustomer] = useState(false)

  const { customers, isLoading, createCustomer } = useHeraCustomers({
    organizationId,
    includeArchived: false
  })

  const { toast } = useToast()

  const filteredCustomers = customers.filter(customer =>
    customer.entity_name.toLowerCase().includes(customerSearch.toLowerCase())
  )

  const handleCreateCustomer = async () => {
    if (!newCustomerData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Customer name is required',
        variant: 'destructive'
      })
      return
    }

    setCreatingCustomer(true)
    try {
      const result = await createCustomer({
        name: newCustomerData.name,
        phone: newCustomerData.phone || undefined,
        email: newCustomerData.email || undefined
      })

      if (result) {
        toast({
          title: 'Success',
          description: 'Customer created successfully'
        })

        // Auto-select the newly created customer
        onCustomerSelect(result)
        setShowNewCustomerModal(false)
        setNewCustomerData({ name: '', phone: '', email: '' })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create customer',
        variant: 'destructive'
      })
    } finally {
      setCreatingCustomer(false)
    }
  }

  return (
    <>
      <div className="space-y-3">
        <h3 className="font-medium flex items-center gap-2" style={{ color: COLORS.champagne }}>
          <User className="w-4 h-4" style={{ color: COLORS.gold }} />
          Customer Details
        </h3>

        {selectedCustomer ? (
          <div
            className="p-3 rounded-lg"
            style={{
              background: `${COLORS.gold}10`,
              border: `1px solid ${COLORS.gold}30`
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm" style={{ color: COLORS.champagne }}>
                  {selectedCustomer.entity_name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: COLORS.lightText, opacity: 0.7 }}>
                  {selectedCustomer.phone ||
                    selectedCustomer.dynamic_fields?.phone?.value ||
                    'No phone'}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onCustomerSelect(null)
                  setCustomerSearch('')
                }}
                className="h-7 px-2 hover:scale-105 transition-transform"
                style={{
                  color: COLORS.gold
                }}
              >
                Change
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <Search
                className="absolute left-3 top-2.5 h-4 w-4"
                style={{ color: `${COLORS.gold}60` }}
              />
              <Input
                placeholder="Search customers..."
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                className="pl-9 text-sm h-9"
                style={{
                  background: COLORS.charcoalDark,
                  border: `1px solid ${COLORS.bronze}30`,
                  color: COLORS.champagne
                }}
              />
            </div>

            <Button
              onClick={() => setShowNewCustomerModal(true)}
              className="w-full h-9 text-sm transition-all duration-200"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.goldDark}15 100%)`,
                border: `1px solid ${COLORS.gold}40`,
                color: COLORS.gold
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${COLORS.gold}30 0%, ${COLORS.goldDark}25 100%)`
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.goldDark}15 100%)`
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Customer
            </Button>

            {customerSearch && (
              <ScrollArea className="h-32 mt-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div
                      className="animate-spin rounded-full h-6 w-6 border-b-2"
                      style={{ borderColor: COLORS.gold }}
                    />
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs" style={{ color: COLORS.lightText, opacity: 0.6 }}>
                      No customers found
                    </p>
                  </div>
                ) : (
                  filteredCustomers.map(customer => (
                    <div
                      key={customer.id}
                      className="p-3 rounded cursor-pointer transition-all duration-200"
                      style={{
                        background: COLORS.charcoalDark
                      }}
                      onMouseEnter={e =>
                        (e.currentTarget.style.background = `${COLORS.gold}15`)
                      }
                      onMouseLeave={e =>
                        (e.currentTarget.style.background = COLORS.charcoalDark)
                      }
                      onClick={() => {
                        onCustomerSelect(customer)
                        setCustomerSearch('')
                      }}
                    >
                      <p className="font-medium text-sm" style={{ color: COLORS.champagne }}>
                        {customer.entity_name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: COLORS.lightText, opacity: 0.6 }}>
                        {customer.phone ||
                          customer.dynamic_fields?.phone?.value ||
                          'No phone'}
                      </p>
                    </div>
                  ))
                )}
              </ScrollArea>
            )}
          </div>
        )}
      </div>

      {/* New Customer Modal - Using SalonLuxeModal Component */}
      <SalonLuxeModal
        open={showNewCustomerModal}
        onClose={() => {
          setShowNewCustomerModal(false)
          setNewCustomerData({ name: '', phone: '', email: '' })
        }}
        title="Add New Customer"
        description="Create a new customer profile for the salon"
        icon={<User className="w-6 h-6" />}
        size="sm"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <SalonLuxeButton
              variant="outline"
              onClick={() => {
                setShowNewCustomerModal(false)
                setNewCustomerData({ name: '', phone: '', email: '' })
              }}
              disabled={creatingCustomer}
            >
              Cancel
            </SalonLuxeButton>
            <SalonLuxeButton
              variant="primary"
              onClick={handleCreateCustomer}
              disabled={creatingCustomer || !newCustomerData.name.trim()}
              loading={creatingCustomer}
              icon={<Plus className="w-4 h-4" />}
            >
              {creatingCustomer ? 'Creating...' : 'Create Customer'}
            </SalonLuxeButton>
          </div>
        }
      >
        <div className="space-y-5 py-4">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-sm font-semibold" style={{ color: COLORS.champagne }}>
              Customer Name <span style={{ color: COLORS.gold }}>*</span>
            </label>
            <SalonLuxeInput
              id="customer-name"
              placeholder="Enter full name"
              value={newCustomerData.name}
              onChange={e => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
              leftIcon={<User className="w-4 h-4" />}
              autoFocus
            />
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <label className="text-sm font-semibold" style={{ color: COLORS.champagne }}>
              Phone Number
            </label>
            <SalonLuxeInput
              id="customer-phone"
              placeholder="Enter phone number"
              value={newCustomerData.phone}
              onChange={e => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
              leftIcon={<Phone className="w-4 h-4" />}
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-sm font-semibold" style={{ color: COLORS.champagne }}>
              Email Address
            </label>
            <SalonLuxeInput
              id="customer-email"
              type="email"
              placeholder="Enter email address"
              value={newCustomerData.email}
              onChange={e => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
              leftIcon={<Mail className="w-4 h-4" />}
            />
          </div>
        </div>
      </SalonLuxeModal>
    </>
  )
}

// Modal wrapper for use in other components like TicketDetailsModal
interface CustomerSearchModalProps {
  open: boolean
  onClose: () => void
  organizationId: string
  onSelectCustomer?: (customer: any) => void
  onCustomerSelect?: (customer: any) => void
}

export function CustomerSearchModal({
  open,
  onClose,
  organizationId,
  onSelectCustomer,
  onCustomerSelect
}: CustomerSearchModalProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)

  const handleCustomerSelect = (customer: any | null) => {
    if (customer) {
      setSelectedCustomer(customer)
      // Support both prop names for compatibility
      if (onCustomerSelect) {
        onCustomerSelect(customer)
      }
      if (onSelectCustomer) {
        onSelectCustomer(customer)
      }
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md"
        style={{
          backgroundColor: COLORS.charcoal,
          borderColor: COLORS.bronze + '33'
        }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-xl font-semibold"
            style={{
              background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Select Customer
          </DialogTitle>
          <DialogDescription style={{ color: COLORS.lightText }}>
            Search for an existing customer or create a new one
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <CustomerSearchInline
            selectedCustomer={selectedCustomer}
            onCustomerSelect={handleCustomerSelect}
            organizationId={organizationId}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
