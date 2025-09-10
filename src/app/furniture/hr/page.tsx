'use client'

import React, { useState, useEffect } from 'react'
import { EnterpriseDataTable } from '@/lib/dna/components/organisms/EnterpriseDataTable'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { universalApi } from '@/lib/universal-api'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { useFurnitureOrg, FurnitureOrgLoading } from '@/components/furniture/FurnitureOrgContext'
import FurniturePageHeader from '@/components/furniture/FurniturePageHeader'
import { cn } from '@/lib/utils'

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
        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
          {value.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-xs text-gray-500">{row.metadata?.position || 'Employee'}</p>
        </div>
      </div>
    )
  },
  {
    id: 'department',
    key: 'department',
    header: 'Department',
    label: 'Department',
    accessor: (row: any) => row.metadata?.department || 'General',
    sortable: true,
    render: (_: any, row: any) => {
      const dept = row.metadata?.department || 'General'
      const deptColors: Record<string, string> = {
        'Management': 'bg-purple-500/20 text-purple-400',
        'Production': 'bg-blue-500/20 text-blue-400',
        'Quality Control': 'bg-green-500/20 text-green-400',
        'Sales': 'bg-orange-500/20 text-orange-400',
        'Administration': 'bg-pink-500/20 text-pink-400'
      }
      return (
        <Badge variant="outline" className={cn("border-0", deptColors[dept] || 'bg-gray-500/20 text-gray-400')}>
          {dept}
        </Badge>
      )
    }
  },
  {
    id: 'employee_type',
    key: 'employee_type',
    header: 'Type',
    label: 'Type',
    accessor: (row: any) => row.metadata?.employee_type || 'permanent',
    sortable: true,
    render: (_: any, row: any) => {
      const type = row.metadata?.employee_type || 'permanent'
      return (
        <Badge variant="outline" className={cn(
          "border-0",
          type === 'permanent' ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"
        )}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Badge>
      )
    }
  },
  {
    id: 'grade',
    key: 'grade',
    header: 'Grade',
    label: 'Grade',
    accessor: (row: any) => row.metadata?.grade || '-',
    sortable: true,
    align: 'center' as const,
    render: (_: any, row: any) => (
      <span className="font-mono text-sm">{row.metadata?.grade || '-'}</span>
    )
  },
  {
    id: 'contact',
    key: 'contact',
    header: 'Contact',
    label: 'Contact',
    accessor: () => '',
    render: (_: any, row: any) => {
      const email = row.dynamic_data?.find((d: any) => d.field_name === 'email')?.field_value_text
      const phone = row.dynamic_data?.find((d: any) => d.field_name === 'phone')?.field_value_text
      
      return (
        <div className="space-y-1">
          {email && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Mail className="h-3 w-3" />
              {email}
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Phone className="h-3 w-3" />
              {phone}
            </div>
          )}
        </div>
      )
    }
  },
  {
    id: 'status',
    key: 'status',
    header: 'Status',
    label: 'Status',
    accessor: 'status',
    render: (_: any, row: any) => (
      <Badge variant="outline" className={cn(
        "border-0",
        row.status === 'active' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
      )}>
        {row.status === 'active' ? 'Active' : 'Inactive'}
      </Badge>
    )
  },
  {
    id: 'actions',
    key: 'actions',
    header: 'Actions',
    label: 'Actions',
    accessor: () => '',
    align: 'center' as const,
    render: (_: any, row: any) => (
      <div className="flex gap-1 justify-center">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-700">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
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
      const date = row.metadata?.attendance_date || row.transaction_date
      return (
        <div>
          <p className="font-medium">{new Date(date).toLocaleDateString('en-IN', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short' 
          })}</p>
          <p className="text-xs text-gray-400">{value}</p>
        </div>
      )
    }
  },
  {
    id: 'present',
    key: 'present',
    header: 'Present',
    label: 'Present',
    accessor: (row: any) => row.metadata?.total_present || 0,
    align: 'center' as const,
    render: (_: any, row: any) => (
      <span className="font-mono text-green-400">{row.metadata?.total_present || 0}</span>
    )
  },
  {
    id: 'absent',
    key: 'absent',
    header: 'Absent',
    label: 'Absent',
    accessor: (row: any) => row.metadata?.total_absent || 0,
    align: 'center' as const,
    render: (_: any, row: any) => (
      <span className="font-mono text-red-400">{row.metadata?.total_absent || 0}</span>
    )
  },
  {
    id: 'leave',
    key: 'leave',
    header: 'On Leave',
    label: 'On Leave',
    accessor: (row: any) => row.metadata?.total_leave || 0,
    align: 'center' as const,
    render: (_: any, row: any) => (
      <span className="font-mono text-amber-400">{row.metadata?.total_leave || 0}</span>
    )
  }
]

export default function FurnitureHR() {
  const { isAuthenticated, contextLoading } = useMultiOrgAuth()
  const { organizationId, organizationName, orgLoading } = useFurnitureOrg()
  const [employees, setEmployees] = useState<any[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])
  const [trainingRecords, setTrainingRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('employees')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  
  // HR metrics
  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    departments: 0,
    avgAttendance: 0,
    pendingLeaves: 0,
    contractWorkers: 0,
    totalTrainingHours: 0,
    totalPayroll: 0,
    pendingApprovals: 0
  })

  useEffect(() => {
    if (organizationId && !orgLoading) {
      loadHRData()
    }
  }, [organizationId, orgLoading])

  const loadHRData = async () => {
    try {
      setLoading(true)
      universalApi.setOrganizationId(organizationId)
      
      // Load all entities and relationships
      const { data: allEntities } = await universalApi.read({ table: 'core_entities' })
      const { data: allTransactions } = await universalApi.read({ table: 'universal_transactions' })
      const { data: allDynamicData } = await universalApi.read({ table: 'core_dynamic_data' })
      
      // Filter employees
      const employeeEntities = allEntities?.filter((e: any) => 
        e.entity_type === 'employee'
      ) || []
      
      // Enhance employees with dynamic data
      const enhancedEmployees = employeeEntities.map((emp: any) => {
        const dynamicData = allDynamicData?.filter((d: any) => d.entity_id === emp.id) || []
        return {
          ...emp,
          dynamic_data: dynamicData
        }
      })
      
      setEmployees(enhancedEmployees)
      
      // Filter attendance records
      const attendance = allTransactions?.filter((t: any) => 
        t.transaction_type === 'attendance'
      ) || []
      setAttendanceRecords(attendance.sort((a, b) => 
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      ))
      
      // Filter leave requests
      const leaves = allTransactions?.filter((t: any) => 
        t.transaction_type === 'leave_request'
      ) || []
      setLeaveRequests(leaves)
      
      // Calculate metrics
      const departmentEntities = allEntities?.filter((e: any) => e.entity_type === 'department') || []
      const activeEmp = employeeEntities.filter((e: any) => e.status === 'active')
      const contractEmp = employeeEntities.filter((e: any) => e.metadata?.employee_type === 'contract')
      const pendingLeaves = leaves.filter((l: any) => l.metadata?.status === 'pending')
      
      // Calculate average attendance
      const avgAttendance = attendance.length > 0
        ? Math.round(attendance.reduce((sum: number, a: any) => 
            sum + (a.metadata?.total_present || 0), 0) / attendance.length)
        : 0
      
      // Get payroll data
      const payrollRuns = allTransactions?.filter((t: any) => 
        t.transaction_type === 'payroll_run'
      ) || []
      const latestPayroll = payrollRuns[payrollRuns.length - 1]
      const totalPayroll = latestPayroll?.total_amount || 0
      
      // Get pending approvals
      const pendingOT = allTransactions?.filter((t: any) => 
        t.transaction_type === 'overtime_approval' && t.metadata?.status === 'pending'
      ) || []
      const pendingBonus = allTransactions?.filter((t: any) => 
        t.transaction_type === 'bonus_approval' && t.metadata?.status === 'pending'
      ) || []
      const pendingApprovals = pendingOT.length + pendingBonus.length
      
      // Get training hours
      const training = allTransactions?.filter((t: any) => 
        t.transaction_type === 'training_session'
      ) || []
      setTrainingRecords(training)
      const totalTrainingHours = training.reduce((sum: number, t: any) => {
        const hours = t.metadata?.duration_hours || 0
        // Approximate participants based on department
        const participants = t.metadata?.department === 'All' ? employeeEntities.length :
                           t.metadata?.department === 'Production' ? 5 : 1
        return sum + (hours * participants)
      }, 0)
      
      setMetrics({
        totalEmployees: employeeEntities.length,
        activeEmployees: activeEmp.length,
        departments: departmentEntities.length,
        avgAttendance,
        pendingLeaves: pendingLeaves.length,
        contractWorkers: contractEmp.length,
        totalTrainingHours,
        totalPayroll,
        pendingApprovals
      })
      
    } catch (error) {
      console.error('Failed to load HR data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = !searchTerm || 
      emp.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.entity_code.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDepartment = selectedDepartment === 'all' || 
      emp.metadata?.department === selectedDepartment
    
    return matchesSearch && matchesDepartment
  })

  // Get unique departments
  const departments = [...new Set(employees.map(e => e.metadata?.department).filter(Boolean))]

  // Show loading state
  if (orgLoading) {
    return <FurnitureOrgLoading />
  }

  // Authorization checks
  if (isAuthenticated && contextLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  const statCards = [
    { 
      label: 'Total Employees', 
      value: metrics.totalEmployees.toString(), 
      icon: Users,
      color: 'text-blue-500',
      description: `${metrics.activeEmployees} active`,
      change: '+2 this month'
    },
    { 
      label: 'Departments', 
      value: metrics.departments.toString(), 
      icon: Building,
      color: 'text-purple-500',
      description: 'Across organization',
      change: 'Well structured'
    },
    { 
      label: 'Avg Attendance', 
      value: `${metrics.avgAttendance}`, 
      icon: UserCheck,
      color: 'text-green-500',
      description: 'Daily average',
      change: '+5% vs last month'
    },
    { 
      label: 'Contract Workers', 
      value: metrics.contractWorkers.toString(), 
      icon: Briefcase,
      color: 'text-amber-500',
      description: 'Temporary staff',
      change: '1 expiring soon'
    },
    { 
      label: 'Pending Leaves', 
      value: metrics.pendingLeaves.toString(), 
      icon: CalendarDays,
      color: 'text-red-500',
      description: 'Awaiting approval',
      change: 'Action required'
    },
    { 
      label: 'Training Hours', 
      value: metrics.totalTrainingHours.toString(), 
      icon: Award,
      color: 'text-emerald-500',
      description: 'This quarter',
      change: `${trainingRecords.length} sessions`
    }
  ]

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <FurniturePageHeader
          title="Human Resources"
          subtitle="Employee management and workforce analytics"
          actions={
            <>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add Employee
              </Button>
            </>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((stat, index) => (
            <Card key={index} className="p-4 bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">{stat.label}</p>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.description}</p>
                <p className={cn(
                  "text-xs",
                  stat.change.includes('+') ? "text-green-500" : 
                  stat.change.includes('required') ? "text-red-500" : "text-gray-400"
                )}>
                  {stat.change}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList className="bg-gray-800 border-gray-700">
              <TabsTrigger value="employees" className="data-[state=active]:bg-gray-700">
                <Users className="h-4 w-4 mr-2" />
                Employees
              </TabsTrigger>
              <TabsTrigger value="attendance" className="data-[state=active]:bg-gray-700">
                <Calendar className="h-4 w-4 mr-2" />
                Attendance
              </TabsTrigger>
              <TabsTrigger value="leave" className="data-[state=active]:bg-gray-700">
                <CalendarDays className="h-4 w-4 mr-2" />
                Leave Management
              </TabsTrigger>
              <TabsTrigger value="payroll" className="data-[state=active]:bg-gray-700">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Payroll
              </TabsTrigger>
            </TabsList>
            
            {/* Search and Filters */}
            {activeTab === 'employees' && (
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-400 w-64"
                  />
                </div>
                
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-48 bg-gray-900/50 border-gray-600 text-white">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <TabsContent value="employees" className="space-y-4">
            <EnterpriseDataTable
              columns={employeeColumns}
              data={filteredEmployees}
              loading={loading}
              searchable={false}
              sortable
              pageSize={10}
              emptyState={{
                icon: Users,
                title: "No employees found",
                description: searchTerm || selectedDepartment !== 'all'
                  ? "Try adjusting your search or filters." 
                  : "Start by adding your first employee."
              }}
              className="bg-gray-800/50 border-gray-700"
            />
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 bg-gray-800/50 border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-white">Today's Attendance</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Present</span>
                    <span className="text-2xl font-bold text-green-400">
                      {attendanceRecords[0]?.metadata?.total_present || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Absent</span>
                    <span className="text-2xl font-bold text-red-400">
                      {attendanceRecords[0]?.metadata?.total_absent || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">On Leave</span>
                    <span className="text-2xl font-bold text-amber-400">
                      {attendanceRecords[0]?.metadata?.total_leave || 0}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-gray-700">
                    <Button className="w-full gap-2">
                      <Clock className="h-4 w-4" />
                      Mark Attendance
                    </Button>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 bg-gray-800/50 border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-white">Attendance History</h3>
                <EnterpriseDataTable
                  columns={attendanceColumns}
                  data={attendanceRecords.slice(0, 5)}
                  loading={loading}
                  searchable={false}
                  sortable={false}
                  pageSize={5}
                  showPagination={false}
                  className="bg-transparent border-0"
                />
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="leave" className="space-y-4">
            <Card className="p-6 bg-gray-800/50 border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-white">Leave Requests</h3>
              <div className="space-y-3">
                {leaveRequests.length > 0 ? (
                  leaveRequests.map((leave: any) => {
                    const employee = employees.find(e => e.id === leave.from_entity_id)
                    return (
                      <div key={leave.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50">
                        <div className="flex items-center gap-3">
                          <CalendarDays className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{employee?.entity_name || 'Employee'}</p>
                            <p className="text-sm text-gray-400">
                              {leave.metadata?.leave_type} Leave • {leave.metadata?.days} days • 
                              {leave.metadata?.start_date} to {leave.metadata?.end_date}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={cn(
                          "border-0",
                          leave.metadata?.status === 'approved' ? "bg-green-500/20 text-green-400" :
                          leave.metadata?.status === 'pending' ? "bg-amber-500/20 text-amber-400" :
                          "bg-red-500/20 text-red-400"
                        )}>
                          {leave.metadata?.status || 'pending'}
                        </Badge>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-center text-gray-400 py-8">No leave requests found</p>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="payroll" className="space-y-4">
            <Card className="p-6 bg-gray-800/50 border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-white">Payroll Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Total Payroll (Monthly)</p>
                  <p className="text-2xl font-bold">₹{metrics.totalPayroll.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-500">{metrics.totalEmployees} employees</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Next Payment Date</p>
                  <p className="text-2xl font-bold">
                    {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()} {
                      new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString('en-IN', { month: 'short' })
                    }
                  </p>
                  <p className="text-xs text-gray-500">
                    In {Math.ceil((new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Pending Approvals</p>
                  <p className="text-2xl font-bold text-amber-400">{metrics.pendingApprovals}</p>
                  <p className="text-xs text-gray-500">Overtime & bonuses</p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-700">
                <Button className="w-full gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  Process Payroll
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}