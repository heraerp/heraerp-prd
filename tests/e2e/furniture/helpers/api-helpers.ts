/**
 * API helpers for Furniture Module tests
 */

import { Page, APIRequestContext } from '@playwright/test';

/**
 * Wait for Universal API response with specific action
 */
export async function waitForUniversalApiResponse(
  page: Page, 
  action: string, 
  timeout: number = 30000
): Promise<any> {
  const response = await page.waitForResponse(
    resp => resp.url().includes('/api/v1/universal') && 
           resp.url().includes(`action=${action}`),
    { timeout }
  );
  
  const data = await response.json();
  
  if (!response.ok()) {
    throw new Error(`Universal API error: ${data.error || 'Unknown error'}`);
  }
  
  return data;
}

/**
 * Create entity via Universal API
 */
export async function createEntity(
  request: APIRequestContext,
  organizationId: string,
  entity: {
    entity_type: string;
    entity_name: string;
    entity_code: string;
    smart_code: string;
    metadata?: any;
  }
): Promise<string> {
  const response = await request.post('/api/v1/universal', {
    headers: {
      'x-organization-id': organizationId
    },
    data: {
      action: 'create',
      table: 'core_entities',
      data: {
        ...entity,
        organization_id: organizationId
      }
    }
  });

  const data = await response.json();
  
  if (!response.ok()) {
    throw new Error(`Failed to create entity: ${data.error}`);
  }
  
  return data.data.id;
}

/**
 * Create relationship between entities
 */
export async function createRelationship(
  request: APIRequestContext,
  organizationId: string,
  relationship: {
    from_entity_id: string;
    to_entity_id: string;
    relationship_type: string;
    smart_code: string;
    metadata?: any;
  }
): Promise<string> {
  const response = await request.post('/api/v1/universal', {
    headers: {
      'x-organization-id': organizationId
    },
    data: {
      action: 'create',
      table: 'core_relationships',
      data: {
        ...relationship,
        organization_id: organizationId
      }
    }
  });

  const data = await response.json();
  
  if (!response.ok()) {
    throw new Error(`Failed to create relationship: ${data.error}`);
  }
  
  return data.data.id;
}

/**
 * Create transaction with line items
 */
export async function createTransaction(
  request: APIRequestContext,
  organizationId: string,
  transaction: {
    transaction_type: string;
    transaction_code: string;
    transaction_date: string;
    from_entity_id?: string;
    to_entity_id?: string;
    total_amount: number;
    smart_code: string;
    metadata?: any;
  },
  lineItems: Array<{
    line_entity_id: string;
    line_number: number;
    quantity: number;
    unit_price: number;
    line_amount: number;
    smart_code: string;
    metadata?: any;
  }>
): Promise<string> {
  const response = await request.post('/api/v1/universal', {
    headers: {
      'x-organization-id': organizationId
    },
    data: {
      action: 'create_transaction',
      transaction: {
        ...transaction,
        organization_id: organizationId
      },
      lineItems: lineItems.map(item => ({
        ...item,
        organization_id: organizationId
      }))
    }
  });

  const data = await response.json();
  
  if (!response.ok()) {
    throw new Error(`Failed to create transaction: ${data.error}`);
  }
  
  return data.data.transaction.id;
}

/**
 * Add dynamic field to entity
 */
export async function addDynamicField(
  request: APIRequestContext,
  organizationId: string,
  entityId: string,
  field: {
    field_name: string;
    field_value_text?: string;
    field_value_number?: number;
    field_value_date?: string;
    field_value_boolean?: boolean;
    metadata?: any;
  }
): Promise<void> {
  const response = await request.post('/api/v1/universal', {
    headers: {
      'x-organization-id': organizationId
    },
    data: {
      action: 'create',
      table: 'core_dynamic_data',
      data: {
        entity_id: entityId,
        ...field,
        organization_id: organizationId
      }
    }
  });

  if (!response.ok()) {
    const data = await response.json();
    throw new Error(`Failed to add dynamic field: ${data.error}`);
  }
}

/**
 * Get entity by code
 */
export async function getEntityByCode(
  request: APIRequestContext,
  organizationId: string,
  entityCode: string
): Promise<any> {
  const response = await request.get('/api/v1/universal', {
    headers: {
      'x-organization-id': organizationId
    },
    params: {
      action: 'read',
      table: 'core_entities',
      filter: JSON.stringify({ entity_code: entityCode })
    }
  });

  const data = await response.json();
  
  if (!response.ok()) {
    throw new Error(`Failed to get entity: ${data.error}`);
  }
  
  return data.data[0];
}

/**
 * Execute UCR rule
 */
export async function executeUCRRule(
  request: APIRequestContext,
  organizationId: string,
  rule: {
    ruleName: string;
    context: any;
    entity_id?: string;
    transaction_id?: string;
  }
): Promise<{
  passed: boolean;
  message?: string;
  severity?: string;
}> {
  const response = await request.post('/api/v1/ucr/execute', {
    headers: {
      'x-organization-id': organizationId
    },
    data: rule
  });

  const data = await response.json();
  
  if (!response.ok()) {
    throw new Error(`UCR execution failed: ${data.error}`);
  }
  
  return data;
}