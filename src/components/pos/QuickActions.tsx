// ================================================================================
// HERA POS QUICK ACTIONS
// Smart Code: HERA.UI.POS.QUICK_ACTIONS.v1
// Quick discount and tip actions
// ================================================================================

'use client'

import { useState } from 'react'
import { Percent, Gift, Heart, DollarSign } from 'lucide-react'
import { useQuickActions, useCartStore } from '@/lib/hooks/usePos'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export function QuickActions() {
  const { applyPercentageDiscount, applyFixedDiscount, addQuickTip } = useQuickActions()
  const hasDiscount = useCartStore(state => state.lines.some(l => l.kind === 'discount'))
  const hasTip = useCartStore(state => state.lines.some(l => l.kind === 'tip'))
  
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [discountReason, setDiscountReason] = useState('')
  const [isDiscountOpen, setIsDiscountOpen] = useState(false)

  const handleApplyDiscount = () => {
    const value = parseFloat(discountValue)
    if (isNaN(value) || value <= 0) return

    if (discountType === 'percentage') {
      applyPercentageDiscount(value, discountReason)
    } else {
      applyFixedDiscount(value, discountReason)
    }

    // Reset and close
    setDiscountValue('')
    setDiscountReason('')
    setIsDiscountOpen(false)
  }

  const tipOptions = [
    { percentage: 10, label: '10%' },
    { percentage: 15, label: '15%' },
    { percentage: 20, label: '20%' },
  ]

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Discount Button */}
        <Dialog open={isDiscountOpen} onOpenChange={setIsDiscountOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              disabled={hasDiscount}
            >
              <Percent className="h-6 w-6 text-green-600" />
              <span className="text-sm">
                {hasDiscount ? 'Discount Applied' : 'Apply Discount'}
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Apply Discount</DialogTitle>
              <DialogDescription>
                Add a percentage or fixed amount discount to the order
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <RadioGroup 
                value={discountType} 
                onValueChange={(value: 'percentage' | 'fixed') => setDiscountType(value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="percentage" id="percentage" />
                  <Label htmlFor="percentage">Percentage discount (%)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="fixed" />
                  <Label htmlFor="fixed">Fixed amount (AED)</Label>
                </div>
              </RadioGroup>

              <div className="space-y-2">
                <Label htmlFor="value">
                  {discountType === 'percentage' ? 'Percentage' : 'Amount'}
                </Label>
                <Input
                  id="value"
                  type="number"
                  placeholder={discountType === 'percentage' ? "15" : "50"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  min="0"
                  step={discountType === 'percentage' ? "5" : "10"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Input
                  id="reason"
                  placeholder="e.g., First-time customer"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDiscountOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleApplyDiscount}
                disabled={!discountValue || parseFloat(discountValue) <= 0}
              >
                Apply Discount
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quick Discount Presets */}
        <Button 
          variant="outline" 
          className="h-20 flex flex-col gap-2"
          onClick={() => applyPercentageDiscount(10, 'Quick 10% discount')}
          disabled={hasDiscount}
        >
          <Gift className="h-6 w-6 text-green-600" />
          <span className="text-sm">10% Off</span>
        </Button>

        {/* Tip Options */}
        {tipOptions.map(({ percentage, label }) => (
          <Button
            key={percentage}
            variant={hasTip ? "secondary" : "outline"}
            className="h-20 flex flex-col gap-2"
            onClick={() => addQuickTip(percentage)}
          >
            <Heart className="h-6 w-6 text-blue-600" />
            <span className="text-sm">{label} Tip</span>
          </Button>
        ))}

        {/* Custom Tip */}
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
            >
              <DollarSign className="h-6 w-6 text-blue-600" />
              <span className="text-sm">Custom Tip</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Custom Tip</DialogTitle>
              <DialogDescription>
                Enter a custom tip amount
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tip-amount">Tip Amount (AED)</Label>
                <Input
                  id="tip-amount"
                  type="number"
                  placeholder="50"
                  min="0"
                  step="10"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {}}>
                Cancel
              </Button>
              <Button onClick={() => {}}>
                Add Tip
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  )
}