/**
 * HERA Jewelry - Exchange Panel Component
 */

'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface ExchangePanelProps {
  value: any
  onChange: (value: any) => void
}

export function ExchangePanel({ value, onChange }: ExchangePanelProps) {
  const updateField = (field: string, newValue: any) => {
    onChange({ ...value, [field]: newValue })
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Old Gold Exchange</h3>
        <div className="flex items-center space-x-2">
          <Label htmlFor="exchangeEnabled">Enable</Label>
          <Switch
            id="exchangeEnabled"
            checked={value.exchangeEnabled || false}
            onCheckedChange={checked => updateField('exchangeEnabled', checked)}
          />
        </div>
      </div>

      {value.exchangeEnabled && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exchangeWeight">Exchange Weight (g)</Label>
              <Input
                id="exchangeWeight"
                type="number"
                step="0.001"
                value={value.exchangeWeight || ''}
                onChange={e => updateField('exchangeWeight', parseFloat(e.target.value) || 0)}
                placeholder="0.000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exchangePurity">Exchange Purity (K)</Label>
              <Select
                value={value.exchangePurity?.toString() || ''}
                onValueChange={val => updateField('exchangePurity', parseInt(val))}
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

          <div className="space-y-2">
            <Label htmlFor="exchangeValue">Exchange Value (₹)</Label>
            <Input
              id="exchangeValue"
              type="number"
              step="0.01"
              value={value.exchangeValue || ''}
              onChange={e => updateField('exchangeValue', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
            {value.exchangeWeight > 0 && value.goldRate > 0 && value.exchangePurity > 0 && (
              <div className="text-xs text-gray-500">
                Calculated: ₹
                {(value.exchangeWeight * (value.exchangePurity / 24) * value.goldRate * 0.95) // 5% deduction typical
                  .toFixed(2)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
