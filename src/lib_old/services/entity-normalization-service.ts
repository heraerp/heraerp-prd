/**
 * 🧬 HERA Entity Normalization Service
 *
 * Provides convenient wrappers for entity normalization with:
 * - Industry-specific smart code generation
 * - Duplicate detection and prevention
 * - Fuzzy matching for entity resolution
 * - Batch entity processing with normalization
 */

import { supabase } from '../supabase'
import { UniversalResponse } from '../universal-api-v2'

export interface NormalizedEntity {
  id: string
  entity_type: string
  entity_name: string
  entity_code: string
  smart_code: string
  organization_id: string
  metadata?: any
  normalization?: {
    isNew: boolean
    matchedBy: string
    confidenceScore: number
  }
}

export interface EntityNormalizationOptions {
  skipNormalization?: boolean
  forceCreate?: boolean // Create even if duplicate detected
  generateCode?: boolean // Auto-generate entity code
  industryPrefix?: string // For smart code generation
}

class EntityNormalizationService {
  /**
   * Create or resolve an entity with normalization
   */
  async createOrResolveEntity(
    organizationId: string,
    entityType: string,
    entityName: string,
    smartCode: string,
    options?: EntityNormalizationOptions & { entityCode?: string; metadata?: any }
  ): Promise<UniversalResponse<NormalizedEntity>> {
    try {
      if (options?.skipNormalization) {
        // Direct creation without normalization
        const { data, error } = await supabase
          .from('core_entities')
          .insert({
            organization_id: organizationId,
            entity_type: entityType,
            entity_name: entityName,
            entity_code: options.entityCode || this.generateEntityCode(entityType),
            smart_code: smartCode,
            metadata: options.metadata
          })
          .select()
          .single()

        if (error) throw error

        return {
          success: true,
          data: {
            ...data,
            normalization: {
              isNew: true,
              matchedBy: 'direct_creation',
              confidenceScore: 1.0
            }
          },
          error: null
        }
      }

      // Use normalization by default
      const { data, error } = await supabase.rpc('rpc_entities_resolve_and_upsert', {
        p_org_id: organizationId,
        p_entity_type: entityType,
        p_entity_name: entityName,
        p_entity_code:
          options?.entityCode ||
          (options?.generateCode ? this.generateEntityCode(entityType) : null),
        p_smart_code: smartCode,
        p_metadata: options?.metadata || null
      })

      if (error) throw error

      // Handle force create if duplicate detected
      if (!data[0].is_new && options?.forceCreate) {
        // Create with modified entity code
        const newCode = `${options?.entityCode || this.generateEntityCode(entityType)}-${Date.now()}`
        const { data: forcedData, error: forceError } = await supabase.rpc(
          'rpc_entities_resolve_and_upsert',
          {
            p_org_id: organizationId,
            p_entity_type: entityType,
            p_entity_name: `${entityName} (Duplicate)`,
            p_entity_code: newCode,
            p_smart_code: smartCode,
            p_metadata: options?.metadata || null
          }
        )

        if (forceError) throw forceError

        const { data: fullEntity } = await supabase
          .from('core_entities')
          .select()
          .eq('id', forcedData[0].entity_id)
          .single()

        return {
          success: true,
          data: {
            ...fullEntity,
            normalization: {
              isNew: true,
              matchedBy: 'forced_creation',
              confidenceScore: 1.0
            }
          },
          error: null
        }
      }

      // Fetch full entity data
      const { data: fullEntity, error: fetchError } = await supabase
        .from('core_entities')
        .select()
        .eq('id', data[0].entity_id)
        .single()

      if (fetchError) throw fetchError

      return {
        success: true,
        data: {
          ...fullEntity,
          normalization: {
            isNew: data[0].is_new,
            matchedBy: data[0].matched_by,
            confidenceScore: data[0].confidence_score
          }
        },
        error: null
      }
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || 'Entity normalization failed'
      }
    }
  }

  /**
   * Batch create entities with normalization
   */
  async batchCreateEntities(
    organizationId: string,
    entities: Array<{
      entityType: string
      entityName: string
      smartCode: string
      entityCode?: string
      metadata?: any
    }>,
    options?: EntityNormalizationOptions
  ): Promise<UniversalResponse<NormalizedEntity[]>> {
    try {
      const results: NormalizedEntity[] = []
      const errors: string[] = []

      for (const entity of entities) {
        const result = await this.createOrResolveEntity(
          organizationId,
          entity.entityType,
          entity.entityName,
          entity.smartCode,
          {
            ...options,
            entityCode: entity.entityCode,
            metadata: entity.metadata
          }
        )

        if (result.success && result.data) {
          results.push(result.data)
        } else {
          errors.push(`Failed to process ${entity.entityName}: ${result.error}`)
        }
      }

      return {
        success: errors.length === 0,
        data: results,
        error: errors.length > 0 ? errors.join('; ') : null,
        metadata: {
          totalProcessed: entities.length,
          successCount: results.length,
          errorCount: errors.length,
          duplicatesFound: results.filter(r => r.normalization && !r.normalization.isNew).length
        }
      }
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || 'Batch entity creation failed'
      }
    }
  }

  /**
   * Normalize text using HERA normalization function
   */
  async normalizeText(text: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('hera_normalize_text', {
        input_text: text
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Text normalization failed:', error)
      return null
    }
  }

  /**
   * Generate smart code based on industry and entity type
   */
  generateSmartCode(
    industry: string,
    module: string,
    type: string,
    subtype: string,
    version: number = 1
  ): string {
    return `HERA.${industry.toUpperCase()}.${module.toUpperCase()}.${type.toUpperCase()}.${subtype.toUpperCase()}.v${version}`
  }

  /**
   * Generate entity code with timestamp
   */
  private generateEntityCode(entityType: string): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
    return `${entityType.toUpperCase()}-${timestamp}`
  }

  /**
   * Common entity type smart code mappings
   */
  getCommonSmartCode(entityType: string, industry: string = 'UNIVERSAL'): string {
    const commonMappings: Record<string, Record<string, string>> = {
      customer: {
        SALON: 'HERA.SALON.CRM.CUSTOMER.PROFILE.V1',
        RESTAURANT: 'HERA.RESTAURANT.CRM.CUSTOMER.PROFILE.V1',
        FURNITURE: 'HERA.FURNITURE.CRM.CUSTOMER.PROFILE.V1',
        UNIVERSAL: 'HERA.UNIVERSAL.CRM.CUSTOMER.PROFILE.V1'
      },
      vendor: {
        SALON: 'HERA.SALON.SCM.VENDOR.PROFILE.V1',
        RESTAURANT: 'HERA.RESTAURANT.SCM.VENDOR.PROFILE.V1',
        FURNITURE: 'HERA.FURNITURE.SCM.VENDOR.PROFILE.V1',
        UNIVERSAL: 'HERA.UNIVERSAL.SCM.VENDOR.PROFILE.V1'
      },
      product: {
        SALON: 'HERA.SALON.INVENTORY.PRODUCT.ITEM.V1',
        RESTAURANT: 'HERA.RESTAURANT.MENU.ITEM.FOOD.V1',
        FURNITURE: 'HERA.FURNITURE.PRODUCT.ITEM.CATALOG.V1',
        UNIVERSAL: 'HERA.UNIVERSAL.INVENTORY.PRODUCT.ITEM.V1'
      },
      employee: {
        SALON: 'HERA.SALON.HR.EMPLOYEE.PROFILE.V1',
        RESTAURANT: 'HERA.RESTAURANT.HR.EMPLOYEE.PROFILE.V1',
        FURNITURE: 'HERA.FURNITURE.HR.EMPLOYEE.PROFILE.V1',
        UNIVERSAL: 'HERA.UNIVERSAL.HR.EMPLOYEE.PROFILE.V1'
      },
      gl_account: {
        SALON: 'HERA.SALON.FIN.GL.ACCOUNT.V1',
        RESTAURANT: 'HERA.RESTAURANT.FIN.GL.ACCOUNT.V1',
        FURNITURE: 'HERA.FURNITURE.FIN.GL.ACCOUNT.V1',
        UNIVERSAL: 'HERA.UNIVERSAL.FIN.GL.ACCOUNT.V1'
      }
    }

    const industryUpper = industry.toUpperCase()
    const typeMapping = commonMappings[entityType.toLowerCase()]

    if (typeMapping) {
      return typeMapping[industryUpper] || typeMapping.UNIVERSAL
    }

    // Fallback to generic pattern
    return this.generateSmartCode(industryUpper, 'ENTITY', entityType.toUpperCase(), 'MASTER')
  }
}

// Export singleton instance
export const entityNormalizationService = new EntityNormalizationService()

// Export convenience functions
export async function createNormalizedEntity(
  organizationId: string,
  entityType: string,
  entityName: string,
  options?: {
    industry?: string
    entityCode?: string
    metadata?: any
    skipNormalization?: boolean
  }
): Promise<UniversalResponse<NormalizedEntity>> {
  const smartCode = options?.industry
    ? entityNormalizationService.getCommonSmartCode(entityType, options.industry)
    : entityNormalizationService.getCommonSmartCode(entityType)

  return entityNormalizationService.createOrResolveEntity(
    organizationId,
    entityType,
    entityName,
    smartCode,
    {
      entityCode: options?.entityCode,
      metadata: options?.metadata,
      skipNormalization: options?.skipNormalization
    }
  )
}

// Export type guards
export function isNewEntity(entity: NormalizedEntity): boolean {
  return entity.normalization?.isNew === true
}

export function isDuplicateEntity(entity: NormalizedEntity): boolean {
  return entity.normalization?.isNew === false
}

export function getMatchConfidence(entity: NormalizedEntity): number {
  return entity.normalization?.confidenceScore || 0
}
