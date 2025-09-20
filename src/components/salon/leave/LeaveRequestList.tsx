import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Calendar, Clock, CheckCircle, XCircle, Eye, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { LeaveApprovalDrawer } from './LeaveApprovalDrawer'

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

interface LeaveRequestListProps {
  requests: any[]
  staff: any[]
  onApprove: (requestId: string, reason?: string) => void
  onReject: (requestId: string, reason?: string) => void
  loading?: boolean
}

export function LeaveRequestList({
  requests,
  staff,
  onApprove,
  onReject,
  loading
}: LeaveRequestListProps) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [approvalDrawerOpen, setApprovalDrawerOpen] = useState(false)

  // Filter requests
  const filteredRequests = requests.filter(request => {
    if (statusFilter !== 'all' && request.status !== statusFilter) return false
    // Add date filtering logic here if needed
    return true
  })

  // Get staff name by ID
  const getStaffName = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId)
    return staffMember?.entity_name || 'Unknown'
  }

  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: COLORS.bronze, text: COLORS.champagne }
      case 'approved':
        return { bg: COLORS.emerald, text: 'white' }
      case 'rejected':
        return { bg: COLORS.rose, text: 'white' }
      default:
        return { bg: COLORS.charcoal, text: COLORS.lightText }
    }
  }

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request)
    setApprovalDrawerOpen(true)
  }

  return (
    <>
      {/* Filters */}
      <div
        className="p-4 rounded-2xl mb-6"
        style={{ backgroundColor: COLORS.charcoal, border: `1px solid ${COLORS.black}` }}
      >
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              className="w-40 bg-transparent border"
              style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
            >
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="hera-select-content">
              <SelectItem value="all" className="hera-select-item">
                All Status
              </SelectItem>
              <SelectItem value="pending" className="hera-select-item">
                Pending
              </SelectItem>
              <SelectItem value="approved" className="hera-select-item">
                Approved
              </SelectItem>
              <SelectItem value="rejected" className="hera-select-item">
                Rejected
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger
              className="w-40 bg-transparent border"
              style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
            >
              <SelectValue placeholder="All Dates" />
            </SelectTrigger>
            <SelectContent className="hera-select-content">
              <SelectItem value="all" className="hera-select-item">
                All Dates
              </SelectItem>
              <SelectItem value="this-month" className="hera-select-item">
                This Month
              </SelectItem>
              <SelectItem value="next-month" className="hera-select-item">
                Next Month
              </SelectItem>
              <SelectItem value="last-month" className="hera-select-item">
                Last Month
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Requests Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: COLORS.charcoal, border: `1px solid ${COLORS.black}` }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: COLORS.black }}>
                <th
                  className="px-6 py-4 text-left text-xs uppercase tracking-wider"
                  style={{ color: COLORS.bronze }}
                >
                  Date Range
                </th>
                <th
                  className="px-6 py-4 text-left text-xs uppercase tracking-wider"
                  style={{ color: COLORS.bronze }}
                >
                  Staff
                </th>
                <th
                  className="px-6 py-4 text-left text-xs uppercase tracking-wider"
                  style={{ color: COLORS.bronze }}
                >
                  Type
                </th>
                <th
                  className="px-6 py-4 text-left text-xs uppercase tracking-wider"
                  style={{ color: COLORS.bronze }}
                >
                  Days
                </th>
                <th
                  className="px-6 py-4 text-left text-xs uppercase tracking-wider"
                  style={{ color: COLORS.bronze }}
                >
                  Status
                </th>
                <th
                  className="px-6 py-4 text-left text-xs uppercase tracking-wider"
                  style={{ color: COLORS.bronze }}
                >
                  Notes
                </th>
                <th
                  className="px-6 py-4 text-right text-xs uppercase tracking-wider"
                  style={{ color: COLORS.bronze }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mx-auto" />
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center opacity-70">
                    No leave requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map(request => {
                  const fromDate = request.metadata?.from ? new Date(request.metadata.from) : null
                  const toDate = request.metadata?.to ? new Date(request.metadata.to) : null
                  const statusColors = getStatusColor(request.status)

                  return (
                    <tr
                      key={request.id}
                      className="border-t hover:bg-gray-800/20 transition-colors"
                      style={{ borderColor: '#1f1f1f' }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="opacity-50" />
                          <span style={{ color: COLORS.champagne }}>
                            {fromDate && toDate && (
                              <>
                                {format(fromDate, 'MMM d')} - {format(toDate, 'MMM d, yyyy')}
                                {request.metadata?.half_day_start && (
                                  <Badge
                                    variant="outline"
                                    className="ml-2 text-xs"
                                    style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
                                  >
                                    ½ start
                                  </Badge>
                                )}
                                {request.metadata?.half_day_end && (
                                  <Badge
                                    variant="outline"
                                    className="ml-2 text-xs"
                                    style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
                                  >
                                    ½ end
                                  </Badge>
                                )}
                              </>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4" style={{ color: COLORS.champagne }}>
                        {getStaffName(request.source_entity_id)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
                        >
                          {request.metadata?.type || 'ANNUAL'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4" style={{ color: COLORS.champagne }}>
                        {request.metadata?.days || 0} days
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          style={{
                            backgroundColor: statusColors.bg,
                            color: statusColors.text,
                            border: 'none'
                          }}
                        >
                          {request.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-sm opacity-70 truncate">
                          {request.metadata?.notes || '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewRequest(request)}
                            style={{ color: COLORS.champagne }}
                          >
                            <Eye size={16} />
                          </Button>
                          {request.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onApprove(request.id)}
                                style={{ color: COLORS.emerald }}
                              >
                                <CheckCircle size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const reason = window.prompt('Rejection reason:')
                                  if (reason) onReject(request.id, reason)
                                }}
                                style={{ color: COLORS.rose }}
                              >
                                <XCircle size={16} />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conflicts section (optional) */}
      <div
        className="mt-6 p-4 rounded-2xl"
        style={{ backgroundColor: COLORS.charcoal, border: `1px solid ${COLORS.black}` }}
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle size={16} color={COLORS.bronze} />
          <h4 className="text-sm font-medium" style={{ color: COLORS.champagne }}>
            Potential Conflicts
          </h4>
        </div>
        <p className="text-sm opacity-70">No scheduling conflicts detected with appointments.</p>
      </div>

      {/* Approval Drawer */}
      {selectedRequest && (
        <LeaveApprovalDrawer
          open={approvalDrawerOpen}
          onClose={() => {
            setApprovalDrawerOpen(false)
            setSelectedRequest(null)
          }}
          request={selectedRequest}
          staff={staff}
          onApprove={onApprove}
          onReject={onReject}
        />
      )}
    </>
  )
}
