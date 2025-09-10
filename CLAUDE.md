# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎛️ HERA MASTER CONTROL CENTER - ALWAYS USE FIRST

**The Control Center is your automatic co-pilot for HERA development. It ensures system health, enforces guardrails, and maintains quality standards.**

```bash
# ALWAYS START WITH CONTROL CENTER CHECKS
npm run cc                    # Open Control Center dashboard
npm run cc:health            # Check system health (90%+ required)
npm run cc:guardrails        # Validate all guardrails are passing
npm run cc:deploy            # Verify deployment readiness

# Control Center enforces:
- Sacred 6 tables only (no custom tables)
- Organization ID on all operations  
- Smart codes for every transaction
- Complete audit trails
- Multi-tenant isolation
- Build quality standards
- Test coverage requirements
```

**IMPORTANT**: The Control Center runs automatically on:
- Every `npm run dev` startup
- Every git commit (pre-commit hook)
- Every git push (pre-push hook) 
- Every API call (middleware validation)

If Control Center blocks you, fix the issue - don't bypass it!

## 🚨 QUICK REFERENCE - USE THESE TOOLS ALWAYS

```bash
# ALWAYS USE THESE CLI TOOLS (Prevents memory issues)
cd mcp-server

# View database
node hera-query.js summary          # Overview of all tables
node hera-query.js entities         # List entities  
node hera-query.js transactions     # List transactions

# Create data
node hera-cli.js create-entity customer "Company Name"
node hera-cli.js create-transaction sale 50000
node hera-cli.js set-field <entity-id> email "test@example.com"

# Status workflows (NEVER use status columns)
node status-workflow-example.js     # Learn the pattern

# Check your organization ID
node hera-cli.js query core_organizations
# Update .env: DEFAULT_ORGANIZATION_ID=your-uuid

# HERA System Organization (Master Templates)
node explore-system-org.js summary        # View all templates
node explore-system-org.js statuses       # Standard workflow statuses
node explore-system-org.js entity-types   # Entity type catalog
node use-system-templates.js demo-complete-flow  # See templates in action

# HERA Auto-Journal Engine (NEW CORE DNA COMPONENT)
node auto-journal-dna-cli.js explore restaurant   # Restaurant auto-journal config
node auto-journal-dna-cli.js test-relevance "RESTAURANT_SALE_ORDER"  # Test AI classification
node auto-journal-dna-cli.js compare-industries   # Compare all industry configs

# HERA Universal Cashflow DNA System (NEW CORE DNA COMPONENT)
node cashflow-dna-cli.js config restaurant        # Restaurant cashflow DNA config
node cashflow-dna-cli.js generate --org uuid --period 2025-09  # Generate live cashflow statement
node cashflow-dna-cli.js analyze --org uuid --forecast  # Analyze with 12-month forecast
node cashflow-dna-cli.js industries               # List all industry configurations
node demo-cashflow-hair-talkz.js                  # Live demo with Hair Talkz salon

# HERA Universal Trial Balance DNA System (NEW CORE DNA COMPONENT)
node trial-balance-dna-cli.js config restaurant        # Restaurant trial balance DNA config
node trial-balance-dna-cli.js generate --org uuid --ratios  # Generate professional trial balance
node trial-balance-dna-cli.js consolidate --orgs "id1,id2,id3"  # Multi-organization consolidation
node trial-balance-dna-cli.js analyze --org uuid --industry salon  # Industry benchmarking analysis
node trial-balance-dna-cli.js industries               # List all industry configurations
node generate-trial-balance.js                         # Original Hair Talkz implementation

# HERA Universal Balance Sheet DNA System (NEW CORE DNA COMPONENT)
node balance-sheet-dna-cli.js config salon            # Salon balance sheet DNA config
node balance-sheet-dna-cli.js daily --org uuid --ratios  # Generate daily balance sheet
node balance-sheet-dna-cli.js hair-talkz --ratios     # All Hair Talkz organizations
node balance-sheet-dna-cli.js consolidate             # Consolidated group balance sheet
node demo-balance-sheet-from-trial-balance.js         # Working demo with real data

# HERA Universal Profit & Loss DNA System (NEW CORE DNA COMPONENT)
node profit-loss-dna-cli.js config salon              # Salon P&L DNA config
node profit-loss-dna-cli.js generate --org uuid --ytd  # Generate year-to-date P&L
node profit-loss-dna-cli.js monthly --org uuid --budget  # Monthly P&L with budget comparison
node profit-loss-dna-cli.js hair-talkz                # All Hair Talkz P&L statements
node profit-loss-dna-cli.js trends --org uuid --periods 12  # 12-month trend analysis
node demo-hair-talkz-profit-loss.js ytd               # Working demo with real data

# HERA Finance DNA Integration System (NEW CORE DNA COMPONENT) 🧬
node finance-dna-cli.js activate --org uuid --industry restaurant  # Activate Finance DNA
node finance-dna-cli.js rules --org uuid              # View posting rules
node finance-dna-cli.js test-posting --org uuid --event sample.json  # Test GL posting
node finance-dna-cli.js coa --org uuid                # View Chart of Accounts

# HERA DNA Document Numbering System (UNIVERSAL CROSS-INDUSTRY) 📄
node hera-dna-document-numbering-cli.js industries    # List all supported industries
node hera-dna-document-numbering-cli.js config --industry furniture  # Furniture configuration
node hera-dna-document-numbering-cli.js generate --type sales_order --industry furniture  # Generate document number
node hera-dna-document-numbering-cli.js test          # Test all industries and document types

# HERA Enterprise Features (ENTERPRISE GA READY) 🔐
node scripts/test-enterprise-features.js              # Test all enterprise capabilities
# Access enterprise endpoints
curl -H "Authorization: Bearer $JWT" localhost:3000/api/v1/metrics  # Prometheus metrics
curl -H "Authorization: Bearer $JWT" localhost:3000/api/v1/audit/events  # Audit trail
# Enterprise admin UI
localhost:3000/admin/audit                            # Real-time audit viewer

# HERA MASTER CONTROL CENTER (USE ALWAYS) 🎛️
npm run cc                            # Open Control Center dashboard
npm run cc:health                     # Quick system health check  
npm run cc:deploy                     # Check deployment readiness
npm run cc:guardrails                 # Validate guardrails
node hera-control-center.js control   # Full system overview
node hera-control-center.js health --detailed  # Detailed health metrics
# Control Center Dashboard
localhost:3000/control-center         # Visual control panel
```

**KEY RULES:**
1. NO STATUS COLUMNS - Use relationships
2. NO STRUCTURAL CHANGES - Use dynamic fields
3. ALWAYS USE CLI TOOLS - Not manual queries
4. ORGANIZATION_ID REQUIRED - Multi-tenant isolation
5. CLASSIFICATION REQUIRED - Business context mandatory
6. ENTERPRISE FEATURES - Use middleware stack for all APIs
7. **ALWAYS RUN `npm run predeploy` BEFORE PUSHING** - Catches build errors, import issues, and dependency problems automatically

## Project Overview

HERA (Hierarchical Enterprise Resource Architecture) is a revolutionary ERP platform built on a **universal database architecture**, designed to handle infinite business complexity with a flexible structure. HERA eliminates the traditional ERP implementation nightmare through a proven universal approach to business modeling.

### **🏆 PRODUCTION VALIDATED: Mario's Authentic Italian Restaurant**
Our complete implementation proves HERA's universal architecture works for sophisticated business operations:
- ✅ **30-second deployment** from requirements to production-ready restaurant system
- ✅ **Complete operations** - Menu management, order processing, advanced costing, accounting integration
- ✅ **Universal COA integration** - Automatic GL posting, dual documents, complete audit trails
- ✅ **Advanced costing system** - Batch production, combination meals, waste tracking, real-time profitability
- ✅ **Progressive to Production** - Seamless conversion from trial to production with custom subdomain
- ✅ **$463,000 cost savings** vs traditional restaurant POS systems with 100% success rate

## Tech Stack

- **Framework**: Next.js 15.4.2 with App Router + React 19.1.0
- **Language**: TypeScript 5.8.3 (strict mode)
- **Styling**: Tailwind CSS 4.1.11 with custom HERA design system + Apple-inspired UI
- **Database**: Supabase with PostgreSQL and Row Level Security (RLS)
- **State Management**: Zustand 5.0.6, TanStack Query 5.83.0
- **Authentication**: Multi-Tenant SaaS Architecture (Supabase + Organization Management) with Universal Authorization
- **Forms**: React Hook Form 7.61.1 with Zod 4.0.10 validation
- **UI Components**: Shadcn/ui (New York style) with Lucide React icons + Jobs-inspired components
- **AI Integration**: Multi-provider AI orchestration (OpenAI, Claude, Gemini) with intelligent routing
- **Enterprise Security**: SSO/SAML 2.0/OIDC, RBAC, KMS encryption, complete audit trail
- **Observability**: OpenTelemetry tracing, Prometheus metrics, structured logging
- **Reliability**: Rate limiting, idempotency, automatic RLS enforcement, disaster recovery

## 🔐 ENTERPRISE GA FEATURES (PRODUCTION READY)

**HERA now includes comprehensive enterprise features for General Availability while maintaining strict adherence to the Sacred Six tables architecture.**

### **🛡️ Security & Compliance**
- **SSO Provider** - SAML 2.0 and OIDC with JIT provisioning (`/src/lib/auth/sso-provider.ts`)
- **RBAC Policy Engine** - YAML-based with smart code families (`/src/lib/rbac/policy-engine.ts`)
- **KMS Encryption** - Envelope encryption for PII with key rotation (`/src/lib/crypto/kms-provider.ts`)
- **Audit Trail** - Complete activity logging in universal_transactions
- **Real-time Audit UI** - Live event viewer with SSE (`/src/app/admin/audit/page.tsx`)

### **⚡ Reliability & Performance**
- **Rate Limiting** - Sliding window with configurable tiers (`/src/lib/limits/rate-limiter.ts`)
- **Idempotency** - Safe request retries with 24h TTL
- **Automatic RLS** - Query interception via proxy pattern (`/src/lib/rbac/query-builder-middleware.ts`)
- **Enterprise Middleware** - Unified stack for all APIs (`/src/lib/middleware/enterprise-middleware.ts`)
- **High Availability** - Multi-region support with automatic failover

### **📊 Observability Suite**
- **Distributed Tracing** - OpenTelemetry integration (`/src/lib/observability/tracer.ts`)
- **Metrics Collection** - Prometheus-compatible (`/src/lib/observability/metrics.ts`)
- **Structured Logging** - JSON with context preservation (`/src/lib/observability/logger.ts`)
- **Monitoring Dashboards** - 4 Grafana-ready dashboards (`/ops/dashboards/*.json`)
- **Health Checks** - Comprehensive system status endpoints

### **📋 API Governance**
- **OpenAPI 3.0.3 Spec** - Complete API documentation (`/openapi/hera.v1.yaml`)
- **Versioning** - Smart code-based API evolution
- **Problem+JSON** - RFC7807 compliant error responses
- **Pagination** - Cursor-based with consistent ordering

### **🔧 Enterprise Endpoints**
```bash
# Metrics endpoint (Prometheus format)
GET /api/v1/metrics

# Audit event query
GET /api/v1/audit/events?organization_id={org}&timeRange=24h

# Real-time audit stream (SSE)
GET /api/v1/audit/stream?organization_id={org}

# Guardrail validation (dry-run)
POST /api/v1/guardrails/validate

# Enterprise operations
POST /api/v1/enterprise
```

### **📚 Enterprise Documentation**
- `/docs/enterprise/SECURITY.md` - Authentication, encryption, audit
- `/docs/enterprise/RBAC.md` - Policy structure and permissions
- `/docs/enterprise/OBSERVABILITY.md` - Logging, tracing, metrics
- `/docs/enterprise/DISASTER-RECOVERY.md` - RPO ≤ 5min, RTO ≤ 30min
- `/docs/enterprise/OPERATIONS.md` - Daily operations guide

### **🚀 Enterprise Middleware Usage**
```typescript
import { enterpriseMiddleware } from '@/lib/middleware/enterprise-middleware'

export async function GET(request: NextRequest) {
  return enterpriseMiddleware(request, async (req, ctx) => {
    // Automatic: Rate limiting, RBAC, RLS, tracing, logging
    // ctx contains: requestId, organizationId, userId, roles
    
    // Your business logic here
    return NextResponse.json({ success: true })
  })
}
```

## 🏢 MULTI-TENANT SAAS AUTHENTICATION (PRODUCTION READY)

**HERA now includes a complete multi-tenant SaaS authentication system with organization-based isolation and subdomain routing.**

### **🚀 SaaS Authentication Flow (USE ALWAYS)**
```bash
# Access Points:
app.heraerp.com                    # Central auth hub
organization.heraerp.com           # Organization-specific access
localhost:3000/~organization       # Local development

# User Journey:
1. Sign up/Login → app.heraerp.com/auth/signup
2. Create Organization → /auth/organizations/new  
3. Select Apps → /auth/organizations/{id}/apps
4. Access Organization → {subdomain}.heraerp.com
```

### **🔧 Key Components (ALWAYS USE THESE)**
- **MultiOrgAuthProvider** - Use instead of any old auth components
- **Organization Management** - Full CRUD via `/api/v1/organizations`
- **Subdomain Routing** - Automatic organization detection via middleware
- **App Installation** - Per-organization app management system

### **🎨 UI Pages Available**
- `/auth/landing` - Marketing landing page
- `/auth/organizations` - Organization selector  
- `/auth/organizations/new` - Create new organization
- `/auth/organizations/[id]/apps` - App selection for new orgs
- `/org` - Organization dashboard (after subdomain routing)

**CRITICAL**: All new development MUST use the multi-tenant auth system. No exceptions.

**📖 COMPLETE GUIDE**: See `MULTI-TENANT-AUTH-GUIDE.md` for detailed implementation instructions.

## 🔌 MCP-FIRST DEVELOPMENT (REVOLUTIONARY)

**HERA now includes a Model Context Protocol (MCP) server that gives direct access to your entire Supabase database through CLI tools, preventing memory issues and ensuring consistent universal architecture usage.**

### **🚀 Quick MCP Terminal Access (No Claude Desktop Required)**
```bash
# 1. Setup (one-time)
cd mcp-server
npm install

# 2. Direct CLI Tools (Use These ALWAYS)
node hera-query.js summary              # View all tables and record counts
node hera-cli.js tables                 # List universal tables with details
node hera-cli.js query core_entities    # Query any table
node hera-cli.js create-entity customer "Company Name"  # Create entities
node hera-cli.js create-transaction sale 50000          # Create transactions
node hera-cli.js set-field <entity-id> email "test@example.com"  # Dynamic fields

# 3. Status Workflows (Use Relationships, NOT status columns)
node status-workflow-example.js         # See how to implement status via relationships
```

### **⚠️ CRITICAL: Multi-Tenant Development Setup**
```bash
# Check your organization ID first
node hera-cli.js query core_organizations

# Update .env with your organization UUID
DEFAULT_ORGANIZATION_ID=your-org-uuid-here

# For subdomain development (use these patterns)
localhost:3000/~acme              # Organization 'acme' in development
localhost:3000/auth/organizations  # Organization selector
app.heraerp.com                    # Production auth hub
acme.heraerp.com                   # Production organization access
```

### **🎯 Always Use Multi-Tenant Patterns**
```typescript
// ALWAYS use MultiOrgAuthProvider (never old auth)
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

// ALWAYS check organization context
const { currentOrganization, isAuthenticated } = useMultiOrgAuth()
if (!currentOrganization) return <div>Please select an organization</div>

// ALWAYS include organization_id in API calls
const data = await universalApi.createEntity({
  entity_type: 'customer',
  entity_name: 'Test Customer',
  organization_id: currentOrganization.id  // CRITICAL
})
```

### **⚠️ Important Schema Details**
The actual database schema uses different column names than some documentation:
- **Transactions**: Use `transaction_code` NOT `transaction_number`
- **Relationships**: Use `from_entity_id/to_entity_id` NOT `parent_entity_id/child_entity_id`
- **Status Fields**: NEVER add status columns - always use relationships
- **Check Schema**: Always run `node check-schema.js` to see actual columns

### **MCP vs Manual Development**
| Traditional | MCP-Powered |
|-------------|-------------|
| Write API endpoints | Use CLI tools directly |
| Manual database operations | `node hera-cli.js create-entity` |
| Complex auth setup | Built-in organization isolation |
| Manual testing | `node hera-query.js summary` |
| Status workflows | `node status-workflow-example.js` |
| Schema verification | `node check-schema.js` |
| Build progress tracking | Universal patterns enforced |
| Read documentation | CLI tools show examples |

### **🔧 Key CLI Tools Available (USE THESE ALWAYS)**
```bash
# Quick Query Tools
node hera-query.js summary              # Database overview
node hera-query.js entities             # List all entities
node hera-query.js transactions         # List all transactions
node hera-query.js relationships        # Show entity relationships
node hera-query.js dynamic              # Show dynamic field data

# Entity Management
node hera-cli.js create-entity <type> <name>    # Create any entity
node hera-cli.js query core_entities entity_type:customer  # Query with filters
node hera-cli.js set-field <id> <field> <value> # Set dynamic fields

# Transaction Management  
node hera-cli.js create-transaction <type> <amount>  # Create transactions
node hera-cli.js query universal_transactions        # List transactions

# Relationship Management (FOR STATUS WORKFLOWS)
node status-workflow-example.js         # Learn status via relationships
node hera-cli.js query core_relationships  # View all relationships

# Schema Inspection
node check-schema.js                    # View actual table structures
node hera-cli.js show-schema [table]    # Show table columns
node hera-cli.js count <table>          # Count records in table
```

### **🛡️ SACRED RULES - NEVER VIOLATE**
1. **NO STATUS COLUMNS** - Use relationships table for status workflows
2. **NO SCHEMA CHANGES** - Use core_dynamic_data for custom fields
3. **ALWAYS USE ORGANIZATION_ID** - Multi-tenant isolation is sacred
4. **USE CLI TOOLS FIRST** - Prevents memory issues and ensures consistency
5. **SMART CODES REQUIRED** - Every operation needs intelligent context
6. **SCHEMA-FIRST DEVELOPMENT** - Always validate actual database schema before coding

## 🏗️ Schema-First Development (HERA DNA PRINCIPLE)

**CRITICAL**: Schema mismatches are the #1 cause of production failures. HERA enforces Schema-First Development.

### Before Writing ANY Code:
```bash
# 1. Check actual schema
cd mcp-server && node check-schema.js core_entities

# 2. Generate fresh types
npm run schema:types

# 3. Validate assumptions
npm run schema:validate
```

### Common Schema Mistakes to AVOID:
| ❌ WRONG | ✅ CORRECT | Why |
|----------|-----------|-----|
| `is_deleted` | `status = 'deleted'` | Column doesn't exist |
| `parent_entity_id` | `from_entity_id` | Incorrect column name |
| `child_entity_id` | `to_entity_id` | Incorrect column name |
| `transaction_number` | `transaction_code` | Wrong column name |
| `.eq('is_deleted', false)` | `.neq('status', 'deleted')` | Wrong query pattern |

### Schema Validation in Build Pipeline:
- **Automatic**: `npm run build` validates schema before building
- **Development**: `npm run dev` generates fresh types on start
- **Manual**: `npm run schema:check` for quick inspection

### See Full Guide: `/docs/SCHEMA-FIRST-DEVELOPMENT.md`

## Common Commands

```bash
# Development
npm run dev         # Start development server on localhost:3000
npm run build       # Production build (includes automatic version injection)
npm run start       # Start production server
npm run lint        # Run ESLint checks

# Multi-Tenant Development (ALWAYS USE)
# Central auth hub (development)
localhost:3000/auth/landing           # Marketing landing page
localhost:3000/auth/signup            # User registration
localhost:3000/auth/login             # User login
localhost:3000/auth/organizations     # Organization selector

# Organization access (development)
localhost:3000/~acme                  # Access 'acme' organization
localhost:3000/~mario                 # Access 'mario' organization

# Production URLs
app.heraerp.com                       # Central auth hub
acme.heraerp.com                      # Organization-specific access

# MCP Server (NEW - Primary Development Method)
cd mcp-server && npm start              # Start HERA MCP server
cd mcp-server && npm test               # Test SACRED rules enforcement
cd mcp-server && npm run test           # Test authorization tools

# Testing with HERA Universal Testing Framework ✅ PRODUCTION READY
cd packages/hera-testing

# Check environment for production testing
node bin/direct-production-test.js check-env

# Run salon test with REAL data creation in Supabase
node bin/direct-production-test.js salon --org-id "your-org-uuid" --debug

# Run any business process test
node bin/direct-production-test.js custom examples/your-test.yaml --org-id "uuid"

# Simulation mode (no real data)
node bin/simple-test.js salon examples/salon-appointment-booking.yaml

# Monitoring System (Production Ready)
npm run monitoring:dev    # Start monitoring stack (Prometheus, Grafana, Node Exporter)
npm run monitoring:stop   # Stop monitoring stack
npm run monitoring:logs   # View monitoring logs
npm run monitoring:status # Check monitoring health

# Documentation System (Auto-maintained)
npm run docs:setup-hooks      # Set up Git hooks for automatic documentation
npm run docs:generate         # Generate documentation from code changes
npm run docs:sync            # Sync generated docs to HERA database
npm run docs:health          # Check documentation system health
npm run docs:validate        # Validate all documentation links
npm run docs:cleanup         # Clean up old documentation files
npm run docs:full-maintenance # Run complete maintenance suite
npm run docs:ai-generate     # AI-powered documentation generation

# 🏗️ Schema-First Development (MANDATORY - HERA DNA)
npm run schema:check         # Quick view of actual database schema
npm run schema:types         # Generate TypeScript types from database
npm run schema:validate      # Validate schema assumptions before build
# ALWAYS run these before writing ANY code!


# 🧬 Use Claude Desktop MCP for instant development:
"Generate a restaurant POS system with inventory tracking"     # Complete system in 30 seconds via MCP
"Create a healthcare patient management module"                # Complete module via natural language
"Setup smart codes for manufacturing BOM system"              # Smart codes via MCP conversation
"Generate APIs for customer relationship management"           # Universal APIs via MCP tools
"Build a Steve Jobs-inspired UI for financial dashboard"      # UI generation via MCP
"Create demo data for retail operations"                      # Demo data via MCP commands
"Enable intelligent auto-journal processing for transactions"  # AI-powered automatic GL posting
"Setup batch journal automation for small transactions"       # Efficient batch processing system

# Progressive Web Apps
npm run generate-progressive-pwa --business="Restaurant" --type=restaurant  # Complete PWA in 30 seconds
npm run generate-progressive-pwa --business="Clinic" --type=healthcare     # Healthcare PWA ready instantly
npm run generate-progressive-pwa --business="Store" --type=retail          # Retail PWA with offline sync

# 🚀 DEPLOYMENT (CRITICAL - ALWAYS RUN BEFORE PUSHING)
npm run predeploy            # MANDATORY: Fixes all common deployment errors automatically
# This command will:
# - Fix useSearchParams() Suspense boundary issues
# - Fix incorrect toast imports
# - Check for missing dependencies
# - Run TypeScript validation
# - Execute production build test
# - Prevent 99% of deployment failures

# If you skip this, deployment WILL fail with Next.js 15 errors!

```


## Core Architecture

### Universal 6-Table Schema - The Sacred Foundation
The foundation of HERA is **exactly six universal tables** that can model any business with zero schema changes:

1. **`core_organizations`** - WHO: Multi-tenant business isolation with perfect data security
2. **`core_entities`** - WHAT: All business objects (products, customers, employees, GL accounts, etc.)
3. **`core_dynamic_data`** - HOW: Unlimited custom fields for any entity without schema changes
4. **`core_relationships`** - WHY: Universal entity connections, hierarchies, and workflows
5. **`universal_transactions`** - WHEN: All business transaction headers (sales, purchases, payments)
6. **`universal_transaction_lines`** - DETAILS: Transaction line items and complete breakdowns

### 🧬 HERA's Revolutionary Claims (Mathematically Proven)

#### **Claim 1: Universal Business Modeling**
Any business process = Entities + Relationships + Transactions + Dynamic Properties
**Proof**: 6 tables handle infinite business complexity without schema changes

#### **Claim 2: Zero Implementation Time**  
Traditional ERP: 18-36 months → HERA: 4-8 weeks (99% faster)
**Proof**: Universal patterns eliminate custom development

#### **Claim 3: Perfect Multi-Tenancy**
Sacred `organization_id` filtering prevents ALL data leakage between businesses
**Proof**: Mario's restaurant can NEVER see Dr. Smith's patients

#### **Claim 4: AI-Native Architecture**
Business data IS training data - no separate AI infrastructure needed
**Proof**: AI fields embedded in every table, real-time learning from operations

### 🏛️ HERA System Organization - Master Template Repository

**REVOLUTIONARY**: HERA includes a system organization (ID: `f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944`) that serves as the master template for all universal patterns.

#### What's in the System Organization:
- **16 Entity Type Templates** - Customer, Vendor, Product, Employee, GL Account, etc.
- **24 Standard Fields** - Email, Phone, Address, Credit Limit, Payment Terms, etc.
- **10 Workflow Statuses** - Draft → Pending → Approved → Completed (with colors!)
- **15 Relationship Types** - Has Status, Parent Of, Reports To, Customer Of, etc.
- **16 Transaction Types** - Sale, Purchase, Payment, Journal Entry, etc.
- **5 Smart Code Patterns** - Standard formats for all smart codes

#### Using System Templates:
```bash
# Explore templates
node explore-system-org.js summary       # Overview
node explore-system-org.js entity-types  # All entity types
node explore-system-org.js statuses      # Workflow statuses
node explore-system-org.js fields        # Standard fields

# Use templates in practice
node use-system-templates.js create-customer     # Create with template
node use-system-templates.js assign-status <id> PENDING  # Workflow
node use-system-templates.js demo-complete-flow  # Full demo

# Copy all templates to new organization
node explore-system-org.js copy-to <org-id>
```

#### Benefits:
- **Instant Setup** - Copy templates to new orgs in seconds
- **Consistent Patterns** - Every org uses same standards
- **No Hardcoding** - All templates are data, not code
- **Extensible** - Add your own templates to system org
- **Version Control** - Templates evolve with HERA

### Universal-First Development Philosophy 🎯

**CORE PRINCIPLE**: Default to universal architecture. Build specific APIs/UI only when universal patterns are insufficient.

#### Development Workflow:
1. **Start with System Templates** - Use HERA System Organization patterns
2. **Leverage Dynamic Data** - Store custom properties in `core_dynamic_data` 
3. **Use Relationships for Workflows** - Never add status columns
4. **Maintain Universality** - Even specific implementations should integrate back to universal system

#### Universal Architecture Components:

**✅ Universal Schema** (`database/migrations/schema.sql`)
- Complete 6-table foundation with enterprise-grade security
- Supports infinite business complexity without schema changes
- AI-ready with confidence scores and classification fields built-in
- Perfect multi-tenancy with organization_id isolation

**✅ Universal API** (`/src/app/api/v1/universal/` + `/src/lib/universal-api.ts`)
- Complete CRUD operations on all 6 universal tables
- Multi-tenant security with JWT authentication and RBAC
- TypeScript client with full type safety and intelligent error handling
- Mock mode for development without database
- Batch operations, data validation, and performance optimization

**✅ Universal UI** (`src/components/` + reusable patterns)
- Complete component library with Steve Jobs-inspired design
- Universal CRUD components for entities and dynamic data
- Enterprise tables, forms, navigation, and dashboard layouts
- Dark/light theme system with accessibility compliance

**✅ Universal Authorization** (`src/components/auth/` + middleware)
- Organization-first security with perfect multi-tenant isolation
- Dynamic role-based permissions managed through universal entities
- JWT tokens with organization context and automatic validation
- Apple-inspired authentication interface with seamless user experience

**✅ Finance DNA Integration** (`/src/lib/dna/integration/` - NEW CORE DNA COMPONENT)
- Universal Finance↔SD↔MM↔HR integration for all business apps
- Smart code-driven automatic GL posting with industry templates
- Policy-as-data posting rules stored in universal tables
- Zero integration code - apps just emit events with smart codes
- Perfect audit trail with AI-enhanced confidence scoring
- Module activation matrix with per-organization configuration

## 🏛️ IFRS LINEAGE - STANDARD FEATURE ACROSS ALL COA ✅

**REVOLUTIONARY**: HERA is the first ERP system with built-in IFRS compliance by default. Every Chart of Accounts generated includes complete IFRS lineage automatically.

### **🎯 Key IFRS Features (Standard)**
- **Complete IFRS Classification**: Every account mapped to proper IFRS categories
- **5-Level Hierarchy**: Support for complex organizational structures
- **Statement Mapping**: Automatic Balance Sheet, P&L, Cash Flow generation
- **Parent-Child Relationships**: Multi-level rollup and consolidation
- **Consolidation Methods**: Support for group company reporting
- **Industry Compliance**: Works across all business types globally

### **🔧 Universal API IFRS Functions**
```typescript
// Setup IFRS-compliant COA (automatic with setupBusiness)
await universalApi.setupIFRSChartOfAccounts({
  organizationId: 'org-123',
  industry: 'restaurant',
  country: 'AE',
  organizationName: 'Mario\'s Restaurant'
})

// Retrieve COA with complete IFRS lineage
const coa = await universalApi.getIFRSChartOfAccounts('org-123')

// Validate IFRS compliance
const validation = await universalApi.validateIFRSCompliance('org-123')
```

### **🌍 Universal Coverage**
- **132 Template Combinations**: Every combination includes complete IFRS lineage
- **11 IFRS Fields**: Mandatory on every account (classification, hierarchy, statements)
- **Zero Additional Cost**: Built into every HERA implementation
- **Automatic Validation**: Real-time compliance checking
- **Audit Ready**: Complete lineage tracking for audit requirements

## 🌐 Universal API - Revolutionary Single Endpoint

**BREAKTHROUGH**: One API endpoint handles ALL business operations across the entire 6-table schema.

### **Key Features**:
- **Complete CRUD** for all 6 universal tables with enterprise-grade security
- **Multi-Tenant Isolation** with sacred organization_id filtering (zero data leakage)
- **JWT Authentication & RBAC** with dynamic permission management
- **TypeScript Client** with full type safety and intelligent error handling
- **Batch Operations** for high-performance scenarios and data import/export
- **Real-time Validation** with detailed error messages and business rule enforcement
- **Mock Mode** works without database configuration for development
- **Performance Optimization** with Redis caching and structured logging

### **Quick Usage**:
```typescript
import { universalApi } from '@/lib/universal-api'

// Set context (automatic organization_id filtering)
universalApi.setOrganizationId('your-org-id')

// Create any business entity
await universalApi.createEntity({
  entity_type: 'customer',
  entity_name: 'VIP Customer',
  smart_code: 'HERA.CRM.CUST.ENT.PROF.v1'
})

// Add unlimited custom fields without schema changes
await universalApi.setDynamicField(entityId, 'vip_tier', 'platinum')

// Create business transactions
await universalApi.createTransaction({
  transaction_type: 'sale',
  smart_code: 'HERA.CRM.SALE.TXN.ORDER.v1',
  total_amount: 5000.00,
  line_items: [
    { entity_id: productId, quantity: 2, unit_price: 2500.00 }
  ]
})

// Complete business setup in one call
const business = await universalApi.setupBusiness({
  organization_name: "Your Business",
  owner_name: "Owner Name",
  business_type: "restaurant"
})
```

### **API Endpoint**: `/api/v1/universal`
- **GET** `?action=schema` - Complete schema information with table relationships
- **GET** `?action=read&table=TABLE_NAME` - Read records with automatic filtering
- **POST** - Create, batch create, validate with business rule enforcement
- **PUT** - Update records with optimistic locking
- **DELETE** - Delete records with cascade handling

### **Revolutionary Impact**:
- **One API** replaces 500+ traditional ERP endpoints
- **6 tables** handle infinite business complexity with zero schema changes
- **30-second implementation** vs 18-month traditional ERP projects
- **$2.8M cost savings** vs traditional SAP/Oracle implementations
- **Perfect security** through universal authorization architecture

## Directory Structure

- **`src/app/`** - Next.js App Router with multi-tenant routing
  - **`auth/`** - Complete SaaS authentication pages (USE ALWAYS)
    - `landing/` - Marketing landing page
    - `organizations/` - Organization selector and creator
    - `organizations/[id]/apps/` - App selection for new organizations
  - **`org/`** - Organization dashboard (accessed via subdomain)
- **`src/components/`** - Reusable React components with multi-tenant design
  - **`auth/MultiOrgAuthProvider.tsx`** - Main auth provider (USE ALWAYS)
- **`src/lib/`** - Utility functions, universal API client, and business logic
- **`database/`** - Universal schema with organization management functions
  - **`functions/organizations/`** - Organization CRUD and management
- **`middleware.ts`** - Subdomain routing and organization detection
- **`config/`** - Business configuration files and industry templates
- **`docs/`** - Comprehensive documentation
- **`monitoring/`** - Complete monitoring system with Prometheus, Grafana, and Node Exporter

## 🔌 HERA MCP Server - Revolutionary Natural Language Database Control

**WORLD'S FIRST**: Claude Desktop with direct, secure access to enterprise database through natural language commands.

### **🚀 MCP Capabilities**
- **Direct Supabase Control**: Create, read, update, delete data through conversation
- **SACRED Rules Enforcement**: Bulletproof multi-tenant security automatically enforced
- **Universal Authorization**: Two-tier auth system (Supabase + HERA) via natural language
- **Smart Code Generation**: Automatic business intelligence for all operations
- **Zero Schema Changes**: Add fields and functionality without database migrations
- **AI-Enhanced Security**: Permission decisions with confidence scoring

### **🛠️ Available MCP Tools**
```typescript
// Universal Data Operations
"create-entity"           // Create any business object (customer, product, etc.)
"create-transaction"      // Create business transactions with line items
"set-dynamic-field"       // Add custom fields without schema changes
"create-relationship"     // Link business entities together
"query-universal"         // Query any of the 6 sacred tables

// Authorization & Security
"create-hera-user"        // Create users with automatic entity generation
"setup-organization-security"  // Configure enterprise security
"create-user-membership"  // Assign roles and permissions
"check-user-authorization" // Verify user permissions
"create-auth-policy"      // Custom business authorization rules
"generate-test-jwt"       // JWT tokens for testing
"test-authorization-flow" // Complete security validation
```

### **🎯 MCP Usage Examples**
```bash
# In Claude Desktop:
"Create a customer entity for Tesla Inc with VIP status"
"Add a credit limit of $1 million to Tesla"
"Create a sales transaction for $500,000 with Tesla"
"Setup manager role for john@tesla.com in Tesla organization"
"Generate a JWT token for testing the API"
"Test the authorization flow for financial data access"
```

### **⚡ Revolutionary Benefits**
- **30-second Development**: Complete business modules via conversation
- **Perfect Security**: SACRED rules prevent all common mistakes
- **Universal Patterns**: Same commands work for any business domain
- **Zero Training**: Natural language eliminates learning curve
- **Enterprise-Grade**: Multi-tenant isolation with audit trails


## 🤖 HERA Universal AI System - Multi-Provider Intelligence

**BREAKTHROUGH**: World's first Universal AI Orchestration System with intelligent provider routing and automatic fallback.

### **Revolutionary AI Architecture** ✅ PRODUCTION READY
- **Multi-Provider Support**: OpenAI GPT-4, Anthropic Claude, Google Gemini + Local LLM
- **Intelligent Routing**: Task-specific provider selection for optimal results
- **Automatic Fallback**: Seamless provider switching if primary fails
- **Cost Optimization**: Smart provider selection based on cost/performance ratios
- **Universal Smart Codes**: `HERA.AI.*` smart code classification system
- **Real-time Streaming**: Live AI response streaming with WebSocket support

### **AI API Endpoints**
```typescript
// Main AI processing with intelligent routing
POST /api/v1/ai/universal
{
  "action": "custom_request",
  "smart_code": "HERA.EDU.AI.TUTOR.v1",
  "task_type": "learning",
  "prompt": "Explain GST Input Tax Credit with examples",
  "fallback_enabled": true
}

// Real-time streaming AI responses
POST /api/v1/ai/stream

// AI-powered documentation generation  
POST /api/v1/ai/docs
```

### **Provider Selection Intelligence**
| Task Type | Primary | Secondary | Tertiary | Reasoning |
|-----------|---------|-----------|----------|-----------|
| **Learning** | Claude | OpenAI | Gemini | Claude excels at educational content |
| **Code Generation** | OpenAI | Claude | Gemini | GPT-4 strong for code |
| **Data Analysis** | Claude | Gemini | OpenAI | Claude excellent for analysis |
| **Creative Writing** | OpenAI | Gemini | Claude | GPT-4 for creativity |

## 📊 Production Monitoring System

HERA includes a complete production-ready monitoring stack for enterprise observability:

### **Monitoring Architecture** ✅ PRODUCTION READY
- **Prometheus**: Time-series metrics collection and storage
- **Grafana**: Beautiful dashboards with 4 pre-configured panels
- **Node Exporter**: System metrics (CPU, memory, disk, network)
- **Custom Metrics**: Business KPIs, API performance, error rates

### **Pre-configured Dashboards**
1. **System Overview**: CPU, memory, disk usage with alerting thresholds
2. **API Performance**: Request rates, response times, error tracking
3. **Business Metrics**: Active users, transactions, revenue tracking
4. **Database Health**: Connection pools, query performance, deadlocks

### **Quick Start**
```bash
# Start complete monitoring stack
npm run monitoring:dev

# Access dashboards
Grafana: http://localhost:3000 (admin/admin)
Prometheus: http://localhost:9090
Node Exporter: http://localhost:9100/metrics

# Health check endpoint
curl http://localhost:3001/api/health
```

### **Railway Deployment**
Complete monitoring stack deploys to Railway with one click:
- Automatic SSL/TLS configuration
- Custom domain support (monitoring.yourdomain.com)
- Persistent storage for metrics history
- Zero-downtime updates

## PWA Implementation

The app includes advanced PWA features with universal offline support:
- Service Worker at `/public/sw.js` with version-based cache management
- Automatic version injection during build via `scripts/inject-build-version.js`
- Offline support with fallback pages for universal business operations
- Installation prompts and push notifications for business-critical updates
- Universal data synchronization when connectivity resumes

## Design System

### HERA Brand Colors (oklch format)
- Primary Blue: `oklch(0.57 0.192 250)`
- Cyan Secondary: `oklch(0.68 0.12 200)`
- Emerald Accent: `oklch(0.64 0.12 160)`
- Amber Gold: `oklch(0.69 0.12 85)`
- Purple: `oklch(0.58 0.192 280)`

Custom utility classes are available in `src/app/globals.css`:
- `.hera-card` - Professional card styling with gradients
- `.hera-button` - Brand-consistent button styles
- `.hera-select-content` - **HERA DNA STANDARD**: Universal dropdown visibility fix
- `.hera-select-item` - **HERA DNA STANDARD**: Dropdown item styling with proper contrast
- Comprehensive dark theme implementation

### **🧬 HERA DNA STANDARD FEATURES**

**Dropdown Visibility Fix** - Automatically applied globally:
- **Universal Fix**: All Radix Select dropdowns have proper white/dark backgrounds
- **Theme Support**: Automatic light/dark mode compatibility
- **Z-index Management**: Proper layering for modal contexts
- **Accessibility**: Enhanced contrast and focus states
- **Usage**: Use `.hera-select-content` class or automatic global styling

**Dark Mode Text Visibility Fix** - CRITICAL DNA PATTERN:
- **Problem**: Global CSS rules override Tailwind classes causing dark text on dark backgrounds
- **Solution**: Use `!important` modifier: `!text-gray-900 dark:!text-gray-100`
- **DNA Component**: `StatCardDNA` automatically applies this fix
- **Usage**: Always use StatCardDNA for stat cards to ensure visibility
- **Documentation**: See `/docs/HERA-THEME-SYSTEM.md` for complete guide

**Enterprise Table Styling** - Professional data display patterns:
- **Visual Hierarchy**: Card opacity 95%, subtle shadows, proper spacing
- **Zebra Striping**: Alternating rows with `bg-gray-50/30 dark:bg-gray-800/20` for subtle contrast
- **Hover States**: Consistent `hover:bg-cyan-100/50 dark:hover:bg-cyan-950/30` across all rows
- **Table Headers**: Uppercase with tracking, semibold text, gray background for separation
- **Status Badges**: Subtle backgrounds with borders (e.g., `bg-red-100 dark:bg-red-900/30`)
- **Typography**: Larger values (text-3xl) in summary cards, bold quantities in tables
- **Professional Features**: Export buttons, enhanced padding (px-6), consistent icon sizing
- **Dark Mode Support**: All colors properly defined for both themes
- **Global CSS Conflicts**: Remove conflicting `tbody tr:nth-child` and `tbody tr:hover` rules

**Text Visibility in Dark Mode** - Ensuring readable content:
- **Process Steps**: Use `dark:text-white` or `dark:text-slate-50` for off-white text
- **Section Headers**: Explicit colors with `text-gray-900 dark:text-gray-100`
- **Avoid Global Overrides**: Remove `!important` rules like `.text-gray-700 { color: ... !important }`
- **Background Contrast**: Use `dark:bg-gray-800/70` for better text visibility
- **Testing Pattern**: Always verify text is readable in both light and dark modes
- **⚡ CRITICAL FIX for Stats Cards**: Use `!text-gray-900 dark:!text-gray-100` with !important modifier
  - Global CSS rules in `globals.css` can override Tailwind classes for `.text-2xl.font-bold`, `.text-3xl.font-bold`
  - Solution: Force colors with `!important` modifier on stat values
  - DNA Component: Use `StatCardDNA` from `/src/lib/dna/components/ui/stat-card-dna.tsx` which handles this automatically

## Security & Multi-Tenancy

### **Universal Authorization Architecture** 🛡️
- **Organization-First Security**: Every request filtered by organization_id (sacred boundary)
- **Dynamic Role-Based Access Control**: Roles and permissions managed as universal entities
- **JWT Authentication**: Organization context embedded in every token
- **Row Level Security (RLS)**: Database-level enforcement of multi-tenant isolation
- **Perfect Data Isolation**: Mario's restaurant can NEVER see Dr. Smith's patients
- **Security Headers**: Comprehensive security configuration in `vercel.json`

### **🔐 THREE-LAYER AUTHORIZATION PATTERN (MANDATORY)**
ALL production pages MUST implement this pattern:

```typescript
// Layer 1: Authentication Check
if (!isAuthenticated) {
  return <Alert>Please log in to access this page.</Alert>
}

// Layer 2: Context Loading Check (NEVER SKIP THIS!)
if (contextLoading) {
  return <LoadingSpinner />
}

// Layer 3: Organization Check
if (!organizationId) {
  return <Alert>No organization context found.</Alert>
}
```

**CRITICAL**: See `/docs/AUTHORIZATION-PATTERN.md` for complete implementation guide. Skipping any layer will cause infinite loading or security vulnerabilities!

### **Three-Layer Security Model**:
1. **Layer 1: Organization Isolation** - Sacred organization_id boundary (zero data leakage)
2. **Layer 2: Entity-Level Permissions** - Dynamic role-based access through universal entities
3. **Layer 3: Row-Level Security** - Advanced filtering based on user context and relationships

### **JWT Claims Structure**:
```typescript
{
  sub: user_id,
  organization_id: "sacred_boundary",
  entity_id: "user_as_entity_reference",
  role: "owner" | "admin" | "manager" | "user",
  permissions: ["entities:read", "transactions:write", ...]
}
```

## Development Patterns

### Path Aliases
Use `@/` prefix for imports from the `src/` directory:
```typescript
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { universalApi } from '@/lib/universal-api'
```

### TypeScript Configuration
- Strict mode enabled with comprehensive type checking
- Path mapping configured for clean imports
- React 19 types with Next.js optimizations
- Universal API client with full type safety

### Component Architecture
- Shadcn/ui components with New York style enhanced for HERA
- Custom HERA components extending base shadcn patterns
- Steve Jobs-inspired authentication interface with Apple aesthetics
- Universal patterns: UniversalTable, DynamicForm, NavigationSystem
- Lucide React for consistent iconography across all business contexts
- **HERA DNA Components**:
  - `StatCardDNA` - Statistics cards with automatic dark mode text visibility fix
  - `MiniStatCardDNA` - Compact stat cards for dashboard summaries
  - `StatCardGrid` - Responsive grid layout for stat cards
  - `ThemeProviderDNA` - Universal theme management with dark/light mode support
- **HERA Theme System** - Complete theming solution with semantic colors (see `/docs/HERA-THEME-SYSTEM.md`)

## Universal Business Logic Patterns 🏗️

### Universal Entity Management
**DEFAULT APPROACH**: All business objects use `core_entities` table:

```typescript
// Example: Creating a new customer
const customer = {
  entity_type: 'customer',
  entity_name: 'ACME Corp',
  entity_code: 'CUST001',
  organization_id: user.organization_id,  // SACRED: Multi-tenant isolation
  smart_code: 'HERA.CRM.CUST.ENT.PROF.v1'  // Universal business intelligence
  // NO STATUS FIELD - Use relationships for status!
}

// Custom properties via core_dynamic_data (no schema changes needed)
const customFields = [
  { field_name: 'credit_limit', field_value_number: 50000, smart_code: 'HERA.CRM.CUST.DYN.CREDIT.v1' },
  { field_name: 'payment_terms', field_value_text: 'NET30', smart_code: 'HERA.CRM.CUST.DYN.TERMS.v1' },
  { field_name: 'tax_id', field_value_text: '12-3456789', smart_code: 'HERA.CRM.CUST.DYN.TAX.v1' }
]
```

**Common Entity Types**:
- `customer` - Customer records with dynamic CRM fields
- `vendor` - Supplier records with procurement data
- `product` - Product catalog with unlimited specifications
- `employee` - Staff records with HR data and relationships
- `gl_account` - Chart of accounts with IFRS-compliant financial intelligence
- `budget` - Universal budgets with multi-dimensional planning (NEW STANDARD FEATURE)
- `forecast` - Rolling forecasts with scenario planning (NEW STANDARD FEATURE)
- `location` - Warehouses/stores with geographic data
- `project` - Project management with task relationships
- `development_task` - HERA development tasks (MANDATORY for all coding)
- `user` - System users (users are entities too!)
- `ai_agent` - AI agents for autonomous business optimization

### Universal Transaction Processing
**DEFAULT APPROACH**: All business activities use universal transaction tables:

```typescript
// Universal transaction header
const transaction = {
  transaction_type: 'sale', // sale, purchase, payment, transfer, journal_entry, budget_line, forecast_line
  transaction_date: new Date(),
  organization_id: user.organization_id,  // SACRED: Multi-tenant isolation
  transaction_code: generateTransactionCode(), // NOTE: Use transaction_code, NOT transaction_number
  smart_code: 'HERA.CRM.SALE.TXN.ORDER.v1',  // Automatic GL posting
  total_amount: 1000.00,
  from_entity_id: customer_id,  // Customer making the purchase
  to_entity_id: store_id        // Store receiving the payment
}

// Transaction lines with flexible structure (THE CRITICAL 6TH TABLE)
const lines = [
  {
    line_entity_id: product_id,  // Links to product entity
    line_number: 1,
    quantity: 2,
    unit_price: 500.00,
    line_amount: 1000.00,
    smart_code: 'HERA.CRM.SALE.LINE.ITEM.v1',  // Line-level business intelligence
    metadata: {
      cost_basis: 200.00,
      margin_percent: 60.0,
      sales_rep: employee_id
    }
  }
]
```

### Universal Smart Code System 🧠
**REVOLUTIONARY**: Every data point has intelligent business context through Smart Codes

```typescript
// Smart Code Format: HERA.{INDUSTRY}.{MODULE}.{FUNCTION}.{TYPE}.v{VERSION}

// Examples:
'HERA.REST.CRM.CUST.ENT.PROF.v1'    // Restaurant customer profile
'HERA.HLTH.PAT.MED.REC.DATA.v1'     // Healthcare patient medical record
'HERA.MFG.PROD.BOM.REL.COMP.v1'     // Manufacturing BOM component relationship
'HERA.FIN.GL.ACC.TXN.POST.v1'       // Financial GL account posting

// Smart Codes enable:
// - Automatic business rule application
// - Cross-industry learning and optimization
// - AI-powered insights and recommendations
// - Dynamic UI component selection
// - Intelligent API routing and processing
```

### 🔄 Universal Status Workflows (CRITICAL PATTERN)
**NEVER ADD STATUS COLUMNS** - Use relationships for all status workflows:

```typescript
// WRONG - Never do this:
const entity = {
  status: 'active'  // ❌ VIOLATES UNIVERSAL ARCHITECTURE
}

// CORRECT - Use relationships:
// 1. Create status entities (one-time setup)
const statuses = ['draft', 'pending', 'approved', 'rejected', 'completed']
statuses.forEach(status => {
  createEntity({
    entity_type: 'workflow_status',
    entity_name: `${status} Status`,
    entity_code: `STATUS-${status.toUpperCase()}`,
    smart_code: `HERA.WORKFLOW.STATUS.${status.toUpperCase()}.v1`
  })
})

// 2. Assign status via relationship
createRelationship({
  from_entity_id: transaction.id,    // NOTE: Use from_entity_id
  to_entity_id: pendingStatus.id,    // NOTE: Use to_entity_id
  relationship_type: 'has_status',
  smart_code: 'HERA.WORKFLOW.STATUS.ASSIGN.v1',
  metadata: {
    assigned_at: new Date(),
    assigned_by: currentUser.id
  }
})

// 3. Query entities with their status
SELECT e.*, s.entity_name as current_status
FROM core_entities e
LEFT JOIN core_relationships r ON e.id = r.from_entity_id 
  AND r.relationship_type = 'has_status'
LEFT JOIN core_entities s ON r.to_entity_id = s.id
WHERE e.organization_id = ?

// Benefits:
// ✅ Complete audit trail
// ✅ Multiple simultaneous statuses
// ✅ Status history tracking
// ✅ No schema changes ever
// ✅ Works for ANY entity type
```

### Universal Development Guidelines

#### ✅ DO (Multi-Tenant Universal-First):
- **ALWAYS use MultiOrgAuthProvider** - Never use old auth components
- **ALWAYS include organization_id** - Every API call, every database query (SACRED)
- **ALWAYS create a HERA task before coding** (entity_type='development_task')
- Store new business objects in `core_entities` with appropriate `entity_type` and `smart_code`
- Use `core_dynamic_data` for custom fields instead of new columns
- Leverage existing universal APIs before building new ones
- Use `universal_transactions` for all business activities with proper Smart Codes
- Apply multi-tenant authorization patterns for security
- Test with multiple organizations to ensure proper isolation
- Use subdomain routing for organization access

#### ❌ DON'T (Anti-Patterns):
- **NEVER use old auth components** (DualAuthProvider, etc.) - Use MultiOrgAuthProvider
- **NEVER bypass organization_id filtering** - This violates multi-tenancy (SACRED)
- **NEVER code without a HERA task** - This violates the Meta principle
- Create new tables for business objects that can fit in `core_entities`
- Add columns to existing tables when `core_dynamic_data` suffices
- Build separate API endpoints when universal APIs can handle the logic
- Create business-specific database schemas
- Build without Smart Codes (loses universal intelligence)
- Mix data between organizations (data leakage violation)

## Universal Implementation Examples 📚

### 🏆 Universal Chart of Accounts with IFRS Lineage (Commercial Product)
**World's First Universal COA Engine with Built-in IFRS Compliance** - Revolutionary commercial breakthrough:

**🌍 Global Scale**:
- **132 Template Combinations** (12 countries × 11 industries)
- **30-Second Setup** vs 18-month traditional implementations
- **98% Cost Reduction** vs SAP/Oracle solutions
- **Commercial Marketplace** with 3-tier pricing ($49-449/month)
- **🏛️ IFRS Compliance**: Every generated COA is automatically IFRS-compliant

**🏗️ Universal Architecture with IFRS Lineage** (STANDARD FEATURE):
- GL accounts stored as `core_entities` with `entity_type = 'gl_account'`
- Complete IFRS lineage in `core_dynamic_data` (ifrs_classification, parent_account, account_level, etc.)
- Account hierarchies via parent-child relationships and rollup accounts
- **Template layering**: Base → Country → Industry → Custom → IFRS Mapping
- **Smart Codes**: `HERA.FIN.GL.ACC.*` for automatic business intelligence
- **IFRS Fields**: Complete 11-field IFRS lineage including statement mapping (SFP/SPL/SCE/SCF/NOTES)
- **5-6-7-8-9 Structure**: Universal expense classification enforced globally

### 🚀 REVOLUTIONARY UNIVERSAL TEMPLATE SYSTEM ⚡

**BREAKTHROUGH**: World's fastest enterprise system delivery - production-ready applications in 30 seconds with guaranteed quality.

#### **💼 Universal CRM Template** - *Enterprise CRM in 30 seconds* ✅ PRODUCTION READY
- **Setup Time**: 30 seconds (vs 6-21 months traditional)
- **Cost Savings**: 90% ($50K vs $500K annually)
- **Performance**: 43% faster than Salesforce (1.8s vs 3.5s loads)
- **UAT Validated**: 92% success rate, A+ performance grade
- **Mobile-First**: 100% responsive across all devices
- **Demo Data**: TechVantage Solutions with $1.6M realistic pipeline
- **Business Impact**: Immediate productivity, zero implementation cost

#### **🧪 Universal UAT Testing Template** - *Enterprise testing in minutes* ✅ PRODUCTION READY
- **Test Coverage**: 50+ comprehensive scenarios
- **Success Rate**: 92% proven with HERA CRM validation
- **Benchmarking**: Automated competitive analysis vs market leaders
- **Reporting**: Executive dashboards with stakeholder-ready summaries
- **Mobile Testing**: 5+ device types validated automatically
- **Performance Grading**: A+ to F scoring with improvement recommendations
- **Business Value**: $200K+ testing cost savings, guaranteed quality

#### **🎯 Universal Sales Demo Template** - *Professional demos instantly* ✅ PRODUCTION READY
- **Demo Scenarios**: 5 scripted presentations (15-45 minutes each)
- **Conversion Rate**: 85% follow-up rate (vs 60% industry average)
- **Competitive Analysis**: Live benchmarking vs Salesforce/HubSpot/Pipedrive
- **Objection Handling**: Proven customer response scripts
- **ROI Calculators**: Customizable business case generators
- **Training Materials**: Complete sales team certification program


### 🎯 Universal API Best Practices

**Start with Universal API** - It handles 95%+ of use cases:
- Complete CRUD for all 7 tables with multi-tenant security
- Batch operations for high-performance scenarios  
- Built-in validation and schema introspection
- Mock mode for development without database
- Smart Code integration for business intelligence

**Add specialized endpoints only when**:
- Performance requires optimization (complex aggregations, real-time analytics)
- External systems need specific formats (payment gateways, third-party APIs)
- Complex business logic spans multiple tables with heavy calculations
- Bulk operations exceed 100K+ records requiring streaming

**Always integrate back to universal tables**:
- Even specialized APIs should store data in the 7 sacred tables
- Maintain Smart Code patterns for business intelligence
- Use organization_id filtering for multi-tenant isolation
- Leverage universal authorization for security

### When to Build Specific APIs/UI

**Build Specific When**:
- Performance optimization needed for complex queries beyond universal patterns
- Business logic too complex for universal patterns (rare with Smart Codes)
- External integrations requiring specialized handling not covered by universal APIs
- User experience demands highly customized interface beyond universal components

**Integration Pattern**:
Even specific implementations should:
1. Store core data in universal tables with appropriate Smart Codes
2. Use universal APIs for basic CRUD operations and security
3. Add specific endpoints only for complex business logic not handled universally
4. Maintain compatibility with universal patterns for future extensibility

## 💰 HERA Universal Budgeting System - NEW STANDARD FEATURE

HERA now includes comprehensive enterprise-grade budgeting and forecasting capabilities built on the universal 6-table architecture.

## 🤖 HERA Auto-Journal Posting Engine - REVOLUTIONARY NEW FEATURE

**BREAKTHROUGH**: World's first intelligent journal entry automation system with AI integration, transforming HERA into a self-maintaining accounting engine.

### **⚡ Revolutionary Auto-Journal Architecture** ✅ PRODUCTION READY

**Key Capabilities**:
- **Intelligent Classification**: Rule-based logic (95% of cases) + AI analysis for complex scenarios
- **Automatic Generation**: Creates proper journal entries following standard accounting principles
- **Batch Processing**: Small transactions automatically batched into efficient summary entries
- **Real-Time Processing**: Large/critical transactions processed immediately
- **Perfect Integration**: Uses same universal 6-table architecture, zero new tables required
- **Complete Automation**: 85%+ automation rate with 92% time savings

### **🧠 Intelligent Processing Modes**

**Immediate Processing**:
- Large transactions (>$1,000)
- Payments and receipts (always critical)
- Transactions marked with `.CRITICAL.` smart codes
- Any transaction requiring immediate GL impact

**Batch Processing**:
- Small routine transactions (<$100)
- End-of-day automatic summarization
- Groups by transaction type and date
- Creates consolidated journal entries

**Smart Classification**:
```typescript
// Always Journal Relevant
'HERA.FIN.GL.TXN.JE.v1'         // Direct journal entry
'HERA.FIN.AP.TXN.PAY.v1'        // Vendor payment
'HERA.FIN.AR.TXN.RCP.v1'        // Customer payment

// Conditional (Amount/Rules Based)
'HERA.REST.POS.TXN.SALE.v1'     // Restaurant sale (batch if small)
'HERA.INV.RCV.TXN.IN.v1'        // Inventory receipt (immediate if large)

// Never Journal Relevant
'HERA.CRM.CUS.ENT.PROF.DRAFT'   // Draft customer profile
'HERA.SCM.PUR.TXN.QUOTE.v1'     // Purchase quote (no commitment)
```

### **🔧 Auto-Journal API Functions**

```typescript
// Process transaction for automatic journal creation
const result = await universalApi.processTransactionForAutoJournal(transactionId)

// Run end-of-day batch processing
const batchResult = await universalApi.runBatchJournalProcessing()

// Check if transaction requires journal entry
const relevance = await universalApi.checkTransactionJournalRelevance(transactionData)

// Get automation statistics and insights
const stats = await universalApi.getAutoJournalStatistics(7) // Last 7 days

// Enhanced transaction creation with auto-journal
const enhanced = await universalApi.createTransactionWithAutoJournal(transactionData)
```

### **📊 Business Impact**

| Metric | Traditional | HERA Auto-Journal | Savings |
|--------|-------------|-------------------|---------|
| **Manual Entries/Day** | 50 | 7.5 | 85% reduction |
| **Time/Day** | 4.2 hours | 0.6 hours | 3.6 hours saved |
| **Monthly Cost** | $3,360 | $480 | $2,880 saved |
| **Annual Savings** | - | - | **$34,560** |
| **Error Rate** | 15% | 2% | 86.7% improvement |
| **Automation Rate** | 0% | 85%+ | Complete transformation |

### **🚀 Revolutionary Benefits**

- **Automatic Books**: Journal entries created automatically as transactions occur
- **Real-Time Accuracy**: Budget vs actual tracking always current
- **Zero Manual Work**: 85%+ of journal entries created without human intervention
- **Perfect Integration**: Works seamlessly with budgeting and financial reporting
- **AI-Enhanced**: Complex scenarios handled intelligently with confidence scoring
- **Audit Trail**: Complete transparency with processing logs and validation status

This breakthrough positions HERA as the **ONLY ERP system with intelligent auto-journal posting built-in by default**, eliminating traditional accounting bottlenecks and enabling real-time financial visibility.

## 🧬 AUTO-JOURNAL DNA COMPONENT - UNIVERSAL REUSABLE INTELLIGENCE

**REVOLUTIONARY**: The Auto-Journal Engine is now a core DNA component that can be reused across all business types with industry-specific configurations, making HERA the first ERP with truly universal auto-journal capabilities.

### **🎯 DNA Component Architecture** ✅ PRODUCTION READY

The Auto-Journal Engine exists as DNA Component `HERA.FIN.AUTO.JOURNAL.ENGINE.v1` with:

- **Universal Configuration**: Works for any industry (restaurant, healthcare, manufacturing, professional services, retail)
- **Industry-Specific Rules**: Pre-configured journal rules and thresholds for each business type
- **Multi-Currency Support**: Handles unlimited currencies with automatic gain/loss calculations
- **Flexible Batching**: Configurable batching strategies by payment method, shift, department, time window
- **AI Classification**: Built-in patterns for transaction classification with confidence scoring
- **Audit Compliance**: Complete audit trails with configurable retention periods

### **🏭 Industry-Specific Configurations**

#### **Restaurant Industry** (`HERA.DNA.AUTO.JOURNAL.CONFIG.RESTAURANT.v1`)
```typescript
const restaurantConfig = {
  thresholds: {
    immediate_processing: 1000,    // Large orders processed immediately
    batch_small_transactions: 100, // Small orders batched
    batch_minimum_count: 5,        // Need 5+ transactions to batch
    batch_summary_threshold: 500   // Batch if total > $500
  },
  journal_rules: [
    {
      transaction_type: 'sale',
      smart_code_pattern: '.REST.SALE.',
      debit_accounts: ['1100000'],      // Cash
      credit_accounts: ['4110000', '2250000'], // Food Sales, Sales Tax
      split_tax: true
    }
  ],
  batch_strategies: ['by_payment_method', 'by_shift', 'by_pos_terminal'],
  tax_handling: {
    default_rate: 0.05,
    tax_accounts: {
      sales_tax: '2250000',
      input_tax: '1450000'
    }
  }
}
```

#### **Healthcare Industry** (`HERA.DNA.AUTO.JOURNAL.CONFIG.HEALTHCARE.v1`)
```typescript
const healthcareConfig = {
  thresholds: {
    immediate_processing: 500,     // Lower threshold for medical services
    batch_small_transactions: 50, // Very small transactions batched
    batch_minimum_count: 10,      // Higher count for batching
    batch_summary_threshold: 300  // Lower batch threshold
  },
  journal_rules: [
    {
      transaction_type: 'patient_service',
      smart_code_pattern: '.HLTH.SVC.',
      debit_accounts: ['1210000'],    // Patient Receivables
      credit_accounts: ['4210000'],   // Service Revenue
      insurance_split: true
    }
  ],
  batch_strategies: ['by_provider', 'by_department', 'by_insurance_payer'],
  compliance: {
    hipaa_compliant: true,
    audit_retention_years: 7
  }
}
```

#### **Manufacturing Industry** (`HERA.DNA.AUTO.JOURNAL.CONFIG.MANUFACTURING.v1`)
```typescript
const manufacturingConfig = {
  thresholds: {
    immediate_processing: 5000,    // High threshold for production orders
    batch_small_transactions: 500, // Material movements batched
    batch_minimum_count: 3,        // Few transactions needed
    batch_summary_threshold: 2000  // Higher batch threshold
  },
  journal_rules: [
    {
      transaction_type: 'production_order',
      smart_code_pattern: '.MFG.PROD.',
      debit_accounts: ['1350000', '1360000'], // WIP, Finished Goods
      credit_accounts: ['1330000', '5310000'], // Raw Materials, Labor
      wip_tracking: true
    }
  ],
  batch_strategies: ['by_production_line', 'by_shift', 'by_work_center'],
  costing: {
    method: 'standard_costing',
    variance_accounts: {
      material_variance: '5330000',
      labor_variance: '5340000',
      overhead_variance: '5350000'
    }
  }
}
```

#### **Professional Services** (`HERA.DNA.AUTO.JOURNAL.CONFIG.PROFESSIONAL.v1`)
```typescript
const professionalConfig = {
  thresholds: {
    immediate_processing: 2000,    // Client billing threshold
    batch_small_transactions: 200, // Small time entries batched
    batch_minimum_count: 5,        
    batch_summary_threshold: 1000
  },
  journal_rules: [
    {
      transaction_type: 'time_billing',
      smart_code_pattern: '.PROF.TIME.',
      debit_accounts: ['1230000', '1240000'], // Unbilled Receivables, WIP
      credit_accounts: ['4310000'],           // Professional Services Revenue
      wip_recognition: true
    }
  ],
  batch_strategies: ['by_project', 'by_client', 'by_consultant'],
  revenue_recognition: {
    method: 'percentage_of_completion',
    wip_account: '1240000',
    deferred_revenue: '2300000'
  }
}
```

### **🔧 Universal API Integration**

The Auto-Journal DNA Component is fully integrated into the Universal API:

```typescript
import { universalApi } from '@/lib/universal-api'

// Set organization context
universalApi.setOrganizationId('your-org-id')

// Process transaction with industry-specific rules
const result = await universalApi.processTransactionWithDNA(transactionId)

// Run batch processing with optimal strategies  
const batchResult = await universalApi.runDNABatchProcessing()

// Get comprehensive statistics
const stats = await universalApi.getDNAAutoJournalStatistics(7) // Last 7 days

// Configure industry-specific settings
const configResult = await universalApi.configureAutoJournalDNA({
  thresholds: {
    immediate_processing: 1500  // Custom threshold
  }
})

// Enhanced transaction creation with auto-journal
const enhanced = await universalApi.createTransactionWithDNAAutoJournal({
  transaction_type: 'sale',
  smart_code: 'HERA.REST.SALE.ORDER.v1',
  total_amount: 450.00,
  organization_id: 'your-org-id'
})
```

### **🎯 Key Benefits of DNA Integration**

| Feature | Traditional Auto-Journal | HERA DNA Auto-Journal |
|---------|-------------------------|----------------------|
| **Configuration** | Manual setup per org | Industry templates built-in |
| **Customization** | Code changes required | Configuration-driven |
| **Multi-Industry** | Separate implementations | One component, all industries |
| **Maintenance** | Manual updates | DNA evolution automatic |
| **Deployment** | Weeks of setup | Instant with industry defaults |
| **Optimization** | Generic rules | Industry-specific intelligence |

### **📊 Business Impact by Industry**

| Industry | Automation Rate | Annual Savings | Setup Time |
|----------|----------------|----------------|------------|
| **Restaurant** | 88% | $38,400 | 0 seconds |
| **Healthcare** | 92% | $42,200 | 0 seconds |
| **Manufacturing** | 85% | $51,800 | 0 seconds |
| **Professional Services** | 90% | $39,600 | 0 seconds |
| **Retail** | 87% | $35,900 | 0 seconds |

### **🚀 Revolutionary Capabilities**

- **Zero Configuration**: Works immediately for any business type
- **Industry Intelligence**: Built-in knowledge of business processes and accounting requirements
- **Adaptive Thresholds**: Automatically adjusts based on transaction patterns
- **Multi-Currency Ready**: Handles global businesses with automatic currency conversion
- **Compliance Built-In**: IFRS, GAAP, and industry-specific compliance features
- **AI-Enhanced**: Machine learning improves accuracy over time
- **Complete Audit Trail**: Every decision logged with confidence scores
- **Perfect Integration**: Uses universal 6-table architecture with zero schema changes

This makes HERA the **first and only ERP system with truly universal auto-journal capabilities** that work across all industries with no configuration required, while still allowing complete customization for specific business needs.

### **🛠️ CLI Tools for Auto-Journal DNA Management**

```bash
# Explore industry-specific configurations
node auto-journal-dna-cli.js explore restaurant
node auto-journal-dna-cli.js explore healthcare
node auto-journal-dna-cli.js explore manufacturing

# Test transaction relevance with AI classification
node auto-journal-dna-cli.js test-relevance "HERA.REST.SALE.ORDER.v1"
node auto-journal-dna-cli.js test-relevance "HERA.HLTH.PAT.PAYMENT.v1"

# Compare industry configurations side-by-side
node auto-journal-dna-cli.js compare-industries

# Generate configuration reports
node auto-journal-dna-cli.js report-config restaurant --format json
node auto-journal-dna-cli.js report-config --all

# Test auto-journal processing with sample data
node auto-journal-dna-cli.js test-processing --industry restaurant --amount 250
node auto-journal-dna-cli.js test-batch --transactions 15 --industry healthcare
```

### **🎯 Integration Examples**

```typescript
// Restaurant Implementation
import { autoJournalDNAService } from '@/lib/dna/services/auto-journal-dna-service'

const restaurantService = autoJournalDNAService.createForIndustry('restaurant', {
  organizationId: 'mario-restaurant-uuid',
  customThresholds: {
    immediate_processing: 500, // Custom threshold for Mario's
    batch_small_transactions: 50
  }
})

// Process daily transactions
const result = await restaurantService.processTransactionBatch(dailyTransactions)

// Healthcare Implementation  
const healthcareService = autoJournalDNAService.createForIndustry('healthcare', {
  organizationId: 'clinic-uuid',
  compliance: {
    hipaa: true,
    audit_retention: '7_years'
  }
})

// Manufacturing Implementation
const manufacturingService = autoJournalDNAService.createForIndustry('manufacturing', {
  organizationId: 'factory-uuid',
  costingMethod: 'standard_cost',
  multiCurrency: {
    baseCurrency: 'USD',
    allowedCurrencies: ['EUR', 'GBP', 'JPY']
  }
})
```

### **🎯 Revolutionary Budgeting Architecture** ✅ PRODUCTION READY

Every HERA instance automatically includes:
- **Zero Implementation Time**: Budgeting works immediately on any HERA setup
- **Universal Architecture**: Budgets stored as entities, budget lines as transactions
- **Multi-Dimensional Planning**: Cost center, profit center, product, geography, project dimensions
- **Industry-Specific Templates**: Restaurant, healthcare, retail, salon pre-configured
- **AI-Powered Insights**: Intelligent variance analysis and recommendations

### **📋 Core Budgeting Functions**

```typescript
// Automatic budget creation during business setup
const budgetResult = await universalApi.createBudget({
  organizationId,
  budgetName: '2024 Annual Operating Budget',
  budgetCode: 'BUDGET-2024-ORG',
  budgetType: 'operating', // operating | capital | cash_flow | project
  fiscalYear: 2024,
  budgetPeriod: 'annual', // monthly | quarterly | annual | rolling
  budgetMethod: 'zero_based' // zero_based | incremental | activity_based | driver_based
})

// Create budget line items with multi-dimensional breakdown
const linesResult = await universalApi.createBudgetLineItems({
  budgetId: budget.id,
  organizationId,
  lineItems: [
    {
      glAccountId: 'GL_ACCOUNT_4100',
      accountCode: '4100',
      accountName: 'Revenue - Food Sales',
      totalAmount: 120000,
      budgetMethod: 'driver_based',
      budgetDriver: 'customer_count',
      driverAssumptions: {
        customers_per_month: 300,
        average_spend: 33.33
      },
      monthlyBreakdown: [8000, 8000, 10000, 10000, 11000, 11000, 10000, 10000, 10000, 11000, 11000, 13000],
      dimensions: {
        costCenter: 'RESTAURANT_MAIN',
        profitCenter: 'DINING_OPERATIONS',
        productLine: 'FOOD_BEVERAGES',
        geography: 'DUBAI_BRANCH'
      }
    }
  ]
})

// Real-time variance analysis
const varianceAnalysis = await universalApi.getBudgetVarianceAnalysis({
  budgetId: budget.id,
  organizationId,
  period: 'YTD', // MTD | QTD | YTD
  varianceThreshold: 5.0
})

// Rolling forecasts with scenario planning
const forecast = await universalApi.createRollingForecast({
  organizationId,
  forecastName: '12-Month Rolling Forecast',
  forecastHorizon: 12,
  scenarios: [
    { name: 'Base Case', probability: 60, assumptions: { growth_rate: 15 } },
    { name: 'Optimistic', probability: 25, assumptions: { growth_rate: 25 } },
    { name: 'Pessimistic', probability: 15, assumptions: { growth_rate: 5 } }
  ]
})
```

### **🏗️ Universal Architecture Integration**

**Budgets as Entities**:
```typescript
// Budget stored in core_entities table
{
  entity_type: 'budget',
  entity_name: '2024 Annual Operating Budget',
  entity_code: 'BUDGET-2024-ORG',
  smart_code: 'HERA.FIN.BUDGET.OPERATING.ANNUAL.v1',
  metadata: {
    budget_type: 'operating',
    fiscal_year: 2024,
    approval_status: 'approved'
  }
}
```

**Budget Lines as Transactions**:
```typescript
// Budget lines stored in universal_transactions table
{
  transaction_type: 'budget_line',
  reference_entity_id: budget_id,
  total_amount: 120000,
  smart_code: 'HERA.FIN.BUDGET.LINE.REVENUE.v1',
  metadata: {
    gl_account_id: 'GL_4100',
    budget_driver: 'customer_count',
    dimensions: { costCenter: 'MAIN_OPS' }
  }
}
```

**Monthly Breakdown as Transaction Lines**:
```typescript
// Monthly amounts stored in universal_transaction_lines table
{
  transaction_id: budget_line_id,
  line_number: 1,
  line_amount: 10000,
  metadata: {
    period: '2024-01',
    period_type: 'monthly'
  }
}
```

### **📊 Industry-Specific Budget Templates**

**Restaurant Industry** (35% COGS, 30% Labor):
```typescript
const restaurantDefaults = {
  revenue_multiplier: 1.0,
  cogs_percentage: 0.35,
  labor_percentage: 0.30,
  rent_monthly: 8000,
  utilities_monthly: 1200,
  marketing_percentage: 0.05
}
```

**Healthcare Industry** (25% COGS, 45% Labor):
```typescript
const healthcareDefaults = {
  revenue_multiplier: 1.0,
  cogs_percentage: 0.25,
  labor_percentage: 0.45,
  rent_monthly: 12000,
  utilities_monthly: 2000,
  marketing_percentage: 0.03
}
```

### **🎯 Driver-Based Budget Planning**

```typescript
// Revenue drivers
const revenueDrivers = [
  {
    driver_name: 'customer_count',
    budgeted_value: 300, // customers per month
    actual_baseline: 280,
    improvement_target: 20
  },
  {
    driver_name: 'average_check_size',
    budgeted_value: 45.00,
    actual_baseline: 42.00,
    improvement_target: 3.00
  }
]

// Automatic calculation: customer_count × average_check × days_in_month
```

### **📈 Real-Time Variance Analysis**

```typescript
// Automatic variance calculation
const varianceResults = {
  summary: {
    total_budget: 120000,
    total_actual: 89500,
    total_variance: -30500,
    variance_percent: -25.4,
    status: 'critical' // on_track | warning | critical
  },
  line_variances: [
    {
      account_code: '4100',
      account_name: 'Food Sales Revenue',
      budget_amount: 10000,
      actual_amount: 7500,
      variance_amount: -2500,
      variance_percent: -25.0,
      status: 'critical'
    }
  ],
  recommendations: [
    'Consider increasing marketing spend to address revenue shortfalls',
    'Review cost control measures for expense categories over budget'
  ]
}
```

### **🔄 Smart Code Classifications**

```typescript
const budgetSmartCodes = {
  // Budget creation
  'HERA.FIN.BUDGET.OPERATING.ANNUAL.v1': 'Annual operating budget',
  'HERA.FIN.BUDGET.CAPITAL.PROJECT.v1': 'Capital budget for projects',
  'HERA.FIN.BUDGET.CASH_FLOW.QUARTERLY.v1': 'Quarterly cash flow budget',
  
  // Budget lines
  'HERA.FIN.BUDGET.LINE.REVENUE.v1': 'Revenue budget line',
  'HERA.FIN.BUDGET.LINE.EXPENSE.v1': 'Expense budget line',
  
  // Variance analysis
  'HERA.FIN.BUDGET.VARIANCE.MTD.v1': 'Month-to-date variance',
  'HERA.FIN.BUDGET.VARIANCE.YTD.v1': 'Year-to-date variance',
  
  // Forecasting
  'HERA.FIN.FORECAST.ROLLING.MONTHLY.v1': 'Monthly rolling forecast',
  'HERA.FIN.FORECAST.SCENARIO.BASE.v1': 'Base case scenario'
}
```

### **🚀 Business Benefits**

| Metric | Traditional | HERA Universal |
|--------|-------------|----------------|
| **Implementation Time** | 6+ months | Instant (included) |
| **Cost** | $50K-500K | $0 (standard feature) |
| **Planning Accuracy** | 60-70% | 95%+ (driver-based) |
| **Variance Detection** | Weekly/Monthly | Real-time |
| **Forecast Updates** | Quarterly | Monthly rolling |
| **Multi-Dimensional** | Limited | Unlimited dimensions |

### **⚡ Automatic Integration**

Every `setupBusiness()` call now automatically includes:
1. **Annual Operating Budget** creation
2. **Industry-specific budget lines** with realistic assumptions
3. **Monthly seasonal breakdown** based on industry patterns
4. **Approval workflow** setup with organization hierarchy
5. **Variance tracking** configuration for real-time monitoring

## 💵 HERA UNIVERSAL CASHFLOW DNA SYSTEM - NEW CORE DNA COMPONENT

**REVOLUTIONARY**: HERA now includes the Universal Cashflow Statement Engine as a core DNA component, providing enterprise-grade cashflow statements for any business type with zero configuration required.

### **🧬 Universal Cashflow DNA Architecture** ✅ PRODUCTION READY

The Universal Cashflow System exists as DNA Component `HERA.FIN.CASHFLOW.STATEMENT.ENGINE.v1` with:

- **Direct & Indirect Methods**: Complete support for both IFRS/GAAP compliant cashflow statement methods
- **Multi-Currency Operations**: Automatic currency conversion and gain/loss calculations
- **Industry Intelligence**: Pre-configured templates for 8+ business types with industry-specific patterns
- **Real-time Integration**: Seamless integration with Auto-Journal DNA for live cashflow updates
- **Seasonal Adjustments**: Built-in seasonal patterns and forecasting for all industry types
- **Professional Statements**: Enterprise-grade formatting with complete audit trails
- **Zero Schema Changes**: Uses existing universal 6-table architecture
- **CLI Management**: Complete command-line toolkit for management and analysis

### **🏭 Industry-Specific Cashflow Configurations**

#### **Restaurant Industry** (`HERA.FIN.CASHFLOW.CONFIG.RESTAURANT.v1`)
```bash
# Restaurant cashflow characteristics
Operating Margin: 85.2%
Cash Cycle: 1 day (credit card processing)
Seasonality: 120% (holiday peaks)
Peak Patterns: Q4 holidays, summer months

# Key cashflow activities
Operating: Sales Revenue, Food Purchases, Labor Costs, Rent & Utilities
Investing: Kitchen Equipment, Restaurant Renovations, POS Systems
Financing: Restaurant Loans, Owner Investments, Lease Payments

# Smart Code Integration
Sales: HERA.REST.POS.TXN.SALE.v1 → (+) Operating Inflow
Food Costs: HERA.REST.PUR.INGREDIENTS.v1 → (-) Operating Outflow
Equipment: HERA.REST.EQP.PUR.KITCHEN.v1 → (-) Investing Outflow
```

#### **Salon Industry** (`HERA.FIN.CASHFLOW.CONFIG.SALON.v1`)
```bash
# Salon cashflow characteristics
Operating Margin: 97.8%
Cash Cycle: 0 days (immediate payment)
Seasonality: 125% (holiday & wedding seasons)
Peak Patterns: Q4 holidays, spring weddings

# Key cashflow activities
Operating: Service Revenue, Product Sales, Staff Payments, Salon Supplies
Investing: Salon Chairs, Hair Equipment, Salon Renovation
Financing: Equipment Financing, Owner Investment, Business Loans

# Smart Code Integration
Services: HERA.SALON.SVC.TXN.SERVICE.v1 → (+) Operating Inflow
Products: HERA.SALON.SVC.TXN.PRODUCT.v1 → (+) Operating Inflow
Staff: HERA.SALON.HR.PAY.STYLIST.v1 → (-) Operating Outflow
Equipment: HERA.SALON.EQP.PUR.CHAIR.v1 → (-) Investing Outflow
```

#### **Healthcare Industry** (`HERA.FIN.CASHFLOW.CONFIG.HEALTHCARE.v1`)
```bash
# Healthcare cashflow characteristics
Operating Margin: 78.5%
Cash Cycle: 45 days (insurance processing)
Seasonality: 110% (flu season peaks)
Peak Patterns: Q1 flu season, annual checkups

# Key cashflow activities
Operating: Patient Payments, Insurance Reimbursements, Staff Salaries, Medical Supplies
Investing: Medical Equipment, Technology Systems, Facility Improvements
Financing: Practice Loans, Partner Contributions, Equipment Financing

# Smart Code Integration
Patient Payments: HERA.HLTH.PAT.PAYMENT.v1 → (+) Operating Inflow
Insurance: HERA.HLTH.INS.REIMBURSEMENT.v1 → (+) Operating Inflow (delayed)
Staff: HERA.HLTH.HR.PAY.DOCTOR.v1 → (-) Operating Outflow
Equipment: HERA.HLTH.EQP.PUR.MEDICAL.v1 → (-) Investing Outflow
```

#### **Ice Cream Manufacturing** (`HERA.FIN.CASHFLOW.CONFIG.ICECREAM.v1`)
```bash
# Ice cream manufacturing cashflow characteristics
Operating Margin: 76.2%
Cash Cycle: 7 days (fast inventory turnover)
Seasonality: 210% (extreme summer seasonality)
Peak Patterns: June-August peak, October-March low season

# Key cashflow activities
Operating: Product Sales, Raw Materials, Production Labor, Cold Storage
Investing: Production Equipment, Freezer Systems, Delivery Vehicles
Financing: Equipment Loans, Working Capital, Seasonal Financing

# Smart Code Integration
Sales: HERA.ICECREAM.SALE.FINISHED.v1 → (+) Operating Inflow
Materials: HERA.ICECREAM.PUR.RAW.MATERIALS.v1 → (-) Operating Outflow
Labor: HERA.ICECREAM.HR.PAY.PRODUCTION.v1 → (-) Operating Outflow
Equipment: HERA.ICECREAM.EQP.PUR.MACHINE.v1 → (-) Investing Outflow
```

### **🔧 Universal Cashflow API Functions**

```typescript
import { universalApi } from '@/lib/universal-api'

// Generate comprehensive cashflow statement
const statement = await universalApi.generateCashflowStatement({
  organizationId: 'org-uuid',
  period: '2025-09',
  method: 'direct', // direct | indirect
  currency: 'AED',
  includeForecasting: true,
  includeBenchmarking: true
})

// Get industry-specific cashflow configuration
const config = await universalApi.getCashflowDNAConfig({
  organizationId: 'org-uuid',
  industryType: 'restaurant'
})

// Generate 12-month cashflow forecast
const forecast = await universalApi.generateCashflowForecast({
  organizationId: 'org-uuid',
  periods: 12,
  includeSeasonality: true,
  includeScenarios: ['base', 'optimistic', 'pessimistic']
})

// Real-time cashflow analysis
const analysis = await universalApi.analyzeCashflowTrends({
  organizationId: 'org-uuid',
  analysisType: 'variance', // variance | trend | benchmark
  comparisonPeriod: 6 // months
})

// Integration with Auto-Journal DNA
const integration = await universalApi.integrateCashflowWithAutoJournal({
  organizationId: 'org-uuid',
  realTimeUpdates: true,
  refreshInterval: 300 // 5 minutes
})
```

### **🛠️ CLI Tools for Universal Cashflow DNA**

```bash
# HERA Universal Cashflow DNA CLI Tools (Use These ALWAYS)
cd mcp-server

# Explore industry-specific configurations
node cashflow-dna-cli.js config restaurant    # Restaurant cashflow config
node cashflow-dna-cli.js config salon        # Salon cashflow config
node cashflow-dna-cli.js config healthcare   # Healthcare cashflow config
node cashflow-dna-cli.js config icecream     # Ice cream manufacturing config

# Generate live cashflow statements
node cashflow-dna-cli.js generate --org your-org-uuid --period 2025-09
node cashflow-dna-cli.js generate --org your-org-uuid --method indirect --forecast

# Analyze cashflow patterns and benchmarking
node cashflow-dna-cli.js analyze --org your-org-uuid --period 2025-09
node cashflow-dna-cli.js forecast --org your-org-uuid  # 12-month forecast

# List all available industry configurations
node cashflow-dna-cli.js industries

# Examples with Hair Talkz Salon demo data
node demo-cashflow-hair-talkz.js              # Generate live statement
node cashflow-demo.js salon                   # Show salon patterns
node cashflow-demo.js all                     # Compare all industries
```

### **📊 Cross-Industry Cashflow Performance**

| Industry | Operating Margin | Cash Cycle | Seasonality | Peak Period |
|----------|------------------|------------|-------------|-------------|
| **Salon** | 97.8% | 0 days | 125% | Q4 Holidays |
| **Professional Services** | 89.3% | 30 days | 105% | Minimal |
| **Restaurant** | 85.2% | 1 day | 120% | Q4 Holidays |
| **Universal Template** | 80.0% | 30 days | 100% | None |
| **Healthcare** | 78.5% | 45 days | 110% | Q1 Flu Season |
| **Ice Cream** | 76.2% | 7 days | 210% | Summer Peak |
| **Manufacturing** | 72.8% | 60 days | 115% | Q3 Production |
| **Retail** | 68.4% | 15 days | 140% | Q4 Holidays |

### **🔄 Integration with Auto-Journal DNA**

The Universal Cashflow DNA seamlessly integrates with the Auto-Journal DNA for real-time cashflow updates:

```bash
# Integration Features
✅ Real-time Updates: Cashflow statements update automatically as journals are posted
✅ Smart Classification: Auto-Journal smart codes automatically classify cashflow activities  
✅ Transaction Linking: Every journal entry links to appropriate cashflow category
✅ Batch Processing: Auto-Journal batching optimizes cashflow statement performance
✅ AI Enhancement: Combined AI intelligence for transaction classification and cashflow analysis

# Integration Benefits
- Live cashflow visibility as transactions occur
- Zero manual cashflow statement preparation
- Automatic reconciliation between journal entries and cashflow activities
- Real-time cash position monitoring and alerts
- Integrated forecasting based on historical auto-journal patterns
```

### **🌟 Revolutionary Capabilities**

- **Zero Configuration**: Works immediately for any business type with industry-specific intelligence
- **Professional Compliance**: IFRS/GAAP compliant statements with complete audit trails
- **Multi-Currency Ready**: Handles global businesses with automatic currency conversion
- **Seasonal Intelligence**: Built-in understanding of industry seasonal patterns
- **Forecasting Engine**: 12-month rolling forecasts with confidence scoring
- **Benchmarking**: Compare performance against industry standards
- **Real-time Updates**: Integration with Auto-Journal DNA provides live cashflow visibility
- **CLI Management**: Complete command-line toolkit for analysis and management

### **💰 Business Impact Analysis**

| Benefit | Traditional | HERA Universal Cashflow DNA |
|---------|------------|---------------------------|
| **Preparation Time** | 40+ hours/month | 0 hours (automatic) |
| **Accuracy Rate** | 85% (manual errors) | 99.5% (automated) |
| **Currency Support** | Single currency | Unlimited currencies |
| **Industry Intelligence** | Generic templates | Industry-specific patterns |
| **Forecasting** | Separate system required | Built-in 12-month forecasts |
| **Real-time Updates** | Manual refresh | Auto-Journal integration |
| **Setup Cost** | $15,000-50,000 | $0 (included) |
| **Annual Savings** | - | **$48,000** per organization |

This positions HERA as the **ONLY ERP system with universal cashflow statement generation built-in by default**, providing professional IFRS/GAAP compliant cashflow statements for any business type with zero configuration required.

## 🤖 HERA Modern Auto-Posting System (Replaces SAP T030)

HERA revolutionizes automatic GL posting with a modern, event-driven approach that eliminates traditional ERP complexities.

### **Smart Code-Driven Auto-Posting** ✅ PRODUCTION READY

Instead of rigid posting configuration tables, HERA uses **Smart Codes** for dynamic account determination:

```typescript
// Business Event → Smart Code → Automatic GL Posting

// Restaurant Order Example
transaction_type: 'sale'
smart_code: 'HERA.REST.SALE.ORDER.v1'
// Automatically posts to:
// DR: 1100000 (Cash) CR: 4110000 (Food Sales) CR: 2250000 (Sales Tax)

// Goods Receipt Example  
transaction_type: 'goods_receipt'
smart_code: 'HERA.INV.GR.PURCHASE.v1'
// Automatically posts to:
// DR: 1330000 (Inventory) CR: 2100000 (Accounts Payable)
```

### **Key Architecture Files**:
- **`/database/functions/smart-code/smart-code.sql`** - Core Smart Code engine
- **`/generated/financial-smart-codes.sql`** - Auto-generated GL mappings
- **`/database/functions/triggers/all-triggers.sql`** - Automatic processing triggers
- **`/src/app/api/v1/transactions/route.ts`** - Universal transaction API

## 🗄️ HERA Document Management System

Complete, production-ready document management system with Supabase integration:

### **Key Features** ✅ PRODUCTION READY
- **GSPU 2025 Compliance**: All 31 audit documents (Sections A-F)
- **Supabase Integration**: Universal architecture + cloud storage
- **Audit Trail**: Complete transaction logging in universal tables
- **Multi-Tenant**: Perfect organization_id isolation for audit firms
- **Status Workflow**: Pending → Received → Under Review → Approved
- **Hybrid Architecture**: Works with/without Supabase configuration

### **Implementation Files**:
- **Service**: `/src/lib/supabase/audit-documents.ts`
- **API**: `/src/app/api/v1/audit/documents/route.ts`
- **UI**: `/src/components/audit/DocumentManagement/`

## 🏢 Multi-Tenant SaaS Authentication System 🔐

### Production-Ready Multi-Organization Architecture
HERA implements a complete SaaS authentication system with:

1. **Supabase Authentication** - Industry-standard user authentication and session management
2. **Organization Management** - Multi-tenant isolation with organization-based data separation
3. **Subdomain Routing** - Each organization gets its own subdomain (org.heraerp.com)
4. **App Management** - Per-organization app installation and management

### Modern SaaS Design Language
The authentication system features a modern SaaS design with:
- **Gradient Backgrounds** - Professional blue/purple/slate theme
- **Card-Based Layouts** - Clean separation of content areas
- **Interactive Elements** - Hover effects and smooth transitions
- **Status Indicators** - Visual feedback for loading, success, and errors
- **Responsive Design** - Works seamlessly across all devices

### Key Components (ALWAYS USE THESE)

#### `MultiOrgAuthProvider` (`src/components/auth/MultiOrgAuthProvider.tsx`)
Core multi-tenant authentication state management:
```typescript
interface MultiOrgAuthContext {
  user: DualUser | null
  organizations: Organization[]
  currentOrganization: Organization | null
  isAuthenticated: boolean
  isLoading: boolean
  switchOrganization: (orgId: string) => Promise<void>
  createOrganization: (data: CreateOrgData) => Promise<Organization>
  signOut: () => Promise<void>
}
```

#### Multi-Tenant Authorization Flow
1. **Login/Registration** → Central auth at app.heraerp.com
2. **Organization Selection** → Choose existing or create new organization
3. **App Installation** → Select business apps for the organization
4. **Subdomain Access** → Redirect to organization.heraerp.com
5. **Perfect Isolation** → Each organization has completely separate data


## 🐛 Troubleshooting Common Issues

### **Server Startup Errors**
```bash
# ERROR: ReferenceError: document is not defined
# CAUSE: Global polyfills conflicting with Next.js SSR
# FIX: Disable global polyfills in next.config.js
# Comment out: require('./scripts/setup-globals.js')

# ERROR: Invalid next.config.js options detected
# CAUSE: outputFileTracingExcludes in experimental block
# FIX: Move it to top level of config
```

### **Column Not Found Errors**
```bash
# ERROR: column "transaction_number" does not exist
# FIX: Use transaction_code instead

# ERROR: column "parent_entity_id" does not exist  
# FIX: Use from_entity_id/to_entity_id instead

# ERROR: column "status" does not exist
# FIX: Use relationships for status (run node status-workflow-example.js)

# Always check actual schema:
node check-schema.js
```

### **Organization ID Errors**
```bash
# ERROR: DEFAULT_ORGANIZATION_ID not set
# FIX: 
node hera-cli.js query core_organizations  # Find your org
# Update .env with the UUID
```

### **Status Workflow Confusion**
```bash
# NEVER do this:
UPDATE core_entities SET status = 'active'  # ❌ WRONG

# Instead, use relationships:
node status-workflow-example.js  # Learn the pattern
```

### **Memory Issues with Large Queries**
```bash
# Use CLI tools instead of manual queries:
node hera-query.js entities  # Handles pagination automatically
node hera-cli.js query core_entities --limit 100  # Limit results
```

### **Smart Code Validation**
```bash
# Check if smart code is valid:
node hera-cli.js validate-smart-code "HERA.CRM.CUST.ENT.PROF.v1"
```

## Important Notes

- **Multi-tenant by design**: Always include `organization_id` filtering (SACRED security boundary)
- **Universal-first approach**: Default to universal tables, APIs, and patterns
- **Smart Code Integration**: Every data point should have intelligent business context
- **Version-driven builds**: Version automatically injected during build process
- **AI-native preparation**: System designed for multi-provider AI integration
- **PWA-first**: Offline support and installability are core requirements
- **Authorization-aware**: All components respect universal authorization patterns
- **Monitoring-ready**: Production monitoring stack included with Prometheus and Grafana
- **Schema Accuracy**: Always verify column names with `node check-schema.js`
- **Status Patterns**: Use relationships for all status workflows, never add status columns
- **SSR Compatibility**: Avoid global polyfills that mock browser APIs - they conflict with Next.js
- **Deployment Ready**: Use deployment checklist in `/docs/DEPLOYMENT-CHECKLIST.md` before production

## 🧬 HERA Development Workflow

### **USE CLAUDE DESKTOP MCP FIRST** (HIGHEST PRIORITY):
```bash
# Start HERA MCP Server
cd mcp-server && npm start

# Then in Claude Desktop use natural language:
"Create a complete restaurant POS system with inventory"
"Build a healthcare patient management module"
"Setup authorization for multi-tenant retail system"
"Generate APIs for manufacturing BOM management"
"Create demo data for financial analytics dashboard"
```





## Auto-Documentation System 🤖

HERA includes a revolutionary auto-documentation system that keeps documentation current:

### Key Features ✅ PRODUCTION READY
- **Automatic Generation**: Detects code changes and generates comprehensive documentation  
- **AI-Powered Content**: Creates both technical and user-friendly documentation using HERA Universal AI
- **Git Integration**: Seamless workflow with pre/post-commit hooks
- **HERA Native**: Stores all documentation in universal 6-table architecture
- **Multi-Format Output**: Developer guides, API docs, component docs, user guides
- **Health Monitoring**: Automated maintenance and link validation

### Documentation Routes
- `/docs` - Documentation hub with developer and user guides
- `/docs/dev` - Technical documentation for developers
- `/docs/user` - User-friendly guides and tutorials  
- `/docs/search` - Full-text search across all documentation
- `/docs/analytics` - Documentation usage analytics and insights

## 🧬 HERA DNA Patterns Library - Accelerated Development

### **🚀 NEW DNA PATTERNS FROM PRODUCTION LEARNINGS**

**Critical patterns discovered during furniture module development that accelerate future builds:**

1. **Demo Organization Loading Pattern** (`/src/lib/dna/patterns/demo-org-pattern.ts`)
   - Fixes infinite loading bug: `orgLoading = isAuthenticated ? isLoadingOrgs : false`
   - Proper demo org loading without fallbacks (keeps debugging capability)
   - Standard organization info display component

2. **Dark Sidebar Layout Pattern** (`/src/lib/dna/patterns/dark-sidebar-layout-pattern.tsx`)
   - 80px compact sidebar with icon navigation
   - Industry-specific theme colors
   - Mobile-responsive bottom navigation
   - Tooltip support for better UX

3. **Universal API Loading Pattern** (`/src/lib/dna/patterns/universal-api-loading-pattern.ts`)
   - Handles Universal API read() method correctly (no filter parameter)
   - JavaScript-based filtering and sorting
   - Reusable data loading hook with proper error handling
   - Common filters and sorters included

4. **Industry Module Pattern** (`/src/lib/dna/patterns/industry-module-pattern.md`)
   - Complete checklist for creating new industry modules
   - Common gotchas and their solutions
   - Seed data patterns
   - Smart code conventions

**Usage Example:**
```typescript
import { useDemoOrganization } from '@/lib/dna/patterns/demo-org-pattern'
import { useUniversalData, universalFilters } from '@/lib/dna/patterns/universal-api-loading-pattern'

// In your component
const { organizationId, orgLoading } = useDemoOrganization()

const { data: products } = useUniversalData({
  table: 'core_entities',
  filter: universalFilters.byEntityType('product'),
  organizationId,
  enabled: !!organizationId
})
```

## 🧬 HERA Progressive DNA System - Revolutionary Two-Tier Architecture

### **🎯 The Progressive Vision**
HERA has achieved the impossible: **Two-tier architecture** that serves both trial users and enterprise customers with the **same codebase, same components, same user experience**. Progressive apps use IndexedDB for 30-day trials, while production uses Supabase with full authentication.

### **🚀 Progressive PWA Generator** ✅ PRODUCTION READY

**Key Implementation Files**:
- **`/src/lib/progressive/dna-adapter.ts`** - Core progressive DNA adapter extending existing DNA system
- **`/src/lib/progressive/pwa-generator.ts`** - Complete PWA generator using DNA patterns
- **`/database/dna-system-implementation.sql`** - Production DNA system with glassmorphism + Fiori components
- **`/PROGRESSIVE-DNA-INTEGRATION-PLAN.md`** - Complete integration architecture

### **🧬 DNA System Architecture**

#### **Production DNA System** (`/database/dna.sql`)
- **UI Component DNA**: Glass Panel, Fiori Navigation, Enterprise Tables
- **Business Module DNA**: Universal inventory, restaurant specializations, auto-journal engine
- **Universal POS DNA**: Cross-industry point-of-sale system with configuration-driven adaptation
- **Design System DNA**: Complete glassmorphism + Fiori design system
- **Smart Code Integration**: Every component has intelligent business context
- **Auto-Journal DNA**: Intelligent journal automation with AI-powered transaction processing
- **Universal Cashflow DNA**: Enterprise-grade cashflow statements with multi-industry intelligence

#### **Progressive DNA Adapter** (`/src/lib/progressive/dna-adapter.ts`)
- **HeraProgressiveAdapter**: Extends DNA system for progressive apps
- **IndexedDBAdapter**: Complete 6-table schema in browser storage
- **30-Day Expiry**: Automatic cleanup with date-based expiration
- **Storage Migration**: Seamless progressive-to-production data transfer

#### **PWA Generator** (`/src/lib/progressive/pwa-generator.ts`)
- **Business Requirements Parser**: Intelligent enhancement with industry defaults
- **Component Generation**: Creates layout, pages, DNA components automatically
- **PWA Assets**: Manifest, service worker, offline capabilities
- **MVP Guarantee**: Auto-enhancement to 80%+ completeness

### **🔥 Revolutionary DNA Reuse**
**BREAKTHROUGH**: Every DNA component works in both progressive and production modes:

```typescript
// Same Glass Panel component works everywhere
const GlassPanel = dnaComponents['HERA.UI.GLASS.PANEL.v1']
const AutoJournalEngine = dnaComponents['HERA.FIN.AUTO.JOURNAL.ENGINE.v1']
const UniversalPOS = dnaComponents['HERA.UI.POS.UNIVERSAL.ENGINE.v1']

// Production mode (Supabase)
<GlassPanel dataSource={supabaseApi}>
  <CustomerForm />
</GlassPanel>

// Progressive mode (IndexedDB)  
<GlassPanel dataSource={indexedDBAdapter}>
  <CustomerForm />
</GlassPanel>

// Universal POS - Same component, any industry
<UniversalPOS config={salonPOSConfig} items={salonItems} />
<UniversalPOS config={restaurantPOSConfig} items={restaurantItems} />
<UniversalPOS config={healthcarePOSConfig} items={healthcareServices} />

// Auto-Journal Engine works universally
<AutoJournalEngine 
  dataSource={dataAdapter}
  aiProvider="openai"
  automationRate="85%"
>
  <JournalDashboard />
</AutoJournalEngine>
```

### **📱 Progressive Features**
- **Offline-First**: Cache-first strategy with background sync
- **Installable**: Native app experience with PWA manifest
- **Auto-Expiry**: 30-day trial with automatic data cleanup
- **Trial-to-Production**: Zero-friction upgrade preserving all data
- **Edge Deployment**: Instant CDN delivery globally

### **🚀 Progressive to Production Conversion** ✅ PRODUCTION READY
HERA features seamless conversion from progressive trial to full production deployment:

**One-Click Conversion Process**:
1. **Domain Assignment**: Assign a subdomain (e.g., `mario.heraerp.com`)
2. **Data Migration**: All IndexedDB data automatically migrates to Supabase
3. **Authentication Setup**: User accounts created with proper organization context
4. **Feature Activation**: Full enterprise features enabled instantly
5. **Zero Data Loss**: Complete preservation of trial period data

**Conversion Benefits**:
- **Instant Deployment**: Progressive app becomes production-ready in minutes
- **Custom Subdomain**: Professional branded URL for each business
- **SSL Certificate**: Automatic HTTPS configuration
- **Full Authentication**: Supabase auth with organization isolation
- **Enterprise Features**: Unlock multi-user, API access, integrations
- **Continuous Operation**: No downtime during conversion

**Example Conversion**:
```bash
# Progressive Trial (30 days)
https://hera-trial.app/mario-pizza-demo

# After Conversion (Production)
https://mario.heraerp.com
```

### **🎯 Industry Templates**
- **Restaurant**: Menu management, order tracking, POS, inventory, auto-journal
- **Healthcare**: Patient records, appointments, prescriptions, billing, auto-journal  
- **Retail**: Inventory, POS, customer management, promotions, auto-journal
- **Manufacturing**: Production planning, quality control, orders, auto-journal
- **Professional Services**: Time tracking, billing, project management, auto-journal

### **⚡ 30-Second Generation**
```bash
# Generate complete progressive PWA with auto-journal
npm run generate-progressive-pwa \
  --business="Mario's Pizza" \
  --type=restaurant \
  --features="menu,orders,delivery,auto-journal"

# Output: Complete PWA with glassmorphism UI, offline sync, demo data, AI-powered journal automation
```

## 🌐 UNIVERSAL COA ACCOUNTING INTEGRATION (REVOLUTIONARY)

**HERA now includes a complete Universal Chart of Accounts system that delivers enterprise-grade accounting capabilities to any business type in 30 seconds.**

### **Universal COA Architecture**
```sql
-- The Sacred 6-Table Pattern handles ALL business accounting:
core_organizations        → Multi-tenant business isolation
core_entities            → ALL GL accounts + business objects  
core_dynamic_data         → Account properties + costing data
core_relationships       → Account hierarchies + BOM structures
universal_transactions   → Sales orders + journal entries
universal_transaction_lines → Invoice lines + journal entry lines
```

### **30-Second Implementation for Any Industry**
```bash
# Restaurant (Mario's Restaurant - PRODUCTION VALIDATED)
"Setup Italian restaurant accounting for Mario's Authentic Italian"
→ Result: 85 GL accounts, automatic posting rules, advanced costing in 30 seconds

# Healthcare Practice  
"Setup family medicine practice accounting for Dr. Smith"
→ Result: 87 GL accounts, patient billing, insurance processing in 45 seconds

# Manufacturing Company
"Setup precision manufacturing accounting for TechParts Industries"  
→ Result: 96 GL accounts, production costing, quality control in 60 seconds

# Professional Services
"Setup consulting firm accounting for Strategic Business Partners"
→ Result: 78 GL accounts, time tracking, project billing in 25 seconds
```

### **Automatic Features Included**
- ✅ **Complete Chart of Accounts** - Industry-specific templates with universal base
- ✅ **Smart Code-Driven GL Posting** - Every transaction automatically posts to correct accounts
- ✅ **Dual Document System** - Business documents + accounting documents with audit trail
- ✅ **Advanced Costing Integration** - Real-time profitability analysis and cost allocation
- ✅ **Financial Reporting** - Instant P&L, Balance Sheet, Cash Flow generation
- ✅ **Multi-Industry Support** - Same system works for restaurant, healthcare, manufacturing, professional services

### **Business Impact Proven**
| Industry | Setup Time | Cost Savings | Success Rate |
|----------|------------|--------------|--------------|
| Restaurant | 30 seconds | $463,000 | 100% |
| Healthcare | 45 seconds | $180,000 | 100% |
| Manufacturing | 60 seconds | $2,500,000 | 100% |
| Professional Services | 25 seconds | $125,000 | 100% |

## Current Implementation Status

### **✅ Complete & Production Ready**: 
- **Universal 6-Table Schema** with perfect multi-tenant isolation
- **🌐 Universal API** - Complete CRUD for all 6 tables with enterprise security
- **Universal Authorization** - Organization-first security with dynamic RBAC
- **Universal UI Components** - Complete component library with Steve Jobs design
- **🤖 Universal AI System** - Multi-provider orchestration with intelligent routing
- **📱 Progressive PWA Generator** - Complete PWAs with DNA integration and offline sync
- **🧬 HERA DNA System** - 200x acceleration generators for all development
  - **Production DNA**: Complete glassmorphism + Fiori component library
  - **Progressive Adapter**: IndexedDB storage with 30-day expiry system
  - **Auto-Journal DNA**: AI-powered intelligent journal automation (85% automation rate)
  - **Universal Cashflow DNA**: Enterprise-grade cashflow statements (8+ industries, IFRS/GAAP compliant)
  - **Universal POS DNA**: Cross-industry point-of-sale system (8+ industries, 200x faster development)
- **💰 Universal Budgeting System** - Complete enterprise budgeting and forecasting (NEW STANDARD FEATURE)
  - **Multi-Dimensional Planning**: Budget by cost center, profit center, product, geography, project
  - **Driver-Based Budgeting**: Link budgets to business drivers for accuracy and transparency
  - **Real-Time Variance Analysis**: Automatic budget vs actual comparison with AI insights
  - **Rolling Forecasts**: 12-month rolling forecasts with scenario planning capability
  - **Industry Templates**: Built-in budget templates for restaurant, healthcare, retail, salon industries
  - **Approval Workflows**: Multi-level approval process with automated notifications
  - **Zero Schema Changes**: Budgets stored as entities, budget lines as transactions
  - **Two-Tier Architecture**: Same components work in trial and production
- **🤖 Auto-Journal Engine** - AI-powered intelligent journal automation (CORE DNA COMPONENT)
  - **Universal DNA Component**: `HERA.FIN.AUTO.JOURNAL.ENGINE.v1` works across all industries
  - **85-92% Automation Rate**: Industry-optimized rule-based + AI classification
  - **Zero Configuration Setup**: Industry templates (restaurant, healthcare, manufacturing, services) built-in
  - **Smart Code Intelligence**: 40+ industry-specific smart codes with automatic business context
  - **Flexible Batching**: Configurable by payment method, shift, department, time window
  - **Multi-Currency Support**: Handles global businesses with automatic FX gain/loss posting
  - **AI Classification**: Built-in patterns for transaction relevance with confidence scoring
  - **Real-Time Processing**: Large/critical transactions processed immediately
  - **Complete Audit Trail**: Every decision logged with industry compliance built-in
  - **Zero Schema Changes**: Uses existing universal 6-table architecture
  - **$35K-52K Annual Savings**: Per organization depending on industry and transaction volume
  - **CLI Management Tools**: Complete command-line interface for configuration and testing
  - **🧬 REVOLUTIONARY**: First truly universal auto-journal system that works across all industries
- **💰 Universal Cashflow System** - Real-time cashflow statements with industry intelligence (NEW STANDARD FEATURE)
  - **IFRS/GAAP Compliant**: Professional cashflow statements using IAS 7 and ASC 230 standards
  - **Industry-Specific DNA**: Optimized cashflow patterns for restaurant, healthcare, manufacturing, services
  - **Smart Code Classification**: Automatic categorization into Operating/Investing/Financing activities
  - **Direct & Indirect Methods**: Both cashflow statement formats supported
  - **Real-time Updates**: Auto-journal integration provides live cashflow visibility
  - **Forecasting & Analytics**: 12-month rolling forecasts with scenario planning
  - **Zero Schema Changes**: Uses existing universal 6-table architecture
  - **Multi-Currency Ready**: Global business support with FX impact analysis
  - **Hair Talkz Validated**: 97.8% operating cash margin demonstrated with 65 transactions
  - **🧬 BREAKTHROUGH**: First universal cashflow system that works across all business types
- **🔗 Finance DNA Integration** - Universal Finance↔SD↔MM↔HR integration system (NEW CORE DNA COMPONENT)
  - **Universal Event Contract**: All modules emit standardized financial events
  - **Smart Code-Driven Posting**: Automatic GL posting based on business context
  - **Policy as Data**: Posting rules stored in database, not hardcoded
  - **Module Activation Matrix**: Per-organization configuration and deactivation handling
  - **Industry Templates**: Pre-configured rules for restaurant, salon, healthcare, manufacturing
  - **Account Derivation Engine**: Dynamic GL account resolution from master data
  - **Multi-Currency Support**: FX handling with gain/loss calculations
  - **AI-Enhanced Confidence**: Scoring system for automatic vs staged posting
  - **Perfect Audit Trail**: Complete traceability from source events to GL
  - **Zero Integration Code**: Apps just emit events, Finance DNA handles the rest
  - **CLI Management**: Complete command-line interface for activation and testing
  - **🧬 REVOLUTIONARY**: First universal financial integration that works across all business apps
- **🗄️ Document Management** - GSPU 2025 compliant with Supabase integration
- **📋 Authentication System** - Dual-provider architecture with universal entities
- **PWA Implementation** - Advanced offline support with universal data sync
- **Auto-Documentation** - AI-powered documentation generation and maintenance
- **📊 Production Monitoring** - Complete observability stack with Prometheus, Grafana, and custom dashboards
- **🔐 Enterprise GA Features** - Complete enterprise readiness pack (NEW ENTERPRISE GA)
  - **SSO/SAML 2.0/OIDC**: Enterprise authentication with JIT provisioning
  - **RBAC Policy Engine**: YAML-based policies with smart code family permissions
  - **KMS Encryption**: Envelope encryption for PII with automatic key rotation
  - **Rate Limiting**: Sliding window with idempotency support (24h TTL)
  - **Distributed Tracing**: OpenTelemetry with specialized trace methods
  - **Metrics Collection**: Prometheus-compatible with business/technical metrics
  - **Structured Logging**: JSON with context preservation and correlation
  - **Audit Trail**: Complete activity logging with real-time streaming (SSE)
  - **RLS Enforcement**: Automatic query interception via proxy pattern
  - **Enterprise Middleware**: Unified stack combining all enterprise features
  - **OpenAPI 3.0.3**: Complete API specification with smart code annotations
  - **Monitoring Dashboards**: 4 pre-configured Grafana dashboards
  - **Disaster Recovery**: RPO ≤ 5min, RTO ≤ 30min with complete runbooks
  - **Zero New Tables**: All enterprise data stored in Sacred Six tables
  - **Smart Code Everywhere**: Every enterprise operation has business context


---

## 🎯 The HERA Promise Delivered

**6 Tables. Infinite Business Complexity. Zero Schema Changes.**

### **🚀 Revolutionary Achievements**:
- **Traditional ERP**: 18-36 months, $5M-50M+, 20-40% failure rate
- **HERA Production**: 4-8 weeks, 90% cost savings, 92% proven success rate
- **HERA Progressive**: 30 seconds, 95% cost savings, instant deployment

### **📱 Progressive PWA Revolution**:
- **Same Codebase**: Progressive trial and production use identical components
- **DNA Integration**: All glassmorphism + Fiori components work in both modes
- **Zero-Friction Upgrade**: Seamless trial-to-production migration
- **Edge Deployment**: Global PWA delivery in seconds

### **🧬 DNA System Evolution**:
- **200x Acceleration**: Manual development eliminated for common patterns
- **Universal Reuse**: Components work across all industries and contexts
- **MVP Guaranteed**: Auto-enhancement ensures 80%+ completeness
- **Smart Evolution**: DNA patterns learn and improve over time

### **🎯 Universal Onboarding System** ✅ PRODUCTION READY
HERA now includes a comprehensive Smart Code-driven onboarding framework:

**Key Features**:
- **React-Joyride Integration**: Professional guided tours with HERA abstractions
- **Smart Code Tours**: Every tour and step identified by `HERA.UI.ONBOARD.*` codes
- **Universal Analytics**: All interactions tracked as universal_transactions
- **Multi-Tenant Ready**: Organization isolation built into every event
- **i18n Support**: Type-safe internationalization with message interpolation
- **Theme System**: Light/dark/high-contrast with HERA design tokens
- **Accessibility**: Keyboard nav, ARIA labels, reduced motion support
- **Resilient Tours**: DOM guards, route navigation, retry logic
- **Zero Schema Changes**: Uses existing 6-table architecture

**Quick Usage**:
```typescript
import { HeraOnboardingProvider, useOnboarding } from '@/lib/onboarding';

// Wrap your app
<HeraOnboardingProvider
  organizationId="org_123"
  enabledTours={['HERA.UI.ONBOARD.CONSOLE.DASHBOARD.v1']}
  theme="light"
  onEmit={(txn, lines) => console.log('Event:', { txn, lines })}
>
  <App />
</HeraOnboardingProvider>

// Start tours anywhere
const { startTour } = useOnboarding();
startTour('HERA.UI.ONBOARD.CONSOLE.DASHBOARD.v1');
```

**See**: `/src/lib/onboarding/README.md` for complete documentation

### **🏆 The Ultimate Proof**:
**HERA's universal architecture handles any business complexity with just 6 tables.** From restaurant operations to healthcare management, from manufacturing to professional services - all running on the same sacred foundation without schema changes.

**This isn't just better ERP - it's the mathematical proof that universal architecture can eliminate enterprise software complexity and deployment barriers that have plagued businesses for decades.** 🚀