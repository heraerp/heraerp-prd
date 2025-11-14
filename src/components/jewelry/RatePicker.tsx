/**
 * HERA Jewelry - Rate Picker Component
 */

'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface RatePickerProps {
  value: any
  onChange: (value: any) => void
}

export function RatePicker({ value, onChange }: RatePickerProps) {
  const updateField = (field: string, newValue: any) => {
    onChange({ ...value, [field]: newValue })
  }

  const refreshRate = async () => {
    // In a real implementation, this would fetch live rates
    const mockRate = 6200 + (Math.random() - 0.5) * 200 // Simulate market fluctuation
    updateField('goldRate', Math.round(mockRate * 100) / 100)
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold text-lg">Rates & Pricing</h3>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="goldRate">Gold Rate (per gram)</Label>
          <div className="flex space-x-2">
            <Input
              id="goldRate"
              type="number"
              step="0.01"
              value={value.goldRate || ''}
              onChange={e => updateField('goldRate', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
            <Button variant="outline" size="sm" onClick={refreshRate}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          {value.goldRate > 0 && (
            <p className="text-xs text-gray-500">Current rate: ₹{value.goldRate.toFixed(2)}/gram</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="stoneValue">Stone Value (₹)</Label>
          <Input
            id="stoneValue"
            type="number"
            step="0.01"
            value={value.stoneValue || ''}
            onChange={e => updateField('stoneValue', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="gstSlab">GST Slab (%)</Label>
            <Input
              id="gstSlab"
              type="number"
              value={value.gstSlab || ''}
              onChange={e => updateField('gstSlab', parseInt(e.target.value) || 0)}
              placeholder="3"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gstMode">GST Mode</Label>
            <Input
              id="gstMode"
              value={value.gstMode || 'CGST_SGST'}
              onChange={e => updateField('gstMode', e.target.value)}
              placeholder="CGST_SGST"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
