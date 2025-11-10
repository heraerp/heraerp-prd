# HERA Microapp RPC v2 Testing Checklist

**Test Date:** 2025-11-10
**Tester:** Claude Code
**Environment:** HERA-DEV (qqagokigwuujyeyrgdkq)

---

## 📋 Test Configuration

```javascript
// Common test data
const TEST_CONFIG = {
  actor_user_id: 'YOUR_USER_UUID',
  organization_id: 'YOUR_ORG_UUID',
  test_app_code: 'WASTE_MANAGEMENT_APP',
  test_app_version: 'v1.0.0'
}
```

---

## 1. 🗂️ hera_microapp_catalog_v2

**Function Signature:**
```sql
hera_microapp_catalog_v2(
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_operation text,
  p_app_definition jsonb DEFAULT NULL,
  p_filters jsonb DEFAULT NULL,
  p_options jsonb DEFAULT '{}'
) RETURNS jsonb
```

### Test Cases:

#### ✅ Test 1.1: LIST - List All Available Apps
```javascript
const result = await supabase.rpc('hera_microapp_catalog_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_operation: 'LIST',
  p_filters: null,
  p_options: {}
})
```

**Expected Result:**
- ✅ Success: Returns array of available microapps
- ✅ Each app has: `app_code`, `app_name`, `app_version`, `description`, `category`
- ✅ No private/internal apps exposed

**Status:** ⏳ Pending

---

#### ✅ Test 1.2: LIST - Filter by Category
```javascript
const result = await supabase.rpc('hera_microapp_catalog_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_operation: 'LIST',
  p_filters: {
    category: 'WASTE_MANAGEMENT'
  },
  p_options: {}
})
```

**Expected Result:**
- ✅ Success: Returns only waste management apps
- ✅ Filtered correctly by category

**Status:** ⏳ Pending

---

#### ✅ Test 1.3: GET - Get Specific App Details
```javascript
const result = await supabase.rpc('hera_microapp_catalog_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_operation: 'GET',
  p_filters: {
    app_code: TEST_CONFIG.test_app_code
  },
  p_options: {}
})
```

**Expected Result:**
- ✅ Success: Returns complete app definition
- ✅ Includes: capabilities, dependencies, permissions, pricing
- ✅ Returns 404 if app not found

**Status:** ⏳ Pending

---

#### ✅ Test 1.4: CREATE - Register New App (Admin Only)
```javascript
const result = await supabase.rpc('hera_microapp_catalog_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_operation: 'CREATE',
  p_app_definition: {
    app_code: 'TEST_APP_001',
    app_name: 'Test Application',
    app_version: 'v1.0.0',
    description: 'Test app for RPC validation',
    category: 'TESTING',
    capabilities: ['READ', 'WRITE'],
    pricing: {
      model: 'FREE',
      currency: 'AED'
    }
  },
  p_options: {}
})
```

**Expected Result:**
- ✅ Success: App registered in catalog
- ✅ Returns created app with ID
- ✅ Validates required fields
- ❌ Fails if non-admin user

**Status:** ⏳ Pending

---

#### ✅ Test 1.5: UPDATE - Update App Definition (Admin Only)
```javascript
const result = await supabase.rpc('hera_microapp_catalog_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_operation: 'UPDATE',
  p_app_definition: {
    app_code: 'TEST_APP_001',
    description: 'Updated description',
    app_version: 'v1.1.0'
  },
  p_options: {}
})
```

**Expected Result:**
- ✅ Success: App definition updated
- ✅ Version incremented properly
- ❌ Fails if app doesn't exist

**Status:** ⏳ Pending

---

#### ✅ Test 1.6: DELETE - Remove App from Catalog (Admin Only)
```javascript
const result = await supabase.rpc('hera_microapp_catalog_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_operation: 'DELETE',
  p_filters: {
    app_code: 'TEST_APP_001'
  },
  p_options: {}
})
```

**Expected Result:**
- ✅ Success: App removed from catalog
- ✅ Checks for existing installations
- ⚠️ Warns if active installations exist

**Status:** ⏳ Pending

---

## 2. 🔗 hera_microapp_dependencies_v2

**Function Signature:**
```sql
hera_microapp_dependencies_v2(
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_app_code text,
  p_version text,
  p_operation text
) RETURNS jsonb
```

### Test Cases:

#### ✅ Test 2.1: CHECK - Verify Dependencies Met
```javascript
const result = await supabase.rpc('hera_microapp_dependencies_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_app_code: TEST_CONFIG.test_app_code,
  p_version: TEST_CONFIG.test_app_version,
  p_operation: 'CHECK'
})
```

**Expected Result:**
- ✅ Success: Returns dependency status
- ✅ Lists required dependencies
- ✅ Indicates which are met/unmet
- ✅ Includes version compatibility

**Status:** ⏳ Pending

---

#### ✅ Test 2.2: RESOLVE - Get Dependency Tree
```javascript
const result = await supabase.rpc('hera_microapp_dependencies_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_app_code: TEST_CONFIG.test_app_code,
  p_version: TEST_CONFIG.test_app_version,
  p_operation: 'RESOLVE'
})
```

**Expected Result:**
- ✅ Success: Returns full dependency tree
- ✅ Includes transitive dependencies
- ✅ Detects circular dependencies
- ⚠️ Warns about conflicts

**Status:** ⏳ Pending

---

#### ✅ Test 2.3: INSTALL - Install Missing Dependencies
```javascript
const result = await supabase.rpc('hera_microapp_dependencies_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_app_code: TEST_CONFIG.test_app_code,
  p_version: TEST_CONFIG.test_app_version,
  p_operation: 'INSTALL'
})
```

**Expected Result:**
- ✅ Success: Installs all required dependencies
- ✅ Returns installation summary
- ✅ Handles dependency order correctly
- ❌ Fails if conflicts exist

**Status:** ⏳ Pending

---

## 3. 💰 hera_microapp_finance_v2

**Function Signature:**
```sql
hera_microapp_finance_v2(
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_operation text,
  p_app_code text DEFAULT NULL,
  p_finance_config jsonb DEFAULT '{}',
  p_transaction_payload jsonb DEFAULT '{}',
  p_options jsonb DEFAULT '{}'
) RETURNS jsonb
```

### Test Cases:

#### ✅ Test 3.1: CONFIGURE - Setup Finance Integration
```javascript
const result = await supabase.rpc('hera_microapp_finance_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_operation: 'CONFIGURE',
  p_app_code: TEST_CONFIG.test_app_code,
  p_finance_config: {
    revenue_account: '400000',
    expense_account: '500000',
    currency: 'AED',
    auto_post_gl: true
  },
  p_options: {}
})
```

**Expected Result:**
- ✅ Success: Finance config stored
- ✅ Validates GL account codes
- ✅ Returns configuration ID

**Status:** ⏳ Pending

---

#### ✅ Test 3.2: RECORD_REVENUE - Record App Revenue
```javascript
const result = await supabase.rpc('hera_microapp_finance_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_operation: 'RECORD_REVENUE',
  p_app_code: TEST_CONFIG.test_app_code,
  p_transaction_payload: {
    amount: 100.00,
    currency: 'AED',
    description: 'Monthly subscription fee',
    customer_id: 'customer-uuid',
    invoice_id: 'INV-001'
  },
  p_options: {
    auto_post_gl: true
  }
})
```

**Expected Result:**
- ✅ Success: Revenue transaction created
- ✅ GL journal auto-posted (if enabled)
- ✅ Returns transaction ID

**Status:** ⏳ Pending

---

#### ✅ Test 3.3: RECORD_EXPENSE - Record App Costs
```javascript
const result = await supabase.rpc('hera_microapp_finance_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_operation: 'RECORD_EXPENSE',
  p_app_code: TEST_CONFIG.test_app_code,
  p_transaction_payload: {
    amount: 50.00,
    currency: 'AED',
    description: 'API usage costs',
    vendor_id: 'vendor-uuid'
  },
  p_options: {}
})
```

**Expected Result:**
- ✅ Success: Expense transaction created
- ✅ GL journal auto-posted
- ✅ Returns transaction ID

**Status:** ⏳ Pending

---

#### ✅ Test 3.4: GET_BALANCE - Check App Financial Balance
```javascript
const result = await supabase.rpc('hera_microapp_finance_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_operation: 'GET_BALANCE',
  p_app_code: TEST_CONFIG.test_app_code,
  p_options: {
    date_from: '2025-01-01',
    date_to: '2025-11-10'
  }
})
```

**Expected Result:**
- ✅ Success: Returns financial summary
- ✅ Includes: total_revenue, total_expenses, net_profit
- ✅ Respects date filters

**Status:** ⏳ Pending

---

## 4. 📦 hera_microapp_install_v2

**Function Signature:**
```sql
hera_microapp_install_v2(
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_operation text,
  p_app_code text DEFAULT NULL,
  p_app_version text DEFAULT NULL,
  p_installation_config jsonb DEFAULT '{}',
  p_filters jsonb DEFAULT NULL,
  p_options jsonb DEFAULT '{}'
) RETURNS jsonb
```

### Test Cases:

#### ✅ Test 4.1: INSTALL - Install New App
```javascript
const result = await supabase.rpc('hera_microapp_install_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_operation: 'INSTALL',
  p_app_code: TEST_CONFIG.test_app_code,
  p_app_version: TEST_CONFIG.test_app_version,
  p_installation_config: {
    enable_notifications: true,
    default_branch_id: 'branch-uuid',
    custom_settings: {
      theme: 'dark',
      language: 'en'
    }
  },
  p_options: {
    auto_install_dependencies: true
  }
})
```

**Expected Result:**
- ✅ Success: App installed
- ✅ Dependencies checked and installed
- ✅ Configuration applied
- ✅ Returns installation ID
- ❌ Fails if already installed

**Status:** ⏳ Pending

---

#### ✅ Test 4.2: LIST - List Installed Apps
```javascript
const result = await supabase.rpc('hera_microapp_install_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_operation: 'LIST',
  p_filters: {
    status: 'ACTIVE'
  },
  p_options: {}
})
```

**Expected Result:**
- ✅ Success: Returns list of installed apps
- ✅ Includes installation status
- ✅ Shows installed version
- ✅ Filtered by organization

**Status:** ⏳ Pending

---

#### ✅ Test 4.3: GET - Get Installation Details
```javascript
const result = await supabase.rpc('hera_microapp_install_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_operation: 'GET',
  p_app_code: TEST_CONFIG.test_app_code,
  p_options: {}
})
```

**Expected Result:**
- ✅ Success: Returns installation details
- ✅ Includes: config, status, installed_at, updated_at
- ✅ Shows usage statistics
- ❌ Fails if not installed

**Status:** ⏳ Pending

---

#### ✅ Test 4.4: UPDATE - Update Installation Config
```javascript
const result = await supabase.rpc('hera_microapp_install_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_operation: 'UPDATE',
  p_app_code: TEST_CONFIG.test_app_code,
  p_installation_config: {
    enable_notifications: false,
    custom_settings: {
      theme: 'light'
    }
  },
  p_options: {}
})
```

**Expected Result:**
- ✅ Success: Configuration updated
- ✅ App remains active
- ✅ Returns updated config

**Status:** ⏳ Pending

---

#### ✅ Test 4.5: UNINSTALL - Remove App
```javascript
const result = await supabase.rpc('hera_microapp_install_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_operation: 'UNINSTALL',
  p_app_code: TEST_CONFIG.test_app_code,
  p_options: {
    cleanup_data: false, // Keep user data
    force: false // Check dependencies first
  }
})
```

**Expected Result:**
- ✅ Success: App uninstalled
- ✅ Checks if other apps depend on it
- ✅ Option to keep/delete data
- ⚠️ Warns if dependencies exist

**Status:** ⏳ Pending

---

#### ✅ Test 4.6: UPGRADE - Upgrade App Version
```javascript
const result = await supabase.rpc('hera_microapp_install_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_operation: 'UPGRADE',
  p_app_code: TEST_CONFIG.test_app_code,
  p_app_version: 'v2.0.0',
  p_options: {
    backup_data: true,
    auto_migrate: true
  }
})
```

**Expected Result:**
- ✅ Success: App upgraded to new version
- ✅ Data migration executed
- ✅ Backup created
- ❌ Fails if version incompatible

**Status:** ⏳ Pending

---

## 5. ⚙️ hera_microapp_runtime_v2

**Function Signature:**
```sql
hera_microapp_runtime_v2(
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_operation text,
  p_app_code text DEFAULT NULL,
  p_runtime_context jsonb DEFAULT '{}',
  p_execution_payload jsonb DEFAULT '{}',
  p_options jsonb DEFAULT '{}'
) RETURNS jsonb
```

### Test Cases:

#### ✅ Test 5.1: EXECUTE - Execute App Function
```javascript
const result = await supabase.rpc('hera_microapp_runtime_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_operation: 'EXECUTE',
  p_app_code: TEST_CONFIG.test_app_code,
  p_runtime_context: {
    function_name: 'processWastePickup',
    branch_id: 'branch-uuid',
    user_role: 'DRIVER'
  },
  p_execution_payload: {
    pickup_location: 'Location A',
    waste_type: 'PLASTIC',
    quantity: 50
  },
  p_options: {}
})
```

**Expected Result:**
- ✅ Success: Function executed
- ✅ Returns execution result
- ✅ Logs execution time
- ❌ Fails if permission denied

**Status:** ⏳ Pending

---

#### ✅ Test 5.2: GET_STATE - Retrieve Runtime State
```javascript
const result = await supabase.rpc('hera_microapp_runtime_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_operation: 'GET_STATE',
  p_app_code: TEST_CONFIG.test_app_code,
  p_runtime_context: {
    state_key: 'active_pickups'
  },
  p_options: {}
})
```

**Expected Result:**
- ✅ Success: Returns current state
- ✅ State is org-scoped
- ✅ Includes timestamp

**Status:** ⏳ Pending

---

#### ✅ Test 5.3: SET_STATE - Update Runtime State
```javascript
const result = await supabase.rpc('hera_microapp_runtime_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_operation: 'SET_STATE',
  p_app_code: TEST_CONFIG.test_app_code,
  p_runtime_context: {
    state_key: 'active_pickups'
  },
  p_execution_payload: {
    count: 5,
    locations: ['A', 'B', 'C']
  },
  p_options: {}
})
```

**Expected Result:**
- ✅ Success: State updated
- ✅ Returns updated state
- ✅ Validates state schema

**Status:** ⏳ Pending

---

#### ✅ Test 5.4: CLEAR_STATE - Reset Runtime State
```javascript
const result = await supabase.rpc('hera_microapp_runtime_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_operation: 'CLEAR_STATE',
  p_app_code: TEST_CONFIG.test_app_code,
  p_options: {}
})
```

**Expected Result:**
- ✅ Success: All state cleared
- ✅ Confirmation returned

**Status:** ⏳ Pending

---

## 6. 🔄 hera_microapp_workflow_v2

**Function Signature:**
```sql
hera_microapp_workflow_v2(
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_operation text,
  p_app_code text DEFAULT NULL,
  p_workflow_id text DEFAULT NULL,
  p_workflow_payload jsonb DEFAULT '{}',
  p_options jsonb DEFAULT '{}'
) RETURNS jsonb
```

### Test Cases:

#### ✅ Test 6.1: START - Start New Workflow
```javascript
const result = await supabase.rpc('hera_microapp_workflow_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_operation: 'START',
  p_app_code: TEST_CONFIG.test_app_code,
  p_workflow_payload: {
    workflow_type: 'WASTE_PICKUP_APPROVAL',
    initiator: 'customer-uuid',
    data: {
      pickup_date: '2025-11-15',
      waste_type: 'PLASTIC',
      estimated_weight: 100
    }
  },
  p_options: {}
})
```

**Expected Result:**
- ✅ Success: Workflow started
- ✅ Returns workflow_id
- ✅ Initial state set
- ✅ Notifications sent

**Status:** ⏳ Pending

---

#### ✅ Test 6.2: GET - Get Workflow Status
```javascript
const result = await supabase.rpc('hera_microapp_workflow_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_operation: 'GET',
  p_workflow_id: 'workflow-uuid',
  p_options: {}
})
```

**Expected Result:**
- ✅ Success: Returns workflow details
- ✅ Includes: current_state, history, participants
- ✅ Shows pending actions

**Status:** ⏳ Pending

---

#### ✅ Test 6.3: ADVANCE - Move Workflow to Next Step
```javascript
const result = await supabase.rpc('hera_microapp_workflow_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_operation: 'ADVANCE',
  p_workflow_id: 'workflow-uuid',
  p_workflow_payload: {
    action: 'APPROVE',
    comments: 'Approved for pickup',
    next_assignee: 'driver-uuid'
  },
  p_options: {}
})
```

**Expected Result:**
- ✅ Success: Workflow advanced
- ✅ State updated
- ✅ Notifications sent to next assignee
- ❌ Fails if invalid transition

**Status:** ⏳ Pending

---

#### ✅ Test 6.4: CANCEL - Cancel Workflow
```javascript
const result = await supabase.rpc('hera_microapp_workflow_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_operation: 'CANCEL',
  p_workflow_id: 'workflow-uuid',
  p_workflow_payload: {
    reason: 'Customer cancelled request'
  },
  p_options: {}
})
```

**Expected Result:**
- ✅ Success: Workflow cancelled
- ✅ All participants notified
- ✅ State marked as CANCELLED

**Status:** ⏳ Pending

---

#### ✅ Test 6.5: LIST - List Workflows
```javascript
const result = await supabase.rpc('hera_microapp_workflow_v2', {
  p_actor_user_id: TEST_CONFIG.actor_user_id,
  p_organization_id: TEST_CONFIG.organization_id,
  p_operation: 'LIST',
  p_app_code: TEST_CONFIG.test_app_code,
  p_options: {
    filters: {
      status: 'IN_PROGRESS',
      assigned_to: TEST_CONFIG.actor_user_id
    }
  }
})
```

**Expected Result:**
- ✅ Success: Returns list of workflows
- ✅ Filtered correctly
- ✅ Shows summary info

**Status:** ⏳ Pending

---

## 📊 Test Summary

| Function | Total Tests | Passed | Failed | Pending |
|----------|-------------|--------|--------|---------|
| `hera_microapp_catalog_v2` | 6 | 0 | 0 | 6 |
| `hera_microapp_dependencies_v2` | 3 | 0 | 0 | 3 |
| `hera_microapp_finance_v2` | 4 | 0 | 0 | 4 |
| `hera_microapp_install_v2` | 6 | 0 | 0 | 6 |
| `hera_microapp_runtime_v2` | 4 | 0 | 0 | 4 |
| `hera_microapp_workflow_v2` | 5 | 0 | 0 | 5 |
| **TOTAL** | **28** | **0** | **0** | **28** |

---

## 🚀 Test Execution Plan

### Phase 1: Basic Operations (Priority 1)
1. ✅ Test 1.1 - List catalog
2. ✅ Test 4.2 - List installed apps
3. ✅ Test 4.3 - Get installation details

### Phase 2: Installation Flow (Priority 2)
4. ✅ Test 2.1 - Check dependencies
5. ✅ Test 4.1 - Install app
6. ✅ Test 4.4 - Update config

### Phase 3: Runtime & Workflow (Priority 3)
7. ✅ Test 5.1 - Execute function
8. ✅ Test 6.1 - Start workflow
9. ✅ Test 6.3 - Advance workflow

### Phase 4: Finance Integration (Priority 4)
10. ✅ Test 3.1 - Configure finance
11. ✅ Test 3.2 - Record revenue
12. ✅ Test 3.4 - Get balance

### Phase 5: Advanced Operations (Priority 5)
13. ✅ Test 4.6 - Upgrade app
14. ✅ Test 2.3 - Install dependencies
15. ✅ Test 6.5 - List workflows

---

## 📝 Notes

- All tests should use MCP server for execution
- Replace `YOUR_USER_UUID` and `YOUR_ORG_UUID` with actual test values
- Each test should verify actor stamping (created_by, updated_by)
- All operations must respect organization isolation
- Check RLS policies are enforced
- Verify Smart Code compliance

---

## ✅ Sign-off

**Tested By:** _________________
**Date:** _________________
**Environment:** HERA-DEV
**Version:** v2.0.0
**Status:** ⏳ Ready for Testing
