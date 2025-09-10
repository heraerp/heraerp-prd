/**
 * 🚀 HERA Provisioning Service
 * 
 * Handles tenant provisioning and setup
 * - Organization creation
 * - Subdomain assignment
 * - Module installation
 * - Initial data setup
 */

import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { universalApi } from '@/lib/universal-api'
import { entitlementsService } from './entitlements'
import { UniversalCOATemplateGenerator } from '@/lib/coa/universal-coa-template'
import { createFurnitureDemoData } from '@/lib/demo-data/furniture-demo'

export interface ProvisioningRequest {
  organizationName: string
  organizationCode: string
  subdomain: string
  industryType: 'restaurant' | 'healthcare' | 'salon' | 'retail' | 'manufacturing' | 'professional_services' | 'furniture'
  country?: string
  ownerEmail: string
  ownerName: string
  modules: string[] // Smart codes of modules to install
  trialDays?: number
}

export interface ProvisioningResult {
  success: boolean
  organizationId?: string
  subdomain?: string
  modules?: string[]
  error?: string
  details?: {
    organization?: any
    owner?: any
    chartOfAccounts?: any
    initialData?: any
  }
}

export class ProvisioningService {
  private supabase: any

  constructor() {
    // Initialize on demand
  }

  private async getSupabase() {
    if (!this.supabase) {
      const cookieStore = await cookies()
      this.supabase = createClient(cookieStore)
    }
    return this.supabase
  }

  /**
   * Provision a new tenant
   */
  async provisionTenant(request: ProvisioningRequest): Promise<ProvisioningResult> {
    try {
      const supabase = await this.getSupabase()

      // 1. Validate subdomain availability
      const subdomainAvailable = await this.checkSubdomainAvailability(request.subdomain)
      if (!subdomainAvailable) {
        return { 
          success: false, 
          error: `Subdomain '${request.subdomain}' is already taken` 
        }
      }

      // 2. Create organization
      const { data: organization, error: orgError } = await supabase
        .from('core_organizations')
        .insert({
          organization_name: request.organizationName,
          organization_code: request.organizationCode,
          organization_type: 'tenant',
          industry_classification: request.industryType,
          settings: {
            country: request.country || 'US',
            currency: this.getDefaultCurrency(request.country || 'US'),
            timezone: this.getDefaultTimezone(request.country || 'US'),
            trial_days: request.trialDays || 30,
            trial_start: new Date().toISOString()
          },
          status: 'active'
        })
        .select()
        .single()

      if (orgError || !organization) {
        console.error('[Provisioning] Error creating organization:', orgError)
        return { success: false, error: 'Failed to create organization' }
      }

      const organizationId = organization.id

      // 3. Store subdomain in dynamic data
      await supabase
        .from('core_dynamic_data')
        .insert({
          organization_id: organizationId,
          entity_id: organizationId,
          field_name: 'subdomain',
          field_type: 'text',
          field_value_text: request.subdomain,
          smart_code: 'HERA.TENANT.SUBDOMAIN.v1',
          is_system_field: true
        })

      // 4. Create owner entity
      const { data: owner, error: ownerError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'employee',
          entity_name: request.ownerName,
          entity_code: `EMP-OWNER-${Date.now()}`,
          smart_code: 'HERA.HR.EMPLOYEE.OWNER.v1',
          metadata: {
            email: request.ownerEmail,
            role: 'owner',
            is_primary_contact: true
          }
        })
        .select()
        .single()

      if (ownerError) {
        console.error('[Provisioning] Error creating owner:', ownerError)
      }

      // 5. Store owner email
      if (owner) {
        await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: organizationId,
            entity_id: owner.id,
            field_name: 'email',
            field_type: 'text',
            field_value_text: request.ownerEmail,
            smart_code: 'HERA.CONTACT.EMAIL.v1'
          })
      }

      // 6. Grant core modules (always included)
      const coreModules = ['HERA.CORE.ENTITIES.MODULE.v1', 'HERA.CORE.TRANSACTIONS.MODULE.v1', 'HERA.CORE.ACCOUNTING.MODULE.v1']
      for (const moduleCode of coreModules) {
        await entitlementsService.grantModuleAccess({
          organizationId,
          moduleSmartCode: moduleCode,
          grantedBy: 'system',
          trialDays: request.trialDays
        })
      }

      // 7. Grant requested modules
      for (const moduleCode of request.modules) {
        await entitlementsService.grantModuleAccess({
          organizationId,
          moduleSmartCode: moduleCode,
          grantedBy: request.ownerEmail,
          trialDays: request.trialDays
        })
      }

      // 8. Setup Chart of Accounts
      universalApi.setOrganizationId(organizationId)
      const coaResult = await this.setupChartOfAccounts(organizationId, request.industryType, request.country || 'US')

      // 9. Create initial data based on industry
      const initialData = await this.createIndustrySpecificData(organizationId, request.industryType)

      // 10. Cache will be cleared automatically on next request

      return {
        success: true,
        organizationId,
        subdomain: request.subdomain,
        modules: [...coreModules, ...request.modules],
        details: {
          organization,
          owner,
          chartOfAccounts: coaResult,
          initialData
        }
      }

    } catch (error) {
      console.error('[Provisioning] Error:', error)
      return { 
        success: false, 
        error: 'Provisioning failed',
        details: { error }
      }
    }
  }

  /**
   * Check if subdomain is available
   */
  async checkSubdomainAvailability(subdomain: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()

      // Reserved subdomains
      const reserved = ['www', 'app', 'api', 'admin', 'auth', 'demo', 'test', 'staging', 'production']
      if (reserved.includes(subdomain)) return false

      // Check if already taken
      const { data, error } = await supabase
        .from('core_dynamic_data')
        .select('id')
        .eq('field_name', 'subdomain')
        .eq('field_value_text', subdomain)
        .single()

      return !data && !error
    } catch (error) {
      return false
    }
  }

  /**
   * Setup Chart of Accounts
   */
  private async setupChartOfAccounts(organizationId: string, industry: string, country: string) {
    try {
      const generator = new UniversalCOATemplateGenerator()
      const accounts = await generator.generateTemplate(country, industry)

      // Create GL accounts as entities
      for (const account of accounts) {
        await universalApi.createEntity({
          organization_id: organizationId,
          entity_type: 'gl_account',
          entity_name: account.account_name,
          entity_code: account.account_code,
          smart_code: `HERA.GL.${account.account_category}.${account.account_type}.v1`,
          metadata: {
            account_category: account.account_category,
            account_type: account.account_type,
            is_header: account.is_header,
            normal_balance: account.normal_balance,
            parent_code: account.parent_account_code || null
          }
        })

        // Add IFRS lineage
        if (account.account_code) {
          await universalApi.setDynamicField(
            account.account_code,
            'ifrs_classification',
            account.ifrs_classification || ''
          )
        }
      }

      return { accountsCreated: accounts.length }
    } catch (error) {
      console.error('[Provisioning] Error setting up COA:', error)
      return { error: 'Failed to setup Chart of Accounts' }
    }
  }

  /**
   * Create initial industry-specific data
   */
  private async createIndustrySpecificData(organizationId: string, industry: string) {
    const data: any = {
      entities: [],
      settings: {}
    }

    switch (industry) {
      case 'restaurant':
        // Create sample menu items
        const menuItems = [
          { name: 'Margherita Pizza', price: 12.99, category: 'Pizza' },
          { name: 'Caesar Salad', price: 8.99, category: 'Salad' },
          { name: 'Tiramisu', price: 6.99, category: 'Dessert' }
        ]
        
        for (const item of menuItems) {
          const entity = await universalApi.createEntity({
            organization_id: organizationId,
            entity_type: 'product',
            entity_name: item.name,
            smart_code: 'HERA.REST.MENU.ITEM.v1',
            metadata: { category: item.category }
          })
          
          if (entity.id) {
            await universalApi.setDynamicField(entity.id, 'price', item.price)
            data.entities.push(entity)
          }
        }
        break

      case 'salon':
        // Create sample services
        const services = [
          { name: 'Haircut & Style', price: 45.00, duration: 45 },
          { name: 'Hair Color', price: 85.00, duration: 120 },
          { name: 'Manicure', price: 35.00, duration: 30 }
        ]
        
        for (const service of services) {
          const entity = await universalApi.createEntity({
            organization_id: organizationId,
            entity_type: 'service',
            entity_name: service.name,
            smart_code: 'HERA.SALON.SERVICE.v1',
            metadata: { duration_minutes: service.duration }
          })
          
          if (entity.id) {
            await universalApi.setDynamicField(entity.id, 'price', service.price)
            data.entities.push(entity)
          }
        }
        break

      case 'healthcare':
        // Create sample appointment types
        const appointmentTypes = [
          { name: 'General Consultation', duration: 30, code: 'CONSULT' },
          { name: 'Annual Physical', duration: 60, code: 'PHYSICAL' },
          { name: 'Follow-up Visit', duration: 15, code: 'FOLLOWUP' }
        ]
        
        for (const appt of appointmentTypes) {
          const entity = await universalApi.createEntity({
            organization_id: organizationId,
            entity_type: 'appointment_type',
            entity_name: appt.name,
            entity_code: appt.code,
            smart_code: 'HERA.HEALTH.APPT.TYPE.v1',
            metadata: { duration_minutes: appt.duration }
          })
          
          data.entities.push(entity)
        }
        break

      case 'furniture':
        // Create comprehensive furniture demo data
        const result = await createFurnitureDemoData(organizationId)
        if (result.success) {
          data.entities.push({ type: 'furniture_demo', message: 'Complete furniture manufacturing data created' })
          data.settings = { 
            default_gst_rate: 0.18,
            state_code: '32', // Kerala
            financial_year: `${new Date().getFullYear()}-${(new Date().getFullYear() + 1) % 100}`,
            inventory_valuation: 'FIFO'
          }
        }
        break
    }

    return data
  }

  /**
   * Get default currency for country
   */
  private getDefaultCurrency(country: string): string {
    const currencyMap: Record<string, string> = {
      'US': 'USD',
      'CA': 'CAD',
      'GB': 'GBP',
      'EU': 'EUR',
      'AU': 'AUD',
      'AE': 'AED',
      'IN': 'INR',
      'CN': 'CNY',
      'JP': 'JPY',
      'SG': 'SGD',
      'HK': 'HKD'
    }
    return currencyMap[country] || 'USD'
  }

  /**
   * Get default timezone for country
   */
  private getDefaultTimezone(country: string): string {
    const timezoneMap: Record<string, string> = {
      'US': 'America/New_York',
      'CA': 'America/Toronto',
      'GB': 'Europe/London',
      'EU': 'Europe/Berlin',
      'AU': 'Australia/Sydney',
      'AE': 'Asia/Dubai',
      'IN': 'Asia/Kolkata',
      'CN': 'Asia/Shanghai',
      'JP': 'Asia/Tokyo',
      'SG': 'Asia/Singapore',
      'HK': 'Asia/Hong_Kong'
    }
    return timezoneMap[country] || 'UTC'
  }

  /**
   * Deprovision tenant (soft delete)
   */
  async deprovisionTenant(organizationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await this.getSupabase()

      // Soft delete by marking as inactive
      const { error } = await supabase
        .from('core_organizations')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString(),
          settings: supabase.rpc('jsonb_merge', {
            target: 'settings',
            source: { deprovisioned_at: new Date().toISOString() }
          })
        })
        .eq('id', organizationId)

      if (error) {
        return { success: false, error: 'Failed to deprovision tenant' }
      }

      // Clear cache
      const { data: subdomainData } = await supabase
        .from('core_dynamic_data')
        .select('field_value_text')
        .eq('entity_id', organizationId)
        .eq('field_name', 'subdomain')
        .single()

      // Cache will be cleared automatically on next request

      return { success: true }
    } catch (error) {
      console.error('[Provisioning] Error deprovisioning:', error)
      return { success: false, error: 'Failed to deprovision tenant' }
    }
  }
}

export const provisioningService = new ProvisioningService()