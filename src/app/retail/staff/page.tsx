'use client'

import React from 'react'
import { Users, Mail, Phone, MapPin, Calendar, Briefcase, Eye, Edit, Trash2 } from 'lucide-react'
import { HeraListPage } from '@/components/hera/HeraListPage'
import { FilterFieldConfig } from '@/components/hera/HeraFilterPanel'
import { TableColumn, TableAction } from '@/components/hera/HeraEntityTable'
import { CardField, CardAction } from '@/components/hera/HeraCardGrid'

export default function StaffPage() {
  // Define filter fields that will appear in the left panel
  const filters: FilterFieldConfig[] = [
    {
      field: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'on_leave', label: 'On Leave' }
      ]
    },
    {
      field: 'department',
      label: 'Department',
      type: 'select',
      options: [
        { value: 'sales', label: 'Sales' },
        { value: 'service', label: 'Service' },
        { value: 'management', label: 'Management' },
        { value: 'support', label: 'Support' }
      ]
    },
    {
      field: 'role',
      label: 'Role',
      type: 'select',
      options: [
        { value: 'manager', label: 'Manager' },
        { value: 'associate', label: 'Associate' },
        { value: 'technician', label: 'Technician' },
        { value: 'admin', label: 'Administrator' }
      ]
    },
    {
      field: 'hire_date',
      label: 'Hire Date',
      type: 'date'
    },
    {
      field: 'salary_min',
      label: 'Min Salary',
      type: 'number',
      placeholder: 'Minimum salary'
    },
    {
      field: 'full_time',
      label: 'Full Time',
      type: 'boolean'
    }
  ]

  // Define table columns for table view
  const columns: TableColumn[] = [
    {
      key: 'entity_name',
      label: 'Name',
      sortable: true,
      render: (value, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--hera-primary-start)] to-[var(--hera-primary-end)] flex items-center justify-center text-white font-medium">
            {value?.charAt(0) || '?'}
          </div>
          <div>
            <div className="font-medium text-[var(--hera-text-dark)]">{value || 'Unnamed'}</div>
            <div className="text-sm text-[var(--hera-text-medium)]">{record.entity_code || record.id}</div>
          </div>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value) => value ? (
        <a href={`mailto:${value}`} className="text-[var(--hera-primary-start)] hover:underline">
          {value}
        </a>
      ) : <span className="text-gray-400">—</span>
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (value) => value ? (
        <a href={`tel:${value}`} className="text-[var(--hera-primary-start)] hover:underline">
          {value}
        </a>
      ) : <span className="text-gray-400">—</span>
    },
    {
      key: 'department',
      label: 'Department',
      sortable: true,
      render: (value) => value ? (
        <span className="hera-status hera-status-info">
          {value}
        </span>
      ) : <span className="text-gray-400">—</span>
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`hera-status ${
          value === 'active' ? 'hera-status-success' :
          value === 'inactive' ? 'hera-status-error' :
          'hera-status-warning'
        }`}>
          {value || 'unknown'}
        </span>
      )
    }
  ]

  // Define card fields for card view
  const cardFields: CardField[] = [
    {
      key: 'email',
      label: 'Email',
      variant: 'secondary',
      render: (value) => value || '—'
    },
    {
      key: 'phone',
      label: 'Phone',
      variant: 'secondary',
      render: (value) => value || '—'
    },
    {
      key: 'department',
      label: 'Department',
      variant: 'accent',
      render: (value) => value || '—'
    },
    {
      key: 'role',
      label: 'Role',
      variant: 'primary',
      render: (value) => value || '—'
    },
    {
      key: 'salary',
      label: 'Salary',
      variant: 'primary',
      render: (value) => value ? `₹${Number(value).toLocaleString()}` : '—'
    }
  ]

  // Define actions for both table and card views
  const actions: TableAction[] = [
    {
      label: 'View Profile',
      icon: Eye,
      onClick: (record) => {
        console.log('View staff profile:', record)
        // Navigate to staff profile page
      },
      variant: 'default'
    },
    {
      label: 'Edit',
      icon: Edit,
      onClick: (record) => {
        console.log('Edit staff:', record)
        // Open edit modal or navigate to edit page
      },
      variant: 'primary'
    },
    {
      label: 'Deactivate',
      icon: Trash2,
      onClick: (record) => {
        console.log('Deactivate staff:', record)
        // Handle deactivation
      },
      variant: 'danger',
      show: (record) => record.status === 'active'
    }
  ]

  const cardActions: CardAction[] = actions // Same actions for cards

  const handleCreateStaff = () => {
    console.log('Create new staff member')
    // Open create modal or navigate to create page
  }

  return (
    <HeraListPage
      entityType="STAFF"
      title="Staff Management"
      subtitle="Manage your team members and their roles"
      icon={Users}
      filters={filters}
      columns={columns}
      cardFields={cardFields}
      tableActions={actions}
      cardActions={cardActions}
      createAction={{
        label: 'Add Staff Member',
        onClick: handleCreateStaff
      }}
      viewMode="table"
      allowViewToggle={true}
      selectable={true}
      emptyMessage="No staff members found"
      emptyIcon={Users}
    />
  )
}