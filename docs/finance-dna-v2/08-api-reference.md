# Finance DNA v2 - API Reference

**Smart Code**: `HERA.ACCOUNTING.API.REFERENCE.DOCUMENTATION.v2`

**Auto-Generated**: ✅  
**Last Updated**: 2025-01-10  
**Source**: Live API endpoint analysis

## 🌐 API Overview

Finance DNA v2 provides a comprehensive REST API built on HERA's Universal API v2 architecture. All endpoints enforce organization-level security, support complete audit trails, and maintain Sacred Six compliance.

### **Base URL**
```
Production: https://api.heraerp.com/v2
Development: http://localhost:3000/api/v2
```

### **Authentication**
All API requests require JWT authentication with organization context:

```bash
# Required Headers
Authorization: Bearer <jwt_token>
x-hera-api-version: v2
Content-Type: application/json

# Required Body Field (for POST/PUT requests)
{
  "apiVersion": "v2",
  "organizationId": "uuid",
  // ... other parameters
}
```

## 🏛️ Core Entity Management

### **Financial Entities**

#### **Create Financial Entity**
```http
POST /api/v2/entities
```

**Request Body:**
```json
{
  "apiVersion": "v2",
  "organizationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "entityType": "gl_account",
  "entityName": "Cash - Primary Operating Account",
  "entityCode": "1100",
  "smartCode": "HERA.ACCOUNTING.GL.ACC.ENTITY.v2",
  "metadata": {
    "account_type": "ASSET",
    "account_category": "CURRENT_ASSETS",
    "normal_balance": "DEBIT",
    "ifrs_classification": "Financial Assets"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "organizationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "entityType": "gl_account",
    "entityName": "Cash - Primary Operating Account",
    "entityCode": "1100",
    "smartCode": "HERA.ACCOUNTING.GL.ACC.ENTITY.v2",
    "metadata": {
      "account_type": "ASSET",
      "account_category": "CURRENT_ASSETS",
      "normal_balance": "DEBIT"
    },
    "createdAt": "2025-01-10T10:30:00Z",
    "updatedAt": "2025-01-10T10:30:00Z"
  },
  "auditTrail": {
    "transactionId": "audit-transaction-uuid",
    "smartCode": "HERA.ACCOUNTING.AUDIT.ENTITY.CREATE.v2"
  }
}
```

#### **List Financial Entities**
```http
GET /api/v2/entities?entityType=gl_account&organizationId=uuid
```

**Query Parameters:**
- `entityType` (required): Type of entity to retrieve
- `organizationId` (required): Organization UUID
- `limit` (optional): Number of records to return (default: 100)
- `offset` (optional): Number of records to skip (default: 0)
- `search` (optional): Search term for entity names
- `sortBy` (optional): Field to sort by (default: entityName)
- `sortOrder` (optional): Sort order - asc/desc (default: asc)

**Response:**
```json
{
  "success": true,
  "data": {
    "entities": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "entityType": "gl_account",
        "entityName": "Cash - Primary Operating Account",
        "entityCode": "1100",
        "smartCode": "HERA.ACCOUNTING.GL.ACC.ENTITY.v2",
        "metadata": {
          "account_type": "ASSET"
        }
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 100,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

## 📊 Financial Transactions

### **Journal Entry Creation**

#### **Create Journal Entry**
```http
POST /api/v2/transactions
```

**Request Body:**
```json
{
  "apiVersion": "v2",
  "organizationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "transactionType": "JOURNAL_ENTRY",
  "transactionCode": "JE-2025-001",
  "transactionDate": "2025-01-10",
  "smartCode": "HERA.ACCOUNTING.GL.TXN.JOURNAL.v2",
  "totalAmount": 1000.00,
  "currencyCode": "USD",
  "description": "Monthly rent expense",
  "lineItems": [
    {
      "lineNumber": 1,
      "lineEntityId": "expense-account-uuid",
      "lineType": "DEBIT",
      "debitAmount": 1000.00,
      "creditAmount": 0.00,
      "smartCode": "HERA.ACCOUNTING.GL.LINE.DEBIT.v2",
      "description": "Office rent expense"
    },
    {
      "lineNumber": 2,
      "lineEntityId": "cash-account-uuid",
      "lineType": "CREDIT",
      "debitAmount": 0.00,
      "creditAmount": 1000.00,
      "smartCode": "HERA.ACCOUNTING.GL.LINE.CREDIT.v2",
      "description": "Cash payment"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "789e4567-e89b-12d3-a456-426614174123",
    "transactionCode": "JE-2025-001",
    "totalAmount": 1000.00,
    "lineItems": [
      {
        "id": "line-1-uuid",
        "lineNumber": 1,
        "debitAmount": 1000.00,
        "creditAmount": 0.00
      },
      {
        "id": "line-2-uuid", 
        "lineNumber": 2,
        "debitAmount": 0.00,
        "creditAmount": 1000.00
      }
    ],
    "glBalanceValidation": {
      "totalDebits": 1000.00,
      "totalCredits": 1000.00,
      "balanced": true
    }
  },
  "auditTrail": {
    "transactionId": "audit-transaction-uuid",
    "smartCode": "HERA.ACCOUNTING.AUDIT.TRANSACTION.CREATE.v2"
  }
}
```

#### **Retrieve Transaction**
```http
GET /api/v2/transactions/{transactionId}?organizationId=uuid
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "789e4567-e89b-12d3-a456-426614174123",
    "organizationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "transactionType": "JOURNAL_ENTRY",
    "transactionCode": "JE-2025-001",
    "transactionDate": "2025-01-10",
    "totalAmount": 1000.00,
    "smartCode": "HERA.ACCOUNTING.GL.TXN.JOURNAL.v2",
    "lineItems": [
      {
        "lineNumber": 1,
        "lineEntityId": "expense-account-uuid",
        "debitAmount": 1000.00,
        "creditAmount": 0.00,
        "accountCode": "6100",
        "accountName": "Office Rent Expense"
      },
      {
        "lineNumber": 2,
        "lineEntityId": "cash-account-uuid", 
        "debitAmount": 0.00,
        "creditAmount": 1000.00,
        "accountCode": "1100",
        "accountName": "Cash - Operating"
      }
    ]
  }
}
```

## 🏦 Financial Reporting

### **Trial Balance Report**

#### **Generate Trial Balance**
```http
POST /api/v2/reports/trial-balance
```

**Request Body:**
```json
{
  "apiVersion": "v2",
  "organizationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "asOfDate": "2025-01-10",
  "includeSubAccounts": true,
  "currencyCode": "USD",
  "includeZeroBalances": false,
  "accountTypeFilter": ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"],
  "useMaterializedView": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reportMetadata": {
      "reportType": "TRIAL_BALANCE",
      "asOfDate": "2025-01-10",
      "currencyCode": "USD",
      "generatedAt": "2025-01-10T10:30:00Z",
      "generationTimeMs": 2847,
      "smartCode": "HERA.ACCOUNTING.REPORT.TRIAL.BALANCE.v2"
    },
    "accounts": [
      {
        "accountId": "account-uuid-1",
        "accountCode": "1100",
        "accountName": "Cash - Operating",
        "accountType": "ASSET",
        "parentAccountId": null,
        "accountLevel": 1,
        "openingBalance": 5000.00,
        "periodDebits": 15000.00,
        "periodCredits": 8000.00,
        "endingBalance": 12000.00,
        "balanceType": "DEBIT",
        "lastTransactionDate": "2025-01-09",
        "transactionCount": 25
      },
      {
        "accountId": "account-uuid-2",
        "accountCode": "2100",
        "accountName": "Accounts Payable",
        "accountType": "LIABILITY",
        "parentAccountId": null,
        "accountLevel": 1,
        "openingBalance": 2000.00,
        "periodDebits": 1000.00,
        "periodCredits": 3000.00,
        "endingBalance": 4000.00,
        "balanceType": "CREDIT",
        "lastTransactionDate": "2025-01-08",
        "transactionCount": 12
      }
    ],
    "summary": {
      "totalDebits": 25000.00,
      "totalCredits": 25000.00,
      "balanced": true,
      "accountCount": 45,
      "currencyCode": "USD"
    }
  }
}
```

### **Profit & Loss Statement**

#### **Generate P&L Report**
```http
POST /api/v2/reports/profit-loss
```

**Request Body:**
```json
{
  "apiVersion": "v2",
  "organizationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "reportPeriod": "MONTHLY",
  "includeComparativePeriod": true,
  "currencyCode": "USD",
  "consolidateSubAccounts": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reportMetadata": {
      "reportType": "PROFIT_LOSS",
      "startDate": "2025-01-01",
      "endDate": "2025-01-31",
      "reportPeriod": "MONTHLY",
      "currencyCode": "USD",
      "generatedAt": "2025-01-10T10:30:00Z",
      "smartCode": "HERA.ACCOUNTING.REPORT.PROFIT.LOSS.v2"
    },
    "revenue": {
      "categoryName": "REVENUE",
      "totalAmount": 50000.00,
      "accounts": [
        {
          "accountCode": "4100",
          "accountName": "Sales Revenue",
          "currentPeriod": 50000.00,
          "previousPeriod": 45000.00,
          "variance": 5000.00,
          "variancePercent": 11.11
        }
      ]
    },
    "expenses": {
      "categoryName": "EXPENSES",
      "totalAmount": 35000.00,
      "accounts": [
        {
          "accountCode": "6100",
          "accountName": "Rent Expense",
          "currentPeriod": 12000.00,
          "previousPeriod": 12000.00,
          "variance": 0.00,
          "variancePercent": 0.00
        },
        {
          "accountCode": "6200",
          "accountName": "Salary Expense",
          "currentPeriod": 23000.00,
          "previousPeriod": 20000.00,
          "variance": 3000.00,
          "variancePercent": 15.00
        }
      ]
    },
    "netIncome": {
      "currentPeriod": 15000.00,
      "previousPeriod": 13000.00,
      "variance": 2000.00,
      "variancePercent": 15.38,
      "netMarginPercent": 30.0
    }
  }
}
```

### **Balance Sheet Report**

#### **Generate Balance Sheet**
```http
POST /api/v2/reports/balance-sheet
```

**Request Body:**
```json
{
  "apiVersion": "v2",
  "organizationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "asOfDate": "2025-01-31",
  "includeComparativeDate": true,
  "comparativeDate": "2024-12-31",
  "currencyCode": "USD",
  "consolidateSubAccounts": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reportMetadata": {
      "reportType": "BALANCE_SHEET",
      "asOfDate": "2025-01-31",
      "comparativeDate": "2024-12-31",
      "currencyCode": "USD",
      "generatedAt": "2025-01-10T10:30:00Z",
      "smartCode": "HERA.ACCOUNTING.REPORT.BALANCE.SHEET.v2"
    },
    "assets": {
      "currentAssets": {
        "categoryTotal": 45000.00,
        "accounts": [
          {
            "accountCode": "1100",
            "accountName": "Cash",
            "currentBalance": 25000.00,
            "previousBalance": 20000.00,
            "variance": 5000.00
          },
          {
            "accountCode": "1200",
            "accountName": "Accounts Receivable",
            "currentBalance": 20000.00,
            "previousBalance": 18000.00,
            "variance": 2000.00
          }
        ]
      },
      "fixedAssets": {
        "categoryTotal": 100000.00,
        "accounts": [
          {
            "accountCode": "1500",
            "accountName": "Equipment",
            "currentBalance": 100000.00,
            "previousBalance": 100000.00,
            "variance": 0.00
          }
        ]
      },
      "totalAssets": 145000.00
    },
    "liabilities": {
      "currentLiabilities": {
        "categoryTotal": 15000.00,
        "accounts": [
          {
            "accountCode": "2100",
            "accountName": "Accounts Payable",
            "currentBalance": 15000.00,
            "previousBalance": 12000.00,
            "variance": 3000.00
          }
        ]
      },
      "totalLiabilities": 15000.00
    },
    "equity": {
      "categoryTotal": 130000.00,
      "accounts": [
        {
          "accountCode": "3100",
          "accountName": "Owner's Equity",
          "currentBalance": 115000.00,
          "previousBalance": 115000.00,
          "variance": 0.00
        },
        {
          "accountCode": "3200",
          "accountName": "Retained Earnings",
          "currentBalance": 15000.00,
          "previousBalance": 3000.00,
          "variance": 12000.00
        }
      ],
      "totalEquity": 130000.00
    },
    "balanceValidation": {
      "totalLiabilitiesAndEquity": 145000.00,
      "balanced": true
    }
  }
}
```

## 🔧 Policy Management

### **Financial Policies**

#### **Create Financial Policy**
```http
POST /api/v2/policies
```

**Request Body:**
```json
{
  "apiVersion": "v2",
  "organizationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "policyName": "Automatic Sales Posting Policy",
  "policyType": "posting_automation",
  "priority": 1,
  "policyConfig": {
    "trigger_conditions": {
      "smart_code_pattern": "HERA.SALES.TXN.ORDER.v2",
      "minimum_amount": 0.01,
      "maximum_amount": 999999.99
    },
    "posting_rules": [
      {
        "sequence": 1,
        "account_mapping": {
          "account_type": "ASSET",
          "account_code": "1100",
          "posting_side": "DEBIT"
        },
        "amount_calculation": {
          "source": "transaction.total_amount"
        }
      },
      {
        "sequence": 2,
        "account_mapping": {
          "account_type": "REVENUE",
          "account_code": "4100",
          "posting_side": "CREDIT"
        },
        "amount_calculation": {
          "source": "transaction.subtotal_amount"
        }
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "policyId": "policy-uuid-123",
    "policyName": "Automatic Sales Posting Policy",
    "policyType": "posting_automation",
    "status": "active",
    "createdAt": "2025-01-10T10:30:00Z"
  },
  "auditTrail": {
    "transactionId": "audit-transaction-uuid",
    "smartCode": "HERA.ACCOUNTING.AUDIT.POLICY.CREATE.v2"
  }
}
```

#### **Test Policy Application**
```http
POST /api/v2/policies/{policyId}/test
```

**Request Body:**
```json
{
  "apiVersion": "v2",
  "organizationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "testTransactionData": {
    "smart_code": "HERA.SALES.TXN.ORDER.v2",
    "total_amount": 1500.00,
    "subtotal_amount": 1350.00,
    "tax_amount": 150.00,
    "transaction_type": "sale"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "testPassed": true,
    "policyTriggered": true,
    "conditionsMatched": [
      "smart_code_pattern_match",
      "amount_within_threshold"
    ],
    "projectedGLPostings": [
      {
        "sequence": 1,
        "accountCode": "1100",
        "accountName": "Cash",
        "debitAmount": 1500.00,
        "creditAmount": 0.00
      },
      {
        "sequence": 2,
        "accountCode": "4100",
        "accountName": "Sales Revenue",
        "debitAmount": 0.00,
        "creditAmount": 1350.00
      }
    ]
  }
}
```

## 🔍 System Administration

### **Migration Operations**

#### **Assess Migration Readiness**
```http
POST /api/v2/migration/assessment
```

**Request Body:**
```json
{
  "apiVersion": "v2",
  "organizationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "readinessStatus": "READY",
    "assessmentResults": [
      {
        "category": "GL_ACCOUNTS",
        "entityCount": 85,
        "estimatedMigrationTime": "170 seconds",
        "complexityScore": 5,
        "readinessStatus": "READY"
      },
      {
        "category": "TRANSACTIONS",
        "transactionCount": 2500,
        "estimatedMigrationTime": "250 seconds",
        "complexityScore": 7,
        "readinessStatus": "REVIEW_REQUIRED"
      }
    ],
    "totalEstimatedTime": "420 seconds",
    "recommendedBatchSize": 100
  }
}
```

#### **Start Migration Batch**
```http
POST /api/v2/migration/start
```

**Request Body:**
```json
{
  "apiVersion": "v2",
  "organizationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "migrationBatchId": "MIGRATION_2025_01_10_001",
  "batchSize": 100
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "migrationBatchId": "MIGRATION_2025_01_10_001",
    "status": "STARTED",
    "phases": [
      {
        "phaseNumber": 1,
        "phaseName": "BACKUP_PREPARATION",
        "status": "IN_PROGRESS"
      },
      {
        "phaseNumber": 2,
        "phaseName": "SMART_CODE_MAPPING",
        "status": "PENDING"
      }
    ],
    "estimatedCompletionTime": "2025-01-10T11:00:00Z"
  }
}
```

### **Security Operations**

#### **Security Dashboard**
```http
GET /api/v2/security/dashboard?organizationId=uuid
```

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "metricCategory": "SESSION_MANAGEMENT",
        "metricName": "Active Sessions",
        "metricValue": 12,
        "metricStatus": "INFO",
        "lastUpdated": "2025-01-10T10:30:00Z"
      },
      {
        "metricCategory": "ACCESS_CONTROL",
        "metricName": "Permission Denials (24h)",
        "metricValue": 3,
        "metricStatus": "NORMAL",
        "lastUpdated": "2025-01-10T10:30:00Z"
      }
    ],
    "anomalies": [
      {
        "anomalyType": "UNUSUAL_ACCESS_PATTERN",
        "severityLevel": "MEDIUM",
        "eventCount": 5,
        "affectedUsers": ["user-uuid-1"],
        "details": {
          "access_pattern": "outside_normal_hours"
        }
      }
    ]
  }
}
```

## 📋 Dynamic Data Management

### **Set Dynamic Field**
```http
POST /api/v2/entities/{entityId}/dynamic-data
```

**Request Body:**
```json
{
  "apiVersion": "v2",
  "organizationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "fieldName": "credit_limit",
  "fieldType": "number",
  "fieldValueNumber": 50000.00,
  "smartCode": "HERA.ACCOUNTING.GL.ACC.CREDIT.LIMIT.v2"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fieldId": "field-uuid-123",
    "fieldName": "credit_limit",
    "fieldType": "number",
    "fieldValueNumber": 50000.00,
    "smartCode": "HERA.ACCOUNTING.GL.ACC.CREDIT.LIMIT.v2",
    "createdAt": "2025-01-10T10:30:00Z"
  }
}
```

### **Get Dynamic Fields**
```http
GET /api/v2/entities/{entityId}/dynamic-data?organizationId=uuid
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fields": [
      {
        "fieldId": "field-uuid-123",
        "fieldName": "credit_limit",
        "fieldType": "number",
        "fieldValueNumber": 50000.00,
        "smartCode": "HERA.ACCOUNTING.GL.ACC.CREDIT.LIMIT.v2"
      },
      {
        "fieldId": "field-uuid-456",
        "fieldName": "bank_routing_number",
        "fieldType": "text",
        "fieldValueText": "123456789",
        "smartCode": "HERA.ACCOUNTING.GL.ACC.BANK.ROUTING.v2"
      }
    ]
  }
}
```

## 🔧 Error Handling

### **Standard Error Response Format**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "GL transaction not balanced: Debits=1000.00 Credits=900.00",
    "details": {
      "field": "lineItems",
      "validation": "gl_balance_check",
      "totalDebits": 1000.00,
      "totalCredits": 900.00,
      "balanceDifference": 100.00
    },
    "smartCode": "HERA.ACCOUNTING.ERROR.GL.BALANCE.VALIDATION.v2",
    "timestamp": "2025-01-10T10:30:00Z",
    "requestId": "req-uuid-123"
  }
}
```

### **Common Error Codes**
- `VALIDATION_ERROR`: Input validation failure
- `PERMISSION_DENIED`: Insufficient permissions for operation
- `ORGANIZATION_ACCESS_DENIED`: User cannot access organization
- `GL_BALANCE_ERROR`: Journal entry debits/credits don't balance
- `FISCAL_PERIOD_CLOSED`: Cannot post to closed fiscal period
- `ENTITY_NOT_FOUND`: Requested entity does not exist
- `SMART_CODE_INVALID`: Smart code format validation failure
- `POLICY_VIOLATION`: Business rule policy violation

### **Rate Limiting**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Limit: 100 requests per minute",
    "details": {
      "limit": 100,
      "windowMinutes": 1,
      "retryAfterSeconds": 45
    },
    "smartCode": "HERA.ACCOUNTING.ERROR.RATE.LIMIT.v2"
  }
}
```

---

## 🎯 API Usage Examples

### **Complete Financial Transaction Flow**

```bash
# 1. Create GL Accounts
curl -X POST https://api.heraerp.com/v2/entities \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "x-hera-api-version: v2" \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "v2",
    "organizationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "entityType": "gl_account",
    "entityName": "Cash",
    "entityCode": "1100",
    "smartCode": "HERA.ACCOUNTING.GL.ACC.ENTITY.v2"
  }'

# 2. Create Journal Entry
curl -X POST https://api.heraerp.com/v2/transactions \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "x-hera-api-version: v2" \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "v2",
    "organizationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "transactionType": "JOURNAL_ENTRY",
    "smartCode": "HERA.ACCOUNTING.GL.TXN.JOURNAL.v2",
    "totalAmount": 1000.00,
    "lineItems": [
      {
        "lineNumber": 1,
        "lineEntityId": "cash-account-uuid",
        "debitAmount": 1000.00,
        "creditAmount": 0.00,
        "smartCode": "HERA.ACCOUNTING.GL.LINE.DEBIT.v2"
      },
      {
        "lineNumber": 2,
        "lineEntityId": "revenue-account-uuid",
        "debitAmount": 0.00,
        "creditAmount": 1000.00,
        "smartCode": "HERA.ACCOUNTING.GL.LINE.CREDIT.v2"
      }
    ]
  }'

# 3. Generate Trial Balance
curl -X POST https://api.heraerp.com/v2/reports/trial-balance \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "x-hera-api-version: v2" \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "v2",
    "organizationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "asOfDate": "2025-01-10",
    "includeSubAccounts": true
  }'
```

**Finance DNA v2 API provides comprehensive financial operations with complete audit trails, perfect organization isolation, and Sacred Six compliance.**