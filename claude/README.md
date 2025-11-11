# HERA Claude CLI Playbook

**🎯 Mission**: Enable Claude CLI to generate production-ready frontends that auto-wire to HERA API v2 backend every single time, with zero stubs or mocks.

## 🚀 Quick Start

```bash
# Generate a customer management page for salon industry
node claude/generate-hera-frontend.js master-data CUSTOMER --industry SALON --module CUSTOMERS

# Generate a sales transaction page for restaurant
node claude/generate-hera-frontend.js transaction SALE --industry RESTAURANT --module ORDERS

# Preview a finance dashboard without writing files
node claude/generate-hera-frontend.js dashboard FINANCE --industry RETAIL --preview
```

## 📁 Playbook Structure

```
claude/
├── README.md                           # This playbook guide
├── generate-hera-frontend.js           # One-click frontend generator
├── system/
│   └── hera-always.md                  # Always-on system prompt for Claude
└── tasks/
    ├── master-data-generator.md        # Master data page template
    ├── transaction-generator.md        # Transaction page template
    └── dashboard-generator.md          # Dashboard page template (future)
```

## 🎯 Core Philosophy

**NEVER STUB OR MOCK** - Every generated frontend connects to real HERA API v2 backend immediately:

- ✅ **Real Authentication**: Uses `useHERAAuth()` three-layer validation
- ✅ **Real Data**: Uses `useEntities()`, `useTransactions()` hooks
- ✅ **Real Mutations**: Uses `useUpsertEntity()`, `usePostTransaction()` 
- ✅ **Real Validation**: Uses `useGLBalance()` for transaction validation
- ✅ **Real Performance**: Lazy loading, memoization, Suspense boundaries

## 🛡️ System Prompt Integration

Claude CLI automatically uses the `hera-always.md` system prompt that ensures:

1. **Mandatory Imports**: Always uses HERA SDK and React hooks
2. **Authentication Patterns**: Three-layer auth validation
3. **Data Fetching**: HERA hooks only, never fetch() directly  
4. **Mobile-First**: 44px touch targets, responsive design
5. **Smart Codes**: HERA DNA pattern compliance
6. **Performance**: Loading states, error handling, optimization

## 🎨 Available Generators

### 1. Master Data Generator
**Purpose**: Entity management pages with full CRUD operations

**Command**: `master-data ENTITY_TYPE`

**Features**:
- Complete CRUD operations (Create, Read, Update, Delete)
- Search and filtering with real-time backend queries
- Mobile-first responsive cards + desktop tables
- Form validation and error handling
- Loading states and empty states
- Batch operations and export functionality

**Examples**:
```bash
node claude/generate-hera-frontend.js master-data CUSTOMER --industry SALON
node claude/generate-hera-frontend.js master-data PRODUCT --industry RETAIL  
node claude/generate-hera-frontend.js master-data CONTACT --industry CRM
```

### 2. Transaction Generator
**Purpose**: Financial transaction pages with GL validation

**Command**: `transaction TRANSACTION_TYPE`

**Features**:
- Header/Lines transaction structure
- Real-time GL balance validation (DR = CR)
- Dynamic line item management
- Idempotent transaction posting
- Currency support and multi-line entries
- Account code selection and validation

**Examples**:
```bash
node claude/generate-hera-frontend.js transaction SALE --industry SALON
node claude/generate-hera-frontend.js transaction PURCHASE --industry RESTAURANT
node claude/generate-hera-frontend.js transaction JOURNAL --industry FINANCE
```

### 3. Dashboard Generator (Future)
**Purpose**: KPI dashboards with real-time metrics

**Command**: `dashboard DASHBOARD_TYPE`

**Features**: (Planned)
- Real-time KPI widgets
- Chart.js integration
- Filtering and date ranges
- Export functionality
- Mobile-responsive layouts

## 🏭 Industry Support

### Salon & Beauty
- **Modules**: BOOKING, CUSTOMERS, SERVICES, INVENTORY, STAFF, FINANCE
- **Entities**: CUSTOMER, SERVICE, APPOINTMENT, STAFF, PRODUCT, PACKAGE
- **Transactions**: BOOKING, SALE, PAYMENT, COMMISSION, EXPENSE

### Restaurant
- **Modules**: MENU, ORDERS, CUSTOMERS, INVENTORY, STAFF, FINANCE  
- **Entities**: CUSTOMER, MENU_ITEM, ORDER, TABLE, STAFF, INGREDIENT
- **Transactions**: ORDER, PAYMENT, PURCHASE, EXPENSE, WASTE

### Retail
- **Modules**: CATALOG, SALES, CUSTOMERS, INVENTORY, STAFF, FINANCE
- **Entities**: CUSTOMER, PRODUCT, CATEGORY, SUPPLIER, STAFF, STORE
- **Transactions**: SALE, PURCHASE, RETURN, ADJUSTMENT, TRANSFER

### CRM
- **Modules**: LEADS, ACCOUNTS, CONTACTS, OPPORTUNITIES, ACTIVITIES, CAMPAIGNS
- **Entities**: LEAD, ACCOUNT, CONTACT, OPPORTUNITY, ACTIVITY, CAMPAIGN
- **Transactions**: LEAD_CONVERSION, OPPORTUNITY_UPDATE, ACTIVITY_LOG

### Finance
- **Modules**: GL, AP, AR, BUDGETING, REPORTING, RECONCILIATION
- **Entities**: GL_ACCOUNT, VENDOR, CUSTOMER, BUDGET, COST_CENTER
- **Transactions**: JOURNAL, INVOICE, PAYMENT, RECEIPT, ADJUSTMENT

## 🔧 Technical Foundation

### HERA Frontend SDK (`/src/lib/hera-frontend-sdk.ts`)
Complete TypeScript SDK that handles:
- Environment-aware API v2 endpoint routing
- Authentication headers and organization context
- Retry logic and error handling
- Request/response type safety
- Idempotency key management

### HERA React Provider (`/src/lib/hera-react-provider.tsx`)
TanStack Query integration providing:
- `useEntities()` - List and search entities
- `useEntity()` - Get single entity details
- `useUpsertEntity()` - Create/update mutations  
- `useDeleteEntity()` - Delete mutations
- `useTransactions()` - List transactions
- `usePostTransaction()` - Post transaction mutations
- `useGLBalance()` - Real-time GL validation

### HERA Environment Config (`/src/lib/hera-env.ts`)
Environment detection and validation:
- `VITE_HERA_BASE_URL` validation
- Development vs production detection
- Supabase configuration management
- Debug mode and feature flags

## 📱 Mobile-First Requirements

Every generated component MUST include:

1. **Touch Targets**: Minimum 44px (iOS standard)
2. **Responsive Grids**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
3. **Progressive Typography**: `text-xl md:text-3xl`
4. **Active States**: `active:scale-95 transition-transform`
5. **Safe Areas**: Mobile status bar spacing
6. **Performance**: Lazy loading and Suspense boundaries

## 🎯 Quality Gates

Generated components are validated against:

### Functional Requirements
- ✅ Connects to real HERA API v2 backend
- ✅ Handles authentication and organization context
- ✅ Implements proper CRUD operations
- ✅ Shows real data from Sacred Six tables
- ✅ Never stubs or mocks any functionality

### Performance Requirements  
- ✅ Initial load time < 1.5 seconds
- ✅ Time to Interactive < 2.5 seconds
- ✅ Lighthouse mobile score > 90
- ✅ Proper lazy loading implementation
- ✅ Optimistic updates and caching

### Security Requirements
- ✅ Organization boundary enforcement
- ✅ Actor-based operations with audit trail
- ✅ Smart Code compliance (HERA DNA patterns)
- ✅ Input validation and sanitization
- ✅ Proper error handling and user feedback

### Accessibility Requirements
- ✅ WCAG 2.1 AA compliance
- ✅ Semantic HTML structure
- ✅ Proper ARIA labels
- ✅ Keyboard navigation support
- ✅ Screen reader compatibility

## 🧪 Testing Generated Code

```bash
# Quality pipeline
npm run ci:quality

# Individual checks
npm run test:unit              # Unit tests
npm run test:e2e              # E2E tests  
npm run lint                  # ESLint
npm run typecheck             # TypeScript
npm run test:a11y             # Accessibility

# Performance testing
npm run lighthouse            # Lighthouse audit
npm run bundle:analyze        # Bundle analysis
```

## 🚀 Development Workflow

1. **Generate Frontend**:
   ```bash
   node claude/generate-hera-frontend.js master-data CUSTOMER --industry SALON
   ```

2. **Review Generated Code**:
   - Verify HERA SDK imports
   - Check authentication patterns
   - Validate responsive design
   - Confirm Smart Code compliance

3. **Customize for Business**:
   - Add entity-specific fields
   - Configure industry workflows
   - Customize validation rules
   - Add business logic

4. **Test with Real Backend**:
   ```bash
   npm run dev                 # Start development server
   npm run test:enterprise     # Enterprise test suite
   ```

5. **Deploy to Production**:
   ```bash
   npm run predeploy          # Pre-deployment checks
   npm run build              # Production build
   npm run deploy             # Deploy to staging/production
   ```

## 🎯 Success Metrics

A generated frontend is successful when:

- **Zero Configuration**: Works immediately with existing HERA backend
- **Real Data Flow**: Shows actual data from Sacred Six tables
- **Performance**: Meets sub-1.5s load time requirements  
- **Mobile Experience**: Native app feel on mobile devices
- **Production Ready**: Passes all quality gates and security checks
- **Business Logic**: Handles industry-specific workflows correctly

## 🔗 Integration Points

### HERA API v2 Gateway
- **Endpoint**: `/functions/v1/api-v2/*`
- **Security**: JWT + Organization context validation
- **Performance**: Edge function with 100ms response times
- **Reliability**: Built-in retry logic and error handling

### Sacred Six Database
- **Tables**: `core_entities`, `core_dynamic_data`, `core_relationships`
- **Transactions**: `universal_transactions`, `universal_transaction_lines`
- **Organizations**: `core_organizations` with multi-tenant isolation
- **Audit**: Complete actor and timestamp tracking

### Branding Engine
- **Dynamic Theming**: Real-time CSS variable injection
- **White-label**: Unlimited branded experiences
- **Performance**: Sub-100ms theme switching
- **Industry Themes**: Professional presets for each vertical

## 📖 Advanced Usage

### Custom Entity Fields
```typescript
// In generated component, add custom fields:
const [formData, setFormData] = useState({
  entity_name: '',
  // Add custom fields here based on industry
  salon_specialty: '',
  treatment_duration: 0,
  price_range: ''
})
```

### Industry-Specific Validation
```typescript
// Add business rules in form submission:
const validateSalonService = (data) => {
  if (data.treatment_duration < 15) {
    throw new Error('Treatment duration must be at least 15 minutes')
  }
  // Add more industry rules
}
```

### Custom Smart Codes
```typescript
// Generate industry-specific Smart Codes:
const smartCode = generateSmartCode({
  industry: 'SALON',
  module: 'SERVICES',
  type: 'TREATMENT',
  subtype: 'FACIAL'
})
// Result: 'HERA.SALON.SERVICES.TREATMENT.FACIAL.v1'
```

## 🎯 Mission Accomplished

**HERA Claude CLI Playbook delivers on the promise: Generate production-ready frontends that auto-wire to HERA API v2 backend every single time, with zero stubs or mocks.**

🚀 **One Command** → **Production Frontend** → **Real Backend** → **Live Business Operations**