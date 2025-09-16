'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { EnterpriseDataTable } from '@/src/lib/dna/components/organisms/EnterpriseDataTable'
import { Card } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Badge } from '@/src/components/ui/badge'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Skeleton } from '@/src/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import {
  Users,
  UserCheck,
  Calendar,
  Clock,
  Award,
  Briefcase,
  Phone,
  Mail,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Download,
  ChevronRight,
  UserPlus,
  CalendarDays,
  ClipboardCheck,
  TrendingUp,
  Building
} from 'lucide-react'
import { useMultiOrgAuth } from '@/src/components/auth/MultiOrgAuthProvider'
import { useFurnitureOrg, FurnitureOrgLoading } from '@/src/components/furniture/FurnitureOrgContext'
import FurniturePageHeader from '@/src/components/furniture/FurniturePageHeader'
import { cn } from '@/src/lib/utils'

// Employee table columns
const employeeColumns = [
  {
    id: 'entity_code',
    key: 'entity_code',
    header: 'Employee ID',
    label: 'Employee ID',
    accessor: 'entity_code',
    sortable: true,
    width: '120px',
    render: (value: string) => (
      <span className="font-mono text-sm">{value}</span>
    )
  },
  {
    id: 'entity_name',
    key: 'entity_name',
    header: 'Name',
    label: 'Name',
    accessor: 'entity_name',
    sortable: true,
    render: (value: string, row: any) => (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-[var(--color-body)] flex items-center justify-center text-[var(--color-text-primary)] font-medium">
          {value
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase()}
        </div>
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {(row.metadata as any)?.position || 'Employee'}
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'department',
    key: 'department',
    header: 'Department',
    label: 'Department',
    accessor: (row: any) => (row.metadata as any)?.department || 'General',
    sortable: true,
    render: (_: any, row: any) => {
      const dept = (row.metadata as any)?.department || 'General'
      const deptColors: Record<string, string> = {
        Management: 'bg-[var(--color-body)]/20 text-[var(--color-text-secondary)]',
        Production: 'bg-[var(--color-body)]/20 text-[var(--color-text-secondary)]',
        'Quality Control': 'bg-green-500/20 text-green-400',
        Sales: 'bg-orange-500/20 text-orange-400',
        Administration: 'bg-pink-500/20 text-pink-400'
      }
      
      return (
        <Badge variant="outline" className={cn(
            'border-0',
            deptColors[dept] || 'bg-gray-500/20 text-gray-400'
          )}>
          {dept}
        </Badge>
      )
    }
  }
]

// Attendance summary columns
const attendanceColumns = [
  {
    id: 'transaction_code',
    key: 'transaction_code',
    header: 'Date',
    label: 'Date',
    accessor: 'transaction_code',
    sortable: true,
    render: (value: string, row: any) => {
      const date = (row.metadata as any)?.attendance_date || row.transaction_date
      return (
        <div>
          <p className="font-medium">
            {new Date(date).toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short'
            })}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">{value}</p>
        </div>
      )
    }
  },
  {
    id: 'present',
    key: 'present',
    header: 'Present',
    label: 'Present',
    accessor: (row: any) => (row.metadata as any)?.total_present || 0,
    align: 'center' as const,
    render: (_: any, row: any) => (
      <span className="font-mono text-green-400">{(row.metadata as any)?.total_present || 0}</span>
    )
  },
  {
    id: 'absent',
    key: 'absent',
    header: 'Absent',
    label: 'Absent',
    accessor: (row: any) => (row.metadata as any)?.total_absent || 0,
    align: 'center' as const,
    render: (_: any, row: any) => (
      <span className="font-mono text-red-400">{(row.metadata as any)?.total_absent || 0}</span>
    )
  },
  {
    id: 'leave',
    key: 'leave',
    header: 'On Leave',
    label: 'On Leave',
    accessor: (row: any) => (row.metadata as any)?.total_leave || 0,
    align: 'center' as const,
    render: (_: any, row: any) => (
      <span className="font-mono text-[var(--color-text-secondary)]">{(row.metadata as any)?.total_leave || 0}</span>
    )
  }
]

export default function FurnitureHR() {
  const { isAuthenticated, contextLoading } = useMultiOrgAuth()
  const { organizationId, organizationName, orgLoading } = useFurnitureOrg()
  
  // Mock data for demonstration
  const employees = []
  const attendanceData = []
  const loading = false
  
  const [activeTab, setActiveTab] = useState('employees')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')

  // Show loading state
  if (orgLoading) {
    return <FurnitureOrgLoading />
  }

  // Authorization checks
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--color-body)] flex items-center justify-center p-6">
        <Alert className="max-w-md bg-[var(--color-body)]/50 border-[var(--color-border)]">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to access HR management.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-body)] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  const hrMetrics = [
    {
      label: 'Total Employees',
      value: '45',
      icon: Users,
      color: 'text-[var(--color-text-primary)]',
      description: 'Active workforce',
      change: '+3'
    },
    {
      label: 'Present Today',
      value: '42',
      icon: UserCheck,
      color: 'text-green-500',
      description: '93% attendance',
      change: '+2'
    },
    {
      label: 'On Leave',
      value: '2',
      icon: Calendar,
      color: 'text-[var(--color-text-primary)]',
      description: 'Planned leave',
      change: '0'
    },
    {
      label: 'Absent',
      value: '1',
      icon: AlertCircle,
      color: 'text-red-500',
      description: 'Unplanned',
      change: '-1'
    }
  ]

  return (
    <div className="min-h-screen bg-[var(--color-body)]">
      <div className="p-6 space-y-6">
        <FurniturePageHeader
          title="Human Resources"
          subtitle="Employee management and attendance tracking"
          actions={
            <>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button size="sm" className="bg-[var(--color-button-bg)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] gap-2">
                <UserPlus className="h-4 w-4" />
                Add Employee
              </Button>
            </>
          }
        />
        
        {/* HR Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {hrMetrics.map((metric, index) => (
            <Card key={index} className="p-4 bg-[var(--color-body)]/50 border-[var(--color-border)] hover:bg-[var(--color-body)]/70 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[var(--color-text-secondary)]">{metric.label}</p>
                  <metric.icon className={cn(
            'h-4 w-4',
            metric.color
          )} />
                </div>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">{metric.value}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{metric.description}</p>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[var(--color-text-secondary)]">Change: {metric.change}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center p-8">
          <p className="text-[var(--color-text-secondary)]">HR management interface is being loaded...</p>
        </div>
      </div>
    </div>
  )
}