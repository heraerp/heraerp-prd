/**
 * Social Media Smart Code Validator
 *
 * Validates smart codes for social media vendor integrations
 * following the pattern: HERA.PUBLICSECTOR.CRM.SOCIAL.{VENDOR}.{OBJECT}.{ACTION}.v1
 */

import { SmartCode } from '@/types/core'
import { VendorType } from '@/types/integrations'

// Valid social media vendors
const SOCIAL_VENDORS = [
  'LINKEDIN',
  'FACEBOOK',
  'MEETUP',
  'BLUESKY',
  'TWITTER',
  'INSTAGRAM'
] as const
type SocialVendor = (typeof SOCIAL_VENDORS)[number]

// Valid object types for social integrations
const SOCIAL_OBJECTS = [
  'ORG',
  'ORGANIZATION',
  'PAGE',
  'PROFILE', // Organization/Page entities
  'EVENT',
  'MEETING',
  'WEBINAR', // Event entities
  'POST',
  'ARTICLE',
  'UPDATE', // Content entities
  'RSVP',
  'ATTENDEE',
  'INVITE',
  'REGISTRATION', // Attendance entities
  'COMMENT',
  'REACTION',
  'SHARE', // Engagement entities
  'FOLLOWER',
  'MEMBER',
  'SUBSCRIBER', // Audience entities
  'MESSAGE',
  'THREAD',
  'CONVERSATION', // Communication entities
  'METRIC',
  'INSIGHT',
  'ANALYTICS', // Analytics entities
  'CAMPAIGN',
  'AD',
  'PROMOTION', // Marketing entities
  'REL',
  'RELATIONSHIP', // Relationships
  'FIELD',
  'ATTRIBUTE', // Dynamic fields
  'SYNC',
  'INTEGRATION' // Integration operations
] as const
type SocialObject = (typeof SOCIAL_OBJECTS)[number]

// Valid actions for social integrations
const SOCIAL_ACTIONS = [
  // CRUD operations
  'CREATE',
  'READ',
  'UPDATE',
  'DELETE',
  'UPSERT',
  // Sync operations
  'SYNC',
  'IMPORT',
  'EXPORT',
  'REFRESH',
  // Event operations
  'PUBLISH',
  'SCHEDULE',
  'CANCEL',
  'POSTPONE',
  // Engagement operations
  'LIKE',
  'UNLIKE',
  'COMMENT',
  'SHARE',
  'REACT',
  // Attendance operations
  'REGISTER',
  'CHECKIN',
  'CHECKOUT',
  'CONFIRM',
  // Relationship operations
  'FOLLOW',
  'UNFOLLOW',
  'CONNECT',
  'DISCONNECT',
  // Analytics operations
  'TRACK',
  'MEASURE',
  'ANALYZE',
  'REPORT',
  // System operations
  'START',
  'COMPLETE',
  'ERROR',
  'RETRY'
] as const
type SocialAction = (typeof SOCIAL_ACTIONS)[number]

// Relationship type patterns
const RELATIONSHIP_PATTERNS = {
  ORG_EVENT: 'Organization has Event',
  EVENT_ATTENDEE: 'Event has Attendee',
  POST_ORG: 'Post belongs to Organization',
  COMMENT_POST: 'Comment on Post',
  MEMBER_ORG: 'Member of Organization',
  FOLLOWER_ORG: 'Follower of Organization'
} as const

// Field type patterns
const FIELD_PATTERNS = {
  DESC: 'Description',
  FOLLOWERS: 'Followers Count',
  MEMBERS: 'Members Count',
  WEBSITE: 'Website URL',
  LOGO: 'Logo Image',
  BANNER: 'Banner Image',
  ENGAGEMENT: 'Engagement Metrics',
  REACH: 'Reach Metrics',
  DEMOGRAPHICS: 'Demographics Data'
} as const

export interface SocialSmartCodeValidation {
  isValid: boolean
  vendor?: SocialVendor
  object?: SocialObject
  action?: SocialAction
  version?: string
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

/**
 * Validates a social media integration smart code
 */
export function validateSocialSmartCode(smartCode: string): SocialSmartCodeValidation {
  const errors: string[] = []
  const warnings: string[] = []
  const suggestions: string[] = []

  // Split smart code into parts
  const parts = smartCode.split('.')

  // Check basic structure
  if (parts.length < 7 || parts.length > 8) {
    errors.push(`Invalid structure: Expected 7-8 parts, got ${parts.length}`)
    return { isValid: false, errors, warnings, suggestions }
  }

  // Validate prefix
  if (parts[0] !== 'HERA') {
    errors.push('Smart code must start with "HERA"')
  }

  if (parts[1] !== 'PUBLICSECTOR') {
    warnings.push('CivicFlow integrations should use "PUBLICSECTOR" domain')
    suggestions.push(`Consider: HERA.PUBLICSECTOR.${parts.slice(2).join('.')}`)
  }

  if (parts[2] !== 'CRM') {
    warnings.push('Social integrations typically use "CRM" module')
    suggestions.push(`Consider: ${parts.slice(0, 2).join('.')}.CRM.${parts.slice(3).join('.')}`)
  }

  if (parts[3] !== 'SOCIAL') {
    errors.push('Social vendor smart codes must have "SOCIAL" in position 4')
  }

  // Validate vendor
  const vendor = parts[4] as SocialVendor
  if (!SOCIAL_VENDORS.includes(vendor)) {
    errors.push(`Invalid vendor: "${vendor}". Valid vendors: ${SOCIAL_VENDORS.join(', ')}`)

    // Suggest correction for common mistakes
    const vendorLower = vendor?.toLowerCase()
    const match = SOCIAL_VENDORS.find(v => v.toLowerCase() === vendorLower)
    if (match) {
      suggestions.push(`Use uppercase: ${match}`)
    }
  }

  // Validate object
  const object = parts[5] as SocialObject
  if (!SOCIAL_OBJECTS.includes(object)) {
    errors.push(`Invalid object: "${object}". Valid objects: ${SOCIAL_OBJECTS.join(', ')}`)

    // Suggest corrections
    if (object === 'ORGANIZATION' && vendor !== 'LINKEDIN') {
      suggestions.push('Consider using "PAGE" for Facebook or "PROFILE" for other vendors')
    }
    if (object === 'PAGE' && vendor === 'LINKEDIN') {
      suggestions.push('LinkedIn uses "ORG" or "ORGANIZATION" instead of "PAGE"')
    }
  }

  // Validate action or relationship type
  let action: string | undefined
  if (object === 'REL' || object === 'RELATIONSHIP') {
    // For relationships, validate the relationship type
    const relType = parts[6]
    if (!Object.keys(RELATIONSHIP_PATTERNS).includes(relType)) {
      warnings.push(`Unknown relationship type: "${relType}"`)
      suggestions.push(`Common patterns: ${Object.keys(RELATIONSHIP_PATTERNS).join(', ')}`)
    }
    action = relType
  } else if (object === 'FIELD' || object === 'ATTRIBUTE') {
    // For fields, validate the field type
    const fieldType = parts[6]
    if (!Object.keys(FIELD_PATTERNS).includes(fieldType)) {
      warnings.push(`Unknown field type: "${fieldType}"`)
      suggestions.push(`Common fields: ${Object.keys(FIELD_PATTERNS).join(', ')}`)
    }
    action = fieldType
  } else {
    // For regular objects, validate the action
    action = parts[6] as SocialAction
    if (!SOCIAL_ACTIONS.includes(action as SocialAction)) {
      errors.push(`Invalid action: "${action}". Valid actions: ${SOCIAL_ACTIONS.join(', ')}`)
    }
  }

  // Validate version
  const version = parts[parts.length - 1]
  const versionRegex = /^v\d+$/
  if (!versionRegex.test(version)) {
    errors.push(`Invalid version format: "${version}". Expected: v1, v2, etc.`)
    suggestions.push('Use "v1" for new integrations')
  }

  // Additional validations
  if (vendor === 'LINKEDIN') {
    if (object === 'ATTENDEE' && action === 'CREATE') {
      warnings.push('LinkedIn API has limited attendee creation capabilities')
      suggestions.push('Consider using "UPSERT" for attendee operations')
    }
    if (object === 'POST' && (action === 'UPDATE' || action === 'DELETE')) {
      warnings.push('LinkedIn API restrictions on post modifications')
    }
  }

  if (vendor === 'FACEBOOK') {
    if (object === 'EVENT' && action === 'DELETE') {
      warnings.push('Facebook typically uses CANCEL instead of DELETE for events')
      suggestions.push('Consider using "CANCEL" action')
    }
  }

  const isValid = errors.length === 0

  return {
    isValid,
    vendor: isValid ? vendor : undefined,
    object: isValid ? (object as SocialObject) : undefined,
    action: isValid ? (action as SocialAction) : undefined,
    version: isValid ? version : undefined,
    errors,
    warnings,
    suggestions
  }
}

/**
 * Generates a valid social smart code
 */
export function generateSocialSmartCode(
  vendor: SocialVendor | VendorType,
  object: SocialObject,
  action: SocialAction | string,
  version: number = 1
): SmartCode {
  const vendorUpper = vendor.toUpperCase() as SocialVendor
  return `HERA.PUBLICSECTOR.CRM.SOCIAL.${vendorUpper}.${object}.${action}.v${version}` as SmartCode
}

/**
 * Batch validates an array of smart codes
 */
export function validateSocialSmartCodes(
  smartCodes: string[]
): Map<string, SocialSmartCodeValidation> {
  const results = new Map<string, SocialSmartCodeValidation>()

  for (const smartCode of smartCodes) {
    results.set(smartCode, validateSocialSmartCode(smartCode))
  }

  return results
}

/**
 * Extract vendor from a social smart code
 */
export function extractVendorFromSmartCode(smartCode: string): SocialVendor | null {
  const validation = validateSocialSmartCode(smartCode)
  return validation.isValid ? validation.vendor! : null
}

/**
 * Check if a smart code represents a sync operation
 */
export function isSyncOperation(smartCode: string): boolean {
  const validation = validateSocialSmartCode(smartCode)
  return (
    validation.isValid &&
    (validation.action === 'SYNC' ||
      validation.object === 'SYNC' ||
      validation.object === 'INTEGRATION')
  )
}

/**
 * Check if a smart code represents a relationship
 */
export function isRelationshipSmartCode(smartCode: string): boolean {
  const validation = validateSocialSmartCode(smartCode)
  return validation.isValid && (validation.object === 'REL' || validation.object === 'RELATIONSHIP')
}

// Export constants for external use
export const SOCIAL_SMART_CODE_CONSTANTS = {
  VENDORS: SOCIAL_VENDORS,
  OBJECTS: SOCIAL_OBJECTS,
  ACTIONS: SOCIAL_ACTIONS,
  RELATIONSHIPS: RELATIONSHIP_PATTERNS,
  FIELDS: FIELD_PATTERNS
} as const
