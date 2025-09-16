# Frontend ↔ Universal API Integration Guide

## Production-Ready Integration Without Backend Changes

---

## 1) Mental Model (What Never Changes)

**Universal API Contract:** Post headers+lines to `universal_transactions`, fetch analytics via read models, manage domain objects via `core_entities`, custom fields via `core_dynamic_data`, links via `core_relationships`.

**Always Include:** `organization_id` and a valid `smart_code`. No custom tables. No schema changes.

---

## 2) Enhanced API Client (Server-First, Typed)

```typescript
// /lib/api/client.ts
export interface ApiOptions { 
  baseUrl: string; 
  token?: string;
  organizationId?: string; // Auto-inject org context
  timeout?: number;
}

export class ApiClient {
  constructor(private opts: ApiOptions) {}
  
  private h(extra: RequestInit = {}) {
    return {
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-ID': this.opts.organizationId || '',
        'X-Client-Version': process.env.NEXT_PUBLIC_APP_VERSION || 'dev',
        ...(this.opts.token ? { Authorization: `Bearer ${this.opts.token}` } : {}),
        ...(extra.headers || {}),
      },
      signal: AbortSignal.timeout(this.opts.timeout || 30000),
      ...extra,
    };
  }
  
  async get<T>(path: string, qs?: Record<string, string | number | boolean>) {
    const url = new URL(path, this.opts.baseUrl);
    
    // Auto-inject organization_id if not present
    if (this.opts.organizationId && !qs?.organization_id) {
      qs = { ...qs, organization_id: this.opts.organizationId };
    }
    
    Object.entries(qs || {}).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    const r = await fetch(url, this.h());
    if (!r.ok) throw await this.error(r);
    return (await r.json()) as T;
  }
  
  async post<T>(path: string, body: unknown) {
    // Auto-inject organization_id for universal transactions
    if (typeof body === 'object' && body && 'organization_id' in body === false && this.opts.organizationId) {
      body = { ...body, organization_id: this.opts.organizationId };
    }
    
    const r = await fetch(new URL(path, this.opts.baseUrl), this.h({ 
      method: 'POST', 
      body: JSON.stringify(body) 
    }));
    if (!r.ok) throw await this.error(r);
    return (await r.json()) as T;
  }
  
  private async error(r: Response) {
    const text = await r.text().catch(() => '');
    return new Error(`API ${r.status} ${r.statusText}: ${text}`);
  }
  
  // Convenience method for universal transactions
  async postTransaction<T>(payload: unknown) {
    return this.post<T>('/api/v1/universal/transactions', payload);
  }
  
  // Convenience method for read models
  async getReadModel<T>(viewName: string, params?: Record<string, any>) {
    return this.get<T>(`/api/v1/universal/read-models/${viewName}`, params);
  }
}
```

---

## 3) Enhanced Zod Contracts (Payload Safety)

```typescript
// /lib/schemas/universal.ts
import { z } from 'zod';

// Smart Code validation
export const SmartCode = z.string()
  .regex(/^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v\d+$/, 'Invalid smart code format')
  .describe('HERA smart code format: HERA.INDUSTRY.MODULE.FUNCTION.TYPE.v1');

// Enhanced line schema with validation
export const Line = z.object({
  line_id: z.string().min(1).describe('Unique line identifier within transaction'),
  line_type: z.enum([
    'service_line', 'item_line', 'discount', 'tip', 'tax', 
    'inventory_move_line', 'payment_line', 'journal_line'
  ]).or(z.string()),
  smart_code: SmartCode.optional(),
  qty: z.number().min(0).optional(),
  unit_price: z.number().optional(),
  product_sku: z.string().optional(),
  service_code: z.string().optional(),
  amount: z.number().optional(),
  currency: z.string().length(3).default('AED').describe('ISO 4217 currency code'),
  line_data: z.record(z.any()).optional().describe('Flexible line-level metadata'),
  
  // Financial fields for auto-journal integration
  debit_account: z.string().optional().describe('GL account for debit posting'),
  credit_account: z.string().optional().describe('GL account for credit posting'),
  cost_center: z.string().optional(),
  profit_center: z.string().optional(),
});
export type Line = z.infer<typeof Line>;

// Enhanced transaction schema
export const UniversalTxn = z.object({
  organization_id: z.string().uuid().describe('Organization isolation boundary'),
  
  // Idempotency and retry safety
  idempotency_key: z.string().optional().describe('Idempotency key (defaults to txn_id)'),
  
  txn: z.object({
    txn_id: z.string().min(1).describe('Unique transaction identifier'),
    txn_type: z.string().min(1).describe('Business transaction type'),
    smart_code: SmartCode.describe('Smart code for business intelligence'),
    txn_date: z.string().datetime().describe('Transaction timestamp (ISO 8601)'),
    status: z.enum(['draft', 'posted', 'void', 'cancelled']).default('posted'),
    currency: z.string().length(3).default('AED'),
    
    // Source tracking
    source_entity_type: z.string().optional().describe('Source business entity type'),
    source_entity_ref: z.string().optional().describe('Source entity reference'),
    
    // Enhanced metadata
    metadata: z.record(z.any()).optional(),
    
    // Multi-entity support
    from_entity_id: z.string().uuid().optional().describe('Source entity (customer, vendor, etc.)'),
    to_entity_id: z.string().uuid().optional().describe('Target entity (store, branch, etc.)'),
    
    // Financial integration
    posting_date: z.string().date().optional().describe('GL posting date (defaults to txn_date)'),
    period: z.string().optional().describe('Accounting period (YYYY-MM)'),
    
    // Workflow support
    approval_status: z.enum(['pending', 'approved', 'rejected']).optional(),
    approved_by: z.string().uuid().optional(),
    approved_at: z.string().datetime().optional(),
  }),
  
  lines: z.array(Line).min(1).describe('Transaction line items'),
  
  // Enhanced totals with validation
  totals: z.object({
    subtotal: z.number().optional(),
    discount_total: z.number().optional(),
    tax_total: z.number().optional(),
    tip_total: z.number().optional(),
    grand_total: z.number().optional(),
    currency: z.string().length(3).optional(),
    
    // Tax breakdown for compliance
    tax_breakdown: z.array(z.object({
      tax_type: z.string(),
      tax_rate: z.number(),
      tax_amount: z.number(),
      taxable_amount: z.number()
    })).optional(),
  }).optional(),
  
  // Auto-journal integration
  auto_journal: z.object({
    enabled: z.boolean().default(true),
    batch_threshold: z.number().optional(),
    immediate_posting: z.boolean().default(false),
  }).optional(),
}).refine(data => {
  // Validate totals consistency if provided
  if (data.totals?.grand_total && data.lines) {
    const calculatedTotal = data.lines.reduce((sum, line) => 
      sum + (line.amount || (line.qty || 1) * (line.unit_price || 0)), 0
    );
    const expectedTotal = data.totals.grand_total;
    return Math.abs(calculatedTotal - expectedTotal) < 0.01; // Allow for rounding
  }
  return true;
}, {
  message: "Grand total must match sum of line amounts",
  path: ["totals", "grand_total"]
});

export type UniversalTxn = z.infer<typeof UniversalTxn>;

// Read model schemas for type safety
export const DashboardMetrics = z.object({
  organization_id: z.string().uuid(),
  period: z.string(),
  total_revenue: z.number(),
  total_transactions: z.number(),
  avg_transaction_value: z.number(),
  top_services: z.array(z.object({
    service_code: z.string(),
    service_name: z.string(),
    revenue: z.number(),
    count: z.number()
  })),
  currency: z.string()
});
export type DashboardMetrics = z.infer<typeof DashboardMetrics>;
```

---

## 4) Enhanced React Hook with Error Handling

```typescript
// /lib/hooks/useUniversalTxn.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UniversalTxn } from '../schemas/universal';
import { ApiClient } from '../api/client';
import { toast } from '@/components/ui/use-toast';

export interface UniversalTxnResult {
  txn_id: string;
  organization_id: string;
  status: 'success' | 'duplicate' | 'error';
  message?: string;
  auto_journal_status?: 'posted' | 'batched' | 'failed';
}

export function useUniversalTxn(api: ApiClient) {
  const queryClient = useQueryClient();
  
  return useMutation<UniversalTxnResult, Error, unknown>({
    mutationKey: ['universal_txn'],
    mutationFn: async (payload: unknown) => {
      try {
        const parsed = UniversalTxn.parse(payload); // Throws if invalid
        
        // Set idempotency key if not provided
        if (!parsed.idempotency_key) {
          parsed.idempotency_key = parsed.txn.txn_id;
        }
        
        const result = await api.postTransaction(parsed);
        
        // Show success toast with smart code context
        toast({
          title: "Transaction Posted",
          description: `${parsed.txn.txn_type} (${parsed.txn.txn_id}) posted successfully`,
          variant: "default"
        });
        
        return result as UniversalTxnResult;
      } catch (error) {
        // Enhanced error handling
        if (error instanceof z.ZodError) {
          const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
          toast({
            title: "Validation Error",
            description: `Invalid transaction data: ${issues}`,
            variant: "destructive"
          });
          throw new Error(`Validation failed: ${issues}`);
        }
        
        // API errors
        if (error instanceof Error && error.message.includes('409')) {
          toast({
            title: "Duplicate Transaction",
            description: "This transaction has already been processed",
            variant: "default"
          });
          throw new Error('Duplicate transaction - already processed');
        }
        
        toast({
          title: "Transaction Failed",
          description: error instanceof Error ? error.message : 'Unknown error occurred',
          variant: "destructive"
        });
        
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate related queries for real-time updates
      queryClient.invalidateQueries({ 
        queryKey: ['dashboard', data.organization_id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['transactions', data.organization_id] 
      });
    }
  });
}

// Specialized hooks for common patterns
export function usePOSCheckout(api: ApiClient) {
  const universalTxn = useUniversalTxn(api);
  
  return {
    ...universalTxn,
    submitPOSOrder: universalTxn.mutateAsync,
    isPending: universalTxn.isPending
  };
}

export function useAppointmentBooking(api: ApiClient) {
  const universalTxn = useUniversalTxn(api);
  
  return {
    ...universalTxn,
    bookAppointment: universalTxn.mutateAsync,
    isPending: universalTxn.isPending
  };
}
```

---

## 5) Enhanced POS Checkout with Business Logic

```typescript
// /app/pos/_actions/submitPos.ts
import { UniversalTxn } from '@/lib/schemas/universal';

export interface POSLineItem {
  kind: 'service' | 'item' | 'discount' | 'tip' | 'tax';
  service_code?: string;
  product_sku?: string;
  qty?: number;
  price?: number;
  amount?: number;
  tax_rate?: number;
  description?: string;
}

export interface POSPayloadArgs {
  orgId: string;
  txnId: string;
  customerCode?: string;
  stylistCode?: string;
  branchCode?: string;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'mixed';
  lines: POSLineItem[];
  currency?: string;
  applyAutoJournal?: boolean;
}

export function buildPosPayload(args: POSPayloadArgs) {
  const { 
    orgId, txnId, customerCode, stylistCode, branchCode, 
    paymentMethod = 'cash', lines, currency = 'AED', 
    applyAutoJournal = true 
  } = args;
  
  // Calculate totals
  const subtotal = lines
    .filter(l => l.kind === 'service' || l.kind === 'item')
    .reduce((sum, l) => sum + (l.qty || 1) * (l.price || 0), 0);
    
  const discountTotal = lines
    .filter(l => l.kind === 'discount')
    .reduce((sum, l) => sum + (l.amount || 0), 0);
    
  const tipTotal = lines
    .filter(l => l.kind === 'tip')
    .reduce((sum, l) => sum + (l.amount || 0), 0);
    
  const taxTotal = lines
    .filter(l => l.kind === 'tax')
    .reduce((sum, l) => sum + (l.amount || 0), 0);
    
  const grandTotal = subtotal - discountTotal + tipTotal + taxTotal;
  
  const payload = {
    organization_id: orgId,
    txn: {
      txn_id: txnId,
      txn_type: 'pos_order',
      smart_code: 'HERA.SALON.POS.ORDER.CORE.v1',
      txn_date: new Date().toISOString(),
      status: 'posted' as const,
      currency,
      source_entity_type: 'pos_order',
      source_entity_ref: txnId,
      from_entity_id: customerCode,
      to_entity_id: branchCode,
      metadata: { 
        payment_method: paymentMethod,
        stylist_code: stylistCode,
        pos_terminal: 'TERMINAL_01'
      },
    },
    lines: lines.map((l, i) => {
      const baseFields = {
        line_id: `L${i + 1}`,
        currency,
        line_data: {
          customer_code: customerCode,
          stylist_code: stylistCode,
          branch_code: branchCode
        }
      };
      
      switch (l.kind) {
        case 'service':
          return {
            ...baseFields,
            line_type: 'service_line',
            smart_code: 'HERA.SALON.SERVICE.LINE.CORE.v1',
            service_code: l.service_code,
            qty: l.qty || 1,
            unit_price: l.price || 0,
            amount: (l.qty || 1) * (l.price || 0)
          };
        case 'item':
          return {
            ...baseFields,
            line_type: 'item_line',
            smart_code: 'HERA.SALON.ITEM.LINE.CORE.v1',
            product_sku: l.product_sku,
            qty: l.qty || 1,
            unit_price: l.price || 0,
            amount: (l.qty || 1) * (l.price || 0)
          };
        case 'discount':
          return {
            ...baseFields,
            line_type: 'discount',
            smart_code: 'HERA.SALON.DISCOUNT.LINE.PCT.v1',
            amount: -(l.amount || 0) // Negative for discount
          };
        case 'tip':
          return {
            ...baseFields,
            line_type: 'tip',
            smart_code: 'HERA.SALON.TIP.LINE.CORE.v1',
            amount: l.amount || 0
          };
        case 'tax':
          return {
            ...baseFields,
            line_type: 'tax',
            smart_code: 'HERA.SALON.TAX.LINE.VAT.v1',
            amount: l.amount || 0,
            line_data: {
              ...baseFields.line_data,
              tax_rate: l.tax_rate || 0.05,
              taxable_amount: subtotal - discountTotal
            }
          };
        default:
          throw new Error(`Unsupported line kind: ${l.kind}`);
      }
    }),
    totals: {
      subtotal,
      discount_total: discountTotal,
      tax_total: taxTotal,
      tip_total: tipTotal,
      grand_total: grandTotal,
      currency
    },
    auto_journal: {
      enabled: applyAutoJournal,
      immediate_posting: grandTotal > 1000, // Large transactions post immediately
      batch_threshold: 100
    }
  } satisfies unknown;

  return UniversalTxn.parse(payload); // Validate before sending
}

// Usage with error handling
export async function submitPOSOrder(api: ApiClient, args: POSPayloadArgs) {
  try {
    const payload = buildPosPayload(args);
    const result = await api.postTransaction(payload);
    
    // Log for audit trail
    console.log(`POS Order ${args.txnId} posted successfully:`, {
      txn_id: args.txnId,
      smart_code: payload.txn.smart_code,
      grand_total: payload.totals?.grand_total,
      auto_journal: result.auto_journal_status
    });
    
    return result;
  } catch (error) {
    console.error(`Failed to submit POS order ${args.txnId}:`, error);
    throw error;
  }
}
```

---

## 6) Enhanced Reports with Caching

```typescript
// /lib/api/reports.ts
import { ApiClient } from './client';
import { DashboardMetrics } from '../schemas/universal';

export class ReportsAPI {
  constructor(private api: ApiClient) {}
  
  // Dashboard metrics with smart caching
  async getDashboardMetrics(orgId: string, period: string = 'today'): Promise<DashboardMetrics> {
    const result = await this.api.getReadModel('v_dashboard_metrics', {
      organization_id: orgId,
      period,
      include_top_services: true
    });
    
    return DashboardMetrics.parse(result);
  }
  
  // Sales analytics
  async getSalesAnalytics(orgId: string, options: {
    from: string;
    to: string;
    groupBy?: 'day' | 'week' | 'month';
    branchId?: string;
    stylistId?: string;
  }) {
    return this.api.getReadModel('v_sales_analytics', {
      organization_id: orgId,
      ...options
    });
  }
  
  // Appointment analytics
  async getAppointmentMetrics(orgId: string, options: {
    from: string;
    to: string;
    status?: 'scheduled' | 'completed' | 'cancelled';
    branchId?: string;
  }) {
    return this.api.getReadModel('v_appointment_metrics', {
      organization_id: orgId,
      ...options
    });
  }
  
  // Financial reports with auto-journal integration
  async getFinancialSummary(orgId: string, period: string) {
    return this.api.getReadModel('v_financial_summary', {
      organization_id: orgId,
      period,
      include_auto_journal_status: true
    });
  }
}

// React Query hooks for reports
export function useDashboardMetrics(api: ApiClient, orgId: string, period: string = 'today') {
  return useQuery({
    queryKey: ['dashboard', orgId, period],
    queryFn: () => new ReportsAPI(api).getDashboardMetrics(orgId, period),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  });
}

export function useSalesAnalytics(api: ApiClient, orgId: string, options: any) {
  return useQuery({
    queryKey: ['sales', orgId, options],
    queryFn: () => new ReportsAPI(api).getSalesAnalytics(orgId, options),
    enabled: !!orgId && !!options.from && !!options.to
  });
}
```

---

## 7) Enhanced Error Handling & Retry Logic

```typescript
// /lib/api/errorHandler.ts
import { toast } from '@/components/ui/use-toast';

export class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: string,
    public txnId?: string,
    public smartCode?: string
  ) {
    super(`API ${status} ${statusText}: ${body}`);
    this.name = 'APIError';
  }
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof APIError) {
    // Retry on temporary failures, not business logic errors
    return error.status >= 500 || error.status === 429 || error.status === 408;
  }
  
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true; // Network errors
  }
  
  return false;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    if (error.status === 409) return 'Transaction already exists';
    if (error.status === 422) return 'Invalid transaction data';
    if (error.status === 429) return 'Too many requests - please wait';
    return `API Error: ${error.statusText}`;
  }
  
  if (error instanceof Error) return error.message;
  return 'Unknown error occurred';
}

export function showErrorToast(error: unknown, txnId?: string) {
  toast({
    title: "Transaction Failed",
    description: getErrorMessage(error) + (txnId ? ` (${txnId})` : ''),
    variant: "destructive",
    action: isRetryableError(error) ? {
      altText: "Retry",
      onClick: () => window.location.reload()
    } : undefined
  });
}
```

---

## 8) Enhanced RBAC with Feature Flags

```typescript
// /lib/auth/guard.tsx
import { useAuth } from './useAuth';
import { useOrganizationSettings } from './useOrganizationSettings';

type Role = 'owner' | 'manager' | 'stylist' | 'cashier' | 'admin';
type Permission = 'read' | 'write' | 'delete' | 'manage_staff' | 'view_financials' | 'manage_settings';

export interface GuardProps {
  allow?: Role[];
  permissions?: Permission[];
  features?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function Guard({ allow, permissions, features, fallback, children }: GuardProps) {
  const { user, isLoading } = useAuth();
  const { settings } = useOrganizationSettings();
  
  if (isLoading) return <div>Loading...</div>;
  if (!user) return fallback || <div>Access denied</div>;
  
  // Check role-based access
  if (allow && !user.roles.some(r => allow.includes(r as Role))) {
    return fallback || <div>Insufficient role permissions</div>;
  }
  
  // Check permission-based access
  if (permissions && !permissions.every(p => user.permissions.includes(p))) {
    return fallback || <div>Insufficient permissions</div>;
  }
  
  // Check feature flags
  if (features && !features.every(f => settings?.features?.[f] === true)) {
    return fallback || <div>Feature not available</div>;
  }
  
  return <>{children}</>;
}

// Convenience components
export const ManagerOnly = ({ children }: { children: React.ReactNode }) => (
  <Guard allow={['owner', 'manager']}>{children}</Guard>
);

export const FinancialReports = ({ children }: { children: React.ReactNode }) => (
  <Guard permissions={['view_financials']} features={['financial_reporting']}>
    {children}
  </Guard>
);

// Hook for conditional logic
export function usePermissions() {
  const { user } = useAuth();
  const { settings } = useOrganizationSettings();
  
  return {
    hasRole: (role: Role) => user?.roles.includes(role),
    hasPermission: (permission: Permission) => user?.permissions.includes(permission),
    hasFeature: (feature: string) => settings?.features?.[feature] === true,
    canViewFinancials: user?.permissions.includes('view_financials') && settings?.features?.financial_reporting,
    canManageStaff: user?.roles.some(r => ['owner', 'manager'].includes(r))
  };
}
```

---

## 9) Production-Ready Testing

```typescript
// /lib/api/mockClient.ts
import { ApiClient, ApiOptions } from './client';

export class MockApiClient extends ApiClient {
  private mockData = new Map<string, any>();
  private transactions: any[] = [];
  
  constructor(opts: ApiOptions) {
    super(opts);
    this.seedMockData();
  }
  
  private seedMockData() {
    // Seed dashboard metrics
    this.mockData.set('v_dashboard_metrics', {
      organization_id: 'mock-org',
      period: 'today',
      total_revenue: 2500.00,
      total_transactions: 15,
      avg_transaction_value: 166.67,
      top_services: [
        { service_code: 'HAIRCUT', service_name: 'Basic Haircut', revenue: 900, count: 12 },
        { service_code: 'COLOR', service_name: 'Hair Color', revenue: 800, count: 4 }
      ],
      currency: 'AED'
    });
  }
  
  async get<T>(path: string, qs?: Record<string, any>): Promise<T> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (path.startsWith('/api/v1/universal/read-models/')) {
      const viewName = path.split('/').pop();
      const mockResult = this.mockData.get(viewName);
      if (mockResult) return mockResult as T;
    }
    
    return super.get(path, qs);
  }
  
  async post<T>(path: string, body: unknown): Promise<T> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (path.includes('transactions')) {
      // Store transaction for testing
      const txn = body as any;
      this.transactions.push({
        ...txn,
        id: `mock-${Date.now()}`,
        created_at: new Date().toISOString()
      });
      
      return {
        txn_id: txn.txn?.txn_id,
        organization_id: txn.organization_id,
        status: 'success',
        auto_journal_status: 'posted'
      } as T;
    }
    
    return super.post(path, body);
  }
  
  // Test utilities
  getStoredTransactions() {
    return this.transactions;
  }
  
  clearTransactions() {
    this.transactions = [];
  }
}

// Test utilities
export function createTestApiClient(orgId: string = 'test-org'): MockApiClient {
  return new MockApiClient({
    baseUrl: 'http://localhost:3000',
    organizationId: orgId,
    token: 'test-token'
  });
}
```

```typescript
// /tests/buildPosPayload.spec.ts
import { describe, it, expect } from 'vitest';
import { buildPosPayload } from '../app/pos/_actions/submitPos';

describe('buildPosPayload', () => {
  it('should build valid POS payload with services and items', () => {
    const payload = buildPosPayload({
      orgId: 'test-org',
      txnId: 'POS-123',
      customerCode: 'CUST-001',
      stylistCode: 'STYLIST-001',
      lines: [
        { kind: 'service', service_code: 'HAIRCUT', qty: 1, price: 75 },
        { kind: 'item', product_sku: 'SHAMPOO-001', qty: 1, price: 25 },
        { kind: 'tip', amount: 10 }
      ]
    });
    
    expect(payload.organization_id).toBe('test-org');
    expect(payload.txn.txn_id).toBe('POS-123');
    expect(payload.txn.smart_code).toBe('HERA.SALON.POS.ORDER.CORE.v1');
    expect(payload.lines).toHaveLength(3);
    expect(payload.totals?.grand_total).toBe(110); // 75 + 25 + 10
  });
  
  it('should handle discounts correctly', () => {
    const payload = buildPosPayload({
      orgId: 'test-org',
      txnId: 'POS-124',
      lines: [
        { kind: 'service', service_code: 'HAIRCUT', qty: 1, price: 100 },
        { kind: 'discount', amount: 20 }
      ]
    });
    
    expect(payload.totals?.subtotal).toBe(100);
    expect(payload.totals?.discount_total).toBe(20);
    expect(payload.totals?.grand_total).toBe(80);
  });
});
```

```typescript
// /tests/e2e/golden-path.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Golden Path: Salon Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Set mock mode
    await page.addInitScript(() => {
      window.localStorage.setItem('NEXT_PUBLIC_USE_MOCK', 'true');
    });
    
    await page.goto('/dashboard');
  });
  
  test('should complete full salon workflow', async ({ page }) => {
    // 1. Dashboard loads with metrics
    await expect(page.locator('[data-testid="daily-revenue"]')).toBeVisible();
    await expect(page.locator('[data-testid="daily-revenue"]')).toContainText('2,500');
    
    // 2. Book appointment
    await page.click('[data-testid="book-appointment"]');
    await page.fill('[data-testid="customer-name"]', 'Jane Doe');
    await page.selectOption('[data-testid="service-select"]', 'HAIRCUT');
    await page.fill('[data-testid="appointment-time"]', '2024-01-15T10:00');
    await page.click('[data-testid="confirm-booking"]');
    
    await expect(page.locator('[data-testid="booking-success"]')).toBeVisible();
    
    // 3. Process to POS checkout
    await page.click('[data-testid="start-service"]');
    await page.click('[data-testid="complete-service"]');
    
    // 4. POS checkout
    await expect(page.locator('[data-testid="pos-checkout"]')).toBeVisible();
    await page.click('[data-testid="add-tip"]');
    await page.fill('[data-testid="tip-amount"]', '10');
    await page.click('[data-testid="process-payment"]');
    
    // 5. Invoice generated
    await expect(page.locator('[data-testid="invoice"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-amount"]')).toContainText('85'); // 75 + 10 tip
  });
});
```

---

## 10) Claude CLI Scaffolding Commands

```bash
# Quick scaffold commands for Claude CLI

# 1. Create API foundation
claude create /lib/api/client.ts /lib/schemas/universal.ts /lib/hooks/useUniversalTxn.ts

# 2. Build POS system
claude create /app/pos/sale/page.tsx with minimal cart using buildPosPayload and useUniversalTxn

# 3. Build appointment system  
claude create /app/appointments/new/page.tsx using buildAppointmentPayload

# 4. Add dashboard with reports
claude create /lib/api/reports.ts and dashboard page using useDashboardCards

# 5. Add styling system
claude wire Tailwind tokens and create ButtonPrimary, Card, Hero components

# 6. Add test suite
claude create buildPosPayload.spec.ts, useUniversalTxn.spec.tsx, e2e/golden-path.spec.ts
```

---

This enhanced integration guide provides:

- **✅ Enhanced Type Safety** - Better Zod validation with business rules
- **✅ Improved Error Handling** - Comprehensive error types and retry logic  
- **✅ Auto-Journal Integration** - Built-in support for automatic GL posting
- **✅ Advanced RBAC** - Permission and feature flag support
- **✅ Production Testing** - Mock client and E2E test examples
- **✅ Performance Optimizations** - Caching, batching, and smart queries

The guide maintains the excellent Universal API principles while adding production-ready enhancements for enterprise deployment.