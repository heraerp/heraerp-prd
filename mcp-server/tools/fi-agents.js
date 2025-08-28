/**
 * HERA FI MCP Agents
 * Smart agents for S/4HANA FI parity using HERA's 6-table architecture
 */

const { createClient } = require('@supabase/supabase-js');
const chalk = require('chalk');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
);

/**
 * GL Balance Validator Agent
 * Ensures GL balances per currency/book/period
 */
async function validateGLBalance({ organizationId, fiscalPeriod, currency, book }) {
  console.log(chalk.blue('\n🔍 GL Balance Validator Agent'));
  
  try {
    // Get all GL postings for period
    const { data: transactions, error } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines (*)
      `)
      .eq('organization_id', organizationId)
      .eq('metadata->fiscal_period', fiscalPeriod)
      .like('smart_code', 'HERA.FIN.GL.%');
    
    if (error) throw error;
    
    // Group by currency and calculate balances
    const balances = {};
    
    transactions.forEach(txn => {
      txn.universal_transaction_lines.forEach(line => {
        const curr = line.metadata?.currency || 'USD';
        const amount = parseFloat(line.line_amount || 0);
        const isDebit = line.metadata?.debit_credit === 'D';
        
        if (!balances[curr]) {
          balances[curr] = { debits: 0, credits: 0 };
        }
        
        if (isDebit) {
          balances[curr].debits += amount;
        } else {
          balances[curr].credits += amount;
        }
      });
    });
    
    // Check if balanced
    const results = Object.entries(balances).map(([currency, bal]) => ({
      currency,
      debits: bal.debits,
      credits: bal.credits,
      difference: Math.abs(bal.debits - bal.credits),
      balanced: Math.abs(bal.debits - bal.credits) < 0.01
    }));
    
    return {
      status: 'success',
      period: fiscalPeriod,
      validations: results,
      allBalanced: results.every(r => r.balanced)
    };
    
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * Period Close Orchestrator Agent
 * Executes period close checklist
 */
async function executePeriodClose({ organizationId, fiscalYear, fiscalPeriod }) {
  console.log(chalk.blue('\n📊 Period Close Orchestrator'));
  
  const steps = [
    { id: 'soft-lock', name: 'Soft Lock Period', status: 'pending' },
    { id: 'depreciation', name: 'Run Depreciation', status: 'pending' },
    { id: 'fx-reval', name: 'FX Revaluation', status: 'pending' },
    { id: 'accruals', name: 'Post Accruals', status: 'pending' },
    { id: 'reconcile', name: 'Reconciliations', status: 'pending' },
    { id: 'validate', name: 'Validate Balances', status: 'pending' },
    { id: 'hard-lock', name: 'Hard Lock Period', status: 'pending' },
    { id: 'reports', name: 'Generate Reports', status: 'pending' }
  ];
  
  for (const step of steps) {
    console.log(chalk.yellow(`\nExecuting: ${step.name}`));
    
    try {
      switch (step.id) {
        case 'soft-lock':
          await createControlTransaction(organizationId, 'PERIOD_SOFT_LOCK', {
            fiscal_year: fiscalYear,
            fiscal_period: fiscalPeriod
          });
          break;
          
        case 'depreciation':
          await runDepreciation(organizationId, fiscalYear, fiscalPeriod);
          break;
          
        case 'fx-reval':
          await runFXRevaluation(organizationId, fiscalPeriod);
          break;
          
        case 'validate':
          const validation = await validateGLBalance({ 
            organizationId, 
            fiscalPeriod 
          });
          if (!validation.allBalanced) {
            throw new Error('GL not balanced');
          }
          break;
          
        case 'hard-lock':
          await createControlTransaction(organizationId, 'PERIOD_HARD_LOCK', {
            fiscal_year: fiscalYear,
            fiscal_period: fiscalPeriod
          });
          break;
      }
      
      step.status = 'completed';
      console.log(chalk.green(`✓ ${step.name} completed`));
      
    } catch (error) {
      step.status = 'failed';
      step.error = error.message;
      console.log(chalk.red(`✗ ${step.name} failed: ${error.message}`));
      break; // Stop on first failure
    }
  }
  
  return {
    status: steps.every(s => s.status === 'completed') ? 'success' : 'partial',
    steps
  };
}

/**
 * AP Three-Way Match Agent
 * Matches PO, Goods Receipt, and Invoice
 */
async function matchAPDocuments({ organizationId, invoiceId }) {
  console.log(chalk.blue('\n🔗 AP Three-Way Match Agent'));
  
  try {
    // Get invoice details
    const { data: invoice } = await supabase
      .from('universal_transactions')
      .select('*, universal_transaction_lines (*)')
      .eq('id', invoiceId)
      .single();
    
    if (!invoice) throw new Error('Invoice not found');
    
    // Find related PO and GR through relationships
    const { data: relationships } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', organizationId)
      .or(`from_entity_id.eq.${invoiceId},to_entity_id.eq.${invoiceId}`)
      .in('relationship_type', ['REFERENCES_PO', 'REFERENCES_GR']);
    
    const poId = relationships?.find(r => r.relationship_type === 'REFERENCES_PO')?.to_entity_id;
    const grId = relationships?.find(r => r.relationship_type === 'REFERENCES_GR')?.to_entity_id;
    
    // Perform 3-way match
    const matchResult = {
      invoice: { id: invoiceId, amount: invoice.total_amount },
      po: poId ? await getDocumentAmount(poId) : null,
      gr: grId ? await getDocumentAmount(grId) : null,
      matched: false,
      discrepancies: []
    };
    
    if (poId && grId) {
      // Check quantities and amounts
      const tolerance = 0.02; // 2% tolerance
      
      if (Math.abs(matchResult.invoice.amount - matchResult.po.amount) > matchResult.po.amount * tolerance) {
        matchResult.discrepancies.push('Invoice amount exceeds PO tolerance');
      }
      
      if (Math.abs(matchResult.gr.amount - matchResult.po.amount) > matchResult.po.amount * tolerance) {
        matchResult.discrepancies.push('GR amount differs from PO');
      }
      
      matchResult.matched = matchResult.discrepancies.length === 0;
    }
    
    // Auto-approve if matched
    if (matchResult.matched) {
      await supabase
        .from('universal_transactions')
        .update({ 
          metadata: { 
            ...invoice.metadata, 
            approval_status: 'AUTO_APPROVED',
            three_way_match: true
          }
        })
        .eq('id', invoiceId);
    }
    
    return matchResult;
    
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * Cash Reconciliation Agent
 * Auto-matches bank transactions with GL entries
 */
async function reconcileBankStatement({ organizationId, bankAccountId, statementDate }) {
  console.log(chalk.blue('\n💰 Cash Reconciliation Agent'));
  
  try {
    // Get bank statement lines (imported as transactions)
    const { data: bankLines } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('source_entity_id', bankAccountId)
      .eq('transaction_type', 'bank_statement_line')
      .gte('transaction_date', statementDate)
      .lt('transaction_date', addDays(statementDate, 1));
    
    // Get unreconciled GL entries
    const { data: glEntries } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('metadata->bank_account_id', bankAccountId)
      .is('metadata->reconciled', null)
      .gte('transaction_date', addDays(statementDate, -7))
      .lte('transaction_date', addDays(statementDate, 7));
    
    const matches = [];
    const unmatched = [...bankLines];
    
    // Try different matching algorithms
    for (const bankLine of bankLines) {
      let matched = false;
      
      // 1. Exact amount and reference match
      const exactMatch = glEntries.find(gl => 
        gl.total_amount === bankLine.total_amount &&
        gl.metadata?.reference === bankLine.metadata?.reference
      );
      
      if (exactMatch) {
        matches.push({
          bankLineId: bankLine.id,
          glEntryId: exactMatch.id,
          confidence: 100,
          method: 'exact_match'
        });
        matched = true;
      }
      
      // 2. Amount match within date range
      if (!matched) {
        const amountMatch = glEntries.find(gl => 
          Math.abs(gl.total_amount - bankLine.total_amount) < 0.01 &&
          Math.abs(daysBetween(gl.transaction_date, bankLine.transaction_date)) <= 3
        );
        
        if (amountMatch) {
          matches.push({
            bankLineId: bankLine.id,
            glEntryId: amountMatch.id,
            confidence: 80,
            method: 'amount_date_match'
          });
          matched = true;
        }
      }
      
      // 3. ML pattern matching (simulate)
      if (!matched && bankLine.metadata?.description) {
        const patternMatch = glEntries.find(gl =>
          fuzzyMatch(gl.metadata?.description, bankLine.metadata?.description) > 0.7
        );
        
        if (patternMatch) {
          matches.push({
            bankLineId: bankLine.id,
            glEntryId: patternMatch.id,
            confidence: 60,
            method: 'pattern_match'
          });
          matched = true;
        }
      }
      
      if (!matched) {
        unmatched.push(bankLine);
      }
    }
    
    // Create reconciliation relationships for high-confidence matches
    for (const match of matches.filter(m => m.confidence >= 80)) {
      await supabase
        .from('core_relationships')
        .insert({
          organization_id: organizationId,
          from_entity_id: match.bankLineId,
          to_entity_id: match.glEntryId,
          relationship_type: 'RECONCILES',
          smart_code: 'HERA.FIN.BANK.RECON.v1',
          metadata: {
            confidence: match.confidence,
            method: match.method,
            reconciled_date: new Date().toISOString()
          }
        });
    }
    
    return {
      status: 'success',
      summary: {
        total_bank_lines: bankLines.length,
        matched: matches.length,
        unmatched: unmatched.length,
        high_confidence: matches.filter(m => m.confidence >= 80).length
      },
      matches,
      unmatched
    };
    
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * FX Revaluation Agent
 * Revalues foreign currency balances
 */
async function runFXRevaluation({ organizationId, valuationDate, baseCurrency = 'USD' }) {
  console.log(chalk.blue('\n💱 FX Revaluation Agent'));
  
  try {
    // Get current FX rates
    const { data: fxRates } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'fx_rate')
      .eq('metadata->valuation_date', valuationDate);
    
    // Get open FX items (AP/AR in foreign currency)
    const { data: openItems } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .neq('metadata->currency', baseCurrency)
      .in('transaction_type', ['ap_invoice', 'ar_invoice'])
      .is('metadata->fully_settled', null);
    
    const revaluationEntries = [];
    
    for (const item of openItems) {
      const currency = item.metadata?.currency;
      const originalRate = item.metadata?.exchange_rate || 1;
      const currentRate = fxRates.find(r => r.entity_code === currency)?.metadata?.rate || originalRate;
      
      if (originalRate !== currentRate) {
        const originalBaseAmount = item.total_amount / originalRate;
        const currentBaseAmount = item.total_amount / currentRate;
        const difference = currentBaseAmount - originalBaseAmount;
        
        if (Math.abs(difference) > 0.01) {
          // Create revaluation journal entry
          const revalEntry = {
            organization_id: organizationId,
            transaction_type: 'journal_entry',
            transaction_code: `FX-REVAL-${Date.now()}`,
            transaction_date: valuationDate,
            smart_code: 'HERA.FIN.GL.FX.REVAL.v1',
            total_amount: Math.abs(difference),
            metadata: {
              fx_revaluation: true,
              original_document_id: item.id,
              currency,
              original_rate: originalRate,
              current_rate: currentRate,
              base_currency: baseCurrency
            }
          };
          
          revaluationEntries.push(revalEntry);
        }
      }
    }
    
    // Post revaluation entries
    if (revaluationEntries.length > 0) {
      const { error } = await supabase
        .from('universal_transactions')
        .insert(revaluationEntries);
      
      if (error) throw error;
    }
    
    return {
      status: 'success',
      summary: {
        items_evaluated: openItems.length,
        revaluations_posted: revaluationEntries.length,
        currencies_processed: [...new Set(openItems.map(i => i.metadata?.currency))],
        valuation_date: valuationDate
      }
    };
    
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    return { status: 'error', error: error.message };
  }
}

// Helper functions
async function createControlTransaction(organizationId, type, metadata) {
  return await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'control_transaction',
      transaction_code: `${type}-${Date.now()}`,
      transaction_date: new Date().toISOString(),
      total_amount: 0,
      smart_code: `HERA.FIN.CONTROL.${type}.v1`,
      metadata
    });
}

async function runDepreciation(organizationId, fiscalYear, fiscalPeriod) {
  // Get all active assets
  const { data: assets } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'fixed_asset')
    .eq('metadata->status', 'active');
  
  const depreciationEntries = [];
  
  for (const asset of assets || []) {
    const method = asset.metadata?.depreciation_method || 'straight_line';
    const cost = asset.metadata?.acquisition_cost || 0;
    const salvage = asset.metadata?.salvage_value || 0;
    const life = asset.metadata?.useful_life_months || 60;
    const accumulated = asset.metadata?.accumulated_depreciation || 0;
    
    let monthlyDepreciation = 0;
    
    if (method === 'straight_line') {
      monthlyDepreciation = (cost - salvage) / life;
    } else if (method === 'double_declining') {
      monthlyDepreciation = (cost - accumulated) * (2 / life);
    }
    
    if (monthlyDepreciation > 0) {
      depreciationEntries.push({
        organization_id: organizationId,
        transaction_type: 'depreciation',
        transaction_code: `DEPR-${asset.entity_code}-${fiscalPeriod}`,
        transaction_date: new Date().toISOString(),
        total_amount: monthlyDepreciation,
        source_entity_id: asset.id,
        smart_code: 'HERA.FIN.AA.DEPR.POST.v1',
        metadata: {
          fiscal_year: fiscalYear,
          fiscal_period: fiscalPeriod,
          depreciation_method: method,
          asset_code: asset.entity_code
        }
      });
    }
  }
  
  if (depreciationEntries.length > 0) {
    await supabase
      .from('universal_transactions')
      .insert(depreciationEntries);
  }
  
  return depreciationEntries.length;
}

async function getDocumentAmount(docId) {
  const { data } = await supabase
    .from('universal_transactions')
    .select('id, total_amount')
    .eq('id', docId)
    .single();
  
  return data || { id: docId, amount: 0 };
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString();
}

function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.abs((d2 - d1) / (1000 * 60 * 60 * 24));
}

function fuzzyMatch(str1, str2) {
  if (!str1 || !str2) return 0;
  // Simple fuzzy match simulation
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);
  const matches = words1.filter(w => words2.includes(w)).length;
  return matches / Math.max(words1.length, words2.length);
}

// Export for MCP server
module.exports = {
  validateGLBalance,
  executePeriodClose,
  matchAPDocuments,
  reconcileBankStatement,
  runFXRevaluation
};

// CLI interface for testing
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const orgId = process.env.DEFAULT_ORGANIZATION_ID || 'test-org';
  
  switch (command) {
    case 'validate-gl':
      validateGLBalance({
        organizationId: orgId,
        fiscalPeriod: args[1] || '2024-01',
        currency: args[2] || 'USD'
      }).then(console.log);
      break;
      
    case 'close-period':
      executePeriodClose({
        organizationId: orgId,
        fiscalYear: args[1] || '2024',
        fiscalPeriod: args[2] || '2024-01'
      }).then(console.log);
      break;
      
    case 'match-ap':
      matchAPDocuments({
        organizationId: orgId,
        invoiceId: args[1]
      }).then(console.log);
      break;
      
    case 'reconcile-bank':
      reconcileBankStatement({
        organizationId: orgId,
        bankAccountId: args[1],
        statementDate: args[2] || new Date().toISOString()
      }).then(console.log);
      break;
      
    case 'fx-reval':
      runFXRevaluation({
        organizationId: orgId,
        valuationDate: args[1] || new Date().toISOString(),
        baseCurrency: args[2] || 'USD'
      }).then(console.log);
      break;
      
    default:
      console.log(`
HERA FI MCP Agents

Usage:
  node fi-agents.js <command> [args]

Commands:
  validate-gl [period] [currency]     Validate GL balances
  close-period [year] [period]        Execute period close
  match-ap <invoice-id>               Three-way match AP documents
  reconcile-bank <bank-id> [date]     Reconcile bank statement
  fx-reval [date] [base-currency]     Run FX revaluation

Examples:
  node fi-agents.js validate-gl 2024-01 USD
  node fi-agents.js close-period 2024 2024-01
  node fi-agents.js match-ap inv-123
  node fi-agents.js reconcile-bank bank-001 2024-01-31
  node fi-agents.js fx-reval 2024-01-31 USD
      `);
  }
}