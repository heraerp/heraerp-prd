# HERA Salon - Staff Management Feature Guide

**Version**: 1.0
**Last Updated**: 2025-01-07
**Smart Code**: `HERA.DOCS.SALON.FEATURES.STAFF.v1`

> **Complete technical reference for staff management, roles, compliance tracking, and document monitoring**

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Key Features](#key-features)
4. [Hooks Reference](#hooks-reference)
5. [Data Model](#data-model)
6. [Compliance System](#compliance-system)
7. [Common Patterns](#common-patterns)
8. [Common Tasks](#common-tasks)
9. [Known Issues](#known-issues)

---

## 🎯 Overview

### Purpose

The Staff Management feature provides enterprise-grade team member management with:
- **Staff CRUD Operations**: Create, read, update, delete staff members
- **Role Management**: Assign roles and permissions
- **Compliance Tracking**: Monitor document expiry (visa, insurance, passport)
- **Multi-Branch Assignment**: Staff can work at multiple locations
- **Smart Delete System**: Automatic fallback to archive when referenced
- **Performance Tracking**: Hourly cost and display rates

### Key Features

✅ **Staff Member Management**
- Entity-based storage in Sacred Six `core_entities` table
- Dynamic fields for contact info, documents, skills, bio
- Role assignment via `STAFF_HAS_ROLE` relationships
- Branch assignment via `STAFF_MEMBER_OF` relationships

✅ **Compliance Monitoring**
- Automatic document expiry detection (30-day warning)
- Critical vs warning alert classification
- Compliance banner with drill-down to staff member
- Visa, insurance, passport expiry tracking

✅ **Role-Based Access Control**
- Owner/Manager: Full access including sensitive fields (hourly_cost)
- Staff: Limited access (no cost visibility)
- Role entity management in separate tab

✅ **Smart Status Workflow**
- **Active**: Currently working
- **On Leave**: Temporarily unavailable
- **Archived**: Soft-deleted (reversible)
- **Deleted**: Referenced in transactions (cannot be hard-deleted)

---

## 🏗️ Architecture

### File Structure

```
/src/app/salon/staffs/
├── page.tsx                           # Main staff page (783 lines)
├── StaffListTab.tsx                   # Staff list view (lazy loaded)
├── RolesTab.tsx                       # Roles management (lazy loaded)
├── StaffModal.tsx                     # Create/edit modal (lazy loaded)

/src/hooks/
├── useHeraStaff.ts                    # Staff data hook (393 lines)
├── useHeraRoles.ts                    # Roles data hook
├── useHeraBranches.ts                 # Branches for assignment
└── entityPresets.ts                   # Staff preset configuration

/src/lib/compliance/
├── staff-compliance.ts                # Compliance scanning logic
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        STAFF PAGE                                   │
│  /src/app/salon/staffs/page.tsx                                     │
│                                                                      │
│  1. SecuredSalonProvider → organizationId                           │
│  2. useHeraStaff → Fetch staff with filters                         │
│  3. useHeraRoles → Fetch roles for assignment                       │
│  4. useHeraBranches → Fetch branches for assignment                 │
│  5. scanStaffCompliance → Detect expiring documents                 │
│  6. StaffListTab (lazy) → Display staff list                        │
│  7. RolesTab (lazy) → Display roles management                      │
│  8. StaffModal (lazy) → Create/edit forms                           │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    USEHERASTAFF HOOK                                │
│  /src/hooks/useHeraStaff.ts                                         │
│                                                                      │
│  - Wraps useUniversalEntityV1 with staff-specific logic             │
│  - STAFF_MEMBER_OF branch filtering                                 │
│  - STAFF_HAS_ROLE role assignment                                   │
│  - CRUD helpers: create, update, delete, archive, restore           │
│  - Smart delete: Auto-fallback to archive on FK constraints         │
│  - Sensitive field filtering based on user role                     │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                  DATABASE (SACRED SIX)                              │
│                                                                      │
│  core_entities:                                                     │
│    - entity_type = 'STAFF'                                          │
│    - entity_name (full name)                                        │
│    - smart_code = 'HERA.SALON.STAFF.ENTITY.PERSON.V1'              │
│    - status (active | on_leave | archived | deleted)               │
│                                                                      │
│  core_dynamic_data:                                                 │
│    - first_name, last_name, email, phone                            │
│    - hire_date, hourly_cost, display_rate                           │
│    - nationality, passport_no, visa_exp_date, insurance_exp_date    │
│    - skills (JSON), bio, avatar_url                                 │
│                                                                      │
│  core_relationships:                                                │
│    - STAFF_HAS_ROLE (staff → role)                                  │
│    - STAFF_MEMBER_OF (staff → branch)                               │
│    - PERFORMS_SERVICE (staff → service)                             │
└─────────────────────────────────────────────────────────────────────┘
```

**File Path**: `/src/app/salon/staffs/page.tsx:108`

---

## 🔑 Key Features

### 1. Compliance Tracking System

**Purpose**: Monitor document expiry and alert owners/managers

**Implementation**:

```typescript
// File: /src/lib/compliance/staff-compliance.ts
export function scanStaffCompliance(
  staff: StaffMember[],
  warningDays: number = 30
): ComplianceReport {
  const today = new Date()
  const warningDate = new Date(today.getTime() + warningDays * 24 * 60 * 60 * 1000)

  const issues: ComplianceIssue[] = []

  staff.forEach(member => {
    // Check visa expiry
    if (member.visa_exp_date) {
      const expiryDate = new Date(member.visa_exp_date)
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))

      if (expiryDate < today) {
        // Expired - critical
        issues.push({
          staffId: member.id,
          staffName: member.entity_name,
          issueType: 'visa_expired',
          severity: 'critical',
          message: `Visa expired ${Math.abs(daysUntilExpiry)} days ago`,
          expiryDate: member.visa_exp_date,
          daysUntilExpiry
        })
      } else if (expiryDate < warningDate) {
        // Expiring soon - warning
        issues.push({
          staffId: member.id,
          staffName: member.entity_name,
          issueType: 'visa_expiring',
          severity: 'warning',
          message: `Visa expires in ${daysUntilExpiry} days`,
          expiryDate: member.visa_exp_date,
          daysUntilExpiry
        })
      }
    }

    // Check insurance expiry (same pattern)
    // Check passport expiry (same pattern)
  })

  return {
    totalIssues: issues.length,
    critical: issues.filter(i => i.severity === 'critical').length,
    warning: issues.filter(i => i.severity === 'warning').length,
    issues
  }
}
```

**Usage**:

```tsx
// File: /src/app/salon/staffs/page.tsx:211
const compliance = React.useMemo(() => {
  if (!allStaff || allStaff.length === 0) {
    return { totalIssues: 0, critical: 0, warning: 0, issues: [] }
  }
  return scanStaffCompliance(allStaff, 30) // 30 days warning period
}, [allStaff])

// Display compliance banner
{compliance.totalIssues > 0 && (
  <ComplianceAlertBanner
    compliance={compliance}
    onStaffClick={(staffId) => {
      const staffMember = allStaff?.find(s => s.id === staffId)
      if (staffMember) {
        handleOpenModal(staffMember)
      }
    }}
  />
)}
```

**File Path**: `/src/app/salon/staffs/page.tsx:211-622`

---

### 2. Smart Delete with Archive Fallback

**Purpose**: Prevent data loss when staff members are referenced in transactions

**Implementation**:

```typescript
// File: /src/hooks/useHeraStaff.ts:218
const deleteStaff = async (
  id: string,
  reason?: string
): Promise<{
  success: boolean
  archived: boolean
  message?: string
}> => {
  const staffMember = (staff as StaffMember[])?.find(s => s.id === id)
  if (!staffMember) throw new Error('Staff member not found')

  try {
    // Attempt hard delete with cascade
    await baseDelete({
      entity_id: id,
      hard_delete: true,
      cascade: true,
      reason: reason || 'Permanently delete staff member',
      smart_code: 'HERA.SALON.STAFF.DELETE.v1'
    })

    // If we reach here, hard delete succeeded
    return {
      success: true,
      archived: false
    }
  } catch (error: any) {
    // Check if error is due to foreign key constraint
    const errorMessage = error.message || ''
    const is409Conflict =
      errorMessage.includes('409') ||
      errorMessage.includes('Conflict') ||
      errorMessage.includes('referenced') ||
      errorMessage.includes('foreign key') ||
      errorMessage.includes('transaction') ||
      errorMessage.includes('Cannot delete')

    if (is409Conflict) {
      // Staff is referenced - fallback to soft delete (status='deleted')
      await baseUpdate({
        entity_id: id,
        entity_name: staffMember.entity_name,
        status: 'deleted'  // ✅ Use 'deleted' status instead of 'archived'
      })

      return {
        success: true,
        archived: true,
        message:
          'Staff member is referenced by other records (appointments, transactions, or schedules) and cannot be deleted. They have been marked as deleted instead.'
      }
    }

    // If it's a different error, re-throw it
    throw error
  }
}
```

**File Path**: `/src/hooks/useHeraStaff.ts:218-317`

---

### 3. Sensitive Field Filtering

**Purpose**: Hide hourly_cost from non-managerial staff

**Implementation**:

```typescript
// File: /src/hooks/useHeraStaff.ts:342
const filterSensitiveFields = (staffList: StaffMember[], userRole?: string) => {
  if (!userRole || ['owner', 'manager'].includes(userRole)) {
    return staffList
  }

  // Remove hourly_cost for non-managers
  return staffList.map(s => ({
    ...s,
    dynamic_fields: {
      ...s.dynamic_fields,
      hourly_cost: undefined
    }
  }))
}

return {
  staff: filteredStaff,
  filterSensitiveFields,
  // ... other methods
}
```

**File Path**: `/src/hooks/useHeraStaff.ts:342-355`

---

## 🎣 Hooks Reference

### useHeraStaff Hook

**File**: `/src/hooks/useHeraStaff.ts` (393 lines)

**Purpose**: Staff-specific wrapper over Universal Entity v2

**Signature**:

```tsx
export interface UseHeraStaffOptions {
  organizationId?: string
  includeArchived?: boolean
  userRole?: string
  enabled?: boolean
  filters?: {
    include_dynamic?: boolean
    include_relationships?: boolean
    branch_id?: string
    limit?: number
    status?: string
  }
}

export function useHeraStaff(options?: UseHeraStaffOptions): {
  staff: StaffMember[]
  isLoading: boolean
  error: any
  refetch: () => void
  createStaff: (data: StaffFormData) => Promise<any>
  updateStaff: (id: string, data: Partial<StaffFormData>) => Promise<any>
  archiveStaff: (id: string) => Promise<any>
  restoreStaff: (id: string) => Promise<any>
  deleteStaff: (id: string, reason?: string) => Promise<{ success: boolean, archived: boolean, message?: string }>
  linkRole: (staffId: string, roleId: string) => Promise<any>
  linkServices: (staffId: string, serviceIds: string[]) => Promise<any>
  filterSensitiveFields: (staffList: StaffMember[], userRole?: string) => StaffMember[]
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
}
```

**File Path**: `/src/hooks/useHeraStaff.ts:63`

---

## 💾 Data Model

### StaffMember Interface

```tsx
export interface StaffMember {
  id: string
  entity_name: string
  entity_code?: string
  smart_code: string
  status: 'active' | 'on_leave' | 'archived' | 'deleted'

  // Dynamic fields (flattened from database)
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  role_title?: string
  hire_date?: string
  hourly_cost?: number      // Sensitive - filtered by role
  display_rate?: number
  skills?: any[]            // JSON array
  bio?: string
  avatar_url?: string

  // Document & Compliance fields
  nationality?: string
  passport_no?: string
  visa_exp_date?: string           // Critical for compliance
  insurance_exp_date?: string      // Critical for compliance

  // Relationships
  relationships?: {
    STAFF_HAS_ROLE?: { to_entity_id: string, to_entity?: any }
    STAFF_MEMBER_OF?: Array<{ to_entity_id: string, to_entity?: any }>
    PERFORMS_SERVICE?: Array<{ to_entity_id: string, to_entity?: any }>
  }

  created_at: string
  updated_at: string
}
```

**File Path**: `/src/hooks/useHeraStaff.ts:18-45`

---

### Sacred Six Storage

**Table: `core_entities`**

```sql
INSERT INTO core_entities (
  entity_type,
  entity_name,
  smart_code,
  status,
  organization_id
) VALUES (
  'STAFF',
  'Sarah Johnson',
  'HERA.SALON.STAFF.ENTITY.PERSON.V1',
  'active',
  'org-uuid'
)
```

**Table: `core_dynamic_data`**

```sql
-- Personal info
INSERT INTO core_dynamic_data (
  entity_id, field_name, field_value_text, field_type, smart_code, organization_id
) VALUES
  ('staff-uuid', 'first_name', 'Sarah', 'text', 'HERA.SALON.STAFF.DYN.FIRST_NAME.V1', 'org-uuid'),
  ('staff-uuid', 'last_name', 'Johnson', 'text', 'HERA.SALON.STAFF.DYN.LAST_NAME.V1', 'org-uuid'),
  ('staff-uuid', 'email', 'sarah@salon.com', 'email', 'HERA.SALON.STAFF.DYN.EMAIL.V1', 'org-uuid'),
  ('staff-uuid', 'phone', '+971501234567', 'text', 'HERA.SALON.STAFF.DYN.PHONE.V1', 'org-uuid');

-- Employment details
INSERT INTO core_dynamic_data (
  entity_id, field_name, field_value_number, field_type, smart_code, organization_id
) VALUES
  ('staff-uuid', 'hourly_cost', 50.00, 'number', 'HERA.SALON.STAFF.DYN.HOURLY_COST.V1', 'org-uuid'),
  ('staff-uuid', 'display_rate', 75.00, 'number', 'HERA.SALON.STAFF.DYN.DISPLAY_RATE.V1', 'org-uuid');

-- Compliance documents
INSERT INTO core_dynamic_data (
  entity_id, field_name, field_value_text, field_type, smart_code, organization_id
) VALUES
  ('staff-uuid', 'nationality', 'United Kingdom', 'text', 'HERA.SALON.STAFF.DYN.NATIONALITY.V1', 'org-uuid'),
  ('staff-uuid', 'passport_no', 'GB123456789', 'text', 'HERA.SALON.STAFF.DYN.PASSPORT_NO.V1', 'org-uuid'),
  ('staff-uuid', 'visa_exp_date', '2025-12-31', 'date', 'HERA.SALON.STAFF.DYN.VISA_EXP.V1', 'org-uuid'),
  ('staff-uuid', 'insurance_exp_date', '2025-06-30', 'date', 'HERA.SALON.STAFF.DYN.INSURANCE_EXP.V1', 'org-uuid');
```

**Table: `core_relationships`**

```sql
-- Role assignment
INSERT INTO core_relationships (
  source_entity_id, target_entity_id, relationship_type, organization_id
) VALUES (
  'staff-uuid', 'role-uuid', 'STAFF_HAS_ROLE', 'org-uuid'
);

-- Branch assignment (multi-branch support)
INSERT INTO core_relationships (
  source_entity_id, target_entity_id, relationship_type, organization_id
) VALUES
  ('staff-uuid', 'branch-1-uuid', 'STAFF_MEMBER_OF', 'org-uuid'),
  ('staff-uuid', 'branch-2-uuid', 'STAFF_MEMBER_OF', 'org-uuid');

-- Service assignment
INSERT INTO core_relationships (
  source_entity_id, target_entity_id, relationship_type, organization_id
) VALUES
  ('staff-uuid', 'service-1-uuid', 'PERFORMS_SERVICE', 'org-uuid'),
  ('staff-uuid', 'service-2-uuid', 'PERFORMS_SERVICE', 'org-uuid');
```

---

## 🏥 Compliance System

### Compliance Report Structure

```typescript
interface ComplianceIssue {
  staffId: string
  staffName: string
  issueType: 'visa_expired' | 'visa_expiring' | 'insurance_expired' | 'insurance_expiring' | 'passport_expired' | 'passport_expiring'
  severity: 'critical' | 'warning'
  message: string
  expiryDate: string
  daysUntilExpiry: number
}

interface ComplianceReport {
  totalIssues: number
  critical: number
  warning: number
  issues: ComplianceIssue[]
}
```

### Compliance Banner Component

**Purpose**: Display compliance issues with drill-down to staff member

**Usage**:

```tsx
<ComplianceAlertBanner
  compliance={compliance}
  onStaffClick={(staffId) => {
    const staffMember = allStaff?.find(s => s.id === staffId)
    if (staffMember) {
      handleOpenModal(staffMember)
    }
  }}
/>
```

**Visual Design**:
- Critical issues: Red background, exclamation icon
- Warning issues: Yellow background, warning icon
- Clickable staff names open modal for document update
- Expandable/collapsible list

**File Path**: `/src/components/salon/compliance/ComplianceAlertBanner.tsx`

---

## 🎨 Common Patterns

### 1. Create Staff Member

```tsx
const { createStaff } = useHeraStaff({ organizationId })

await createStaff({
  first_name: 'Sarah',
  last_name: 'Johnson',
  email: 'sarah@salon.com',
  phone: '+971501234567',
  role_id: 'role-uuid',
  hire_date: '2025-01-01',
  hourly_cost: 50.00,
  display_rate: 75.00,
  nationality: 'United Kingdom',
  passport_no: 'GB123456789',
  visa_exp_date: '2025-12-31',
  insurance_exp_date: '2025-06-30',
  branch_ids: ['branch-1-uuid', 'branch-2-uuid']
})
```

---

### 2. Update Staff Member

```tsx
const { updateStaff } = useHeraStaff({ organizationId })

await updateStaff('staff-uuid', {
  email: 'sarah.new@salon.com',
  visa_exp_date: '2026-12-31', // Renew visa
  branch_ids: ['branch-1-uuid'] // Remove from branch 2
})
```

---

### 3. Smart Delete

```tsx
const { deleteStaff } = useHeraStaff({ organizationId })

const result = await deleteStaff('staff-uuid')

if (result.archived) {
  console.log('Staff archived:', result.message)
  // "Staff member is referenced by other records... marked as deleted instead."
} else {
  console.log('Staff permanently deleted')
}
```

---

## 🔧 Common Tasks

### Task 1: Add Document Expiry Field

**Scenario**: Add "work_permit_exp_date" field

**Steps**:

1. **Update STAFF_PRESET** (`/src/hooks/entityPresets.ts`):

```tsx
export const STAFF_PRESET = {
  dynamicFields: [
    // ... existing fields
    {
      name: 'work_permit_exp_date',
      type: 'date',
      smart_code: 'HERA.SALON.STAFF.DYN.WORK_PERMIT_EXP.V1'
    }
  ]
}
```

2. **Update StaffMember Interface** (`/src/hooks/useHeraStaff.ts:18`):

```tsx
export interface StaffMember {
  // ... existing fields
  work_permit_exp_date?: string
}
```

3. **Update Compliance Scanner** (`/src/lib/compliance/staff-compliance.ts`):

```tsx
// Add work permit expiry check
if (member.work_permit_exp_date) {
  const expiryDate = new Date(member.work_permit_exp_date)
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))

  if (expiryDate < today) {
    issues.push({
      staffId: member.id,
      staffName: member.entity_name,
      issueType: 'work_permit_expired',
      severity: 'critical',
      message: `Work permit expired ${Math.abs(daysUntilExpiry)} days ago`,
      expiryDate: member.work_permit_exp_date,
      daysUntilExpiry
    })
  }
}
```

4. **Update StaffModal Form** (lazy loaded component):

```tsx
<input
  type="date"
  name="work_permit_exp_date"
  value={formData.work_permit_exp_date || ''}
  onChange={handleChange}
/>
```

**Result**: New field automatically tracked in compliance system

---

### Task 2: Implement Bulk Staff Import

**Implementation**:

```tsx
const importStaffFromCSV = async (file: File) => {
  const { createStaff } = useHeraStaff({ organizationId })

  const text = await file.text()
  const rows = text.split('\n').slice(1) // Skip header

  const results = { success: 0, failed: 0, errors: [] as string[] }

  for (const row of rows) {
    const [first_name, last_name, email, phone, role_id, branch_ids] = row.split(',')

    try {
      await createStaff({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role_id: role_id.trim(),
        branch_ids: branch_ids.split(';').map(b => b.trim())
      })
      results.success++
    } catch (error: any) {
      results.failed++
      results.errors.push(`${first_name} ${last_name}: ${error.message}`)
    }
  }

  return results
}
```

---

## ⚠️ Known Issues

### Issue 1: Compliance Scanner Only Shows Owner Tab

**Problem**: Compliance banner only visible to owner, not managers

**Solution**: Add role check in page component

```tsx
// File: /src/app/salon/staffs/page.tsx:612
const { user } = useHERAAuth()
const userRole = user?.role // Get from user profile

{(compliance.totalIssues > 0 && ['owner', 'manager'].includes(userRole)) && (
  <ComplianceAlertBanner compliance={compliance} />
)}
```

**Status**: ✅ Can be implemented

---

### Issue 2: Multi-Branch Filter Not Working

**Problem**: When filtering by branch, staff assigned to multiple branches don't show

**Solution**: Already implemented in hook

```tsx
// File: /src/hooks/useHeraStaff.ts:358
const filteredStaff = useMemo(() => {
  if (!options?.filters?.branch_id || options.filters.branch_id === 'all') {
    return staff as StaffMember[]
  }

  return (staff as any[]).filter((s: any) => {
    const memberOfRels = getRelationship(s, 'STAFF_MEMBER_OF')
    const branchIds = extractRelationshipIds(memberOfRels, 'to_entity_id')
    return branchIds.includes(options.filters!.branch_id!)
  })
}, [staff, options?.filters?.branch_id])
```

**Status**: ✅ Fixed

---

## 📖 Related Documentation

### Feature Documentation
- [LEAVE-MANAGEMENT.md](./LEAVE-MANAGEMENT.md) - Leave requests and approvals
- [APPOINTMENTS.md](./APPOINTMENTS.md) - Staff assignment to appointments
- [SERVICES.md](./SERVICES.md) - Service assignment to staff

### Technical Reference
- [HOOKS.md](./HOOKS.md) - Custom hooks reference
- [DATA-MODELS.md](./DATA-MODELS.md) - Sacred Six schema

---

## 🎯 Success Metrics

A staff management feature is production-ready when:

- ✅ **All CRUD operations work**: Create, read, update, delete with error handling
- ✅ **Compliance tracking active**: Document expiry monitored with 30-day warning
- ✅ **Smart delete safe**: Automatic archive fallback prevents data loss
- ✅ **Role-based access**: Sensitive fields hidden from non-managers
- ✅ **Multi-branch assignment**: Staff can work at multiple locations
- ✅ **Mobile responsive**: Grid/list views work on 375px+ screens
- ✅ **E2E tests pass**: All staff workflows covered

---

<div align="center">

**Built with HERA DNA** | **Staff Module v1.0** | **Enterprise Ready**

[← Back to Developer Guide](../DEVELOPER-GUIDE.md) | [Customers →](./CUSTOMERS.md) | [Leave Management →](./LEAVE-MANAGEMENT.md)

</div>
