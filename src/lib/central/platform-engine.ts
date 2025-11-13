/**
 * ================================================================================
 * HERA CENTRAL: Platform Management Engine
 * Smart Code: HERA.PLATFORM.CENTRAL.ENGINE.CORE.v1
 * ================================================================================
 * 
 * The brain of HERA CENTRAL - manages all platform-level operations:
 * - Organization provisioning with templates
 * - App/module installation and management  
 * - Policy and guardrail enforcement
 * - Master data configuration
 * - AI agent orchestration
 * - Health monitoring and compliance
 * 
 * Sacred Six Compliance: Uses only entities + relationships + dynamic data
 * ================================================================================
 */

import { createClient } from '@supabase/supabase-js'
import { cache } from 'react'

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface PlatformContext {
  platform_org_id: string // Always: 00000000-0000-0000-0000-000000000000
  actor_user_id: string
  request_id?: string
}

export interface OrganizationProvisioningRequest {
  organization_name: string
  industry_code: string  // RETAIL, MANUFACTURING, HEALTHCARE
  region_code: string    // GCC, EU, US, INDIA
  license_tier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  template_code?: string // Override default template
  custom_apps?: string[] // Additional apps beyond template
  custom_modules?: string[] // Additional modules beyond template
  admin_user: {
    email: string
    full_name: string
    phone?: string
  }
  organization_settings?: {
    multi_currency?: boolean
    fiscal_year_end?: string
    time_zone?: string
    locale?: string
  }
}

export interface OrganizationProvisioningResult {
  success: boolean
  organization_id?: string
  installation_id?: string
  installed_components?: {
    apps: string[]
    modules: string[] 
    policies: string[]
    overlays: string[]
  }
  admin_user_id?: string
  setup_tasks?: Array<{
    task_id: string
    name: string
    status: 'PENDING' | 'COMPLETED' | 'FAILED'
    description: string
  }>
  access_urls?: {
    admin_portal: string
    main_app: string
  }
  error?: string
  warnings?: string[]
}

export interface AppInstallationRequest {
  organization_id: string
  app_code: string
  modules?: string[] // Additional modules to install with app
  overlays?: string[] // Industry/regional overlays
  configuration?: Record<string, any>
}

export interface PolicyApplicationRequest {
  organization_id: string
  policy_bundle_code: string
  override_existing: boolean
  effective_date?: string
  custom_rules?: Record<string, any>
}

export interface MasterDataTemplate {
  template_code: string
  template_name: string
  industry_code: string
  region_code: string
  modules: string[]
  apps: string[]
  overlays: string[]
  coa_pack?: string
  dimensions: string[]
  policies: string[]
  field_configs: Record<string, any>
  security_settings: Record<string, any>
}

// =============================================================================
// PLATFORM ENGINE CLASS
// =============================================================================

export class HERAPlatformEngine {
  private supabase
  private platformOrgId = '00000000-0000-0000-0000-000000000000'
  private cache = new Map<string, any>()
  private cacheTimeout = 10 * 60 * 1000 // 10 minutes

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  // =============================================================================
  // ORGANIZATION PROVISIONING
  // =============================================================================

  /**
   * One-click organization provisioning with industry/region templates
   */
  async provisionOrganization(
    request: OrganizationProvisioningRequest,
    context: PlatformContext
  ): Promise<OrganizationProvisioningResult> {
    console.log(`[PlatformEngine] 🚀 Provisioning organization: ${request.organization_name}`)
    
    try {
      const installationId = `INSTALL_${Date.now()}`
      const startTime = Date.now()

      // 1. Resolve provisioning template
      const template = await this.resolveProvisioningTemplate(
        request.industry_code,
        request.region_code,
        request.license_tier
      )

      if (!template) {
        return {
          success: false,
          error: `No provisioning template found for ${request.industry_code}/${request.region_code}/${request.license_tier}`
        }
      }

      console.log(`[PlatformEngine] 📋 Using template: ${template.template_code}`)

      // 2. Create organization entity
      const orgResult = await this.supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: context.actor_user_id,
        p_organization_id: this.platformOrgId,
        p_entity: {
          entity_type: 'ORGANIZATION',
          entity_name: request.organization_name,
          smart_code: `HERA.PLATFORM.CENTRAL.ORG.ENTITY.${request.industry_code}.v1`
        },
        p_dynamic: {
          industry_code: {
            field_type: 'text',
            field_value_text: request.industry_code,
            smart_code: 'HERA.PLATFORM.CENTRAL.ORG.FIELD.INDUSTRY.v1'
          },
          region_code: {
            field_type: 'text',
            field_value_text: request.region_code,
            smart_code: 'HERA.PLATFORM.CENTRAL.ORG.FIELD.REGION.v1'
          },
          license_tier: {
            field_type: 'text',
            field_value_text: request.license_tier,
            smart_code: 'HERA.PLATFORM.CENTRAL.ORG.FIELD.LICENSE.v1'
          },
          template_used: {
            field_type: 'text',
            field_value_text: template.template_code,
            smart_code: 'HERA.PLATFORM.CENTRAL.ORG.FIELD.TEMPLATE.v1'
          }
        },
        p_relationships: [
          {
            target_entity_type: 'INDUSTRY_DEF',
            target_entity_code: request.industry_code,
            relationship_type: 'ORG_ASSIGNED_INDUSTRY',
            smart_code: 'HERA.PLATFORM.CENTRAL.REL.ORG.ASSIGNED.INDUSTRY.v1'
          },
          {
            target_entity_type: 'REGION_DEF',
            target_entity_code: request.region_code,
            relationship_type: 'ORG_ASSIGNED_REGION',
            smart_code: 'HERA.PLATFORM.CENTRAL.REL.ORG.ASSIGNED.REGION.v1'
          }
        ],
        p_options: {}
      })

      if (orgResult.error) {
        return { success: false, error: `Failed to create organization: ${orgResult.error.message}` }
      }

      const organizationId = orgResult.data?.id
      console.log(`[PlatformEngine] 🏢 Organization created: ${organizationId}`)

      // 3. Create admin user
      const adminResult = await this.createAdminUser(
        organizationId,
        request.admin_user,
        context
      )

      if (!adminResult.success) {
        return { success: false, error: `Failed to create admin user: ${adminResult.error}` }
      }

      // 4. Install modules from template
      const installedComponents = {
        apps: [] as string[],
        modules: [] as string[],
        policies: [] as string[],
        overlays: [] as string[]
      }

      for (const moduleCode of template.modules) {
        const result = await this.installModule(organizationId, moduleCode, context)
        if (result.success) {
          installedComponents.modules.push(moduleCode)
        } else {
          console.warn(`[PlatformEngine] ⚠️ Failed to install module ${moduleCode}:`, result.error)
        }
      }

      // 5. Install apps from template
      for (const appCode of template.apps) {
        const result = await this.installApp(organizationId, appCode, context)
        if (result.success) {
          installedComponents.apps.push(appCode)
        } else {
          console.warn(`[PlatformEngine] ⚠️ Failed to install app ${appCode}:`, result.error)
        }
      }

      // 6. Apply policy bundles
      for (const policyCode of template.policies) {
        const result = await this.applyPolicyBundle(organizationId, policyCode, context)
        if (result.success) {
          installedComponents.policies.push(policyCode)
        } else {
          console.warn(`[PlatformEngine] ⚠️ Failed to apply policy ${policyCode}:`, result.error)
        }
      }

      // 7. Enable overlays
      for (const overlayCode of template.overlays) {
        const result = await this.enableOverlay(organizationId, overlayCode, context)
        if (result.success) {
          installedComponents.overlays.push(overlayCode)
        } else {
          console.warn(`[PlatformEngine] ⚠️ Failed to enable overlay ${overlayCode}:`, result.error)
        }
      }

      // 8. Create provisioning transaction for audit trail
      await this.createProvisioningTransaction(
        organizationId,
        template.template_code,
        installedComponents,
        installationId,
        context
      )

      const completionTime = Date.now() - startTime
      console.log(`[PlatformEngine] ✅ Organization provisioned in ${completionTime}ms`)

      return {
        success: true,
        organization_id: organizationId,
        installation_id: installationId,
        installed_components: installedComponents,
        admin_user_id: adminResult.user_id,
        access_urls: {
          admin_portal: `${process.env.NEXT_PUBLIC_APP_URL}/central/orgs/${organizationId}`,
          main_app: `${process.env.NEXT_PUBLIC_APP_URL}/${template.apps[0]?.toLowerCase() || 'dashboard'}`
        }
      }

    } catch (error) {
      console.error(`[PlatformEngine] ❌ Provisioning failed:`, error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown provisioning error' 
      }
    }
  }

  /**
   * Resolve the best provisioning template for industry/region/license combination
   */
  private async resolveProvisioningTemplate(
    industryCode: string,
    regionCode: string,
    licenseTier: string
  ): Promise<MasterDataTemplate | null> {
    const cacheKey = `template_${industryCode}_${regionCode}_${licenseTier}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      // Load provisioning templates from platform org
      const { data, error } = await this.supabase.rpc('hera_entities_crud_v1', {
        p_action: 'READ',
        p_actor_user_id: null,
        p_organization_id: this.platformOrgId,
        p_entity: {
          entity_type: 'ORG_PROVISIONING_TEMPLATE'
        },
        p_dynamic: {},
        p_relationships: [],
        p_options: {
          include_dynamic: true,
          filters: {
            industry_code: industryCode,
            region_code: regionCode,
            license_tier: licenseTier
          }
        }
      })

      if (error) {
        console.error('[PlatformEngine] Error loading templates:', error)
        return null
      }

      const templates = data?.items || []
      if (templates.length === 0) {
        console.warn(`[PlatformEngine] No template found for ${industryCode}/${regionCode}/${licenseTier}`)
        return null
      }

      // Parse template data
      const template = templates[0]
      const dynamicData = template.dynamic_data || {}

      const masterTemplate: MasterDataTemplate = {
        template_code: template.entity_code || `${industryCode}_${regionCode}_${licenseTier}`,
        template_name: template.entity_name,
        industry_code: industryCode,
        region_code: regionCode,
        modules: this.parseJsonField(dynamicData.modules_included),
        apps: this.parseJsonField(dynamicData.apps_included),
        overlays: this.parseJsonField(dynamicData.overlays_included),
        coa_pack: dynamicData.coa_pack?.field_value_text,
        dimensions: this.parseJsonField(dynamicData.dimensions_default),
        policies: this.parseJsonField(dynamicData.policy_bundles_default),
        field_configs: this.parseJsonField(dynamicData.field_config_presets),
        security_settings: this.parseJsonField(dynamicData.security_settings)
      }

      this.cache.set(cacheKey, masterTemplate)
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout)

      return masterTemplate

    } catch (error) {
      console.error('[PlatformEngine] Error resolving template:', error)
      return null
    }
  }

  // =============================================================================
  // APP & MODULE MANAGEMENT
  // =============================================================================

  /**
   * Install an app in an organization
   */
  async installApp(
    organizationId: string,
    appCode: string,
    context: PlatformContext,
    options?: { modules?: string[], overlays?: string[] }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[PlatformEngine] 📱 Installing app ${appCode} in org ${organizationId}`)

      // Load app definition
      const appDef = await this.loadAppDefinition(appCode)
      if (!appDef) {
        return { success: false, error: `App definition not found: ${appCode}` }
      }

      // Create installation relationship
      await this.supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: context.actor_user_id,
        p_organization_id: this.platformOrgId,
        p_entity: {
          entity_type: 'APP_INSTALLATION',
          entity_name: `${appCode} Installation`,
          smart_code: `HERA.PLATFORM.CENTRAL.APP.INSTALL.${appCode}.v1`
        },
        p_dynamic: {
          organization_id: {
            field_type: 'text',
            field_value_text: organizationId,
            smart_code: 'HERA.PLATFORM.CENTRAL.INSTALL.FIELD.ORG.v1'
          },
          app_code: {
            field_type: 'text',
            field_value_text: appCode,
            smart_code: 'HERA.PLATFORM.CENTRAL.INSTALL.FIELD.APP.v1'
          },
          installed_at: {
            field_type: 'datetime',
            field_value_text: new Date().toISOString(),
            smart_code: 'HERA.PLATFORM.CENTRAL.INSTALL.FIELD.DATE.v1'
          }
        },
        p_relationships: [
          {
            target_entity_type: 'APP_DEF',
            target_entity_code: appCode,
            relationship_type: 'ORG_INSTALLED_APP',
            smart_code: 'HERA.PLATFORM.CENTRAL.REL.ORG.INSTALLED.APP.v1'
          }
        ],
        p_options: {}
      })

      // Install required modules
      const requiredModules = appDef.modules_required || []
      for (const moduleCode of requiredModules) {
        await this.installModule(organizationId, moduleCode, context)
      }

      console.log(`[PlatformEngine] ✅ App ${appCode} installed successfully`)
      return { success: true }

    } catch (error) {
      console.error(`[PlatformEngine] ❌ App installation failed:`, error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'App installation failed' 
      }
    }
  }

  /**
   * Install a platform module in an organization
   */
  async installModule(
    organizationId: string,
    moduleCode: string,
    context: PlatformContext
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[PlatformEngine] 🧩 Installing module ${moduleCode} in org ${organizationId}`)

      // Create installation relationship
      await this.supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: context.actor_user_id,
        p_organization_id: this.platformOrgId,
        p_entity: {
          entity_type: 'MODULE_INSTALLATION',
          entity_name: `${moduleCode} Module Installation`,
          smart_code: `HERA.PLATFORM.CENTRAL.MODULE.INSTALL.${moduleCode}.v1`
        },
        p_dynamic: {
          organization_id: {
            field_type: 'text',
            field_value_text: organizationId,
            smart_code: 'HERA.PLATFORM.CENTRAL.INSTALL.FIELD.ORG.v1'
          },
          module_code: {
            field_type: 'text',
            field_value_text: moduleCode,
            smart_code: 'HERA.PLATFORM.CENTRAL.INSTALL.FIELD.MODULE.v1'
          }
        },
        p_relationships: [
          {
            target_entity_type: 'PLATFORM_MODULE_DEF',
            target_entity_code: moduleCode,
            relationship_type: 'ORG_INSTALLED_MODULE',
            smart_code: 'HERA.PLATFORM.CENTRAL.REL.ORG.INSTALLED.MODULE.v1'
          }
        ],
        p_options: {}
      })

      return { success: true }

    } catch (error) {
      console.error(`[PlatformEngine] ❌ Module installation failed:`, error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Module installation failed' 
      }
    }
  }

  // =============================================================================
  // POLICY & GUARDRAIL MANAGEMENT  
  // =============================================================================

  /**
   * Apply a policy bundle to an organization
   */
  async applyPolicyBundle(
    organizationId: string,
    policyBundleCode: string,
    context: PlatformContext,
    options?: { override_existing?: boolean }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[PlatformEngine] 📋 Applying policy ${policyBundleCode} to org ${organizationId}`)

      // Create policy application relationship
      await this.supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: context.actor_user_id,
        p_organization_id: this.platformOrgId,
        p_entity: {
          entity_type: 'POLICY_APPLICATION',
          entity_name: `${policyBundleCode} Policy Application`,
          smart_code: `HERA.PLATFORM.CENTRAL.POLICY.APPLY.${policyBundleCode}.v1`
        },
        p_dynamic: {
          organization_id: {
            field_type: 'text',
            field_value_text: organizationId,
            smart_code: 'HERA.PLATFORM.CENTRAL.POLICY.FIELD.ORG.v1'
          },
          policy_bundle_code: {
            field_type: 'text',
            field_value_text: policyBundleCode,
            smart_code: 'HERA.PLATFORM.CENTRAL.POLICY.FIELD.CODE.v1'
          },
          applied_at: {
            field_type: 'datetime',
            field_value_text: new Date().toISOString(),
            smart_code: 'HERA.PLATFORM.CENTRAL.POLICY.FIELD.DATE.v1'
          }
        },
        p_relationships: [
          {
            target_entity_type: 'PLATFORM_POLICY_BUNDLE',
            target_entity_code: policyBundleCode,
            relationship_type: 'POLICY_ASSIGNED_TO_ORG',
            smart_code: 'HERA.PLATFORM.CENTRAL.REL.POLICY.ASSIGNED.ORG.v1'
          }
        ],
        p_options: {}
      })

      return { success: true }

    } catch (error) {
      console.error(`[PlatformEngine] ❌ Policy application failed:`, error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Policy application failed' 
      }
    }
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private async createAdminUser(
    organizationId: string,
    adminUser: { email: string; full_name: string; phone?: string },
    context: PlatformContext
  ): Promise<{ success: boolean; user_id?: string; error?: string }> {
    try {
      // Create user entity in platform org (users live in platform org)
      const userResult = await this.supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: context.actor_user_id,
        p_organization_id: this.platformOrgId,
        p_entity: {
          entity_type: 'USER',
          entity_name: adminUser.full_name,
          smart_code: 'HERA.PLATFORM.CENTRAL.USER.ENTITY.ADMIN.v1'
        },
        p_dynamic: {
          email: {
            field_type: 'text',
            field_value_text: adminUser.email,
            smart_code: 'HERA.PLATFORM.CENTRAL.USER.FIELD.EMAIL.v1'
          },
          phone: {
            field_type: 'text',
            field_value_text: adminUser.phone || '',
            smart_code: 'HERA.PLATFORM.CENTRAL.USER.FIELD.PHONE.v1'
          },
          role: {
            field_type: 'text',
            field_value_text: 'ADMIN',
            smart_code: 'HERA.PLATFORM.CENTRAL.USER.FIELD.ROLE.v1'
          }
        },
        p_relationships: [
          {
            target_entity_type: 'ORGANIZATION',
            target_entity_id: organizationId,
            relationship_type: 'USER_ADMIN_OF_ORG',
            smart_code: 'HERA.PLATFORM.CENTRAL.REL.USER.ADMIN.ORG.v1'
          }
        ],
        p_options: {}
      })

      if (userResult.error) {
        return { success: false, error: userResult.error.message }
      }

      return { success: true, user_id: userResult.data?.id }

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create admin user' 
      }
    }
  }

  private async enableOverlay(
    organizationId: string,
    overlayCode: string,
    context: PlatformContext
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Create overlay enablement relationship
      await this.supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: context.actor_user_id,
        p_organization_id: this.platformOrgId,
        p_entity: {
          entity_type: 'OVERLAY_ENABLEMENT',
          entity_name: `${overlayCode} Overlay Enablement`,
          smart_code: `HERA.PLATFORM.CENTRAL.OVERLAY.ENABLE.${overlayCode}.v1`
        },
        p_dynamic: {
          organization_id: {
            field_type: 'text',
            field_value_text: organizationId,
            smart_code: 'HERA.PLATFORM.CENTRAL.OVERLAY.FIELD.ORG.v1'
          },
          overlay_code: {
            field_type: 'text',
            field_value_text: overlayCode,
            smart_code: 'HERA.PLATFORM.CENTRAL.OVERLAY.FIELD.CODE.v1'
          }
        },
        p_relationships: [
          {
            target_entity_type: 'OVERLAY_DEF',
            target_entity_code: overlayCode,
            relationship_type: 'ORG_ENABLED_OVERLAY',
            smart_code: 'HERA.PLATFORM.CENTRAL.REL.ORG.ENABLED.OVERLAY.v1'
          }
        ],
        p_options: {}
      })

      return { success: true }

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Overlay enablement failed' 
      }
    }
  }

  private async loadAppDefinition(appCode: string): Promise<any> {
    const { data, error } = await this.supabase.rpc('hera_entities_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: null,
      p_organization_id: this.platformOrgId,
      p_entity: {
        entity_type: 'APP_DEF',
        entity_code: appCode
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: { include_dynamic: true }
    })

    if (error || !data?.items?.length) {
      return null
    }

    return data.items[0]
  }

  private async createProvisioningTransaction(
    organizationId: string,
    templateCode: string,
    installedComponents: any,
    installationId: string,
    context: PlatformContext
  ): Promise<void> {
    try {
      await this.supabase.rpc('hera_txn_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: context.actor_user_id,
        p_organization_id: this.platformOrgId,
        p_transaction: {
          transaction_type: 'PLATFORM.ORG_PROVISION',
          smart_code: 'HERA.PLATFORM.CENTRAL.TXN.ORG.PROVISION.v1',
          transaction_number: `PROV-${installationId}`,
          total_amount: 0,
          metadata: {
            target_organization_id: organizationId,
            template_used: templateCode,
            installed_components: installedComponents,
            installation_id: installationId
          }
        },
        p_lines: [],
        p_options: {}
      })
    } catch (error) {
      console.warn('[PlatformEngine] Failed to create provisioning transaction:', error)
    }
  }

  private parseJsonField(field: any): any {
    if (!field) return []
    if (typeof field === 'object' && field.field_value_json) {
      return field.field_value_json
    }
    return []
  }
}

// =============================================================================
// EXPORT SINGLETON INSTANCE
// =============================================================================

export const heraPlatformEngine = new HERAPlatformEngine()

// Cache for React Server Components
export const getCachedPlatformData = cache(
  async (dataType: string, key: string) => {
    // Implementation for cached platform data access
    return null
  }
)