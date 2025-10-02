/**
 * LinkedIn Data Mapper
 *
 * Transforms LinkedIn API responses to HERA universal entities
 * using field mapping configuration
 */

import { CoreEntity, CoreRelationship, DynamicFieldData, SmartCode } from '@/types/core'
import {
  LinkedInOrganization,
  LinkedInEvent,
  LinkedInAttendee,
  LinkedInPost
} from '@/lib/integration/vendors/linkedin'
import linkedInMapping from '@/lib/integration/mappings/linkedin.events.map.json'

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

export class LinkedInMapper {
  private organizationId: string
  private mapping = linkedInMapping

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  /**
   * Map LinkedIn Organization to HERA entity
   */
  mapOrganization(org: LinkedInOrganization, urn: string): MappedEntity {
    const mapping = this.mapping.entity_mappings.organization

    // Core entity
    const entity: Partial<CoreEntity> = {
      organization_id: this.organizationId,
      entity_type: mapping.target_type,
      entity_name: org.localizedName,
      entity_code: `${mapping.code_prefix}${org.id}`,
      smart_code: mapping.smart_code as SmartCode,
      business_rules: {
        ...mapping.business_rules,
        vanity_name: org.vanityName
      },
      metadata: {
        external_id: org.id,
        linkedin_urn: urn,
        last_synced: new Date().toISOString()
      }
    }

    // Dynamic fields
    const dynamicFields: DynamicFieldData[] = []

    for (const fieldMap of mapping.dynamic_fields) {
      const value = this.getNestedValue(org, fieldMap.source)
      if (value !== undefined && value !== null) {
        dynamicFields.push(
          this.createDynamicField(
            '', // entity_id will be set during sync
            fieldMap.target,
            fieldMap.field_type,
            value,
            fieldMap.smart_code as SmartCode
          )
        )
      }
    }

    return {
      entity,
      dynamicFields,
      relationships: []
    }
  }

  /**
   * Map LinkedIn Event to HERA entity
   */
  mapEvent(event: LinkedInEvent): MappedEntity {
    const mapping = this.mapping.entity_mappings.event

    // Core entity
    const entity: Partial<CoreEntity> = {
      organization_id: this.organizationId,
      entity_type: mapping.target_type,
      entity_name: event.name.text,
      entity_code: `${mapping.code_prefix}${event.id}`,
      smart_code: mapping.smart_code as SmartCode,
      business_rules: {
        ...mapping.business_rules,
        visibility: event.visibility,
        mode: event.mode,
        is_registration_required: event.isRegistrationRequired
      },
      metadata: {
        external_id: event.id,
        event_url: event.eventUrl,
        last_synced: new Date().toISOString()
      }
    }

    // Dynamic fields
    const dynamicFields: DynamicFieldData[] = []

    for (const fieldMap of mapping.dynamic_fields) {
      const value = this.getNestedValue(event, fieldMap.source)
      if (value !== undefined && value !== null) {
        const transformedValue = this.applyTransform(value, fieldMap.transform)
        dynamicFields.push(
          this.createDynamicField(
            '',
            fieldMap.target,
            fieldMap.field_type,
            transformedValue,
            fieldMap.smart_code as SmartCode
          )
        )
      }
    }

    // Relationships
    const relationships = [
      {
        type: 'ORGANIZATION_HAS_EVENT',
        direction: 'to' as const,
        resolveBy: 'organizerUrn',
        resolveValue: event.organizerUrn,
        smartCode: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.REL.ORG_EVENT.v1' as SmartCode
      }
    ]

    return {
      entity,
      dynamicFields,
      relationships
    }
  }

  /**
   * Map LinkedIn Attendee to HERA entity
   */
  mapAttendee(attendee: LinkedInAttendee): MappedEntity {
    const mapping = this.mapping.entity_mappings.attendee

    // Compute name
    const name = this.computeTemplateName(mapping.name_template, attendee)

    // Core entity
    const entity: Partial<CoreEntity> = {
      organization_id: this.organizationId,
      entity_type: mapping.target_type,
      entity_name: name,
      entity_code: `${mapping.code_prefix}${attendee.memberUrn}|${attendee.eventUrn}`,
      smart_code: mapping.smart_code as SmartCode,
      business_rules: {
        ...mapping.business_rules,
        rsvp_status: attendee.rsvpStatus
      },
      metadata: {
        member_urn: attendee.memberUrn,
        event_urn: attendee.eventUrn,
        last_synced: new Date().toISOString()
      }
    }

    // Dynamic fields
    const dynamicFields: DynamicFieldData[] = []

    for (const fieldMap of mapping.dynamic_fields) {
      const value = this.getNestedValue(attendee, fieldMap.source)
      if (value !== undefined && value !== null) {
        const transformedValue = this.applyTransform(value, fieldMap.transform)
        dynamicFields.push(
          this.createDynamicField(
            '',
            fieldMap.target,
            fieldMap.field_type,
            transformedValue,
            fieldMap.smart_code as SmartCode
          )
        )
      }
    }

    // Relationships
    const relationships = [
      {
        type: 'EVENT_HAS_ATTENDEE',
        direction: 'from' as const,
        resolveBy: 'eventUrn',
        resolveValue: attendee.eventUrn,
        smartCode: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.REL.EVENT_ATTENDEE.v1' as SmartCode
      }
    ]

    return {
      entity,
      dynamicFields,
      relationships
    }
  }

  /**
   * Map LinkedIn Post to HERA entity
   */
  mapPost(post: LinkedInPost): MappedEntity {
    const mapping = this.mapping.entity_mappings.post

    // Compute name
    const name = post.text.text.substring(0, 100) + '...'

    // Core entity
    const entity: Partial<CoreEntity> = {
      organization_id: this.organizationId,
      entity_type: mapping.target_type,
      entity_name: name,
      entity_code: `${mapping.code_prefix}${post.id}`,
      smart_code: mapping.smart_code as SmartCode,
      business_rules: {
        ...mapping.business_rules,
        visibility: post.visibility,
        lifecycle_state: post.lifecycleState
      },
      metadata: {
        external_id: post.id,
        author_urn: post.authorUrn,
        created_at: new Date(post.createdAt).toISOString(),
        last_synced: new Date().toISOString()
      }
    }

    // Dynamic fields
    const dynamicFields: DynamicFieldData[] = []

    for (const fieldMap of mapping.dynamic_fields) {
      const value = this.getNestedValue(post, fieldMap.source)
      if (value !== undefined && value !== null) {
        dynamicFields.push(
          this.createDynamicField(
            '',
            fieldMap.target,
            fieldMap.field_type,
            value,
            fieldMap.smart_code as SmartCode
          )
        )
      }
    }

    // Relationships
    const relationships = [
      {
        type: 'POST_BELONGS_TO_ORG',
        direction: 'to' as const,
        resolveBy: 'authorUrn',
        resolveValue: post.authorUrn,
        smartCode: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.REL.POST_ORG.v1' as SmartCode
      }
    ]

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
    events_created: number
    events_updated: number
    attendees_created: number
    attendees_updated: number
    posts_created?: number
    posts_updated?: number
    errors: Array<{ entity: string; error: string }>
  }) {
    const transaction = {
      organization_id: this.organizationId,
      transaction_type: 'INTEGRATION_SYNC',
      transaction_date: new Date().toISOString(),
      smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.SYNC.COMPLETE.V1' as SmartCode,
      total_amount: 0, // Not a financial transaction
      business_context: {
        vendor: 'linkedin',
        scope: 'events+attendees+posts'
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
        smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.SYNC.EVENTS.V1' as SmartCode,
        line_data: {
          events_created: stats.events_created,
          events_updated: stats.events_updated
        }
      },
      {
        line_number: 2,
        line_type: 'SUMMARY',
        line_amount: 0,
        smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.SYNC.ATTENDEES.V1' as SmartCode,
        line_data: {
          attendees_created: stats.attendees_created,
          attendees_updated: stats.attendees_updated
        }
      }
    ]

    if (stats.posts_created !== undefined || stats.posts_updated !== undefined) {
      lines.push({
        line_number: 3,
        line_type: 'SUMMARY',
        line_amount: 0,
        smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.SYNC.POSTS.V1' as SmartCode,
        line_data: {
          posts_created: stats.posts_created || 0,
          posts_updated: stats.posts_updated || 0
        }
      })
    }

    if (stats.errors.length > 0) {
      lines.push({
        line_number: lines.length + 1,
        line_type: 'ERRORS',
        line_amount: 0,
        smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.SYNC.ERRORS.V1' as SmartCode,
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
