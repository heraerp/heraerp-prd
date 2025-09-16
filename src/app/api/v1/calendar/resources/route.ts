// HERA Universal Calendar - Resources API
// Handles resource management using HERA 6-table architecture

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { UniversalResource } from '@/src/types/calendar.types'
import { calendarSmartCodeService } from '@/services/calendarSmartCodeService'

// Mock database operations - replace with actual HERA API calls
class MockCalendarResourceDB {
  private static resources: UniversalResource[] = [
    // Healthcare Resources
    {
      entity_id: 'res_001',
      organization_id: 'org_healthcare_demo',
      entity_type: 'calendar_resource',
      entity_name: 'Dr. Sarah Johnson',
      entity_code: 'DOC_SJ_001',
      smart_code: 'HERA.HLTH.CRM.RES.DOCTOR.v1',
      status: 'active',
      ai_confidence: 0.98,
      resource_type: 'STAFF',
      industry_type: 'healthcare',
      availability_windows: JSON.stringify([
        { start: '09:00', end: '17:00', days: ['MON', 'TUE', 'WED', 'THU', 'FRI'] }
      ]),
      capacity: 1,
      skills: ['Cardiology', 'Internal Medicine', 'Patient Care'],
      location: 'Medical Center - Floor 3',
      cost_per_hour: 150,
      maintenance_schedule: JSON.stringify([]),
      booking_rules: JSON.stringify({
        advance_booking_days: 14,
        cancellation_hours: 24,
        preparation_minutes: 10
      })
    },
    {
      entity_id: 'res_002',
      organization_id: 'org_healthcare_demo',
      entity_type: 'calendar_resource',
      entity_name: 'Examination Room A',
      entity_code: 'ROOM_EXAM_A',
      smart_code: 'HERA.HLTH.CRM.RES.EXAMROOM.v1',
      status: 'active',
      ai_confidence: 0.95,
      resource_type: 'ROOM',
      industry_type: 'healthcare',
      availability_windows: JSON.stringify([
        { start: '08:00', end: '18:00', days: ['MON', 'TUE', 'WED', 'THU', 'FRI'] }
      ]),
      capacity: 2,
      skills: ['General Examination', 'Basic Procedures'],
      location: 'Medical Center - Floor 2',
      cost_per_hour: 25,
      maintenance_schedule: JSON.stringify([
        { day: 'SUN', start: '08:00', end: '10:00', type: 'cleaning' }
      ]),
      booking_rules: JSON.stringify({
        advance_booking_days: 30,
        cancellation_hours: 2,
        preparation_minutes: 5,
        cleanup_minutes: 10
      })
    },
    // Restaurant Resources
    {
      entity_id: 'res_003',
      organization_id: 'org_restaurant_demo',
      entity_type: 'calendar_resource',
      entity_name: 'Table 5',
      entity_code: 'TBL_005',
      smart_code: 'HERA.REST.CRM.RES.TABLE.v1',
      status: 'active',
      ai_confidence: 1.0,
      resource_type: 'ROOM',
      industry_type: 'restaurant',
      availability_windows: JSON.stringify([
        { start: '11:00', end: '23:00', days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] }
      ]),
      capacity: 4,
      skills: ['Window Seating', 'Quiet Area'],
      location: 'Main Dining Room',
      cost_per_hour: 0,
      maintenance_schedule: JSON.stringify([]),
      booking_rules: JSON.stringify({
        advance_booking_days: 60,
        cancellation_hours: 2,
        preparation_minutes: 5,
        cleanup_minutes: 15
      })
    },
    {
      entity_id: 'res_004',
      organization_id: 'org_restaurant_demo',
      entity_type: 'calendar_resource',
      entity_name: 'Mario Rossi',
      entity_code: 'CHEF_MR_001',
      smart_code: 'HERA.REST.CRM.RES.CHEF.v1',
      status: 'active',
      ai_confidence: 0.9,
      resource_type: 'STAFF',
      industry_type: 'restaurant',
      availability_windows: JSON.stringify([
        { start: '16:00', end: '23:00', days: ['TUE', 'WED', 'THU', 'FRI', 'SAT'] },
        { start: '12:00', end: '23:00', days: ['SUN'] }
      ]),
      capacity: 1,
      skills: ['Italian Cuisine', 'Pasta', 'Seafood', 'Wine Pairing'],
      location: 'Kitchen',
      cost_per_hour: 45,
      maintenance_schedule: JSON.stringify([]),
      booking_rules: JSON.stringify({
        advance_booking_days: 30,
        cancellation_hours: 4,
        preparation_minutes: 30
      })
    },
    // Professional Services Resources
    {
      entity_id: 'res_005',
      organization_id: 'org_professional_demo',
      entity_type: 'calendar_resource',
      entity_name: 'Conference Room Alpha',
      entity_code: 'CONF_ALPHA',
      smart_code: 'HERA.PROF.CRM.RES.CONFROOM.v1',
      status: 'active',
      ai_confidence: 0.95,
      resource_type: 'ROOM',
      industry_type: 'professional',
      availability_windows: JSON.stringify([
        { start: '08:00', end: '18:00', days: ['MON', 'TUE', 'WED', 'THU', 'FRI'] }
      ]),
      capacity: 12,
      skills: ['Video Conferencing', 'Presentation Screen', 'Whiteboard'],
      location: '15th Floor - East Wing',
      cost_per_hour: 50,
      maintenance_schedule: JSON.stringify([
        { day: 'SAT', start: '09:00', end: '12:00', type: 'deep_cleaning' }
      ]),
      booking_rules: JSON.stringify({
        advance_booking_days: 90,
        cancellation_hours: 24,
        preparation_minutes: 15,
        cleanup_minutes: 10
      })
    },
    // Manufacturing Resources
    {
      entity_id: 'res_006',
      organization_id: 'org_manufacturing_demo',
      entity_type: 'calendar_resource',
      entity_name: 'CNC Machine #3',
      entity_code: 'CNC_003',
      smart_code: 'HERA.MFG.CRM.RES.MACHINE.v1',
      status: 'active',
      ai_confidence: 0.92,
      resource_type: 'EQUIPMENT',
      industry_type: 'manufacturing',
      availability_windows: JSON.stringify([
        { start: '06:00', end: '22:00', days: ['MON', 'TUE', 'WED', 'THU', 'FRI'] },
        { start: '08:00', end: '16:00', days: ['SAT'] }
      ]),
      capacity: 1,
      skills: ['Precision Machining', 'Metal Cutting', 'CAD/CAM'],
      location: 'Production Floor - Zone B',
      cost_per_hour: 85,
      maintenance_schedule: JSON.stringify([
        { day: 'SUN', start: '08:00', end: '16:00', type: 'preventive_maintenance' },
        { day: 'WED', start: '22:00', end: '23:00', type: 'calibration' }
      ]),
      booking_rules: JSON.stringify({
        advance_booking_days: 14,
        cancellation_hours: 8,
        preparation_minutes: 30,
        cleanup_minutes: 20
      })
    }
  ]

  static async getByOrganization(
    organizationId: string,
    filters?: {
      resource_type?: string
      industry_type?: string
      status?: string
      skills?: string[]
    }
  ): Promise<UniversalResource[]> {
    let resources = this.resources.filter(r => r.organization_id === organizationId)

    if (filters) {
      if (filters.resource_type) {
        resources = resources.filter(r => r.resource_type === filters.resource_type)
      }
      if (filters.industry_type) {
        resources = resources.filter(r => r.industry_type === filters.industry_type)
      }
      if (filters.status) {
        resources = resources.filter(r => r.status === filters.status)
      }
      if (filters.skills && filters.skills.length > 0) {
        resources = resources.filter(
          r =>
            r.skills &&
            r.skills.some(skill =>
              filters.skills!.some(filterSkill =>
                skill.toLowerCase().includes(filterSkill.toLowerCase())
              )
            )
        )
      }
    }

    return resources
  }

  static async getById(resourceId: string): Promise<UniversalResource | null> {
    return this.resources.find(r => r.entity_id === resourceId) || null
  }

  static async create(resource: Partial<UniversalResource>): Promise<UniversalResource> {
    const newResource: UniversalResource = {
      entity_id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organization_id: resource.organization_id!,
      entity_type: 'calendar_resource',
      entity_name: resource.entity_name!,
      entity_code: resource.entity_code || `RES_${Date.now()}`,
      smart_code: resource.smart_code || 'HERA.UNI.CRM.RES.GENERIC.v1',
      status: resource.status || 'active',
      ai_confidence: resource.ai_confidence || 0.8,
      resource_type: resource.resource_type || 'STAFF',
      industry_type: resource.industry_type || 'universal',
      availability_windows:
        resource.availability_windows ||
        JSON.stringify([
          { start: '09:00', end: '17:00', days: ['MON', 'TUE', 'WED', 'THU', 'FRI'] }
        ]),
      capacity: resource.capacity || 1,
      skills: resource.skills || [],
      location: resource.location,
      cost_per_hour: resource.cost_per_hour || 0,
      maintenance_schedule: resource.maintenance_schedule || JSON.stringify([]),
      booking_rules:
        resource.booking_rules ||
        JSON.stringify({
          advance_booking_days: 30,
          cancellation_hours: 24
        })
    }

    this.resources.push(newResource)
    return newResource
  }

  static async update(
    resourceId: string,
    updates: Partial<UniversalResource>
  ): Promise<UniversalResource | null> {
    const index = this.resources.findIndex(r => r.entity_id === resourceId)
    if (index === -1) return null

    this.resources[index] = { ...this.resources[index], ...updates }
    return this.resources[index]
  }

  static async delete(resourceId: string): Promise<boolean> {
    const index = this.resources.findIndex(r => r.entity_id === resourceId)
    if (index === -1) return false

    this.resources.splice(index, 1)
    return true
  }
}

// GET /api/v1/calendar/resources
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers()
    const organizationId = headersList.get('X-Organization-ID')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const filters = {
      resource_type: searchParams.get('resource_type') || undefined,
      industry_type: searchParams.get('industry_type') || undefined,
      status: searchParams.get('status') || undefined,
      skills: searchParams.get('skills')?.split(',') || undefined
    }

    const resources = await MockCalendarResourceDB.getByOrganization(organizationId, filters)

    return NextResponse.json(resources)
  } catch (error) {
    console.error('Error fetching resources:', error)
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 })
  }
}

// POST /api/v1/calendar/resources
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const organizationId = headersList.get('X-Organization-ID')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const resourceData = await request.json()

    // Ensure organization_id is set
    resourceData.organization_id = organizationId

    // Auto-generate smart code if not provided
    if (!resourceData.smart_code && resourceData.entity_name && resourceData.industry_type) {
      const classification = calendarSmartCodeService.autoClassifyResource(
        resourceData.entity_name,
        resourceData.industry_type
      )
      resourceData.smart_code = classification.smartCode
      resourceData.ai_confidence = classification.confidence
    }

    // Validate required fields
    if (!resourceData.entity_name) {
      return NextResponse.json({ error: 'Resource name is required' }, { status: 400 })
    }

    const newResource = await MockCalendarResourceDB.create(resourceData)

    return NextResponse.json(newResource, { status: 201 })
  } catch (error) {
    console.error('Error creating resource:', error)
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 })
  }
}
