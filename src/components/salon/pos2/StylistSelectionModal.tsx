'use client'

import { useState, useEffect } from 'react'
import { User, Check, Clock, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { universalApi } from '@/lib/universal-api-v2'
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
  plum: '#B794F4',
  emerald: '#0F6F5C'
}

interface Stylist {
  id: string
  name: string
  specialties?: string[]
  rating?: number
  available?: boolean
  avatar?: string
}

interface StylistSelectionModalProps {
  open: boolean
  onClose: () => void
  service: {
    id: string
    name: string
    entity_type: 'service' | 'product'
    price: number
  }
  organizationId: string
  onConfirm: (data: {
    entity_id: string
    entity_type: 'service' | 'product'
    entity_name: string
    quantity: number
    unit_price: number
    stylist_id?: string
    stylist_name?: string
  }) => void
}

export function StylistSelectionModal({
  open,
  onClose,
  service,
  organizationId,
  onConfirm
}: StylistSelectionModalProps) {
  const [stylists, setStylists] = useState<Stylist[]>([])
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  // Load stylists when modal opens
  useEffect(() => {
    if (open && organizationId) {
      loadStylists()
    }
  }, [open, organizationId])

  const loadStylists = async () => {
    try {
      setLoading(true)
      universalApi.setOrganizationId(organizationId)

      // Load employees who are stylists
      const response = await universalApi.getEntities({
        filters: {
          entity_type: 'employee'
        },
        pageSize: 100
      })

      if (response.success && response.data) {
        const stylistData = response.data
          .filter(emp => {
            // Check if employee is a stylist based on metadata
            const role = emp.metadata?.role || emp.metadata?.position
            const isActive = emp.metadata?.is_active !== false
            return (
              isActive &&
              (role === 'stylist' ||
                role === 'senior_stylist' ||
                role === 'master_stylist' ||
                emp.metadata?.is_stylist === true)
            )
          })
          .map(emp => ({
            id: emp.id,
            name: emp.entity_name,
            specialties: emp.metadata?.specialties?.split(',') || [],
            rating: emp.metadata?.rating || 4.5,
            available: emp.metadata?.available !== false,
            avatar: emp.metadata?.avatar_url
          }))

        // Add a "No Preference" option
        setStylists([
          {
            id: 'any',
            name: 'Any Available Stylist',
            specialties: ['All Services'],
            rating: 0,
            available: true
          },
          ...stylistData
        ])
      }
    } catch (error) {
      console.error('Error loading stylists:', error)
      // Fallback stylists for demo
      setStylists([
        {
          id: 'any',
          name: 'Any Available Stylist',
          specialties: ['All Services'],
          rating: 0,
          available: true
        },
        {
          id: 'sarah',
          name: 'Sarah Johnson',
          specialties: ['Color', 'Cuts'],
          rating: 4.8,
          available: true
        },
        {
          id: 'mike',
          name: 'Mike Chen',
          specialties: ['Cuts', 'Styling'],
          rating: 4.9,
          available: true
        },
        {
          id: 'lisa',
          name: 'Lisa Williams',
          specialties: ['Color', 'Treatments'],
          rating: 4.7,
          available: true
        },
        {
          id: 'alex',
          name: 'Alex Rodriguez',
          specialties: ['Cuts', 'Beard'],
          rating: 4.6,
          available: false
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    const finalStylist = selectedStylist?.id === 'any' ? null : selectedStylist

    onConfirm({
      entity_id: service.id,
      entity_type: service.entity_type,
      entity_name: service.name,
      quantity,
      unit_price: service.price,
      stylist_id: finalStylist?.id,
      stylist_name: finalStylist?.name
    })

    // Reset and close
    setSelectedStylist(null)
    setQuantity(1)
    onClose()
  }

  const handleQuickAdd = () => {
    // Quick add with "Walk-in" stylist
    onConfirm({
      entity_id: service.id,
      entity_type: service.entity_type,
      entity_name: service.name,
      quantity: 1,
      unit_price: service.price,
      stylist_id: 'walk-in', // Special ID for walk-in services
      stylist_name: 'Walk-in'
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent
        className="max-w-2xl"
        style={{
          backgroundColor: COLORS.charcoal,
          borderColor: COLORS.bronze + '33'
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: COLORS.champagne }}>
            Select Stylist for {service.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Info */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: COLORS.charcoalLight }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium" style={{ color: COLORS.champagne }}>
                  {service.name}
                </h3>
                <p className="text-sm mt-1" style={{ color: COLORS.bronze }}>
                  ${service.price.toFixed(2)} per service
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
                >
                  -
                </Button>
                <span className="px-3 font-medium" style={{ color: COLORS.champagne }}>
                  {quantity}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setQuantity(quantity + 1)}
                  style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          {/* Stylist Selection */}
          {loading ? (
            <div className="py-8 text-center">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
                style={{ borderColor: COLORS.gold }}
              ></div>
              <p className="mt-4" style={{ color: COLORS.lightText }}>
                Loading stylists...
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stylists.map(stylist => (
                <Card
                  key={stylist.id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    selectedStylist?.id === stylist.id && 'ring-2'
                  )}
                  style={{
                    backgroundColor:
                      selectedStylist?.id === stylist.id
                        ? COLORS.gold + '20'
                        : COLORS.charcoalLight,
                    borderColor:
                      selectedStylist?.id === stylist.id ? COLORS.gold : COLORS.bronze + '33',
                    ringColor: COLORS.gold
                  }}
                  onClick={() => setSelectedStylist(stylist)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: COLORS.bronze + '20' }}
                        >
                          <User className="w-5 h-5" style={{ color: COLORS.bronze }} />
                        </div>
                        <div>
                          <h4 className="font-medium" style={{ color: COLORS.champagne }}>
                            {stylist.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            {stylist.rating > 0 && (
                              <div className="flex items-center gap-1">
                                <Star
                                  className="w-3 h-3 fill-current"
                                  style={{ color: COLORS.gold }}
                                />
                                <span className="text-xs" style={{ color: COLORS.bronze }}>
                                  {stylist.rating}
                                </span>
                              </div>
                            )}
                            <div className="flex gap-1">
                              {stylist.specialties.slice(0, 2).map((spec, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="text-xs"
                                  style={{
                                    backgroundColor: COLORS.charcoalDark,
                                    color: COLORS.champagne,
                                    borderColor: COLORS.bronze + '33'
                                  }}
                                >
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!stylist.available && stylist.id !== 'any' && (
                          <Badge
                            variant="secondary"
                            style={{
                              backgroundColor: '#DC2626' + '20',
                              color: '#DC2626',
                              borderColor: '#DC2626' + '50'
                            }}
                          >
                            Busy
                          </Badge>
                        )}
                        {selectedStylist?.id === stylist.id && (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: COLORS.gold }}
                          >
                            <Check className="w-4 h-4" style={{ color: COLORS.black }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleQuickAdd}
              style={{
                borderColor: COLORS.bronze,
                color: COLORS.champagne
              }}
            >
              Add as Walk-in
            </Button>
            <div className="flex-1" />
            <Button
              variant="outline"
              onClick={onClose}
              style={{
                borderColor: COLORS.bronze,
                color: COLORS.champagne
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedStylist}
              style={{
                background: selectedStylist
                  ? `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`
                  : undefined,
                color: selectedStylist ? COLORS.black : undefined,
                opacity: selectedStylist ? 1 : 0.5
              }}
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
