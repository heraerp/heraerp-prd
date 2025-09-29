import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Info, AlertCircle } from 'lucide-react'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  rose: '#E8B4B8',
  lightText: '#E0E0E0'
}

interface PolicyModalProps {
  open: boolean
  onClose: () => void
  policy: any | null
}

export function PolicyModal({ open, onClose, policy }: PolicyModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    annual_entitlement: 21,
    carry_over_cap: 5,
    min_notice_days: 7,
    max_consecutive_days: 14,
    prorate_first_year: true,
    allow_negative_balance: false,
    accrual_rate: 1.75, // days per month
    description: ''
  })

  useEffect(() => {
    if (policy) {
      setFormData({
        name: policy.entity_name || '',
        annual_entitlement: policy.metadata?.annual_entitlement || 21,
        carry_over_cap: policy.metadata?.carry_over_cap || 5,
        min_notice_days: policy.metadata?.min_notice_days || 7,
        max_consecutive_days: policy.metadata?.max_consecutive_days || 14,
        prorate_first_year: policy.metadata?.prorate_first_year ?? true,
        allow_negative_balance: policy.metadata?.allow_negative_balance ?? false,
        accrual_rate: policy.metadata?.accrual_rate || 1.75,
        description: policy.metadata?.description || ''
      })
    }
  }, [policy])

  const handleSubmit = () => {
    // TODO: Implement save functionality
    console.log('Saving policy:', formData)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] flex flex-col"
        style={{
          backgroundColor: COLORS.charcoal,
          color: COLORS.champagne,
          border: `1px solid ${COLORS.black}`
        }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle style={{ color: COLORS.champagne }}>
            {policy ? 'Edit Leave Policy' : 'Create Leave Policy'}
          </DialogTitle>
          <DialogDescription style={{ color: COLORS.bronze }}>
            Configure leave policy settings that will apply to staff members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto flex-1 min-h-0">
          {/* Policy Name */}
          <div className="space-y-2">
            <Label htmlFor="name" style={{ color: COLORS.champagne }}>
              Policy Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Standard Annual Leave"
              className="bg-transparent border"
              style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
            />
          </div>

          {/* Annual Entitlement */}
          <div className="space-y-2">
            <Label htmlFor="entitlement" style={{ color: COLORS.champagne }}>
              Annual Entitlement (days)
            </Label>
            <Input
              id="entitlement"
              type="number"
              value={formData.annual_entitlement}
              onChange={e =>
                setFormData({ ...formData, annual_entitlement: parseInt(e.target.value) || 0 })
              }
              className="bg-transparent border"
              style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
            />
            <p className="text-xs">Number of days employees are entitled to per year</p>
          </div>

          {/* Carry Over Cap */}
          <div className="space-y-2">
            <Label htmlFor="carryover" style={{ color: COLORS.champagne }}>
              Carry-over Cap (days)
            </Label>
            <Input
              id="carryover"
              type="number"
              value={formData.carry_over_cap}
              onChange={e =>
                setFormData({ ...formData, carry_over_cap: parseInt(e.target.value) || 0 })
              }
              className="bg-transparent border"
              style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
            />
            <p className="text-xs">Maximum days that can be carried over to next year</p>
          </div>

          {/* Notice Period */}
          <div className="space-y-2">
            <Label htmlFor="notice" style={{ color: COLORS.champagne }}>
              Minimum Notice Period (days)
            </Label>
            <Input
              id="notice"
              type="number"
              value={formData.min_notice_days}
              onChange={e =>
                setFormData({ ...formData, min_notice_days: parseInt(e.target.value) || 0 })
              }
              className="bg-transparent border"
              style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
            />
          </div>

          {/* Max Consecutive Days */}
          <div className="space-y-2">
            <Label htmlFor="maxdays" style={{ color: COLORS.champagne }}>
              Maximum Consecutive Days
            </Label>
            <Input
              id="maxdays"
              type="number"
              value={formData.max_consecutive_days}
              onChange={e =>
                setFormData({ ...formData, max_consecutive_days: parseInt(e.target.value) || 0 })
              }
              className="bg-transparent border"
              style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
            />
          </div>

          {/* Accrual Rate */}
          <div className="space-y-2">
            <Label htmlFor="accrual" style={{ color: COLORS.champagne }}>
              Monthly Accrual Rate (days)
            </Label>
            <Input
              id="accrual"
              type="number"
              step="0.1"
              value={formData.accrual_rate}
              onChange={e =>
                setFormData({ ...formData, accrual_rate: parseFloat(e.target.value) || 0 })
              }
              className="bg-transparent border"
              style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
            />
            <p className="text-xs">
              Days accrued per month ({formData.accrual_rate * 12} days per year)
            </p>
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="prorate" style={{ color: COLORS.champagne }}>
                  Prorate First Year
                </Label>
                <p className="text-xs">
                  Calculate entitlement based on join date for new employees
                </p>
              </div>
              <Switch
                id="prorate"
                checked={formData.prorate_first_year}
                onCheckedChange={checked =>
                  setFormData({ ...formData, prorate_first_year: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="negative" style={{ color: COLORS.champagne }}>
                  Allow Negative Balance
                </Label>
                <p className="text-xs">Allow employees to take leave in advance</p>
              </div>
              <Switch
                id="negative"
                checked={formData.allow_negative_balance}
                onCheckedChange={checked =>
                  setFormData({ ...formData, allow_negative_balance: checked })
                }
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" style={{ color: COLORS.champagne }}>
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional policy details..."
              className="bg-transparent border resize-none"
              style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
              rows={3}
            />
          </div>

          {/* Info Box */}
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: '#141414', border: `1px solid ${COLORS.black}` }}
          >
            <div className="flex items-start gap-2">
              <Info size={16} color={COLORS.bronze} className="mt-0.5" />
              <div className="space-y-1 text-xs">
                <p>• Employees will accrue {formData.accrual_rate} days per month</p>
                <p>• Annual total: {(formData.accrual_rate * 12).toFixed(1)} days</p>
                <p>• Unused leave up to {formData.carry_over_cap} days will carry over</p>
                <p>• Requests must be submitted {formData.min_notice_days} days in advance</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4" style={{ borderColor: COLORS.black }}>
          <Button
            variant="outline"
            onClick={onClose}
            style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="border-0"
            style={{
              backgroundImage: `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
              color: COLORS.black
            }}
          >
            {policy ? 'Update Policy' : 'Create Policy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
