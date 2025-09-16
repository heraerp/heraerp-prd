/**
 * HERA SSO Provider - SAML 2.0 and OIDC Support
 * Tenant-aware session management with smart code integration
 */

import { getSupabase } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'
import jwt from 'jsonwebtoken'

export interface SSOConfig {
  provider: 'saml' | 'oidc'
  tenant_id: string
  metadata: {
    issuer?: string
    sso_url?: string
    certificate?: string
    client_id?: string
    client_secret?: string
    discovery_url?: string
  }
  attribute_mapping: {
    email: string
    name?: string
    groups?: string
    employee_id?: string
  }
  smart_code: string
}

export interface SSOSession {
  user_id: string
  organization_id: string
  roles: string[]
  scopes: string[]
  attributes: Record<string, any>
  idp_session_id?: string
  expires_at: string
}

export class SSOProvider {
  private static instance: SSOProvider

  static getInstance(): SSOProvider {
    if (!this.instance) {
      this.instance = new SSOProvider()
    }
    return this.instance
  }

  /**
   * Store SSO configuration for a tenant
   */
  async configureSSOProvider(config: SSOConfig): Promise<string> {
    const supabase = getSupabase()

    // Store as entity with proper smart code
    const { data: entity, error: entityError } = await supabase
      .from('core_entities')
      .insert({
        id: uuidv4(),
        entity_type: 'sso_config',
        entity_name: `${config.provider.toUpperCase()} - ${config.tenant_id}`,
        entity_code: `SSO-${config.provider.toUpperCase()}-${config.tenant_id}`,
        smart_code:
          config.smart_code || `HERA.SECURITY.SSO.${config.provider.toUpperCase()}.CONFIG.v1`,
        organization_id: config.tenant_id,
        metadata: {
          provider: config.provider,
          active: true
        }
      })
      .select('id')
      .single()

    if (entityError) throw entityError

    // Store config details in dynamic data (encrypted)
    const encryptedConfig = await this.encryptSSOConfig(config.metadata)

    await supabase.from('core_dynamic_data').insert({
      id: uuidv4(),
      entity_id: entity.id,
      field_name: 'sso_metadata',
      field_value_text: encryptedConfig,
      field_type: 'encrypted_json',
      smart_code: `HERA.SECURITY.SSO.${config.provider.toUpperCase()}.METADATA.v1`,
      organization_id: config.tenant_id
    })

    // Store attribute mapping
    await supabase.from('core_dynamic_data').insert({
      id: uuidv4(),
      entity_id: entity.id,
      field_name: 'attribute_mapping',
      field_value_text: JSON.stringify(config.attribute_mapping),
      field_type: 'json',
      smart_code: `HERA.SECURITY.SSO.ATTRIBUTE.MAPPING.v1`,
      organization_id: config.tenant_id
    })

    // Log configuration
    await this.auditLog(config.tenant_id, 'sso_config_created', {
      provider: config.provider,
      config_id: entity.id
    })

    return entity.id
  }

  /**
   * Handle SAML assertion
   */
  async processSAMLAssertion(samlResponse: string, organizationId: string): Promise<SSOSession> {
    const config = await this.getActiveConfig(organizationId, 'saml')
    if (!config) throw new Error('No active SAML configuration found')

    // Validate SAML assertion
    const assertion = await this.validateSAMLAssertion(samlResponse, config)

    // Extract attributes
    const attributes = this.extractSAMLAttributes(assertion, config.attribute_mapping)

    // Get or create user
    const user = await this.getOrCreateUser(attributes.email, organizationId, attributes)

    // Get roles and scopes from groups
    const { roles, scopes } = await this.mapGroupsToRolesAndScopes(
      attributes.groups || [],
      organizationId
    )

    // Create session
    const session: SSOSession = {
      user_id: user.id,
      organization_id: organizationId,
      roles,
      scopes,
      attributes,
      idp_session_id: assertion.sessionId,
      expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours
    }

    // Store session
    await this.storeSession(session)

    // Audit log
    await this.auditLog(organizationId, 'sso_login', {
      provider: 'saml',
      user_id: user.id,
      roles
    })

    return session
  }

  /**
   * Handle OIDC callback
   */
  async processOIDCCallback(
    code: string,
    state: string,
    organizationId: string
  ): Promise<SSOSession> {
    const config = await this.getActiveConfig(organizationId, 'oidc')
    if (!config) throw new Error('No active OIDC configuration found')

    // Exchange code for tokens
    const tokens = await this.exchangeOIDCCode(code, config)

    // Validate ID token
    const claims = await this.validateIDToken(tokens.id_token, config)

    // Extract attributes
    const attributes = this.mapOIDCClaims(claims, config.attribute_mapping)

    // Get or create user
    const user = await this.getOrCreateUser(attributes.email, organizationId, attributes)

    // Get roles and scopes
    const { roles, scopes } = await this.mapGroupsToRolesAndScopes(
      attributes.groups || [],
      organizationId
    )

    // Create session
    const session: SSOSession = {
      user_id: user.id,
      organization_id: organizationId,
      roles,
      scopes,
      attributes,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    }

    // Store session with refresh token
    await this.storeSession(session, tokens.refresh_token)

    // Audit log
    await this.auditLog(organizationId, 'sso_login', {
      provider: 'oidc',
      user_id: user.id,
      roles
    })

    return session
  }

  /**
   * Get or create user with Just-In-Time provisioning
   */
  private async getOrCreateUser(
    email: string,
    organizationId: string,
    attributes: Record<string, any>
  ): Promise<any> {
    const supabase = getSupabase()

    // Check if user exists
    const { data: existing } = await supabase
      .from('core_entities')
      .select('id')
      .eq('entity_type', 'user')
      .eq('entity_code', email)
      .eq('organization_id', organizationId)
      .single()

    if (existing) return existing

    // Create new user entity
    const { data: user, error } = await supabase
      .from('core_entities')
      .insert({
        id: uuidv4(),
        entity_type: 'user',
        entity_name: attributes.name || email,
        entity_code: email,
        smart_code: 'HERA.SECURITY.USER.SSO.v1',
        organization_id: organizationId,
        metadata: {
          provisioned_by: 'sso',
          provisioned_at: new Date().toISOString()
        }
      })
      .select('id')
      .single()

    if (error) throw error

    // Store additional attributes
    for (const [key, value] of Object.entries(attributes)) {
      if (key !== 'email' && value) {
        await supabase.from('core_dynamic_data').insert({
          id: uuidv4(),
          entity_id: user.id,
          field_name: key,
          field_value_text: String(value),
          field_type: 'text',
          smart_code: `HERA.SECURITY.USER.ATTRIBUTE.${key.toUpperCase()}.v1`,
          organization_id: organizationId
        })
      }
    }

    return user
  }

  /**
   * Map groups to roles and scopes
   */
  private async mapGroupsToRolesAndScopes(
    groups: string[],
    organizationId: string
  ): Promise<{ roles: string[]; scopes: string[] }> {
    const supabase = getSupabase()

    // Get role mappings
    const { data: mappings } = await supabase
      .from('core_entities')
      .select(
        `
        *,
        core_dynamic_data!inner(field_name, field_value_text)
      `
      )
      .eq('entity_type', 'role_mapping')
      .eq('organization_id', organizationId)
      .in('entity_code', groups)

    const roles: string[] = []
    const scopes: string[] = []

    mappings?.forEach(mapping => {
      const roleData = mapping.core_dynamic_data?.find((d: any) => d.field_name === 'role')
      const scopeData = mapping.core_dynamic_data?.find((d: any) => d.field_name === 'scopes')

      if (roleData?.field_value_text) {
        roles.push(roleData.field_value_text)
      }
      if (scopeData?.field_value_text) {
        scopes.push(...JSON.parse(scopeData.field_value_text))
      }
    })

    // Default role if none assigned
    if (roles.length === 0) {
      roles.push('USER')
      scopes.push('read:own')
    }

    return { roles: [...new Set(roles)], scopes: [...new Set(scopes)] }
  }

  /**
   * Store session in universal tables
   */
  private async storeSession(session: SSOSession, refreshToken?: string): Promise<void> {
    const supabase = getSupabase()

    // Create session transaction
    const sessionData = {
      id: uuidv4(),
      transaction_type: 'session_create',
      transaction_date: new Date().toISOString(),
      total_amount: 0,
      smart_code: 'HERA.SECURITY.SESSION.CREATE.v1',
      organization_id: session.organization_id,
      metadata: {
        user_id: session.user_id,
        roles: session.roles,
        scopes: session.scopes,
        expires_at: session.expires_at,
        idp_session_id: session.idp_session_id
      }
    }

    const { data: txn } = await supabase
      .from('universal_transactions')
      .insert(sessionData)
      .select('id')
      .single()

    // Store refresh token if provided
    if (refreshToken && txn) {
      await supabase.from('core_dynamic_data').insert({
        id: uuidv4(),
        entity_id: session.user_id,
        field_name: 'refresh_token',
        field_value_text: await this.encryptToken(refreshToken),
        field_type: 'encrypted_text',
        smart_code: 'HERA.SECURITY.TOKEN.REFRESH.v1',
        organization_id: session.organization_id,
        metadata: {
          session_id: txn.id,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      })
    }
  }

  /**
   * Get active SSO configuration
   */
  private async getActiveConfig(organizationId: string, provider: 'saml' | 'oidc'): Promise<any> {
    const supabase = getSupabase()

    const { data: configs } = await supabase
      .from('core_entities')
      .select(
        `
        *,
        core_dynamic_data!inner(field_name, field_value_text)
      `
      )
      .eq('entity_type', 'sso_config')
      .eq('organization_id', organizationId)
      .eq('metadata->>provider', provider)
      .eq('metadata->>active', true)
      .single()

    if (!configs) return null

    // Decrypt metadata
    const metadataField = configs.core_dynamic_data?.find(
      (d: any) => d.field_name === 'sso_metadata'
    )
    const mappingField = configs.core_dynamic_data?.find(
      (d: any) => d.field_name === 'attribute_mapping'
    )

    return {
      ...configs,
      metadata: await this.decryptSSOConfig(metadataField?.field_value_text),
      attribute_mapping: JSON.parse(mappingField?.field_value_text || '{}')
    }
  }

  /**
   * Audit log helper
   */
  private async auditLog(organizationId: string, action: string, details: any): Promise<void> {
    const supabase = getSupabase()

    await supabase.from('universal_transactions').insert({
      id: uuidv4(),
      transaction_type: 'audit',
      transaction_date: new Date().toISOString(),
      total_amount: 0,
      smart_code: `HERA.SECURITY.AUDIT.${action.toUpperCase()}.v1`,
      organization_id: organizationId,
      metadata: {
        action,
        details,
        timestamp: new Date().toISOString()
      }
    })
  }

  // Placeholder encryption methods - implement with actual KMS
  private async encryptSSOConfig(config: any): Promise<string> {
    // TODO: Implement with KMS
    return Buffer.from(JSON.stringify(config)).toString('base64')
  }

  private async decryptSSOConfig(encrypted: string): Promise<any> {
    // TODO: Implement with KMS
    return JSON.parse(Buffer.from(encrypted, 'base64').toString())
  }

  private async encryptToken(token: string): Promise<string> {
    // TODO: Implement with KMS
    return Buffer.from(token).toString('base64')
  }

  // Placeholder validation methods
  private async validateSAMLAssertion(samlResponse: string, config: any): Promise<any> {
    // TODO: Implement SAML validation
    return { sessionId: 'mock-session-id' }
  }

  private extractSAMLAttributes(assertion: any, mapping: any): Record<string, any> {
    // TODO: Implement attribute extraction
    return { email: 'user@example.com' }
  }

  private async exchangeOIDCCode(code: string, config: any): Promise<any> {
    // TODO: Implement OIDC code exchange
    return { id_token: 'mock-token', expires_in: 3600 }
  }

  private async validateIDToken(token: string, config: any): Promise<any> {
    // TODO: Implement ID token validation
    return { email: 'user@example.com' }
  }

  private mapOIDCClaims(claims: any, mapping: any): Record<string, any> {
    // TODO: Implement claim mapping
    return { email: claims.email }
  }
}

export const ssoProvider = SSOProvider.getInstance()
