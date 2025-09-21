'use client'

import { useState, useEffect } from 'react'
import { User, Check, Clock, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/luxe-dialog'
import { universalApi } from '@/lib/universal-api-v2'
import { cn } from '@/lib/utils'

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
    stylist_entity_id?: string
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
      stylist_entity_id: finalStylist?.id,
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
      stylist_entity_id: 'walk-in', // Special ID for walk-in services
      stylist_name: 'Walk-in'
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-c2 text-champagne border border-borderl shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Select Stylist for {service.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Info */}
          <div className="p-4 rounded-lg bg-c3 border border-borderl shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-champagne">{service.name}</h3>
                <p className="text-sm mt-1 text-bronze">${service.price.toFixed(2)} per service</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-8 w-8 p-0 border border-bronze/40 bg-c3 text-champagne hover:bg-borderl/50 transition-colors"
                >
                  -
                </Button>
                <span className="px-3 font-medium min-w-[3rem] text-center text-luxe-gold [text-shadow:0_0_10px_rgb(212_175_55_/_25%)]">
                  {quantity}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-8 w-8 p-0 border border-bronze/40 bg-c3 text-champagne hover:bg-borderl/50 transition-colors"
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          {/* Stylist Selection */}
          {loading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto border-luxe-gold"></div>
              <p className="mt-4 text-champagne/80">Loading stylists...</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-luxe-charcoal [&::-webkit-scrollbar-thumb]:bg-bronze/30 [&::-webkit-scrollbar-thumb]:rounded">
              {stylists.map(stylist => (
                <Card
                  key={stylist.id}
                  className={cn(
                    'cursor-pointer transition-all duration-200 border',
                    'bg-c3 border-borderl hover:border-bronze/50 hover:shadow-md',
                    selectedStylist?.id === stylist.id &&
                      'ring-2 ring-luxe-gold bg-luxe-gold/[0.125] border-luxe-gold'
                  )}
                  onClick={() => setSelectedStylist(stylist)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center border border-bronze/30 bg-luxe-charcoal shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                          <User className="w-5 h-5 text-luxe-gold" />
                        </div>
                        <div>
                          <h4 className="font-medium text-champagne">{stylist.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            {stylist.rating > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current text-luxe-gold" />
                                <span className="text-xs text-bronze">{stylist.rating}</span>
                              </div>
                            )}
                            <div className="flex gap-1">
                              {stylist.specialties.slice(0, 2).map((spec, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="text-xs border border-bronze/30 bg-luxe-charcoal text-bronze shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
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
                            className="border bg-danger/10 text-[#EF4444] border-danger/30 shadow-[0_0_4px_rgba(220,38,38,0.2)]"
                          >
                            Busy
                          </Badge>
                        )}
                        {selectedStylist?.id === stylist.id && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-luxe-gold">
                            <Check className="w-4 h-4 text-luxe-black" />
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
          <div className="flex gap-2 pt-4 border-t border-bronze/20">
            <Button
              variant="ghost"
              onClick={handleQuickAdd}
              className="border border-bronze/40 bg-c3 text-champagne hover:bg-borderl/50 transition-colors"
            >
              Add as Walk-in
            </Button>
            <div className="flex-1" />
            <Button
              variant="ghost"
              onClick={onClose}
              className="border border-bronze/40 bg-c3 text-bronze hover:bg-borderl/50 transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedStylist}
              className={cn(
                'transition-all duration-200',
                selectedStylist
                  ? 'bg-gradient-to-r from-luxe-gold to-luxe-gold-600 text-luxe-black hover:opacity-90 shadow-[0_4px_12px_rgba(212,175,55,0.25)]'
                  : 'bg-c3 text-bronze border border-bronze/30 opacity-50 cursor-not-allowed'
              )}
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
