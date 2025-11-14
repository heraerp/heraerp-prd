'use client'

import React, { useEffect, useMemo } from 'react'
import { SalonLuxeModal } from '@/components/salon/shared/SalonLuxeModal'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import { Building2, Users, Check, ChevronRight, Sparkles } from 'lucide-react'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { useSalonPOS } from '@/hooks/useSalonPOS'
import { CustomerSearchInline } from '@/components/salon/pos/CustomerSearchModal'

// Luxe salon color palette
const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  lightText: '#E0E0E0',
  charcoalLight: '#232323',
  emerald: '#10B981',
  emeraldDark: '#0F6F5C',
  plum: '#B794F4',
  rose: '#E8B4B8'
}

interface BillSetupModalProps {
  open: boolean
  onClose: () => void
  onComplete: (data: {
    branchId: string
    branchName: string
    customerId: string
    customerName: string
    stylistId?: string // ✅ Optional - not required for product-only sales
    stylistName?: string // ✅ Optional - not required for product-only sales
  }) => void
  organizationId: string
  currentBranchId?: string
  currentCustomerId?: string
  currentStylistId?: string
  title?: string
  description?: string
  lineItems?: any[] // ✅ NEW: Pass cart line items to check if services exist
  pendingItem?: { item: any; staffId?: string; staffName?: string } | null // ✅ NEW: Check pending item type
}

export function BillSetupModal({
  open,
  onClose,
  onComplete,
  organizationId,
  currentBranchId,
  currentCustomerId,
  currentStylistId,
  title = 'Bill Setup',
  description = 'All three fields are required for every sale',
  lineItems = [], // ✅ Default to empty array
  pendingItem = null // ✅ Default to null
}: BillSetupModalProps) {
  const { availableBranches } = useSecuredSalonContext()

  const [selectedBranch, setSelectedBranch] = useState<string | undefined>(currentBranchId)
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)
  const [selectedStylist, setSelectedStylist] = useState<any | null>(null)

  // Load staff/stylists - will be filtered by branch
  const { staff, isLoading: staffLoading } = useSalonPOS({
    organizationId,
    search: ''
  })

  // ✅ Check if cart has services (staff required) or only products (staff optional)
  // IMPORTANT: Also check pendingItem because modal opens BEFORE item is added to cart
  const hasServices = useMemo(() => {
    // Check existing cart items
    const cartHasServices = lineItems.some(item => item.entity_type === 'service')

    // Check if pending item (being added) is a service
    const pendingIsService = pendingItem?.item?.__kind === 'SERVICE'

    return cartHasServices || pendingIsService
  }, [lineItems, pendingItem])

  // Filter staff by selected branch
  const filteredStaff = useMemo(() => {
    if (!selectedBranch || !staff) return staff || []
    // TODO: Filter staff by branch via relationships
    // For now, return all staff - implement branch filtering when relationship data is available
    return staff
  }, [staff, selectedBranch])

  // Pre-select current values when modal opens
  useEffect(() => {
    if (open) {
      // ✅ FIX: Always update branch when currentBranchId changes (reflects catalog dropdown selection)
      if (currentBranchId) {
        setSelectedBranch(currentBranchId)
      }

      if (currentCustomerId) {
        // Customer will be handled by CustomerSearchInline
        setSelectedCustomer({ id: currentCustomerId })
      }

      if (currentStylistId && staff) {
        const stylist = staff.find((s: any) => s.id === currentStylistId)
        if (stylist) setSelectedStylist(stylist)
      }
    }
  }, [open, currentBranchId, currentCustomerId, currentStylistId, staff])

  // ✅ UPDATED: Validation - Stylist optional for product-only sales
  const isValid = useMemo(() => {
    if (!selectedBranch) return false
    if (!selectedCustomer) return false
    // ✅ FIX: Only require stylist if there are services in the cart
    if (hasServices && !selectedStylist) return false
    return true
  }, [selectedBranch, selectedCustomer, selectedStylist, hasServices])

  const handleComplete = () => {
    // ✅ UPDATED: Only require stylist validation if services exist
    if (!isValid || !selectedBranch || !selectedCustomer) return
    if (hasServices && !selectedStylist) return

    const branchName = availableBranches?.find(b => b.id === selectedBranch)?.entity_name || ''

    onComplete({
      branchId: selectedBranch,
      branchName,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.entity_name,
      // ✅ FIX: Only include stylist if one is selected (optional for products)
      ...(selectedStylist ? {
        stylistId: selectedStylist.id,
        stylistName: selectedStylist.entity_name
      } : {})
    })

    onClose()
  }

  return (
    <SalonLuxeModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      icon={<Sparkles className="w-6 h-6" />}
      size="lg"
      footer={
        <>
          <SalonLuxeButton variant="outline" onClick={onClose}>
            Cancel
          </SalonLuxeButton>
          <SalonLuxeButton
            variant="primary"
            onClick={handleComplete}
            disabled={!isValid}
          >
            <Check className="w-4 h-4 mr-2" />
            Continue
          </SalonLuxeButton>
        </>
      }
    >
      <div className="space-y-6 py-4">
        {/* Branch Selection */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="p-2 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.gold}10 100%)`,
                border: `1px solid ${COLORS.gold}40`
              }}
            >
              <Building2 className="w-4 h-4" style={{ color: COLORS.gold }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: COLORS.champagne }}>
                Branch Location
              </h3>
              <p className="text-xs" style={{ color: COLORS.lightText, opacity: 0.9 }}>
                Required • Select your salon branch
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {availableBranches?.map((branch) => (
              <button
                key={branch.id}
                onClick={() => setSelectedBranch(branch.id)}
                className="p-4 rounded-xl text-left transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: selectedBranch === branch.id
                    ? `linear-gradient(135deg, ${COLORS.gold}25 0%, ${COLORS.gold}15 100%)`
                    : `linear-gradient(135deg, ${COLORS.charcoalLight} 0%, ${COLORS.charcoal} 100%)`,
                  border: selectedBranch === branch.id
                    ? `2px solid ${COLORS.gold}`
                    : `1px solid ${COLORS.charcoalLight}`,
                  boxShadow: selectedBranch === branch.id
                    ? `0 4px 20px ${COLORS.gold}30`
                    : 'none'
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate" style={{ color: COLORS.champagne }}>
                      {branch.entity_name}
                    </div>
                    {branch.address && (
                      <div className="text-xs mt-1 truncate" style={{ color: COLORS.lightText, opacity: 0.85 }}>
                        {branch.address}
                      </div>
                    )}
                  </div>
                  {selectedBranch === branch.id && (
                    <Check className="w-5 h-5 flex-shrink-0 ml-2" style={{ color: COLORS.gold }} />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Customer Selection - Using CustomerSearchInline */}
        <div>
          <CustomerSearchInline
            selectedCustomer={selectedCustomer}
            onCustomerSelect={setSelectedCustomer}
            organizationId={organizationId}
          />
        </div>

        {/* Stylist Selection - Required for services, Optional for products */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="p-2 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${COLORS.emerald}20 0%, ${COLORS.emerald}10 100%)`,
                border: `1px solid ${COLORS.emerald}40`
              }}
            >
              <Users className="w-4 h-4" style={{ color: COLORS.emerald }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: COLORS.champagne }}>
                Stylist / Staff
              </h3>
              <p className="text-xs" style={{ color: COLORS.lightText, opacity: 0.9 }}>
                {/* ✅ FIX: Show "Optional" for product-only sales */}
                {hasServices ? 'Required' : 'Optional'} • {selectedBranch ? 'Select the service provider' : 'Select a branch first'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto custom-scrollbar">
            {staffLoading ? (
              <div className="col-span-2 p-4 text-center" style={{ color: COLORS.lightText }}>
                <p className="text-sm" style={{ color: COLORS.champagne }}>Loading staff...</p>
              </div>
            ) : filteredStaff?.length === 0 ? (
              <div className="col-span-2 p-4 text-center" style={{ color: COLORS.lightText }}>
                <p className="text-sm" style={{ color: COLORS.champagne }}>No staff members found</p>
              </div>
            ) : (
              filteredStaff?.map((stylist: any) => (
                <button
                  key={stylist.id}
                  onClick={() => setSelectedStylist(stylist)}
                  className="p-4 rounded-xl text-left transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: selectedStylist?.id === stylist.id
                      ? `linear-gradient(135deg, ${COLORS.emerald}25 0%, ${COLORS.emerald}15 100%)`
                      : `linear-gradient(135deg, ${COLORS.charcoalLight} 0%, ${COLORS.charcoal} 100%)`,
                    border: selectedStylist?.id === stylist.id
                      ? `2px solid ${COLORS.emerald}`
                      : `1px solid ${COLORS.charcoalLight}`,
                    boxShadow: selectedStylist?.id === stylist.id
                      ? `0 4px 20px ${COLORS.emerald}30`
                      : 'none'
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate" style={{ color: COLORS.champagne }}>
                        {stylist.entity_name}
                      </div>
                      {stylist.specialization && (
                        <div className="text-xs mt-1 truncate" style={{ color: COLORS.lightText, opacity: 0.85 }}>
                          {stylist.specialization}
                        </div>
                      )}
                    </div>
                    {selectedStylist?.id === stylist.id && (
                      <Check className="w-5 h-5 flex-shrink-0 ml-2" style={{ color: COLORS.emerald }} />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Validation Summary */}
        {!isValid && (
          <div
            className="p-4 rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${COLORS.rose}15 0%, ${COLORS.rose}10 100%)`,
              border: `1px solid ${COLORS.rose}40`
            }}
          >
            <div className="text-sm">
              <div className="font-medium mb-2" style={{ color: COLORS.champagne }}>
                Please complete all required fields:
              </div>
              <ul className="space-y-1" style={{ color: COLORS.lightText }}>
                {!selectedBranch && (
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3" style={{ color: COLORS.rose }} />
                    <span style={{ color: COLORS.champagne }}>Select a branch location</span>
                  </li>
                )}
                {!selectedCustomer && (
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3" style={{ color: COLORS.rose }} />
                    <span style={{ color: COLORS.champagne }}>Select a customer</span>
                  </li>
                )}
                {/* ✅ FIX: Only show stylist requirement if there are services */}
                {hasServices && !selectedStylist && (
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3" style={{ color: COLORS.rose }} />
                    <span style={{ color: COLORS.champagne }}>Select a stylist / staff member</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${COLORS.charcoal};
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${COLORS.gold}40;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${COLORS.gold}60;
        }
      `}</style>
    </SalonLuxeModal>
  )
}
