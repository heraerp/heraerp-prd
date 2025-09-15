# HERA Salon Seeds - Scripts Documentation

This directory contains scripts for bootstrapping and validating the HERA Salon implementation using the Sacred Six tables architecture.

## 📁 Directory Structure

```
scripts/
├── apply-salon-seeds.js          # Stage A: Create organizations
├── apply-salon-ho-seeds.js       # Stage B: Apply HO catalog & policies
├── verify-salon-ho-data.js       # Stage B2: Verification queries
├── guardrail-checks.js           # Stage B3: Basic guardrail validation
├── guardrail-checks-enhanced.js  # Enhanced production-grade guardrails
├── clear-ho-data.js              # Rollback utility for HO data
├── check-smart-code-pattern.js   # Smart code validation helper
├── verify-salon-orgs.js          # Organization setup verification
├── queries/                      # SQL queries directory
│   └── guardrail-queries.sql     # Complex guardrail SQL queries
├── snapshots/                    # Data snapshots (auto-generated)
└── guardrail-results/            # Test results (auto-generated)
```

## 🚀 Quick Start

```bash
# Set environment variables
export HO_ORG_ID="30cbd9d1-7610-4e6a-9694-ea259dc6b23a"
export BR1_ORG_ID="eefe7ba9-e1d2-4647-b81e-a23027e3def5"
export BR2_ORG_ID="1e01ff79-22df-4e38-b432-696e91b67a55"

# Stage A: Create organizations
node scripts/apply-salon-seeds.js

# Stage B: Apply HO catalog and policies
node scripts/apply-salon-ho-seeds.js

# Verify data
node scripts/verify-salon-ho-data.js

# Run enhanced guardrails
node scripts/guardrail-checks-enhanced.js
```

## 📋 Script Descriptions

### apply-salon-seeds.js
**Purpose**: Creates three salon organizations (HO + 2 branches) with AED currency and Finance DNA enabled.

**Input**: None (organizations defined in script)

**Output**: 
- 3 organizations created in `core_organizations`
- Console output with organization IDs to save

**Expected Results**:
- HO organization with `role: head_office`
- 2 branch organizations with `role: branch`
- All with `default_currency: AED`

### apply-salon-ho-seeds.js
**Purpose**: Seeds Head Office catalog data including services, products, price lists, and relationships.

**Input**: 
- `hera/seeds/salon/entities.seed.yml`
- `hera/seeds/salon/dynamic_data.seed.yml`
- `hera/seeds/salon/relationships.seed.yml`

**Output**:
- 7 entities (price list, services, products, branches)
- 14 dynamic data records (prices, durations, reorder levels)
- 4 relationships (price list items, SERVICE_BOM)

**Key Features**:
- Idempotent upserts (safe to re-run)
- Smart code generation following HERA patterns
- Entity code normalization (HAIRCUT_BASIC → BASIC-HAIRCUT)

### verify-salon-ho-data.js
**Purpose**: Runs Stage B2 verification queries to validate seeded data.

**Verifications**:
1. **Entities**: Checks for 5 core catalog entities
2. **Price List**: Validates AED prices (Haircut 75, Coloring 250, Shampoo 35)
3. **Reorder Levels**: Confirms inventory thresholds (DYE_COLOR=200, SHAMPOO_RET=50)
4. **Service BOM**: Verifies Hair Coloring → Dye (50ml) relationship

**Exit Code**: 0 on success, 1 on any verification failure

### guardrail-checks-enhanced.js
**Purpose**: Production-grade validation with comprehensive checks.

**Checks Performed**:
1. **Smart Code Rigor**:
   - Regex pattern validation
   - Version monotonicity (no gaps)
   - Uniqueness within tables
   - Length limits (≤100 chars)

2. **Organization Isolation**:
   - Cross-org relationship detection
   - Organization ID filtering statistics
   - Multi-tenant boundary enforcement

3. **Sacred Six Exclusivity**:
   - Verify only 6 tables used
   - AI fields presence check
   - Metadata field validation

4. **Referential Integrity**:
   - Orphan dynamic data detection
   - Orphan relationship detection
   - Duplicate relationship prevention

5. **Data Validation**:
   - Numeric fields stored as numbers
   - Currency consistency (AED only)
   - UoM standardization
   - No negative values

6. **Policy Coverage**:
   - All services have prices
   - All services have durations
   - Complete attribute coverage

**Output**:
- Console report with pass/fail for each check
- JSON results in `guardrail-results/`
- Data snapshot in `snapshots/`
- Exit code: 0 (pass) or 1 (fail)

### clear-ho-data.js
**Purpose**: Safely removes all HO data in dependency order for clean re-runs.

**Deletion Order**:
1. `universal_transaction_lines`
2. `universal_transactions`
3. `core_relationships`
4. `core_dynamic_data`
5. `core_entities`

**Safety**: Only deletes records matching HO organization ID

## 🔐 Guardrail SQL Queries

The `queries/guardrail-queries.sql` file contains production-grade SQL for:
- Smart code validation
- Cross-table collision detection
- Orphan record identification
- Duplicate relationship detection
- Policy coverage analysis
- Data type validation

## 📊 CI/CD Integration

```bash
# Package.json scripts
"test:salon:seeds": "node scripts/guardrail-checks-enhanced.js",
"salon:bootstrap": "npm run seeds:apply:salon && npm run salon:seed:ho",
"salon:seed:ho": "node scripts/apply-salon-ho-seeds.js",
"salon:verify": "node scripts/verify-salon-ho-data.js",
"salon:clean": "node scripts/clear-ho-data.js"
```

## 🚨 Common Issues

### Smart Code Violations
**Error**: `new row violates check constraint "core_dynamic_data_smart_code_ck"`
**Fix**: Ensure smart codes match pattern: `HERA.[A-Z0-9_]{3,30}(.[A-Z0-9_]{2,40}){3,8}.v[0-9]+`

### Missing Dependencies
**Error**: `Cannot find module 'js-yaml'`
**Fix**: `npm install js-yaml`

### Cross-Org Contamination
**Error**: Relationships reference entities from different organizations
**Fix**: Always filter by `organization_id` in all queries

## 🎯 Best Practices

1. **Always run enhanced guardrails** before promoting to production
2. **Save organization IDs** from Stage A for all subsequent operations
3. **Use idempotent scripts** - all can be safely re-run
4. **Check exit codes** in CI/CD pipelines
5. **Review snapshots** to detect configuration drift
6. **Archive guardrail results** for audit trails

## 📈 Performance Notes

- Scripts use individual upserts for reliability over batch operations
- Enhanced guardrails may take 30-60s for comprehensive checks
- Snapshots use SHA-256 hashing for efficient drift detection
- All queries are scoped by organization_id for index optimization