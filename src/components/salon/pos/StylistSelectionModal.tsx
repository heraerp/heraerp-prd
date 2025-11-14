'use client'

import React from 'react'
import { User, Check, Award, Sparkles, CheckCircle2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { useHeraStaff } from '@/hooks/useHeraStaff'
import { cn } from '@/lib/utils'
import { SalonLuxeModal, SalonLuxeButton, SalonLuxeBadge, SalonLuxeTile } from '@/components/salon/shared'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

interface StylistSelectionModalProps {
  open: boolean
  onClose: () => void
  service: any
  organizationId: string
  branchId?: string
  currentStylistId?: string
  onConfirm: (staffId: string, staffName?: string) => void
}

export function StylistSelectionModal({
  open,
  onClose,
  service,
  organizationId,
  branchId,
  currentStylistId,
  onConfirm
}: StylistSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(currentStylistId || null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { toast } = useToast()

  // Memoize filters to prevent unnecessary re-fetches
  const staffFilters = useMemo(() => ({
    include_dynamic: true,
    include_relationships: true,
    branch_id: branchId && branchId !== 'all' ? branchId : undefined,
    limit: 100
  }), [branchId])

  // Use HERA Staff hook with memoized filters and only fetch when modal is open
  const { staff, isLoading } = useHeraStaff({
    organizationId,
    enabled: open, // Only fetch when modal is open
    filters: staffFilters
  })

  // Filter stylists based on search
  const stylists = useMemo(() => {
    if (!staff || !Array.isArray(staff)) {
      return []
    }

    return staff.filter((stylist: any) => {
      if (!stylist) return false

      const matchesSearch =
        !searchQuery ||
        stylist.entity_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stylist.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stylist.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stylist.role_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (stylist.skills &&
          Array.isArray(stylist.skills) &&
          stylist.skills.some((skill: string) =>
            skill.toLowerCase().includes(searchQuery.toLowerCase())
          ))

      return matchesSearch
    })
  }, [staff, searchQuery])

  const handleConfirm = async () => {
    if (!selectedStaffId || isConfirming) return

    const selectedStylist = staff?.find((s: any) => s.id === selectedStaffId)
    if (!selectedStylist) return

    try {
      setIsConfirming(true)
      await new Promise(resolve => setTimeout(resolve, 400))
      onConfirm(selectedStaffId, selectedStylist.entity_name)
      setShowSuccess(true)

      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" style={{ color: SALON_LUXE_COLORS.gold.base }} />
            <span>Staff Assigned Successfully</span>
          </div>
        ),
        description: (
          <div style={{ color: SALON_LUXE_COLORS.text.secondary }}>
            <strong style={{ color: SALON_LUXE_COLORS.text.primary }}>{selectedStylist.entity_name}</strong> will be credited for{' '}
            <strong style={{ color: SALON_LUXE_COLORS.text.primary }}>{service?.entity_name || service?.name || service?.title}</strong>
          </div>
        ),
        className: 'border-0 shadow-2xl',
        style: {
          background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.charcoal.base} 0%, ${SALON_LUXE_COLORS.charcoal.dark} 100%)`,
          border: `1px solid ${SALON_LUXE_COLORS.border.base}`
        }
      })

      await new Promise(resolve => setTimeout(resolve, 800))
      handleClose()
    } catch (error) {
      console.error('Error confirming stylist:', error)
      setIsConfirming(false)

      toast({
        title: 'Error',
        description: 'Failed to assign stylist. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleClose = () => {
    if (isConfirming) return
    setSelectedStaffId(currentStylistId || null)
    setSearchQuery('')
    setIsConfirming(false)
    setShowSuccess(false)
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

  const getSkills = (stylist: any) => {
    if (!stylist.skills) return []
    if (Array.isArray(stylist.skills)) return stylist.skills
    try {
      return typeof stylist.skills === 'string' ? JSON.parse(stylist.skills) : []
    } catch {
      return []
    }
  }

  return (
    <>
      <SalonLuxeModal
        open={open}
        onClose={handleClose}
        title="Select Staff Member"
        description={
          <>
            Required for{' '}
            <span style={{ fontWeight: 600, color: SALON_LUXE_COLORS.champagne }}>
              {service?.entity_name || service?.name || service?.title}
            </span>
          </>
        }
        icon={<Sparkles className="w-6 h-6" />}
        size="md"
        footer={
          <>
            <SalonLuxeButton variant="danger" onClick={handleClose} disabled={isConfirming} className="flex-1" size="lg">
              Cancel
            </SalonLuxeButton>
            <SalonLuxeButton
              variant="tile"
              onClick={handleConfirm}
              disabled={!selectedStaffId || isConfirming}
              loading={isConfirming}
              icon={!isConfirming && <CheckCircle2 className="w-5 h-5" />}
              className="flex-1"
              size="lg"
            >
              {isConfirming ? 'Assigning Staff...' : !selectedStaffId ? 'Select Staff Member' : '💾 Confirm Selection'}
            </SalonLuxeButton>
          </>
        }
      >
        {/* Success Overlay - Gold with emerald accent for confirmation */}
        {showSuccess && (
          <div className="absolute inset-0 z-50 flex items-center justify-center animate-fadeIn" style={{ backgroundColor: 'rgba(15, 15, 15, 0.7)', backdropFilter: 'blur(12px)' }}>
            <div className="text-center animate-scaleIn">
              <div
                className="w-28 h-28 mx-auto mb-6 rounded-full flex items-center justify-center animate-successPulse"
                style={{
                  background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.gold.base} 0%, ${SALON_LUXE_COLORS.emerald?.base || '#10B981'} 100%)`,
                  border: `4px solid ${SALON_LUXE_COLORS.gold.base}`,
                  boxShadow: `0 8px 32px ${SALON_LUXE_COLORS.emerald?.base || '#10B981'}40`
                }}
              >
                <CheckCircle2 className="w-14 h-14" style={{ color: SALON_LUXE_COLORS.text.onGold }} />
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{
                background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.champagne} 0%, ${SALON_LUXE_COLORS.emerald?.light || '#6EE7B7'} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Staff Assigned!</h3>
              <p className="text-base" style={{ color: SALON_LUXE_COLORS.text.secondary }}>Adding to bill...</p>
            </div>
          </div>
        )}

        {/* Enterprise Policy Notice - Plum accent for visual balance */}
        <div
          className="px-4 py-3 rounded-lg mb-4 animate-slideDown"
          style={{
            background: `linear-gradient(to right, ${SALON_LUXE_COLORS.plum?.lighter || 'rgba(183, 148, 244, 0.15)'}, ${SALON_LUXE_COLORS.charcoal.light})`,
            border: `1px solid ${SALON_LUXE_COLORS.plum?.base || '#B794F4'}40`,
            boxShadow: `0 2px 8px ${SALON_LUXE_COLORS.plum?.base || '#B794F4'}15`
          }}
        >
          <div className="flex items-start gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 animate-pulse"
              style={{ backgroundColor: SALON_LUXE_COLORS.plum?.base || '#B794F4' }}
            />
            <p className="text-xs leading-relaxed" style={{ color: SALON_LUXE_COLORS.text.primary }}>
              <span style={{ fontWeight: 600, color: SALON_LUXE_COLORS.plum?.light || '#D8B4FE' }}>Enterprise Policy:</span> Every sale must be linked to a staff member for accurate performance tracking and commission calculation.
            </p>
          </div>
        </div>

        {/* Search - Emerald focus for visual interest */}
        <div className="relative group mb-4 animate-slideDown">
          <Search
            className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4"
            style={{
              color: SALON_LUXE_COLORS.text.tertiary,
              transitionProperty: 'color',
              transitionDuration: '0.3s',
              transitionTimingFunction: 'ease'
            }}
          />
          <Input
            placeholder="Search by name, role, or skills..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 h-11 border-2 focus-within:ring-2"
            style={{
              backgroundColor: SALON_LUXE_COLORS.charcoal.dark,
              color: SALON_LUXE_COLORS.text.primary,
              borderColor: SALON_LUXE_COLORS.border.muted,
              transitionProperty: 'border-color, box-shadow',
              transitionDuration: '0.3s',
              transitionTimingFunction: 'ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = SALON_LUXE_COLORS.emerald?.base || '#10B981'
              e.currentTarget.style.boxShadow = `0 0 0 3px ${SALON_LUXE_COLORS.emerald?.lighter || 'rgba(16, 185, 129, 0.15)'}`
              const icon = e.currentTarget.previousElementSibling as HTMLElement
              if (icon) icon.style.color = SALON_LUXE_COLORS.emerald?.base || '#10B981'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = SALON_LUXE_COLORS.border.muted
              e.currentTarget.style.boxShadow = 'none'
              const icon = e.currentTarget.previousElementSibling as HTMLElement
              if (icon) icon.style.color = SALON_LUXE_COLORS.text.tertiary
            }}
          />
        </div>

        {/* Loading State - Emerald accent for freshness */}
        {isLoading && (
          <div className="text-center py-12 animate-fadeIn">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.emerald?.lighter || 'rgba(16, 185, 129, 0.15)'}, ${SALON_LUXE_COLORS.charcoal.light})`,
                border: `1px solid ${SALON_LUXE_COLORS.emerald?.base || '#10B981'}40`
              }}
            >
              <div
                className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent"
                style={{
                  borderColor: SALON_LUXE_COLORS.emerald?.base || '#10B981',
                  borderTopColor: 'transparent'
                }}
              />
            </div>
            <p style={{ color: SALON_LUXE_COLORS.text.secondary }}>Loading stylists...</p>
          </div>
        )}

        {/* Stylists Grid */}
        {!isLoading && (
          <div className="grid grid-cols-2 gap-3">
            {stylists.length === 0 ? (
              <div className="col-span-2 text-center py-12 animate-fadeIn">
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.rose?.lighter || 'rgba(232, 180, 184, 0.15)'}, ${SALON_LUXE_COLORS.charcoal.light})`,
                    border: `2px solid ${SALON_LUXE_COLORS.rose?.base || '#E8B4B8'}40`
                  }}
                >
                  <User className="w-8 h-8" style={{ color: SALON_LUXE_COLORS.rose?.base || '#E8B4B8' }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: SALON_LUXE_COLORS.text.primary }}>No stylists found</h3>
                <p className="text-sm" style={{ color: SALON_LUXE_COLORS.text.secondary }}>
                  {searchQuery
                    ? 'Try adjusting your search terms'
                    : branchId && branchId !== 'all'
                      ? 'No stylists available at this branch'
                      : 'No stylists available'}
                </p>
              </div>
            ) : (
              stylists.map((stylist: any, index: number) => {
                const isSelected = selectedStaffId === stylist.id
                const skills = getSkills(stylist)

                return (
                  <SalonLuxeTile
                    key={stylist.id}
                    mode="grid"
                    enableMouseTracking={!isConfirming}
                    enableHoverEffects={!isConfirming}
                    opacity={isConfirming && !isSelected ? 0.5 : 1}
                    borderColor={isSelected ? SALON_LUXE_COLORS.gold.base : undefined}
                    background={
                      isSelected
                        ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.08) 50%, rgba(184, 134, 11, 0.05) 100%)'
                        : undefined
                    }
                    className={cn(
                      'p-4 animate-scaleIn',
                      isConfirming && !isSelected && 'pointer-events-none'
                    )}
                    style={{
                      boxShadow: isSelected ? `0 8px 24px ${SALON_LUXE_COLORS.shadow.gold}` : undefined,
                      animationDelay: `${index * 50}ms`
                    }}
                    onClick={() => !isConfirming && setSelectedStaffId(stylist.id)}
                  >
                    <div className="relative">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <Avatar
                            className="w-14 h-14 ring-2"
                            style={{
                              ringColor: isSelected ? SALON_LUXE_COLORS.gold.base : SALON_LUXE_COLORS.border.muted,
                              boxShadow: isSelected ? `0 4px 12px ${SALON_LUXE_COLORS.shadow.goldLight}` : undefined,
                              transitionProperty: 'ring-color, box-shadow',
                              transitionDuration: '0.3s',
                              transitionTimingFunction: 'ease'
                            }}
                          >
                            <AvatarImage src={stylist.avatarUrl || undefined} />
                            <AvatarFallback
                              className="flex items-center justify-center"
                              style={{
                                background: isSelected
                                  ? `linear-gradient(to bottom right, ${SALON_LUXE_COLORS.gold.base}, ${SALON_LUXE_COLORS.gold.dark})`
                                  : `linear-gradient(to bottom right, ${SALON_LUXE_COLORS.charcoal.lighter}, ${SALON_LUXE_COLORS.charcoal.light})`,
                                color: isSelected ? SALON_LUXE_COLORS.text.onGold : SALON_LUXE_COLORS.champagne
                              }}
                            >
                              <User className="w-7 h-7" />
                            </AvatarFallback>
                          </Avatar>
                          {isSelected && (
                            <div
                              className="absolute -top-1 -right-1 rounded-full p-1 shadow-lg animate-pulse"
                              style={{
                                background: `linear-gradient(to bottom right, ${SALON_LUXE_COLORS.gold.base}, ${SALON_LUXE_COLORS.gold.dark})`
                              }}
                            >
                              <Check className="w-4 h-4" style={{ color: SALON_LUXE_COLORS.text.onGold }} />
                            </div>
                          )}
                        </div>

                        {/* Stylist Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h3
                                className="font-semibold text-base mb-0.5"
                                style={{ color: isSelected ? SALON_LUXE_COLORS.text.primary : SALON_LUXE_COLORS.text.primary }}
                              >
                                {stylist.entity_name}
                              </h3>
                              <p className="text-xs font-medium" style={{ color: SALON_LUXE_COLORS.text.secondary }}>
                                {stylist.role_title || stylist.entity_code || 'Stylist'}
                              </p>
                            </div>
                            <div
                              className="px-2.5 py-1 rounded-md text-xs font-semibold"
                              style={{
                                background: isSelected
                                  ? `linear-gradient(135deg, ${SALON_LUXE_COLORS.emerald?.base || '#10B981'}, ${SALON_LUXE_COLORS.emerald?.dark || '#0F6F5C'})`
                                  : `linear-gradient(to right, ${SALON_LUXE_COLORS.emerald?.lighter || 'rgba(16, 185, 129, 0.15)'}, ${SALON_LUXE_COLORS.charcoal.lighter})`,
                                color: isSelected ? SALON_LUXE_COLORS.charcoal.dark : (SALON_LUXE_COLORS.emerald?.base || '#10B981'),
                                border: `1px solid ${SALON_LUXE_COLORS.emerald?.base || '#10B981'}${isSelected ? '' : '40'}`,
                                boxShadow: isSelected ? `0 2px 8px ${SALON_LUXE_COLORS.emerald?.base || '#10B981'}40` : 'none',
                                transitionProperty: 'background, color, border, box-shadow',
                                transitionDuration: '0.3s',
                                transitionTimingFunction: 'ease'
                              }}
                            >
                              Available
                            </div>
                          </div>

                          {/* Skills - Plum gradient for visual variety */}
                          {skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {skills.slice(0, 3).map((skill: string, idx: number) => (
                                <div
                                  key={idx}
                                  className="px-2 py-0.5 rounded text-xs font-medium"
                                  style={{
                                    background: `linear-gradient(to right, ${SALON_LUXE_COLORS.plum?.lighter || 'rgba(183, 148, 244, 0.15)'}, ${SALON_LUXE_COLORS.charcoal.lighter})`,
                                    color: SALON_LUXE_COLORS.plum?.light || '#D8B4FE',
                                    border: `1px solid ${SALON_LUXE_COLORS.plum?.base || '#B794F4'}30`
                                  }}
                                >
                                  {skill}
                                </div>
                              ))}
                              {skills.length > 3 && (
                                <div
                                  className="px-2 py-0.5 rounded text-xs font-medium"
                                  style={{
                                    background: `linear-gradient(to right, ${SALON_LUXE_COLORS.plum?.lighter || 'rgba(183, 148, 244, 0.15)'}, ${SALON_LUXE_COLORS.charcoal.lighter})`,
                                    color: SALON_LUXE_COLORS.plum?.light || '#D8B4FE',
                                    border: `1px solid ${SALON_LUXE_COLORS.plum?.base || '#B794F4'}30`
                                  }}
                                >
                                  +{skills.length - 3} more
                                </div>
                              )}
                            </div>
                          )}

                          {/* Stats */}
                          {stylist.hire_date && (
                            <div className="flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-1.5 font-medium" style={{ color: SALON_LUXE_COLORS.text.secondary }}>
                                <Award className="w-3.5 h-3.5" />
                                <span>Since {new Date(stylist.hire_date).getFullYear()}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </SalonLuxeTile>
                )
              })
            )}
          </div>
        )}

        {/* Animations */}
        <style jsx>{`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes successPulse {
            0%,
            100% {
              box-shadow:
                0 0 0 0 ${SALON_LUXE_COLORS.shadow.gold},
                0 8px 32px ${SALON_LUXE_COLORS.shadow.gold};
            }
            50% {
              box-shadow:
                0 0 0 20px rgba(212, 175, 55, 0),
                0 8px 32px ${SALON_LUXE_COLORS.shadow.gold};
            }
          }
          .animate-slideDown {
            animation: slideDown 0.4s ease-out;
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
          .animate-scaleIn {
            animation: scaleIn 0.4s ease-out backwards;
          }
          .animate-successPulse {
            animation: successPulse 1.5s ease-out infinite;
          }
        `}</style>
      </SalonLuxeModal>
    </>
  )
}
