# 🏢 HERA v2 Universal Module Kit

## 🎯 **Quick Start Template**

This is your **copy/paste** template for creating enterprise-grade modules that follow the HERA v2 Module Standard. Every module built with this kit will have consistent UX, API integration, and business logic patterns.

## 📋 **What You Get**

### ✅ **Universal Components Ready to Use**
- **4-Step Master Data Wizard** with progress tracking and AI assistance
- **S/4HANA-inspired Transaction Wizard** with hera_transactions_post_v2 integration  
- **Workflow Engine** with state management and approvals
- **Relationship Manager** with visual graph editor
- **Fiori-style UI components** with glassmorphism design

### ✅ **HERA v2 Standards Built-in**
- **Sacred Six Tables Only**: core_entities, core_dynamic_data, core_relationships, universal_transactions, universal_transaction_lines, core_smart_codes
- **Smart Code DNA**: Auto-generated following HERA pattern `^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$`
- **Actor Everywhere**: All writes include created_by/updated_by with server-resolved p_actor_user_id
- **AuthN/Z Flow**: JWT → resolve user → resolve org → membership check → RPC payload

### ✅ **Enterprise Features**
- **Multi-step Workflows** with approval chains and AI recommendations
- **Bulk Import/Export** with progress tracking and validation
- **Real-time Validation** with business rule checking
- **Audit Trails** with complete actor stamping
- **Mobile-responsive** Fiori-style design

## 🚀 **10-Step Module Creation Process**

### Step 1: **Name Your Module & Allocate Smart Code Namespace**
```bash
# Example: Customer Relationship Management
MODULE_NAME="CRM" 
MODULE_DESCRIPTION="Customer Relationship Management"
SMART_CODE_PREFIX="HERA.CRM"
```

### Step 2: **Copy Template Files**
```bash
cp -r src/templates/universal-module-kit src/app/[your-module-name]
cp -r src/templates/universal-module-kit/components src/components/[your-module-name]
```

### Step 3: **Define Your Entities (Master Data)**
Edit `module-config.ts`:
```typescript
export const MODULE_ENTITIES = [
  {
    entity_type: 'CUSTOMER',
    smart_code_pattern: 'HERA.CRM.CUSTOMER.{CODE}.v1',
    attributes: [
      { name: 'customer_type', type: 'select', required: true, options: ['individual', 'corporate'] },
      { name: 'credit_limit', type: 'number', required: false },
      { name: 'payment_terms', type: 'select', required: true, options: ['net30', 'net60', 'cod'] }
    ],
    relationships: ['BELONGS_TO_ORGANIZATION', 'HAS_CONTACT_PERSON', 'OWNS_ACCOUNTS'],
    workflows: ['CUSTOMER_APPROVAL', 'CREDIT_CHECK']
  }
];
```

### Step 4: **Configure Transactions**
Edit `transaction-config.ts`:
```typescript
export const MODULE_TRANSACTIONS = [
  {
    transaction_type: 'CUSTOMER_INVOICE',
    smart_code: 'HERA.CRM.TXN.INVOICE.v1',
    posting_rules: {
      lines: [
        { account: 'ACCOUNTS_RECEIVABLE', side: 'DR', amount_field: 'total_amount' },
        { account: 'REVENUE', side: 'CR', amount_field: 'total_amount' }
      ]
    },
    workflows: ['INVOICE_APPROVAL', 'CREDIT_CHECK'],
    validation_rules: ['GL_BALANCED', 'CUSTOMER_CREDIT_LIMIT']
  }
];
```

### Step 5: **Customize UI Pages**
The template includes:
- `pages/EntityListPage.tsx` - Master data listing with search/filter
- `pages/EntityCreatePage.tsx` - 4-step creation wizard  
- `pages/TransactionCreatePage.tsx` - Transaction wizard
- `pages/DashboardPage.tsx` - Module overview dashboard

### Step 6: **Setup API Routes**
Template includes HERA v2 compliant API routes:
- `/api/v2/[module]/entities` - Entity CRUD operations
- `/api/v2/[module]/transactions` - Transaction processing
- `/api/v2/[module]/workflows` - Workflow management
- `/api/v2/[module]/relationships` - Relationship management

### Step 7: **Configure Workflows**
Edit `workflow-config.ts`:
```typescript
export const MODULE_WORKFLOWS = [
  {
    workflow_type: 'CUSTOMER_APPROVAL',
    smart_code: 'HERA.CRM.WORKFLOW.CUSTOMER.APPROVAL.v1',
    steps: [
      { name: 'Data Validation', type: 'automated', role: 'system' },
      { name: 'Manager Review', type: 'approval', role: 'manager' },
      { name: 'Final Activation', type: 'automated', role: 'system' }
    ]
  }
];
```

### Step 8: **Setup Authentication & Authorization**
Template includes:
- JWT verification middleware
- Organization context resolution
- Role-based access control
- Actor stamping on all operations

### Step 9: **Configure CI/CD Quality Gates**
Template includes GitHub Actions workflows that validate:
- ✅ Actor coverage non-null on Sacred Six tables
- ✅ Smart Code regex compliance
- ✅ ORG-FILTER-REQUIRED on all payloads
- ✅ GL balance validation for .GL. transactions
- ✅ No business columns on Sacred Six tables

### Step 10: **Deploy & Monitor**
- Observability with OpenTelemetry traces
- Outbox events with actor metadata
- Actor Coverage metrics
- Audit Completeness tracking

## 🛠 **File Structure**

```
src/app/[module]/
├── page.tsx                    # Module dashboard
├── entities/
│   ├── page.tsx               # Entity list page
│   └── create/
│       └── page.tsx           # 4-step entity wizard
├── transactions/
│   ├── page.tsx               # Transaction list
│   └── create/
│       └── page.tsx           # Transaction wizard
├── workflows/
│   └── page.tsx               # Workflow management
├── relationships/
│   └── page.tsx               # Relationship manager
└── config/
    ├── module-config.ts       # Entity definitions
    ├── transaction-config.ts  # Transaction types
    └── workflow-config.ts     # Workflow definitions

src/components/[module]/
├── EntityWizard.tsx           # Customized entity creation wizard
├── TransactionWizard.tsx      # Customized transaction wizard
├── ModuleDashboard.tsx        # Module-specific dashboard
└── ModuleLayout.tsx           # Module layout wrapper

src/app/api/v2/[module]/
├── entities/
│   └── route.ts              # Entity CRUD API
├── transactions/
│   └── route.ts              # Transaction API
├── workflows/
│   └── route.ts              # Workflow API
└── relationships/
    └── route.ts              # Relationship API
```

## 🔧 **Customization Guide**

### **Entity Attributes**
Add business-specific fields to `core_dynamic_data`:
```typescript
// ✅ Do: Store in dynamic data
const customerAttributes = {
  customer_type: 'corporate',
  credit_limit: 50000,
  payment_terms: 'net30',
  industry: 'technology'
};

// ❌ Don't: Add columns to Sacred Six tables
```

### **Custom Workflows**
Extend the workflow engine with industry-specific steps:
```typescript
const customWorkflow = {
  workflow_type: 'CUSTOMER_ONBOARDING',
  steps: [
    { name: 'KYC Verification', type: 'manual', role: 'compliance' },
    { name: 'Credit Assessment', type: 'automated', role: 'system' },
    { name: 'Account Setup', type: 'manual', role: 'admin' }
  ]
};
```

### **Transaction Types**
Define module-specific transaction patterns:
```typescript
const moduleTransactions = {
  'CUSTOMER_PAYMENT': {
    smart_code: 'HERA.CRM.TXN.PAYMENT.v1',
    posting_pattern: 'CASH_RECEIPT'
  }
};
```

## 📊 **Quality Assurance**

### **Built-in Validations**
- ✅ Smart code pattern validation
- ✅ GL balance checking per currency
- ✅ Organization isolation enforcement
- ✅ Actor presence validation
- ✅ Relationship integrity checks

### **CI/CD Checks**
- ✅ TypeScript compilation
- ✅ ESLint code quality
- ✅ HERA Guardrails validation
- ✅ Test coverage requirements
- ✅ Security vulnerability scanning

## 🎨 **Design System**

### **Fiori-Style Components**
- **Object Headers** for entity display
- **Progress Indicators** for multi-step processes  
- **Action Sheets** for bulk operations
- **Status Badges** for workflow states
- **Data Tables** with sorting and filtering

### **Responsive Design**
- **Mobile-first** approach
- **Tablet optimization** for field operations
- **Desktop enhancement** for power users
- **Touch-friendly** interactions

## 🚀 **Getting Started**

1. **Copy the template**: `cp -r src/templates/universal-module-kit src/app/my-module`
2. **Configure entities**: Edit `config/module-config.ts`
3. **Setup transactions**: Edit `config/transaction-config.ts`
4. **Customize workflows**: Edit `config/workflow-config.ts`
5. **Run development**: `npm run dev`
6. **Test thoroughly**: `npm run test`
7. **Deploy to staging**: `npm run deploy:staging`
8. **Go live**: `npm run deploy:production`

## 📞 **Support**

- **Documentation**: See individual component README files
- **Examples**: Check `src/app/crm-example` for complete implementation
- **Issues**: Create tickets in project repository
- **Questions**: Ask in #hera-development Slack channel

---

**🔥 Ready to build enterprise-grade modules in hours, not weeks!**