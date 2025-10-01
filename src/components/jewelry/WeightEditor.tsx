/**
 * HERA Jewelry - Weight Editor Component
 */

'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface WeightEditorProps {
  value: any
  onChange: (value: any) => void
}

export function WeightEditor({ value, onChange }: WeightEditorProps) {
  const updateField = (field: string, newValue: any) => {
    onChange({ ...value, [field]: newValue })
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold text-lg">Weights & Purity</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="grossWeight">Gross Weight (g)</Label>
          <Input
            id="grossWeight"
            type="number"
            step="0.001"
            value={value.grossWeight || ''}
            onChange={e => updateField('grossWeight', parseFloat(e.target.value) || 0)}
            placeholder="0.000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stoneWeight">Stone Weight (g)</Label>
          <Input
            id="stoneWeight"
            type="number"
            step="0.001"
            value={value.stoneWeight || ''}
            onChange={e => updateField('stoneWeight', parseFloat(e.target.value) || 0)}
            placeholder="0.000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="netWeight">Net Weight (g)</Label>
          <Input
            id="netWeight"
            type="number"
            step="0.001"
            value={value.netWeight || ''}
            onChange={e => updateField('netWeight', parseFloat(e.target.value) || 0)}
            placeholder="0.000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purityK">Purity (Karat)</Label>
          <Select
            value={value.purityK?.toString() || ''}
            onValueChange={val => updateField('purityK', parseInt(val))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select purity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10K</SelectItem>
              <SelectItem value="14">14K</SelectItem>
              <SelectItem value="18">18K</SelectItem>
              <SelectItem value="22">22K</SelectItem>
              <SelectItem value="24">24K</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="makingType">Making Charge Type</Label>
          <Select
            value={value.makingType || ''}
            onValueChange={val => updateField('makingType', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="per_gram">Per Gram</SelectItem>
              <SelectItem value="fixed">Fixed Amount</SelectItem>
              <SelectItem value="percent">Percentage</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="makingRate">Making Charge Rate</Label>
          <Input
            id="makingRate"
            type="number"
            step="0.01"
            value={value.makingRate || ''}
            onChange={e => updateField('makingRate', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
          />
        </div>
      </div>
    </div>
  )
}
