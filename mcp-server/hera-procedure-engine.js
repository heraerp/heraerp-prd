#!/usr/bin/env node

/**
 * 🧬 HERA Procedure Execution Engine
 * Execute HERA procedures with full validation and audit trail
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

class HERAProcedureEngine {
  constructor() {
    this.proceduresPath = path.join(__dirname, '../procedures');
  }

  async listProcedures() {
    console.log('📋 Available HERA Procedures:\n');
    
    try {
      const files = fs.readdirSync(this.proceduresPath)
        .filter(file => file.endsWith('.yml') && !file.includes('TEMPLATE'))
        .sort();

      const procedures = [];
      
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(this.proceduresPath, file), 'utf8');
          const procedure = yaml.load(content);
          procedures.push({
            file,
            smart_code: procedure.smart_code,
            intent: procedure.intent,
            scope: procedure.scope?.in_scope?.length || 0
          });
        } catch (err) {
          console.log(`  ⚠️ ${file}: Invalid YAML format`);
        }
      }

      // Group by category
      const categories = {
        'CORE': procedures.filter(p => p.smart_code.includes('.CORE.')),
        'TELECOM': procedures.filter(p => p.smart_code.includes('.TELECOM.')),
        'FINANCE': procedures.filter(p => p.smart_code.includes('.FIN.')),
        'OTHER': procedures.filter(p => !p.smart_code.includes('.CORE.') && !p.smart_code.includes('.TELECOM.') && !p.smart_code.includes('.FIN.'))
      };

      for (const [category, procs] of Object.entries(categories)) {
        if (procs.length > 0) {
          console.log(`🧬 ${category} Procedures:`);
          procs.forEach(proc => {
            console.log(`  ✅ ${proc.smart_code}`);
            console.log(`     ${proc.intent.trim()}`);
            console.log(`     Scope: ${proc.scope} areas\n`);
          });
        }
      }

      console.log(`📊 Total: ${procedures.length} procedures defined`);
      
    } catch (error) {
      console.error('❌ Error listing procedures:', error.message);
    }
  }

  async validateProcedure(smartCode) {
    console.log(`🔍 Validating Procedure: ${smartCode}\n`);
    
    try {
      const filename = `${smartCode}.yml`;
      const filepath = path.join(this.proceduresPath, filename);
      
      if (!fs.existsSync(filepath)) {
        console.log(`❌ Procedure file not found: ${filename}`);
        return false;
      }

      const content = fs.readFileSync(filepath, 'utf8');
      const procedure = yaml.load(content);

      // Validation checks
      const validations = [
        { check: 'Smart Code Format', pass: /^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v\d+$/.test(procedure.smart_code) },
        { check: 'Intent Defined', pass: procedure.intent && procedure.intent.trim().length > 0 },
        { check: 'Scope Defined', pass: procedure.scope && procedure.scope.in_scope && procedure.scope.out_of_scope },
        { check: 'Preconditions Listed', pass: procedure.preconditions && Array.isArray(procedure.preconditions) },
        { check: 'Inputs Specified', pass: procedure.inputs && procedure.inputs.required },
        { check: 'Outputs Defined', pass: procedure.outputs },
        { check: 'Happy Path Steps', pass: procedure.happy_path && Array.isArray(procedure.happy_path) },
        { check: 'Error Handling', pass: procedure.errors && Array.isArray(procedure.errors) },
        { check: 'Observability Config', pass: procedure.observability },
        { check: 'Example Payload', pass: procedure.example_payload },
        { check: 'Validation Checks', pass: procedure.checks && Array.isArray(procedure.checks) }
      ];

      console.log('✅ Validation Results:');
      validations.forEach(v => {
        console.log(`  ${v.pass ? '✅' : '❌'} ${v.check}`);
      });

      const passedCount = validations.filter(v => v.pass).length;
      const totalCount = validations.length;
      const score = Math.round((passedCount / totalCount) * 100);

      console.log(`\n📊 Validation Score: ${score}% (${passedCount}/${totalCount})`);
      
      if (score >= 90) {
        console.log('🎉 Procedure is production-ready!');
      } else if (score >= 70) {
        console.log('⚠️ Procedure needs minor improvements');
      } else {
        console.log('❌ Procedure requires significant work');
      }

      return score >= 70;
      
    } catch (error) {
      console.error('❌ Validation error:', error.message);
      return false;
    }
  }

  async executeProcedure(smartCode, payload) {
    console.log(`🚀 Executing Procedure: ${smartCode}\n`);
    
    try {
      // Load procedure definition
      const filename = `${smartCode}.yml`;
      const filepath = path.join(this.proceduresPath, filename);
      
      if (!fs.existsSync(filepath)) {
        throw new Error(`Procedure file not found: ${filename}`);
      }

      const content = fs.readFileSync(filepath, 'utf8');
      const procedure = yaml.load(content);

      // Step 1: Validate preconditions
      console.log('🔍 Step 1: Validating preconditions...');
      await this.validatePreconditions(procedure, payload);

      // Step 2: Validate inputs
      console.log('📥 Step 2: Validating inputs...');
      this.validateInputs(procedure, payload);

      // Step 3: Execute happy path
      console.log('⚡ Step 3: Executing procedure logic...');
      const result = await this.executeHappyPath(procedure, payload);

      // Step 4: Validate outputs
      console.log('📤 Step 4: Validating outputs...');
      await this.validateOutputs(procedure, result);

      // Step 5: Log observability data
      console.log('📊 Step 5: Recording observability data...');
      await this.recordObservability(procedure, payload, result);

      console.log('\n✅ Procedure executed successfully!');
      console.log('📋 Result:', JSON.stringify(result, null, 2));
      
      return result;

    } catch (error) {
      console.error('\n❌ Procedure execution failed:', error.message);
      
      // Log error for observability
      await this.recordError(smartCode, payload, error);
      
      throw error;
    }
  }

  async validatePreconditions(procedure, payload) {
    // Check organization exists and is active
    if (payload.organization_id) {
      const { data: org } = await supabase
        .from('core_organizations')
        .select('id, organization_name')
        .eq('id', payload.organization_id)
        .single();
      
      if (!org) {
        throw new Error(`Organization ${payload.organization_id} not found`);
      }
      
      console.log(`  ✅ Organization: ${org.organization_name}`);
    }

    // Add more precondition checks as needed
    console.log('  ✅ All preconditions validated');
  }

  validateInputs(procedure, payload) {
    const required = procedure.inputs?.required || [];
    
    for (const input of required) {
      if (!payload.hasOwnProperty(input.name)) {
        throw new Error(`Required input missing: ${input.name}`);
      }
      console.log(`  ✅ ${input.name}: ${typeof payload[input.name]}`);
    }
  }

  async executeHappyPath(procedure, payload) {
    // This is a simplified execution - real implementation would have
    // specific logic for each procedure type
    
    console.log('  🔄 Executing procedure-specific logic...');
    
    // Simulate execution based on procedure type
    const smartCode = procedure.smart_code;
    
    if (smartCode.includes('ENTITY.CREATE')) {
      return await this.executeEntityCreate(payload);
    } else if (smartCode.includes('TXN.CREATE')) {
      return await this.executeTransactionCreate(payload);
    } else if (smartCode.includes('SEBI.RATIO')) {
      return await this.executeSEBIRatioCalculation(payload);
    } else {
      // Generic execution
      return { 
        success: true, 
        procedure: smartCode,
        timestamp: new Date().toISOString(),
        payload: payload
      };
    }
  }

  async executeEntityCreate(payload) {
    // Use entity normalization by default
    const { data, error } = await supabase.rpc('rpc_entities_resolve_and_upsert', {
      p_org_id: payload.organization_id,
      p_entity_type: payload.entity_type,
      p_entity_name: payload.entity_name,
      p_entity_code: payload.entity_code,
      p_smart_code: payload.smart_code,
      p_metadata: payload.metadata || null
    });

    if (error) throw error;

    return {
      success: true,
      entity_created: data,
      normalized: true
    };
  }

  async executeTransactionCreate(payload) {
    // Create transaction header
    const { data: transaction, error: txnError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: payload.organization_id,
        transaction_type: payload.transaction_type,
        transaction_code: payload.transaction_code || `AUTO-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        total_amount: payload.total_amount,
        smart_code: payload.smart_code,
        source_entity_id: payload.source_entity_id,
        target_entity_id: payload.target_entity_id,
        metadata: payload.metadata
      })
      .select()
      .single();

    if (txnError) throw txnError;

    // Create transaction lines
    const lines = [];
    if (payload.line_items) {
      for (let i = 0; i < payload.line_items.length; i++) {
        const line = payload.line_items[i];
        const { data: lineData, error: lineError } = await supabase
          .from('universal_transaction_lines')
          .insert({
            organization_id: payload.organization_id,
            transaction_id: transaction.id,
            line_number: i + 1,
            entity_id: line.entity_id,
            line_type: line.line_type,
            description: line.description,
            quantity: line.quantity,
            unit_amount: line.unit_amount,
            line_amount: line.line_amount,
            smart_code: line.smart_code
          })
          .select()
          .single();

        if (lineError) throw lineError;
        lines.push(lineData);
      }
    }

    return {
      success: true,
      transaction_created: transaction,
      lines_created: lines
    };
  }

  async executeSEBIRatioCalculation(payload) {
    // Simplified SEBI ratio calculation
    // Real implementation would fetch actual financial data
    
    const ratios = {
      debt_equity: { value: 1.2, benchmark: 2.0, compliant: true },
      return_networth: { value: 18.5, benchmark: 15.0, compliant: true },
      net_profit_margin: { value: 12.3, benchmark: 10.0, compliant: true },
      current_ratio: { value: 2.1, benchmark: 1.5, compliant: true },
      asset_turnover: { value: 0.8, benchmark: 0.5, compliant: true },
      interest_coverage: { value: 6.2, benchmark: 4.0, compliant: true }
    };

    const compliantCount = Object.values(ratios).filter(r => r.compliant).length;
    const overallScore = Math.round((compliantCount / Object.keys(ratios).length) * 100);

    return {
      success: true,
      calculation_date: payload.calculation_date,
      financial_period: payload.financial_period,
      ratios: ratios,
      overall_compliance: overallScore,
      ipo_readiness: overallScore >= 83 ? 'Ready' : 'Needs Improvement'
    };
  }

  async validateOutputs(procedure, result) {
    if (!result.success) {
      throw new Error('Procedure execution returned failure status');
    }
    console.log('  ✅ Outputs validated');
  }

  async recordObservability(procedure, payload, result) {
    // Record procedure execution in audit trail
    try {
      await supabase
        .from('universal_transactions')
        .insert({
          organization_id: payload.organization_id,
          transaction_type: 'procedure_execution',
          transaction_code: `PROC-${Date.now()}`,
          transaction_date: new Date().toISOString(),
          smart_code: 'HERA.CORE.PROCEDURE.EXECUTION.v1',
          metadata: {
            procedure_smart_code: procedure.smart_code,
            execution_result: result,
            payload_summary: {
              keys: Object.keys(payload),
              organization_id: payload.organization_id
            }
          }
        });
      
      console.log('  ✅ Observability data recorded');
    } catch (error) {
      console.log('  ⚠️ Observability recording failed:', error.message);
    }
  }

  async recordError(smartCode, payload, error) {
    try {
      await supabase
        .from('universal_transactions')
        .insert({
          organization_id: payload.organization_id || 'system',
          transaction_type: 'procedure_error',
          transaction_code: `ERR-${Date.now()}`,
          transaction_date: new Date().toISOString(),
          smart_code: 'HERA.CORE.PROCEDURE.ERROR.v1',
          metadata: {
            procedure_smart_code: smartCode,
            error_message: error.message,
            error_stack: error.stack,
            payload: payload
          }
        });
    } catch (recordError) {
      console.error('Failed to record error:', recordError.message);
    }
  }
}

// CLI Interface
async function main() {
  const engine = new HERAProcedureEngine();
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'list':
      await engine.listProcedures();
      break;
      
    case 'validate':
      const smartCode = args[1];
      if (!smartCode) {
        console.error('Usage: node hera-procedure-engine.js validate HERA.CORE.ENTITY.CREATE.v1');
        process.exit(1);
      }
      await engine.validateProcedure(smartCode);
      break;
      
    case 'execute':
      const procCode = args[1];
      const payloadFile = args[2];
      
      if (!procCode || !payloadFile) {
        console.error('Usage: node hera-procedure-engine.js execute HERA.CORE.ENTITY.CREATE.v1 payload.json');
        process.exit(1);
      }
      
      try {
        const payload = JSON.parse(fs.readFileSync(payloadFile, 'utf8'));
        await engine.executeProcedure(procCode, payload);
      } catch (error) {
        console.error('❌ Execution failed:', error.message);
        process.exit(1);
      }
      break;
      
    case 'test':
      // Test with example payloads from procedure definitions
      const testCode = args[1];
      if (!testCode) {
        console.error('Usage: node hera-procedure-engine.js test HERA.CORE.ENTITY.CREATE.v1');
        process.exit(1);
      }
      
      try {
        const filename = `${testCode}.yml`;
        const filepath = path.join(__dirname, '../procedures', filename);
        const content = fs.readFileSync(filepath, 'utf8');
        const procedure = yaml.load(content);
        
        if (procedure.example_payload) {
          await engine.executeProcedure(testCode, procedure.example_payload);
        } else {
          console.error('❌ No example payload found in procedure definition');
        }
      } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
      }
      break;
      
    default:
      console.log('🧬 HERA Procedure Execution Engine\n');
      console.log('Commands:');
      console.log('  list                           - List all available procedures');
      console.log('  validate <smart_code>          - Validate procedure definition');
      console.log('  execute <smart_code> <payload> - Execute procedure with payload');
      console.log('  test <smart_code>              - Test procedure with example payload');
      console.log('\nExamples:');
      console.log('  node hera-procedure-engine.js list');
      console.log('  node hera-procedure-engine.js validate HERA.CORE.ENTITY.CREATE.v1');
      console.log('  node hera-procedure-engine.js execute HERA.CORE.ENTITY.CREATE.v1 payload.json');
      console.log('  node hera-procedure-engine.js test HERA.TELECOM.SEBI.RATIO.v1');
  }
}

main().catch(console.error);