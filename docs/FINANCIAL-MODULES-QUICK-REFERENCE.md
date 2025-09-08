# 📊 HERA Financial Modules Quick Reference Guide

## 🎯 Quick Module Locator

### Core Financial Modules

| Module | Location | Smart Code | Status |
|--------|----------|------------|---------|
| **GL (General Ledger)** | `/src/lib/dna/modules/financial/gl-module-dna.tsx` | `HERA.FIN.GL.MODULE.v1` | ✅ Production |
| **AP (Accounts Payable)** | `/src/lib/dna/modules/financial/ap-module-dna.tsx` | `HERA.FIN.AP.MODULE.v1` | ✅ Production |
| **AR (Accounts Receivable)** | `/src/lib/dna/modules/financial/ar-module-dna.tsx` | `HERA.FIN.AR.MODULE.v1` | ✅ Production |
| **FA (Fixed Assets)** | `/src/lib/dna/modules/financial/fa-module-dna.tsx` | `HERA.FIN.FA.MODULE.v1` | ✅ Production |

### Financial Components & Systems

| Component | Location | Purpose |
|-----------|----------|---------|
| **FIN Dashboard** | `/src/components/fin/FINDashboard.tsx` | Central financial management hub |
| **Cashflow Dashboard** | `/src/components/cashflow/CashflowDashboard.tsx` | Real-time cashflow analysis |
| **Daily Cash Close** | `/src/components/pos/DailyCashClose.tsx` | POS reconciliation |
| **Year-End Closing** | `/src/components/accounting/YearEndClosingWizard.tsx` | Fiscal year management |
| **Auto-Journal Docs** | `/src/app/docs/features/auto-journal/page.tsx` | 85% automation engine |

### CLI Tools

| Tool | Command | Purpose |
|------|---------|---------|
| **Cashflow CLI** | `node cashflow-dna-cli.js` | Generate cashflow statements |
| **Trial Balance CLI** | `node trial-balance-dna-cli.js` | Professional trial balance |
| **COA Generator** | `node generate-salon-coa.js` | Industry-specific COA |
| **Auto-Journal CLI** | `node auto-journal-dna-cli.js` | Manage journal automation |

## 🚀 Quick Import Examples

### Using the Index System

```typescript
// Import specific module
import { GL_MODULE_DNA } from '@/lib/dna/modules/financial'

// Import all financial modules
import { FINANCIAL_MODULES } from '@/lib/dna/modules/financial'

// Access module registry
import { FINANCIAL_MODULE_REGISTRY } from '@/lib/dna/modules/financial'

// Search for modules
import { getModulesByCategory, searchModules } from '@/lib/dna/modules'
```

### Direct Module Import

```typescript
// Individual module imports
import { GLModule } from '@/lib/dna/modules/financial/gl-module-dna'
import { APModule } from '@/lib/dna/modules/financial/ap-module-dna'
import { ARModule } from '@/lib/dna/modules/financial/ar-module-dna'
import { FAModule } from '@/lib/dna/modules/financial/fa-module-dna'
```

## 📋 Module Feature Matrix

| Feature | GL | AP | AR | FA |
|---------|----|----|----|----|
| Multi-Currency | ✅ | ✅ | ✅ | ❌ |
| Approval Workflow | ✅ | ✅ | ✅ | ❌ |
| Batch Processing | ✅ | ✅ | ✅ | ✅ |
| Industry Adaptations | ✅ | ✅ | ✅ | ✅ |
| Auto-Journal Integration | ✅ | ✅ | ✅ | ✅ |
| Audit Trail | ✅ | ✅ | ✅ | ✅ |
| Reporting | ✅ | ✅ | ✅ | ✅ |

## 🏭 Industry-Specific Features

### Ice Cream Manufacturing
- **GL**: Cold chain accounts, temperature variance journals
- **AP**: Dairy supplier tracking, quality certificates
- **AR**: Freezer deposit tracking, seasonal terms
- **FA**: Freezer fleet management, energy tracking

### Restaurant
- **GL**: Daily closing procedures, recipe costing
- **AP**: Food supplier management, delivery tracking
- **AR**: POS integration, table management
- **FA**: Kitchen equipment tracking

### Healthcare
- **GL**: Department allocation, patient billing
- **AP**: Medical supplier compliance
- **AR**: Insurance claim processing
- **FA**: Medical equipment lifecycle

## 🔧 Common Tasks

### Find a Module
```bash
# Using grep
grep -r "AP_MODULE_DNA" src/

# Using the index
import { getModuleById } from '@/lib/dna/modules'
const apModule = getModuleById('HERA.FIN.AP.MODULE.v1')
```

### Check Module Status
```typescript
import { getProductionModules } from '@/lib/dna/modules'
const prodModules = getProductionModules()
```

### Search Modules
```typescript
import { searchModules } from '@/lib/dna/modules'
const results = searchModules('invoice')
```

## 📊 Module Dependencies

```
GL Module (Base)
├── AP Module
├── AR Module  
├── FA Module
└── Auto-Journal Engine
    ├── Cashflow System
    ├── Trial Balance
    └── Financial Reports
```

## 🚨 Important Notes

1. **All modules use the Universal 6-Table Architecture**
2. **Organization context is always required**
3. **Smart codes enable automatic GL posting**
4. **Industry adaptations are configuration-driven**
5. **No schema changes needed for customization**

## 📞 Support

- **Documentation**: `/docs/features/[module-name]`
- **MCP Tools**: Available in Claude Desktop
- **CLI Help**: `node [tool-name].js --help`