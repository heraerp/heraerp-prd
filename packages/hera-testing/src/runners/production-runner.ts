/**
 * Production Test Runner for HERA Testing Framework
 * Actually creates data in Supabase database
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BusinessProcessTest, StepAction } from '../dsl/schema';
import { v4 as uuidv4 } from 'uuid';

export interface ProductionTestConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  organizationId: string;
  debug?: boolean;
}

export interface ProductionTestResult {
  success: boolean;
  duration: number;
  steps: ProductionStepResult[];
  createdData: CreatedDataSummary;
  message: string;
}

export interface ProductionStepResult {
  id: string;
  success: boolean;
  duration: number;
  actions: ProductionActionResult[];
  error?: string;
}

export interface ProductionActionResult {
  action_type: string;
  success: boolean;
  duration: number;
  created_id?: string;
  result?: any;
  error?: string;
}

export interface CreatedDataSummary {
  entities: string[];
  transactions: string[];
  relationships: string[];
  dynamic_fields: Array<{ entity_id: string; field_name: string }>;
}

export class ProductionTestRunner {
  private supabase: SupabaseClient;
  private organizationId: string;
  private debug: boolean;
  private executionContext: Map<string, any> = new Map();
  
  constructor(config: ProductionTestConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
    this.organizationId = config.organizationId;
    this.debug = config.debug || false;
  }
  
  /**
   * Run a business process test with real Supabase data creation
   */
  async runTest(test: BusinessProcessTest): Promise<ProductionTestResult> {
    const startTime = Date.now();
    const createdData: CreatedDataSummary = {
      entities: [],
      transactions: [],
      relationships: [],
      dynamic_fields: []
    };
    
    try {
      console.log(`🧪 Running PRODUCTION test: ${test.title}`);
      console.log(`🏢 Organization: ${this.organizationId}`);
      console.log(`🔌 Database: Connected to Supabase`);
      
      // Initialize execution context
      this.initializeContext(test);
      
      // Execute setup actions
      if (test.setup && test.setup.length > 0) {
        console.log(`🔧 Executing ${test.setup.length} setup actions...`);
        for (const action of test.setup) {
          const result = await this.executeAction(action, createdData);
          if (action.store_as && result.created_id) {
            this.executionContext.set(action.store_as, { id: result.created_id, ...result.result });
          }
        }
      }
      
      // Execute test steps
      const stepResults: ProductionStepResult[] = [];
      for (const step of test.steps) {
        const stepResult = await this.executeStep(step, createdData);
        stepResults.push(stepResult);
        
        if (!stepResult.success) {
          throw new Error(`Step ${step.id} failed: ${stepResult.error}`);
        }
      }
      
      // Execute cleanup (optional - comment out if you want to keep test data)
      // await this.executeCleanup(test.cleanup, createdData);
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        duration,
        steps: stepResults,
        createdData,
        message: `Production test completed successfully in ${duration}ms with real Supabase data`
      };
      
    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        steps: [],
        createdData,
        message: `Production test failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Initialize execution context with test variables
   */
  private initializeContext(test: BusinessProcessTest) {
    this.executionContext.clear();
    this.executionContext.set('organization_id', this.organizationId);
    this.executionContext.set('timestamp', Date.now());
    this.executionContext.set('clock', test.context.clock || new Date().toISOString());
  }
  
  /**
   * Execute a single test step with real database operations
   */
  private async executeStep(step: any, createdData: CreatedDataSummary): Promise<ProductionStepResult> {
    const startTime = Date.now();
    
    try {
      console.log(`  📋 ${step.description}`);
      console.log(`    👤 Persona: ${step.persona}`);
      
      const actionResults: ProductionActionResult[] = [];
      
      for (const action of step.actions) {
        const actionResult = await this.executeAction(action, createdData);
        actionResults.push(actionResult);
        
        // Store result if specified
        if ('store_as' in action && action.store_as && actionResult.created_id) {
          this.executionContext.set(action.store_as, { 
            id: actionResult.created_id, 
            ...actionResult.result 
          });
        }
        
        if (!actionResult.success) {
          return {
            id: step.id,
            success: false,
            duration: Date.now() - startTime,
            actions: actionResults,
            error: actionResult.error
          };
        }
      }
      
      return {
        id: step.id,
        success: true,
        duration: Date.now() - startTime,
        actions: actionResults
      };
      
    } catch (error) {
      return {
        id: step.id,
        success: false,
        duration: Date.now() - startTime,
        actions: [],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Execute individual action with real database operations
   */
  private async executeAction(action: StepAction, createdData: CreatedDataSummary): Promise<ProductionActionResult> {
    const startTime = Date.now();
    
    try {
      let result: any;
      let createdId: string | undefined;
      
      switch (action.action_type) {
        case 'create_entity':
          ({ result, createdId } = await this.createEntityProduction(action.data, createdData));
          break;
          
        case 'create_transaction':
          ({ result, createdId } = await this.createTransactionProduction(action.data, createdData));
          break;
          
        case 'create_relationship':
          ({ result, createdId } = await this.createRelationshipProduction(action.data, createdData));
          break;
          
        case 'set_dynamic_field':
          ({ result } = await this.setDynamicFieldProduction(
            action.entity_id,
            action.field_name,
            action.field_value,
            action.smart_code,
            createdData
          ));
          break;
          
        default:
          console.log(`    ❓ Unknown action: ${action.action_type} (skipped in production)`);
          result = { skipped: true };
      }
      
      return {
        action_type: action.action_type,
        success: true,
        duration: Date.now() - startTime,
        created_id: createdId,
        result
      };
      
    } catch (error) {
      return {
        action_type: action.action_type,
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Create entity in Supabase
   */
  private async createEntityProduction(data: any, createdData: CreatedDataSummary): Promise<{ result: any; createdId: string }> {
    // Resolve template variables
    const resolvedData = this.resolveTemplateVariables(data);
    
    const entityData = {
      id: uuidv4(),
      ...resolvedData,
      organization_id: this.organizationId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log(`    🔧 Creating ${entityData.entity_type}: ${entityData.entity_name}`);
    
    if (this.debug) {
      console.log('    💾 Entity data:', JSON.stringify(entityData, null, 2));
    }
    
    const { data: result, error } = await this.supabase
      .from('core_entities')
      .insert(entityData)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create entity: ${error.message}`);
    }
    
    createdData.entities.push(result.id);
    console.log(`    ✅ Created entity: ${result.id}`);
    
    return { result, createdId: result.id };
  }
  
  /**
   * Create transaction in Supabase
   */
  private async createTransactionProduction(data: any, createdData: CreatedDataSummary): Promise<{ result: any; createdId: string }> {
    // Resolve template variables
    const resolvedData = this.resolveTemplateVariables(data);
    
    const transactionData = {
      id: uuidv4(),
      ...resolvedData,
      organization_id: this.organizationId,
      transaction_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log(`    💰 Creating ${transactionData.transaction_type} transaction`);
    
    if (this.debug) {
      console.log('    💾 Transaction data:', JSON.stringify(transactionData, null, 2));
    }
    
    // Create transaction header
    const { data: transaction, error: transactionError } = await this.supabase
      .from('universal_transactions')
      .insert(transactionData)
      .select()
      .single();
    
    if (transactionError) {
      throw new Error(`Failed to create transaction: ${transactionError.message}`);
    }
    
    createdData.transactions.push(transaction.id);
    console.log(`    ✅ Created transaction: ${transaction.id}`);
    
    // Create transaction lines if provided
    if (resolvedData.line_items && resolvedData.line_items.length > 0) {
      const lineItems = resolvedData.line_items.map((line: any) => ({
        id: uuidv4(),
        ...line,
        transaction_id: transaction.id,
        organization_id: this.organizationId,
        created_at: new Date().toISOString()
      }));
      
      const { error: linesError } = await this.supabase
        .from('universal_transaction_lines')
        .insert(lineItems);
      
      if (linesError) {
        throw new Error(`Failed to create transaction lines: ${linesError.message}`);
      }
      
      console.log(`    ✅ Created ${lineItems.length} transaction lines`);
    }
    
    return { result: transaction, createdId: transaction.id };
  }
  
  /**
   * Create relationship in Supabase
   */
  private async createRelationshipProduction(data: any, createdData: CreatedDataSummary): Promise<{ result: any; createdId: string }> {
    // Resolve template variables
    const resolvedData = this.resolveTemplateVariables(data);
    
    const relationshipData = {
      id: uuidv4(),
      ...resolvedData,
      organization_id: this.organizationId,
      created_at: new Date().toISOString()
    };
    
    console.log(`    🔗 Creating ${relationshipData.relationship_type} relationship`);
    
    if (this.debug) {
      console.log('    💾 Relationship data:', JSON.stringify(relationshipData, null, 2));
    }
    
    const { data: result, error } = await this.supabase
      .from('core_relationships')
      .insert(relationshipData)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create relationship: ${error.message}`);
    }
    
    createdData.relationships.push(result.id);
    console.log(`    ✅ Created relationship: ${result.id}`);
    
    return { result, createdId: result.id };
  }
  
  /**
   * Set dynamic field in Supabase
   */
  private async setDynamicFieldProduction(
    entityId: string,
    fieldName: string,
    fieldValue: any,
    smartCode: string,
    createdData: CreatedDataSummary
  ): Promise<{ result: any }> {
    
    // Resolve entity ID from context if needed
    const resolvedEntityId = entityId.startsWith('{{') ? 
      this.resolveTemplateString(entityId) : entityId;
    
    const dynamicData = {
      id: uuidv4(),
      entity_id: resolvedEntityId,
      field_name: fieldName,
      smart_code: smartCode,
      organization_id: this.organizationId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Set appropriate field value column based on type
    if (typeof fieldValue === 'string') {
      dynamicData.field_value_text = fieldValue;
    } else if (typeof fieldValue === 'number') {
      dynamicData.field_value_number = fieldValue;
    } else if (typeof fieldValue === 'boolean') {
      dynamicData.field_value_boolean = fieldValue;
    } else if (fieldValue instanceof Date) {
      dynamicData.field_value_date = fieldValue.toISOString();
    } else {
      dynamicData.field_value_text = String(fieldValue);
    }
    
    console.log(`    📝 Setting field ${fieldName} = ${fieldValue}`);
    
    if (this.debug) {
      console.log('    💾 Dynamic data:', JSON.stringify(dynamicData, null, 2));
    }
    
    const { data: result, error } = await this.supabase
      .from('core_dynamic_data')
      .upsert(dynamicData, {
        onConflict: 'entity_id,field_name',
        ignoreDuplicates: false
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to set dynamic field: ${error.message}`);
    }
    
    createdData.dynamic_fields.push({ entity_id: resolvedEntityId, field_name: fieldName });
    console.log(`    ✅ Set dynamic field: ${fieldName}`);
    
    return { result };
  }
  
  /**
   * Resolve template variables in data
   */
  private resolveTemplateVariables(data: any): any {
    const resolved = JSON.parse(JSON.stringify(data));
    
    const resolve = (obj: any): any => {
      if (typeof obj === 'string') {
        return this.resolveTemplateString(obj);
      } else if (Array.isArray(obj)) {
        return obj.map(resolve);
      } else if (typeof obj === 'object' && obj !== null) {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = resolve(value);
        }
        return result;
      }
      return obj;
    };
    
    return resolve(resolved);
  }
  
  /**
   * Resolve template strings like {{variable}} or {{step.field}}
   */
  private resolveTemplateString(str: string): string {
    const templateRegex = /\{\{([^}]+)\}\}/g;
    
    return str.replace(templateRegex, (match, expression) => {
      const trimmed = expression.trim();
      
      // Handle simple variables
      if (this.executionContext.has(trimmed)) {
        const value = this.executionContext.get(trimmed);
        return typeof value === 'object' && value.id ? value.id : value;
      }
      
      // Handle dot notation (e.g., customer.id)
      if (trimmed.includes('.')) {
        const parts = trimmed.split('.');
        let value = this.executionContext.get(parts[0]);
        
        for (let i = 1; i < parts.length && value !== undefined; i++) {
          value = value[parts[i]];
        }
        
        if (value !== undefined) {
          return value;
        }
      }
      
      // Handle special expressions
      if (trimmed === 'organization_id') {
        return this.organizationId;
      }
      
      if (trimmed === 'timestamp') {
        return Date.now().toString();
      }
      
      // Return original if not resolved
      console.warn(`⚠️  Could not resolve template variable: ${match}`);
      return match;
    });
  }
  
  /**
   * Execute cleanup (delete created data)
   */
  private async executeCleanup(cleanup: StepAction[] | undefined, createdData: CreatedDataSummary): Promise<void> {
    if (!cleanup || cleanup.length === 0) return;
    
    console.log(`🧹 Cleaning up created data...`);
    
    // Delete in reverse order to handle dependencies
    
    // Delete dynamic fields
    for (const field of createdData.dynamic_fields) {
      await this.supabase
        .from('core_dynamic_data')
        .delete()
        .eq('entity_id', field.entity_id)
        .eq('field_name', field.field_name);
    }
    
    // Delete relationships
    for (const id of createdData.relationships) {
      await this.supabase.from('core_relationships').delete().eq('id', id);
    }
    
    // Delete transactions
    for (const id of createdData.transactions) {
      // Delete transaction lines first
      await this.supabase.from('universal_transaction_lines').delete().eq('transaction_id', id);
      // Then delete transaction
      await this.supabase.from('universal_transactions').delete().eq('id', id);
    }
    
    // Delete entities
    for (const id of createdData.entities) {
      await this.supabase.from('core_entities').delete().eq('id', id);
    }
    
    console.log(`✅ Cleanup completed`);
  }
}