'use client'

import { useState, useMemo } from 'react'
import { Search, User, Star, Check, Sparkles, Award, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useHeraStaff } from '@/hooks/useHeraStaff'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface StylistAssignmentModalProps {
  open: boolean
  onClose: () => void
  serviceId: string
  serviceName: string
  organizationId: string
  branchId?: string
  currentStylistId?: string
  onAssign: (stylistId: string, stylistName: string) => void
}

// Luxe Salon Color Palette
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

export function StylistAssignmentModal({
  open,
  onClose,
  serviceId,
  serviceName,
  organizationId,
  branchId,
  currentStylistId,
  onAssign
}: StylistAssignmentModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStylistId, setSelectedStylistId] = useState<string | null>(
    currentStylistId || null
  )
  const [isConfirming, setIsConfirming] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { toast } = useToast()

  // Use HERA Staff hook with branch filtering
  const { staff, isLoading } = useHeraStaff({
    organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: true,
      branch_id: branchId && branchId !== 'all' ? branchId : undefined,
      limit: 100
    }
  })

  // Filter stylists based on search
  const filteredStylists = useMemo(() => {
    if (!staff || !Array.isArray(staff)) {
      console.log('[StylistAssignmentModal] Staff data invalid:', staff)
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

  const handleAssign = async () => {
    if (!selectedStylistId || isConfirming) return

    const selectedStylist = staff?.find((s: any) => s.id === selectedStylistId)
    if (!selectedStylist) return

    try {
      // Start confirmation process
      setIsConfirming(true)

      // Simulate processing for smooth UX
      await new Promise(resolve => setTimeout(resolve, 400))

      // Call the assign callback
      onAssign(selectedStylist.id, selectedStylist.entity_name)

      // Show success state
      setShowSuccess(true)

      // Show success toast
      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" style={{ color: COLORS.gold }} />
            <span>Stylist Assigned</span>
          </div>
        ),
        description: (
          <div style={{ color: COLORS.bronze }}>
            <strong style={{ color: COLORS.champagne }}>{selectedStylist.entity_name}</strong> has
            been assigned to <strong style={{ color: COLORS.champagne }}>{serviceName}</strong>
          </div>
        ),
        className: 'border-0 shadow-2xl',
        style: {
          backgroundColor: COLORS.charcoal,
          borderColor: `${COLORS.gold}40`,
          boxShadow: `0 8px 24px ${COLORS.black}, 0 0 0 1px ${COLORS.gold}40`
        }
      })

      // Wait for success animation
      await new Promise(resolve => setTimeout(resolve, 800))

      // Close modal
      handleClose()
    } catch (error) {
      console.error('Error assigning stylist:', error)
      setIsConfirming(false)

      toast({
        title: 'Error',
        description: 'Failed to assign stylist. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleClose = () => {
    if (isConfirming) return // Prevent closing during confirmation

    setSelectedStylistId(currentStylistId || null)
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

  const getDisplayRate = (stylist: any) => {
    return stylist.display_rate || stylist.commission_rate || 30
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] border-0 shadow-2xl flex flex-col"
        style={{
          backgroundColor: COLORS.charcoal,
          boxShadow: `0 25px 50px -12px ${COLORS.black}, 0 0 0 1px ${COLORS.gold}20`
        }}
      >
        {/* Success Overlay */}
        {showSuccess && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center animate-fadeIn"
            style={{
              backgroundColor: `${COLORS.black}95`,
              backdropFilter: 'blur(8px)'
            }}
          >
            <div className="text-center animate-scaleIn">
              <div
                className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center animate-successPulse"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                  boxShadow: `0 0 0 0 ${COLORS.gold}60, 0 8px 32px ${COLORS.gold}60`
                }}
              >
                <CheckCircle2 className="w-12 h-12" style={{ color: COLORS.black }} />
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: COLORS.champagne }}>
                Stylist Assigned!
              </h3>
              <p className="text-lg" style={{ color: COLORS.bronze }}>
                Updating bill...
              </p>
            </div>
          </div>
        )}

        {/* Animated gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20 animate-gradient"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 30% 20%, ${COLORS.gold}40 0%, transparent 50%),
              radial-gradient(ellipse 70% 50% at 70% 80%, ${COLORS.gold}20 0%, transparent 50%)
            `
          }}
        />

        <DialogHeader
          className="pb-4 border-b relative z-10 flex-shrink-0"
          style={{ borderColor: `${COLORS.gold}20` }}
        >
          <DialogTitle className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100())`,
                boxShadow: `0 8px 20px ${COLORS.gold}40`
              }}
            >
              <Sparkles className="w-5 h-5" style={{ color: COLORS.black }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: COLORS.champagne }}>
                Select Your Stylist
              </h2>
              <p className="text-sm font-normal mt-0.5" style={{ color: COLORS.bronze }}>
                for{' '}
                <span className="font-semibold" style={{ color: COLORS.gold }}>
                  {serviceName}
                </span>
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-2 pb-4 flex-1 relative z-10 custom-scrollbar min-h-0">
          {/* Search */}
          <div className="relative group animate-slideDown">
            <Search
              className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors"
              style={{ color: COLORS.bronze }}
            />
            <Input
              placeholder="Search by name, role, or skills..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 h-11 border transition-all"
              style={{
                backgroundColor: COLORS.charcoalLight,
                borderColor: `${COLORS.gold}30`,
                color: COLORS.champagne
              }}
            />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12 animate-fadeIn">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold}40 0%, ${COLORS.goldDark}40 100%)`,
                  boxShadow: `0 8px 32px ${COLORS.gold}20`
                }}
              >
                <div
                  className="animate-spin rounded-full h-10 w-10 border-2"
                  style={{ borderColor: COLORS.gold, borderTopColor: 'transparent' }}
                />
              </div>
              <p style={{ color: COLORS.bronze }}>Loading stylists...</p>
            </div>
          )}

          {/* Stylists List */}
          {!isLoading && (
            <div className="space-y-3">
              {filteredStylists.length === 0 ? (
                <div className="text-center py-12 animate-fadeIn">
                  <div
                    className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                    style={{
                      backgroundColor: COLORS.charcoalLight,
                      boxShadow: `inset 0 2px 4px ${COLORS.black}60`
                    }}
                  >
                    <User className="w-8 h-8" style={{ color: COLORS.bronze }} />
                  </div>
                  <h3 className="font-semibold mb-2" style={{ color: COLORS.champagne }}>
                    No stylists found
                  </h3>
                  <p className="text-sm" style={{ color: COLORS.bronze }}>
                    {searchQuery
                      ? 'Try adjusting your search terms'
                      : branchId && branchId !== 'all'
                        ? 'No stylists available at this branch'
                        : 'No stylists available'}
                  </p>
                </div>
              ) : (
                filteredStylists.map((stylist: any, index: number) => {
                  const isSelected = selectedStylistId === stylist.id
                  const skills = getSkills(stylist)
                  const displayRate = getDisplayRate(stylist)

                  return (
                    <Card
                      key={stylist.id}
                      className={cn(
                        'cursor-pointer transition-all duration-300 hover:shadow-xl border-2 animate-scaleIn',
                        isConfirming && !isSelected && 'opacity-50 pointer-events-none'
                      )}
                      style={{
                        backgroundColor: isSelected ? `${COLORS.gold}15` : COLORS.charcoalLight,
                        borderColor: isSelected ? COLORS.gold : `${COLORS.gold}20`,
                        boxShadow: isSelected
                          ? `0 8px 24px ${COLORS.gold}40, 0 0 0 1px ${COLORS.gold}`
                          : `0 2px 8px ${COLORS.black}40`,
                        animationDelay: `${index * 50}ms`
                      }}
                      onClick={() => !isConfirming && setSelectedStylistId(stylist.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Avatar with selection indicator */}
                          <div className="relative flex-shrink-0">
                            <Avatar
                              className="w-14 h-14 ring-2 transition-all duration-300"
                              style={{
                                ringColor: isSelected ? COLORS.gold : `${COLORS.gold}30`,
                                boxShadow: isSelected ? `0 4px 12px ${COLORS.gold}60` : 'none'
                              }}
                            >
                              <AvatarImage src={stylist.avatar_url || undefined} />
                              <AvatarFallback
                                className="text-base font-semibold"
                                style={{
                                  background: isSelected
                                    ? `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`
                                    : `linear-gradient(135deg, ${COLORS.bronze} 0%, ${COLORS.bronze}80 100%)`,
                                  color: isSelected ? COLORS.black : COLORS.champagne
                                }}
                              >
                                {getInitials(stylist.entity_name)}
                              </AvatarFallback>
                            </Avatar>
                            {isSelected && (
                              <div
                                className="absolute -top-1 -right-1 rounded-full p-1 shadow-lg animate-pulse"
                                style={{
                                  background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`
                                }}
                              >
                                <Check className="w-4 h-4" style={{ color: COLORS.black }} />
                              </div>
                            )}
                          </div>

                          {/* Stylist Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h3
                                  className="font-semibold text-base mb-0.5"
                                  style={{
                                    color: isSelected ? COLORS.champagne : COLORS.lightText
                                  }}
                                >
                                  {stylist.entity_name}
                                </h3>
                                {stylist.role_title && (
                                  <p
                                    className="text-xs font-medium"
                                    style={{ color: COLORS.bronze }}
                                  >
                                    {stylist.role_title}
                                  </p>
                                )}
                              </div>
                              <Badge
                                className="text-xs font-semibold shadow-sm border"
                                style={{
                                  backgroundColor: isSelected ? COLORS.gold : `${COLORS.gold}20`,
                                  borderColor: COLORS.gold,
                                  color: isSelected ? COLORS.black : COLORS.gold
                                }}
                              >
                                Available
                              </Badge>
                            </div>

                            {/* Skills/Specialties */}
                            {skills.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {skills.slice(0, 3).map((skill: string, index: number) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs border"
                                    style={{
                                      backgroundColor: `${COLORS.charcoalDark}`,
                                      borderColor: `${COLORS.bronze}40`,
                                      color: COLORS.bronze
                                    }}
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                                {skills.length > 3 && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs border"
                                    style={{
                                      backgroundColor: `${COLORS.charcoalDark}`,
                                      borderColor: `${COLORS.bronze}40`,
                                      color: COLORS.bronze
                                    }}
                                  >
                                    +{skills.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-xs">
                              <div
                                className="flex items-center gap-1.5 font-medium"
                                style={{
                                  color: isSelected ? COLORS.gold : COLORS.bronze
                                }}
                              >
                                <Star className="w-3.5 h-3.5 fill-current" />
                                <span>{displayRate}% commission</span>
                              </div>
                              {stylist.hire_date && (
                                <div
                                  className="flex items-center gap-1.5 font-medium"
                                  style={{
                                    color: isSelected ? COLORS.gold : COLORS.bronze
                                  }}
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  <span>Since {new Date(stylist.hire_date).getFullYear()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div
          className="flex gap-3 pt-4 border-t mt-0 relative z-10 flex-shrink-0"
          style={{ borderColor: `${COLORS.gold}20` }}
        >
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isConfirming}
            className="flex-1 h-11 font-medium border hover:opacity-80 transition-all"
            style={{
              backgroundColor: COLORS.charcoalLight,
              borderColor: `${COLORS.bronze}60`,
              color: COLORS.bronze,
              opacity: isConfirming ? 0.5 : 1
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedStylistId || isConfirming}
            className={cn('flex-1 h-11 font-semibold shadow-lg transition-all duration-300')}
            style={{
              background:
                selectedStylistId && !isConfirming
                  ? `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`
                  : `${COLORS.charcoalLight}`,
              color: selectedStylistId && !isConfirming ? COLORS.black : COLORS.lightText,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: selectedStylistId && !isConfirming ? COLORS.gold : `${COLORS.gold}40`,
              boxShadow:
                selectedStylistId && !isConfirming ? `0 4px 16px ${COLORS.gold}50` : 'none',
              opacity: !selectedStylistId || isConfirming ? 0.6 : 1
            }}
          >
            {isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Assigning Stylist...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {!selectedStylistId ? 'Select Stylist First' : 'Assign Stylist'}
              </>
            )}
          </Button>
        </div>

        <style jsx>{`
          @keyframes gradient {
            0%,
            100% {
              opacity: 0.2;
            }
            50% {
              opacity: 0.3;
            }
          }
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
                0 0 0 0 ${COLORS.gold}60,
                0 8px 32px ${COLORS.gold}60;
            }
            50% {
              box-shadow:
                0 0 0 20px ${COLORS.gold}00,
                0 8px 32px ${COLORS.gold}80;
            }
          }
          .animate-gradient {
            animation: gradient 8s ease-in-out infinite;
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
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: ${COLORS.charcoalDark};
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: ${COLORS.bronze}40;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${COLORS.bronze}60;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
