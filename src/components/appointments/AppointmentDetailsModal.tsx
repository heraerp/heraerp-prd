'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  FileText,
  Brain,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit,
  Save,
  X,
  MessageSquare,
  Star,
  TrendingUp,
  Users,
  Settings
} from 'lucide-react'
import {
  APPOINTMENT_WORKFLOW,
  APPOINTMENT_SMART_CODES
} from '@/lib/appointments/universal-appointment-system'

// HERA Universal Appointment Details Modal
// Smart Code: HERA.UNIV.CRM.APT.MODAL.V1

interface AppointmentDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: any | null
  industry: 'jewelry' | 'healthcare' | 'restaurant' | 'professional'
  onStatusUpdate?: (appointmentId: string, newStatus: string, notes?: string) => void
  onAppointmentUpdate?: (appointmentId: string, updates: Record<string, any>) => void
}

// Industry-specific styling and content
const INDUSTRY_CONFIG = {
  jewelry: {
    icon: '💎',
    color: '#8B5CF6',
    gradient: 'from-purple-500 to-pink-500',
    statusActions: ['Confirm Design', 'Start Appraisal', 'Complete Service', 'Schedule Follow-up'],
    customFields: ['Budget Range', 'Style Preference', 'Occasion', 'Metal Preference', 'Stone Type']
  },
  healthcare: {
    icon: '🏥',
    color: '#059669',
    gradient: 'from-emerald-500 to-blue-500',
    statusActions: [
      'Check Patient In',
      'Start Consultation',
      'Complete Treatment',
      'Schedule Follow-up'
    ],
    customFields: [
      'Insurance Info',
      'Medical History',
      'Allergies',
      'Medications',
      'Emergency Contact'
    ]
  },
  restaurant: {
    icon: '🍽️',
    color: '#DC2626',
    gradient: 'from-red-500 to-orange-500',
    statusActions: ['Confirm Reservation', 'Seat Party', 'Order Taken', 'Service Complete'],
    customFields: [
      'Party Size',
      'Special Occasion',
      'Dietary Restrictions',
      'Seating Preference',
      'Special Requests'
    ]
  },
  professional: {
    icon: '💼',
    color: '#1F2937',
    gradient: 'from-gray-700 to-gray-900',
    statusActions: ['Confirm Meeting', 'Client Arrived', 'Meeting Started', 'Meeting Complete'],
    customFields: [
      'Meeting Type',
      'Agenda Items',
      'Required Documents',
      'Billing Rate',
      'Project Code'
    ]
  }
}

const STATUS_CONFIG = {
  [APPOINTMENT_WORKFLOW.DRAFT]: {
    color: 'bg-muted text-gray-200',
    icon: <Pencil className="w-4 h-4" />,
    label: 'Draft'
  },
  [APPOINTMENT_WORKFLOW.SCHEDULED]: {
    color: 'bg-blue-100 text-blue-800',
    icon: <Calendar className="w-4 h-4" />,
    label: 'Scheduled'
  },
  [APPOINTMENT_WORKFLOW.CONFIRMED]: {
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircle className="w-4 h-4" />,
    label: 'Confirmed'
  },
  [APPOINTMENT_WORKFLOW.REMINDED]: {
    color: 'bg-yellow-100 text-yellow-800',
    icon: <MessageSquare className="w-4 h-4" />,
    label: 'Reminded'
  },
  [APPOINTMENT_WORKFLOW.CHECKED_IN]: {
    color: 'bg-purple-100 text-purple-800',
    icon: <Users className="w-4 h-4" />,
    label: 'Checked In'
  },
  [APPOINTMENT_WORKFLOW.IN_PROGRESS]: {
    color: 'bg-orange-100 text-orange-800',
    icon: <Settings className="w-4 h-4" />,
    label: 'In Progress'
  },
  [APPOINTMENT_WORKFLOW.COMPLETED]: {
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircle className="w-4 h-4" />,
    label: 'Completed'
  },
  [APPOINTMENT_WORKFLOW.CANCELLED]: {
    color: 'bg-red-100 text-red-800',
    icon: <XCircle className="w-4 h-4" />,
    label: 'Cancelled'
  },
  [APPOINTMENT_WORKFLOW.NO_SHOW]: {
    color: 'bg-muted text-gray-200',
    icon: <AlertTriangle className="w-4 h-4" />,
    label: 'No Show'
  }
}

export function AppointmentDetailsModal({
  isOpen,
  onClose,
  appointment,
  industry,
  onStatusUpdate,
  onAppointmentUpdate
}: AppointmentDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedNotes, setEditedNotes] = useState('')
  const [statusNotes, setStatusNotes] = useState('')
  const [showAIInsights, setShowAIInsights] = useState(true)

  if (!appointment) return null

  const config = INDUSTRY_CONFIG[industry]
  const statusConfig = STATUS_CONFIG[appointment.extendedProps.status as keyof typeof STATUS_CONFIG]
  const props = appointment.extendedProps

  // Format date and time
  const appointmentDate = new Date(appointment.start)
  const endDate = new Date(appointment.end)
  const duration = Math.round((endDate.getTime() - appointmentDate.getTime()) / (1000 * 60))

  const handleStatusUpdate = (newStatus: string) => {
    if (onStatusUpdate) {
      onStatusUpdate(props.appointmentId, newStatus, statusNotes)
    }
    setStatusNotes('')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = [
      APPOINTMENT_WORKFLOW.DRAFT,
      APPOINTMENT_WORKFLOW.SCHEDULED,
      APPOINTMENT_WORKFLOW.CONFIRMED,
      APPOINTMENT_WORKFLOW.REMINDED,
      APPOINTMENT_WORKFLOW.CHECKED_IN,
      APPOINTMENT_WORKFLOW.IN_PROGRESS,
      APPOINTMENT_WORKFLOW.COMPLETED
    ]

    const currentIndex = statusFlow.indexOf(currentStatus)
    return currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null
  }

  const renderAIInsights = () => {
    if (!props.aiInsights || !showAIInsights) return null

    return (
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Confidence Score */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">AI Confidence</span>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${props.aiInsights.confidence_score}%` }}
                />
              </div>
              <span className="text-sm font-semibold">{props.aiInsights.confidence_score}%</span>
            </div>
          </div>

          {/* Customer Segment */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Customer Segment</span>
            <Badge
              className={`
              ${props.aiInsights.customer_segment === 'premium' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${props.aiInsights.customer_segment === 'standard' ? 'bg-blue-100 text-blue-800' : ''}
              ${props.aiInsights.customer_segment === 'new' ? 'bg-green-100 text-green-800' : ''}
            `}
            >
              {props.aiInsights.customer_segment}
            </Badge>
          </div>

          {/* No-show Risk */}
          {props.aiInsights.no_show_risk && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">No-show Risk</span>
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className={`w-4 h-4 ${
                    props.aiInsights.no_show_risk > 25
                      ? 'text-red-500'
                      : props.aiInsights.no_show_risk > 15
                        ? 'text-yellow-500'
                        : 'text-green-500'
                  }`}
                />
                <span className="text-sm font-semibold">{props.aiInsights.no_show_risk}%</span>
              </div>
            </div>
          )}

          {/* Upsell Opportunity */}
          {props.aiInsights.upsell_opportunity && (
            <div className="p-3 bg-background rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">Upsell Opportunity</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Based on customer profile, consider offering premium services or add-ons.
              </p>
            </div>
          )}

          {/* Predicted Duration */}
          {props.aiInsights.predicted_duration && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Predicted Duration</span>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{props.aiInsights.predicted_duration} min</span>
                {props.aiInsights.predicted_duration !== duration && (
                  <Badge variant="outline" className="text-xs">
                    {props.aiInsights.predicted_duration > duration ? '+' : ''}
                    {props.aiInsights.predicted_duration - duration}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <div className="text-xl font-bold">
                {props.customerName} - {props.serviceName}
              </div>
              <div className="text-sm text-muted-foreground font-normal">
                {appointmentDate.toLocaleDateString()} at{' '}
                {appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="ml-auto">
              <Badge className={statusConfig.color}>
                {statusConfig.icon}
                <span className="ml-1">{statusConfig.label}</span>
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" style={{ color: config.color }} />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="font-semibold">{props.customerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Customer ID</label>
                    <p className="text-sm font-mono">{props.customerId}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{props.customerPhone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{props.customerEmail || 'Not provided'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appointment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" style={{ color: config.color }} />
                  Appointment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Service</label>
                    <p className="font-semibold">{props.serviceName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Duration</label>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{duration} minutes</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
                    <p>
                      {appointmentDate.toLocaleDateString()} at{' '}
                      {appointmentDate.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Amount</label>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">
                        {formatCurrency(props.totalAmount || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Smart Code</label>
                  <p className="text-xs font-mono bg-muted px-2 py-1 rounded">{props.smartCode}</p>
                </div>

                {props.specialRequests && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Special Requests
                    </label>
                    <p className="text-sm bg-yellow-50 border border-yellow-200 rounded p-2">
                      {props.specialRequests}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Staff Assignment */}
            {props.staffAssigned && props.staffAssigned.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" style={{ color: config.color }} />
                    Assigned Staff
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {props.staffAssigned.map((staff: string) => (
                      <Badge key={staff} variant="outline">
                        {staff.replace('_', ' ').toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Next Status */}
                {getNextStatus(props.status) && (
                  <Button
                    onClick={() => handleStatusUpdate(getNextStatus(props.status)!)}
                    className="w-full"
                    style={{
                      background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}CC 100%)`
                    }}
                  >
                    {config.statusActions[
                      Object.values(APPOINTMENT_WORKFLOW).indexOf(getNextStatus(props.status)!)
                    ] || 'Next Step'}
                  </Button>
                )}

                {/* Cancel/Reschedule */}
                {props.status !== APPOINTMENT_WORKFLOW.COMPLETED &&
                  props.status !== APPOINTMENT_WORKFLOW.CANCELLED && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusUpdate(APPOINTMENT_WORKFLOW.CANCELLED)}
                      >
                        Cancel
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        Reschedule
                      </Button>
                    </div>
                  )}

                {/* Status Notes */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Add Notes</label>
                  <Textarea
                    placeholder="Status update notes..."
                    value={statusNotes}
                    onChange={e => setStatusNotes(e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* AI Insights */}
            {renderAIInsights()}

            {/* Appointment History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-3 h-3" />
                    <span>Created: {new Date(appointment.start).toLocaleDateString()}</span>
                  </div>
                  {props.status === APPOINTMENT_WORKFLOW.CONFIRMED && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      <span>Confirmed by customer</span>
                    </div>
                  )}
                  {props.status === APPOINTMENT_WORKFLOW.COMPLETED && (
                    <div className="flex items-center gap-2 text-primary">
                      <Star className="w-3 h-3" />
                      <span>Service completed successfully</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAIInsights(!showAIInsights)}>
              <Brain className="w-4 h-4 mr-1" />
              {showAIInsights ? 'Hide' : 'Show'} AI
            </Button>
            <span className="text-xs text-muted-foreground">
              Appointment ID: {props.appointmentId}
            </span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              className={`bg-gradient-to-r ${config.gradient} text-foreground`}
            >
              <Pencil className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AppointmentDetailsModal
