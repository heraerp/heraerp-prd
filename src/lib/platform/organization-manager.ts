/**
 * HERA v3.0 Platform Organization Manager
 * Handles multi-org user flows, tenant creation, and template pack loading
 */

import { createClient } from '@/lib/supabase/client'
import { 
  PLATFORM_ORG_ID, 
  ORGANIZATION_TYPES,
  MEMBERSHIP_ROLES,
  PLATFORM_SMART_CODES,
  type IndustryType,
  type OrganizationType,
  type MembershipRole,
  getTemplatePack,
  getDefaultBranding,
  getIndustryConfig
} from './constants'

export interface PlatformUser {
  id: string
  entity_id: string
  email: string
  name: string
  created_at: string
  memberships: OrganizationMembership[]
}

export interface OrganizationMembership {
  organization_id: string
  organization: {
    id: string
    entity_id: string 
    name: string
    type: OrganizationType
    industry: IndustryType
    settings: OrganizationSettings
  }
  role: MembershipRole
  is_active: boolean
  joined_at: string
}

export interface OrganizationSettings {
  branding: {
    logo_url?: string
    primary_color: string
    secondary_color: string
    accent_color: string
    font_family: string
    favicon_url?: string
    theme: 'light' | 'dark'
    custom_domain?: {
      domain: string
      verified: boolean
      ssl_enabled: boolean
    }
  }
  template_pack: {
    pack_id: string
    loaded_at: string
    version: string
  }
  features: Record<string, boolean>
  ai_preferences: {
    enabled: boolean
    default_mode: 'manual' | 'assisted' | 'automatic'
    cost_limit_monthly: number
  }
  onboarding: {
    completed: boolean
    current_step: string
    completed_steps: string[]
  }
}

export interface CreateOrganizationRequest {
  name: string
  industry: IndustryType
  owner_user_id: string
  settings?: Partial<OrganizationSettings>
}

export interface CreateOrganizationResult {
  organization: {
    id: string
    entity_id: string
    name: string
    industry: IndustryType
    settings: OrganizationSettings
  }
  membership: {
    id: string
    role: MembershipRole
  }
  template_pack_loaded: boolean
}

/**
 * Platform Organization Manager Class
 */
export class PlatformOrganizationManager {
  private supabase = createClient()

  /**
   * Register new user in platform organization
   */
  async registerPlatformUser(
    authUser: any,
    metadata: { name?: string; company?: string } = {}
  ): Promise<PlatformUser> {
    try {
      // Create USER entity in platform organization
      const { data: userEntity, error: userError } = await this.supabase
        .rpc('hera_entities_crud_v1', {
          p_action: 'CREATE',
          p_actor_user_id: authUser.id,
          p_organization_id: PLATFORM_ORG_ID,
          p_entity: {
            entity_type: 'USER',
            entity_name: metadata.name || authUser.email?.split('@')[0] || 'User',
            entity_code: authUser.email,
            smart_code: PLATFORM_SMART_CODES.PLATFORM_USER,
            status: 'active'
          },
          p_dynamic: {
            email: {
              field_type: 'email',
              field_value_text: authUser.email,
              smart_code: 'HERA.PLATFORM.USER.FIELD.EMAIL.v1'
            },
            auth_provider_uid: {
              field_type: 'text', 
              field_value_text: authUser.id,
              smart_code: 'HERA.PLATFORM.USER.FIELD.AUTH_UID.v1'
            },
            ...(metadata.company && {
              company: {
                field_type: 'text',
                field_value_text: metadata.company,
                smart_code: 'HERA.PLATFORM.USER.FIELD.COMPANY.v1'
              }
            })
          },
          p_relationships: [],
          p_options: {}
        })

      if (userError) throw userError

      return {
        id: authUser.id,
        entity_id: userEntity.entity_id,
        email: authUser.email,
        name: metadata.name || authUser.email?.split('@')[0] || 'User',
        created_at: userEntity.created_at,
        memberships: []
      }
    } catch (error) {
      console.error('Failed to register platform user:', error)
      throw new Error('User registration failed')
    }
  }

  /**
   * Create new tenant organization with template pack
   */
  async createOrganization(request: CreateOrganizationRequest): Promise<CreateOrganizationResult> {
    try {
      const industryConfig = getIndustryConfig(request.industry)
      const templatePackId = getTemplatePack(request.industry)
      const defaultBranding = getDefaultBranding(request.industry)

      // Build organization settings
      const orgSettings: OrganizationSettings = {
        branding: {
          ...defaultBranding,
          ...request.settings?.branding
        },
        template_pack: {
          pack_id: templatePackId,
          loaded_at: new Date().toISOString(),
          version: '1.0.0'
        },
        features: industryConfig.features.reduce((acc, feature) => {
          acc[feature] = true
          return acc
        }, {} as Record<string, boolean>),
        ai_preferences: {
          enabled: true,
          default_mode: 'assisted',
          cost_limit_monthly: 500,
          ...request.settings?.ai_preferences
        },
        onboarding: {
          completed: false,
          current_step: 'welcome',
          completed_steps: [],
          ...request.settings?.onboarding
        }
      }

      // Create organization entity
      const { data: orgEntity, error: orgError } = await this.supabase
        .rpc('hera_entities_crud_v1', {
          p_action: 'CREATE',
          p_actor_user_id: request.owner_user_id,
          p_organization_id: PLATFORM_ORG_ID, // Created in platform, then becomes tenant
          p_entity: {
            entity_type: 'ORGANIZATION',
            entity_name: request.name,
            entity_code: this.generateOrgCode(request.name),
            smart_code: PLATFORM_SMART_CODES.PLATFORM_ORG,
            status: 'active'
          },
          p_dynamic: {
            industry: {
              field_type: 'text',
              field_value_text: request.industry,
              smart_code: 'HERA.PLATFORM.ORG.FIELD.INDUSTRY.v1'
            },
            organization_type: {
              field_type: 'text',
              field_value_text: ORGANIZATION_TYPES.BUSINESS_UNIT,
              smart_code: 'HERA.PLATFORM.ORG.FIELD.TYPE.v1'
            }
          },
          p_relationships: [],
          p_options: {}
        })

      if (orgError) throw orgError

      // Create actual tenant organization record
      const { data: tenantOrg, error: tenantError } = await this.supabase
        .from('core_organizations')
        .insert({
          id: orgEntity.entity_id,
          organization_name: request.name,
          organization_code: this.generateOrgCode(request.name),
          organization_type: ORGANIZATION_TYPES.BUSINESS_UNIT,
          industry_classification: request.industry,
          settings: orgSettings,
          created_by: request.owner_user_id,
          updated_by: request.owner_user_id
        })
        .select()
        .single()

      if (tenantError) throw tenantError

      // Create owner membership
      const { data: membership, error: membershipError } = await this.supabase
        .rpc('hera_entities_crud_v1', {
          p_action: 'CREATE',
          p_actor_user_id: request.owner_user_id,
          p_organization_id: tenantOrg.id, // Membership stored in tenant org
          p_entity: {
            entity_type: 'RELATIONSHIP',
            entity_name: 'User Membership',
            smart_code: PLATFORM_SMART_CODES.USER_MEMBER_OF_ORG,
            status: 'active'
          },
          p_dynamic: {
            role: {
              field_type: 'text',
              field_value_text: MEMBERSHIP_ROLES.OWNER,
              smart_code: 'HERA.PLATFORM.MEMBERSHIP.FIELD.ROLE.v1'
            }
          },
          p_relationships: [
            {
              from_entity_id: request.owner_user_id, // Platform user
              to_entity_id: tenantOrg.id,             // Tenant org
              relationship_type: 'USER_MEMBER_OF_ORG',
              organization_id: tenantOrg.id
            }
          ],
          p_options: {}
        })

      if (membershipError) throw membershipError

      // Load template pack
      const templatePackLoaded = await this.loadTemplatePack(tenantOrg.id, templatePackId)

      return {
        organization: {
          id: tenantOrg.id,
          entity_id: orgEntity.entity_id,
          name: request.name,
          industry: request.industry,
          settings: orgSettings
        },
        membership: {
          id: membership.entity_id,
          role: MEMBERSHIP_ROLES.OWNER
        },
        template_pack_loaded: templatePackLoaded
      }
    } catch (error) {
      console.error('Failed to create organization:', error)
      throw new Error('Organization creation failed')
    }
  }

  /**
   * Get user's organization memberships
   */
  async getUserMemberships(userId: string): Promise<OrganizationMembership[]> {
    try {
      const { data, error } = await this.supabase
        .from('core_relationships')
        .select(`
          *,
          organization:to_entity_id (
            id,
            entity_id,
            organization_name,
            organization_type,
            industry_classification,
            settings
          )
        `)
        .eq('from_entity_id', userId)
        .eq('relationship_type', 'USER_MEMBER_OF_ORG')
        .eq('is_active', true)

      if (error) throw error

      return data?.map(membership => ({
        organization_id: membership.to_entity_id,
        organization: {
          id: membership.organization.id,
          entity_id: membership.organization.entity_id,
          name: membership.organization.organization_name,
          type: membership.organization.organization_type,
          industry: membership.organization.industry_classification,
          settings: membership.organization.settings
        },
        role: membership.relationship_data?.role || MEMBERSHIP_ROLES.STAFF,
        is_active: membership.is_active,
        joined_at: membership.created_at
      })) || []
    } catch (error) {
      console.error('Failed to get user memberships:', error)
      return []
    }
  }

  /**
   * Switch user to different organization context
   */
  async switchOrganization(userId: string, orgId: string): Promise<boolean> {
    try {
      // Verify membership
      const memberships = await this.getUserMemberships(userId)
      const membership = memberships.find(m => m.organization_id === orgId)
      
      if (!membership) {
        throw new Error('User is not a member of this organization')
      }

      // Update user's current organization preference
      await this.supabase
        .rpc('hera_entities_crud_v1', {
          p_action: 'UPDATE',
          p_actor_user_id: userId,
          p_organization_id: PLATFORM_ORG_ID,
          p_entity: {
            entity_id: userId
          },
          p_dynamic: {
            current_organization_id: {
              field_type: 'text',
              field_value_text: orgId,
              smart_code: 'HERA.PLATFORM.USER.FIELD.CURRENT_ORG.v1'
            }
          },
          p_relationships: [],
          p_options: {}
        })

      return true
    } catch (error) {
      console.error('Failed to switch organization:', error)
      return false
    }
  }

  /**
   * Load template pack for organization
   */
  private async loadTemplatePack(orgId: string, templatePackId: string): Promise<boolean> {
    try {
      // For Phase 1, we'll mark template pack as loaded
      // In Phase 2, this will actually load template files from storage
      
      console.log(`Loading template pack ${templatePackId} for org ${orgId}`)
      
      // TODO: Phase 2 - Implement actual template loading
      // 1. Fetch template pack from Supabase Storage
      // 2. Validate template pack integrity  
      // 3. Cache compiled templates
      // 4. Update organization settings
      
      return true
    } catch (error) {
      console.error('Failed to load template pack:', error)
      return false
    }
  }

  /**
   * Generate organization code from name
   */
  private generateOrgCode(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 20)
  }
}

/**
 * Singleton instance
 */
export const platformOrgManager = new PlatformOrganizationManager()