'use client'

import React from 'react'
import { Calendar, DollarSign } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateGrantRound } from '@/hooks/use-programs'
import type { CreateGrantRoundRequest, ProgramListItem } from '@/types/crm-programs'

interface CreateGrantRoundModalProps {
  isOpen: boolean
  onClose: () => void
  program: ProgramListItem | null
}

export function CreateGrantRoundModal({ isOpen, onClose, program }: CreateGrantRoundModalProps) {
  const [formData, setFormData] = useState<CreateGrantRoundRequest>({
    round_code: '',
    window_open: '',
    window_close: '',
    budget: undefined,
    kpis: {}
  })

  const createGrantRound = useCreateGrantRound(program?.id || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!program) return

    await createGrantRound.mutateAsync(formData)

    onClose()
    // Reset form
    setFormData({
      round_code: '',
      window_open: '',
      window_close: '',
      budget: undefined,
      kpis: {}
    })
  }

  const generateRoundCode = () => {
    if (!program) return
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    const random = Math.random().toString(36).substring(2, 4).toUpperCase()
    setFormData(prev => ({
      ...prev,
      round_code: `${program.code}-R${year}${month}-${random}`
    }))
  }

  // Set default dates (open tomorrow, close in 30 days)
  const setDefaultDates = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const closeDate = new Date(tomorrow)
    closeDate.setDate(closeDate.getDate() + 30)

    setFormData(prev => ({
      ...prev,
      window_open: tomorrow.toISOString().split('T')[0],
      window_close: closeDate.toISOString().split('T')[0]
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-panel border-border max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold text-text-100">
            Create Grant Round
          </DialogTitle>
          <DialogDescription className="text-text-300">
            {program ? `Add a new grant round to ${program.title}` : 'Select a program first'}
          </DialogDescription>
        </DialogHeader>

        {program && (
          <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto px-1">
            {/* Round Code */}
            <div className="space-y-2">
              <Label htmlFor="round_code" className="text-text-200">
                Round Code
              </Label>
              <div className="flex gap-2">
                <Input
                  id="round_code"
                  value={formData.round_code}
                  onChange={e => setFormData(prev => ({ ...prev, round_code: e.target.value }))}
                  placeholder={`${program.code}-R202401`}
                  required
                  className="bg-panel-alt border-border text-text-100"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateRoundCode}
                  className="border-[rgb(0,166,166)] text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/10"
                >
                  Generate
                </Button>
              </div>
            </div>

            {/* Application Window */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-text-300">
                <Calendar className="h-4 w-4" />
                <span>Application Window</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="window_open" className="text-text-200">
                    Opens
                  </Label>
                  <Input
                    id="window_open"
                    type="date"
                    value={formData.window_open}
                    onChange={e => setFormData(prev => ({ ...prev, window_open: e.target.value }))}
                    required
                    className="bg-panel-alt border-border text-text-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="window_close" className="text-text-200">
                    Closes
                  </Label>
                  <Input
                    id="window_close"
                    type="date"
                    value={formData.window_close}
                    onChange={e => setFormData(prev => ({ ...prev, window_close: e.target.value }))}
                    min={formData.window_open}
                    required
                    className="bg-panel-alt border-border text-text-100"
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={setDefaultDates}
                className="text-xs text-text-300 hover:text-text-100"
              >
                Set default 30-day window
              </Button>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <Label htmlFor="budget" className="text-text-200">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Round Budget</span>
                </div>
              </Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    budget: e.target.value ? parseFloat(e.target.value) : undefined
                  }))
                }
                placeholder={program.budget ? `Max: ${program.budget}` : '0'}
                min="0"
                max={program.budget}
                step="1000"
                className="bg-panel-alt border-border text-text-100"
              />
              {program.budget && (
                <p className="text-xs text-text-300">
                  Program budget: ${program.budget.toLocaleString()}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-[rgb(0,166,166)] text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createGrantRound.isPending ||
                  !formData.round_code ||
                  !formData.window_open ||
                  !formData.window_close
                }
                className="bg-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/90 text-white"
              >
                {createGrantRound.isPending ? 'Creating...' : 'Create Round'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
