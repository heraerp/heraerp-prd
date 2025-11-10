# HERA Salon - Settings Feature Guide

**Version**: 1.0 (Production Ready)
**Last Updated**: 2025-01-07
**Smart Code**: `HERA.DOCS.SALON.FEATURES.SETTINGS.v1`

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Settings Categories](#settings-categories)
4. [Data Storage](#data-storage)
5. [Components](#components)
6. [Business Hours Management](#business-hours-management)
7. [User Management](#user-management)
8. [Security Settings](#security-settings)
9. [Integration Settings](#integration-settings)
10. [Common Tasks](#common-tasks)
11. [Testing](#testing)
12. [Known Issues](#known-issues)

---

## 🎯 Overview

The Settings feature provides comprehensive organization and system configuration management with role-based access control, business hours management, user administration, and security settings.

### Key Features

- **Organization Settings** - Name, legal name, contact info, TRN, currency
- **Business Hours Management** - Per-branch operating hours with day-specific configuration
- **User Management** - Staff accounts, roles, permissions, activity tracking
- **Security Settings** - Password policies, session management, 2FA
- **API & Integrations** - API keys, WhatsApp, payments, SMS, email
- **Mobile-First Design** - 44px touch targets, iOS-style header, premium UX

### Success Metrics

- ✅ **4 Settings Tabs**: General, Users, Security, Integrations
- ✅ **Dynamic Data Storage**: All settings in `core_dynamic_data` (HERA DNA compliant)
- ✅ **Actor-Stamped Updates**: All changes tracked with WHO/WHEN/WHAT
- ✅ **Branch-Specific Hours**: Per-day operating hours per branch
- ✅ **View/Edit Modes**: Separate modes for viewing and editing business hours

**File Path**: `/src/app/salon/settings/page.tsx:80-1328`

---

## 🏗️ Architecture

### High-Level Flow

```
┌─────────────────────┐
│   Settings Page     │
│   (4 Tabs)          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  entityCRUD RPC     │──► Actor-stamped updates
│  (Direct Call)      │    Dynamic field format
└──────────┬──────────┘    Organization boundary
           │
           ▼
┌─────────────────────┐
│  core_dynamic_data  │──► Settings storage
│  (Key-Value Store)  │    Smart Code tagged
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  SecuredSalonProvider│──► Context refresh
│  (Auto-refresh)     │    Settings propagation
└─────────────────────┘
```

### Technology Stack

- **Next.js 15.4.2** - App Router with client component
- **SalonLuxePage** - Enterprise page wrapper
- **PremiumMobileHeader** - iOS-style mobile header
- **StatusToastProvider** - Enterprise toast notifications
- **entityCRUD RPC** - Direct RPC calls for updates
- **Luxe Design System** - Premium salon styling

**Architecture Decision**: Settings are stored in `core_dynamic_data` (not metadata) to maintain HERA DNA compliance and allow structured querying.

---

## 🗄️ Settings Categories

### General Settings

**Organization Information**:
- Organization Name (public-facing name)
- Legal Name (official business name)
- Phone Number (contact)
- Email Address (contact)
- Physical Address (location)
- Tax Registration Number (TRN) - UAE VAT compliance
- Currency (AED, USD, etc.)

**Business Hours** (Branch-specific):
- Monday - Sunday operating hours
- Open/close times per day
- Closed days configuration
- Per-branch customization

**File Path**: `/src/app/salon/settings/page.tsx:584-942`

---

### Users Tab

**User Management**:
- User listing with avatars
- Role badges (Owner, Admin, Receptionist, Accountant)
- Active status indicators
- Last activity timestamps
- Add user functionality (placeholder)

**User Statistics**:
- Total Users
- Active Now
- Inactive Count

**File Path**: `/src/app/salon/settings/page.tsx:945-1106`

---

### Security Tab

**Password Policy**:
- Minimum password length
- Require uppercase letters
- Require special characters
- Require numbers

**Session Management**:
- Session timeout (minutes)
- Two-factor authentication toggle

**File Path**: `/src/app/salon/settings/page.tsx:1108-1204`

---

### Integrations Tab

**API & Integrations**:
- API Key display (masked)
- API Key regeneration
- Active integrations status:
  - WhatsApp Business API
  - Payment Gateway
  - SMS Provider
  - Email Service

**File Path**: `/src/app/salon/settings/page.tsx:1207-1281`

---

## 💾 Data Storage

### Organization Settings (Dynamic Data)

**Storage Location**: `core_dynamic_data` table

**Format**:
```typescript
// RPC format for updates (CRITICAL)
{
  organization_name: {
    type: 'text',              // NOT field_type
    value: 'HERA Salon',       // NOT field_value_text
    smart_code: 'HERA.SALON.ORGANIZATION.FIELD.NAME.v1'
  },
  legal_name: {
    type: 'text',
    value: 'HERA Salon LLC',
    smart_code: 'HERA.SALON.ORGANIZATION.FIELD.LEGAL_NAME.v1'
  },
  phone: {
    type: 'text',
    value: '+971 50 123 4567',
    smart_code: 'HERA.SALON.ORGANIZATION.FIELD.PHONE.v1'
  },
  email: {
    type: 'text',
    value: 'contact@herasalon.com',
    smart_code: 'HERA.SALON.ORGANIZATION.FIELD.EMAIL.v1'
  },
  address: {
    type: 'text',
    value: '123 Business Bay, Dubai, UAE',
    smart_code: 'HERA.SALON.ORGANIZATION.FIELD.ADDRESS.v1'
  },
  trn: {
    type: 'text',
    value: '100000000000000',
    smart_code: 'HERA.SALON.ORGANIZATION.FIELD.TRN.v1'
  },
  currency: {
    type: 'text',
    value: 'AED',
    smart_code: 'HERA.SALON.ORGANIZATION.FIELD.CURRENCY.v1'
  }
}
```

**File Path**: `/src/app/salon/settings/page.tsx:184-234`

---

### Business Hours (Dynamic Data)

**Storage Location**: `core_dynamic_data` table (per branch entity)

**Format**:
```typescript
// Per-day fields for each branch
{
  hours_monday_open: {
    type: 'text',
    value: '09:00',
    smart_code: 'HERA.SALON.BRANCH.HOURS.MONDAY.OPEN.v1'
  },
  hours_monday_close: {
    type: 'text',
    value: '20:00',
    smart_code: 'HERA.SALON.BRANCH.HOURS.MONDAY.CLOSE.v1'
  },
  hours_monday_is_open: {
    type: 'boolean',
    value: true,
    smart_code: 'HERA.SALON.BRANCH.HOURS.MONDAY.IS_OPEN.v1'
  },
  // Repeat for tuesday, wednesday, thursday, friday, saturday, sunday
}
```

**File Path**: `/src/app/salon/settings/page.tsx:433-451`

---

## 🧩 Components

### Settings Page

**File**: `/src/app/salon/settings/page.tsx` (1,329 lines)

**Key Sections**:

**1. Premium Mobile Header**:
```tsx
<PremiumMobileHeader
  title="Settings"
  subtitle={organizationName || 'System Configuration'}
  showNotifications={false}
  shrinkOnScroll
  rightAction={
    <button onClick={() => window.location.reload()}>
      <RefreshCw className="w-5 h-5" />
    </button>
  }
/>
```

**2. Tab Navigation**:
```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList className="grid grid-cols-2 md:flex gap-2">
    <TabsTrigger value="general">
      <Settings className="w-4 h-4 mr-2" />
      General
    </TabsTrigger>
    <TabsTrigger value="users">
      <Users className="w-4 h-4 mr-2" />
      Users
    </TabsTrigger>
    <TabsTrigger value="security">
      <Shield className="w-4 h-4 mr-2" />
      Security
    </TabsTrigger>
    <TabsTrigger value="integrations">
      <Key className="w-4 h-4 mr-2" />
      Integrations
    </TabsTrigger>
  </TabsList>
</Tabs>
```

**3. Organization Info Card**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Organization Information</CardTitle>
    <CardDescription>Basic information about your organization</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label>Organization Name</Label>
        <Input
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          className="min-h-[44px]"
        />
      </div>
      {/* More fields... */}
    </div>
    <div className="flex justify-end">
      <SalonLuxeButton
        onClick={handleSaveOrganizationSettings}
        disabled={isSaving}
        loading={isSaving}
      >
        Save Changes
      </SalonLuxeButton>
    </div>
  </CardContent>
</Card>
```

**File Path**: `/src/app/salon/settings/page.tsx:486-729`

---

## ⏰ Business Hours Management

### Architecture

**Branch-Specific Hours**:
- Each branch has its own operating hours
- Hours stored in branch entity's dynamic data
- Separate fields for each day of the week
- Open/close times + isOpen flag

**View/Edit Modes**:
- **View Mode**: Read-only display with styled clock badges
- **Edit Mode**: Editable time inputs with switch toggles
- **Cancel**: Discard changes and reload from database
- **Save**: Persist changes to branch entity

### Implementation

**Loading Hours from Branch**:
```typescript
useEffect(() => {
  const loadBusinessHours = () => {
    if (!selectedBranchId || branches.length === 0) return

    const branch = branches.find((b: any) => b.id === selectedBranchId)
    if (!branch) return

    // Try multiple sources with priority order:
    // 1. Top-level properties (flattened by SecuredSalonProvider)
    // 2. Metadata object
    // 3. Dynamic fields array (if not yet flattened)
    // 4. Fallback defaults
    const opening_time_value =
      branch.opening_time ||
      branch.metadata?.opening_time ||
      branch.dynamic_fields?.find((f: any) => f.field_name === 'opening_time')?.field_value_text ||
      '09:00'

    const closing_time_value =
      branch.closing_time ||
      branch.metadata?.closing_time ||
      branch.dynamic_fields?.find((f: any) => f.field_name === 'closing_time')?.field_value_text ||
      '18:00'

    // Load per-day hours
    const hoursData: Record<string, { open: string; close: string; isOpen: boolean }> = {}
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

    days.forEach(day => {
      const openField = branch.dynamic_fields?.find((f: any) => f.field_name === `hours_${day}_open`)
      const closeField = branch.dynamic_fields?.find((f: any) => f.field_name === `hours_${day}_close`)
      const isOpenField = branch.dynamic_fields?.find((f: any) => f.field_name === `hours_${day}_is_open`)

      hoursData[day] = {
        open: openField?.field_value_text || opening_time_value,
        close: closeField?.field_value_text || closing_time_value,
        isOpen: isOpenField?.field_value_boolean !== false
      }
    })

    setBusinessHours(hoursData)
  }

  loadBusinessHours()
}, [selectedBranchId, branches])
```

**File Path**: `/src/app/salon/settings/page.tsx:356-419`

---

**Saving Hours to Branch**:
```typescript
const handleSaveBusinessHours = async () => {
  if (!selectedBranchId || !organizationId || !user?.id) {
    showError('Error', 'Missing required information')
    return
  }

  const loadingId = showLoading('Saving business hours...', 'Updating branch operating hours')
  setIsSavingHours(true)

  try {
    // Build dynamic fields for all days
    const dynamicFields: Record<string, any> = {}

    Object.entries(businessHours).forEach(([day, hours]) => {
      dynamicFields[`hours_${day}_open`] = {
        type: 'text',
        value: hours.open,
        smart_code: `HERA.SALON.BRANCH.HOURS.${day.toUpperCase()}.OPEN.v1`
      }
      dynamicFields[`hours_${day}_close`] = {
        type: 'text',
        value: hours.close,
        smart_code: `HERA.SALON.BRANCH.HOURS.${day.toUpperCase()}.CLOSE.v1`
      }
      dynamicFields[`hours_${day}_is_open`] = {
        type: 'boolean',
        value: hours.isOpen,
        smart_code: `HERA.SALON.BRANCH.HOURS.${day.toUpperCase()}.IS_OPEN.v1`
      }
    })

    await entityCRUD({
      p_action: 'UPDATE',
      p_actor_user_id: user.id,
      p_organization_id: organizationId,
      p_entity: {
        entity_id: selectedBranchId,
        entity_type: 'BRANCH'
      },
      p_dynamic: dynamicFields,
      p_relationships: [],
      p_options: {
        include_dynamic: true
      }
    })

    removeToast(loadingId)
    showSuccess('Business hours saved', 'Branch operating hours have been updated')
  } catch (error: any) {
    console.error('[Settings] Error saving business hours:', error)
    removeToast(loadingId)
    showError('Failed to save hours', error.message || 'Please try again')
  } finally {
    setIsSavingHours(false)
  }
}
```

**File Path**: `/src/app/salon/settings/page.tsx:421-483`

---

**View Mode Display**:
```tsx
{hours.isOpen ? (
  // ✅ VIEW MODE: Read-only display
  <div className="flex items-center gap-2 flex-1">
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: LUXE_COLORS.charcoal.light }}>
      <Clock className="w-4 h-4" style={{ color: LUXE_COLORS.gold.base }} />
      <span className="text-sm font-medium" style={{ color: LUXE_COLORS.champagne.base }}>
        {hours.open}
      </span>
    </div>
    <span className="text-sm font-medium" style={{ color: LUXE_COLORS.text.secondary }}>
      to
    </span>
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: LUXE_COLORS.charcoal.light }}>
      <Clock className="w-4 h-4" style={{ color: LUXE_COLORS.gold.base }} />
      <span className="text-sm font-medium" style={{ color: LUXE_COLORS.champagne.base }}>
        {hours.close}
      </span>
    </div>
  </div>
) : (
  <div className="flex-1 flex items-center ml-4">
    <span className="text-sm font-medium italic" style={{ color: LUXE_COLORS.text.tertiary }}>
      Closed
    </span>
  </div>
)}
```

**File Path**: `/src/app/salon/settings/page.tsx:854-873`

---

**Edit Mode Display**:
```tsx
{hours.isOpen && isEditingHours && (
  // ✅ EDIT MODE: Editable time inputs
  <div className="flex items-center gap-2 flex-1">
    <div className="flex-1 salon-time-input-wrapper">
      <SalonLuxeInput
        type="time"
        value={hours.open}
        onChange={(e) =>
          setBusinessHours(prev => ({
            ...prev,
            [day]: { ...prev[day], open: e.target.value }
          }))
        }
        leftIcon={<Clock className="w-4 h-4" />}
      />
    </div>
    <span className="text-sm font-medium" style={{ color: LUXE_COLORS.text.secondary }}>
      to
    </span>
    <div className="flex-1 salon-time-input-wrapper">
      <SalonLuxeInput
        type="time"
        value={hours.close}
        onChange={(e) =>
          setBusinessHours(prev => ({
            ...prev,
            [day]: { ...prev[day], close: e.target.value }
          }))
        }
        leftIcon={<Clock className="w-4 h-4" />}
      />
    </div>
  </div>
)}
```

**File Path**: `/src/app/salon/settings/page.tsx:821-853`

---

## 👥 User Management

### User Listing

**Features**:
- User cards with avatars (initials)
- Role badges (Owner, Admin, Receptionist, Accountant)
- Active status indicators (green pulsing dot)
- Last activity timestamps
- User statistics (Total, Active, Inactive)

**Display**:
```tsx
{[
  {
    name: 'Michele Rodriguez',
    email: 'owner@hairtalkz.ae',
    role: 'Owner',
    status: 'Active',
    initials: 'MR',
    lastActive: '2 hours ago'
  },
  // ... more users
].map(user => (
  <div className="group p-4 rounded-xl transition-all hover:scale-[1.02]">
    <div className="flex items-center gap-4">
      {/* Avatar with gradient */}
      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold">
        {user.initials}
      </div>

      {/* User Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold">{user.name}</h4>
          <span className="text-xs px-2 py-0.5 rounded-full">{user.role}</span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-sm">{user.email}</p>
          <span className="text-xs">• {user.lastActive}</span>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg">
        <div className="w-2 h-2 rounded-full animate-pulse bg-emerald" />
        <span className="text-xs font-medium">{user.status}</span>
      </div>
    </div>
  </div>
))}
```

**File Path**: `/src/app/salon/settings/page.tsx:975-1078`

---

### User Statistics

```tsx
<div className="grid grid-cols-3 gap-4 text-center">
  <div>
    <p className="text-2xl font-bold" style={{ color: LUXE_COLORS.gold.base }}>4</p>
    <p className="text-xs mt-1">Total Users</p>
  </div>
  <div>
    <p className="text-2xl font-bold" style={{ color: LUXE_COLORS.emerald.base }}>4</p>
    <p className="text-xs mt-1">Active Now</p>
  </div>
  <div>
    <p className="text-2xl font-bold">0</p>
    <p className="text-xs mt-1">Inactive</p>
  </div>
</div>
```

**File Path**: `/src/app/salon/settings/page.tsx:1082-1103`

---

## 🔒 Security Settings

### Password Policy

**Configuration**:
- Minimum password length (number input)
- Require uppercase letters (switch)
- Require special characters (switch)
- Require numbers (switch)

**Display**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Password Policy</CardTitle>
    <CardDescription>Configure password requirements</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center justify-between py-2">
      <Label>Minimum password length</Label>
      <Input type="number" defaultValue="8" className="w-20 min-h-[44px]" />
    </div>
    <div className="flex items-center justify-between py-2">
      <Label>Require uppercase letters</Label>
      <Switch defaultChecked />
    </div>
    <div className="flex items-center justify-between py-2">
      <Label>Require special characters</Label>
      <Switch defaultChecked />
    </div>
    <div className="flex items-center justify-between py-2">
      <Label>Require numbers</Label>
      <Switch defaultChecked />
    </div>
  </CardContent>
</Card>
```

**File Path**: `/src/app/salon/settings/page.tsx:1111-1155`

---

### Session Management

**Configuration**:
- Session timeout (minutes input)
- Two-factor authentication (switch)

**Display**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Session Management</CardTitle>
    <CardDescription>Configure session timeout and security settings</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center justify-between py-2">
      <Label>Session timeout (minutes)</Label>
      <Input type="number" defaultValue="30" className="w-20 min-h-[44px]" />
    </div>
    <div className="flex items-center justify-between py-2">
      <Label>Enable two-factor authentication</Label>
      <Switch />
    </div>
    <div className="flex justify-end pt-4">
      <SalonLuxeButton icon={<Save />}>
        Save Security Settings
      </SalonLuxeButton>
    </div>
  </CardContent>
</Card>
```

**File Path**: `/src/app/salon/settings/page.tsx:1158-1203`

---

## 🔌 Integration Settings

### API Key Management

**Features**:
- API key display (masked for security)
- API key regeneration button

**Display**:
```tsx
<div>
  <Label>API Key</Label>
  <div className="flex gap-2 mt-2">
    <Input
      defaultValue="sk_live_****************************"
      readOnly
      className="min-h-[44px]"
    />
    <SalonLuxeButton
      variant="outline"
      icon={<RefreshCw />}
      aria-label="Regenerate API Key"
    />
  </div>
</div>
```

---

### Active Integrations

**Features**:
- Integration status display (Connected/Not Connected)
- Emoji icons for visual identification
- Color-coded status (green for connected, gray for not connected)

**Integrations**:
- WhatsApp Business API 💬
- Payment Gateway 💳
- SMS Provider 📱
- Email Service ✉️

**Display**:
```tsx
<div className="space-y-2">
  {[
    { name: 'WhatsApp Business API', status: 'Connected', icon: '💬' },
    { name: 'Payment Gateway', status: 'Connected', icon: '💳' },
    { name: 'SMS Provider', status: 'Not Connected', icon: '📱' },
    { name: 'Email Service', status: 'Connected', icon: '✉️' }
  ].map(integration => (
    <div className="flex items-center justify-between p-3 rounded">
      <div className="flex items-center gap-3">
        <span>{integration.icon}</span>
        <span>{integration.name}</span>
      </div>
      <span style={{
        color: integration.status === 'Connected'
          ? LUXE_COLORS.emerald.base
          : LUXE_COLORS.text.secondary
      }}>
        {integration.status}
      </span>
    </div>
  ))}
</div>
```

**File Path**: `/src/app/salon/settings/page.tsx:1244-1278`

---

## 📝 Common Tasks

### Task 1: Update Organization Name

```typescript
// 1. Navigate to Settings → General tab
// 2. Edit organization name field
setOrganizationName('New Salon Name')

// 3. Click Save Changes
await handleSaveOrganizationSettings()

// Result: Organization name updated in core_dynamic_data
```

### Task 2: Configure Business Hours for Branch

```typescript
// 1. Navigate to Settings → General tab → Business Hours section
// 2. Select branch from dropdown
setSelectedBranchId('branch-uuid')

// 3. Click "Edit Hours" button
setIsEditingHours(true)

// 4. Modify hours for specific days
setBusinessHours(prev => ({
  ...prev,
  monday: { open: '08:00', close: '22:00', isOpen: true }
}))

// 5. Toggle closed days
setBusinessHours(prev => ({
  ...prev,
  sunday: { ...prev.sunday, isOpen: false }
}))

// 6. Save changes
await handleSaveBusinessHours()

// Result: Business hours updated in branch entity's dynamic data
```

### Task 3: Add New User (Placeholder)

```typescript
// 1. Navigate to Settings → Users tab
// 2. Click "Add User" button (currently placeholder)
// 3. Enter user details:
//    - Name
//    - Email
//    - Role (Owner/Admin/Receptionist/Accountant)
//    - Password
// 4. Save user

// Note: Full implementation pending
```

### Task 4: Update Password Policy

```typescript
// 1. Navigate to Settings → Security tab
// 2. Modify password requirements:
//    - Minimum length: 12
//    - Require uppercase: true
//    - Require special chars: true
//    - Require numbers: true
// 3. Click "Save Security Settings"

// Note: Backend validation pending
```

### Task 5: Regenerate API Key

```typescript
// 1. Navigate to Settings → Integrations tab
// 2. Click regenerate button next to API key
// 3. Confirm regeneration
// 4. Copy new API key

// Warning: Old API key will stop working immediately
```

---

## 🧪 Testing

### Unit Tests

**Test Organization Settings Save**:

```typescript
describe('handleSaveOrganizationSettings', () => {
  test('Saves organization settings via entityCRUD', async () => {
    const mockEntityCRUD = jest.fn().mockResolvedValue({
      data: {
        data: {
          dynamic_data: [
            { field_name: 'organization_name', field_value_text: 'New Name' }
          ]
        }
      }
    })

    await handleSaveOrganizationSettings()

    expect(mockEntityCRUD).toHaveBeenCalledWith({
      p_action: 'UPDATE',
      p_actor_user_id: 'user-uuid',
      p_organization_id: 'org-uuid',
      p_entity: { entity_id: 'org-uuid', entity_type: 'ORG' },
      p_dynamic: expect.objectContaining({
        organization_name: {
          type: 'text',
          value: 'New Name',
          smart_code: 'HERA.SALON.ORGANIZATION.FIELD.NAME.v1'
        }
      }),
      p_relationships: [],
      p_options: { include_dynamic: true }
    })
  })
})
```

### Integration Tests

**Test Business Hours Flow**:

```typescript
describe('Business Hours Management', () => {
  test('Loads, edits, and saves business hours', async () => {
    const { result } = renderHook(() => useBusinessHours())

    // Load branch
    act(() => {
      result.current.setSelectedBranchId('branch-1')
    })

    await waitFor(() => {
      expect(result.current.businessHours.monday.open).toBe('09:00')
    })

    // Edit hours
    act(() => {
      result.current.setIsEditingHours(true)
      result.current.setBusinessHours(prev => ({
        ...prev,
        monday: { open: '08:00', close: '21:00', isOpen: true }
      }))
    })

    // Save
    await act(async () => {
      await result.current.handleSaveBusinessHours()
    })

    // Verify save
    expect(mockEntityCRUD).toHaveBeenCalledWith({
      p_action: 'UPDATE',
      p_entity: { entity_id: 'branch-1', entity_type: 'BRANCH' },
      p_dynamic: expect.objectContaining({
        hours_monday_open: { type: 'text', value: '08:00' }
      })
    })
  })
})
```

### E2E Tests

**Test Settings Workflow**:

```typescript
describe('Settings Page E2E', () => {
  test('Updates organization settings end-to-end', async () => {
    await page.goto('/salon/settings')

    // Navigate to General tab
    await page.click('[data-testid="general-tab"]')

    // Edit organization name
    await page.fill('[name="organization_name"]', 'New Salon Name')

    // Save changes
    await page.click('[data-testid="save-settings-btn"]')

    // Verify success toast
    await expect(page.locator('text=Settings saved successfully')).toBeVisible()

    // Verify updated value persists
    await page.reload()
    await expect(page.locator('[name="organization_name"]')).toHaveValue('New Salon Name')
  })
})
```

---

## ⚠️ Known Issues

### Issue 1: RPC Format Confusion

**Problem**: RPC function expects `{ type: 'text', value: 'data' }` but developers often use `{ field_type: 'text', field_value_text: 'data' }`.

**Impact**: Settings save fails with cryptic error messages.

**Solution**: Always use the RPC format:
```typescript
// ✅ CORRECT (RPC format)
{
  organization_name: {
    type: 'text',
    value: 'HERA Salon',
    smart_code: 'HERA.SALON.ORGANIZATION.FIELD.NAME.v1'
  }
}

// ❌ WRONG (Entity format)
{
  organization_name: {
    field_type: 'text',
    field_value_text: 'HERA Salon',
    smart_code: 'HERA.SALON.ORGANIZATION.FIELD.NAME.v1'
  }
}
```

**Status**: Documented in code comments. RPC format is now standard.

**File Path**: `/src/app/salon/settings/page.tsx:182-183`

---

### Issue 2: Time Input Clock Icon Visibility

**Problem**: Browser's native time picker icon overlaps custom Clock icon in business hours inputs.

**Impact**: Visual confusion with two clock icons.

**Solution**: CSS workaround to hide native icon:
```css
.salon-time-input-wrapper input[type="time"]::-webkit-calendar-picker-indicator {
  opacity: 0;
  position: absolute;
  right: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.salon-time-input-wrapper .absolute {
  pointer-events: none;
  z-index: 10;
}
```

**Status**: Fixed in production. Native icon hidden, custom icon visible.

**File Path**: `/src/app/salon/settings/page.tsx:1296-1316`

---

### Issue 3: Settings Context Refresh Delay

**Problem**: After saving settings, SecuredSalonProvider takes 1-2 seconds to refresh context.

**Impact**: User sees old values briefly after save.

**Workaround**: Settings page immediately updates form state from RPC response:
```typescript
if (result?.data?.data?.dynamic_data) {
  const updatedFields = transformDynamicData(result.data.data.dynamic_data)
  if (updatedFields.organization_name) setOrganizationName(updatedFields.organization_name)
  if (updatedFields.legal_name) setLegalName(updatedFields.legal_name)
  // ... etc
}
```

**Status**: Workaround in place. Instant visual feedback for users.

**File Path**: `/src/app/salon/settings/page.tsx:270-303`

---

## 📚 Additional Resources

### Related Features

- [STAFF.md](./STAFF.md) - Staff management (user roles derived from staff entities)
- [DASHBOARD.md](./DASHBOARD.md) - Dashboard (displays organization name)
- [REPORTS.md](./REPORTS.md) - Reports (currency symbol from settings)

### Technical References

- [HOOKS.md](./HOOKS.md) - Custom hooks reference
- [DATA-MODELS.md](./DATA-MODELS.md) - Sacred Six schema
- [MOBILE-LAYOUT.md](./MOBILE-LAYOUT.md) - Mobile-first design patterns

### External Documentation

- [HERA DNA Smart Codes](../../../docs/playbooks/_shared/SMART_CODE_GUIDE.md)
- [Universal API V2 Patterns](../../../docs/dna/UNIVERSAL-API-V2-RPC-PATTERNS.md)

---

<div align="center">

**Built with HERA DNA** | **Settings v1.0 (Production Ready)**

[← Back to Developer Guide](../DEVELOPER-GUIDE.md) | [Reports ←](./REPORTS.md)

**For Support**: Check [Known Issues](#known-issues) or contact HERA development team

</div>
