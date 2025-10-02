// src/lib/universal/smart-code-engine.ts
// HERA Smart Code Engine - The DNA Decoder
// Parses smart codes, loads UCR rules, procedures, and playbooks from database

import { createClient } from '@supabase/supabase-js';
import { guardSmartCode, parseSmartCode, type SmartCodeParts } from './guardrails';
import type { Database } from '@/types/supabase';

// ================================================================================
// TYPES
// ================================================================================

export interface UCRRule {
  id: string;
  rule_name: string;
  rule_type: 'validation' | 'calculation' | 'derivation' | 'workflow' | 'approval';
  smart_code: string;
  rule_definition: {
    conditions?: any[];
    actions?: any[];
    formula?: string;
    validations?: any[];
  };
  is_active: boolean;
  version: number;
  organization_id?: string;
}

export interface Procedure {
  id: string;
  procedure_name: string;
  smart_code: string;
  procedure_type: 'create' | 'update' | 'delete' | 'calculate' | 'post' | 'close';
  database_function: string; // Name of the Postgres function to call
  parameters: {
    [key: string]: {
      type: string;
      required: boolean;
      description: string;
    };
  };
  returns: string;
  is_active: boolean;
  version: number;
}

export interface Playbook {
  id: string;
  playbook_name: string;
  smart_code: string;
  description: string;
  steps: PlaybookStep[];
  on_error: 'rollback' | 'continue' | 'skip';
  is_active: boolean;
  version: number;
}

export interface PlaybookStep {
  step_number: number;
  step_name: string;
  procedure_id: string;
  procedure_smart_code: string;
  parameters: Record<string, any>;
  on_error: 'fail' | 'continue' | 'retry';
  retry_count?: number;
}

export interface SmartCodeContext {
  smartCode: string;
  parsed: SmartCodeParts;
  rules: UCRRule[];
  procedures: Procedure[];
  playbooks: Playbook[];
  metadata: {
    organizationId: string;
    industry?: string;
    module?: string;
    entityType?: string;
    cached: boolean;
    loadedAt: Date;
  };
}

// ================================================================================
// SMART CODE ENGINE CLASS
// ================================================================================

export class SmartCodeEngine {
  private supabase;
  private cache: Map<string, SmartCodeContext>;
  private cacheTimeout: number;

  /**
   * Create a Smart Code Engine instance
   * 
   * IMPORTANT: For server-side use with RLS, pass a Supabase client
   * created with the service role key, not the anon key.
   * 
   * @param supabaseUrl - Supabase project URL
   * @param supabaseKey - Use SUPABASE_SERVICE_ROLE_KEY for server-side operations
   * @param options - Configuration options
   */
  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    options: { cacheTimeout?: number } = {}
  ) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 300000; // 5 minutes default
  }

  /**
   * Generate cache key with org isolation
   */
  private getCacheKey(smartCode: string, organizationId: string): string {
    return `${smartCode}:${organizationId}`;
  }

  /**
   * Parse and load complete context for a smart code
   */
  async loadSmartCode(
    smartCode: string,
    organizationId: string,
    options: { forceRefresh?: boolean } = {}
  ): Promise<SmartCodeContext> {
    // Check cache first with org isolation
    const cacheKey = this.getCacheKey(smartCode, organizationId);
    
    if (!options.forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      const age = Date.now() - cached.metadata.loadedAt.getTime();
      
      if (age < this.cacheTimeout) {
        return cached;
      }
    }

    // Validate smart code format
    guardSmartCode(smartCode);
    const parsed = parseSmartCode(smartCode);

    // Load all components in parallel
    const [rules, procedures, playbooks] = await Promise.all([
      this.loadUCRRules(smartCode, organizationId),
      this.loadProcedures(smartCode, organizationId),
      this.loadPlaybooks(smartCode, organizationId),
    ]);

    // Build context
    const context: SmartCodeContext = {
      smartCode,
      parsed,
      rules,
      procedures,
      playbooks,
      metadata: {
        organizationId,
        industry: parsed.segments[0],
        module: parsed.segments[1],
        entityType: parsed.segments.length > 3 ? parsed.segments[3] : undefined,
        cached: false,
        loadedAt: new Date(),
      },
    };

    // Cache it with org isolation
    this.cache.set(cacheKey, context);

    return context;
  }

  /**
   * Load UCR rules for a smart code
   */
  private async loadUCRRules(
    smartCode: string,
    organizationId: string
  ): Promise<UCRRule[]> {
    // Try to load UCR bundle first
    const bundle = await this.loadUCRBundle(smartCode, organizationId);
    
    if (bundle && bundle.rules) {
      // Convert UCR bundle format to internal UCRRule format
      const rules: UCRRule[] = [];
      
      // Create validation rules from field definitions
      if (bundle.rules.fields) {
        rules.push({
          id: `${smartCode}-validation`,
          rule_name: 'Field Validation Rules',
          rule_type: 'validation',
          smart_code: smartCode,
          rule_definition: {
            validations: bundle.rules.fields
          },
          is_active: true,
          version: parseInt(bundle.version.replace('v', '')) || 1,
          organization_id: organizationId
        });
      }
      
      // Add other rule types from bundle
      if (bundle.rules.transforms) {
        rules.push({
          id: `${smartCode}-transforms`,
          rule_name: 'Transform Rules',
          rule_type: 'derivation',
          smart_code: smartCode,
          rule_definition: {
            transforms: bundle.rules.transforms
          },
          is_active: true,
          version: parseInt(bundle.version.replace('v', '')) || 1,
          organization_id: organizationId
        });
      }
      
      return rules;
    }
    
    // Fallback to legacy method of loading from core_dynamic_data
    const { data, error } = await this.supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('field_name', 'ucr_rule')
      .eq('smart_code', smartCode)
      .not('field_value_json', 'is', null);

    if (error) {
      console.error('[SmartCodeEngine] Error loading UCR rules:', error);
      return [];
    }

    // Parse rule definitions from field_value_json
    const rules: UCRRule[] = (data || []).map((row) => ({
      id: row.id,
      rule_name: row.ai_enhanced_value || 'Unnamed Rule',
      rule_type: this.inferRuleType(row.field_value_json),
      smart_code: row.smart_code!,
      rule_definition: row.field_value_json as any,
      is_active: row.validation_status === 'valid',
      version: row.version || 1,
      organization_id: row.organization_id,
    }));

    return rules;
  }
  
  /**
   * Load UCR bundle
   */
  private async loadUCRBundle(
    smartCode: string,
    organizationId: string
  ): Promise<any | null> {
    // Import dynamically to avoid circular dependency
    const { loadUCRBundle } = await import('./ucr-loader');
    return loadUCRBundle(smartCode, organizationId);
  }

  /**
   * Load procedures for a smart code
   */
  private async loadProcedures(
    smartCode: string,
    organizationId: string
  ): Promise<Procedure[]> {
    // Procedures are stored as entities with entity_type = 'procedure'
    const { data, error } = await this.supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'procedure')
      .eq('smart_code', smartCode)
      .eq('status', 'active');

    if (error) {
      console.error('[SmartCodeEngine] Error loading procedures:', error);
      return [];
    }

    // Parse procedure definitions from business_rules
    const procedures: Procedure[] = (data || []).map((row) => ({
      id: row.id,
      procedure_name: row.entity_name,
      smart_code: row.smart_code!,
      procedure_type: this.inferProcedureType(row.business_rules),
      database_function: row.business_rules?.database_function || row.entity_code || '',
      parameters: row.business_rules?.parameters || {},
      returns: row.business_rules?.returns || 'void',
      is_active: row.status === 'active',
      version: row.version || 1,
    }));

    return procedures;
  }

  /**
   * Load playbooks for a smart code
   */
  private async loadPlaybooks(
    smartCode: string,
    organizationId: string
  ): Promise<Playbook[]> {
    // Playbooks are stored as entities with entity_type = 'playbook'
    const { data, error } = await this.supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'playbook')
      .eq('smart_code', smartCode)
      .eq('status', 'active');

    if (error) {
      console.error('[SmartCodeEngine] Error loading playbooks:', error);
      return [];
    }

    // Parse playbook definitions from business_rules
    const playbooks: Playbook[] = (data || []).map((row) => ({
      id: row.id,
      playbook_name: row.entity_name,
      smart_code: row.smart_code!,
      description: row.entity_description || '',
      steps: row.business_rules?.steps || [],
      on_error: row.business_rules?.on_error || 'rollback',
      is_active: row.status === 'active',
      version: row.version || 1,
    }));

    return playbooks;
  }

  /**
   * Get validation rules for a smart code
   */
  async getValidationRules(
    smartCode: string,
    organizationId: string
  ): Promise<UCRRule[]> {
    const context = await this.loadSmartCode(smartCode, organizationId);
    return context.rules.filter((r) => r.rule_type === 'validation');
  }

  /**
   * Get calculation rules for a smart code
   */
  async getCalculationRules(
    smartCode: string,
    organizationId: string
  ): Promise<UCRRule[]> {
    const context = await this.loadSmartCode(smartCode, organizationId);
    return context.rules.filter((r) => r.rule_type === 'calculation');
  }

  /**
   * Get derivation rules (for account derivation, etc.)
   */
  async getDerivationRules(
    smartCode: string,
    organizationId: string
  ): Promise<UCRRule[]> {
    const context = await this.loadSmartCode(smartCode, organizationId);
    return context.rules.filter((r) => r.rule_type === 'derivation');
  }

  /**
   * Execute a procedure by name or smart code
   */
  async executeProcedure(
    procedureNameOrSmartCode: string,
    smartCode: string,
    parameters: Record<string, any>,
    organizationId: string
  ): Promise<any> {
    const context = await this.loadSmartCode(smartCode, organizationId);
    
    // Try to find by name first, then by smart code
    let procedure = context.procedures.find((p) => p.procedure_name === procedureNameOrSmartCode);
    
    if (!procedure) {
      procedure = context.procedures.find((p) => p.smart_code === procedureNameOrSmartCode);
    }

    if (!procedure) {
      throw new Error(
        `Procedure "${procedureNameOrSmartCode}" not found for smart code ${smartCode}`
      );
    }

    if (!procedure.is_active) {
      throw new Error(`Procedure "${procedureNameOrSmartCode}" is not active`);
    }

    // Auto-inject organizationId and smartCode into parameters
    const enrichedParameters = {
      p_organization_id: organizationId,
      p_smart_code: smartCode,
      ...parameters,
    };

    // Validate parameters
    this.validateProcedureParameters(procedure, enrichedParameters);

    // Set RLS context before calling procedure
    await this.setRLSContext(organizationId);

    // Call the database function
    const { data, error } = await this.supabase.rpc(
      procedure.database_function,
      enrichedParameters
    );

    if (error) {
      throw new Error(`Procedure execution failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Execute a playbook
   */
  async executePlaybook(
    playbookName: string,
    smartCode: string,
    initialParameters: Record<string, any>,
    organizationId: string
  ): Promise<{
    success: boolean;
    results: any[];
    errors: any[];
  }> {
    const context = await this.loadSmartCode(smartCode, organizationId);
    const playbook = context.playbooks.find((p) => p.playbook_name === playbookName);

    if (!playbook) {
      throw new Error(`Playbook "${playbookName}" not found for smart code ${smartCode}`);
    }

    if (!playbook.is_active) {
      throw new Error(`Playbook "${playbookName}" is not active`);
    }

    const results: any[] = [];
    const errors: any[] = [];
    let success = true;

    // Execute steps in order
    for (const step of playbook.steps.sort((a, b) => a.step_number - b.step_number)) {
      try {
        // Merge initial parameters with step-specific parameters
        const stepParams = {
          ...initialParameters,
          ...step.parameters,
        };

        // Call executeProcedure with procedure_smart_code
        // executeProcedure now supports lookup by smart_code
        const result = await this.executeProcedure(
          step.procedure_smart_code,  // Will be looked up by smart_code
          step.procedure_smart_code,  // Context smart code for loading
          stepParams,
          organizationId
        );

        results.push({
          step: step.step_number,
          name: step.step_name,
          result,
        });
      } catch (error: any) {
        errors.push({
          step: step.step_number,
          name: step.step_name,
          error: error.message,
        });

        // Handle error based on step configuration
        if (step.on_error === 'fail') {
          success = false;
          break;
        } else if (step.on_error === 'retry' && step.retry_count) {
          // Implement retry logic here
          console.warn(`[Playbook] Retry not implemented for step ${step.step_number}`);
        }
        // If 'continue', just keep going
      }
    }

    return {
      success,
      results,
      errors,
    };
  }

  /**
   * Clear cache for a specific smart code (optionally org-scoped) or all cache
   */
  clearCache(smartCode?: string, organizationId?: string): void {
    if (smartCode && organizationId) {
      const cacheKey = this.getCacheKey(smartCode, organizationId);
      this.cache.delete(cacheKey);
    } else if (smartCode) {
      // Clear all entries for this smart code across all orgs
      const keysToDelete: string[] = [];
      for (const key of this.cache.keys()) {
        if (key.startsWith(smartCode + ':')) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    entries: string[];
  } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }

  // ================================================================================
  // PRIVATE HELPERS
  // ================================================================================

  /**
   * Set RLS context for multi-tenant isolation
   */
  private async setRLSContext(organizationId: string): Promise<void> {
    try {
      await this.supabase.rpc('hera_set_context', {
        p_org: organizationId,
        p_app: null,
      });
    } catch (error) {
      console.warn('[SmartCodeEngine] Could not set RLS context:', error);
      // Don't fail if context function doesn't exist yet
    }
  }

  private inferRuleType(ruleDefinition: any): UCRRule['rule_type'] {
    if (ruleDefinition?.validations) return 'validation';
    if (ruleDefinition?.formula || ruleDefinition?.calculation) return 'calculation';
    if (ruleDefinition?.derive || ruleDefinition?.derivation) return 'derivation';
    if (ruleDefinition?.workflow) return 'workflow';
    if (ruleDefinition?.approval) return 'approval';
    return 'validation';
  }

  private inferProcedureType(businessRules: any): Procedure['procedure_type'] {
    const type = businessRules?.procedure_type;
    if (type && ['create', 'update', 'delete', 'calculate', 'post', 'close'].includes(type)) {
      return type;
    }
    return 'create';
  }

  private validateProcedureParameters(
    procedure: Procedure,
    parameters: Record<string, any>
  ): void {
    for (const [paramName, paramDef] of Object.entries(procedure.parameters)) {
      if (paramDef.required && !(paramName in parameters)) {
        throw new Error(
          `Missing required parameter "${paramName}" for procedure ${procedure.procedure_name}`
        );
      }
    }
  }
}

// ================================================================================
// FACTORY FUNCTION
// ================================================================================

let engineInstance: SmartCodeEngine | null = null;

/**
 * Get or create SmartCodeEngine singleton
 * 
 * IMPORTANT: For server-side API routes, explicitly pass the service role key:
 * 
 * const engine = getSmartCodeEngine(
 *   process.env.NEXT_PUBLIC_SUPABASE_URL,
 *   process.env.SUPABASE_SERVICE_ROLE_KEY  // Use service key, not anon key
 * );
 */
export function getSmartCodeEngine(
  supabaseUrl?: string,
  supabaseKey?: string
): SmartCodeEngine {
  if (!engineInstance) {
    // Default to anon key for client-side, but warn if service key not used server-side
    const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!url || !key) {
      throw new Error('Supabase URL and key are required for SmartCodeEngine');
    }

    engineInstance = new SmartCodeEngine(url, key);
  }

  return engineInstance;
}

// ================================================================================
// CONVENIENCE EXPORTS
// ================================================================================

export const loadSmartCode = async (
  smartCode: string,
  organizationId: string
) => {
  const engine = getSmartCodeEngine();
  return engine.loadSmartCode(smartCode, organizationId);
};

export const executeProcedure = async (
  procedureName: string,
  smartCode: string,
  parameters: Record<string, any>,
  organizationId: string
) => {
  const engine = getSmartCodeEngine();
  return engine.executeProcedure(procedureName, smartCode, parameters, organizationId);
};

export const executePlaybook = async (
  playbookName: string,
  smartCode: string,
  parameters: Record<string, any>,
  organizationId: string
) => {
  const engine = getSmartCodeEngine();
  return engine.executePlaybook(playbookName, smartCode, parameters, organizationId);
};