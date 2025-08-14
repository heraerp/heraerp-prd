# 🔗 HERA Universal ERP System Links & Navigation

## 🏠 Main Application Routes

### Primary Navigation
| Route | Component | Description | Status |
|-------|-----------|-------------|---------|
| `/` | HomePage | HERA ERP Landing Page with full navigation | ✅ LIVE |
| `/coa` | COAManagementPage | Complete Chart of Accounts system | ✅ LIVE |
| `/coa/demo` | COADemo | Interactive 6-step demonstration | ✅ LIVE |
| `/api/version` | API Route | Version and build information | ✅ LIVE |
| `/offline` | OfflinePage | PWA offline fallback page | ✅ LIVE |

## 🎯 COA System Internal Navigation

### Main COA Dashboard (`/coa`)
The COA page contains tabbed navigation between:

#### 📊 Templates Dashboard Tab
- **Universal Base Template** (67 accounts)
- **Country Templates**: India, USA, UK compliance
- **Industry Templates**: Restaurant, Healthcare, Manufacturing, Professional Services
- **Template Actions**: View, Edit, Export, Import
- **Statistics**: 1,847 organizations, 8 active templates

#### 🔢 GL Accounts Tab  
- **Account Management**: Create, Read, Update, Delete
- **Search & Filter**: By name, code, type
- **Account Types**: Assets, Liabilities, Equity, Revenue, Expenses
- **Smart Validation**: Account code ranges, normal balances
- **Bulk Operations**: Export, Import, Refresh

### Interactive Demo (`/coa/demo`)
6-step guided walkthrough:
1. **Welcome** - Introduction to COA system
2. **Templates Dashboard** - Template overview
3. **Template Builder** - 4-step wizard demonstration
4. **COA Structure Viewer** - Hierarchical account display
5. **GL Accounts CRUD** - Account management demo
6. **Completion** - Summary and next steps

## 🌐 External & API Links

### API Endpoints
| Endpoint | Method | Description | Status |
|----------|---------|-------------|---------|
| `/api/version` | GET | Build version and metadata | ✅ LIVE |
| `/api/v1/coa/build` | POST | Build customized COA | 📋 PLANNED |
| `/api/v1/coa/structure/:orgId` | GET | Get COA structure | 📋 PLANNED |
| `/api/v1/accounts` | GET/POST | GL Accounts CRUD | 📋 PLANNED |
| `/api/v1/templates` | GET | Template management | 📋 PLANNED |

### PWA Features
| Feature | Route/File | Description | Status |
|---------|------------|-------------|---------|
| **Manifest** | `/manifest.json` | PWA configuration | ✅ LIVE |
| **Service Worker** | `/sw.js` | Offline caching and version management | ✅ LIVE |
| **Offline Page** | `/offline` | Fallback when offline | ✅ LIVE |
| **Icons** | `/icons/*` | PWA app icons | ✅ LIVE |

## 🧪 Testing Routes & Scenarios

### Playwright Test Coverage
| Test Suite | Route Tested | Scenarios | Status |
|------------|--------------|-----------|---------|
| **COA Management** | `/coa` | 10 tests (9 passing) | ✅ TESTED |
| **Templates Dashboard** | `/coa` (Templates tab) | 11 tests (1 passing) | 🔄 ACTIVE |
| **GL Accounts CRUD** | `/coa` (GL Accounts tab) | 22 tests | 🔄 TESTING |
| **Interactive Demo** | `/coa/demo` | 12 tests | 📋 READY |
| **Full Integration** | `/coa` (all tabs) | 10 tests | 📋 READY |
| **Template Copy** | `/coa` (template workflows) | 10 tests | 📋 READY |

### Test Commands
```bash
# Test specific routes
npm run test:coa                    # Test /coa main functionality
npm run test:coa-copy              # Test template copying workflows
npx playwright test --headed       # Visual debugging mode

# Test individual components
npx playwright test tests/e2e/coa/coa-management-page.spec.ts
npx playwright test tests/e2e/coa/coa-templates-dashboard.spec.ts
npx playwright test tests/e2e/coa/gl-accounts-crud.spec.ts
```

## 🏗️ Component Architecture Links

### React Component Tree
```
HomePage (/)
├── Navigation Cards → Link to /coa
├── Template Overview → Links to /coa tabs
└── Demo Access → Link to /coa/demo

COAManagementPage (/coa)
├── Templates Dashboard Tab
│   ├── COATemplatesDashboard
│   │   ├── Universal Base Template
│   │   ├── Country Templates (India, USA, UK)  
│   │   └── Industry Templates (Restaurant, Healthcare, etc.)
│   └── Template Actions (View, Edit, Export)
└── GL Accounts Tab
    ├── GLAccountsCRUD
    │   ├── Account List Table
    │   ├── Search & Filter Controls
    │   ├── Create Account Dialog
    │   └── Edit Account Dialog
    └── Account Management Actions

COADemo (/coa/demo)
├── Step 1: Welcome Screen
├── Step 2: Templates Dashboard Demo
├── Step 3: Template Builder Demo  
├── Step 4: COA Structure Viewer Demo
├── Step 5: GL Accounts CRUD Demo
└── Step 6: Completion & Next Steps
```

## 🔒 Governance & Security

### Mandatory Routes
All routes implement HERA's governance requirements:
- **Universal COA compliance** on all COA routes
- **Row Level Security** preparation for multi-tenancy
- **Audit trail** tracking for all COA operations
- **Version control** for template updates
- **Zero deviation policy** enforcement

### Security Headers
Configured in `vercel.json` for all routes:
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy

## 📱 Mobile & PWA Navigation

### Progressive Web App Features
- **Installable**: Add to home screen capability
- **Offline Support**: Service worker caches all routes
- **Push Notifications**: Ready for implementation
- **Version Management**: Automatic cache invalidation

### Responsive Navigation
All routes are fully responsive:
- **Mobile-first design** with touch-friendly interfaces
- **Adaptive layouts** for tablet and desktop
- **Keyboard navigation** support for accessibility

## 🚀 Live System Access

### Current URLs (Development)
- **Main App**: http://localhost:3000/
- **COA System**: http://localhost:3000/coa
- **Interactive Demo**: http://localhost:3000/coa/demo
- **API Status**: http://localhost:3000/api/version
- **Offline Page**: http://localhost:3000/offline

### Quick Navigation Commands
```bash
# Start the application
npm run dev

# Access main routes
open http://localhost:3000/          # Homepage
open http://localhost:3000/coa       # COA System  
open http://localhost:3000/coa/demo  # Interactive Demo
```

## 🎯 Next Steps: Route Expansion

### Planned Future Routes
- `/entities` - Core entities management
- `/transactions` - Universal transactions
- `/dashboard` - Analytics and reporting
- `/admin` - System administration
- `/api/docs` - Interactive API documentation

**All routes are interconnected through the comprehensive navigation system, creating a seamless user experience across the entire HERA Universal ERP platform! 🎉**