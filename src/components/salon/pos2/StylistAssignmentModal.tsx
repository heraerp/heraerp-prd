'use client'

import { useState, useEffect } from 'react'
import { Search, User, Clock, Star, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSalonPosIntegration } from '@/lib/playbook/salon-pos-integration'
import { cn } from '@/lib/utils'

interface Stylist {
  id: string
  name: string
  specialties: string[]
  commission_rate: number
  available: boolean
  next_available?: string
}

interface StylistAssignmentModalProps {
  open: boolean
  onClose: () => void
  serviceId: string
  serviceName: string
  organizationId: string
  currentStylistId?: string
  onAssign: (stylistId: string, stylistName: string) => void
}

export function StylistAssignmentModal({
  open,
  onClose,
  serviceId,
  serviceName,
  organizationId,
  currentStylistId,
  onAssign
}: StylistAssignmentModalProps) {
  const [stylists, setStylists] = useState<Stylist[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStylistId, setSelectedStylistId] = useState<string | null>(currentStylistId || null)

  const { getAvailableStylists } = useSalonPosIntegration(organizationId)

  // Load stylists when modal opens
  useEffect(() => {
    if (open && serviceId) {
      loadStylists()
    }
  }, [open, serviceId])

  const loadStylists = async () => {
    try {
      setLoading(true)
      const availableStylists = await getAvailableStylists(serviceId)
      setStylists(availableStylists)
    } catch (error) {
      console.error('Error loading stylists:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter stylists based on search
  const filteredStylists = stylists.filter(stylist =>
    stylist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stylist.specialties.some(specialty => 
      specialty.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  const handleAssign = () => {
    if (!selectedStylistId) return
    
    const selectedStylist = stylists.find(s => s.id === selectedStylistId)
    if (selectedStylist) {
      onAssign(selectedStylist.id, selectedStylist.name)
      onClose()
    }
  }

  const handleClose = () => {
    setSelectedStylistId(currentStylistId || null)
    setSearchQuery('')
    onClose()
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Assign Stylist
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Select a stylist for <strong>{serviceName}</strong>
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search stylists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading stylists...</p>
            </div>
          )}

          {/* Stylists List */}
          {!loading && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredStylists.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">No stylists found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'Try adjusting your search terms' : 'No stylists available for this service'}
                  </p>
                </div>
              ) : (
                filteredStylists.map((stylist) => (
                  <Card
                    key={stylist.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-md",
                      selectedStylistId === stylist.id && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20"
                    )}
                    onClick={() => setSelectedStylistId(stylist.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={`/api/avatars/${stylist.id}`} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {getInitials(stylist.name)}
                            </AvatarFallback>
                          </Avatar>
                          {selectedStylistId === stylist.id && (
                            <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Stylist Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium truncate">{stylist.name}</h3>
                            <Badge 
                              variant={stylist.available ? "default" : "secondary"}
                              className={cn(
                                "text-xs",
                                stylist.available 
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                                  : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                              )}
                            >
                              {stylist.available ? 'Available' : 'Busy'}
                            </Badge>
                          </div>

                          {/* Specialties */}
                          {stylist.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {stylist.specialties.slice(0, 2).map((specialty, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                              {stylist.specialties.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{stylist.specialties.length - 2} more
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Commission Rate */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {stylist.commission_rate}% commission
                            </div>
                            {!stylist.available && stylist.next_available && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Next: {new Date(stylist.next_available).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={!selectedStylistId}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Assign Stylist
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}