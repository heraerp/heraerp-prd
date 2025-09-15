'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Building, DollarSign, Target } from 'lucide-react'
import type { WizardData } from '../BusinessSetupWizard'

interface OrganizationalStructureStepProps {
  data: WizardData
  onChange: (data: Partial<WizardData>) => void
  onSave: (data: Partial<WizardData>) => Promise<void>
  validationErrors: string[]
  organizationId: string
}

const ENTITY_TYPES = [
  { value: 'branch', label: 'Branch', icon: Building, color: 'bg-blue-100 text-blue-800' },
  {
    value: 'cost_center',
    label: 'Cost Center',
    icon: DollarSign,
    color: 'bg-red-100 text-red-800'
  },
  {
    value: 'profit_center',
    label: 'Profit Center',
    icon: Target,
    color: 'bg-green-100 text-green-800'
  }
]

export const OrganizationalStructureStep: React.FC<OrganizationalStructureStepProps> = ({
  data,
  onChange,
  onSave,
  validationErrors,
  organizationId
}) => {
  const orgData = data.organizationalStructure

  React.useEffect(() => {
    // Initialize with HQ if empty
    if (orgData.org_units.length === 0) {
      onChange({
        organizationalStructure: {
          org_units: [
            {
              entity_code: 'HQ',
              entity_name: 'Head Office',
              entity_type: 'branch',
              allow_posting: true
            }
          ]
        }
      })
    }
  }, [])

  const updateUnit = (index: number, field: string, value: any) => {
    const units = [...orgData.org_units]
    units[index] = { ...units[index], [field]: value }
    onChange({ organizationalStructure: { org_units: units } })
  }

  const addUnit = () => {
    const units = [
      ...orgData.org_units,
      {
        entity_code: '',
        entity_name: '',
        entity_type: 'branch' as const,
        allow_posting: true
      }
    ]
    onChange({ organizationalStructure: { org_units: units } })
  }

  const removeUnit = (index: number) => {
    const units = orgData.org_units.filter((_, i) => i !== index)
    onChange({ organizationalStructure: { org_units: units } })
  }

  return (
    <div className="space-y-6">
      {orgData.org_units.map((unit, index) => {
        const entityType = ENTITY_TYPES.find(t => t.value === unit.entity_type)
        const Icon = entityType?.icon || Building

        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center space-x-2 text-base">
                <Icon className="h-4 w-4" />
                <span>{entityType?.label || 'Organizational Unit'}</span>
                {unit.allow_posting && (
                  <Badge variant="secondary" className="text-xs">
                    Posting Enabled
                  </Badge>
                )}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeUnit(index)}
                disabled={index === 0} // Don't allow removal of first unit (HQ)
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Entity Code</Label>
                <Input
                  value={unit.entity_code}
                  onChange={e => updateUnit(index, 'entity_code', e.target.value.toUpperCase())}
                  placeholder="HQ"
                />
              </div>
              <div>
                <Label>Entity Name</Label>
                <Input
                  value={unit.entity_name}
                  onChange={e => updateUnit(index, 'entity_name', e.target.value)}
                  placeholder="Head Office"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={unit.entity_type}
                  onValueChange={(value: any) => updateUnit(index, 'entity_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="hera-select-content">
                    {ENTITY_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value} className="hera-select-item">
                        <div className="flex items-center space-x-2">
                          <type.icon className="h-4 w-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={unit.allow_posting}
                  onCheckedChange={checked => updateUnit(index, 'allow_posting', checked)}
                />
                <Label>Allow Direct Posting</Label>
              </div>
            </CardContent>
          </Card>
        )
      })}

      <Button variant="outline" onClick={addUnit} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Organizational Unit
      </Button>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ENTITY_TYPES.map(type => {
          const count = orgData.org_units.filter(u => u.entity_type === type.value).length
          const Icon = type.icon

          return (
            <Card key={type.value}>
              <CardContent className="p-4 text-center">
                <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs text-muted-foreground">{type.label}s</div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
