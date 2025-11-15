'use client'

/**
 * Salon Staff Page V2
 *
 * Simplified implementation using the Salon Luxe CRUD pattern
 * Compare this to the original staff page to see how much simpler it is!
 */

import React from 'react'
import { Users } from 'lucide-react'
import { SalonLuxeCRUDPage } from '@/lib/dna/patterns/salon-luxe-crud-pattern'
import { SalonLuxeCard } from '@/lib/dna/patterns/salon-luxe-card'
import { LUXE_COLORS } from '@/lib/constants/salon'

// Staff entity preset configuration
const STAFF_PRESET = {
  smart_code: 'HERA.SALON.STAFF.ENTITY.PERSON.V1',
  dynamicFields: [
    {
      field_name: 'name',
      field_type: 'text',
      smart_code: 'HERA.SALON.STAFF.DYN.NAME.V1',
      required: true,
      label: 'Full Name',
      placeholder: 'e.g., Sarah Johnson'
    },
    {
      field_name: 'code',
      field_type: 'text',
      smart_code: 'HERA.SALON.STAFF.DYN.CODE.V1',
      label: 'Employee Code',
      placeholder: 'e.g., EMP-001'
    },
    {
      field_name: 'email',
      field_type: 'text',
      smart_code: 'HERA.SALON.STAFF.DYN.EMAIL.V1',
      label: 'Email Address',
      placeholder: 'sarah@hairtalkz.com'
    },
    {
      field_name: 'phone',
      field_type: 'text',
      smart_code: 'HERA.SALON.STAFF.DYN.PHONE.V1',
      label: 'Phone Number',
      placeholder: '+1 (555) 123-4567'
    },
    {
      field_name: 'role',
      field_type: 'text',
      smart_code: 'HERA.SALON.STAFF.DYN.ROLE.V1',
      required: true,
      label: 'Position',
      placeholder: 'e.g., Senior Stylist'
    },
    {
      field_name: 'commission_rate',
      field_type: 'number',
      smart_code: 'HERA.SALON.STAFF.DYN.COMMISSION.V1',
      label: 'Commission Rate (%)',
      placeholder: '40'
    },
    {
      field_name: 'hire_date',
      field_type: 'date',
      smart_code: 'HERA.SALON.STAFF.DYN.HIRE_DATE.V1',
      label: 'Hire Date'
    },
    {
      field_name: 'specialties',
      field_type: 'text',
      smart_code: 'HERA.SALON.STAFF.DYN.SPECIALTIES.V1',
      label: 'Specialties',
      placeholder: 'e.g., Color Specialist, Bridal Hair, Extensions'
    },
    {
      field_name: 'certification',
      field_type: 'text',
      smart_code: 'HERA.SALON.STAFF.DYN.CERTIFICATION.V1',
      label: 'Certifications',
      placeholder: 'e.g., Master Colorist, Balayage Expert'
    },
    {
      field_name: 'instagram',
      field_type: 'text',
      smart_code: 'HERA.SALON.STAFF.DYN.INSTAGRAM.V1',
      label: 'Instagram Handle',
      placeholder: '@sarah_styles'
    },
    {
      field_name: 'status',
      field_type: 'text',
      smart_code: 'HERA.SALON.STAFF.DYN.STATUS.V1',
      label: 'Status',
      defaultValue: 'active'
    }
  ]
}

export default function SalonStaffV2Page() {
  // Helper function to get role color
  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      'Senior Stylist': LUXE_COLORS.gold,
      'Junior Stylist': LUXE_COLORS.emerald,
      Colorist: LUXE_COLORS.plum,
      Manager: LUXE_COLORS.ruby,
      Receptionist: LUXE_COLORS.sapphire,
      Apprentice: LUXE_COLORS.bronze
    }
    return roleColors[role] || LUXE_COLORS.bronze
  }

  // Helper function to calculate years of service
  const getYearsOfService = (hireDate: string) => {
    if (!hireDate) return 0
    const years = Math.floor(
      (Date.now() - new Date(hireDate).getTime()) / (365 * 24 * 60 * 60 * 1000)
    )
    return years
  }

  return (
    <SalonLuxeCRUDPage
      title="Staff"
      description="Manage your talented team of stylists and staff"
      entityType="STAFF"
      preset={STAFF_PRESET}
      icon={Users}
      searchPlaceholder="Search staff by name, email, role, or specialties..."
      // Custom permissions - only owners and managers can manage staff
      createPermissions={['owner', 'manager']}
      editPermissions={['owner', 'manager']}
      deletePermissions={['owner']} // Only owners can archive staff
      // Validation before creating/updating
      onBeforeCreate={async data => {
        if (!data.name) throw new Error('Staff name is required')
        if (!data.role) throw new Error('Position is required')

        // Auto-generate employee code if not provided
        if (!data.code) {
          const prefix = 'EMP'
          const randomNum = Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, '0')
          data.code = `${prefix}-${randomNum}`
        }

        // Validate email format
        if (data.email && !data.email.includes('@')) {
          throw new Error('Invalid email format')
        }

        // Validate commission rate
        if (data.commission_rate && (data.commission_rate < 0 || data.commission_rate > 100)) {
          throw new Error('Commission rate must be between 0 and 100')
        }

        return data
      }}
      renderCard={(staff, handlers) => {
        const yearsOfService = getYearsOfService(staff.dynamic_fields?.hire_date?.value)
        const specialties =
          staff.dynamic_fields?.specialties?.value?.split(',').map(s => s.trim()) || []

        return (
          <SalonLuxeCard
            title={staff.dynamic_fields?.name?.value || staff.entity_name}
            subtitle={staff.dynamic_fields?.role?.value}
            description={
              specialties.length > 0
                ? specialties.slice(0, 2).join(' • ') + (specialties.length > 2 ? ' • ...' : '')
                : undefined
            }
            code={staff.dynamic_fields?.code?.value}
            icon={Users}
            colorTag={getRoleColor(staff.dynamic_fields?.role?.value || '')}
            status={staff.dynamic_fields?.status?.value || 'active'}
            badges={[
              ...(staff.dynamic_fields?.commission_rate?.value
                ? [
                    {
                      label: 'Commission',
                      value: `${staff.dynamic_fields.commission_rate.value}%`,
                      color: LUXE_COLORS.gold
                    }
                  ]
                : []),
              ...(yearsOfService > 0
                ? [
                    {
                      label: 'Experience',
                      value: `${yearsOfService} year${yearsOfService > 1 ? 's' : ''}`,
                      color: LUXE_COLORS.emerald
                    }
                  ]
                : [])
            ]}
            footer={
              <div className="space-y-1">
                {staff.dynamic_fields?.email?.value && (
                  <div
                    className="text-xs flex items-center gap-2"
                    style={{ color: LUXE_COLORS.bronze }}
                  >
                    <span>✉️</span>
                    <span>{staff.dynamic_fields.email.value}</span>
                  </div>
                )}
                {staff.dynamic_fields?.phone?.value && (
                  <div
                    className="text-xs flex items-center gap-2"
                    style={{ color: LUXE_COLORS.bronze }}
                  >
                    <span>📱</span>
                    <span>{staff.dynamic_fields.phone.value}</span>
                  </div>
                )}
                {staff.dynamic_fields?.instagram?.value && (
                  <div
                    className="text-xs flex items-center gap-2"
                    style={{ color: LUXE_COLORS.bronze }}
                  >
                    <span>📸</span>
                    <span>{staff.dynamic_fields.instagram.value}</span>
                  </div>
                )}
              </div>
            }
            onEdit={handlers.onEdit}
            onArchive={handlers.onArchive}
            canEdit={handlers.canEdit}
            canDelete={handlers.canDelete}
            createdAt={staff.dynamic_fields?.hire_date?.value || staff.created_at}
            updatedAt={staff.updated_at}
          />
        )
      }}
    />
  )
}
