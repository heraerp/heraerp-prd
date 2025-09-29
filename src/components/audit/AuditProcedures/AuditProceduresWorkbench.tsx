'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  TestTube,
  Calculator,
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  TrendingUp,
  Users,
  Zap,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import type { AuditArea, ProcedureType } from '@/types/audit.types'

const AUDIT_AREAS: { value: AuditArea; label: string; color: string }[] = [
  { value: 'cash_bank', label: 'Cash & Bank', color: 'blue' },
  { value: 'accounts_receivable', label: 'Accounts Receivable', color: 'green' },
  { value: 'inventory', label: 'Inventory', color: 'purple' },
  { value: 'fixed_assets', label: 'Fixed Assets', color: 'orange' },
  { value: 'accounts_payable', label: 'Accounts Payable', color: 'red' },
  { value: 'revenue', label: 'Revenue', color: 'emerald' },
  { value: 'payroll', label: 'Payroll', color: 'pink' },
  { value: 'operating_expenses', label: 'Operating Expenses', color: 'yellow' }
]

const PROCEDURE_TYPES: { value: ProcedureType; label: string; description: string }[] = [
  { value: 'walkthrough', label: 'Walkthrough', description: 'Understand and document processes' },
  {
    value: 'control_testing',
    label: 'Control Testing',
    description: 'Test operating effectiveness of controls'
  },
  {
    value: 'substantive_analytical',
    label: 'Analytical Procedures',
    description: 'Substantive analytical procedures'
  },
  {
    value: 'substantive_detail',
    label: 'Detail Testing',
    description: 'Detailed substantive testing'
  },
  { value: 'confirmation', label: 'Confirmations', description: 'Third-party confirmations' },
  { value: 'observation', label: 'Observation', description: 'Direct observation of processes' },
  { value: 'inquiry', label: 'Inquiry', description: 'Management and staff inquiries' },
  { value: 'recalculation', label: 'Recalculation', description: 'Mathematical recalculation' }
]

interface AuditProcedure {
  id: string
  audit_area: AuditArea
  procedure_type: ProcedureType
  description: string
  status: 'planned' | 'in_progress' | 'completed' | 'reviewed'
  assigned_to: string
  materiality_threshold: number
  sample_size: number
  exceptions_noted: number
  completion_percentage: number
}

export function AuditProceduresWorkbench() {
  const [selectedArea, setSelectedArea] = useState<AuditArea>('cash_bank')
  const [selectedProcedure, setSelectedProcedure] = useState<string | null>(null)

  const [procedures, setProcedures] = useState<AuditProcedure[]>([
    {
      id: 'proc_001',
      audit_area: 'cash_bank',
      procedure_type: 'confirmation',
      description: 'Bank confirmation for all accounts',
      status: 'completed',
      assigned_to: 'Junior Auditor A',
      materiality_threshold: 50000,
      sample_size: 8,
      exceptions_noted: 0,
      completion_percentage: 100
    },
    {
      id: 'proc_002',
      audit_area: 'cash_bank',
      procedure_type: 'substantive_detail',
      description: 'Bank reconciliation testing',
      status: 'in_progress',
      assigned_to: 'Junior Auditor B',
      materiality_threshold: 50000,
      sample_size: 12,
      exceptions_noted: 1,
      completion_percentage: 75
    },
    {
      id: 'proc_003',
      audit_area: 'accounts_receivable',
      procedure_type: 'confirmation',
      description: 'Customer balance confirmations',
      status: 'planned',
      assigned_to: 'Senior Auditor',
      materiality_threshold: 100000,
      sample_size: 25,
      exceptions_noted: 0,
      completion_percentage: 0
    },
    {
      id: 'proc_004',
      audit_area: 'revenue',
      procedure_type: 'substantive_analytical',
      description: 'Revenue analytical procedures',
      status: 'completed',
      assigned_to: 'Senior Auditor',
      materiality_threshold: 200000,
      sample_size: 0,
      exceptions_noted: 0,
      completion_percentage: 100
    }
  ])

  const [materialitySettings, setMaterialitySettings] = useState({
    planning_materiality: 250000,
    performance_materiality: 187500,
    trivial_threshold: 12500
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'bg-muted text-gray-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'reviewed':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-muted text-gray-200'
    }
  }

  const getAreaProcedures = (area: AuditArea) => {
    return procedures.filter(proc => proc.audit_area === area)
  }

  const getAreaStats = (area: AuditArea) => {
    const areaProcedures = getAreaProcedures(area)
    return {
      total: areaProcedures.length,
      completed: areaProcedures.filter(p => p.status === 'completed').length,
      in_progress: areaProcedures.filter(p => p.status === 'in_progress').length,
      exceptions: areaProcedures.reduce((sum, p) => sum + p.exceptions_noted, 0),
      avg_completion:
        areaProcedures.length > 0
          ? Math.round(
              areaProcedures.reduce((sum, p) => sum + p.completion_percentage, 0) /
                areaProcedures.length
            )
          : 0
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
            <TestTube className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Audit Procedures Workbench</h2>
            <p className="text-muted-foreground">
              Plan, execute, and track audit testing procedures
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Calculator className="w-4 h-4 mr-2" />
            Sampling Calculator
          </Button>
          <Button className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700">
            <TestTube className="w-4 h-4 mr-2" />
            New Procedure
          </Button>
        </div>
      </div>

      {/* Materiality Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Materiality Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-primary mb-1">Planning Materiality</p>
              <p className="text-2xl font-bold text-blue-900">
                ${materialitySettings.planning_materiality.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 mb-1">Performance Materiality</p>
              <p className="text-2xl font-bold text-green-900">
                ${materialitySettings.performance_materiality.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-600 mb-1">Trivial Threshold</p>
              <p className="text-2xl font-bold text-orange-900">
                ${materialitySettings.trivial_threshold.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Areas Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {AUDIT_AREAS.map(area => {
          const stats = getAreaStats(area.value)
          return (
            <Card
              key={area.value}
              className={`cursor-pointer transition-all hover:shadow-lg ${ selectedArea === area.value ?'ring-2 ring-blue-500 shadow-lg' : ''
              }`}
              onClick={() => setSelectedArea(area.value)}
            >
              <CardContent className="p-4">
                <div className="text-center">
                  <div
                    className={`w-12 h-12 mx-auto mb-3 bg-${area.color}-100 rounded-xl flex items-center justify-center`}
                  >
                    <Activity className={`w-6 h-6 text-${area.color}-600`} />
                  </div>
                  <h3 className="font-semibold text-gray-100 mb-2">{area.label}</h3>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>{stats.total} procedures</p>
                    <p>{stats.completed} completed</p>
                    {stats.exceptions > 0 && (
                      <p className="text-red-600">{stats.exceptions} exceptions</p>
                    )}
                  </div>
                  <Progress value={stats.avg_completion} className="h-2 mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.avg_completion}% complete
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Selected Area Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{AUDIT_AREAS.find(a => a.value === selectedArea)?.label} - Audit Procedures</span>
            <Button size="sm" variant="outline">
              <FileText className="w-4 h-4 mr-1" />
              Generate Program
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getAreaProcedures(selectedArea).map(procedure => (
              <div
                key={procedure.id}
                className="border rounded-lg p-4 hover:bg-muted transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline">
                        {PROCEDURE_TYPES.find(t => t.value === procedure.procedure_type)?.label}
                      </Badge>
                      <Badge className={getStatusColor(procedure.status)}>
                        {procedure.status.replace('_', ' ')}
                      </Badge>
                      {procedure.exceptions_noted > 0 && (
                        <Badge className="bg-red-100 text-red-800">
                          {procedure.exceptions_noted} exceptions
                        </Badge>
                      )}
                    </div>

                    <h4 className="font-medium text-gray-100 mb-1">{procedure.description}</h4>

                    <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Assigned to:</span> {procedure.assigned_to}
                      </div>
                      <div>
                        <span className="font-medium">Sample size:</span>{' '}
                        {procedure.sample_size || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Materiality:</span> $
                        {procedure.materiality_threshold.toLocaleString()}
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium ink">Progress</span>
                        <span className="text-sm font-bold text-gray-100">
                          {procedure.completion_percentage}%
                        </span>
                      </div>
                      <Progress value={procedure.completion_percentage} className="h-2" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      <FileText className="w-3 h-3 mr-1" />
                      Working Paper
                    </Button>
                    <Button variant="outline" size="sm">
                      <Users className="w-3 h-3 mr-1" />
                      Assign
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {getAreaProcedures(selectedArea).length === 0 && (
              <div className="text-center py-8">
                <TestTube className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No procedures defined for this area</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create audit procedures to start testing
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Procedure Types Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Procedure Types Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROCEDURE_TYPES.map(type => (
              <div key={type.value} className="p-3 border rounded-lg">
                <h4 className="font-medium text-gray-100 mb-1">{type.label}</h4>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
