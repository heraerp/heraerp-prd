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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'
import type { WizardData } from '../BusinessSetupWizard'

interface DocumentNumberingStepProps {
  data: WizardData
  onChange: (data: Partial<WizardData>) => void
  onSave: (data: Partial<WizardData>) => Promise<void>
  validationErrors: string[]
  organizationId: string
}

const DEFAULT_SEQUENCES = [
  {
    document_type: 'GL_JOURNAL',
    prefix: 'GL-{YYYY}-',
    suffix: '',
    next_number: 1,
    min_length: 6,
    reset_frequency: 'YEARLY'
  },
  {
    document_type: 'AR_INVOICE',
    prefix: 'AR-{YYYY}-',
    suffix: '',
    next_number: 1,
    min_length: 6,
    reset_frequency: 'YEARLY'
  },
  {
    document_type: 'AP_INVOICE',
    prefix: 'AP-{YYYY}-',
    suffix: '',
    next_number: 1,
    min_length: 6,
    reset_frequency: 'YEARLY'
  },
  {
    document_type: 'PAYMENT',
    prefix: 'PAY-{YYYY}-',
    suffix: '',
    next_number: 1,
    min_length: 6,
    reset_frequency: 'YEARLY'
  }
]

export const DocumentNumberingStep: React.FC<DocumentNumberingStepProps> = ({
  data,
  onChange,
  onSave,
  validationErrors,
  organizationId
}) => {
  React.useEffect(() => {
    if (data.documentNumbering.sequences.length === 0) {
      onChange({
        documentNumbering: { sequences: DEFAULT_SEQUENCES }
      })
    }
  }, [])

  const updateSequence = (index: number, field: string, value: any) => {
    const sequences = [...data.documentNumbering.sequences]
    sequences[index] = { ...sequences[index], [field]: value }
    onChange({ documentNumbering: { sequences } })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {data.documentNumbering.sequences.map((seq, index) => (
          <Card key={seq.document_type}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base">
                <FileText className="h-4 w-4" />
                <span>{seq.document_type.replace('_', ' ')}</span>
                <Badge variant="outline" className="ml-auto">
                  {seq.prefix}
                  {seq.next_number.toString().padStart(seq.min_length, '0')}
                  {seq.suffix}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Prefix</Label>
                <Input
                  value={seq.prefix}
                  onChange={e => updateSequence(index, 'prefix', e.target.value)}
                  placeholder="GL-{YYYY}-"
                />
              </div>
              <div>
                <Label>Next Number</Label>
                <Input
                  type="number"
                  value={seq.next_number}
                  onChange={e => updateSequence(index, 'next_number', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Min Length</Label>
                <Input
                  type="number"
                  value={seq.min_length}
                  onChange={e => updateSequence(index, 'min_length', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Reset</Label>
                <Select
                  value={seq.reset_frequency}
                  onValueChange={value => updateSequence(index, 'reset_frequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="hera-select-content">
                    <SelectItem value="NEVER" className="hera-select-item">
                      Never
                    </SelectItem>
                    <SelectItem value="YEARLY" className="hera-select-item">
                      Yearly
                    </SelectItem>
                    <SelectItem value="MONTHLY" className="hera-select-item">
                      Monthly
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
