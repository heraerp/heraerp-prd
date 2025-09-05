# UCR + Guardrail + Fiscal DNA Examples

## Working Examples for Salon and Restaurant Industries

### 1. Salon P&L Report Example

**API Call:**
```bash
GET /api/v1/reports/pl?period=2025-01&organization_id=e3a9ff9e-bb83-43a8-b062-b85e7a2b4258
```

**Response:**
```json
{
  "success": true,
  "report": {
    "report_type": "pl",
    "organization_id": "e3a9ff9e-bb83-43a8-b062-b85e7a2b4258",
    "period": "2025-01",
    "currency": "AED",
    "sections": [
      {
        "section_name": "Revenue",
        "lines": [
          {
            "account_name": "Hair Services",
            "smart_code": "HERA.SALON.REVENUE.SERVICE.HAIR.v1",
            "amount": 85000,
            "percentage_of_total": 42.5
          },
          {
            "account_name": "Beauty Services", 
            "smart_code": "HERA.SALON.REVENUE.SERVICE.BEAUTY.v1",
            "amount": 45000,
            "percentage_of_total": 22.5
          },
          {
            "account_name": "Product Sales",
            "smart_code": "HERA.SALON.REVENUE.PRODUCT.RETAIL.v1", 
            "amount": 20000,
            "percentage_of_total": 10.0
          }
        ],
        "subtotal": 150000,
        "display_order": 1
      },
      {
        "section_name": "Cost of Goods Sold",
        "lines": [
          {
            "account_name": "Product Costs",
            "smart_code": "HERA.SALON.COGS.PRODUCTS.v1",
            "amount": 12000,
            "percentage_of_total": 6.0
          },
          {
            "account_name": "Service Supplies",
            "smart_code": "HERA.SALON.COGS.SUPPLIES.v1",
            "amount": 8000,
            "percentage_of_total": 4.0
          }
        ],
        "subtotal": 20000,
        "display_order": 2
      },
      {
        "section_name": "Operating Expenses",
        "lines": [
          {
            "account_name": "Staff Salaries",
            "smart_code": "HERA.SALON.EXPENSE.PAYROLL.STAFF.v1",
            "amount": 65000,
            "percentage_of_total": 32.5
          },
          {
            "account_name": "Rent",
            "smart_code": "HERA.SALON.EXPENSE.OPERATING.RENT.v1",
            "amount": 15000,
            "percentage_of_total": 7.5
          },
          {
            "account_name": "Utilities",
            "smart_code": "HERA.SALON.EXPENSE.OPERATING.UTILITIES.v1",
            "amount": 3500,
            "percentage_of_total": 1.75
          }
        ],
        "subtotal": 83500,
        "display_order": 3
      }
    ],
    "totals": {
      "revenue": 150000,
      "cost_of_goods_sold": 20000,
      "gross_profit": 130000,
      "operating_expenses": 83500,
      "operating_income": 46500,
      "net_income": 46500
    }
  }
}
```

### 2. Restaurant Cash Flow Report Example

**API Call:**
```bash
GET /api/v1/reports/cashflow?period=2025-Q1&organization_id=mario-restaurant-uuid
```

**Response:**
```json
{
  "success": true,
  "report": {
    "report_type": "cashflow",
    "organization_id": "mario-restaurant-uuid",
    "period": "2025-Q1",
    "currency": "USD",
    "sections": [
      {
        "section_name": "Operating Activities",
        "lines": [
          {
            "account_name": "Cash from Food Sales",
            "smart_code": "HERA.REST.CASHFLOW.OPERATING.SALES.FOOD.v1",
            "amount": 485000,
            "percentage_of_total": 65.5
          },
          {
            "account_name": "Cash from Beverage Sales",
            "smart_code": "HERA.REST.CASHFLOW.OPERATING.SALES.BEVERAGE.v1",
            "amount": 125000,
            "percentage_of_total": 16.9
          },
          {
            "account_name": "Payments to Suppliers",
            "smart_code": "HERA.REST.CASHFLOW.OPERATING.SUPPLIERS.v1",
            "amount": -180000,
            "percentage_of_total": -24.3
          },
          {
            "account_name": "Staff Wages Paid",
            "smart_code": "HERA.REST.CASHFLOW.OPERATING.PAYROLL.v1",
            "amount": -210000,
            "percentage_of_total": -28.4
          }
        ],
        "subtotal": 220000,
        "display_order": 1
      },
      {
        "section_name": "Investing Activities",
        "lines": [
          {
            "account_name": "Kitchen Equipment Purchase",
            "smart_code": "HERA.REST.CASHFLOW.INVESTING.EQUIPMENT.v1",
            "amount": -45000,
            "percentage_of_total": -6.1
          },
          {
            "account_name": "POS System Upgrade",
            "smart_code": "HERA.REST.CASHFLOW.INVESTING.TECHNOLOGY.v1",
            "amount": -12000,
            "percentage_of_total": -1.6
          }
        ],
        "subtotal": -57000,
        "display_order": 2
      },
      {
        "section_name": "Financing Activities",
        "lines": [
          {
            "account_name": "Business Loan Payment",
            "smart_code": "HERA.REST.CASHFLOW.FINANCING.LOAN.PAYMENT.v1",
            "amount": -25000,
            "percentage_of_total": -3.4
          },
          {
            "account_name": "Owner Investment",
            "smart_code": "HERA.REST.CASHFLOW.FINANCING.EQUITY.INVESTMENT.v1",
            "amount": 50000,
            "percentage_of_total": 6.8
          }
        ],
        "subtotal": 25000,
        "display_order": 3
      }
    ],
    "totals": {
      "operating_activities": 220000,
      "investing_activities": -57000,
      "financing_activities": 25000,
      "net_cash_flow": 188000,
      "beginning_cash": 125000,
      "ending_cash": 313000
    }
  }
}
```

### 3. UCR Template Index Example

**API Call:**
```bash
GET /api/v1/config/templates/index?organization_id=org-123&industry=salon
```

**Response:**
```json
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "last_updated": "2025-01-15T10:30:00Z",
    "templates": [
      {
        "template_id": "ucr-salon-complete-v1",
        "industry": "salon",
        "name": "Salon Complete Business Rules",
        "description": "Comprehensive rule set for salon operations",
        "rule_families": ["BOOKING", "PRICING", "NOTIFICATION", "WORKFLOW", "VALIDATION"],
        "smart_code": "HERA.UCR.TEMPLATE.SALON.COMPLETE.v1",
        "version": "1.0.0",
        "status": "active"
      },
      {
        "template_id": "ucr-salon-booking-v1",
        "industry": "salon",
        "name": "Salon Booking Management",
        "description": "Advanced booking rules with double-booking prevention",
        "rule_families": ["BOOKING", "VALIDATION"],
        "smart_code": "HERA.UCR.TEMPLATE.SALON.BOOKING.v1",
        "version": "1.0.0",
        "status": "active"
      }
    ]
  },
  "meta": {
    "total_templates": 2,
    "industries": ["salon"],
    "rule_families": ["BOOKING", "PRICING", "NOTIFICATION", "WORKFLOW", "VALIDATION"]
  }
}
```

### 4. Guardrail Auto-Fix Example

**Original Payload (with issues):**
```json
{
  "entity_type": "gl_account",
  "entity_name": "Sales Revenue",
  "entity_code": "4100"
  // Missing: organization_id, smart_code
}
```

**Auto-Fixed Payload:**
```json
{
  "entity_type": "account",  // Normalized from gl_account
  "entity_name": "Sales Revenue",
  "entity_code": "4100",
  "organization_id": "org-123",  // Injected from session
  "smart_code": "HERA.FIN.GL.ACCOUNT.REVENUE.v1",  // Auto-generated
  "created_at": "2025-01-15T10:45:00Z",  // Added timestamp
  "id": "uuid-here",  // Generated UUID
  "metadata": {
    "business_rules": {
      "ledger_type": "GL"  // Injected for GL accounts
    }
  }
}
```

**Guardrail Log Entry:**
```json
{
  "transaction_type": "guardrail_autofix",
  "smart_code": "HERA.GUARDRAIL.AUTOFIX.CORE_ENTITIES.v1",
  "metadata": {
    "table_name": "core_entities",
    "fixes_applied": 5,
    "fix_details": [
      {
        "field": "organization_id",
        "issue": "Missing required organization_id",
        "fix_type": "inject",
        "original_value": null,
        "corrected_value": "org-123",
        "confidence": 0.95
      },
      {
        "field": "entity_type",
        "issue": "Non-standard entity_type for GL account",
        "fix_type": "normalize",
        "original_value": "gl_account",
        "corrected_value": "account",
        "confidence": 0.9
      },
      {
        "field": "smart_code",
        "issue": "Missing smart_code",
        "fix_type": "generate",
        "original_value": null,
        "corrected_value": "HERA.FIN.GL.ACCOUNT.REVENUE.v1",
        "confidence": 0.8
      }
    ],
    "confidence_score": 0.883
  }
}
```

### 5. Fiscal Dashboard Period Closing Example

**Current Period Status:**
```json
{
  "period_code": "2025-01",
  "period_type": "month",
  "status": "current",
  "start_date": "2025-01-01",
  "end_date": "2025-01-31",
  "closing_progress": 62.5,
  "closing_steps_completed": [
    "VERIFY_TRANSACTIONS",
    "RECONCILE_ACCOUNTS",
    "ACCRUE_EXPENSES",
    "DEPRECIATION",
    "INVENTORY_ADJUSTMENT"
  ],
  "organization_id": "org-123"
}
```

**Closing Step Update:**
```bash
POST /api/v1/fiscal/closing-step
{
  "organization_id": "org-123",
  "period_code": "2025-01",
  "step_code": "RUN_REPORTS",
  "status": "completed",
  "completed_by": "user-456",
  "notes": "Trial balance verified, financial statements generated"
}
```

**Result Transaction Log:**
```json
{
  "transaction_type": "GL.CLOSE",
  "smart_code": "HERA.FISCAL.CLOSING.UPDATE.RUN_REPORTS.v1",
  "metadata": {
    "period_code": "2025-01",
    "step_code": "RUN_REPORTS",
    "new_status": "completed",
    "updated_by": "user-456",
    "notes": "Trial balance verified, financial statements generated"
  }
}
```

## Key Implementation Notes

### 1. Smart Code Patterns
- Revenue: Contains `.REVENUE.`, `.SALES.`, or `.SERVICE.INCOME.`
- Expenses: Contains `.EXPENSE.`, `.COST.`, or `.PAYROLL.`
- Assets: Contains `.ASSET.`
- Liabilities: Contains `.LIABILITY.`
- Equity: Contains `.EQUITY.`
- Cash Flow: Contains `.CASHFLOW.` with activity type

### 2. Auto-Fix Priority
1. `organization_id` - Always inject from session if missing
2. Entity type normalization - Convert legacy types to standard
3. Smart code generation - Infer from entity type and metadata
4. Timestamps - Always add if missing
5. IDs - Generate UUIDs for primary keys

### 3. Fiscal Period Management
- Periods auto-create when first accessed
- Standard 8-step closing process
- Progress tracked in real-time
- All changes logged to universal_transactions
- Status transitions: open → current → closed

### 4. Report Generation
- No hardcoded GL accounts
- Everything resolved via smart code patterns
- Supports period comparisons
- Branch consolidation built-in
- Export to multiple formats

## Audit Trail

Every operation creates entries in `universal_transactions`:
- UCR rule executions
- Guardrail auto-fixes
- Report generations
- Period closing steps
- Configuration changes

This ensures complete traceability and compliance with accounting standards.