# ================================================================================
# HERA COA IMPLEMENTATION WITH CLAUDE CODE - PROFESSIONAL STRUCTURE
# Using the exact structure from the provided TypeScript interface
# ================================================================================

echo "🏗️ HERA Global COA Implementation - Professional Structure"
echo "📍 Directory: /Users/san/Documents/PRD/heraerp/implementation/global-coa"

# ================================================================================
# STEP 1: CREATE THE PROFESSIONAL COA STRUCTURE FILE
# ================================================================================

cat > professional-coa-structure.ts << 'EOF'
// ================================================================================
// HERA UNIVERSAL CHART OF ACCOUNTS STRUCTURE
// Based on professional accounting standards with proper hierarchy and depth
// ================================================================================

interface UniversalCOAStructure {
  account_code: string;        // 7-digit code: 1000000, 1100000, etc.
  account_title: string;       // Professional account names
  account_number: string;      // Structured numbering: 1, 1.1, 1.1.1, etc.
  depth: number;              // Hierarchy level: 0, 1, 2, 3
  balance_type: 'Dr' | 'Cr' | 'Dr or Cr'; // Normal balance
  category: 'Assets' | 'Liabilities' | 'Equity' | 'Revenue' | 'Expenses';
  subcategory?: string;
  is_header: boolean;         // True for category headers
  parent_code?: string;       // Parent account code
  level: number;              // Display level for indentation
}

// Complete structure with all accounts as provided...
// [The complete UNIVERSAL_COA_RESTAURANT_INDIA array from the document]
EOF

# ================================================================================
# STEP 2: CREATE CLAUDE CODE TASK FOR SQL GENERATION
# ================================================================================

cat > task-professional-coa-sql.md << 'EOF'
# Generate SQL for Professional COA Structure

## Objective
Create PostgreSQL INSERT statements to implement the professional Chart of Accounts structure for HERA's 6-table architecture.

## Context
I have a TypeScript interface defining a complete professional COA structure with:
- 7-digit account codes (1000000, 1100000, etc.)
- Decimal account numbers for display (1, 1.1, 1.1.1, etc.)
- Proper depth hierarchy (0-3 levels)
- Professional account titles
- Restaurant-specific accounts for Indian market
- Complete metadata structure

## Requirements
Generate PostgreSQL INSERT statements for HERA's universal tables:

### 1. core_entities table (for GL accounts)
```sql
INSERT INTO core_entities (
  organization_id,
  entity_type,
  entity_name,
  entity_code,
  status,
  metadata,
  ai_confidence,
  ai_classification,
  created_by,
  updated_by
) VALUES (...);
```

### 2. core_dynamic_data table (for account properties)
```sql
INSERT INTO core_dynamic_data (
  organization_id,
  entity_id,
  field_name,
  field_type,
  field_value,
  field_value_number,
  field_value_boolean,
  field_value_json,
  created_by,
  updated_by
) VALUES (...);
```

### 3. core_relationships table (for hierarchy)
```sql
INSERT INTO core_relationships (
  organization_id,
  source_entity_id,
  target_entity_id,
  relationship_type,
  relationship_strength,
  hierarchy_level,
  relationship_data,
  created_by,
  updated_by
) VALUES (...);
```

## Account Structure to Implement
Use the complete professional structure with:
- Assets (1000000-1999999): Cash, Receivables, Inventory, Fixed Assets, Intangibles
- Liabilities (2000000-2999999): Payables, Tax Liabilities, Employee Benefits
- Equity (3000000-3999999): Capital, Retained Earnings
- Revenue (4000000-4999999): Food, Beverage, Liquor Sales
- Expenses (5000000-6999999): COGS, Operating Expenses with proper subcategorization

## Special Requirements for India Restaurant
1. GST compliance accounts (CGST, SGST, IGST)
2. Employee benefit accounts (EPF, ESI)
3. Restaurant-specific inventory (Food, Beverage, Liquor)
4. Professional account titles following international standards
5. Proper parent-child relationships for rollups

## Template Configuration
- organization_id = 'template_india_restaurant'
- All accounts should have proper metadata for:
  - account_number (display format)
  - depth and level
  - balance_type
  - category and subcategory
  - Indian tax treatment
  - Business rules
  - AI enhancement flags

## Output Required
Complete SQL file with INSERT statements for all three tables that implements the professional COA structure exactly as defined in the TypeScript interface.
EOF

# ================================================================================
# STEP 3: CREATE CLAUDE CODE TASK FOR API IMPLEMENTATION
# ================================================================================

cat > task-professional-coa-api.md << 'EOF'
# Generate API Implementation for Professional COA

## Objective
Create Express.js TypeScript API implementation for the professional Chart of Accounts system.

## Context
We have a complete professional COA structure with sophisticated features:
- Professional account hierarchy with proper depth levels
- Restaurant-specific adaptations for Indian market
- Comprehensive metadata and business rules
- AI-native features built-in
- GST compliance and employee benefit accounts

## Required API Files

### 1. COA Controller (../../api/src/controllers/coa.controller.ts)
```typescript
// Professional COA management endpoints
class COAController {
  // GET /api/v1/coa/templates - List available templates
  // POST /api/v1/coa/copy-template - Copy template to organization
  // GET /api/v1/coa/accounts - List GL accounts with hierarchy
  // POST /api/v1/coa/accounts - Create new GL account
  // PUT /api/v1/coa/accounts/:id - Update GL account
  // DELETE /api/v1/coa/accounts/:id - Delete GL account
  // GET /api/v1/coa/hierarchy - Get account tree structure
  // GET /api/v1/coa/trial-balance - Generate trial balance
}
```

### 2. COA Service (../../api/src/services/coa.service.ts)
```typescript
// Business logic for COA operations
class COAService {
  // Template management
  // Account CRUD operations
  // Hierarchy management
  // Trial balance calculation
  // GST compliance validation
}
```

### 3. COA Types (../../api/src/types/coa.types.ts)
```typescript
// TypeScript interfaces matching the professional structure
interface GLAccount {
  id: string;
  account_code: string;
  account_title: string;
  account_number: string;
  depth: number;
  balance_type: 'Dr' | 'Cr' | 'Dr or Cr';
  category: string;
  subcategory?: string;
  is_header: boolean;
  parent_code?: string;
  level: number;
  balance: number;
  children?: GLAccount[];
}
```

### 4. COA Routes (../../api/src/routes/coa.routes.ts)
```typescript
// Express routes with proper middleware
// JWT authentication
// Organization validation
// Input validation with Zod
// Error handling
```

## Special Features to Implement

### Template Copy Service
- Copy professional COA template to organization
- Apply customizations (account names, metadata)
- Create all relationships properly
- Handle Indian GST accounts
- Set up restaurant-specific accounts

### Hierarchy Management
- Build account tree from flat structure
- Handle parent-child relationships
- Support multiple depth levels (0-3)
- Proper sorting by account_number

### Trial Balance Generation
- Calculate balances by account type
- Handle debit/credit correctly
- Include hierarchy rollups
- Format for Indian accounting standards

### GST Compliance
- Handle CGST, SGST, IGST accounts
- Proper tax calculations
- Compliance reporting
- Input/output tax reconciliation

## Authentication & Security
- JWT token validation
- Organization-based multi-tenancy
- Role-based permissions
- Input sanitization
- SQL injection prevention

## Output Required
Complete TypeScript files for professional COA API implementation with all features.
EOF

# ================================================================================
# STEP 4: CREATE CLAUDE CODE TASK FOR REACT COMPONENTS
# ================================================================================

cat > task-professional-coa-ui.md << 'EOF'
# Generate React Components for Professional COA

## Objective
Create React TypeScript components for professional Chart of Accounts management.

## Context
Professional COA system with:
- Hierarchical account structure (4 depth levels)
- Professional account titles and numbering
- Restaurant-specific features for Indian market
- GST compliance and employee benefits
- Sophisticated business rules and AI features

## Required React Components

### 1. COATemplateSelector (../../src/components/finance/COATemplateSelector.tsx)
- Professional template selection interface
- Country and industry filtering
- Template preview with account counts
- Copy template to organization
- Progress tracking and success confirmation

### 2. AccountHierarchyTree (../../src/components/finance/AccountHierarchyTree.tsx)
- Professional tree view with proper indentation
- 4-level hierarchy support (0-3 depth)
- Expand/collapse with smooth animations
- Account code and title display
- Balance amounts with proper formatting
- Search and filter capabilities
- Add/edit/delete account actions
- Drag-and-drop reordering

### 3. GLAccountForm (../../src/components/finance/GLAccountForm.tsx)
- Professional account creation/editing
- 7-digit account code validation
- Account number generation (decimal format)
- Parent account hierarchical selector
- Category and subcategory selection
- Balance type (Dr/Cr) selection
- Indian GST settings
- Business rules configuration
- Professional form validation

### 4. TrialBalanceReport (../../src/components/finance/TrialBalanceReport.tsx)
- Professional trial balance format
- Account hierarchy with indentation
- Debit and credit columns
- Running totals and grand totals
- Balance verification (Dr = Cr)
- Date range filtering
- Export to PDF/Excel
- Print-friendly layout
- Indian accounting format

### 5. COADashboard (../../src/components/finance/COADashboard.tsx)
- Main COA management interface
- Template selection for new organizations
- Account management for existing setups
- Quick actions and navigation
- KPI cards (account counts, balances)
- Recent activity feed

### 6. AccountDetailsModal (../../src/components/finance/AccountDetailsModal.tsx)
- Detailed account information
- Transaction history
- Balance drill-down
- Edit account properties
- Relationship management
- Business rules display

## Professional UI Features

### Visual Design
- Clean, professional layout
- Proper indentation for hierarchy
- Color coding by account category
- Icons for different account types
- Loading states and error handling
- Responsive design for mobile/desktop

### Account Display
- Account code prominent display
- Professional account titles
- Hierarchy level indicators
- Balance formatting (₹ for Indian Rupees)
- Status indicators (active/inactive)
- Category badges

### Search and Filtering
- Search by account code or name
- Filter by category/subcategory
- Filter by balance type
- Filter by GST applicability
- Quick filters for common views

### Data Entry
- Auto-completion for account codes
- Parent account selection with tree view
- Smart defaults based on category
- Validation with helpful error messages
- Save and continue workflows

## TypeScript Interfaces
```typescript
interface GLAccountDisplay {
  id: string;
  account_code: string;
  account_title: string;
  account_number: string;
  depth: number;
  balance_type: 'Dr' | 'Cr';
  category: string;
  balance: number;
  balance_formatted: string;
  children?: GLAccountDisplay[];
  parent_account?: GLAccountDisplay;
  is_header: boolean;
  level: number;
}

interface COATemplate {
  id: string;
  name: string;
  country: string;
  industry: string;
  description: string;
  account_count: number;
  last_updated: string;
  compliance_framework: string;
}
```

## Integration Requirements
- API integration with error handling
- State management with React hooks
- Optimistic updates for better UX
- Real-time balance updates
- Proper loading states
- Error boundaries

## Accessibility
- WCAG 2.1 compliance
- Keyboard navigation
- Screen reader support
- High contrast mode
- Focus management

## Output Required
Complete React TypeScript components with professional COA management functionality.
EOF

# ================================================================================
# STEP 5: CLAUDE CODE EXECUTION COMMANDS
# ================================================================================

echo ""
echo "🚀 CLAUDE CODE IMPLEMENTATION COMMANDS"
echo "========================================="
echo ""
echo "Now run these commands one by one in Claude Code:"
echo ""
echo "1️⃣ GENERATE SQL FOR PROFESSIONAL COA STRUCTURE:"
echo "claude generate --prompt-file task-professional-coa-sql.md --output ../../database/seeds/professional-india-restaurant-coa.sql"
echo ""
echo "2️⃣ GENERATE API IMPLEMENTATION:"
echo "claude generate --prompt-file task-professional-coa-api.md --output ../../api/src/controllers/"
echo ""
echo "3️⃣ GENERATE REACT COMPONENTS:"
echo "claude generate --prompt-file task-professional-coa-ui.md --output ../../src/components/finance/"
echo ""
echo "💡 Or use Claude Code interactively by typing:"
echo ""
echo "I need to implement the professional Chart of Accounts structure that follows this exact interface:"
echo "[Show the TypeScript structure]"
echo ""
echo "Please generate:"
echo "1. PostgreSQL INSERT statements for HERA's 6-table architecture"
echo "2. Express.js API implementation with TypeScript"
echo "3. React components for professional COA management"
echo ""
echo "The structure uses 7-digit account codes, decimal account numbers for display,"
echo "proper depth hierarchy, and includes Indian restaurant-specific features like"
echo "GST accounts (CGST, SGST, IGST) and employee benefits (EPF, ESI)."

# ================================================================================
# STEP 6: VERIFICATION AND NEXT STEPS
# ================================================================================

cat > implementation-checklist.md << 'EOF'
# Professional COA Implementation Checklist

## ✅ Phase 1: Database Structure
- [ ] SQL INSERT statements for core_entities (GL accounts)
- [ ] SQL INSERT statements for core_dynamic_data (account properties)
- [ ] SQL INSERT statements for core_relationships (hierarchy)
- [ ] PostgreSQL function for template copying
- [ ] Database migration scripts

## ✅ Phase 2: API Implementation
- [ ] COA controller with all endpoints
- [ ] COA service with business logic
- [ ] TypeScript interfaces and types
- [ ] Express routes with middleware
- [ ] Input validation with Zod schemas
- [ ] Error handling and logging

## ✅ Phase 3: UI Components
- [ ] COATemplateSelector component
- [ ] AccountHierarchyTree component
- [ ] GLAccountForm component
- [ ] TrialBalanceReport component
- [ ] COADashboard component
- [ ] AccountDetailsModal component

## ✅ Phase 4: Integration & Testing
- [ ] API integration in components
- [ ] State management setup
- [ ] Error handling and loading states
- [ ] Responsive design testing
- [ ] Accessibility compliance
- [ ] Performance optimization

## ✅ Phase 5: Professional Features
- [ ] Template copy functionality
- [ ] Hierarchy management
- [ ] Trial balance generation
- [ ] GST compliance features
- [ ] Indian accounting format
- [ ] Export capabilities

## Next Steps After Generation
1. Review all generated files
2. Test SQL statements in database
3. Start API server and test endpoints
4. Integrate UI components
5. Test complete workflow
6. Deploy to production
EOF

echo ""
echo "✅ Professional COA implementation structure created!"
echo "📁 Files ready for Claude Code generation"
echo "🎯 Next: Run the Claude Code commands above"