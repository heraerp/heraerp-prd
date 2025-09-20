// ================================================================================
// HERA SALON - CUSTOMER DETAIL PAGE
// Smart Code: HERA.PAGES.SALON.CUSTOMERS.DETAIL.V1
// View customer details with HERA DNA UI
// ================================================================================

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  PageHeaderDNA,
  CardDNA,
  InfoCardDNA,
  SuccessCardDNA,
  PrimaryButtonDNA,
  SecondaryButtonDNA,
  BadgeDNA,
  SuccessBadgeDNA,
  WarningBadgeDNA,
  ScrollAreaDNA
} from '@/lib/dna/components/ui'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  ArrowLeft,
  Star,
  DollarSign,
  Clock,
  Heart,
  FileText,
  TrendingUp,
  Gift,
  ShoppingBag,
  CreditCard,
  UserCheck
} from 'lucide-react'
import { universalApi } from '@/lib/universal-api'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

interface CustomerDetail {
  entity: any
  dynamicFields: Record<string, any>
  transactions: any[]
  relationships: any[]
  appointments: any[]
}

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { currentOrganization } = useHERAAuth()
  const organizationId = currentOrganization?.id

  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'notes'>('overview')

  // Fetch customer details
  useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (!organizationId || !params.id) return

      try {
        setLoading(true)

        // Set organization ID for API calls
        universalApi.setOrganizationId(organizationId)

        // 1. Get customer entity
        const entityRes = await universalApi.read('core_entities', {
          id: params.id,
          organization_id: organizationId
        })

        if (!entityRes.success || !entityRes.data?.length) {
          throw new Error('Customer not found')
        }

        const entity = entityRes.data[0]

        // 2. Get dynamic fields
        const dynamicRes = await universalApi.getDynamicData({
          entityId: params.id as string,
          organizationId
        })
        const fieldsMap: Record<string, any> = {}

        if (dynamicRes.success && dynamicRes.data) {
          dynamicRes.data.forEach((field: any) => {
            const value =
              field.field_value ||
              field.field_value_text ||
              field.field_value_number ||
              field.field_value_date ||
              field.field_value_boolean
            fieldsMap[field.field_name] = value
          })
        }

        // 3. Get transactions
        const transRes = await universalApi.getTransactions({
          organizationId
        })
        const customerTransactions =
          transRes.data?.filter(
            (t: any) =>
              t.source_entity_id === params.id ||
              t.target_entity_id === params.id ||
              (t.metadata as any)?.customer_id === params.id
          ) || []

        // 4. Get relationships
        const relRes = await universalApi.getRelationships({
          filters: {
            from_entity_id: params.id
          },
          organizationId
        })

        // 5. Get appointments (transactions of type 'APPOINTMENT' - uppercase)
        const appointments = customerTransactions.filter(
          (t: any) => t.transaction_type === 'APPOINTMENT'
        )

        setCustomer({
          entity,
          dynamicFields: fieldsMap,
          transactions: customerTransactions,
          relationships: relRes.data || [],
          appointments
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load customer details',
          variant: 'destructive'
        })
        router.push('/salon/customers')
      } finally {
        setLoading(false)
      }
    }

    fetchCustomerDetails()
  }, [organizationId, params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-600 border-t-transparent" />
      </div>
    )
  }

  if (!customer) {
    return null
  }

  // Calculate stats
  const totalSpent = customer.transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0)
  const visitCount = customer.appointments.length
  const lastVisit = customer.appointments[0]?.transaction_date

  // Get loyalty tier
  const loyaltyRel = customer.relationships.find(
    r => r.relationship_type === 'has_status' && r.metadata?.status_type === 'loyalty_tier'
  )
  const loyaltyTier = loyaltyRel?.metadata?.status_name || 'Bronze'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeaderDNA
        title={customer.entity.entity_name}
        subtitle={`Customer since ${format(new Date(customer.entity.created_at), 'MMMM yyyy')}`}
        icon={User}
        backUrl="/salon/customers"
        actions={
          <div className="flex gap-3">
            <SecondaryButtonDNA
              icon={Calendar}
              onClick={() => router.push(`/salon/appointments/new?customerId=${params.id}`)}
            >
              Book Appointment
            </SecondaryButtonDNA>
            <PrimaryButtonDNA
              icon={Edit}
              onClick={() => router.push(`/salon/customers/${params.id}/edit`)}
            >
              Edit Customer
            </PrimaryButtonDNA>
          </div>
        }
      />

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Customer Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoCardDNA>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  AED {totalSpent.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Lifetime value</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <DollarSign className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </InfoCardDNA>

          <SuccessCardDNA>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Visit Count</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{visitCount}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Total appointments</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <UserCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </SuccessCardDNA>

          <CardDNA>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Average Spend
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  AED {visitCount > 0 ? Math.round(totalSpent / visitCount) : 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Per visit</p>
              </div>
              <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                <TrendingUp className="w-8 h-8 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </CardDNA>

          <CardDNA>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Loyalty Status
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{loyaltyTier}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Member tier</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Star className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardDNA>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Appointments */}
            {customer.appointments && customer.appointments.length > 0 && (
              <CardDNA title="Upcoming Appointments" icon={Calendar}>
                <div className="space-y-3">
                  {customer.appointments
                    .filter((apt: any) => new Date(apt.transaction_date) >= new Date())
                    .slice(0, 3)
                    .map((appointment: any) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {appointment.metadata?.service_name || 'Appointment'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {appointment.metadata?.start_time
                              ? format(
                                  new Date(appointment.metadata.start_time),
                                  'EEEE, MMM d, h:mm a'
                                )
                              : format(new Date(appointment.transaction_date), 'EEEE, MMM d')}
                          </p>
                        </div>
                        <SecondaryButtonDNA
                          onClick={() => router.push(`/salon/appointments/${appointment.id}`)}
                          size="sm"
                        >
                          View
                        </SecondaryButtonDNA>
                      </div>
                    ))}
                  {customer.appointments.filter(
                    (apt: any) => new Date(apt.transaction_date) >= new Date()
                  ).length === 0 && (
                    <p className="text-center py-4 text-gray-500 dark:text-gray-400">
                      No upcoming appointments
                    </p>
                  )}
                </div>
              </CardDNA>
            )}

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Visit History
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'notes'
                    ? 'bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Notes
              </button>
            </div>

            {activeTab === 'overview' && (
              <CardDNA title="Contact Information" icon={User}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customer.dynamicFields.email && (
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {customer.dynamicFields.email}
                          </p>
                        </div>
                      </div>
                    )}

                    {customer.dynamicFields.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {customer.dynamicFields.phone}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {customer.dynamicFields.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {customer.dynamicFields.address}
                        </p>
                      </div>
                    </div>
                  )}

                  {customer.dynamicFields.date_of_birth && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Birthday</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {format(new Date(customer.dynamicFields.date_of_birth), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardDNA>
            )}

            {activeTab === 'history' && (
              <CardDNA title="Visit History" icon={Clock}>
                <ScrollAreaDNA height="h-96">
                  <div className="space-y-3 pr-4">
                    {customer.appointments.length === 0 ? (
                      <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No visit history yet
                      </p>
                    ) : (
                      customer.appointments.map(appointment => (
                        <div
                          key={appointment.id}
                          className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 transition-colors cursor-pointer"
                          onClick={() => router.push(`/salon/appointments/${appointment.id}`)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                  {appointment.metadata?.service_name || 'Appointment'}
                                </p>
                                <span className="text-xs text-gray-500 dark:text-gray-500">
                                  {appointment.transaction_code}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {appointment.metadata?.start_time
                                  ? format(
                                      new Date(appointment.metadata.start_time),
                                      'MMM d, yyyy, h:mm a'
                                    )
                                  : format(new Date(appointment.transaction_date), 'MMM d, yyyy')}
                              </p>
                              {appointment.metadata?.duration_minutes && (
                                <p className="text-sm text-gray-500 dark:text-gray-500">
                                  Duration: {appointment.metadata.duration_minutes} minutes
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                AED {appointment.total_amount}
                              </p>
                              <BadgeDNA
                                variant={
                                  appointment.metadata?.status === 'COMPLETED'
                                    ? 'success'
                                    : appointment.metadata?.status === 'CONFIRMED'
                                      ? 'info'
                                      : appointment.metadata?.status === 'DRAFT'
                                        ? 'warning'
                                        : 'secondary'
                                }
                              >
                                {appointment.metadata?.status?.toLowerCase() || 'scheduled'}
                              </BadgeDNA>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollAreaDNA>
              </CardDNA>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                {customer.dynamicFields.preferences && (
                  <CardDNA title="Service Preferences" icon={Heart}>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {customer.dynamicFields.preferences}
                    </p>
                  </CardDNA>
                )}

                {customer.dynamicFields.notes && (
                  <CardDNA title="Internal Notes" icon={FileText}>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {customer.dynamicFields.notes}
                    </p>
                  </CardDNA>
                )}

                {!customer.dynamicFields.preferences && !customer.dynamicFields.notes && (
                  <CardDNA>
                    <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No notes or preferences recorded yet
                    </p>
                  </CardDNA>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <CardDNA title="Quick Actions" icon={ShoppingBag}>
              <div className="space-y-3">
                <PrimaryButtonDNA
                  icon={Calendar}
                  onClick={() => router.push(`/salon/appointments/new?customerId=${params.id}`)}
                  className="w-full"
                >
                  Book New Appointment
                </PrimaryButtonDNA>
                <SecondaryButtonDNA
                  icon={CreditCard}
                  onClick={() => router.push(`/salon/payments/new?customerId=${params.id}`)}
                  className="w-full"
                >
                  Process Payment
                </SecondaryButtonDNA>
                <SecondaryButtonDNA
                  icon={Gift}
                  onClick={() => router.push(`/salon/vouchers/new?customerId=${params.id}`)}
                  className="w-full"
                >
                  Create Gift Voucher
                </SecondaryButtonDNA>
              </div>
            </CardDNA>

            <CardDNA title="Loyalty Benefits" icon={Star}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Current Tier</span>
                  <BadgeDNA
                    variant={
                      loyaltyTier === 'Platinum'
                        ? 'info'
                        : loyaltyTier === 'Gold'
                          ? 'warning'
                          : loyaltyTier === 'Silver'
                            ? 'secondary'
                            : 'default'
                    }
                  >
                    <Star className="w-3 h-3" />
                    {loyaltyTier}
                  </BadgeDNA>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Points Balance</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">1,250</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Next Reward</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">250 pts</span>
                </div>
              </div>
            </CardDNA>

            {lastVisit && (
              <CardDNA>
                <div className="text-center space-y-2">
                  <Clock className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Last Visit</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {format(new Date(lastVisit), 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {Math.floor(
                      (Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24)
                    )}{' '}
                    days ago
                  </p>
                </div>
              </CardDNA>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
