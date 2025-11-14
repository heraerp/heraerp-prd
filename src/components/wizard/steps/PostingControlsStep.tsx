'use client'

import React, { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Lock, Unlock, Calendar } from 'lucide-react'
import type { WizardData } from '../BusinessSetupWizard'

interface PostingControlsStepProps {
  data: WizardData
  onChange: (data: Partial<WizardData>) => void
  onSave: (data: Partial<WizardData>) => Promise<void>
  validationErrors: string[]
  organizationId: string
}

export const PostingControlsStep: React.FC<PostingControlsStepProps> = ({
  data,
  onChange,
  onSave,
  validationErrors,
  organizationId
}) => {
  const controlsData = data.postingControls

  // Generate sample periods based on fiscal year configuration
  const generateSamplePeriods = () => {
    const currentYear = new Date().getFullYear()
    const startMonth = data.fiscalYear.fiscal_year_start_month
    const periods = []

    for (let i = 0; i < data.fiscalYear.number_of_periods; i++) {
      const periodMonth = ((startMonth - 1 + i) % 12) + 1
      const periodYear = currentYear + Math.floor((startMonth - 1 + i) / 12)

      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ]

      periods.push({
        period_id: `P${(i + 1).toString().padStart(2, '0')}`,
        period_name: `${monthNames[periodMonth - 1]} ${periodYear}`,
        gl_status: i < 3 ? ('CLOSED' as const) : ('OPEN' as const),
        ap_status: i < 3 ? ('CLOSED' as const) : ('OPEN' as const),
        ar_status: i < 3 ? ('CLOSED' as const) : ('OPEN' as const),
        inventory_status: i < 3 ? ('CLOSED' as const) : ('OPEN' as const)
      })
    }

    return periods
  }

  // Initialize periods if not set
  React.useEffect(() => {
    if (controlsData.period_controls.length === 0) {
      const samplePeriods = generateSamplePeriods()
      onChange({
        postingControls: {
          period_controls: samplePeriods
        }
      })
    }
  }, [])

  const togglePeriodStatus = (
    periodIndex: number,
    module: 'gl_status' | 'ap_status' | 'ar_status' | 'inventory_status'
  ) => {
    const updatedControls = [...controlsData.period_controls]
    updatedControls[periodIndex] = {
      ...updatedControls[periodIndex],
      [module]: updatedControls[periodIndex][module] === 'OPEN' ? 'CLOSED' : 'OPEN'
    }

    onChange({
      postingControls: {
        period_controls: updatedControls
      }
    })
  }

  const bulkSetStatus = (
    module: 'gl_status' | 'ap_status' | 'ar_status' | 'inventory_status',
    status: 'OPEN' | 'CLOSED'
  ) => {
    const updatedControls = controlsData.period_controls.map(period => ({
      ...period,
      [module]: status
    }))

    onChange({
      postingControls: {
        period_controls: updatedControls
      }
    })
  }

  const handleSave = async () => {
    await onSave({
      postingControls: controlsData
    })
  }

  const modules = [
    {
      key: 'gl_status' as const,
      name: 'General Ledger',
      icon: '📊',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      key: 'ap_status' as const,
      name: 'Accounts Payable',
      icon: '📄',
      color: 'bg-red-100 text-red-800'
    },
    {
      key: 'ar_status' as const,
      name: 'Accounts Receivable',
      icon: '💰',
      color: 'bg-green-100 text-green-800'
    },
    {
      key: 'inventory_status' as const,
      name: 'Inventory',
      icon: '📦',
      color: 'bg-purple-100 text-purple-800'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Module Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map(module => {
          const openCount = controlsData.period_controls.filter(
            p => p[module.key] === 'OPEN'
          ).length
          const closedCount = controlsData.period_controls.length - openCount

          return (
            <Card key={module.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <span>{module.icon}</span>
                  <span>{module.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center space-x-1">
                    <Unlock className="h-3 w-3" />
                    <span>{openCount} Open</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Lock className="h-3 w-3" />
                    <span>{closedCount} Closed</span>
                  </span>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => bulkSetStatus(module.key, 'OPEN')}
                  >
                    Open All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => bulkSetStatus(module.key, 'CLOSED')}
                  >
                    Close All
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Period Control Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Period Posting Controls</span>
          </CardTitle>
          <CardDescription>Control which periods allow posting for each module</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Period</th>
                  {modules.map(module => (
                    <th key={module.key} className="text-center p-3 font-medium">
                      <div className="flex flex-col items-center space-y-1">
                        <span>{module.icon}</span>
                        <span className="text-xs">{module.name.split(' ')[0]}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {controlsData.period_controls.map((period, index) => (
                  <tr key={period.period_id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{period.period_id}</Badge>
                        <span>{period.period_name}</span>
                      </div>
                    </td>
                    {modules.map(module => (
                      <td key={module.key} className="p-3 text-center">
                        <div className="flex flex-col items-center space-y-2">
                          <Switch
                            checked={period[module.key] === 'OPEN'}
                            onCheckedChange={() => togglePeriodStatus(index, module.key)}
                            size="sm"
                          />
                          <Badge
                            variant={period[module.key] === 'OPEN' ? 'default' : 'secondary'}
                            className={`text-xs ${
                              period[module.key] === 'OPEN'
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-muted text-gray-200 hover:bg-gray-700'
                            }`}
                          >
                            {period[module.key] === 'OPEN' ? (
                              <>
                                <Unlock className="h-3 w-3 mr-1" />
                                Open
                              </>
                            ) : (
                              <>
                                <Lock className="h-3 w-3 mr-1" />
                                Closed
                              </>
                            )}
                          </Badge>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {modules.map(module => {
          const openCount = controlsData.period_controls.filter(
            p => p[module.key] === 'OPEN'
          ).length
          const percentage = Math.round((openCount / controlsData.period_controls.length) * 100)

          return (
            <Card key={`${module.key}-summary`}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold mb-2">{percentage}%</div>
                <div className="text-xs text-muted-foreground mb-1">{module.name}</div>
                <div className="text-xs">
                  {openCount} of {controlsData.period_controls.length} periods open
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Business Rules Preview */}
      <Card className="bg-blue-50 dark:bg-blue-950/30">
        <CardHeader>
          <CardTitle className="text-sm">Generated UCR Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs font-mono space-y-1">
            <div>
              Period Controls: HERA.{data.organizationBasics.industry_classification}
              .UCR.CONFIG.POSTING_PERIODS.V1
            </div>
            <div>
              GL Controls: HERA.{data.organizationBasics.industry_classification}
              .UCR.CONTROL.GL_POSTING.V1
            </div>
            <div>
              AP Controls: HERA.{data.organizationBasics.industry_classification}
              .UCR.CONTROL.AP_POSTING.V1
            </div>
            <div>
              AR Controls: HERA.{data.organizationBasics.industry_classification}
              .UCR.CONTROL.AR_POSTING.V1
            </div>
            <div>
              Inventory Controls: HERA.{data.organizationBasics.industry_classification}
              .UCR.CONTROL.INV_POSTING.V1
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
