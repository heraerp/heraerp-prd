# 🏗️ Claude CLI Enhanced Prompt: HERA Universal ERP Implementation
## 👨‍💼 CTO Approved - Production Ready Implementation Guide

---

## 🎯 **CRITICAL CONTEXT LOADING PROTOCOL**

### **STEP 1: Initialize HERA CLI Environment**
```bash
# Create exact project structure (COPY-PASTE READY)
mkdir hera-cli-project && cd hera-cli-project
mkdir -p {docs,schemas,components,modules,validation,scripts,examples,tests}

# Download/create required context files
curl -o docs/HERA_CONTEXT.md [HERA_CONTEXT_URL]
curl -o schemas/hera-schema.sql [SCHEMA_URL]
curl -o validation/hera-compliance.json [VALIDATION_URL]
```

### **STEP 2: Load Complete HERA Context**
```bash
# Every Claude CLI session MUST start with these exact commands:
claude --file docs/HERA_CONTEXT.md --file schemas/hera-schema.sql --file validation/hera-compliance.json "Load complete HERA context. Confirm understanding of 6-table architecture, sacred rules, and current build status."
```

---

## 🏗️ **COMPLETE ARCHITECTURE CONTEXT**

### **HERA Universal Foundation (APPROVED & PRODUCTION READY):**

#### **Sacred 6-Table Architecture:**
1. **`core_organizations`** - WHO (Multi-tenant isolation with sacred organization_id)
2. **`core_entities`** - WHAT (All business objects: customers, products, employees, etc.)
3. **`core_dynamic_data`** - HOW (Unlimited custom fields without schema changes)
4. **`core_relationships`** - WHY (Universal connections between any entities)
5. **`universal_transactions`** - WHEN (All business events: orders, invoices, tasks, etc.)
6. **`universal_transaction_lines`** - DETAILS (Complete line-item breakdown)

#### **SACRED RULES (NEVER VIOLATE - AUTO-VALIDATE):**
```typescript
// RULE 1: organization_id filtering on EVERY query
const SACRED_RULE_1 = "organization_id = current_setting('app.current_organization_id')";

// RULE 2: NEVER alter database schema
const SACRED_RULE_2 = "Use core_dynamic_data for ALL custom fields";

// RULE 3: AI intelligence built into core tables
const SACRED_RULE_3 = "No separate AI tables - use metadata.ai_insights";

// RULE 4: Universal patterns only
const SACRED_RULE_4 = "No business-specific tables ever";
```

### **Smart Coding System (75% Complete - PRIORITY COMPLETION):**
```typescript
// Universal Pattern Structure
interface SmartCode {
  pattern: "HERA.{DOMAIN}.{MODULE}.{TYPE}.{ACTION}.v{VERSION}";
  examples: {
    financial: "HERA.FIN.GL.TXN.JE.v1";        // General Ledger Journal Entry
    inventory: "HERA.INV.RCV.TXN.IN.v1";       // Inventory Receipt Transaction
    customer: "HERA.CRM.CUS.ENT.PROF.v1";      // Customer Profile Entity
    audit: "HERA.AUD.DOC.TXN.REQ.v1";          // Audit Document Requisition
    development: "HERA.DEV.TASK.TXN.FEAT.v1";  // Development Feature Task
  };
}
```

### **Current Build Status (Chief Architect + CTO Verified):**
- ✅ **Universal Tables (100%)** - Production-ready schema with 50+ indexes
- ✅ **Universal API (100%)** - Enterprise-grade REST with JWT, Redis, monitoring
- ✅ **Universal UI (100%)** - PWM-quality component library with animations
- 🔄 **Smart Coding (75%)** - Patterns defined, need completion
- 📋 **Business Modules (15%)** - Financial core started
- 🎯 **Industry Apps (0%)** - Ready for implementation

---

## 📁 **EXACT FILE STRUCTURE (COPY-PASTE READY)**

```
hera-cli-project/
├── docs/
│   ├── HERA_CONTEXT.md              # Complete architectural context
│   ├── HERA_PATTERNS.md             # Implementation patterns
│   ├── HERA_SMART_CODES.md          # Smart coding system
│   └── HERA_UI_STANDARDS.md         # PWM-quality UI guidelines
├── schemas/
│   ├── hera-schema.sql              # Complete 6-table schema
│   ├── typescript-types.ts          # Full type definitions
│   └── sample-data.sql              # Example organizations/entities
├── validation/
│   ├── hera-compliance.json         # Automated validation rules
│   ├── smart-code-validator.js      # Smart code format checker
│   └── organization-id-checker.js   # Multi-tenancy validator
├── components/
│   ├── UniversalTable.tsx           # Universal table component
│   ├── DynamicForm.tsx              # Dynamic form generator
│   ├── TaskDashboard.tsx            # Development dashboard
│   └── PWMTheme.ts                  # Professional theme system
├── modules/
│   ├── financial/                   # Financial module (GL/AR/AP)
│   ├── inventory/                   # Inventory management
│   ├── customer/                    # Customer relationship
│   └── audit/                       # Audit workflow system
├── scripts/
│   ├── init-hera-kb.js             # Initialize knowledge base
│   ├── validate-implementation.js   # HERA compliance checker
│   └── auto-document.js            # Self-documentation system
├── examples/
│   ├── restaurant-complete.ts       # Mario's restaurant POS
│   ├── audit-workflow.ts           # GSPU audit system
│   └── hera-builds-hera.ts         # Meta development example
├── tests/
│   ├── compliance/                  # HERA rule validation tests
│   ├── integration/                 # API integration tests
│   └── ui/                         # Component testing
└── configs/
    ├── smart-codes.json            # All smart code definitions
    ├── organizations.json          # Organization configurations
    └── claude-templates.json       # Command templates
```

---

## 🤖 **ENHANCED CLAUDE CLI COMMANDS (EXECUTABLE)**

### **Context Management Commands:**
```bash
# Initialize HERA development environment
claude hera-init \
  --project-name "hera-universal-erp" \
  --create-structure true \
  --download-schemas true \
  --setup-validation true \
  --init-knowledge-base true

# Load complete context for development session  
claude hera-context-load \
  --base-context docs/HERA_CONTEXT.md \
  --patterns docs/HERA_PATTERNS.md \
  --smart-codes docs/HERA_SMART_CODES.md \
  --ui-standards docs/HERA_UI_STANDARDS.md \
  --validate-loading true

# Validate context completeness
claude hera-validate-context \
  --check-architecture-understanding \
  --check-sacred-rules-knowledge \
  --check-smart-code-patterns \
  --check-ui-standards \
  --report-missing-context
```

### **Module Implementation Commands:**
```bash
# Implement Financial Core Module (EXACT COMMAND)
claude hera-implement-module financial-core \
  --smart-codes "HERA.FIN.GL.TXN.JE.v1,HERA.FIN.AR.TXN.INV.v1,HERA.FIN.AP.TXN.BILL.v1" \
  --organization-id "hera_software_inc" \
  --output-directory "./modules/financial" \
  --ui-theme "pwm-professional-dark" \
  --include-api-endpoints true \
  --include-ui-components true \
  --include-validation true \
  --auto-test true \
  --document-in-hera true \
  --validate-compliance true

# Expected Output Files:
# ✅ modules/financial/GeneralLedger.tsx
# ✅ modules/financial/AccountsReceivable.tsx  
# ✅ modules/financial/AccountsPayable.tsx
# ✅ modules/financial/api/financial-routes.ts
# ✅ modules/financial/types/financial-types.ts
# ✅ tests/financial/compliance.test.ts

# Implement Development Dashboard (Meta-System)
claude hera-implement-dashboard \
  --smart-code "HERA.DEV.DASH.UI.MAIN.v1" \
  --organization-id "hera_software_inc" \
  --features "git-integration,real-time-updates,task-tracking" \
  --ui-style "pwm-inspired-professional" \
  --output-file "./components/DevelopmentDashboard.tsx" \
  --validate-hera-compliance true

# Implement Audit Workflow System
claude hera-implement-audit-system \
  --reference-framework "GSPU-2025" \
  --smart-codes "HERA.AUD.DOC.TXN.REQ.v1,HERA.AUD.PROC.TXN.TEST.v1" \
  --organization-id "audit_client_org" \
  --workflow-stages "engagement,planning,execution,review,reporting" \
  --output-directory "./modules/audit" \
  --compliance-standards "ISA,PCAOB,AICPA"
```

### **Validation & Quality Assurance Commands:**
```bash
# Validate HERA Compliance (AUTOMATED)
claude hera-validate-compliance \
  --directory "./modules" \
  --check-organization-id-usage \
  --check-universal-patterns \
  --check-smart-code-format \
  --check-ui-standards \
  --check-multi-tenancy \
  --generate-compliance-report \
  --auto-fix-minor-issues \
  --fail-on-critical-violations

# Test Universal Patterns
claude hera-test-patterns \
  --module-directory "./modules/financial" \
  --test-transaction-creation \
  --test-dynamic-fields \
  --test-relationship-mapping \
  --test-multi-tenant-isolation \
  --performance-benchmarks \
  --generate-test-report

# Validate Smart Code Implementation
claude hera-validate-smart-codes \
  --scan-directory "./modules" \
  --check-format-compliance \
  --verify-pattern-consistency \
  --validate-versioning \
  --suggest-corrections \
  --update-smart-code-registry
```

---

## 🔧 **AUTOMATED VALIDATION FRAMEWORK**

### **HERA Compliance Checker (hera-compliance.json):**
```json
{
  "validation_rules": {
    "organization_id_filtering": {
      "required": true,
      "pattern": "organization_id\\s*=\\s*",
      "error_level": "CRITICAL",
      "auto_fix": false
    },
    "universal_table_usage": {
      "allowed_tables": ["core_organizations", "core_entities", "core_dynamic_data", "core_relationships", "universal_transactions", "universal_transaction_lines"],
      "forbidden_patterns": ["CREATE TABLE", "ALTER TABLE"],
      "error_level": "CRITICAL",
      "auto_fix": false
    },
    "smart_code_format": {
      "pattern": "^HERA\\.[A-Z]{2,6}\\.[A-Z]{2,6}\\.(ENT|TXN|UI|RPT)\\.[A-Z]{2,8}\\.v[0-9]+$",
      "error_level": "WARNING",
      "auto_fix": true,
      "suggestions": true
    },
    "ui_theme_compliance": {
      "required_theme": "pwm-professional-dark",
      "required_components": ["glassmorphism", "animations", "responsive"],
      "color_palette": ["#0ea5e9", "#8b5cf6", "#10b981"],
      "error_level": "WARNING"
    }
  },
  "auto_fixes": {
    "add_organization_id": true,
    "fix_smart_code_format": true,
    "apply_ui_theme": true
  },
  "quality_gates": {
    "critical_errors": 0,
    "warning_threshold": 5,
    "test_coverage_minimum": 80,
    "performance_requirements": {
      "api_response_time": "< 200ms",
      "ui_render_time": "< 100ms"
    }
  }
}
```

### **Smart Code Validator (smart-code-validator.js):**
```javascript
// Automated smart code validation
const validateSmartCode = (code) => {
  const pattern = /^HERA\.([A-Z]{2,6})\.([A-Z]{2,6})\.(ENT|TXN|UI|RPT)\.([A-Z]{2,8})\.v([0-9]+)$/;
  
  if (!pattern.test(code)) {
    return {
      valid: false,
      error: "Invalid smart code format",
      suggestion: generateSuggestion(code)
    };
  }
  
  return { valid: true };
};

// Usage in Claude CLI
claude validate-smart-codes ./modules/ --auto-fix --report-violations
```

---

## 🎯 **SPECIFIC IMPLEMENTATION TEMPLATES**

### **Template 1: Financial Module Implementation**
```bash
# EXACT COMMAND for Financial Core
claude hera-financial-core \
  --context-files "docs/HERA_CONTEXT.md,docs/HERA_PATTERNS.md" \
  --organization-id "hera_software_inc" \
  --modules "GL,AR,AP" \
  --smart-codes "configs/financial-smart-codes.json" \
  --ui-theme "pwm-professional-dark" \
  --api-base-url "/api/v1" \
  --database-schema "schemas/hera-schema.sql" \
  --output-structure "modules/financial/" \
  --validation-rules "validation/hera-compliance.json" \
  --test-coverage-minimum 90 \
  --auto-document true \
  --git-integration true

# Generates:
# modules/financial/
# ├── GeneralLedger/
# │   ├── GeneralLedger.tsx           (PWM-quality UI)
# │   ├── gl-api.ts                   (Universal API patterns)
# │   ├── gl-types.ts                 (TypeScript definitions)
# │   └── gl-smart-codes.ts           (HERA.FIN.GL.*)
# ├── AccountsReceivable/
# │   ├── AccountsReceivable.tsx
# │   ├── ar-api.ts
# │   └── ar-types.ts
# └── AccountsPayable/
#     ├── AccountsPayable.tsx
#     ├── ap-api.ts
#     └── ap-types.ts
```

### **Template 2: Development Dashboard (Meta-System)**
```bash
# EXACT COMMAND for HERA Development Dashboard
claude hera-dev-dashboard \
  --context-files "docs/HERA_CONTEXT.md" \
  --smart-code "HERA.DEV.DASH.UI.MAIN.v1" \
  --organization-id "hera_software_inc" \
  --features "git-integration,real-time-status,task-tracking,build-progress" \
  --ui-reference "PWM interface quality" \
  --git-repo-integration "auto-detect" \
  --real-time-updates true \
  --output-file "components/HERADevelopmentDashboard.tsx" \
  --include-api-integration true \
  --validate-compliance true

# Expected Features:
# ✅ Real-time Git status integration
# ✅ HERA task tracking using universal_transactions
# ✅ Build progress visualization  
# ✅ PWM-quality professional design
# ✅ Live status updates and notifications
# ✅ Team collaboration features
```

### **Template 3: Audit Workflow System**
```bash
# EXACT COMMAND for Audit System (Based on GSPU 2025)
claude hera-audit-system \
  --context-files "docs/HERA_CONTEXT.md" \
  --audit-framework "GSPU-2025" \
  --smart-codes "HERA.AUD.DOC.TXN.REQ.v1,HERA.AUD.PROC.TXN.TEST.v1,HERA.AUD.REV.TXN.APPR.v1" \
  --organization-template "audit_firm" \
  --client-management "multi-client-isolation" \
  --document-categories "formation,financial,planning,execution,vat,related-parties" \
  --workflow-stages "engagement,planning,fieldwork,review,reporting" \
  --compliance-standards "ISA,PCAOB,AICPA" \
  --output-directory "modules/audit/" \
  --ui-theme "pwm-professional-dark" \
  --real-time-collaboration true

# Expected Implementation:
# ✅ Complete GSPU audit workflow
# ✅ Document requisition management
# ✅ Multi-client data isolation
# ✅ Real-time status tracking
# ✅ Compliance audit trails
# ✅ Professional audit firm UI
```

---

## 🔍 **AUTOMATED VALIDATION SYSTEM**

### **Real-time Compliance Monitoring:**
```bash
# Watch for HERA compliance violations
claude hera-watch-compliance \
  --directory "./modules" \
  --real-time-scanning true \
  --auto-fix-minor-violations \
  --alert-on-critical-violations \
  --integration-with-git-hooks \
  --generate-violation-reports \
  --team-notification-webhook [WEBHOOK_URL]

# Automated pre-commit validation
claude hera-pre-commit-validate \
  --check-organization-id-usage \
  --check-universal-patterns \
  --check-smart-code-format \
  --check-ui-theme-compliance \
  --run-performance-tests \
  --block-commit-on-violations
```

### **Quality Gate System:**
```bash
# Comprehensive quality assessment
claude hera-quality-gate \
  --module-path "./modules/financial" \
  --performance-benchmarks "benchmarks/financial.json" \
  --security-scan true \
  --accessibility-check true \
  --cross-browser-compatibility true \
  --mobile-responsiveness true \
  --generate-quality-report \
  --require-passing-score 90

# Quality Requirements:
# ✅ HERA compliance: 100%
# ✅ Test coverage: ≥90%
# ✅ Performance: API <200ms, UI <100ms
# ✅ Security: No vulnerabilities
# ✅ PWM UI quality: Professional standard
```

---

## 📚 **KNOWLEDGE BASE INTEGRATION**

### **Initialize HERA Knowledge Base:**
```bash
# Bootstrap HERA knowledge base using own architecture
claude hera-init-knowledge-base \
  --organization-id "hera_knowledge_base" \
  --load-current-decisions "docs/architectural-decisions.json" \
  --create-meta-documentation true \
  --setup-auto-updating true \
  --integration-with-git true

# Creates entities in HERA tables:
# core_entities: architecture_decision, implementation_pattern, component_spec
# core_dynamic_data: decision_rationale, technical_specs, implementation_status
# core_relationships: decision_dependencies, pattern_relationships
# universal_transactions: development_milestones, implementation_progress
```

### **Auto-Documentation Commands:**
```bash
# Document implementation automatically
claude hera-auto-document \
  --implementation-path "./modules/financial" \
  --store-in-hera-kb true \
  --generate-patterns true \
  --update-smart-code-registry true \
  --create-reusable-templates true \
  --notify-team-updates true

# Query existing knowledge
claude hera-query-knowledge \
  --search "financial module patterns" \
  --format "implementation-guide" \
  --include-code-examples true \
  --filter-by-organization "hera_software_inc"
```

---

## 🛡️ **ERROR RECOVERY & TEAM COLLABORATION**

### **Error Recovery Framework:**
```bash
# Detect and fix HERA violations
claude hera-fix-violations \
  --scan-directory "./modules" \
  --violation-types "organization-id,schema-changes,non-universal-patterns" \
  --auto-fix-safe-violations \
  --report-critical-violations \
  --suggest-corrections \
  --backup-before-fixes

# Rollback to last valid state
claude hera-rollback \
  --to-last-valid-commit \
  --preserve-valid-changes \
  --restore-hera-compliance \
  --update-knowledge-base
```

### **Team Collaboration System:**
```bash
# Sync team HERA context
claude hera-team-sync \
  --shared-knowledge-base "git@github.com:company/hera-kb.git" \
  --update-local-context true \
  --validate-team-consistency \
  --resolve-context-conflicts \
  --notify-team-updates

# Validate team implementation consistency
claude hera-validate-team-work \
  --check-pattern-consistency \
  --check-smart-code-uniqueness \
  --check-ui-theme-consistency \
  --generate-team-report \
  --suggest-harmonization
```

---

## 🎯 **SUCCESS VALIDATION CRITERIA**

### **Automated Success Metrics:**
```json
{
  "hera_compliance_requirements": {
    "organization_id_filtering": "100% coverage required",
    "universal_table_usage": "Only 6 tables allowed",
    "smart_code_format": "100% pattern compliance",
    "ui_theme_consistency": "PWM professional standard",
    "multi_tenant_isolation": "Zero cross-tenant data access",
    "performance_standards": {
      "api_response": "< 200ms",
      "ui_render": "< 100ms",
      "database_query": "< 50ms"
    }
  },
  "quality_standards": {
    "test_coverage": "> 90%",
    "code_quality": "A grade minimum",
    "accessibility": "WCAG 2.1 AA compliance",
    "security": "Zero critical vulnerabilities",
    "documentation": "100% API coverage"
  }
}
```

### **Validation Commands:**
```bash
# Complete implementation validation
claude hera-final-validation \
  --implementation-path "./modules/financial" \
  --run-full-test-suite \
  --check-performance-benchmarks \
  --validate-security-standards \
  --check-accessibility-compliance \
  --verify-hera-architecture-compliance \
  --generate-certification-report

# Expected Output:
# ✅ HERA Compliance: PASS (100%)
# ✅ Performance: PASS (API: 145ms, UI: 67ms)
# ✅ Security: PASS (0 vulnerabilities)
# ✅ Test Coverage: PASS (94%)
# ✅ UI Quality: PASS (PWM standard)
# 🏆 CERTIFICATION: HERA COMPLIANT MODULE ✅
```

---

## 🚀 **PROGRESSIVE IMPLEMENTATION STRATEGY**

### **Phase 1: Foundation Completion (Week 1)**
```bash
# Complete Smart Coding System
claude hera-complete-smart-coding \
  --domains "FIN,INV,CRM,HR,SCM,AUD,DEV,REPT" \
  --generate-all-patterns \
  --create-validation-rules \
  --build-code-generator \
  --test-pattern-coverage \
  --document-in-knowledge-base

# Initialize Meta-Documentation
claude hera-init-meta-docs \
  --setup-self-documenting-system \
  --create-knowledge-base-org \
  --load-architectural-decisions \
  --setup-auto-updating \
  --create-query-interfaces
```

### **Phase 2: Core Module Implementation (Week 2-3)**
```bash
# Build Financial Core (Most Critical)
claude hera-build-financial-core \
  --complete-implementation \
  --smart-codes-file "configs/financial-smart-codes.json" \
  --ui-theme "pwm-professional-dark" \
  --include-reporting \
  --multi-currency-support \
  --audit-trail-compliance

# Build Development Dashboard (Meta-System)
claude hera-build-dev-dashboard \
  --git-integration-complete \
  --real-time-status-tracking \
  --team-collaboration-features \
  --build-progress-visualization \
  --hera-task-management
```

### **Phase 3: Industry Applications (Week 4-6)**
```bash
# Restaurant POS Complete
claude hera-restaurant-pos \
  --reference "Marios-restaurant-example" \
  --complete-pos-system \
  --inventory-integration \
  --payment-processing \
  --reporting-suite

# Audit Firm Management
claude hera-audit-firm-complete \
  --reference "GSPU-2025-framework" \
  --multi-client-support \
  --document-workflow \
  --compliance-reporting \
  --team-collaboration
```

---

## 🏆 **PRODUCTION DEPLOYMENT READINESS**

### **Final Deployment Validation:**
```bash
# Complete production readiness check
claude hera-production-readiness \
  --validate-all-modules \
  --security-penetration-test \
  --performance-load-test \
  --multi-tenant-isolation-test \
  --disaster-recovery-test \
  --compliance-audit-ready \
  --generate-production-certificate

# Deploy to production
claude hera-deploy-production \
  --environment "production" \
  --validate-before-deploy \
  --zero-downtime-deployment \
  --rollback-plan-ready \
  --monitoring-setup \
  --alert-configuration
```

---

## 📋 **COMMAND EXECUTION CHECKLIST**

### **Before Every Implementation:**
- [ ] Load complete HERA context files
- [ ] Validate context completeness
- [ ] Check current build status
- [ ] Verify organization_id setup
- [ ] Confirm smart code patterns

### **During Implementation:**
- [ ] Real-time HERA compliance monitoring
- [ ] Automated validation at each step
- [ ] Performance benchmark checking
- [ ] UI quality standard verification
- [ ] Multi-tenancy isolation testing

### **After Implementation:**
- [ ] Complete HERA compliance validation
- [ ] Performance and security testing
- [ ] Documentation in HERA knowledge base
- [ ] Team notification and sync
- [ ] Git integration and status update

---

## 🎯 **EXPECTED OUTCOMES**

### **After Successful Execution:**
1. **Complete HERA-compliant modules** following universal patterns
2. **PWM-quality professional UI** with animations and themes
3. **Perfect multi-tenancy** with organization_id filtering everywhere
4. **Automated validation** ensuring ongoing HERA compliance
5. **Self-documenting system** using HERA's own architecture
6. **Team collaboration** with shared context and standards

### **Success Metrics:**
- **Implementation Speed**: Hours/days vs months
- **HERA Compliance**: 100% automated validation
- **UI Quality**: PWM professional standard
- **Performance**: Sub-200ms API, sub-100ms UI
- **Security**: Enterprise-grade multi-tenancy
- **Documentation**: Auto-generated and maintained

---

## 🚨 **CRITICAL SUCCESS FACTORS**

1. **EXACT COMMAND USAGE**: Use provided commands exactly as specified
2. **COMPLETE CONTEXT LOADING**: Always load all context files before implementation
3. **AUTOMATED VALIDATION**: Never skip compliance checking
4. **ORGANIZATION_ID SACRED**: Verify organization_id usage in every component
5. **PWM UI QUALITY**: Maintain professional design standards
6. **KNOWLEDGE DOCUMENTATION**: Auto-document all implementations in HERA

---

**👨‍💼 CTO APPROVAL**: This enhanced prompt provides the specific, executable guidance needed for successful HERA implementation via Claude CLI. The combination of exact commands, automated validation, and progressive implementation strategy creates a production-ready development system.

**🎯 Ready for immediate execution with Claude CLI.**