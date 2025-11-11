/**
 * HERA Universal Calendar Data Transformers
 * Smart Code: HERA.LIB.CALENDAR.TRANSFORMERS.UNIVERSAL.v1
 *
 * Transforms HERA Sacred Six data into universal calendar format
 * Handles industry-specific mappings and formatting
 *
 * Sacred Six Mappings:
 * - Appointments → universal_transactions (transaction_type: 'appointment')
 * - Resources → core_entities (entity_type: 'stylist'|'doctor'|'consultant'|'operator')
 * - Clients → core_entities (entity_type: 'customer'|'patient'|'client')
 * - Services → core_entities (entity_type: 'service'|'treatment'|'session_type')
 */

import React from 'react'
import {
  Scissors,
  Palette,
  Zap,
  Crown,
  Sparkles,
  Stethoscope,
  UserCheck,
  Settings,
  Bell,
  Briefcase,
  CheckSquare,
  GraduationCap,
  Users,
  Search,
  Wrench
} from 'lucide-react'

// Business type configurations (from HeraDnaUniversalResourceCalendar)
const BUSINESS_CONFIGS = {
  salon: {
    appointmentTypes: [
      { id: 'cut', name: 'Cut & Style', color: '#3B82F6', icon: Scissors },
      { id: 'color', name: 'Color Treatment', color: '#EC4899', icon: Palette },
      { id: 'chemical', name: 'Chemical Treatment', color: '#8B5CF6', icon: Zap },
      { id: 'bridal', name: 'Bridal Package', color: '#F59E0B', icon: Crown },
      { id: 'spa', name: 'Spa Treatment', color: '#10B981', icon: Sparkles }
    ],
    defaultColor: '#8B5CF6'
  },
  healthcare: {
    appointmentTypes: [
      { id: 'consultation', name: 'Consultation', color: '#0EA5E9', icon: Stethoscope },
      { id: 'checkup', name: 'Check-up', color: '#10B981', icon: UserCheck },
      { id: 'procedure', name: 'Procedure', color: '#F59E0B', icon: Settings },
      { id: 'followup', name: 'Follow-up', color: '#6B7280', icon: CheckSquare },
      { id: 'emergency', name: 'Emergency', color: '#EF4444', icon: Bell }
    ],
    defaultColor: '#0EA5E9'
  },
  consulting: {
    appointmentTypes: [
      { id: 'strategy', name: 'Strategy Session', color: '#6366F1', icon: Briefcase },
      { id: 'review', name: 'Review Meeting', color: '#10B981', icon: CheckSquare },
      { id: 'training', name: 'Training', color: '#F59E0B', icon: GraduationCap },
      { id: 'workshop', name: 'Workshop', color: '#8B5CF6', icon: Users },
      { id: 'audit', name: 'Audit', color: '#EF4444', icon: Search }
    ],
    defaultColor: '#6366F1'
  },
  manufacturing: {
    appointmentTypes: [
      { id: 'production', name: 'Production Run', color: '#F97316', icon: Wrench },
      { id: 'maintenance', name: 'Maintenance', color: '#EAB308', icon: Settings },
      { id: 'quality', name: 'Quality Check', color: '#10B981', icon: CheckSquare },
      { id: 'setup', name: 'Setup/Changeover', color: '#6B7280', icon: Settings },
      { id: 'training', name: 'Training', color: '#8B5CF6', icon: GraduationCap }
    ],
    defaultColor: '#F97316'
  }
}

// Helper: Get appointment type configuration
function getAppointmentTypeConfig(businessType: keyof typeof BUSINESS_CONFIGS, typeId: string) {
  const config = BUSINESS_CONFIGS[businessType]
  const appointmentType = config.appointmentTypes.find(t => t.id === typeId)
  return appointmentType || {
    id: 'standard',
    name: 'Standard',
    color: config.defaultColor,
    icon: Bell
  }
}

// Helper: Get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Helper: Get staff color based on ID (consistent colors)
const staffColors = [
  'bg-purple-600',
  'bg-pink-600',
  'bg-amber-600',
  'bg-blue-600',
  'bg-green-600',
  'bg-indigo-600',
  'bg-rose-600',
  'bg-cyan-600',
  'bg-orange-600',
  'bg-yellow-600'
]

function getStaffColor(staffId: string): string {
  // Simple hash function to consistently assign colors
  let hash = 0
  for (let i = 0; i < staffId.length; i++) {
    hash = (hash << 5) - hash + staffId.charCodeAt(i)
    hash = hash & hash
  }
  return staffColors[Math.abs(hash) % staffColors.length]
}

/**
 * Transform HERA appointments to universal calendar format
 */
export function transformAppointmentsToUniversal(
  heraAppointments: any[],
  businessType: keyof typeof BUSINESS_CONFIGS,
  entityTypes: { appointment: string; resourceIdField: string }
) {
  if (!heraAppointments || heraAppointments.length === 0) return []

  return heraAppointments.map(apt => {
    // Determine appointment type from metadata or transaction_type
    const appointmentType = apt.metadata?.appointment_type || apt.metadata?.service_type || 'standard'
    const typeConfig = getAppointmentTypeConfig(businessType, appointmentType)

    // Extract start time
    const startTime = new Date(apt.start_time || apt.transaction_date)
    const timeString = startTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })

    // Extract resource ID (stylist_id, doctor_id, consultant_id, etc.)
    const resourceId = apt[entityTypes.resourceIdField] || apt.stylist_id || apt.staff_id || apt.source_entity_id

    // Determine customer/client name
    const clientName =
      apt.customer_name ||
      apt.metadata?.customer_name ||
      apt.metadata?.patient_name ||
      apt.metadata?.client_name ||
      'Unknown Client'

    // Service/treatment name
    const serviceName =
      apt.service_name ||
      apt.metadata?.service_name ||
      apt.metadata?.treatment_name ||
      apt.metadata?.session_name ||
      typeConfig.name

    // Price formatting
    const currency = apt.currency || apt.metadata?.currency || 'AED'
    const amount = apt.total_amount || apt.metadata?.price || 0
    const priceString = `${currency} ${amount.toFixed(2)}`

    return {
      id: apt.id,
      title: serviceName,
      client: clientName,
      resourceId,
      time: timeString,
      date: startTime,
      duration: apt.duration_minutes || apt.metadata?.duration || 60,
      type: appointmentType,
      status: apt.status || apt.metadata?.status || 'confirmed',
      rawStatus: apt.status, // Keep original for filtering
      price: priceString,
      color: typeConfig.color,
      colorLight: `${typeConfig.color}15`,
      colorBorder: typeConfig.color,
      icon: React.createElement(typeConfig.icon, { className: 'w-3 h-3' }),
      branchId: apt.branch_id || apt.organization_id,
      branchName: apt.branch_name || apt.metadata?.branch_name,
      smartCode: apt.smart_code,
      serviceNames: apt.metadata?.services || [serviceName],

      // Keep original HERA data for updates
      _original: apt
    }
  })
}

/**
 * Transform HERA staff/resources to universal calendar format
 */
export function transformResourcesToUniversal(heraStaff: any[], businessType: string) {
  if (!heraStaff || heraStaff.length === 0) return []

  return heraStaff.map((staff, index) => {
    // Extract business hours from dynamic data or metadata
    const businessHours = staff.business_hours || staff.metadata?.business_hours || {
      start: 9 + (index % 3), // Stagger slightly for demo
      end: 18 + (index % 3)
    }

    // Extract specialties from dynamic data
    const specialties = staff.specialties || staff.metadata?.specialties || []

    // Determine availability status
    const isAvailable = staff.is_available ?? staff.status === 'active'
    const status = staff.status === 'active' ? 'available' : staff.status === 'busy' ? 'busy' : 'away'

    return {
      id: staff.id,
      name: staff.entity_name || staff.name,
      title: staff.job_title || staff.metadata?.title || staff.metadata?.role || 'Staff',
      avatar: getInitials(staff.entity_name || staff.name),
      color: getStaffColor(staff.id),
      available: isAvailable,
      status,
      branchId: staff.branch_id || staff.organization_id,
      businessHours,
      specialties,
      certifications: staff.metadata?.certifications || [],
      rating: staff.metadata?.rating || 4.5,
      experience: staff.metadata?.experience || '3+ years',

      // Keep original HERA data
      _original: staff
    }
  })
}

/**
 * Transform HERA customers/clients/patients to universal format
 */
export function transformClientsToUniversal(heraClients: any[], businessType: string) {
  if (!heraClients || heraClients.length === 0) return []

  return heraClients.map(client => ({
    id: client.id,
    name: client.entity_name || client.name,
    email: client.email || client.metadata?.email,
    phone: client.phone || client.metadata?.phone,
    notes: client.notes || client.metadata?.notes,
    vipStatus: client.metadata?.vip || client.metadata?.is_vip || false,

    // Keep original
    _original: client
  }))
}

/**
 * Transform HERA services to universal format
 */
export function transformServicesToUniversal(heraServices: any[], businessType: string) {
  if (!heraServices || heraServices.length === 0) return []

  return heraServices.map(service => {
    const price = service.price || service.metadata?.price || 0
    const currency = service.currency || service.metadata?.currency || 'AED'

    return {
      id: service.id,
      name: service.entity_name || service.name,
      description: service.description || service.metadata?.description,
      duration: service.duration || service.metadata?.duration || 60,
      price: `${currency} ${price.toFixed(2)}`,
      priceAmount: price,
      currency,
      category: service.category || service.metadata?.category,

      // Keep original
      _original: service
    }
  })
}

/**
 * Helper: Combine date and time strings for HERA updates
 */
export function combineDateAndTime(date: Date, time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const combined = new Date(date)
  combined.setHours(hours, minutes, 0, 0)
  return combined.toISOString()
}
