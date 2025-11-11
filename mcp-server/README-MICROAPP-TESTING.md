# HERA Microapp RPC v2 Testing Guide

This guide provides instructions for testing all HERA microapp RPC v2 functions using the MCP server.

---

## 📋 Prerequisites

1. **Environment Variables Setup**

Create or update your `.env` file in the `mcp-server` directory:

```bash
# Supabase Connection
SUPABASE_URL=https://qqagokigwuujyeyrgdkq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Test Configuration
TEST_USER_ID=your_test_user_uuid
TEST_ORG_ID=your_test_org_uuid
DEFAULT_ORGANIZATION_ID=your_test_org_uuid
```

2. **Node Modules**

Ensure dependencies are installed:

```bash
cd mcp-server
npm install
```

---

## 🧪 Available Test Scripts

### 1. **Catalog RPC Tests** (`hera_microapp_catalog_v2`)

Tests all catalog operations: LIST, GET, CREATE, UPDATE, DELETE

```bash
cd mcp-server
node test-microapp-catalog.mjs
```

**Tests Covered:**
- ✅ List all available apps
- ✅ Filter apps by category
- ✅ Get specific app details
- ✅ Create new app (admin)
- ✅ Update app definition (admin)
- ✅ Delete app (admin)

---

### 2. **Dependencies RPC Tests** (Coming Soon)

```bash
node test-microapp-dependencies.mjs
```

---

### 3. **Finance RPC Tests** (Coming Soon)

```bash
node test-microapp-finance.mjs
```

---

### 4. **Installation RPC Tests** (Coming Soon)

```bash
node test-microapp-install.mjs
```

---

### 5. **Runtime RPC Tests** (Coming Soon)

```bash
node test-microapp-runtime.mjs
```

---

### 6. **Workflow RPC Tests** (Coming Soon)

```bash
node test-microapp-workflow.mjs
```

---

## 📊 Test Output Format

Each test script provides:

1. **Individual Test Results**
   - Test name and description
   - Pass/Fail status
   - Response data (JSON)
   - Validation checks

2. **Summary Report**
   - Total tests run
   - Number passed/failed/skipped
   - Success rate percentage
   - Detailed error messages

### Example Output:

```
🧪 Testing hera_microapp_catalog_v2
================================================================================
Configuration: { actor_user_id: '...', organization_id: '...' }
================================================================================

📋 Test 1.1: LIST - List All Available Apps
--------------------------------------------------------------------------------
✅ SUCCESS
Response: [
  {
    "app_code": "WASTE_MANAGEMENT_APP",
    "app_name": "Waste Management",
    "app_version": "v1.0.0",
    ...
  }
]

Validations:
  ✅ Returns array
  ✅ Has app_code
  ✅ Has app_name
  ✅ Has app_version

================================================================================
📊 TEST SUMMARY
================================================================================
Total Tests:   6
✅ Passed:     5
❌ Failed:     1
⏭️  Skipped:    0
Success Rate:  83.3%
```

---

## 🔍 Finding Test User and Org IDs

### Method 1: Using Existing MCP Scripts

```bash
# Find your test user
cd mcp-server
node find-test-user.mjs

# Find organizations
node verify-orgs.mjs
```

### Method 2: Direct SQL Query

```sql
-- Find user by email
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Find organization
SELECT id, organization_name
FROM core_entities
WHERE entity_type = 'ORGANIZATION'
  AND organization_name LIKE '%Test%';
```

---

## 🎯 Test Checklist

Use the comprehensive checklist document for tracking test progress:

```bash
cat mcp-server/MICROAPP-RPC-TEST-CHECKLIST.md
```

The checklist includes:
- ✅ All 28 test cases across 6 RPC functions
- 📝 Expected results for each test
- 🎯 Test execution plan (5 phases)
- 📊 Progress tracking table

---

## 🛡️ Security Considerations

### Actor Stamping
All RPC functions should automatically stamp:
- `created_by` = p_actor_user_id
- `updated_by` = p_actor_user_id
- `created_at` = NOW()
- `updated_at` = NOW()

### Organization Isolation
- All queries MUST filter by `organization_id`
- Cross-organization data access should be blocked
- RLS policies should be enforced

### Permission Checks
Some operations require specific roles:
- CREATE/UPDATE/DELETE catalog: Admin only
- INSTALL/UNINSTALL apps: Org admin
- EXECUTE runtime functions: App-specific permissions

---

## 🐛 Troubleshooting

### Issue: "Function not found"

**Problem:** RPC function doesn't exist in database

**Solution:**
```bash
# Check if function exists
psql -d your_database -c "\df hera_microapp_*"

# Or via Supabase dashboard:
# Database → Functions → Search for "hera_microapp"
```

---

### Issue: "Permission denied"

**Problem:** Service role key not set or user lacks permissions

**Solution:**
```bash
# Verify service role key is set
echo $SUPABASE_SERVICE_ROLE_KEY

# Check user has correct role
node check-user-metadata.mjs
```

---

### Issue: "Organization ID required"

**Problem:** TEST_ORG_ID not set in .env

**Solution:**
```bash
# Find and set organization ID
node verify-orgs.mjs

# Update .env
echo "TEST_ORG_ID=your-org-uuid" >> .env
```

---

### Issue: "App not found"

**Problem:** Test app doesn't exist in catalog

**Solution:**
```bash
# List available apps first
node test-microapp-catalog.mjs

# Or manually check catalog
psql -d your_database -c "SELECT * FROM microapp_catalog;"
```

---

## 📈 Progress Tracking

Update the test summary table in `MICROAPP-RPC-TEST-CHECKLIST.md` after running tests:

| Function | Total Tests | Passed | Failed | Pending |
|----------|-------------|--------|--------|---------|
| `hera_microapp_catalog_v2` | 6 | 0 → X | 0 → X | 6 → X |
| `hera_microapp_dependencies_v2` | 3 | 0 | 0 | 3 |
| `hera_microapp_finance_v2` | 4 | 0 | 0 | 4 |
| `hera_microapp_install_v2` | 6 | 0 | 0 | 6 |
| `hera_microapp_runtime_v2` | 4 | 0 | 0 | 4 |
| `hera_microapp_workflow_v2` | 5 | 0 | 0 | 5 |

---

## 🎓 Best Practices

### 1. **Test Isolation**
- Each test should be independent
- Clean up test data after tests
- Use unique identifiers (timestamps)

### 2. **Error Handling**
- Catch and log all errors
- Validate response structure
- Check for expected failure cases

### 3. **Documentation**
- Document expected behavior
- Note any deviations from spec
- Track known issues

### 4. **Continuous Testing**
- Run tests after schema changes
- Verify before deployment
- Automate in CI/CD pipeline

---

## 📚 Related Documentation

- **HERA Microapp Architecture:** `/docs/microapps/ARCHITECTURE.md`
- **RPC Function Specs:** `/docs/microapps/RPC_SPECIFICATIONS.md`
- **Test Checklist:** `/mcp-server/MICROAPP-RPC-TEST-CHECKLIST.md`
- **MCP Server Guide:** `/mcp-server/README.md`

---

## ✅ Quick Start

**Run your first test in 3 steps:**

```bash
# 1. Setup environment
cd mcp-server
cp .env.example .env
# Edit .env with your credentials

# 2. Install dependencies
npm install

# 3. Run catalog tests
node test-microapp-catalog.mjs
```

That's it! You should see test results in your terminal. 🎉

---

## 🆘 Support

If you encounter issues:

1. Check troubleshooting section above
2. Review HERA development docs
3. Check Supabase logs for errors
4. Contact HERA development team

---

**Last Updated:** 2025-11-10
**Version:** v1.0.0
**Status:** ✅ Ready for Use
