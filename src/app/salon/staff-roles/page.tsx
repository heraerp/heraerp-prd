/**
 * Staff Roles Management Page
 * Auto-generated using Universal Configuration Manager
 * Enhanced for salon staff hierarchy and permissions
 */

'use client'

import { UniversalConfigManager } from '@/components/universal-config/UniversalConfigManager'
import { CONFIG_TYPES } from '@/lib/universal-config/config-types'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Shield, Users, DollarSign } from 'lucide-react'

export default function StaffRolesPage() {
  const router = useRouter()

  // Define salon-specific permissions organized by category
  const permissionOptions = [
    // Appointment Management
    { value: 'appointments.create', label: '📅 Create Appointments' },
    { value: 'appointments.edit', label: '📅 Edit Appointments' },
    { value: 'appointments.cancel', label: '📅 Cancel Appointments' },
    { value: 'appointments.reschedule', label: '📅 Reschedule Appointments' },
    
    // Client Management
    { value: 'clients.view', label: '👤 View Client Information' },
    { value: 'clients.edit', label: '👤 Edit Client Information' },
    { value: 'clients.delete', label: '👤 Delete Client Records' },
    { value: 'clients.notes', label: '👤 Manage Client Notes' },
    
    // Service Operations
    { value: 'services.perform', label: '✂️ Perform Services' },
    { value: 'services.modify', label: '✂️ Modify Service Details' },
    { value: 'products.sell', label: '🛍️ Sell Products' },
    { value: 'products.return', label: '🛍️ Process Returns' },
    
    // Financial Access
    { value: 'pos.access', label: '💳 Access Point of Sale' },
    { value: 'discounts.apply', label: '💸 Apply Discounts' },
    { value: 'payments.process', label: '💰 Process Payments' },
    { value: 'refunds.issue', label: '💰 Issue Refunds' },
    
    // Inventory Management
    { value: 'inventory.view', label: '📦 View Inventory' },
    { value: 'inventory.manage', label: '📦 Manage Inventory' },
    { value: 'inventory.order', label: '📦 Create Purchase Orders' },
    
    // Reporting & Analytics
    { value: 'reports.view', label: '📊 View Basic Reports' },
    { value: 'reports.financial', label: '📊 View Financial Reports' },
    { value: 'reports.export', label: '📊 Export Reports' },
    
    // Administration
    { value: 'staff.view', label: '⚙️ View Staff Information' },
    { value: 'staff.manage', label: '⚙️ Manage Staff' },
    { value: 'settings.view', label: '⚙️ View Settings' },
    { value: 'settings.edit', label: '⚙️ Edit Settings' }
  ]

  return (
    <div className="container mx-auto p-6">
      <UniversalConfigManager
        config={CONFIG_TYPES.STAFF_ROLE}
        apiEndpoint="/api/v1/salon/staff-roles"
        additionalFields={[
          // Basic Information
          {
            name: 'description',
            label: 'Role Description',
            type: 'textarea',
            defaultValue: '',
            placeholder: 'Describe the responsibilities and scope of this role'
          },
          {
            name: 'hierarchy_level',
            label: 'Hierarchy Level',
            type: 'number',
            defaultValue: 1,
            min: 1,
            max: 10,
            helpText: 'Lower numbers have higher authority (1 = Owner/Manager, 2 = Senior Staff, etc.)'
          },
          {
            name: 'color',
            label: 'Display Color',
            type: 'color',
            defaultValue: '#3B82F6',
            helpText: 'Used in schedules, reports, and staff identification'
          },
          
          // Commission Settings
          {
            name: 'service_commission_rate',
            label: 'Service Commission Rate (%)',
            type: 'number',
            defaultValue: 0,
            min: 0,
            max: 100,
            placeholder: '0-100',
            helpText: 'Commission percentage for service sales'
          },
          {
            name: 'product_commission_rate',
            label: 'Product Sales Commission (%)',
            type: 'number',
            defaultValue: 0,
            min: 0,
            max: 100,
            placeholder: '0-100',
            helpText: 'Commission percentage for retail product sales'
          },
          
          // Professional Settings
          {
            name: 'can_accept_tips',
            label: 'Can Accept Tips',
            type: 'checkbox',
            defaultValue: true,
            helpText: 'Allow this role to receive tips from clients'
          },
          {
            name: 'requires_license',
            label: 'Requires Professional License',
            type: 'checkbox',
            defaultValue: false,
            helpText: 'Role requires valid professional certification'
          },
          
          // Permissions
          {
            name: 'permissions',
            label: 'Role Permissions',
            type: 'multiselect',
            options: permissionOptions,
            defaultValue: [],
            helpText: 'Select all permissions granted to this role'
          }
        ]}
        customColumns={[
          {
            key: 'hierarchy',
            header: 'Level',
            render: (item) => (
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{item.hierarchy_level || 1}</span>
              </div>
            )
          },
          {
            key: 'commission',
            header: 'Commission Rates',
            render: (item) => (
              <div className="space-y-1 text-sm">
                {item.service_commission_rate > 0 && (
                  <div>Services: {item.service_commission_rate}%</div>
                )}
                {item.product_commission_rate > 0 && (
                  <div>Products: {item.product_commission_rate}%</div>
                )}
                {!item.service_commission_rate && !item.product_commission_rate && (
                  <span className="text-muted-foreground">No commission</span>
                )}
              </div>
            )
          },
          {
            key: 'staff_count',
            header: 'Staff Members',
            render: (item) => (
              <Badge variant="outline">
                <Users className="w-3 h-3 mr-1" />
                {item.staff_count || 0}
              </Badge>
            )
          },
          {
            key: 'color',
            header: 'Color',
            render: (item) => (
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: item.color || '#3B82F6' }}
                />
              </div>
            )
          },
          {
            key: 'permissions_count',
            header: 'Permissions',
            render: (item) => {
              const count = item.permissions?.length || 0
              return (
                <Badge variant={count > 10 ? 'default' : count > 5 ? 'secondary' : 'outline'}>
                  {count} permissions
                </Badge>
              )
            }
          }
        ]}
        onItemClick={(item) => {
          // Navigate to staff members filtered by this role
          router.push(`/salon/staff?role=${item.entity_code}`)
        }}
        showAnalytics={true}
        analyticsConfig={{
          title: 'Role Analytics',
          metrics: [
            {
              label: 'Total Roles',
              value: (items) => items.length
            },
            {
              label: 'Active Staff',
              value: (items) => {
                const total = items.reduce((sum, item) => sum + (item.staff_count || 0), 0)
                return total
              }
            },
            {
              label: 'Licensed Roles',
              value: (items) => items.filter(item => item.requires_license).length
            }
          ]
        }}
      />
    </div>
  )
}