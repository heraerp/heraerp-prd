'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, User, Calendar, Phone, Mail, Plus, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/luxe-dialog'
import { useCustomerLookup } from '@/hooks/useCustomerLookup'
import { useAppointmentLookup } from '@/hooks/useAppointmentLookup'
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

interface CustomerSearchModalProps {
  open: boolean
  onClose: () => void
  organizationId: string
  onCustomerSelect?: (customer: any) => void
  onAppointmentSelect?: (appointment: any) => void
}

export function CustomerSearchModal({
  open,
  onClose,
  organizationId,
  onCustomerSelect,
  onAppointmentSelect
}: CustomerSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'customers' | 'appointments'>('customers')

  const { searchCustomers, loading: customersLoading } = useCustomerLookup(organizationId)
  const { searchAppointments, loading: appointmentsLoading } = useAppointmentLookup(organizationId)

  const [customers, setCustomers] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])

  // Load data when search query changes
  useEffect(() => {
    const loadData = async () => {
      if (!organizationId) return

      if (activeTab === 'customers') {
        const customerResults = await searchCustomers(searchQuery)
        setCustomers(customerResults)
      } else {
        const appointmentResults = await searchAppointments({ q: searchQuery })
        setAppointments(appointmentResults)
      }
    }

    const timeoutId = setTimeout(loadData, 300) // Debounce search
    return () => clearTimeout(timeoutId)
  }, [searchQuery, activeTab, organizationId, searchCustomers, searchAppointments])

  // Filter results based on search query
  const filteredCustomers = useMemo(() => {
    return customers.filter(
      customer =>
        searchQuery === '' ||
        customer.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer.phone || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [customers, searchQuery])

  const filteredAppointments = useMemo(() => {
    return appointments.filter(
      appointment =>
        searchQuery === '' ||
        appointment.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (appointment.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [appointments, searchQuery])

  const handleCustomerSelect = (customer: any) => {
    onCustomerSelect?.(customer)
    onClose()
  }

  const handleAppointmentSelect = (appointment: any) => {
    onAppointmentSelect?.(appointment)
    onClose()
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return ''
    try {
      return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return timeString
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent
        className="max-w-4xl h-[700px] p-0 gap-0"
        style={{
          backgroundColor: COLORS.charcoal,
          borderColor: COLORS.bronze + '33'
        }}
        aria-describedby="customer-search-description"
      >
        <DialogHeader className="p-6 border-b" style={{ borderColor: COLORS.bronze + '20' }}>
          <DialogTitle style={{ color: COLORS.champagne }}>
            Search Customers & Appointments
          </DialogTitle>
          <p id="customer-search-description" className="sr-only">
            Search for customers by name, phone, or email, and view their appointments.
          </p>
        </DialogHeader>

        {/* Search and Tabs */}
        <div className="p-6 border-b" style={{ borderColor: COLORS.bronze + '20' }}>
          {/* Search */}
          <div className="relative mb-4">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
              style={{ color: COLORS.bronze }}
            />
            <input
              placeholder="Search customers, appointments, phone numbers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 rounded-lg border text-sm w-full"
              style={{
                borderColor: COLORS.bronze + '33',
                backgroundColor: COLORS.charcoalDark,
                color: COLORS.lightText,
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
              }}
              autoFocus
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
            <TabsList
              className="grid w-full grid-cols-2 p-0 border-b w-full justify-start h-auto rounded-none"
              style={{
                borderColor: COLORS.bronze + '33',
                backgroundColor: COLORS.charcoalLight,
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
              }}
            >
              <TabsTrigger
                value="customers"
                className="rounded-none px-6 py-3 relative transition-colors flex items-center gap-2"
                style={{
                  backgroundColor: activeTab === 'customers' ? COLORS.charcoal : 'transparent'
                }}
              >
                <User
                  className="w-4 h-4"
                  style={{ color: activeTab === 'customers' ? COLORS.gold : COLORS.champagne }}
                />
                <span
                  style={{ color: activeTab === 'customers' ? COLORS.champagne : COLORS.lightText }}
                >
                  Customers ({filteredCustomers.length})
                </span>
                <div
                  className={cn(
                    'absolute bottom-0 left-0 right-0 h-0.5 transition-all',
                    activeTab === 'customers' ? 'opacity-100' : 'opacity-0'
                  )}
                  style={{ backgroundColor: COLORS.gold }}
                />
              </TabsTrigger>
              <TabsTrigger
                value="appointments"
                className="rounded-none px-6 py-3 relative transition-colors flex items-center gap-2"
                style={{
                  backgroundColor: activeTab === 'appointments' ? COLORS.charcoal : 'transparent'
                }}
              >
                <Calendar
                  className="w-4 h-4"
                  style={{ color: activeTab === 'appointments' ? COLORS.gold : COLORS.champagne }}
                />
                <span
                  style={{
                    color: activeTab === 'appointments' ? COLORS.champagne : COLORS.lightText
                  }}
                >
                  Appointments ({filteredAppointments.length})
                </span>
                <div
                  className={cn(
                    'absolute bottom-0 left-0 right-0 h-0.5 transition-all',
                    activeTab === 'appointments' ? 'opacity-100' : 'opacity-0'
                  )}
                  style={{ backgroundColor: COLORS.gold }}
                />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs value={activeTab}>
            {/* Customers Tab */}
            <TabsContent value="customers" className="mt-0">
              {customersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div
                    className="animate-spin rounded-full h-8 w-8 border-b-2"
                    style={{ borderColor: COLORS.gold }}
                  />
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-12">
                  <User className="w-16 h-16 mx-auto mb-4" style={{ color: COLORS.bronze }} />
                  <h3 className="text-lg font-medium mb-2" style={{ color: COLORS.champagne }}>
                    {searchQuery ? 'No customers found' : 'Start typing to search customers'}
                  </h3>
                  <p style={{ color: COLORS.lightText, opacity: 0.7 }}>
                    Search by name, email, or phone number
                  </p>
                  <Button
                    className="mt-4"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                      color: COLORS.black
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Customer
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredCustomers.map(customer => (
                    <Card
                      key={customer.id}
                      className="group hover:shadow-md transition-all duration-200 cursor-pointer"
                      style={{
                        backgroundColor: COLORS.charcoalLight + '80',
                        borderColor: COLORS.bronze + '33',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                      }}
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium" style={{ color: COLORS.champagne }}>
                                {customer.entity_name}
                              </h3>
                              {customer.vip && (
                                <Badge
                                  style={{
                                    backgroundColor: COLORS.gold + '20',
                                    color: COLORS.gold,
                                    borderColor: COLORS.gold + '50'
                                  }}
                                >
                                  VIP
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-1">
                              {customer.email && (
                                <div
                                  className="flex items-center gap-2 text-sm"
                                  style={{ color: COLORS.bronze }}
                                >
                                  <Mail className="w-3 h-3" />
                                  {customer.email}
                                </div>
                              )}
                              {customer.phone && (
                                <div
                                  className="flex items-center gap-2 text-sm"
                                  style={{ color: COLORS.bronze }}
                                >
                                  <Phone className="w-3 h-3" />
                                  {customer.phone}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className="text-sm"
                              style={{ color: COLORS.lightText, opacity: 0.7 }}
                            >
                              {customer.last_visit
                                ? `Last visit: ${formatDate(customer.last_visit)}`
                                : 'New customer'}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Appointments Tab */}
            <TabsContent value="appointments" className="mt-0">
              {appointmentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div
                    className="animate-spin rounded-full h-8 w-8 border-b-2"
                    style={{ borderColor: COLORS.gold }}
                  />
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: COLORS.bronze }} />
                  <h3 className="text-lg font-medium mb-2" style={{ color: COLORS.champagne }}>
                    {searchQuery ? 'No appointments found' : 'Start typing to search appointments'}
                  </h3>
                  <p style={{ color: COLORS.lightText, opacity: 0.7 }}>
                    Search by appointment name or customer name
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredAppointments.map(appointment => (
                    <Card
                      key={appointment.id}
                      className="group hover:shadow-md transition-all duration-200 cursor-pointer"
                      style={{
                        backgroundColor: COLORS.charcoalLight + '80',
                        borderColor: COLORS.bronze + '33',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                      }}
                      onClick={() => handleAppointmentSelect(appointment)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium" style={{ color: COLORS.champagne }}>
                                {appointment.entity_name}
                              </h3>
                              <Badge
                                style={{
                                  backgroundColor:
                                    appointment.status === 'confirmed'
                                      ? COLORS.emerald + '20'
                                      : COLORS.bronze + '20',
                                  color:
                                    appointment.status === 'confirmed'
                                      ? COLORS.emerald
                                      : COLORS.bronze,
                                  borderColor:
                                    appointment.status === 'confirmed'
                                      ? COLORS.emerald + '50'
                                      : COLORS.bronze + '50'
                                }}
                              >
                                {appointment.status || 'scheduled'}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              {appointment.customer_name && (
                                <div
                                  className="flex items-center gap-2 text-sm"
                                  style={{ color: COLORS.bronze }}
                                >
                                  <User className="w-3 h-3" />
                                  {appointment.customer_name}
                                </div>
                              )}
                              {appointment.start_time && (
                                <div
                                  className="flex items-center gap-2 text-sm"
                                  style={{ color: COLORS.bronze }}
                                >
                                  <Clock className="w-3 h-3" />
                                  {formatDate(appointment.start_time)} at{' '}
                                  {formatTime(appointment.start_time)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium" style={{ color: COLORS.gold }}>
                              {appointment.price ? `$${appointment.price.toFixed(2)}` : ''}
                            </div>
                            {appointment.service_names && appointment.service_names.length > 0 && (
                              <div
                                className="text-xs"
                                style={{ color: COLORS.lightText, opacity: 0.7 }}
                              >
                                {appointment.service_names.slice(0, 2).join(', ')}
                                {appointment.service_names.length > 2 &&
                                  ` +${appointment.service_names.length - 2} more`}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="p-6 border-t" style={{ borderColor: COLORS.bronze + '20' }}>
          <div className="flex justify-end gap-2">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
