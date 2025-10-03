/**
 * HERA DNA Pattern: Customer Detail Modal
 *
 * Enhanced customer view with appointment history, preferences, and notes
 */

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  User,
  Calendar,
  DollarSign,
  Heart,
  Phone,
  Mail,
  MapPin,
  Clock,
  Star,
  Gift,
  AlertCircle,
  Edit,
  MessageSquare,
  FileText
} from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { format } from 'date-fns'

interface CustomerDetailModalProps {
  isOpen: boolean
  onClose: () => void
  customer: any
  onEdit?: () => void
  canEdit?: boolean
  appointments?: any[] // Future: Load appointment history
  transactions?: any[] // Future: Load transaction history
}

export function CustomerDetailModal({
  isOpen,
  onClose,
  customer,
  onEdit,
  canEdit = true,
  appointments = [],
  transactions = []
}: CustomerDetailModalProps) {
  if (!customer) return null

  const fields = customer.dynamic_fields || {}
  const lifetimeValue = fields.lifetime_value?.value || 0
  const visitCount = fields.visit_count?.value || 0
  const avgTicket = fields.average_ticket?.value || 0
  const lastVisit = fields.last_visit?.value
  const tags =
    fields.tags?.value
      ?.split(',')
      .map(t => t.trim())
      .filter(Boolean) || []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] p-0"
        style={{
          backgroundColor: LUXE_COLORS.charcoalLight,
          border: `1px solid ${LUXE_COLORS.gold}30`
        }}
      >
        {/* Header */}
        <div
          className="p-6 border-b"
          style={{
            borderColor: `${LUXE_COLORS.gold}20`,
            background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight} 0%, ${LUXE_COLORS.charcoal} 100%)`
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: `${LUXE_COLORS.gold}20`,
                  border: `2px solid ${LUXE_COLORS.gold}`
                }}
              >
                <User className="h-8 w-8" style={{ color: LUXE_COLORS.gold }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: LUXE_COLORS.champagne }}>
                  {fields.name?.value || customer.entity_name}
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  <Badge
                    className="text-xs"
                    style={{
                      backgroundColor: `${LUXE_COLORS.gold}20`,
                      color: LUXE_COLORS.gold,
                      border: `1px solid ${LUXE_COLORS.gold}30`
                    }}
                  >
                    {fields.customer_type?.value || 'Regular'} Customer
                  </Badge>
                  {tags.map((tag, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-xs"
                      style={{ color: LUXE_COLORS.bronze }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            {canEdit && onEdit && (
              <Button
                onClick={onEdit}
                size="sm"
                style={{
                  backgroundColor: LUXE_COLORS.gold,
                  color: LUXE_COLORS.black
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${LUXE_COLORS.charcoal}80` }}
            >
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4" style={{ color: LUXE_COLORS.gold }} />
                <span className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                  Lifetime Value
                </span>
              </div>
              <p className="text-xl font-bold" style={{ color: LUXE_COLORS.champagne }}>
                ${lifetimeValue.toFixed(0)}
              </p>
            </div>

            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${LUXE_COLORS.charcoal}80` }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4" style={{ color: LUXE_COLORS.emerald }} />
                <span className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                  Total Visits
                </span>
              </div>
              <p className="text-xl font-bold" style={{ color: LUXE_COLORS.champagne }}>
                {visitCount}
              </p>
            </div>

            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${LUXE_COLORS.charcoal}80` }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-4 w-4" style={{ color: LUXE_COLORS.plum }} />
                <span className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                  Avg Ticket
                </span>
              </div>
              <p className="text-xl font-bold" style={{ color: LUXE_COLORS.champagne }}>
                ${avgTicket.toFixed(0)}
              </p>
            </div>

            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${LUXE_COLORS.charcoal}80` }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4" style={{ color: LUXE_COLORS.orange }} />
                <span className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                  Last Visit
                </span>
              </div>
              <p className="text-sm font-medium" style={{ color: LUXE_COLORS.champagne }}>
                {lastVisit ? format(new Date(lastVisit), 'MMM d, yyyy') : 'Never'}
              </p>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="details" className="flex-1">
          <TabsList
            className="w-full rounded-none border-b"
            style={{
              backgroundColor: 'transparent',
              borderColor: `${LUXE_COLORS.gold}20`
            }}
          >
            <TabsTrigger value="details" className="data-[state=active]:text-gold">
              Details
            </TabsTrigger>
            <TabsTrigger value="appointments" className="data-[state=active]:text-gold">
              Appointments ({appointments.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:text-gold">
              History ({transactions.length})
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:text-gold">
              Notes
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px]">
            {/* Details Tab */}
            <TabsContent value="details" className="p-6 space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: LUXE_COLORS.gold }}>
                  Contact Information
                </h3>
                <div className="space-y-3">
                  {fields.email?.value && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4" style={{ color: LUXE_COLORS.bronze }} />
                      <span style={{ color: LUXE_COLORS.lightText }}>{fields.email.value}</span>
                    </div>
                  )}
                  {fields.phone?.value && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4" style={{ color: LUXE_COLORS.bronze }} />
                      <span style={{ color: LUXE_COLORS.lightText }}>{fields.phone.value}</span>
                    </div>
                  )}
                  {fields.address?.value && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4" style={{ color: LUXE_COLORS.bronze }} />
                      <span style={{ color: LUXE_COLORS.lightText }}>{fields.address.value}</span>
                    </div>
                  )}
                  {fields.date_of_birth?.value && (
                    <div className="flex items-center gap-3">
                      <Gift className="h-4 w-4" style={{ color: LUXE_COLORS.bronze }} />
                      <span style={{ color: LUXE_COLORS.lightText }}>
                        Birthday: {format(new Date(fields.date_of_birth.value), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Preferences */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: LUXE_COLORS.gold }}>
                  Preferences & Care
                </h3>
                <div className="space-y-3">
                  {fields.preferred_stylist?.value && (
                    <div>
                      <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                        Preferred Stylist
                      </p>
                      <p style={{ color: LUXE_COLORS.lightText }}>
                        {fields.preferred_stylist.value}
                      </p>
                    </div>
                  )}
                  {fields.allergies?.value && (
                    <div
                      className="p-3 rounded-lg flex items-start gap-3"
                      style={{
                        backgroundColor: `${LUXE_COLORS.ruby}20`,
                        border: `1px solid ${LUXE_COLORS.ruby}30`
                      }}
                    >
                      <AlertCircle
                        className="h-4 w-4 mt-0.5 flex-shrink-0"
                        style={{ color: LUXE_COLORS.ruby }}
                      />
                      <div>
                        <p className="text-sm font-medium" style={{ color: LUXE_COLORS.ruby }}>
                          Allergies & Sensitivities
                        </p>
                        <p className="text-sm mt-1" style={{ color: LUXE_COLORS.lightText }}>
                          {fields.allergies.value}
                        </p>
                      </div>
                    </div>
                  )}
                  {fields.preferences?.value && (
                    <div>
                      <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                        Service Preferences
                      </p>
                      <p style={{ color: LUXE_COLORS.lightText }}>{fields.preferences.value}</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Appointments Tab */}
            <TabsContent value="appointments" className="p-6">
              {appointments.length > 0 ? (
                <div className="space-y-3">
                  {appointments.map((apt, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: `${LUXE_COLORS.charcoal}80` }}
                    >
                      {/* Appointment card content */}
                      <p style={{ color: LUXE_COLORS.bronze }}>Appointment data would go here</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar
                    className="h-12 w-12 mx-auto mb-4"
                    style={{ color: LUXE_COLORS.bronze }}
                  />
                  <p style={{ color: LUXE_COLORS.bronze }}>No appointment history yet</p>
                </div>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="p-6">
              {transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((txn, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: `${LUXE_COLORS.charcoal}80` }}
                    >
                      {/* Transaction card content */}
                      <p style={{ color: LUXE_COLORS.bronze }}>Transaction data would go here</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText
                    className="h-12 w-12 mx-auto mb-4"
                    style={{ color: LUXE_COLORS.bronze }}
                  />
                  <p style={{ color: LUXE_COLORS.bronze }}>No transaction history yet</p>
                </div>
              )}
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="p-6">
              <div className="space-y-4">
                {fields.notes?.value && (
                  <div
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: `${LUXE_COLORS.charcoal}80` }}
                  >
                    <div className="flex items-start gap-3">
                      <MessageSquare
                        className="h-4 w-4 mt-1"
                        style={{ color: LUXE_COLORS.bronze }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-2" style={{ color: LUXE_COLORS.gold }}>
                          Internal Notes
                        </p>
                        <p
                          className="text-sm whitespace-pre-wrap"
                          style={{ color: LUXE_COLORS.lightText }}
                        >
                          {fields.notes.value}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t" style={{ borderColor: `${LUXE_COLORS.gold}20` }}>
                  <p className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                    Customer since: {format(new Date(customer.created_at), 'MMMM d, yyyy')}
                  </p>
                  <p className="text-xs mt-1" style={{ color: LUXE_COLORS.bronze }}>
                    Last updated: {format(new Date(customer.updated_at), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
