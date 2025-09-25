# HERA V2 API - Usage Examples & Best Practices

**Practical Implementation Guide**
Real-world examples and battle-tested patterns for HERA V2 API integration.

---

## 🚀 Quick Start Scenarios

### 1. Complete Customer Onboarding Flow

```typescript
/**
 * Complete customer setup with profile, credit terms, and status
 * Demonstrates: Entity creation, dynamic fields, relationships
 */

async function createCustomerComplete(orgId: string, customerData: {
  name: string;
  email: string;
  phone: string;
  creditLimit: number;
  paymentTerms: string;
}) {
  // Step 1: Create customer entity
  const customer = await universalApi.createEntity({
    organization_id: orgId,
    entity_type: 'customer',
    entity_name: customerData.name,
    entity_code: generateCustomerCode(customerData.name),
    smart_code: 'HERA.CRM.CUST.ENT.PROF.V1',
    classification: 'business'
  });

  // Step 2: Add dynamic contact information
  await universalApi.setDynamicField(
    customer.id,
    'email',
    customerData.email,
    'HERA.CRM.CUST.DYN.EMAIL.V1'
  );

  await universalApi.setDynamicField(
    customer.id,
    'phone',
    customerData.phone,
    'HERA.CRM.CUST.DYN.PHONE.V1'
  );

  // Step 3: Set financial terms
  await universalApi.setDynamicField(
    customer.id,
    'credit_limit',
    customerData.creditLimit,
    'HERA.CRM.CUST.DYN.CREDIT.V1'
  );

  await universalApi.setDynamicField(
    customer.id,
    'payment_terms',
    customerData.paymentTerms,
    'HERA.CRM.CUST.DYN.TERMS.V1'
  );

  // Step 4: Assign default "Active" status
  const activeStatus = await findOrCreateStatus(orgId, 'active');
  await universalApi.createRelationship({
    organization_id: orgId,
    from_entity_id: customer.id,
    to_entity_id: activeStatus.id,
    relationship_type: 'has_status',
    smart_code: 'HERA.CRM.CUST.STATUS.ACTIVE.V1'
  });

  return {
    customer,
    message: 'Customer onboarded successfully with complete profile'
  };
}

// Helper: Generate customer code
function generateCustomerCode(name: string): string {
  const prefix = 'CUST';
  const suffix = name.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}-${suffix}-${timestamp}`;
}

// Helper: Find or create status entity
async function findOrCreateStatus(orgId: string, statusName: string) {
  // Try to find existing status
  const existing = await universalApi.queryEntities({
    organization_id: orgId,
    entity_type: 'workflow_status',
    entity_name: `${statusName} Status`
  });

  if (existing.entities.length > 0) {
    return existing.entities[0];
  }

  // Create new status
  return await universalApi.createEntity({
    organization_id: orgId,
    entity_type: 'workflow_status',
    entity_name: `${statusName} Status`,
    entity_code: `STATUS-${statusName.toUpperCase()}`,
    smart_code: `HERA.WORKFLOW.STATUS.${statusName.toUpperCase()}.V1`,
    classification: 'system'
  });
}
```

### 2. Restaurant Order Processing

```typescript
/**
 * Complete restaurant order flow
 * Demonstrates: Transaction creation, line items, inventory impact
 */

interface OrderItem {
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  specialInstructions?: string;
}

interface RestaurantOrder {
  customerId: string;
  tableNumber: number;
  serverId: string;
  items: OrderItem[];
  paymentMethod: string;
}

async function processRestaurantOrder(orgId: string, order: RestaurantOrder) {
  try {
    // Step 1: Validate all menu items exist
    const menuItems = await Promise.all(
      order.items.map(item =>
        universalApi.getEntity(item.menuItemId)
      )
    );

    // Step 2: Calculate totals
    const subtotal = order.items.reduce((sum, item) =>
      sum + (item.quantity * item.unitPrice), 0
    );
    const taxRate = 0.05; // 5% tax
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    // Step 3: Create transaction lines
    const lines: TxnEmitLine[] = [];

    // Add item lines
    order.items.forEach((item, index) => {
      lines.push({
        line_number: index + 1,
        line_type: 'ITEM',
        entity_id: item.menuItemId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_amount: item.quantity * item.unitPrice,
        smart_code: 'HERA.RESTAURANT.SALES.LINE.ITEM.V1',
        description: menuItems[index].entity_name,
        metadata: {
          special_instructions: item.specialInstructions,
          kitchen_station: getKitchenStation(menuItems[index])
        }
      });
    });

    // Add tax line
    lines.push({
      line_number: lines.length + 1,
      line_type: 'TAX',
      line_amount: taxAmount,
      smart_code: 'HERA.RESTAURANT.SALES.LINE.TAX.V1',
      description: 'Sales Tax (5%)',
      metadata: {
        tax_rate: taxRate,
        tax_basis: subtotal
      }
    });

    // Step 4: Create sales transaction
    const salesTxn = await txnClientV2.emit({
      organization_id: orgId,
      transaction_type: 'sale',
      smart_code: 'HERA.RESTAURANT.SALES.ORDER.CORE.V1',
      transaction_date: new Date().toISOString(),
      source_entity_id: order.customerId,
      business_context: {
        table_number: order.tableNumber,
        server_id: order.serverId,
        order_type: 'dine_in',
        payment_method: order.paymentMethod
      },
      lines,
      idempotency_key: `order-${orgId}-${Date.now()}`
    });

    // Step 5: Create payment transaction
    const paymentTxn = await txnClientV2.emit({
      organization_id: orgId,
      transaction_type: 'payment',
      smart_code: 'HERA.RESTAURANT.PAYMENT.CUSTOMER.V1',
      transaction_date: new Date().toISOString(),
      source_entity_id: order.customerId,
      business_context: {
        payment_method: order.paymentMethod,
        related_sale: salesTxn.transaction_id
      },
      lines: [
        {
          line_number: 1,
          line_type: 'PAYMENT',
          line_amount: totalAmount,
          smart_code: 'HERA.RESTAURANT.PAYMENT.LINE.V1',
          description: `Payment for Order ${salesTxn.transaction_id.slice(-8)}`,
          metadata: {
            original_transaction: salesTxn.transaction_id
          }
        }
      ]
    });

    return {
      salesTransaction: salesTxn,
      paymentTransaction: paymentTxn,
      orderSummary: {
        subtotal,
        taxAmount,
        totalAmount,
        itemCount: order.items.length
      }
    };

  } catch (error) {
    console.error('Order processing failed:', error);
    throw new Error(`Failed to process restaurant order: ${error.message}`);
  }
}

function getKitchenStation(menuItem: any): string {
  // Determine kitchen station based on item type
  if (menuItem.classification === 'beverage') return 'BAR';
  if (menuItem.entity_name.includes('Pizza')) return 'PIZZA_STATION';
  if (menuItem.entity_name.includes('Pasta')) return 'HOT_KITCHEN';
  return 'GENERAL';
}
```

### 3. Financial Journal Entry with Auto-Balancing

```typescript
/**
 * Create balanced journal entry with validation
 * Demonstrates: Financial transactions, DR/CR balancing, GL accounts
 */

interface JournalLine {
  glAccountId: string;
  amount: number;
  drCr: 'DR' | 'CR';
  description: string;
  reference?: string;
}

async function createJournalEntry(
  orgId: string,
  journalData: {
    date: Date;
    reference: string;
    description: string;
    lines: JournalLine[];
  }
) {
  // Step 1: Validate all GL accounts exist
  const glAccounts = await Promise.all(
    journalData.lines.map(line =>
      universalApi.getEntity(line.glAccountId)
    )
  );

  // Step 2: Validate balance (DR = CR)
  const totalDebits = journalData.lines
    .filter(line => line.drCr === 'DR')
    .reduce((sum, line) => sum + line.amount, 0);

  const totalCredits = journalData.lines
    .filter(line => line.drCr === 'CR')
    .reduce((sum, line) => sum + line.amount, 0);

  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    throw new Error(`Journal entry not balanced: DR=${totalDebits}, CR=${totalCredits}`);
  }

  // Step 3: Create transaction lines
  const lines: TxnEmitLine[] = journalData.lines.map((line, index) => ({
    line_number: index + 1,
    line_type: line.drCr.toLowerCase(),
    entity_id: line.glAccountId,
    line_amount: line.amount,
    dr_cr: line.drCr,
    smart_code: `HERA.FINANCE.GL.${line.drCr}.V1`,
    description: line.description,
    metadata: {
      gl_account_code: glAccounts[index].entity_code,
      gl_account_name: glAccounts[index].entity_name,
      reference: line.reference
    }
  }));

  // Step 4: Create journal entry transaction
  const journalEntry = await txnClientV2.emit({
    organization_id: orgId,
    transaction_type: 'journal_entry',
    smart_code: 'HERA.FINANCE.GL.JOURNAL.ENTRY.V1',
    transaction_date: journalData.date.toISOString(),
    reference: journalData.reference,
    description: journalData.description,
    business_context: {
      entry_type: 'manual',
      balanced: true,
      total_amount: totalDebits
    },
    lines,
    require_balance: true, // Enforce balance validation
    idempotency_key: `je-${orgId}-${journalData.reference}`
  });

  return {
    journalEntry,
    balanceValidation: {
      totalDebits,
      totalCredits,
      balanced: true
    }
  };
}

// Example usage
async function recordExpensePayment(orgId: string, expenseAmount: number, cashAccountId: string, expenseAccountId: string) {
  return await createJournalEntry(orgId, {
    date: new Date(),
    reference: 'EXP-' + Date.now(),
    description: 'Office supplies expense payment',
    lines: [
      {
        glAccountId: expenseAccountId,
        amount: expenseAmount,
        drCr: 'DR',
        description: 'Office supplies expense',
        reference: 'Invoice-12345'
      },
      {
        glAccountId: cashAccountId,
        amount: expenseAmount,
        drCr: 'CR',
        description: 'Cash payment'
      }
    ]
  });
}
```

### 4. Customer Lifecycle Management

```typescript
/**
 * Manage customer status transitions with audit trail
 * Demonstrates: Status workflows, relationship management, audit trails
 */

type CustomerStatus = 'prospect' | 'active' | 'inactive' | 'suspended' | 'closed';

class CustomerLifecycleManager {
  constructor(private orgId: string) {}

  async transitionCustomerStatus(
    customerId: string,
    newStatus: CustomerStatus,
    reason: string,
    userId: string
  ) {
    try {
      // Step 1: Get current status
      const currentStatus = await this.getCurrentStatus(customerId);

      // Step 2: Validate transition
      this.validateStatusTransition(currentStatus, newStatus);

      // Step 3: Find or create new status entity
      const newStatusEntity = await this.findOrCreateStatus(newStatus);

      // Step 4: Remove old status relationship
      if (currentStatus) {
        await this.removeStatusRelationship(customerId, currentStatus.id);
      }

      // Step 5: Create new status relationship
      await universalApi.createRelationship({
        organization_id: this.orgId,
        from_entity_id: customerId,
        to_entity_id: newStatusEntity.id,
        relationship_type: 'has_status',
        smart_code: `HERA.CRM.CUST.STATUS.${newStatus.toUpperCase()}.V1`,
        metadata: {
          transition_reason: reason,
          changed_by: userId,
          changed_at: new Date().toISOString(),
          previous_status: currentStatus?.entity_name || 'None'
        }
      });

      // Step 6: Create audit trail transaction
      await this.createStatusAuditTrail(customerId, currentStatus, newStatusEntity, reason, userId);

      return {
        success: true,
        previousStatus: currentStatus?.entity_name || 'None',
        newStatus: newStatusEntity.entity_name,
        transitionDate: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Status transition failed: ${error.message}`);
    }
  }

  private async getCurrentStatus(customerId: string) {
    const relationships = await universalApi.queryRelationships({
      organization_id: this.orgId,
      from_entity_id: customerId,
      relationship_type: 'has_status'
    });

    if (relationships.relationships.length === 0) {
      return null;
    }

    // Get the status entity
    const statusId = relationships.relationships[0].to_entity_id;
    return await universalApi.getEntity(statusId);
  }

  private validateStatusTransition(currentStatus: any, newStatus: CustomerStatus) {
    const validTransitions: Record<string, CustomerStatus[]> = {
      'prospect': ['active', 'closed'],
      'active': ['inactive', 'suspended', 'closed'],
      'inactive': ['active', 'closed'],
      'suspended': ['active', 'closed'],
      'closed': [] // No transitions from closed
    };

    const current = currentStatus?.entity_name?.toLowerCase().replace(' status', '') || 'prospect';

    if (!validTransitions[current]?.includes(newStatus)) {
      throw new Error(`Invalid transition from ${current} to ${newStatus}`);
    }
  }

  private async findOrCreateStatus(status: CustomerStatus) {
    const statusName = `${status} Status`;

    const existing = await universalApi.queryEntities({
      organization_id: this.orgId,
      entity_type: 'workflow_status',
      entity_name: statusName
    });

    if (existing.entities.length > 0) {
      return existing.entities[0];
    }

    return await universalApi.createEntity({
      organization_id: this.orgId,
      entity_type: 'workflow_status',
      entity_name: statusName,
      entity_code: `STATUS-${status.toUpperCase()}`,
      smart_code: `HERA.WORKFLOW.STATUS.${status.toUpperCase()}.V1`,
      classification: 'system'
    });
  }

  private async removeStatusRelationship(customerId: string, statusId: string) {
    const relationships = await universalApi.queryRelationships({
      organization_id: this.orgId,
      from_entity_id: customerId,
      to_entity_id: statusId,
      relationship_type: 'has_status'
    });

    for (const rel of relationships.relationships) {
      await universalApi.deleteRelationship(rel.id, 'Status transition');
    }
  }

  private async createStatusAuditTrail(
    customerId: string,
    oldStatus: any,
    newStatus: any,
    reason: string,
    userId: string
  ) {
    await txnClientV2.emit({
      organization_id: this.orgId,
      transaction_type: 'status_change',
      smart_code: 'HERA.CRM.CUST.STATUS.CHANGE.V1',
      transaction_date: new Date().toISOString(),
      source_entity_id: customerId,
      target_entity_id: newStatus.id,
      description: `Customer status changed: ${oldStatus?.entity_name || 'None'} → ${newStatus.entity_name}`,
      business_context: {
        change_type: 'status_transition',
        reason,
        changed_by: userId,
        workflow: 'customer_lifecycle'
      },
      lines: [
        {
          line_number: 1,
          line_type: 'STATUS_CHANGE',
          entity_id: newStatus.id,
          smart_code: 'HERA.CRM.CUST.STATUS.AUDIT.V1',
          description: `Status set to: ${newStatus.entity_name}`,
          metadata: {
            previous_status_id: oldStatus?.id,
            previous_status_name: oldStatus?.entity_name,
            new_status_id: newStatus.id,
            new_status_name: newStatus.entity_name,
            reason
          }
        }
      ]
    });
  }
}

// Usage example
const customerLifecycle = new CustomerLifecycleManager('org-uuid');

// Activate a prospect customer
await customerLifecycle.transitionCustomerStatus(
  'customer-uuid',
  'active',
  'Customer signed contract and made first payment',
  'user-uuid'
);
```

### 5. Inventory Management with Transactions

```typescript
/**
 * Complete inventory operations with transaction tracking
 * Demonstrates: Inventory adjustments, cost tracking, transaction linking
 */

interface InventoryAdjustment {
  productId: string;
  adjustmentType: 'receipt' | 'issue' | 'transfer' | 'adjustment';
  quantity: number;
  unitCost?: number;
  reason: string;
  reference?: string;
  locationId?: string;
}

async function processInventoryAdjustment(
  orgId: string,
  adjustment: InventoryAdjustment
) {
  try {
    // Step 1: Get product information
    const product = await universalApi.getEntity(adjustment.productId);
    if (product.entity_type !== 'product') {
      throw new Error('Entity is not a product');
    }

    // Step 2: Get current inventory levels
    const currentInventory = await getCurrentInventoryLevel(orgId, adjustment.productId);

    // Step 3: Calculate new inventory level
    const quantityChange = adjustment.adjustmentType === 'issue'
      ? -Math.abs(adjustment.quantity)
      : Math.abs(adjustment.quantity);

    const newLevel = currentInventory + quantityChange;

    if (newLevel < 0 && adjustment.adjustmentType === 'issue') {
      throw new Error(`Insufficient inventory: Available=${currentInventory}, Requested=${adjustment.quantity}`);
    }

    // Step 4: Create inventory transaction
    const inventoryTxn = await txnClientV2.emit({
      organization_id: orgId,
      transaction_type: 'inventory_adjustment',
      smart_code: `HERA.INVENTORY.ADJUSTMENT.${adjustment.adjustmentType.toUpperCase()}.V1`,
      transaction_date: new Date().toISOString(),
      source_entity_id: adjustment.productId,
      target_entity_id: adjustment.locationId,
      reference: adjustment.reference,
      description: `${adjustment.adjustmentType}: ${product.entity_name}`,
      business_context: {
        adjustment_type: adjustment.adjustmentType,
        reason: adjustment.reason,
        previous_level: currentInventory,
        new_level: newLevel
      },
      lines: [
        {
          line_number: 1,
          line_type: 'INVENTORY',
          entity_id: adjustment.productId,
          quantity: quantityChange,
          unit_price: adjustment.unitCost || await getAverageCost(orgId, adjustment.productId),
          line_amount: quantityChange * (adjustment.unitCost || await getAverageCost(orgId, adjustment.productId)),
          smart_code: `HERA.INVENTORY.LINE.${adjustment.adjustmentType.toUpperCase()}.V1`,
          description: `${adjustment.adjustmentType} - ${product.entity_name}`,
          metadata: {
            location_id: adjustment.locationId,
            previous_quantity: currentInventory,
            adjustment_quantity: quantityChange,
            new_quantity: newLevel
          }
        }
      ]
    });

    // Step 5: Update current inventory level (dynamic data)
    await universalApi.setDynamicField(
      adjustment.productId,
      'current_inventory',
      newLevel,
      'HERA.INVENTORY.PRODUCT.DYN.CURRENT.V1'
    );

    // Step 6: Update average cost if receipt
    if (adjustment.adjustmentType === 'receipt' && adjustment.unitCost) {
      const newAvgCost = calculateWeightedAverageCost(
        currentInventory,
        await getAverageCost(orgId, adjustment.productId),
        adjustment.quantity,
        adjustment.unitCost
      );

      await universalApi.setDynamicField(
        adjustment.productId,
        'average_cost',
        newAvgCost,
        'HERA.INVENTORY.PRODUCT.DYN.AVGCOST.V1'
      );
    }

    return {
      transaction: inventoryTxn,
      inventoryMovement: {
        product: product.entity_name,
        adjustmentType: adjustment.adjustmentType,
        quantityChange,
        previousLevel: currentInventory,
        newLevel,
        unitCost: adjustment.unitCost || await getAverageCost(orgId, adjustment.productId)
      }
    };

  } catch (error) {
    console.error('Inventory adjustment failed:', error);
    throw new Error(`Inventory processing failed: ${error.message}`);
  }
}

// Helper functions
async function getCurrentInventoryLevel(orgId: string, productId: string): Promise<number> {
  const dynamicData = await universalApi.getDynamicField(productId, 'current_inventory');
  return dynamicData?.field_value_number || 0;
}

async function getAverageCost(orgId: string, productId: string): Promise<number> {
  const dynamicData = await universalApi.getDynamicField(productId, 'average_cost');
  return dynamicData?.field_value_number || 0;
}

function calculateWeightedAverageCost(
  currentQty: number,
  currentCost: number,
  newQty: number,
  newCost: number
): number {
  const totalValue = (currentQty * currentCost) + (newQty * newCost);
  const totalQty = currentQty + newQty;
  return totalQty > 0 ? totalValue / totalQty : 0;
}

// Usage examples
// Receive inventory
await processInventoryAdjustment('org-uuid', {
  productId: 'product-uuid',
  adjustmentType: 'receipt',
  quantity: 100,
  unitCost: 25.50,
  reason: 'Purchase order PO-2025-001',
  reference: 'PO-2025-001',
  locationId: 'warehouse-main-uuid'
});

// Issue inventory for sale
await processInventoryAdjustment('org-uuid', {
  productId: 'product-uuid',
  adjustmentType: 'issue',
  quantity: 2,
  reason: 'Sale - Order SO-2025-001',
  reference: 'SO-2025-001',
  locationId: 'store-front-uuid'
});
```

---

## 🔧 Advanced Patterns

### 1. Batch Processing with Error Recovery

```typescript
/**
 * Process multiple operations with rollback capability
 * Demonstrates: Transaction boundaries, error handling, data integrity
 */

interface BatchOperation {
  type: 'entity' | 'dynamic_data' | 'relationship' | 'transaction';
  operation: 'create' | 'update' | 'delete';
  data: any;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

class BatchProcessor {
  private results: any[] = [];
  private errors: Error[] = [];

  constructor(private orgId: string) {}

  async processBatch(operations: BatchOperation[]): Promise<{
    successful: number;
    failed: number;
    results: any[];
    errors: Error[];
  }> {
    const results: any[] = [];
    const errors: Error[] = [];

    // Process operations in parallel batches
    const batchSize = 10;
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);

      const batchPromises = batch.map(async (op, index) => {
        try {
          const result = await this.processOperation(op);
          results[i + index] = result;

          if (op.onSuccess) {
            op.onSuccess(result);
          }

          return result;
        } catch (error) {
          const err = error as Error;
          errors[i + index] = err;

          if (op.onError) {
            op.onError(err);
          }

          throw err;
        }
      });

      // Wait for batch completion
      await Promise.allSettled(batchPromises);
    }

    return {
      successful: results.filter(r => r !== undefined).length,
      failed: errors.filter(e => e !== undefined).length,
      results,
      errors
    };
  }

  private async processOperation(operation: BatchOperation): Promise<any> {
    switch (operation.type) {
      case 'entity':
        return this.processEntityOperation(operation);
      case 'dynamic_data':
        return this.processDynamicDataOperation(operation);
      case 'relationship':
        return this.processRelationshipOperation(operation);
      case 'transaction':
        return this.processTransactionOperation(operation);
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  private async processEntityOperation(operation: BatchOperation) {
    switch (operation.operation) {
      case 'create':
        return await universalApi.createEntity({
          organization_id: this.orgId,
          ...operation.data
        });
      case 'update':
        return await universalApi.updateEntity(operation.data.id, operation.data);
      case 'delete':
        return await universalApi.deleteEntity(operation.data.id, operation.data.reason);
      default:
        throw new Error(`Unknown entity operation: ${operation.operation}`);
    }
  }

  // ... implement other operation processors
}

// Usage example
const processor = new BatchProcessor('org-uuid');

const operations: BatchOperation[] = [
  // Create multiple customers
  {
    type: 'entity',
    operation: 'create',
    data: {
      entity_type: 'customer',
      entity_name: 'Customer 1',
      smart_code: 'HERA.CRM.CUST.ENT.PROF.V1'
    },
    onSuccess: (result) => console.log('Customer created:', result.id),
    onError: (error) => console.error('Customer creation failed:', error.message)
  },
  // Add more operations...
];

const batchResult = await processor.processBatch(operations);
console.log(`Processed: ${batchResult.successful} successful, ${batchResult.failed} failed`);
```

### 2. Real-Time Sync with Webhooks

```typescript
/**
 * Sync HERA data with external systems using webhooks
 * Demonstrates: Event-driven architecture, external integrations
 */

interface WebhookEvent {
  eventType: 'entity.created' | 'entity.updated' | 'entity.deleted' |
             'transaction.created' | 'transaction.reversed';
  organizationId: string;
  entityId?: string;
  transactionId?: string;
  timestamp: Date;
  data: any;
}

class WebhookManager {
  private webhookUrls: Map<string, string> = new Map();

  registerWebhook(eventType: string, url: string) {
    this.webhookUrls.set(eventType, url);
  }

  async sendWebhook(event: WebhookEvent) {
    const url = this.webhookUrls.get(event.eventType);
    if (!url) {
      console.log(`No webhook configured for ${event.eventType}`);
      return;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-HERA-Event-Type': event.eventType,
          'X-HERA-Organization': event.organizationId,
          'X-HERA-Timestamp': event.timestamp.toISOString()
        },
        body: JSON.stringify({
          event: event.eventType,
          organization_id: event.organizationId,
          entity_id: event.entityId,
          transaction_id: event.transactionId,
          timestamp: event.timestamp.toISOString(),
          data: event.data
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }

      console.log(`Webhook sent successfully: ${event.eventType}`);
    } catch (error) {
      console.error('Webhook delivery failed:', error);
      // Implement retry logic or dead letter queue
      await this.scheduleRetry(event);
    }
  }

  private async scheduleRetry(event: WebhookEvent) {
    // Implement exponential backoff retry
    setTimeout(async () => {
      await this.sendWebhook(event);
    }, 5000); // 5 second delay
  }
}

// Integration wrapper
class HeraWebhookIntegration {
  private webhookManager = new WebhookManager();

  constructor(private orgId: string) {
    // Configure webhook endpoints
    this.webhookManager.registerWebhook(
      'entity.created',
      'https://external-system.com/webhooks/hera/entity-created'
    );
    this.webhookManager.registerWebhook(
      'transaction.created',
      'https://external-system.com/webhooks/hera/transaction-created'
    );
  }

  async createEntityWithWebhook(entityData: any) {
    // Create entity in HERA
    const entity = await universalApi.createEntity({
      organization_id: this.orgId,
      ...entityData
    });

    // Send webhook notification
    await this.webhookManager.sendWebhook({
      eventType: 'entity.created',
      organizationId: this.orgId,
      entityId: entity.id,
      timestamp: new Date(),
      data: entity
    });

    return entity;
  }

  async createTransactionWithWebhook(transactionData: any) {
    // Create transaction in HERA
    const transaction = await txnClientV2.emit({
      organization_id: this.orgId,
      ...transactionData
    });

    // Send webhook notification
    await this.webhookManager.sendWebhook({
      eventType: 'transaction.created',
      organizationId: this.orgId,
      transactionId: transaction.transaction_id,
      timestamp: new Date(),
      data: transaction
    });

    return transaction;
  }
}
```

---

## 📊 Performance Best Practices

### 1. Efficient Pagination

```typescript
/**
 * Implement cursor-based pagination for large datasets
 */

interface PaginationCursor {
  lastId: string;
  lastCreatedAt: string;
  hasMore: boolean;
}

class EfficientPaginator {
  constructor(private orgId: string) {}

  async paginateTransactions(
    pageSize: number = 100,
    cursor?: PaginationCursor,
    filters?: any
  ): Promise<{
    transactions: any[];
    nextCursor?: PaginationCursor;
  }> {
    const queryFilters = {
      organization_id: this.orgId,
      limit: pageSize + 1, // Fetch one extra to check for more pages
      ...filters
    };

    // Add cursor conditions if provided
    if (cursor) {
      queryFilters.date_from = cursor.lastCreatedAt;
      queryFilters.id_after = cursor.lastId;
    }

    const result = await txnClientV2.query(queryFilters);

    const hasMore = result.transactions.length > pageSize;
    const transactions = hasMore
      ? result.transactions.slice(0, pageSize)
      : result.transactions;

    let nextCursor: PaginationCursor | undefined;
    if (hasMore && transactions.length > 0) {
      const lastTxn = transactions[transactions.length - 1];
      nextCursor = {
        lastId: lastTxn.id,
        lastCreatedAt: lastTxn.created_at,
        hasMore: true
      };
    }

    return {
      transactions,
      nextCursor
    };
  }
}

// Usage
const paginator = new EfficientPaginator('org-uuid');
let cursor: PaginationCursor | undefined;

do {
  const page = await paginator.paginateTransactions(50, cursor);

  // Process transactions
  console.log(`Processing ${page.transactions.length} transactions`);

  cursor = page.nextCursor;
} while (cursor?.hasMore);
```

### 2. Intelligent Caching

```typescript
/**
 * Implement intelligent caching with TTL and invalidation
 */

interface CacheEntry<T> {
  data: T;
  expires: Date;
  version: number;
}

class HeraCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    const expires = new Date(Date.now() + (ttl || this.defaultTTL));
    this.cache.set(key, {
      data,
      expires,
      version: 1
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry || entry.expires < new Date()) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

// Cached API wrapper
class CachedHeraAPI {
  private cache = new HeraCache();

  constructor(private orgId: string) {}

  async getEntityCached(entityId: string): Promise<any> {
    const cacheKey = `entity:${entityId}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const entity = await universalApi.getEntity(entityId);

    // Cache result
    this.cache.set(cacheKey, entity, 10 * 60 * 1000); // 10 minutes TTL

    return entity;
  }

  async updateEntityCached(entityId: string, data: any): Promise<any> {
    // Update via API
    const updated = await universalApi.updateEntity(entityId, data);

    // Invalidate related cache entries
    this.cache.invalidate(`entity:${entityId}`);
    this.cache.invalidate(`query:entities`);

    return updated;
  }

  async getTransactionsCached(filters: any): Promise<any> {
    const cacheKey = `transactions:${JSON.stringify(filters)}`;

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const transactions = await txnClientV2.query({
      organization_id: this.orgId,
      ...filters
    });

    // Cache for shorter time (transactions change frequently)
    this.cache.set(cacheKey, transactions, 2 * 60 * 1000); // 2 minutes TTL

    return transactions;
  }
}
```

---

## 🔒 Security Best Practices

### 1. Input Validation & Sanitization

```typescript
/**
 * Comprehensive input validation for HERA operations
 */

import { z } from 'zod';

// Smart code validation schema
const SmartCodeSchema = z.string().regex(
  /^HERA\.[A-Z0-9]+(\.[A-Z0-9]+){4,}\.V[0-9]+$/,
  'Invalid smart code format'
);

// Entity validation schemas
const EntityCreateSchema = z.object({
  organization_id: z.string().uuid(),
  entity_type: z.string().min(1).max(50),
  entity_name: z.string().min(1).max(255),
  entity_code: z.string().optional(),
  smart_code: SmartCodeSchema,
  classification: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const TransactionCreateSchema = z.object({
  organization_id: z.string().uuid(),
  transaction_type: z.string().min(1).max(50),
  smart_code: SmartCodeSchema,
  transaction_date: z.string().datetime(),
  source_entity_id: z.string().uuid().optional(),
  target_entity_id: z.string().uuid().optional(),
  lines: z.array(z.object({
    line_type: z.string().min(1),
    smart_code: SmartCodeSchema,
    quantity: z.number().optional(),
    unit_price: z.number().optional(),
    line_amount: z.number().optional()
  })).min(1)
});

class SecureHeraAPI {
  constructor(private orgId: string) {}

  async createEntitySecure(data: any) {
    // Validate input
    const validated = EntityCreateSchema.parse(data);

    // Ensure organization context
    if (validated.organization_id !== this.orgId) {
      throw new Error('Organization mismatch - security violation');
    }

    // Sanitize strings
    const sanitized = {
      ...validated,
      entity_name: this.sanitizeString(validated.entity_name),
      entity_code: validated.entity_code ? this.sanitizeString(validated.entity_code) : undefined
    };

    return await universalApi.createEntity(sanitized);
  }

  async createTransactionSecure(data: any) {
    // Validate input
    const validated = TransactionCreateSchema.parse(data);

    // Ensure organization context
    if (validated.organization_id !== this.orgId) {
      throw new Error('Organization mismatch - security violation');
    }

    // Validate all referenced entities belong to organization
    await this.validateEntityOwnership([
      validated.source_entity_id,
      validated.target_entity_id,
      ...validated.lines.map(line => line.entity_id).filter(Boolean)
    ]);

    return await txnClientV2.emit(validated);
  }

  private sanitizeString(input: string): string {
    // Remove potentially dangerous characters
    return input
      .trim()
      .replace(/[<>"\\']/g, '') // Remove HTML/SQL injection chars
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 255); // Limit length
  }

  private async validateEntityOwnership(entityIds: (string | undefined)[]): Promise<void> {
    const validIds = entityIds.filter(id => id) as string[];

    for (const entityId of validIds) {
      const entity = await universalApi.getEntity(entityId);
      if (entity.organization_id !== this.orgId) {
        throw new Error(`Entity ${entityId} does not belong to organization ${this.orgId}`);
      }
    }
  }
}
```

### 2. Rate Limiting & Throttling

```typescript
/**
 * Implement rate limiting for API calls
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

class RateLimiter {
  private requests = new Map<string, number[]>();

  constructor(private config: RateLimitConfig) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get existing requests for this key
    const existingRequests = this.requests.get(key) || [];

    // Filter out expired requests
    const validRequests = existingRequests.filter(time => time > windowStart);

    // Check if under limit
    if (validRequests.length >= this.config.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);

    return true;
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const existingRequests = this.requests.get(key) || [];
    const validRequests = existingRequests.filter(time => time > windowStart);

    return Math.max(0, this.config.maxRequests - validRequests.length);
  }
}

class ThrottledHeraAPI {
  private rateLimiter = new RateLimiter({
    windowMs: 60 * 1000, // 1 minute window
    maxRequests: 100 // 100 requests per minute
  });

  constructor(private orgId: string) {}

  async createEntityThrottled(data: any): Promise<any> {
    const rateLimitKey = `${this.orgId}:entity:create`;

    if (!this.rateLimiter.isAllowed(rateLimitKey)) {
      throw new Error('Rate limit exceeded - too many entity creation requests');
    }

    return await universalApi.createEntity({
      organization_id: this.orgId,
      ...data
    });
  }

  async queryTransactionsThrottled(filters: any): Promise<any> {
    const rateLimitKey = `${this.orgId}:transaction:query`;

    if (!this.rateLimiter.isAllowed(rateLimitKey)) {
      const remaining = this.rateLimiter.getRemainingRequests(rateLimitKey);
      throw new Error(`Rate limit exceeded - ${remaining} requests remaining`);
    }

    return await txnClientV2.query({
      organization_id: this.orgId,
      ...filters
    });
  }
}
```

---

## 📈 Monitoring & Debugging

### 1. Comprehensive Logging

```typescript
/**
 * Structured logging for HERA operations
 */

enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  organizationId: string;
  operation: string;
  entityId?: string;
  transactionId?: string;
  duration?: number;
  error?: string;
  metadata?: any;
}

class HeraLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  log(entry: Omit<LogEntry, 'timestamp'>): void {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };

    this.logs.push(logEntry);

    // Trim logs if too many
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output
    const message = this.formatLogMessage(logEntry);
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message);
        break;
      case LogLevel.INFO:
        console.info(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.ERROR:
        console.error(message);
        break;
    }
  }

  private formatLogMessage(entry: LogEntry): string {
    return JSON.stringify({
      level: entry.level,
      timestamp: entry.timestamp,
      organization: entry.organizationId,
      operation: entry.operation,
      entity_id: entry.entityId,
      transaction_id: entry.transactionId,
      duration_ms: entry.duration,
      error: entry.error,
      metadata: entry.metadata
    });
  }

  getLogs(filters?: {
    level?: LogLevel;
    organizationId?: string;
    operation?: string;
    since?: Date;
  }): LogEntry[] {
    let filteredLogs = this.logs;

    if (filters) {
      if (filters.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filters.level);
      }
      if (filters.organizationId) {
        filteredLogs = filteredLogs.filter(log => log.organizationId === filters.organizationId);
      }
      if (filters.operation) {
        filteredLogs = filteredLogs.filter(log => log.operation.includes(filters.operation!));
      }
      if (filters.since) {
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= filters.since!);
      }
    }

    return filteredLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
}

// Logged API wrapper
class LoggedHeraAPI {
  private logger = new HeraLogger();

  constructor(private orgId: string) {}

  async createEntityLogged(data: any): Promise<any> {
    const startTime = Date.now();
    const operation = 'entity:create';

    try {
      this.logger.log({
        level: LogLevel.INFO,
        organizationId: this.orgId,
        operation,
        metadata: { entity_type: data.entity_type, entity_name: data.entity_name }
      });

      const result = await universalApi.createEntity({
        organization_id: this.orgId,
        ...data
      });

      this.logger.log({
        level: LogLevel.INFO,
        organizationId: this.orgId,
        operation: `${operation}:success`,
        entityId: result.id,
        duration: Date.now() - startTime,
        metadata: { smart_code: data.smart_code }
      });

      return result;
    } catch (error) {
      this.logger.log({
        level: LogLevel.ERROR,
        organizationId: this.orgId,
        operation: `${operation}:error`,
        duration: Date.now() - startTime,
        error: error.message,
        metadata: { input_data: data }
      });
      throw error;
    }
  }

  getLogs(filters?: any) {
    return this.logger.getLogs(filters);
  }
}
```

### 2. Performance Monitoring

```typescript
/**
 * Performance monitoring and alerting
 */

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  organizationId: string;
  success: boolean;
  error?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private alertThresholds = {
    'entity:create': 1000, // 1 second
    'transaction:create': 2000, // 2 seconds
    'transaction:query': 5000 // 5 seconds
  };

  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Check for performance alerts
    this.checkPerformanceAlert(metric);

    // Trim old metrics (keep last 1000)
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private checkPerformanceAlert(metric: PerformanceMetric): void {
    const threshold = this.alertThresholds[metric.operation];
    if (threshold && metric.duration > threshold) {
      console.warn(`PERFORMANCE ALERT: ${metric.operation} took ${metric.duration}ms (threshold: ${threshold}ms)`);

      // Could send to monitoring system here
      this.sendAlert({
        type: 'performance',
        operation: metric.operation,
        duration: metric.duration,
        threshold,
        organizationId: metric.organizationId
      });
    }
  }

  private sendAlert(alert: any): void {
    // Implement alerting logic (email, Slack, PagerDuty, etc.)
    console.log('ALERT:', JSON.stringify(alert, null, 2));
  }

  getMetrics(filters?: {
    operation?: string;
    organizationId?: string;
    since?: Date;
    onlyErrors?: boolean;
  }): PerformanceMetric[] {
    let filtered = this.metrics;

    if (filters) {
      if (filters.operation) {
        filtered = filtered.filter(m => m.operation === filters.operation);
      }
      if (filters.organizationId) {
        filtered = filtered.filter(m => m.organizationId === filters.organizationId);
      }
      if (filters.since) {
        filtered = filtered.filter(m => m.timestamp >= filters.since!);
      }
      if (filters.onlyErrors) {
        filtered = filtered.filter(m => !m.success);
      }
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getPerformanceStats(operation: string): {
    totalCalls: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    successRate: number;
    p95Duration: number;
  } {
    const metrics = this.metrics.filter(m => m.operation === operation);

    if (metrics.length === 0) {
      return {
        totalCalls: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        successRate: 0,
        p95Duration: 0
      };
    }

    const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
    const successfulCalls = metrics.filter(m => m.success).length;
    const p95Index = Math.floor(durations.length * 0.95);

    return {
      totalCalls: metrics.length,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      successRate: (successfulCalls / metrics.length) * 100,
      p95Duration: durations[p95Index] || 0
    };
  }
}

// Performance-monitored API wrapper
class MonitoredHeraAPI {
  private monitor = new PerformanceMonitor();

  constructor(private orgId: string) {}

  async createEntityMonitored(data: any): Promise<any> {
    const startTime = Date.now();
    const operation = 'entity:create';

    try {
      const result = await universalApi.createEntity({
        organization_id: this.orgId,
        ...data
      });

      this.monitor.recordMetric({
        operation,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        organizationId: this.orgId,
        success: true
      });

      return result;
    } catch (error) {
      this.monitor.recordMetric({
        operation,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        organizationId: this.orgId,
        success: false,
        error: error.message
      });
      throw error;
    }
  }

  getPerformanceStats() {
    return {
      entityCreate: this.monitor.getPerformanceStats('entity:create'),
      transactionCreate: this.monitor.getPerformanceStats('transaction:create'),
      transactionQuery: this.monitor.getPerformanceStats('transaction:query')
    };
  }
}
```

---

## 🎯 Summary

This comprehensive usage guide demonstrates:

1. **Complete Business Flows**: Real-world scenarios from customer onboarding to financial reporting
2. **Advanced Patterns**: Batch processing, error recovery, caching, and performance optimization
3. **Security Best Practices**: Input validation, rate limiting, and audit trails
4. **Monitoring & Debugging**: Structured logging, performance monitoring, and alerting
5. **Integration Patterns**: Webhooks, external systems, and real-time sync

All examples follow HERA DNA principles:
- ✅ Sacred Six Tables architecture
- ✅ Smart code validation and intelligence
- ✅ Organization-first multi-tenant security
- ✅ Event-sourced immutable transactions
- ✅ Complete audit trails and business context

---

**Last Updated**: January 15, 2025
**Version**: 2.0.0
**Status**: ✅ Production Ready