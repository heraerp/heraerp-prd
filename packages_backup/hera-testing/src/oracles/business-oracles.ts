/**
 * HERA Business Oracles - Pure validation functions for business rules
 * These functions validate business logic without external dependencies
 */

import { sum, groupBy, round } from 'lodash';

// Types for business data
export interface EntityData {
  id: string;
  entity_type: string;
  entity_name: string;
  smart_code: string;
  metadata?: Record<string, any>;
}

export interface TransactionData {
  id: string;
  transaction_type: string;
  transaction_code: string;
  total_amount: number;
  smart_code: string;
  reference_entity_id?: string;
  metadata?: Record<string, any>;
  line_items?: TransactionLineData[];
}

export interface TransactionLineData {
  id: string;
  line_number: number;
  quantity?: number;
  unit_price?: number;
  line_amount: number;
  smart_code: string;
  line_entity_id?: string;
  metadata?: Record<string, any>;
}

export interface RelationshipData {
  id: string;
  from_entity_id: string;
  to_entity_id: string;
  relationship_type: string;
  smart_code: string;
  relationship_data?: Record<string, any>;
}

export interface DynamicFieldData {
  entity_id: string;
  field_name: string;
  field_value_text?: string;
  field_value_number?: number;
  field_value_boolean?: boolean;
  field_value_date?: Date;
  smart_code: string;
}

// 1. Accounting Equation Oracle - Assets = Liabilities + Equity
export function validateAccountingEquation(
  glAccounts: EntityData[],
  transactions: TransactionData[],
  tolerance: number = 0.01
): { valid: boolean; difference: number; details: Record<string, number> } {
  
  const accountBalances: Record<string, number> = {};
  
  // Initialize account balances
  glAccounts.forEach(account => {
    accountBalances[account.id] = 0;
  });
  
  // Process all transactions to calculate balances
  transactions.forEach(transaction => {
    if (transaction.line_items) {
      transaction.line_items.forEach(line => {
        if (line.line_entity_id && accountBalances.hasOwnProperty(line.line_entity_id)) {
          // Determine debit/credit based on account type and smart code
          const account = glAccounts.find(a => a.id === line.line_entity_id);
          if (account) {
            const isDebit = isDebitAccount(account, line.smart_code);
            const amount = isDebit ? line.line_amount : -line.line_amount;
            accountBalances[account.id] += amount;
          }
        }
      });
    }
  });
  
  // Categorize accounts by type
  const assets = sum(glAccounts
    .filter(acc => acc.metadata?.account_type === 'asset')
    .map(acc => accountBalances[acc.id] || 0)
  );
  
  const liabilities = sum(glAccounts
    .filter(acc => acc.metadata?.account_type === 'liability')
    .map(acc => Math.abs(accountBalances[acc.id] || 0))
  );
  
  const equity = sum(glAccounts
    .filter(acc => acc.metadata?.account_type === 'equity')
    .map(acc => Math.abs(accountBalances[acc.id] || 0))
  );
  
  const difference = Math.abs(assets - (liabilities + equity));
  
  return {
    valid: difference <= tolerance,
    difference: round(difference, 2),
    details: {
      assets: round(assets, 2),
      liabilities: round(liabilities, 2),
      equity: round(equity, 2)
    }
  };
}

function isDebitAccount(account: EntityData, smartCode: string): boolean {
  const accountType = account.metadata?.account_type;
  const isIncreaseTransaction = smartCode.includes('.DEBIT.') || 
                                smartCode.includes('.INCREASE.') ||
                                smartCode.includes('.EXPENSE.');
                                
  switch (accountType) {
    case 'asset':
    case 'expense':
      return isIncreaseTransaction;
    case 'liability':
    case 'equity':
    case 'revenue':
      return !isIncreaseTransaction;
    default:
      return isIncreaseTransaction;
  }
}

// 2. Inventory Balance Oracle - Validate inventory quantities
export function validateInventoryBalance(
  products: EntityData[],
  transactions: TransactionData[],
  dynamicFields: DynamicFieldData[]
): { valid: boolean; discrepancies: Array<{ product_id: string; expected: number; actual: number }> } {
  
  const inventoryMovements: Record<string, number> = {};
  
  // Initialize inventory from dynamic fields (opening balances)
  products.forEach(product => {
    const openingBalance = dynamicFields.find(
      f => f.entity_id === product.id && f.field_name === 'opening_balance'
    );
    inventoryMovements[product.id] = openingBalance?.field_value_number || 0;
  });
  
  // Process inventory transactions
  transactions.forEach(transaction => {
    if (transaction.line_items) {
      transaction.line_items.forEach(line => {
        if (line.line_entity_id && products.find(p => p.id === line.line_entity_id)) {
          const quantity = line.quantity || 0;
          
          // Determine if this increases or decreases inventory
          if (transaction.smart_code.includes('.RECEIPT.') || 
              transaction.smart_code.includes('.RETURN.')) {
            inventoryMovements[line.line_entity_id] += quantity;
          } else if (transaction.smart_code.includes('.ISSUE.') || 
                     transaction.smart_code.includes('.SALE.')) {
            inventoryMovements[line.line_entity_id] -= quantity;
          }
        }
      });
    }
  });
  
  // Compare with current balances
  const discrepancies: Array<{ product_id: string; expected: number; actual: number }> = [];
  
  products.forEach(product => {
    const currentBalance = dynamicFields.find(
      f => f.entity_id === product.id && f.field_name === 'current_balance'
    );
    const actual = currentBalance?.field_value_number || 0;
    const expected = inventoryMovements[product.id] || 0;
    
    if (Math.abs(actual - expected) > 0.001) {
      discrepancies.push({
        product_id: product.id,
        expected: round(expected, 3),
        actual: round(actual, 3)
      });
    }
  });
  
  return {
    valid: discrepancies.length === 0,
    discrepancies
  };
}

// 3. Workflow Status Oracle - Validate status transitions
export function validateWorkflowStatus(
  entityId: string,
  expectedStatus: string,
  relationships: RelationshipData[],
  statusEntities: EntityData[]
): { valid: boolean; currentStatus: string | null; validTransitions: string[] } {
  
  // Find current status relationship
  const statusRelationship = relationships
    .filter(rel => 
      rel.from_entity_id === entityId && 
      rel.relationship_type === 'has_status'
    )
    .sort((a, b) => 
      new Date(b.relationship_data?.timestamp || 0).getTime() - 
      new Date(a.relationship_data?.timestamp || 0).getTime()
    )[0];
    
  const currentStatusEntity = statusRelationship 
    ? statusEntities.find(s => s.id === statusRelationship.to_entity_id)
    : null;
    
  const currentStatus = currentStatusEntity?.entity_code || null;
  
  // Define valid status transitions (industry-specific)
  const validTransitions = getValidStatusTransitions(currentStatus);
  
  return {
    valid: currentStatus === expectedStatus,
    currentStatus,
    validTransitions
  };
}

function getValidStatusTransitions(currentStatus: string | null): string[] {
  const statusFlows: Record<string, string[]> = {
    'DRAFT': ['PENDING', 'CANCELLED'],
    'PENDING': ['APPROVED', 'REJECTED', 'CANCELLED'],
    'APPROVED': ['IN_PROGRESS', 'CANCELLED'],
    'IN_PROGRESS': ['COMPLETED', 'ON_HOLD', 'CANCELLED'],
    'ON_HOLD': ['IN_PROGRESS', 'CANCELLED'],
    'COMPLETED': ['CLOSED'],
    'REJECTED': ['DRAFT'],
    'CANCELLED': []
  };
  
  return statusFlows[currentStatus || 'DRAFT'] || [];
}

// 4. Tax Calculation Oracle - Validate tax calculations
export function validateTaxCalculation(
  transaction: TransactionData,
  taxRates: Record<string, number>,
  tolerance: number = 0.01
): { valid: boolean; expectedTax: number; actualTax: number; breakdown: Record<string, number> } {
  
  if (!transaction.line_items) {
    return { valid: true, expectedTax: 0, actualTax: 0, breakdown: {} };
  }
  
  let expectedTax = 0;
  const breakdown: Record<string, number> = {};
  
  // Calculate expected tax for each line item
  transaction.line_items.forEach(line => {
    const taxType = line.metadata?.tax_type || 'standard';
    const taxRate = taxRates[taxType] || 0;
    const lineTax = round(line.line_amount * taxRate, 2);
    
    expectedTax += lineTax;
    breakdown[`line_${line.line_number}_${taxType}`] = lineTax;
  });
  
  // Get actual tax from transaction metadata
  const actualTax = transaction.metadata?.tax_amount || 0;
  const difference = Math.abs(expectedTax - actualTax);
  
  return {
    valid: difference <= tolerance,
    expectedTax: round(expectedTax, 2),
    actualTax: round(actualTax, 2),
    breakdown
  };
}

// 5. Smart Code Validation Oracle - Validate smart code patterns
export function validateSmartCodePatterns(
  entities: EntityData[],
  transactions: TransactionData[],
  relationships: RelationshipData[]
): { valid: boolean; violations: Array<{ type: string; id: string; code: string; issue: string }> } {
  
  const violations: Array<{ type: string; id: string; code: string; issue: string }> = [];
  
  // Validate entity smart codes
  entities.forEach(entity => {
    const issues = validateEntitySmartCode(entity.smart_code, entity.entity_type);
    issues.forEach(issue => {
      violations.push({
        type: 'entity',
        id: entity.id,
        code: entity.smart_code,
        issue
      });
    });
  });
  
  // Validate transaction smart codes
  transactions.forEach(transaction => {
    const issues = validateTransactionSmartCode(transaction.smart_code, transaction.transaction_type);
    issues.forEach(issue => {
      violations.push({
        type: 'transaction',
        id: transaction.id,
        code: transaction.smart_code,
        issue
      });
    });
  });
  
  // Validate relationship smart codes
  relationships.forEach(relationship => {
    const issues = validateRelationshipSmartCode(relationship.smart_code, relationship.relationship_type);
    issues.forEach(issue => {
      violations.push({
        type: 'relationship',
        id: relationship.id,
        code: relationship.smart_code,
        issue
      });
    });
  });
  
  return {
    valid: violations.length === 0,
    violations
  };
}

function validateEntitySmartCode(smartCode: string, entityType: string): string[] {
  const issues: string[] = [];
  const pattern = /^HERA\.([A-Z]+)\.([A-Z]+)\.([A-Z]+)\.([A-Z]+)\.v(\d+)$/;
  
  if (!pattern.test(smartCode)) {
    issues.push('Smart code does not follow HERA pattern: HERA.INDUSTRY.MODULE.FUNCTION.TYPE.vX');
  }
  
  const match = smartCode.match(pattern);
  if (match) {
    const [, industry, module, func, type, version] = match;
    
    // Validate entity type alignment
    if (entityType === 'customer' && !smartCode.includes('.CUST.')) {
      issues.push('Customer entity should have CUST in smart code');
    }
    
    if (entityType === 'product' && !smartCode.includes('.PROD.')) {
      issues.push('Product entity should have PROD in smart code');
    }
    
    // Validate version
    if (parseInt(version) < 1) {
      issues.push('Version must be 1 or higher');
    }
  }
  
  return issues;
}

function validateTransactionSmartCode(smartCode: string, transactionType: string): string[] {
  const issues: string[] = [];
  const pattern = /^HERA\.([A-Z]+)\.([A-Z]+)\.([A-Z]+)\.([A-Z]+)\.v(\d+)$/;
  
  if (!pattern.test(smartCode)) {
    issues.push('Smart code does not follow HERA pattern');
  }
  
  // Validate transaction type alignment
  if (transactionType === 'sale' && !smartCode.includes('.SALE.')) {
    issues.push('Sale transaction should have SALE in smart code');
  }
  
  if (transactionType === 'payment' && !smartCode.includes('.PAY.')) {
    issues.push('Payment transaction should have PAY in smart code');
  }
  
  return issues;
}

function validateRelationshipSmartCode(smartCode: string, relationshipType: string): string[] {
  const issues: string[] = [];
  
  if (relationshipType === 'has_status' && !smartCode.includes('.STATUS.')) {
    issues.push('Status relationship should have STATUS in smart code');
  }
  
  return issues;
}

// 6. Multi-tenant Isolation Oracle - Validate organization boundaries
export function validateMultiTenantIsolation(
  organizationId: string,
  entities: EntityData[],
  transactions: TransactionData[],
  relationships: RelationshipData[]
): { valid: boolean; violations: Array<{ type: string; id: string; issue: string }> } {
  
  const violations: Array<{ type: string; id: string; issue: string }> = [];
  
  // Check entities belong to organization
  entities.forEach(entity => {
    if (entity.metadata?.organization_id !== organizationId) {
      violations.push({
        type: 'entity',
        id: entity.id,
        issue: `Entity belongs to different organization: ${entity.metadata?.organization_id}`
      });
    }
  });
  
  // Check transactions belong to organization
  transactions.forEach(transaction => {
    if (transaction.metadata?.organization_id !== organizationId) {
      violations.push({
        type: 'transaction',
        id: transaction.id,
        issue: `Transaction belongs to different organization: ${transaction.metadata?.organization_id}`
      });
    }
  });
  
  // Check relationships don't cross organization boundaries
  relationships.forEach(relationship => {
    const fromEntity = entities.find(e => e.id === relationship.from_entity_id);
    const toEntity = entities.find(e => e.id === relationship.to_entity_id);
    
    if (fromEntity?.metadata?.organization_id !== organizationId ||
        toEntity?.metadata?.organization_id !== organizationId) {
      violations.push({
        type: 'relationship',
        id: relationship.id,
        issue: 'Relationship crosses organization boundaries'
      });
    }
  });
  
  return {
    valid: violations.length === 0,
    violations
  };
}

// 7. Restaurant-Specific Oracles
export function validateRestaurantWorkflow(
  order: TransactionData,
  relationships: RelationshipData[],
  statusEntities: EntityData[]
): { valid: boolean; currentStage: string; expectedNextStages: string[] } {
  
  const orderStatuses = relationships
    .filter(rel => rel.from_entity_id === order.id && rel.relationship_type === 'has_status')
    .map(rel => {
      const status = statusEntities.find(s => s.id === rel.to_entity_id);
      return {
        status: status?.entity_code || 'unknown',
        timestamp: rel.relationship_data?.timestamp
      };
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
  const currentStage = orderStatuses[0]?.status || 'unknown';
  
  const restaurantFlow: Record<string, string[]> = {
    'ORDERED': ['IN_KITCHEN'],
    'IN_KITCHEN': ['COOKING', 'CANCELLED'],
    'COOKING': ['READY_TO_SERVE'],
    'READY_TO_SERVE': ['SERVED'],
    'SERVED': ['BILLED'],
    'BILLED': ['PAID'],
    'PAID': ['COMPLETED']
  };
  
  return {
    valid: restaurantFlow.hasOwnProperty(currentStage),
    currentStage,
    expectedNextStages: restaurantFlow[currentStage] || []
  };
}

// Export all oracles
export const businessOracles = {
  validateAccountingEquation,
  validateInventoryBalance,
  validateWorkflowStatus,
  validateTaxCalculation,
  validateSmartCodePatterns,
  validateMultiTenantIsolation,
  validateRestaurantWorkflow
};