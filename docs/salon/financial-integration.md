# Financial Integration Guide

> **Enterprise-Grade Financial Management with Auto-Journal DNA**

## 💰 Overview

The HERA Salon Financial Integration provides seamless accounting automation with real-time GL posting, multi-branch consolidation, and comprehensive financial reporting. Built on the Auto-Journal DNA component, it eliminates manual bookkeeping while maintaining audit-grade accuracy.

```mermaid
graph TB
    subgraph "Financial Ecosystem"
        T[Transactions] --> AJ[Auto-Journal Engine]
        AJ --> GL[General Ledger]
        GL --> FS[Financial Statements]
        
        T --> CM[Commission Tracking]
        T --> TX[Tax Calculation]
        T --> INV[Inventory Costing]
        
        GL --> TB[Trial Balance]
        GL --> BS[Balance Sheet]
        GL --> PL[Profit & Loss]
        GL --> CF[Cash Flow]
        
        FS --> RE[Reports]
        FS --> AN[Analytics]
        FS --> AU[Audit Trail]
    end
    
    style AJ fill:#D4AF37,stroke:#B8860B,stroke-width:3px,color:#000
    style GL fill:#FFD700,stroke:#FFA500,stroke-width:2px,color:#000
```

## 📊 Chart of Accounts Structure

### Salon-Specific COA

```mermaid
graph TD
    subgraph "Assets (1000-1999)"
        A1[1000 - Cash Accounts]
        A2[1200 - Accounts Receivable]
        A3[1300 - Inventory]
        A4[1500 - Fixed Assets]
        A5[1600 - Salon Equipment]
    end
    
    subgraph "Liabilities (2000-2999)"
        L1[2000 - Accounts Payable]
        L2[2100 - Gift Card Liability]
        L3[2200 - Package Liability]
        L4[2300 - Accrued Commissions]
        L5[2400 - Tax Payable]
    end
    
    subgraph "Revenue (4000-4999)"
        R1[4000 - Service Revenue]
        R2[4100 - Hair Services]
        R3[4200 - Nail Services]
        R4[4300 - Spa Services]
        R5[4400 - Product Sales]
    end
    
    subgraph "Expenses (5000-5999)"
        E1[5000 - Cost of Sales]
        E2[5100 - Staff Costs]
        E3[5200 - Commission Expense]
        E4[5300 - Rent & Utilities]
        E5[5400 - Marketing]
    end
    
    style R1 fill:#32CD32,stroke:#228B22,stroke-width:2px,color:#000
    style E1 fill:#FF6347,stroke:#DC143C,stroke-width:2px,color:#000
```

## 🔄 Auto-Journal Processing

### Transaction Flow to GL

```mermaid
sequenceDiagram
    participant POS
    participant API
    participant AutoJournal
    participant GL
    participant Reports
    
    POS->>API: Complete Sale
    API->>AutoJournal: Process Transaction
    
    AutoJournal->>AutoJournal: Identify Accounts
    AutoJournal->>AutoJournal: Calculate Amounts
    AutoJournal->>AutoJournal: Apply Tax Rules
    
    AutoJournal->>GL: Create Journal Entry
    Note over GL: Debit: Cash 1050.00<br/>Credit: Service Revenue 1000.00<br/>Credit: Tax Payable 50.00
    
    GL->>Reports: Update Financials
    Reports-->>POS: Confirmation
```

### Smart Code Mapping

```typescript
// Auto-Journal Configuration for Salon
const salonJournalRules = {
  // Service Sale
  'HERA.SALON.POS.TXN.SALE.V1': {
    debitAccounts: ['1000'], // Cash
    creditAccounts: ['4100', '2400'], // Service Revenue, Tax
    splitRules: {
      tax: { account: '2400', rate: 0.05 },
      commission: { account: '2300', rate: 0.40 }
    }
  },
  
  // Product Sale
  'HERA.SALON.POS.LINE.PRODUCT.V1': {
    debitAccounts: ['1000'], // Cash
    creditAccounts: ['4400', '2400'], // Product Sales, Tax
    costOfSale: {
      debitAccount: '5000', // COGS
      creditAccount: '1300' // Inventory
    }
  },
  
  // Gift Card Sale
  'HERA.SALON.GC.TXN.SALE.V1': {
    debitAccounts: ['1000'], // Cash
    creditAccounts: ['2100'] // Gift Card Liability
  },
  
  // Commission Payment
  'HERA.SALON.HR.TXN.COMMISSION.V1': {
    debitAccounts: ['2300'], // Accrued Commission
    creditAccounts: ['1000'] // Cash
  }
}
```

## 💹 Financial Reporting

### Real-Time Dashboards

```mermaid
graph TB
    subgraph "Executive Dashboard"
        D[Dashboard] --> R[Revenue Metrics]
        D --> E[Expense Analysis]
        D --> P[Profitability]
        D --> C[Cash Position]
        
        R --> R1[Daily Revenue]
        R --> R2[Service vs Product Mix]
        R --> R3[Branch Performance]
        
        E --> E1[Staff Costs]
        E --> E2[Product COGS]
        E --> E3[Operating Expenses]
        
        P --> P1[Gross Margin]
        P --> P2[Net Profit]
        P --> P3[EBITDA]
        
        C --> C1[Cash on Hand]
        C --> C2[Receivables]
        C --> C3[Payables]
    end
    
    style D fill:#4169E1,stroke:#000080,stroke-width:2px,color:#fff
```

### Profit & Loss Statement

```mermaid
graph TD
    subgraph "P&L Structure"
        REV[Revenue] --> SR[Service Revenue]
        REV --> PR[Product Revenue]
        REV --> OR[Other Revenue]
        
        SR --> HSR[Hair Services: $45,000]
        SR --> NSR[Nail Services: $15,000]
        SR --> SSR[Spa Services: $20,000]
        
        PR --> RPS[Retail Sales: $12,000]
        PR --> PPS[Professional Sales: $3,000]
        
        COGS[Cost of Goods Sold] --> PC[Product Cost: $6,000]
        
        GM[Gross Margin: $89,000]
        
        EXP[Operating Expenses] --> SC[Staff Costs: $32,000]
        EXP --> COM[Commissions: $24,000]
        EXP --> RNT[Rent: $8,000]
        EXP --> UTL[Utilities: $2,000]
        EXP --> MKT[Marketing: $3,000]
        
        NP[Net Profit: $20,000]
    end
    
    style REV fill:#32CD32,stroke:#228B22,stroke-width:2px,color:#000
    style NP fill:#FFD700,stroke:#FFA500,stroke-width:2px,color:#000
```

## 📈 Commission Management

### Commission Calculation Engine

```mermaid
graph LR
    subgraph "Commission Flow"
        S[Service Completed] --> C[Calculate Commission]
        C --> T{Commission Type}
        
        T -->|Fixed Rate| FR[40% of Service]
        T -->|Tiered| TR[Tier Calculation]
        T -->|Performance| PR[Bonus Addition]
        
        FR --> A[Accrue Commission]
        TR --> A
        PR --> A
        
        A --> P[Period End]
        P --> PAY[Process Payment]
        PAY --> GL[Post to GL]
    end
    
    style C fill:#32CD32,stroke:#228B22,stroke-width:2px,color:#000
```

### Commission Tracking

```typescript
// Commission calculation and tracking
const trackCommission = async (transaction: Transaction) => {
  for (const line of transaction.lines) {
    if (line.staff_id && line.commissionable) {
      const commission = {
        staff_id: line.staff_id,
        transaction_id: transaction.id,
        line_id: line.id,
        amount: line.amount * 0.40, // 40% commission
        status: 'accrued',
        pay_period: getCurrentPayPeriod(),
        smart_code: 'HERA.SALON.HR.COMMISSION.ACCRUED.V1'
      }
      
      // Create commission record
      await apiV2.post('entities', {
        entity_type: 'COMMISSION',
        ...commission
      })
      
      // Update GL
      await apiV2.post('auto-journal/process', {
        smart_code: 'HERA.SALON.HR.COMMISSION.ACCRUAL.V1',
        amount: commission.amount,
        metadata: commission
      })
    }
  }
}
```

## 🏦 Cash Management

### Daily Cash Flow

```mermaid
graph TB
    subgraph "Cash Flow Management"
        CI[Cash In] --> S[Service Payments]
        CI --> P[Product Sales]
        CI --> G[Gift Card Sales]
        CI --> D[Deposits]
        
        CO[Cash Out] --> SC[Staff Payments]
        CO --> SP[Supplier Payments]
        CO --> R[Rent/Utilities]
        CO --> C[Commissions]
        
        S --> CB[Cash Balance]
        P --> CB
        G --> CB
        D --> CB
        SC --> CB
        SP --> CB
        R --> CB
        C --> CB
        
        CB --> BR[Bank Reconciliation]
    end
    
    style CI fill:#32CD32,stroke:#228B22,stroke-width:2px,color:#fff
    style CO fill:#FF6347,stroke:#DC143C,stroke-width:2px,color:#fff
```

### Cash Reconciliation

```typescript
// Daily cash reconciliation
const reconcileCash = async (date: Date, branchId: string) => {
  // Get all cash transactions
  const cashTxns = await apiV2.get('transactions', {
    filters: {
      payment_method: 'cash',
      transaction_date: date,
      branch_id: branchId
    }
  })
  
  // Calculate totals
  const summary = {
    opening_balance: await getOpeningBalance(date, branchId),
    cash_sales: cashTxns.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0),
    cash_refunds: cashTxns.filter(t => t.type === 'refund').reduce((sum, t) => sum + t.amount, 0),
    cash_expenses: cashTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    expected_closing: 0,
    actual_closing: 0,
    variance: 0
  }
  
  summary.expected_closing = summary.opening_balance + summary.cash_sales - summary.cash_refunds - summary.cash_expenses
  
  return summary
}
```

## 📊 Tax Compliance

### VAT/Sales Tax Handling

```mermaid
graph TD
    subgraph "Tax Calculation"
        T[Transaction] --> C{Tax Config}
        C -->|Inclusive| I[Extract Tax]
        C -->|Exclusive| E[Add Tax]
        
        I --> TX[Tax Amount]
        E --> TX
        
        TX --> GL[GL Posting]
        TX --> TR[Tax Report]
        
        GL --> TP[Tax Payable Account]
        TR --> TF[Tax Filing]
    end
    
    style TX fill:#FFD700,stroke:#FFA500,stroke-width:2px,color:#000
```

### Tax Reporting

```typescript
// Generate tax report
const generateTaxReport = async (period: Period) => {
  const taxTransactions = await apiV2.get('transactions', {
    filters: {
      date_range: period,
      has_tax: true
    }
  })
  
  const report = {
    period,
    total_sales: 0,
    taxable_sales: 0,
    exempt_sales: 0,
    tax_collected: 0,
    tax_payable: 0,
    details: []
  }
  
  for (const txn of taxTransactions) {
    report.total_sales += txn.amount
    if (txn.tax_amount > 0) {
      report.taxable_sales += txn.amount - txn.tax_amount
      report.tax_collected += txn.tax_amount
    } else {
      report.exempt_sales += txn.amount
    }
  }
  
  return report
}
```

## 📈 Inventory Valuation

### Cost Tracking

```mermaid
graph LR
    subgraph "Inventory Costing"
        P[Purchase] --> F{Method}
        F -->|FIFO| FI[First In First Out]
        F -->|LIFO| LI[Last In First Out]
        F -->|Average| AV[Weighted Average]
        
        FI --> C[Cost Calculation]
        LI --> C
        AV --> C
        
        C --> GL[GL Update]
        C --> COGS[Cost of Goods]
    end
    
    style C fill:#4169E1,stroke:#000080,stroke-width:2px,color:#fff
```

## 🎯 Financial Controls

### Approval Workflows

```mermaid
graph TD
    subgraph "Expense Approval"
        E[Expense Request] --> A{Amount}
        A -->|< $100| AA[Auto Approve]
        A -->|$100-500| MA[Manager Approval]
        A -->|> $500| DA[Director Approval]
        
        AA --> P[Process Payment]
        MA --> P
        DA --> P
        
        P --> GL[GL Posting]
    end
    
    style A fill:#FFD700,stroke:#FFA500,stroke-width:2px,color:#000
```

### Audit Trail

```typescript
// Complete audit trail
interface AuditEntry {
  transaction_id: string
  timestamp: Date
  user_id: string
  action: string
  old_values: any
  new_values: any
  ip_address: string
  smart_code: string
}

// Every financial transaction tracked
const auditLog = async (entry: AuditEntry) => {
  await apiV2.post('audit-log', {
    ...entry,
    smart_code: 'HERA.SALON.FIN.AUDIT.ENTRY.V1'
  })
}
```

## 📊 Multi-Branch Consolidation

### Branch P&L Consolidation

```mermaid
graph TB
    subgraph "Consolidation Process"
        B1[Branch 1 P&L] --> E[Eliminate Interco]
        B2[Branch 2 P&L] --> E
        B3[Branch 3 P&L] --> E
        B4[Branch 4 P&L] --> E
        
        E --> C[Consolidated P&L]
        C --> A[Adjustments]
        A --> F[Final P&L]
        
        F --> R[Group Reports]
        F --> T[Tax Filing]
    end
    
    style C fill:#228B22,stroke:#006400,stroke-width:2px,color:#fff
```

## 🚀 Best Practices

### 1. **Daily Operations**
- Morning cash count
- Transaction monitoring
- Exception handling
- End-of-day close

### 2. **Month-End Process**
- Commission calculation
- Inventory count
- Accrual entries
- Financial close

### 3. **Compliance**
- Tax filing schedules
- Audit preparation
- Document retention
- Internal controls

### 4. **Reporting**
- Daily flash reports
- Weekly summaries
- Monthly financials
- Quarterly analysis

---

<div align="center">

**Financial Excellence** | **Automated Accuracy** | **Real-Time Insights**

[← Back to Overview](./README.md) | [Analytics Dashboard →](./analytics.md)

</div>