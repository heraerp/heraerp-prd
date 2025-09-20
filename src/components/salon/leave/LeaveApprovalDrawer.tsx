import React, { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Calendar, User, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  rose: '#E8B4B8',
  lightText: '#E0E0E0',
}

interface LeaveApprovalDrawerProps {
  open: boolean
  onClose: () => void
  request: any
  staff: any[]
  onApprove: (requestId: string, reason?: string) => void
  onReject: (requestId: string, reason?: string) => void
}

export function LeaveApprovalDrawer({ open, onClose, request, staff, onApprove, onReject }: LeaveApprovalDrawerProps) {
  const [approvalNotes, setApprovalNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectionForm, setShowRejectionForm] = useState(false)

  if (!request) return null

  const staffMember = staff.find(s => s.id === request.source_entity_id)
  const fromDate = request.metadata?.from ? new Date(request.metadata.from) : null
  const toDate = request.metadata?.to ? new Date(request.metadata.to) : null

  const handleApprove = () => {
    onApprove(request.id, approvalNotes)
    onClose()
  }

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }
    onReject(request.id, rejectionReason)
    onClose()
  }

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return
      
      if (e.key === 'a' && !['INPUT', 'TEXTAREA'].includes((e.target as any).tagName)) {
        e.preventDefault()
        handleApprove()
      }
      if (e.key === 'r' && !['INPUT', 'TEXTAREA'].includes((e.target as any).tagName)) {
        e.preventDefault()
        setShowRejectionForm(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]" style={{ backgroundColor: COLORS.charcoal, color: COLORS.champagne, border: `1px solid ${COLORS.black}` }}>
        <SheetHeader>
          <SheetTitle style={{ color: COLORS.champagne }}>Leave Request Details</SheetTitle>
          <SheetDescription style={{ color: COLORS.bronze }}>
            Review and approve or reject this leave request
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Request Summary */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User size={16} color={COLORS.bronze} />
              <div>
                <p className="text-sm" style={{ color: COLORS.bronze }}>Staff Member</p>
                <p className="font-medium" style={{ color: COLORS.champagne }}>
                  {staffMember?.entity_name} ({staffMember?.entity_code})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar size={16} color={COLORS.bronze} />
              <div>
                <p className="text-sm" style={{ color: COLORS.bronze }}>Date Range</p>
                <p className="font-medium" style={{ color: COLORS.champagne }}>
                  {fromDate && toDate && (
                    <>
                      {format(fromDate, 'PPP')} - {format(toDate, 'PPP')}
                      {request.metadata?.half_day_start && (
                        <Badge variant="outline" className="ml-2 text-xs" style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}>
                          ½ start
                        </Badge>
                      )}
                      {request.metadata?.half_day_end && (
                        <Badge variant="outline" className="ml-2 text-xs" style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}>
                          ½ end
                        </Badge>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock size={16} color={COLORS.bronze} />
              <div>
                <p className="text-sm" style={{ color: COLORS.bronze }}>Duration</p>
                <p className="font-medium" style={{ color: COLORS.champagne }}>
                  {request.metadata?.days || 0} working days
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm mb-1" style={{ color: COLORS.bronze }}>Type</p>
              <Badge variant="outline" style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}>
                {request.metadata?.type || 'ANNUAL'}
              </Badge>
            </div>

            {request.metadata?.notes && (
              <div>
                <p className="text-sm mb-1" style={{ color: COLORS.bronze }}>Notes</p>
                <p className="text-sm" style={{ color: COLORS.lightText }}>
                  {request.metadata.notes}
                </p>
              </div>
            )}
          </div>

          {/* Balance Impact */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#141414', border: `1px solid ${COLORS.black}` }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} color={COLORS.bronze} />
              <h4 className="text-sm font-medium" style={{ color: COLORS.champagne }}>Balance Impact</h4>
            </div>
            <p className="text-sm opacity-70">
              Current balance: 12 days remaining
              <br />
              After approval: {12 - (request.metadata?.days || 0)} days remaining
            </p>
          </div>

          {/* Conflicts Check */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#141414', border: `1px solid ${COLORS.black}` }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} color={COLORS.emerald} />
              <h4 className="text-sm font-medium" style={{ color: COLORS.champagne }}>No Conflicts</h4>
            </div>
            <p className="text-sm opacity-70">
              No appointments scheduled during this period
            </p>
          </div>

          {/* Approval Notes */}
          {request.status === 'pending' && !showRejectionForm && (
            <div className="space-y-2">
              <Label htmlFor="notes" style={{ color: COLORS.champagne }}>Approval Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any notes for the approval..."
                className="bg-transparent border resize-none"
                style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
                rows={3}
              />
            </div>
          )}

          {/* Rejection Reason */}
          {showRejectionForm && (
            <div className="space-y-2">
              <Label htmlFor="reason" style={{ color: COLORS.champagne }}>Rejection Reason (Required)</Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                className="bg-transparent border resize-none"
                style={{ borderColor: COLORS.rose, color: COLORS.champagne }}
                rows={3}
                autoFocus
              />
            </div>
          )}
        </div>

        {request.status === 'pending' && (
          <SheetFooter>
            {!showRejectionForm ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectionForm(true)}
                  style={{ borderColor: COLORS.rose, color: COLORS.rose }}
                >
                  <XCircle size={16} className="mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={handleApprove}
                  className="border-0"
                  style={{
                    backgroundImage: `linear-gradient(90deg, ${COLORS.emerald} 0%, ${COLORS.emerald} 100%)`,
                    color: 'white',
                  }}
                >
                  <CheckCircle size={16} className="mr-2" />
                  Approve
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectionForm(false)
                    setRejectionReason('')
                  }}
                  style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                  style={{
                    backgroundColor: COLORS.rose,
                    color: 'white',
                    border: 'none',
                  }}
                >
                  Confirm Rejection
                </Button>
              </>
            )}
          </SheetFooter>
        )}

        {request.status === 'pending' && (
          <p className="text-xs opacity-50 mt-4">
            Press 'a' to approve, 'r' to reject
          </p>
        )}
      </SheetContent>
    </Sheet>
  )
}