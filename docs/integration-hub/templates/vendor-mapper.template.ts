/**
 * {Vendor} Data Mapper Template
 * 
 * Transforms {Vendor} API responses to HERA universal entities
 * using field mapping configuration
 * 
 * Instructions:
 * 1. Replace {Vendor} with your vendor name (e.g., Meetup, Facebook)
 * 2. Replace {VENDOR} with uppercase version
 * 3. Import vendor-specific types
 * 4. Implement mapping methods for each entity type
 */

import { 
  CoreEntity, 
  CoreRelationship, 
  DynamicFieldData,
  SmartCode 
} from '@/types/core'
import { 
  {Vendor}Organization,
  {Vendor}Event,
  {Vendor}Attendee
} from '@/lib/integration/vendors/{vendor}'
import {vendor}Mapping from '@/lib/integration/mappings/{vendor}.events.map.json'

export interface MappedEntity {
  entity: Partial<CoreEntity>
  dynamicFields: DynamicFieldData[]
  relationships: Array<{
    type: string
    direction: 'from' | 'to'
    resolveBy: string
    resolveValue: string
    smartCode: SmartCode
  }>
}

export class {Vendor}Mapper {
  private organizationId: string
  private mapping = {vendor}Mapping

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  /**
   * Map {Vendor} Organization to HERA entity
   */
  mapOrganization(org: {Vendor}Organization): MappedEntity {
    const mapping = this.mapping.entity_mappings.organization
    
    // Core entity
    const entity: Partial<CoreEntity> = {
      organization_id: this.organizationId,
      entity_type: mapping.target_type,
      entity_name: org.name,
      entity_code: `${mapping.code_prefix}${org.id}`,
      smart_code: mapping.smart_code as SmartCode,
      business_rules: {
        ...mapping.business_rules,
        // Add vendor-specific business rules
      },
      metadata: {
        external_id: org.id,
        last_synced: new Date().toISOString()
      }
    }

    // Dynamic fields
    const dynamicFields: DynamicFieldData[] = []
    
    for (const fieldMap of mapping.dynamic_fields) {
      const value = this.getNestedValue(org, fieldMap.source)
      if (value !== undefined && value !== null) {
        dynamicFields.push(this.createDynamicField(
          '', // entity_id will be set during sync
          fieldMap.target,
          fieldMap.field_type,
          value,
          fieldMap.smart_code as SmartCode
        ))
      }
    }

    return {
      entity,
      dynamicFields,
      relationships: []
    }
  }

  /**
   * Map {Vendor} Event to HERA entity
   */
  mapEvent(event: {Vendor}Event): MappedEntity {
    const mapping = this.mapping.entity_mappings.event
    
    // Core entity
    const entity: Partial<CoreEntity> = {
      organization_id: this.organizationId,
      entity_type: mapping.target_type,
      entity_name: event.name,
      entity_code: `${mapping.code_prefix}${event.id}`,
      smart_code: mapping.smart_code as SmartCode,
      business_rules: {
        ...mapping.business_rules,
        // Add vendor-specific business rules
      },
      metadata: {
        external_id: event.id,
        last_synced: new Date().toISOString()
      }
    }

    // Dynamic fields
    const dynamicFields: DynamicFieldData[] = []
    
    for (const fieldMap of mapping.dynamic_fields) {
      const value = this.getNestedValue(event, fieldMap.source)
      if (value !== undefined && value !== null) {
        const transformedValue = this.applyTransform(value, fieldMap.transform)
        dynamicFields.push(this.createDynamicField(
          '',
          fieldMap.target,
          fieldMap.field_type,
          transformedValue,
          fieldMap.smart_code as SmartCode
        ))
      }
    }

    // Relationships
    const relationships = [{
      type: 'ORGANIZATION_HAS_EVENT',
      direction: 'to' as const,
      resolveBy: 'organizerId',
      resolveValue: event.organizerId || '',
      smartCode: 'HERA.PUBLICSECTOR.CRM.SOCIAL.{VENDOR}.REL.ORG_EVENT.v1' as SmartCode
    }]

    return {
      entity,
      dynamicFields,
      relationships
    }
  }

  /**
   * Map {Vendor} Attendee to HERA entity
   */
  mapAttendee(attendee: {Vendor}Attendee): MappedEntity {
    const mapping = this.mapping.entity_mappings.attendee
    
    // Compute name if using template
    const name = mapping.name_template 
      ? this.computeTemplateName(mapping.name_template, attendee)
      : attendee.name || 'Unknown Attendee'
    
    // Core entity
    const entity: Partial<CoreEntity> = {
      organization_id: this.organizationId,
      entity_type: mapping.target_type,
      entity_name: name,
      entity_code: `${mapping.code_prefix}${attendee.id}`,
      smart_code: mapping.smart_code as SmartCode,
      business_rules: {
        ...mapping.business_rules,
        rsvp_status: attendee.status
      },
      metadata: {
        user_id: attendee.userId,
        event_id: attendee.eventId,
        last_synced: new Date().toISOString()
      }
    }

    // Dynamic fields
    const dynamicFields: DynamicFieldData[] = []
    // TODO: Map attendee fields

    // Relationships
    const relationships = [{
      type: 'EVENT_HAS_ATTENDEE',
      direction: 'from' as const,
      resolveBy: 'eventId',
      resolveValue: attendee.eventId,
      smartCode: 'HERA.PUBLICSECTOR.CRM.SOCIAL.{VENDOR}.REL.EVENT_ATTENDEE.v1' as SmartCode
    }]

    return {
      entity,
      dynamicFields,
      relationships
    }
  }

  /**
   * Create sync transaction for audit trail
   */
  createSyncTransaction(stats: {
    organizations_created: number
    organizations_updated: number
    events_created: number
    events_updated: number
    attendees_created: number
    attendees_updated: number
    errors: Array<{ entity: string; error: string }>
  }) {
    const transaction = {
      organization_id: this.organizationId,
      transaction_type: 'INTEGRATION_SYNC',
      transaction_date: new Date().toISOString(),
      smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.{VENDOR}.SYNC.COMPLETE.v1' as SmartCode,
      total_amount: 0, // Not a financial transaction
      business_context: {
        vendor: '{vendor}',
        scope: 'organizations+events+attendees'
      },
      metadata: {
        sync_timestamp: new Date().toISOString(),
        success: stats.errors.length === 0
      }
    }

    const lines = [
      {
        line_number: 1,
        line_type: 'SUMMARY',
        line_amount: 0,
        smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.{VENDOR}.SYNC.ORGS.v1' as SmartCode,
        line_data: {
          organizations_created: stats.organizations_created,
          organizations_updated: stats.organizations_updated
        }
      },
      {
        line_number: 2,
        line_type: 'SUMMARY',
        line_amount: 0,
        smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.{VENDOR}.SYNC.EVENTS.v1' as SmartCode,
        line_data: {
          events_created: stats.events_created,
          events_updated: stats.events_updated
        }
      },
      {
        line_number: 3,
        line_type: 'SUMMARY',
        line_amount: 0,
        smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.{VENDOR}.SYNC.ATTENDEES.v1' as SmartCode,
        line_data: {
          attendees_created: stats.attendees_created,
          attendees_updated: stats.attendees_updated
        }
      }
    ]

    if (stats.errors.length > 0) {
      lines.push({
        line_number: lines.length + 1,
        line_type: 'ERRORS',
        line_amount: 0,
        smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.{VENDOR}.SYNC.ERRORS.v1' as SmartCode,
        line_data: {
          error_count: stats.errors.length,
          errors: stats.errors
        }
      })
    }

    return { transaction, lines }
  }

  // Helper methods
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, key) => acc?.[key], obj)
  }

  private applyTransform(value: any, transform?: string): any {
    if (!transform) return value
    
    switch (transform) {
      case 'unix_to_iso':
        return new Date(value).toISOString()
      case 'lowercase':
        return String(value).toLowerCase()
      case 'uppercase':
        return String(value).toUpperCase()
      case 'truncate':
        return String(value).substring(0, 100)
      default:
        return value
    }
  }

  private computeTemplateName(template: string, data: any): string {
    return template.replace(/\{([^}]+)\}/g, (match, path) => {
      const value = this.getNestedValue(data, path)
      return value || ''
    })
  }

  private createDynamicField(
    entityId: string,
    fieldName: string,
    fieldType: string,
    value: any,
    smartCode: SmartCode
  ): DynamicFieldData {
    const field: DynamicFieldData = {
      organization_id: this.organizationId,
      entity_id: entityId,
      field_name: fieldName,
      field_type: fieldType as any,
      smart_code: smartCode,
      is_deleted: false
    }

    // Set the appropriate value field based on type
    switch (fieldType) {
      case 'text':
        field.field_value_text = String(value)
        break
      case 'number':
        field.field_value_number = Number(value)
        break
      case 'boolean':
        field.field_value_boolean = Boolean(value)
        break
      case 'timestamp':
        field.field_value_timestamp = value
        break
      case 'json':
        field.field_value_json = value
        break
      default:
        field.field_value_text = String(value)
    }

    return field
  }
}