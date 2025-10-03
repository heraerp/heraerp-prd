# Point of Sale (POS) System Guide

> **Enterprise-Grade POS with Universal Architecture Integration**

## 💳 Overview

The HERA Salon POS system delivers a seamless checkout experience with integrated inventory, commission tracking, and automatic financial posting. Built on the Universal Transaction architecture, it handles complex salon scenarios with elegance.

```mermaid
graph TB
    subgraph "POS Workflow"
        A[Service Selection] --> B[Add Products]
        B --> C[Apply Discounts]
        C --> D[Calculate Total]
        D --> E[Payment Processing]
        E --> F[Receipt Generation]
        F --> G[Auto GL Posting]
        
        subgraph "Side Processes"
            E --> C1[Commission Calc]
            E --> I1[Inventory Update]
            E --> L1[Loyalty Points]
            G --> F1[Financial Reports]
        end
    end
    
    style A fill:#0F6F5C,stroke:#0A4A3F,stroke-width:2px,color:#fff
    style E fill:#D4AF37,stroke:#B8860B,stroke-width:3px,color:#000
    style G fill:#FFD700,stroke:#FFA500,stroke-width:2px,color:#000
```

## 🎯 POS Interface Layout

```mermaid
graph LR
    subgraph "POS Screen Layout"
        subgraph "Left Panel - Catalog"
            C1[Service Categories]
            C2[Product Categories]
            C3[Quick Items]
            C4[Search Bar]
        end
        
        subgraph "Right Panel - Cart"
            T1[Customer Info]
            T2[Line Items]
            T3[Discounts/Tips]
            T4[Total Summary]
            T5[Payment Button]
        end
        
        subgraph "Header"
            H1[Branch Selector]
            H2[Staff Info]
            H3[Quick Actions]
        end
    end
    
    C1 --> T2
    C2 --> T2
    C3 --> T2
    T2 --> T4
    T4 --> T5
```

## 📊 Transaction Data Flow

```mermaid
sequenceDiagram
    participant UI as POS Interface
    participant API as Universal API
    participant DB as Database
    participant INV as Inventory
    participant FIN as Finance
    participant COMM as Commission
    
    UI->>API: Create Transaction
    API->>DB: Insert universal_transaction
    API->>DB: Insert transaction_lines
    
    API->>INV: Update Stock Levels
    INV-->>DB: Update inventory counts
    
    API->>COMM: Calculate Commissions
    COMM-->>DB: Create commission records
    
    API->>FIN: Post to GL
    FIN-->>DB: Create journal entries
    
    API-->>UI: Transaction Complete
    UI->>UI: Print Receipt
```

## 💰 Payment Processing

### Supported Payment Methods

```mermaid
graph TD
    subgraph "Payment Options"
        P[Payment Methods] --> C[Cash]
        P --> CC[Credit Card]
        P --> DC[Debit Card]
        P --> GC[Gift Card]
        P --> LP[Loyalty Points]
        P --> SP[Split Payment]
        
        CC --> V[Visa]
        CC --> M[Mastercard]
        CC --> A[Amex]
        
        SP --> SPM[Multiple Methods]
        SP --> SPC[Multiple Cards]
        SP --> SPT[Tips Separate]
    end
    
    style P fill:#4169E1,stroke:#000080,stroke-width:2px,color:#fff
```

### Payment Flow Implementation

```typescript
// Process Payment
const processPayment = async (paymentData: PaymentData) => {
  // Create transaction
  const transaction = await apiV2.post('transactions', {
    transaction_type: 'SALE',
    transaction_code: generateTransactionCode(),
    organization_id: orgId,
    branch_id: selectedBranchId,
    total_amount: cartTotal,
    smart_code: 'HERA.SALON.POS.TXN.SALE.V1',
    metadata: {
      customer_id: customerId,
      payment_method: paymentData.method,
      staff_id: currentStaffId
    }
  })
  
  // Add line items
  for (const item of cartItems) {
    await apiV2.post('transaction-lines', {
      transaction_id: transaction.id,
      line_entity_id: item.entity_id,
      quantity: item.quantity,
      unit_price: item.price,
      line_amount: item.total,
      smart_code: item.type === 'service' 
        ? 'HERA.SALON.POS.LINE.SERVICE.V1'
        : 'HERA.SALON.POS.LINE.PRODUCT.V1'
    })
  }
  
  // Process payment gateway
  if (paymentData.method === 'card') {
    await processCardPayment(paymentData.cardDetails)
  }
  
  // Auto-post to GL
  await apiV2.post('auto-journal/process', {
    transaction_id: transaction.id
  })
  
  return transaction
}
```

## 🧮 Commission Calculation

### Commission Structure

```mermaid
graph TB
    subgraph "Commission Types"
        C[Commission] --> S[Service Commission]
        C --> P[Product Commission]
        C --> T[Tips]
        
        S --> SF[Fixed Rate]
        S --> SP[Percentage]
        S --> ST[Tiered]
        
        P --> PF[Fixed Amount]
        P --> PP[Percentage]
        
        T --> T100[100% to Staff]
        T --> TS[Split Tips]
    end
    
    subgraph "Calculation Rules"
        R1[Base on Service Price]
        R2[Deduct Product Cost]
        R3[Include/Exclude Tax]
        R4[Performance Bonuses]
    end
    
    style C fill:#32CD32,stroke:#228B22,stroke-width:2px,color:#000
```

### Commission Tracking

```typescript
// Commission calculation example
const calculateCommission = (lineItem: TransactionLine): Commission => {
  const staff = getStaff(lineItem.staff_id)
  const commissionRate = staff.commission_rate || 0.40 // 40% default
  
  let commissionAmount = 0
  
  if (lineItem.type === 'service') {
    commissionAmount = lineItem.amount * commissionRate
  } else if (lineItem.type === 'product') {
    const productCommissionRate = 0.10 // 10% on products
    commissionAmount = lineItem.amount * productCommissionRate
  } else if (lineItem.type === 'tip') {
    commissionAmount = lineItem.amount // 100% of tips
  }
  
  return {
    staff_id: staff.id,
    transaction_line_id: lineItem.id,
    commission_amount: commissionAmount,
    commission_rate: commissionRate,
    smart_code: 'HERA.SALON.HR.COMMISSION.EARNED.V1'
  }
}
```

## 📱 POS Features

### 1. **Quick Sale Mode**

```mermaid
graph LR
    subgraph "Quick Sale Flow"
        Q[Quick Sale] --> S[Select Service]
        S --> W[Walk-in Client]
        W --> P[Process Payment]
        P --> R[Receipt]
    end
    
    style Q fill:#FFD700,stroke:#FFA500,stroke-width:2px,color:#000
```

### 2. **Appointment Integration**

```mermaid
graph TD
    subgraph "Appointment Checkout"
        A[Load Appointment] --> S[Scheduled Services]
        S --> AS[Add Services]
        S --> AP[Add Products]
        AS --> C[Calculate Total]
        AP --> C
        C --> D[Apply Membership]
        D --> P[Process Payment]
    end
    
    style A fill:#4169E1,stroke:#000080,stroke-width:2px,color:#fff
```

### 3. **Product Bundles**

```mermaid
graph TB
    subgraph "Bundle Management"
        B[Service Bundle] --> I1[Hair Cut]
        B --> I2[Hair Color]
        B --> I3[Blow Dry]
        B --> D[10% Discount]
        
        P[Product Bundle] --> P1[Shampoo]
        P --> P2[Conditioner]
        P --> P3[Hair Mask]
        P --> PD[15% Discount]
    end
```

## 💳 Gift Cards & Packages

### Gift Card Processing

```mermaid
graph LR
    subgraph "Gift Card Flow"
        GC[Gift Card Sale] --> C[Create Card Entity]
        C --> L[Load Value]
        L --> A[Activate Card]
        
        subgraph "Redemption"
            R[Scan Card] --> V[Check Balance]
            V --> D[Deduct Amount]
            D --> U[Update Balance]
        end
    end
    
    style GC fill:#E6E6FA,stroke:#9370DB,stroke-width:2px,color:#000
```

### Package Management

```typescript
// Package sale example
const sellPackage = async (packageData: Package) => {
  // Create package entity
  const package = await apiV2.post('entities', {
    entity_type: 'PACKAGE',
    entity_name: packageData.name,
    organization_id: orgId,
    smart_code: 'HERA.SALON.PKG.ENTITY.V1'
  })
  
  // Set package details
  await apiV2.post('entities/dynamic-data', [
    {
      entity_id: package.id,
      field_name: 'services_included',
      field_value: JSON.stringify(packageData.services),
      smart_code: 'HERA.SALON.PKG.DYN.SERVICES.V1'
    },
    {
      entity_id: package.id,
      field_name: 'expiry_date',
      field_value: packageData.expiryDate,
      smart_code: 'HERA.SALON.PKG.DYN.EXPIRY.V1'
    }
  ])
  
  return package
}
```

## 📊 Sales Reports

### Daily Cash Reconciliation

```mermaid
graph TD
    subgraph "End of Day Process"
        S[Start EOD] --> C[Count Cash]
        C --> CC[Count Cards]
        CC --> O[Other Payments]
        O --> T[Calculate Total]
        T --> V[Verify vs System]
        V --> D[Deposit Preparation]
        D --> R[Generate Report]
    end
    
    subgraph "Reconciliation"
        V --> M{Match?}
        M -->|Yes| A[Approve]
        M -->|No| I[Investigate]
        I --> F[Fix Discrepancy]
        F --> A
    end
    
    style S fill:#0F6F5C,stroke:#0A4A3F,stroke-width:2px,color:#fff
    style A fill:#32CD32,stroke:#228B22,stroke-width:2px,color:#000
```

### Sales Analytics

```mermaid
pie title Daily Sales Breakdown
    "Hair Services" : 45
    "Nail Services" : 20
    "Products" : 15
    "Treatments" : 12
    "Gift Cards" : 8
```

## 🔧 POS Configuration

### Setup Requirements

```mermaid
graph TB
    subgraph "POS Setup"
        H[Hardware] --> T[Touch Terminal]
        H --> R[Receipt Printer]
        H --> S[Card Reader]
        H --> B[Barcode Scanner]
        
        SW[Software] --> C[Configure Payment]
        SW --> TX[Tax Settings]
        SW --> RC[Receipt Template]
        SW --> P[Permissions]
        
        I[Integration] --> PM[Payment Gateway]
        I --> AC[Accounting System]
        I --> IN[Inventory Sync]
    end
    
    style H fill:#FF6347,stroke:#DC143C,stroke-width:2px,color:#fff
    style SW fill:#4169E1,stroke:#000080,stroke-width:2px,color:#fff
```

### Tax Configuration

```typescript
// Tax setup example
const configureTax = async (branchId: string) => {
  await apiV2.post('entities/dynamic-data', {
    entity_id: branchId,
    field_name: 'tax_config',
    field_value: JSON.stringify({
      sales_tax_rate: 0.05,  // 5% VAT
      tax_included_in_price: false,
      tax_account_code: '2250000',
      tax_exemption_types: ['medical_treatment']
    }),
    smart_code: 'HERA.SALON.BRANCH.DYN.TAX.V1'
  })
}
```

## 🚨 Error Handling

### Payment Failures

```mermaid
graph TD
    subgraph "Payment Error Flow"
        E[Payment Error] --> T{Error Type}
        T -->|Card Declined| D[Try Another Card]
        T -->|Network Error| R[Retry Payment]
        T -->|Insufficient Funds| I[Partial Payment]
        T -->|System Error| S[Save & Resume]
        
        D --> N[New Payment]
        R --> RP[Retry Process]
        I --> SP[Split Payment]
        S --> Q[Queue Transaction]
    end
    
    style E fill:#FF4500,stroke:#DC143C,stroke-width:2px,color:#fff
```

### Recovery Procedures

1. **Saved Transactions**: Auto-save cart state every 30 seconds
2. **Offline Mode**: Queue transactions for later processing
3. **Duplicate Prevention**: Idempotency keys on all payments
4. **Audit Trail**: Complete log of all attempts

## 📈 Performance Optimization

### Speed Metrics

```mermaid
graph LR
    subgraph "Performance Targets"
        L[Load Time] --> L1[< 1 second]
        S[Search] --> S1[< 100ms]
        P[Payment] --> P1[< 3 seconds]
        R[Receipt] --> R1[< 2 seconds]
    end
    
    style L fill:#32CD32,stroke:#228B22,stroke-width:2px,color:#000
    style S fill:#32CD32,stroke:#228B22,stroke-width:2px,color:#000
```

### Optimization Strategies

- **Catalog Caching**: Preload frequently used items
- **Lazy Loading**: Load categories on demand
- **Debounced Search**: Prevent excessive queries
- **Optimistic Updates**: Immediate UI feedback
- **Background Sync**: Non-blocking operations

## 🔒 Security Features

### PCI Compliance

```mermaid
graph TB
    subgraph "Security Layers"
        P[PCI DSS Compliance] --> E[End-to-End Encryption]
        E --> T[Tokenization]
        T --> S[Secure Storage]
        S --> A[Audit Logging]
        
        E --> E1[Card Data Encrypted]
        T --> T1[No Raw Card Storage]
        S --> S1[Encrypted Database]
        A --> A1[All Transactions Logged]
    end
    
    style P fill:#FFD700,stroke:#FFA500,stroke-width:3px,color:#000
```

### Access Controls

- **Role-Based**: Cashier vs Manager permissions
- **Time-Based**: Shift-specific access
- **Amount Limits**: Authorization thresholds
- **Audit Trail**: Who did what when

## 🎯 Best Practices

### 1. **Daily Operations**
- Start with cash count
- Regular sync checks
- Hourly reports review
- End-of-day reconciliation

### 2. **Customer Experience**
- Quick checkout process
- Multiple payment options
- Clear receipt format
- Email receipt option

### 3. **Staff Training**
- Common operations guide
- Error handling procedures
- Security protocols
- Customer service standards

### 4. **System Maintenance**
- Daily backups
- Regular updates
- Performance monitoring
- Security audits

---

<div align="center">

**Enterprise POS** | **Lightning Fast** | **Rock Solid**

[← Back to Overview](./README.md) | [Financial Integration →](./financial-integration.md)

</div>