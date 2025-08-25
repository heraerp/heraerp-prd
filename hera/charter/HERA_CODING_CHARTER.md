# HERA CODING CHARTER FOR CLAUDE CLI
## 🎯 SYSTEM IDENTITY: Universal ERP DNA Architecture

**CRITICAL**: This charter MUST be loaded as persistent system context for all HERA development sessions.

## ⚠️ SACRED ARCHITECTURAL RULES (NEVER VIOLATE)

### 🏗️ THE SACRED SIX-TABLE FOUNDATION
```
HERA is governed by EXACTLY 6 universal tables:
1. core_organizations - WHO (Multi-tenant isolation)
2. core_entities - WHAT (All business objects)  
3. core_dynamic_data - HOW (Unlimited custom fields)
4. core_relationships - WHY (Universal connections)
5. universal_transactions - WHEN (All business events)
6. universal_transaction_lines - DETAILS (Complete breakdown)

⚠️ VIOLATION ALERT: Creating additional tables invalidates the architecture
⚠️ VIOLATION ALERT: Schema alterations break the universal pattern
⚠️ VIOLATION ALERT: Omitting organization_id compromises multi-tenancy
```

### 🔒 SACRED MULTI-TENANCY RULE
```typescript
// EVERY database operation MUST include organization_id
// THIS IS NON-NEGOTIABLE - SECURITY FOUNDATION

✅ CORRECT:
const data = await supabase
  .from('core_entities')
  .select('*')
  .eq('organization_id', currentOrgId); // SACRED

❌ WRONG - SECURITY VIOLATION:
const data = await supabase
  .from('core_entities')
  .select('*'); // MISSING ORGANIZATION FILTER
```

### 🧬 SMART CODE DNA SYSTEM
```
Every entity MUST have smart_code following pattern:
HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.v{VERSION}

Examples:
- HERA.REST.CRM.ENT.MENU.v1 (Restaurant menu item)
- HERA.HLTH.PAT.ENT.RECORD.v1 (Healthcare patient record)
- HERA.MFG.INV.ENT.PART.v1 (Manufacturing part)

⚠️ Smart codes enable AI-native rule application
⚠️ Breaking smart code patterns disables automation
```

### 🔄 UNIVERSAL TRANSACTION PATTERN
```typescript
// ALL business events use universal_transactions + universal_transaction_lines
// Orders, invoices, tasks, treatments - EVERYTHING

const transaction = {
  transaction_type: 'restaurant_order', // Business context
  organization_id: orgId, // SACRED
  status: 'active',
  line_items: [...] // Always use universal_transaction_lines
};

⚠️ Creating separate transaction tables breaks universality
```

### 🎨 COMPONENT DNA REQUIREMENTS
```
All UI components MUST:
- Support dynamic fields from core_dynamic_data
- Include organization_id filtering
- Follow glassmorphism design patterns
- Include AI-enhanced features
- Support mobile-first responsive design

MVP Components Required for Enterprise Grade:
✅ Enhanced Shell Bar with global search
✅ KPI Dashboard with real-time metrics
✅ Advanced Filter Bar with smart filtering
✅ Enterprise Table with full features
✅ Message System for user feedback
```

## 🤖 AI-NATIVE DEVELOPMENT RULES

### 🧠 INTELLIGENCE INTEGRATION
```json
// AI capabilities built into core tables, not separate systems
{
  "ai_confidence": 0.95,
  "ai_enhanced_value": "Auto-generated description",
  "ai_insights": {
    "quality_score": 85,
    "suggestions": ["Add cost center", "Verify tax rate"]
  }
}
```

### 📊 MVP QUALITY STANDARDS
```sql
-- Every application MUST achieve 80%+ MVP completeness
SELECT claude_check_mvp_completeness('Your Application Description');
-- Returns completeness percentage and missing components
```

## 🚀 DEVELOPMENT WORKFLOW

### 1. CONTEXT LOADING (START EVERY SESSION)
```bash
# Load this charter before any HERA work
claude load-context HERA_CODING_CHARTER.md
```

### 2. ARCHITECTURE VALIDATION
```
Before implementing ANY feature:
✅ Does it use the 6 sacred tables?
✅ Are smart codes properly structured?
✅ Is organization_id filtering included?
✅ Does it follow universal patterns?
```

### 3. QUALITY ASSURANCE
```
Before delivering ANY component:
✅ MVP completeness check passed?
✅ Glassmorphism design applied?
✅ Mobile responsiveness verified?
✅ AI features integrated?
```

## 🎯 BUSINESS INTELLIGENCE

### INDUSTRY ADAPTABILITY
```
Same architecture serves:
- Restaurants: Orders, inventory, staff scheduling
- Healthcare: Patients, treatments, medical records  
- Manufacturing: Parts, BOMs, work orders
- Professional Services: Clients, projects, billing

Universal patterns + industry-specific smart codes = infinite flexibility
```

### COMPETITIVE ADVANTAGE
```
Traditional ERP: 200+ tables, complex schema, constant migrations
HERA Universal: 6 tables, infinite flexibility, zero schema changes

Result: SAP-level functionality, startup-level agility
```

## ⚡ PERFORMANCE & SCALING

### DATABASE OPTIMIZATION
```sql
-- Essential indexes for performance
CREATE INDEX idx_entities_org_smart ON core_entities(organization_id, smart_code);
CREATE INDEX idx_dynamic_org_entity ON core_dynamic_data(organization_id, entity_id);
CREATE INDEX idx_transactions_org_type ON universal_transactions(organization_id, transaction_type);
```

### CACHING STRATEGY
```typescript
// Smart code patterns enable intelligent caching
const cacheKey = `${orgId}:${smartCode}:${entityType}`;
// AI can predict cache invalidation based on smart codes
```

## 🔮 FUTURE-PROOFING

### REGULATORY COMPLIANCE
```
IFRS, GAAP, industry regulations handled through:
- Smart code versioning (v1 → v2 for regulation changes)
- Dynamic business rules in core_dynamic_data
- No schema migrations required
```

### AI EVOLUTION
```
System ready for:
- Advanced AI orchestration via smart codes
- Predictive analytics using universal patterns
- Cross-industry intelligence sharing
- Autonomous business process optimization
```

---

## 🎖️ CHARTER COMPLIANCE CHECKLIST

Before any code commit:
- [ ] Uses only the 6 sacred tables
- [ ] Includes organization_id filtering everywhere
- [ ] Follows smart code patterns
- [ ] Achieves 80%+ MVP completeness
- [ ] Implements glassmorphism design
- [ ] Includes AI-enhanced features

**Remember**: This charter is the DNA of HERA. Violating these principles compromises the entire universal architecture.

---

*"Six Tables. Infinite Business Complexity. Zero Schema Changes."*  
**HERA - The Last ERP You'll Ever Need** 🚀