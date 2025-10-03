'use client'

/**
 * Salon Customers Page
 *
 * Enterprise-grade customer management using the Salon Luxe CRUD pattern
 * Follows HERA DNA standards with proper smart codes and universal entity architecture
 */

import {
  Users,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Star,
  Heart,
  MapPin,
  Clock,
  Gift
} from 'lucide-react'
import { SalonLuxeCRUDPage } from '@/lib/dna/patterns/salon-luxe-crud-pattern'
import { SalonLuxeCard } from '@/lib/dna/patterns/salon-luxe-card'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { CustomerForm } from '@/components/salon/CustomerForm'

// Customer entity preset configuration with proper UPPERCASE smart codes
const CUSTOMER_PRESET = {
  entity_type: 'CUSTOMER',
  labels: {
    singular: 'Customer',
    plural: 'Customers'
  },
  permissions: {
    create: () => true,
    edit: () => true,
    delete: () => true,
    view: () => true
  },
  smart_code: 'HERA.SALON.CUSTOMER.ENTITY.PERSON.V1',
  dynamicFields: [
    {
      name: 'name',
      type: 'text' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.NAME.V1',
      required: true,
      ui: {
        label: 'Full Name',
        placeholder: 'e.g., Jennifer Smith'
      }
    },
    {
      name: 'email',
      type: 'text' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.EMAIL.V1',
      required: true,
      ui: {
        label: 'Email Address',
        placeholder: 'jennifer@example.com'
      }
    },
    {
      name: 'phone',
      type: 'text' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.PHONE.V1',
      required: true,
      ui: {
        label: 'Phone Number',
        placeholder: '+1 (555) 123-4567'
      }
    },
    {
      name: 'date_of_birth',
      type: 'date' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.DOB.V1',
      ui: {
        label: 'Date of Birth'
      }
    },
    {
      name: 'address',
      type: 'text' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.ADDRESS.V1',
      ui: {
        label: 'Address',
        placeholder: '123 Main St, City, State ZIP'
      }
    },
    {
      name: 'preferred_stylist',
      type: 'text' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.PREFERRED_STYLIST.V1',
      ui: {
        label: 'Preferred Stylist',
        placeholder: 'Select or enter stylist name'
      }
    },
    {
      name: 'customer_type',
      type: 'text' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.TYPE.V1',
      defaultValue: 'regular',
      ui: {
        label: 'Customer Type'
      }
    },
    {
      name: 'tags',
      type: 'text' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.TAGS.V1',
      ui: {
        label: 'Tags',
        placeholder: 'e.g., VIP, Color Expert, Bridal'
      }
    },
    {
      name: 'allergies',
      type: 'text' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.ALLERGIES.V1',
      ui: {
        label: 'Allergies/Sensitivities',
        placeholder: 'e.g., PPD, Ammonia, Fragrance'
      }
    },
    {
      name: 'preferences',
      type: 'text' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.PREFERENCES.V1',
      ui: {
        label: 'Service Preferences',
        placeholder: 'e.g., Likes natural products, prefers morning appointments'
      }
    },
    {
      name: 'notes',
      type: 'text' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.NOTES.V1',
      ui: {
        label: 'Internal Notes',
        placeholder: 'Private notes about the customer'
      }
    },
    // Calculated fields (read-only, updated by system)
    {
      name: 'lifetime_value',
      type: 'number' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.LTV.V1',
      ui: {
        label: 'Lifetime Value'
      }
    },
    {
      name: 'visit_count',
      type: 'number' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.VISITS.V1',
      ui: {
        label: 'Total Visits'
      }
    },
    {
      name: 'last_visit',
      type: 'date' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.LAST_VISIT.V1',
      ui: {
        label: 'Last Visit'
      }
    },
    {
      name: 'average_ticket',
      type: 'number' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.AVG_TICKET.V1',
      ui: {
        label: 'Average Ticket'
      }
    },
    {
      name: 'status',
      type: 'text' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.STATUS.V1',
      defaultValue: 'active',
      ui: {
        label: 'Status'
      }
    },
    {
      name: 'wallet_balance',
      type: 'number' as const,
      smart_code: 'HERA.SALON.CUSTOMER.DYN.WALLET.V1',
      ui: {
        label: 'Wallet Balance',
        roles: ['owner', 'manager', 'accountant']
      }
    }
  ]
}

export default function SalonCustomersPage() {
  // Helper function to get customer type color
  const getCustomerTypeColor = (type: string) => {
    const typeColors: Record<string, string> = {
      vip: LUXE_COLORS.gold,
      regular: LUXE_COLORS.emerald,
      new: LUXE_COLORS.sapphire,
      inactive: LUXE_COLORS.bronze,
      lost: LUXE_COLORS.ruby
    }
    return typeColors[type] || LUXE_COLORS.bronze
  }

  // Helper function to format phone number
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return ''
    // Simple formatting for display
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  // Helper function to calculate days since last visit
  const getDaysSinceLastVisit = (lastVisit: string) => {
    if (!lastVisit) return null
    const days = Math.floor((Date.now() - new Date(lastVisit).getTime()) / (24 * 60 * 60 * 1000))
    return days
  }

  // Helper function to get visit frequency badge
  const getVisitFrequencyBadge = (visitCount: number, daysSince: number | null) => {
    if (!visitCount || daysSince === null) return null

    const avgDaysBetweenVisits = daysSince / visitCount

    if (avgDaysBetweenVisits < 30) return { label: 'Frequent', color: LUXE_COLORS.emerald }
    if (avgDaysBetweenVisits < 60) return { label: 'Regular', color: LUXE_COLORS.gold }
    if (avgDaysBetweenVisits < 90) return { label: 'Occasional', color: LUXE_COLORS.orange }
    return { label: 'Rare', color: LUXE_COLORS.ruby }
  }

  return (
    <SalonLuxeCRUDPage
      title="Customers"
      description="Build lasting relationships with your valued clients"
      entityType="CUSTOMER"
      preset={CUSTOMER_PRESET}
      icon={Users}
      searchPlaceholder="Search customers by name, email, phone, or tags..."
      // Custom status options for customers
      statusOptions={[
        { value: 'all', label: 'All Customers', color: LUXE_COLORS.lightText },
        { value: 'active', label: 'Active', color: LUXE_COLORS.emerald },
        { value: 'vip', label: 'VIP', color: LUXE_COLORS.gold },
        { value: 'new', label: 'New', color: LUXE_COLORS.sapphire },
        { value: 'inactive', label: 'Inactive', color: LUXE_COLORS.bronze },
        { value: 'lost', label: 'Lost', color: LUXE_COLORS.ruby }
      ]}
      // Additional filters for customer segmentation
      additionalFilters={
        <>
          <Select>
            <SelectTrigger
              className="w-48 h-11"
              style={{
                backgroundColor: `${LUXE_COLORS.charcoal}80`,
                border: `1px solid ${LUXE_COLORS.bronze}30`,
                color: LUXE_COLORS.lightText
              }}
            >
              <SelectValue placeholder="Visit Frequency" />
            </SelectTrigger>
            <SelectContent
              className="luxe-select-content"
              style={{
                backgroundColor: LUXE_COLORS.charcoalLight,
                border: `1px solid ${LUXE_COLORS.gold}30`
              }}
            >
              <SelectItem value="all">All Frequencies</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="rare">Rarely</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger
              className="w-48 h-11"
              style={{
                backgroundColor: `${LUXE_COLORS.charcoal}80`,
                border: `1px solid ${LUXE_COLORS.bronze}30`,
                color: LUXE_COLORS.lightText
              }}
            >
              <SelectValue placeholder="Spending Level" />
            </SelectTrigger>
            <SelectContent
              className="luxe-select-content"
              style={{
                backgroundColor: LUXE_COLORS.charcoalLight,
                border: `1px solid ${LUXE_COLORS.gold}30`
              }}
            >
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="high">High ($200+)</SelectItem>
              <SelectItem value="medium">Medium ($100-200)</SelectItem>
              <SelectItem value="low">Low (&lt;$100)</SelectItem>
            </SelectContent>
          </Select>
        </>
      }
      // Validation and data transformation
      onBeforeCreate={async data => {
        if (!data.name) throw new Error('Customer name is required')
        if (!data.email && !data.phone) {
          throw new Error('Either email or phone number is required')
        }

        // Validate email format
        if (data.email && !data.email.includes('@')) {
          throw new Error('Invalid email format')
        }

        // Initialize calculated fields
        data.lifetime_value = 0
        data.visit_count = 0
        data.customer_type = data.customer_type || 'new'

        return data
      }}
      renderCard={(customer, handlers) => {
        const lifetimeValue = customer.dynamic_fields?.lifetime_value?.value || 0
        const visitCount = customer.dynamic_fields?.visit_count?.value || 0
        const lastVisit = customer.dynamic_fields?.last_visit?.value
        const avgTicket = customer.dynamic_fields?.average_ticket?.value || 0
        const daysSince = getDaysSinceLastVisit(lastVisit)
        const visitFrequency = getVisitFrequencyBadge(visitCount, daysSince)
        const tags =
          customer.dynamic_fields?.tags?.value
            ?.split(',')
            .map(t => t.trim())
            .filter(Boolean) || []
        const customerType = customer.dynamic_fields?.customer_type?.value || 'regular'

        return (
          <SalonLuxeCard
            title={customer.dynamic_fields?.name?.value || customer.entity_name}
            subtitle={
              customer.dynamic_fields?.preferred_stylist?.value
                ? `Prefers ${customer.dynamic_fields.preferred_stylist.value}`
                : undefined
            }
            icon={Users}
            colorTag={getCustomerTypeColor(customerType)}
            status={customer.dynamic_fields?.status?.value || 'active'}
            badges={[
              {
                label: 'LTV',
                value: `$${lifetimeValue.toFixed(0)}`,
                color: lifetimeValue > 1000 ? LUXE_COLORS.gold : LUXE_COLORS.bronze
              },
              {
                label: 'Visits',
                value: visitCount,
                color: visitCount > 10 ? LUXE_COLORS.emerald : LUXE_COLORS.sapphire
              },
              ...(avgTicket > 0
                ? [
                    {
                      label: 'Avg',
                      value: `$${avgTicket.toFixed(0)}`,
                      color: LUXE_COLORS.plum
                    }
                  ]
                : []),
              ...(visitFrequency ? [visitFrequency] : [])
            ]}
            footer={
              <div className="space-y-2">
                <div
                  className="flex items-center gap-4 text-xs"
                  style={{ color: LUXE_COLORS.bronze }}
                >
                  {customer.dynamic_fields?.email?.value && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span>{customer.dynamic_fields.email.value}</span>
                    </div>
                  )}
                  {customer.dynamic_fields?.phone?.value && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{formatPhoneNumber(customer.dynamic_fields.phone.value)}</span>
                    </div>
                  )}
                </div>

                {lastVisit && (
                  <div
                    className="flex items-center gap-1 text-xs"
                    style={{ color: LUXE_COLORS.bronze }}
                  >
                    <Clock className="h-3 w-3" />
                    <span>
                      Last visit:{' '}
                      {daysSince === 0
                        ? 'Today'
                        : daysSince === 1
                          ? 'Yesterday'
                          : daysSince < 7
                            ? `${daysSince} days ago`
                            : daysSince < 30
                              ? `${Math.floor(daysSince / 7)} weeks ago`
                              : `${Math.floor(daysSince / 30)} months ago`}
                    </span>
                  </div>
                )}

                {tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {tags.slice(0, 3).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs"
                        style={{
                          backgroundColor: `${LUXE_COLORS.gold}20`,
                          color: LUXE_COLORS.gold,
                          borderColor: `${LUXE_COLORS.gold}30`
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                    {tags.length > 3 && (
                      <span className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                        +{tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {customer.dynamic_fields?.date_of_birth?.value && (
                  <div
                    className="flex items-center gap-1 text-xs"
                    style={{ color: LUXE_COLORS.bronze }}
                  >
                    <Gift className="h-3 w-3" />
                    <span>
                      Birthday:{' '}
                      {format(new Date(customer.dynamic_fields.date_of_birth.value), 'MMM d')}
                    </span>
                  </div>
                )}
              </div>
            }
            onEdit={handlers.onEdit}
            onArchive={handlers.onArchive}
            canEdit={handlers.canEdit}
            canDelete={handlers.canDelete}
            createdAt={customer.created_at}
            updatedAt={customer.updated_at}
          />
        )
      }}
      // Use custom customer form component
      customFormComponent={CustomerForm}
    />
  )
}
