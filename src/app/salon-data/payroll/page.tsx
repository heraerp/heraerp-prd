'use client'
/**
 * HERA Salon Payroll Processing System
 * Smart Code: HERA.SALON.PAYROLL.MODULE.v1
 * 
 * Complete payroll system with direct deposit, commissions, taxes,
 * and multi-location compliance - all on 6-table foundation
 */

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { universalApi } from '@/lib/universal-api'
import { handleError } from '@/lib/salon/error-handler'
import type { PayrollEmployee } from '@/types/salon.types'
import { 
  DollarSign,
  Users,
  Calendar,
  FileText,
  Download,
  Upload,
  Play,
  Plus,
  Clock,
  TrendingUp,
  CreditCard,
  Calculator,
  Receipt,
  Settings,
  Bell,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Percent,
  Award,
  Building,
  Mail,
  Save,
  Edit,
  Printer,
  Send,
  Shield,
  ChevronRight,
  Filter,
  Search,
  X,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ----------------------------- Types & Interfaces ------------------------------------
// Employee type imported from @/types/salon.types

interface PayrollRun {
  id: string
  transaction_type: 'PAYROLL_RUN'
  smart_code: string
  run_date: Date
  pay_period_start: Date
  pay_period_end: Date
  run_type: 'regular' | 'off-cycle' | 'bonus'
  status: 'draft' | 'processing' | 'completed' | 'failed'
  employee_count: number
  gross_total: number
  net_total: number
  tax_total: number
  deductions_total: number
}

interface PayrollLine {
  employee_id: string
  employee_name: string
  hours_worked?: number
  regular_pay: number
  overtime_pay: number
  commission: number
  tips: number
  bonus: number
  gross_pay: number
  federal_tax: number
  state_tax: number
  fica_tax: number
  other_deductions: number
  net_pay: number
  payment_method: 'direct_deposit' | 'check' | 'cash'
  status: 'pending' | 'paid' | 'failed'
}

interface PayrollStats {
  totalEmployees: number
  activePayroll: number
  ytdPayroll: number
  ytdTaxes: number
  avgPayPerEmployee: number
  nextPayDate: Date
}

// ----------------------------- Mock Data ------------------------------------

const mockEmployees: Employee[] = [
  {
    id: '1',
    entity_name: 'Sarah Johnson',
    entity_code: 'EMP-001',
    entity_type: 'employee',
    smart_code: 'HERA.SALON.EMPLOYEE.STYLIST.v1',
    classification: 'employee',
    department: 'Hair Styling',
    pay_schedule: 'bi-weekly',
    compensation_type: 'hybrid',
    base_rate: 15,
    commission_rate: 45,
    ytd_earnings: 68500,
    last_pay_date: new Date('2024-03-01'),
    status: 'active'
  },
  {
    id: '2',
    entity_name: 'Michael Chen',
    entity_code: 'EMP-002',
    entity_type: 'employee',
    smart_code: 'HERA.SALON.EMPLOYEE.SENIOR.STYLIST.v1',
    classification: 'employee',
    department: 'Hair Styling',
    pay_schedule: 'bi-weekly',
    compensation_type: 'commission',
    base_rate: 0,
    commission_rate: 60,
    ytd_earnings: 92000,
    last_pay_date: new Date('2024-03-01'),
    status: 'active'
  },
  {
    id: '3',
    entity_name: 'Emma Davis',
    entity_code: 'CTR-001',
    entity_type: 'employee',
    smart_code: 'HERA.SALON.CONTRACTOR.BOOTH.v1',
    classification: 'booth_renter',
    department: 'Nails',
    pay_schedule: 'monthly',
    compensation_type: 'salary',
    base_rate: 2000,
    ytd_earnings: 24000,
    last_pay_date: new Date('2024-02-28'),
    status: 'active'
  }
]

const mockPayrollRuns: PayrollRun[] = [
  {
    id: '1',
    transaction_type: 'PAYROLL_RUN',
    smart_code: 'HERA.SALON.PAYROLL.RUN.v1',
    run_date: new Date('2024-03-15'),
    pay_period_start: new Date('2024-03-01'),
    pay_period_end: new Date('2024-03-14'),
    run_type: 'regular',
    status: 'completed',
    employee_count: 12,
    gross_total: 45600,
    net_total: 32400,
    tax_total: 8900,
    deductions_total: 4300
  }
]

const paySchedules = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-Weekly' },
  { value: 'semi-monthly', label: 'Semi-Monthly' },
  { value: 'monthly', label: 'Monthly' }
]

const compensationTypes = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'salary', label: 'Salary' },
  { value: 'commission', label: 'Commission Only' },
  { value: 'hybrid', label: 'Hourly + Commission' }
]

// ----------------------------- Main Component ------------------------------------

export default function SalonPayrollSystem() {
  const { currentOrganization, contextLoading } = useMultiOrgAuth()
  const [organizationId, setOrganizationId] = useState<string>('')
  
  // State Management
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'runs' | 'reports' | 'settings'>('overview')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [showPayrollModal, setShowPayrollModal] = useState(false)
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Set organization ID
  useEffect(() => {
    if (currentOrganization?.id) {
      setOrganizationId(currentOrganization.id)
    }
  }, [currentOrganization])

  // Mock stats
  const payrollStats: PayrollStats = {
    totalEmployees: mockEmployees.length,
    activePayroll: mockEmployees.filter(e => e.status === 'active').length,
    ytdPayroll: mockEmployees.reduce((sum, e) => sum + e.ytd_earnings, 0),
    ytdTaxes: mockEmployees.reduce((sum, e) => sum + e.ytd_earnings * 0.22, 0),
    avgPayPerEmployee: mockEmployees.reduce((sum, e) => sum + e.ytd_earnings, 0) / mockEmployees.length,
    nextPayDate: new Date('2024-03-29')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // ----------------------------- Component Functions ------------------------------------

  const handleRunPayroll = async () => {
    setIsProcessing(true)
    try {
      // Simulate payroll run
      await new Promise(resolve => setTimeout(resolve, 3000))
      handleError(
        new Error('Payroll run completed successfully!'),
        'payroll-run',
        { 
          showToast: true,
          fallbackMessage: 'Payroll run completed successfully!'
        }
      )
    } catch (error) {
      handleError(error, 'payroll-run', {
        showToast: true,
        fallbackMessage: 'Payroll run failed. Please try again.'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // ----------------------------- Tab Components ------------------------------------

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Employees</span>
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold">{payrollStats.totalEmployees}</p>
            <p className="text-xs text-gray-500 mt-1">
              {payrollStats.activePayroll} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">YTD Payroll</span>
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(payrollStats.ytdPayroll)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(payrollStats.avgPayPerEmployee)} avg/employee
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">YTD Taxes</span>
              <Receipt className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(payrollStats.ytdTaxes)}</p>
            <p className="text-xs text-gray-500 mt-1">
              Federal, State, FICA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Next Pay Date</span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold">
              {payrollStats.nextPayDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              In {Math.ceil((payrollStats.nextPayDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your payroll operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => setShowPayrollModal(true)}
              className="h-24 flex-col bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Play className="w-8 h-8 mb-2" />
              Run Payroll
            </Button>
            <Button variant="outline" className="h-24 flex-col">
              <FileText className="w-8 h-8 mb-2" />
              View Pay Stubs
            </Button>
            <Button variant="outline" className="h-24 flex-col">
              <Calculator className="w-8 h-8 mb-2" />
              Tax Calculator
            </Button>
            <Button variant="outline" className="h-24 flex-col">
              <Download className="w-8 h-8 mb-2" />
              Export Reports
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Payroll Runs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payroll Runs</CardTitle>
          <CardDescription>Last 5 payroll processing runs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockPayrollRuns.map(run => (
              <div key={run.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    run.status === 'completed' ? "bg-green-100 dark:bg-green-900" : "bg-yellow-100 dark:bg-yellow-900"
                  )}>
                    {run.status === 'completed' ? 
                      <CheckCircle className="w-5 h-5 text-green-600" /> : 
                      <Clock className="w-5 h-5 text-yellow-600" />
                    }
                  </div>
                  <div>
                    <p className="font-medium">
                      {run.run_type.charAt(0).toUpperCase() + run.run_type.slice(1)} Payroll
                    </p>
                    <p className="text-sm text-gray-500">
                      {run.pay_period_start.toLocaleDateString()} - {run.pay_period_end.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(run.gross_total)}</p>
                  <p className="text-sm text-gray-500">{run.employee_count} employees</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const EmployeesTab = () => (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
        <Button
          onClick={() => setShowEmployeeModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Employee List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Classification
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pay Schedule
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compensation
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    YTD Earnings
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {mockEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{employee.entity_name}</p>
                        <p className="text-sm text-gray-500">{employee.entity_code}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{employee.department}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="text-xs">
                        {employee.classification}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">{employee.pay_schedule}</td>
                    <td className="px-6 py-4 text-sm">
                      {employee.compensation_type === 'hybrid' ? 
                        `$${employee.base_rate}/hr + ${employee.commission_rate}%` :
                        employee.compensation_type === 'commission' ?
                        `${employee.commission_rate}% commission` :
                        employee.compensation_type === 'hourly' ?
                        `$${employee.base_rate}/hour` :
                        `$${employee.base_rate}/month`
                      }
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {formatCurrency(employee.ytd_earnings)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={employee.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {employee.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEmployee(employee)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const RunsTab = () => (
    <div className="space-y-6">
      {/* Run Payroll Card */}
      <Card>
        <CardHeader>
          <CardTitle>Run Payroll</CardTitle>
          <CardDescription>Process payroll for your employees</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pay Period</label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>March 1-15, 2024</option>
                  <option>March 16-31, 2024</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Run Type</label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option value="regular">Regular</option>
                  <option value="off-cycle">Off-Cycle</option>
                  <option value="bonus">Bonus</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Pay Date</label>
                <Input type="date" defaultValue="2024-03-29" />
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This will process payroll for 12 active employees. Total estimated: {formatCurrency(45600)}
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleRunPayroll}
              disabled={isProcessing}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing Payroll...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Payroll
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Processing Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Processing Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { step: 1, title: 'Calculate Hours', description: 'Import time tracking data', status: 'completed' },
              { step: 2, title: 'Calculate Commissions', description: 'Process sales commissions', status: 'completed' },
              { step: 3, title: 'Apply Deductions', description: 'Calculate taxes and benefits', status: 'current' },
              { step: 4, title: 'Review & Approve', description: 'Final review before processing', status: 'pending' },
              { step: 5, title: 'Process Payments', description: 'Send to bank for direct deposit', status: 'pending' }
            ].map((step) => (
              <div key={step.step} className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  step.status === 'completed' ? "bg-green-100 text-green-600" :
                  step.status === 'current' ? "bg-purple-100 text-purple-600" :
                  "bg-gray-100 text-gray-400"
                )}>
                  {step.status === 'completed' ? 
                    <CheckCircle className="w-5 h-5" /> : 
                    <span className="font-semibold">{step.step}</span>
                  }
                </div>
                <div className="flex-1">
                  <p className="font-medium">{step.title}</p>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const ReportsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { 
            title: 'Payroll Register', 
            description: 'Detailed breakdown of all payroll runs',
            icon: <FileText className="w-8 h-8" />,
            color: 'from-purple-500 to-purple-700'
          },
          { 
            title: 'Tax Summary', 
            description: 'Federal, state, and local tax reports',
            icon: <Receipt className="w-8 h-8" />,
            color: 'from-blue-500 to-indigo-600'
          },
          { 
            title: 'Commission Report', 
            description: 'Employee commission calculations',
            icon: <Percent className="w-8 h-8" />,
            color: 'from-green-500 to-emerald-600'
          },
          { 
            title: 'YTD Summary', 
            description: 'Year-to-date earnings and deductions',
            icon: <Calendar className="w-8 h-8" />,
            color: 'from-amber-500 to-orange-600'
          },
          { 
            title: 'Pay Stub History', 
            description: 'All employee pay stubs',
            icon: <CreditCard className="w-8 h-8" />,
            color: 'from-red-500 to-pink-600'
          },
          { 
            title: 'W-2/1099 Forms', 
            description: 'Year-end tax documents',
            icon: <Shield className="w-8 h-8" />,
            color: 'from-indigo-500 to-purple-600'
          }
        ].map((report, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "w-16 h-16 rounded-xl bg-gradient-to-br flex items-center justify-center text-white",
                  report.color
                )}>
                  {report.icon}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="font-semibold text-lg mb-1">{report.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{report.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const SettingsTab = () => (
    <div className="space-y-6">
      {/* Payroll Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Configuration</CardTitle>
          <CardDescription>Manage your payroll settings and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pay Schedules */}
          <div>
            <h3 className="font-semibold mb-4">Pay Schedules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paySchedules.map(schedule => (
                <div key={schedule.value} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{schedule.label}</p>
                    <p className="text-sm text-gray-500">
                      {schedule.value === 'weekly' && 'Every Friday'}
                      {schedule.value === 'bi-weekly' && '1st & 15th'}
                      {schedule.value === 'semi-monthly' && 'Every other Friday'}
                      {schedule.value === 'monthly' && 'Last day of month'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Tax Settings */}
          <div>
            <h3 className="font-semibold mb-4">Tax Configuration</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Federal Tax ID</p>
                  <p className="text-sm text-gray-500">XX-XXXXXXX</p>
                </div>
                <Button variant="outline" size="sm">Update</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">State Tax Registration</p>
                  <p className="text-sm text-gray-500">Active in 1 state</p>
                </div>
                <Button variant="outline" size="sm">Manage</Button>
              </div>
            </div>
          </div>

          {/* Direct Deposit */}
          <div>
            <h3 className="font-semibold mb-4">Banking & Direct Deposit</h3>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Direct Deposit Enabled</p>
                    <p className="text-sm text-gray-500">Bank of America ****1234</p>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-600">Active</Badge>
              </div>
              <Button variant="outline" className="w-full">
                Update Banking Information
              </Button>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <h3 className="font-semibold mb-4">Notifications</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">Send pay stub emails to employees</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">Notify me before each payroll run</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Send reminders for missing timesheets</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // ----------------------------- Run Payroll Modal ------------------------------------
  
  const RunPayrollModal = () => {
    if (!showPayrollModal) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Run Payroll - March 16-31, 2024</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPayrollModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
            <CardDescription>Review and approve payroll for 12 employees</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Summary */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Gross Pay</p>
                  <p className="text-xl font-bold">{formatCurrency(45600)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Taxes</p>
                  <p className="text-xl font-bold text-orange-600">{formatCurrency(8900)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Deductions</p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(4300)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Net Pay</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(32400)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Employee Details */}
            <div className="mb-6">
              <h3 className="font-semibold mb-4">Employee Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left px-4 py-2">Employee</th>
                      <th className="text-right px-4 py-2">Hours</th>
                      <th className="text-right px-4 py-2">Regular</th>
                      <th className="text-right px-4 py-2">Commission</th>
                      <th className="text-right px-4 py-2">Gross</th>
                      <th className="text-right px-4 py-2">Taxes</th>
                      <th className="text-right px-4 py-2">Net Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {mockEmployees.slice(0, 3).map(emp => (
                      <tr key={emp.id}>
                        <td className="px-4 py-2">{emp.entity_name}</td>
                        <td className="text-right px-4 py-2">80</td>
                        <td className="text-right px-4 py-2">{formatCurrency(1200)}</td>
                        <td className="text-right px-4 py-2">{formatCurrency(2300)}</td>
                        <td className="text-right px-4 py-2 font-medium">{formatCurrency(3500)}</td>
                        <td className="text-right px-4 py-2 text-orange-600">{formatCurrency(770)}</td>
                        <td className="text-right px-4 py-2 font-medium text-green-600">{formatCurrency(2730)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPayrollModal(false)}
              >
                Cancel
              </Button>
              <Button variant="outline">
                <Printer className="w-4 h-4 mr-2" />
                Preview Reports
              </Button>
              <Button
                onClick={handleRunPayroll}
                disabled={isProcessing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Approve & Process
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ----------------------------- Main Render ------------------------------------

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-900 dark:to-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between max-w-[1600px] mx-auto">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Payroll Management
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Process payroll, manage employees, and generate reports
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Reminders
              </Button>
              <Button 
                onClick={() => setShowPayrollModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Run Payroll
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-[1600px] mx-auto">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'employees' | 'runs' | 'reports' | 'settings')}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="runs">Payroll Runs</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>
          
          <TabsContent value="employees">
            <EmployeesTab />
          </TabsContent>
          
          <TabsContent value="runs">
            <RunsTab />
          </TabsContent>
          
          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>
          
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Run Payroll Modal */}
      <RunPayrollModal />
    </div>
  )
}