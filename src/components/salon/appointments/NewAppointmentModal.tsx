'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Calendar,
  Clock,
  User,
  Scissors,
  DollarSign,
  FileText,
  Loader2,
  Building2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { formatDate } from '@/lib/date-utils'
import { addDays, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { universalApi } from '@/lib/universal-api'
import { useCustomers, useServices, useEmployees } from '@/hooks/useEntity'
import { bookAppointmentV2 } from '@/lib/salon/appointments-v2-helper'
import { useToast } from '@/hooks/use-toast'

interface NewAppointmentModalProps {
  onClose: () => void
  onSuccess: () => void
  organizationId?: string
  selectedBranchId?: string
}

interface Service {
  id: string
  name: string
  duration: number
  price: number
}

interface Staff {
  id: string
  name: string
  specializations?: string[]
}

interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
}

interface Branch {
  id: string
  name: string
  code?: string
}

export function NewAppointmentModal({
  onClose,
  onSuccess,
  organizationId,
  selectedBranchId
}: NewAppointmentModalProps) {
  console.log('NewAppointmentModal rendering with:', { organizationId, selectedBranchId })
  const { toast } = useToast()
  // Check for Hair Talkz subdomain
  const getEffectiveOrgId = () => {
    if (organizationId) return organizationId

    // Check if we're on hairtalkz or heratalkz subdomain
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      if (
        hostname.startsWith('hairtalkz.') ||
        hostname === 'hairtalkz.localhost' ||
        hostname.startsWith('heratalkz.') ||
        hostname === 'heratalkz.localhost'
      ) {
        return '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // Hair Talkz org ID
      }
    }

    return organizationId
  }

  const effectiveOrgId = getEffectiveOrgId()
  console.log('Effective org ID in modal:', effectiveOrgId)
  const [formLoading, setFormLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state - initialize branchId with selectedBranchId prop
  const [branchId, setBranchId] = useState(selectedBranchId || '')
  const [customerId, setCustomerId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [appointmentDate, setAppointmentDate] = useState(formatDate(new Date(), 'yyyy-MM-dd'))
  const [appointmentTime, setAppointmentTime] = useState('')
  const [notes, setNotes] = useState('')

  // Data state
  const [branches, setBranches] = useState<Branch[]>([])
  // Universal Wrapper hooks (org-aware, dynamic fields)
  const { data: customerEntities = [] } = useCustomers({
    organizationId: effectiveOrgId,
    includeDynamicData: true
  })
  const { data: serviceEntities = [] } = useServices({
    organizationId: effectiveOrgId,
    includeDynamicData: true,
    disableBranchContext: true
  })
  const { data: employeeEntities = [] } = useEmployees({
    organizationId: effectiveOrgId,
    includeDynamicData: true
  })
  // Derived lists for UI
  const customers = React.useMemo<Customer[]>(
    () =>
      customerEntities.map((c: any) => ({
        id: c.id,
        name: c.entity_name,
        phone: c.dynamic_fields?.phone?.value ?? c.metadata?.phone,
        email: c.dynamic_fields?.email?.value ?? c.metadata?.email
      })),
    [customerEntities]
  )
  const services = React.useMemo<Service[]>(
    () =>
      serviceEntities.map((s: any) => ({
        id: s.id,
        name: s.entity_name,
        duration: s.dynamic_fields?.duration_min?.value ?? s.metadata?.duration ?? 60,
        price: s.dynamic_fields?.price_market?.value ?? s.metadata?.price ?? 0
      })),
    [serviceEntities]
  )
  const staff = React.useMemo<Staff[]>(
    () =>
      employeeEntities.map((e: any) => ({
        id: e.id,
        name: e.entity_name,
        specializations: e.metadata?.specializations || []
      })),
    [employeeEntities]
  )
  const [availableSlots, setAvailableSlots] = useState<string[]>([])

  // Selected service details
  const selectedService = services.find(s => s.id === serviceId)

  // Fetch branches, customers, services, and staff on mount
  useEffect(() => {
    if (!effectiveOrgId) {
      console.log('No effective org ID, skipping data fetch')
      return
    }

    const fetchData = async () => {
      setFormLoading(true)
      console.log('Fetching appointment modal data for org:', effectiveOrgId)

      // Set a timeout to ensure loading state is cleared
      const loadingTimeout = setTimeout(() => {
        console.log('Loading timeout reached, forcing loading to false')
        setFormLoading(false)
      }, 5000)

      // Set organization ID on universalApi
      universalApi.setOrganizationId(effectiveOrgId!)

      try {
        // Fetch branches first separately to debug
        console.log('Fetching branches...')
        const branchesResp = await universalApi.getEntities({
          organizationId: effectiveOrgId,
          filters: { entity_type: 'BRANCH' }
        })

        console.log('Branches response:', branchesResp)

        if (branchesResp.success && branchesResp.data) {
          const branchList = branchesResp.data.map((b: any) => ({
            id: b.id,
            name: b.entity_name,
            code: b.entity_code
          }))
          console.log('Setting branches:', branchList)
          setBranches(branchList)
        } else {
          console.log('No branches found or error:', branchesResp.error)
          setBranches([])
        }

        // Fetch other data
        const [customersResp, servicesResp, staffResp] = await Promise.all([
          universalApi.getEntities({
            organizationId: effectiveOrgId,
            filters: { entity_type: 'customer' }
          }),
          universalApi.getEntities({
            organizationId: effectiveOrgId,
            filters: { entity_type: 'service' }
          }),
          universalApi.getEntities({
            organizationId: effectiveOrgId,
            filters: { entity_type: 'employee' }
          })
        ])

        // Transform customers
        if (customersResp.success && customersResp.data) {
          setCustomers(
            customersResp.data.map((c: any) => ({
              id: c.id,
              name: c.entity_name,
              phone: (c.metadata as any)?.phone,
              email: (c.metadata as any)?.email
            }))
          )
        }

        // Transform services
        if (servicesResp.success && servicesResp.data) {
          setServices(
            servicesResp.data.map((s: any) => ({
              id: s.id,
              name: s.entity_name,
              duration: (s.metadata as any)?.duration || 60,
              price: (s.metadata as any)?.price || 0
            }))
          )
        }

        // Transform staff - all employees are considered staff for salon
        if (staffResp.success && staffResp.data) {
          setStaff(
            staffResp.data.map((s: any) => ({
              id: s.id,
              name: s.entity_name,
              specializations: (s.metadata as any)?.specializations || []
            }))
          )
        }
      } catch (error) {
        console.error('Error fetching appointment modal data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load appointment data'
        })
        // Ensure we set empty arrays on error
        setBranches([])
      } finally {
        console.log('Setting form loading to false')
        clearTimeout(loadingTimeout)
        setFormLoading(false)
      }
    }

    fetchData()
  }, [effectiveOrgId])

  // Generate available time slots when staff and date are selected
  useEffect(() => {
    if (staffId && appointmentDate && selectedService) {
      // Generate time slots from 9 AM to 6 PM
      const slots = []
      for (let hour = 9; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          slots.push(time)
        }
      }
      setAvailableSlots(slots)
    }
  }, [staffId, appointmentDate, selectedService])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !branchId ||
      !customerId ||
      !serviceId ||
      !staffId ||
      !appointmentDate ||
      !appointmentTime
    ) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields'
      })
      return
    }

    try {
      setSubmitting(true)

      // Build start/end ISO from date + time and selected service duration
      const start = new Date(`${appointmentDate}T${appointmentTime}:00`)
      const duration = selectedService?.duration || 60
      const end = new Date(start.getTime() + duration * 60 * 1000)

      await bookAppointmentV2({
        organizationId: effectiveOrgId!,
        customerId,
        staffId,
        serviceId,
        startISO: start.toISOString(),
        endISO: end.toISOString(),
        notes,
        price: selectedService?.price || 0,
        currencyCode: 'AED',
        metadata: {
          branch_id: branchId
        }
      })

      toast({
        title: 'Success',
        description: 'Appointment created successfully',
        variant: 'default'
      })

      // Add a small delay to ensure toast is shown before modal closes
      setTimeout(() => {
        onSuccess()
      }, 100)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create appointment'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-md"
        style={{ backgroundColor: 'rgba(11, 11, 11, 0.85)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl"
        style={{
          backgroundColor: '#1A1A1A',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(212, 175, 55, 0.1)'
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between p-6"
          style={{
            backgroundColor: '#232323',
            borderBottom: '1px solid rgba(212, 175, 55, 0.2)'
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: `
                  linear-gradient(135deg, 
                    rgba(147, 51, 234, 0.15) 0%, 
                    rgba(59, 130, 246, 0.1) 100%
                  )
                `,
                backdropFilter: 'blur(20px) saturate(120%)',
                WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <Calendar className="w-5 h-5 text-foreground" />
            </div>
            <h2 className="text-xl font-semibold !text-gray-100 dark:!text-foreground">
              New Appointment
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Branch Selection */}
          <div className="space-y-2">
            <Label htmlFor="branch" className="flex items-center gap-2 !ink dark:!text-gray-300">
              <Building2 className="w-4 h-4" />
              Location *
            </Label>
            <Select value={branchId} onValueChange={setBranchId} disabled={formLoading}>
              <SelectTrigger
                id="branch"
                className="bg-muted/50 border-border !text-foreground focus:border-indigo-500 hover:bg-muted-foreground/10/50"
              >
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {console.log('Branch dropdown state:', {
                  formLoading,
                  branchesLength: branches.length,
                  branches
                }) || null}
                {formLoading ? (
                  <div className="px-2 py-3 text-center">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground mt-1">Loading branches...</p>
                  </div>
                ) : branches.length === 0 ? (
                  <div className="px-2 py-3 text-center">
                    <p className="text-sm text-muted-foreground">No branches available</p>
                    <SelectItem value="test" className="!text-gray-300">
                      Test Branch (Hardcoded)
                    </SelectItem>
                  </div>
                ) : (
                  branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id} className="!text-gray-300">
                      {branch.name}
                      {branch.code && (
                        <span className="text-sm text-muted-foreground ml-2">({branch.code})</span>
                      )}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Customer Selection */}
          <div className="space-y-2">
            <Label htmlFor="customer" className="flex items-center gap-2 !ink dark:!text-gray-300">
              <User className="w-4 h-4" />
              Customer *
            </Label>
            <Select value={customerId} onValueChange={setCustomerId} disabled={formLoading}>
              <SelectTrigger
                id="customer"
                className="bg-muted/50 border-border !text-foreground focus:border-indigo-500 hover:bg-muted-foreground/10/50"
              >
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id} className="!text-gray-300">
                    {customer.name}
                    {customer.phone && (
                      <span className="text-sm text-muted-foreground ml-2">({customer.phone})</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="service" className="flex items-center gap-2 !ink dark:!text-gray-300">
              <Scissors className="w-4 h-4" />
              Service *
            </Label>
            <Select value={serviceId} onValueChange={setServiceId} disabled={formLoading}>
              <SelectTrigger
                id="service"
                className="bg-muted/50 border-border !text-foreground focus:border-indigo-500 hover:bg-muted-foreground/10/50"
              >
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {services.map(service => (
                  <SelectItem key={service.id} value={service.id} className="!text-gray-300">
                    <div className="flex items-center justify-between w-full">
                      <span>{service.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {service.duration} min • AED {service.price}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Staff Selection */}
          <div className="space-y-2">
            <Label htmlFor="staff" className="flex items-center gap-2 !ink dark:!text-gray-300">
              <User className="w-4 h-4" />
              Staff Member *
            </Label>
            <Select value={staffId} onValueChange={setStaffId} disabled={formLoading}>
              <SelectTrigger
                id="staff"
                className="bg-muted/50 border-border !text-foreground focus:border-indigo-500 hover:bg-muted-foreground/10/50"
              >
                <SelectValue placeholder="Select a staff member" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {staff.map(member => (
                  <SelectItem key={member.id} value={member.id} className="!text-gray-300">
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2 !ink dark:!text-gray-300">
                <Calendar className="w-4 h-4" />
                Date *
              </Label>
              <Input
                id="date"
                type="date"
                value={appointmentDate}
                onChange={e => setAppointmentDate(e.target.value)}
                min={formatDate(new Date(), 'yyyy-MM-dd')}
                max={formatDate(addDays(new Date(), 90), 'yyyy-MM-dd')}
                className="bg-muted/50 border-border !text-foreground focus:border-indigo-500 hover:bg-muted-foreground/10/50"
                disabled={formLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-2 !ink dark:!text-gray-300">
                <Clock className="w-4 h-4" />
                Time *
              </Label>
              <Select
                value={appointmentTime}
                onValueChange={setAppointmentTime}
                disabled={formLoading || !staffId}
              >
                <SelectTrigger
                  id="time"
                  className="bg-muted/50 border-border !text-foreground focus:border-indigo-500 hover:bg-muted-foreground/10/50"
                >
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {availableSlots.map(slot => (
                    <SelectItem key={slot} value={slot} className="!text-gray-300">
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Service Details Display */}
          {selectedService && (
            <div
              className="p-4 rounded-lg"
              style={{
                background: 'rgba(147, 51, 234, 0.1)',
                backdropFilter: 'blur(10px) saturate(120%)',
                WebkitBackdropFilter: 'blur(10px) saturate(120%)',
                border: '1px solid rgba(147, 51, 234, 0.2)'
              }}
            >
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span className="!text-gray-300">Duration: {selectedService.duration} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-purple-400" />
                  <span className="!text-gray-300">Price: AED {selectedService.price}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span className="!text-gray-300">
                    End:{' '}
                    {appointmentTime &&
                      formatDate(
                        parseISO(`${appointmentDate}T${appointmentTime}`).getTime() +
                          selectedService.duration * 60000,
                        'HH:mm'
                      )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2 !ink dark:!text-gray-300">
              <FileText className="w-4 h-4" />
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add any special requests or notes..."
              className="bg-muted/50 border-border !text-foreground placeholder:text-muted-foreground focus:border-indigo-500 hover:bg-muted-foreground/10/50 min-h-[80px]"
              disabled={formLoading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting || formLoading}
              className="flex-1 backdrop-blur-xl bg-background/10 dark:bg-background/30 border-border/20 dark:border-border/30 hover:bg-background/20 dark:hover:bg-background/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                submitting ||
                formLoading ||
                !branchId ||
                !customerId ||
                !serviceId ||
                !staffId ||
                !appointmentTime
              }
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-foreground shadow-lg disabled:"
            >
              {submitting || formLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Appointment'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
