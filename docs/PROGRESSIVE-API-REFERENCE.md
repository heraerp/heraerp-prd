# Progressive Authentication API Reference

## 🔌 API Endpoints and Integration

This document provides complete API reference for HERA's Progressive Authentication system.

## 🌐 Core API Endpoints

### **Progressive Workspace Management**

#### `POST /api/v1/progressive/workspace/create`
Creates a new progressive workspace for anonymous users.

**Request Body:**
```typescript
{
  organization_name: string;
  workspace_type?: 'anonymous' | 'demo';
  initial_data?: Record<string, any>;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    workspace_id: string;
    organization_id: string;
    organization_name: string;
    type: 'anonymous';
    created_at: string;
    expires_at: string;
  };
}
```

**Example:**
```javascript
const response = await fetch('/api/v1/progressive/workspace/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    organization_name: 'My Business',
    workspace_type: 'anonymous'
  })
})
```

---

#### `POST /api/v1/progressive/workspace/identify`
Links an anonymous workspace to an email address.

**Request Body:**
```typescript
{
  workspace_id: string;
  email: string;
  organization_name?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    workspace_id: string;
    organization_id: string;
    email: string;
    type: 'identified';
    updated_at: string;
  };
}
```

---

#### `POST /api/v1/progressive/workspace/register`
Completes full user registration for an identified workspace.

**Request Body:**
```typescript
{
  workspace_id: string;
  email: string;
  password: string;
  full_name: string;
  business_name?: string;
  business_type?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      user_metadata: {
        full_name: string;
        business_name: string;
        business_type: string;
      };
    };
    session: {
      access_token: string;
      refresh_token: string;
      expires_at: number;
    };
    workspace: {
      workspace_id: string;
      organization_id: string;
      type: 'registered';
    };
  };
}
```

---

### **Data Persistence API**

#### `GET /api/v1/progressive/data/:organization_id`
Retrieves workspace data for an organization.

**Parameters:**
- `organization_id`: Unique organization identifier

**Headers:**
```
Authorization: Bearer <access_token> (for registered users)
X-Workspace-ID: <workspace_id> (for anonymous users)
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    organization_id: string;
    workspace_data: Record<string, any>;
    last_updated: string;
  };
}
```

---

#### `POST /api/v1/progressive/data/:organization_id`
Saves workspace data for an organization.

**Request Body:**
```typescript
{
  workspace_data: Record<string, any>;
  merge_strategy?: 'replace' | 'merge' | 'append';
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    saved_at: string;
    data_size_bytes: number;
  };
}
```

---

### **Authentication Status API**

#### `GET /api/v1/progressive/auth/status`
Gets current authentication status and workspace information.

**Headers:**
```
Authorization: Bearer <access_token> (optional)
X-Workspace-ID: <workspace_id> (optional)
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    authenticated: boolean;
    user?: {
      id: string;
      email: string;
      user_metadata: Record<string, any>;
    };
    workspace?: {
      workspace_id: string;
      organization_id: string;
      type: 'anonymous' | 'identified' | 'registered';
      created_at: string;
      expires_at?: string;
    };
  };
}
```

---

## 🎣 React Hooks Reference

### `useProgressiveAuth()`
Primary hook for accessing progressive authentication state.

**Returns:**
```typescript
{
  // Authentication state
  supabaseUser: User | null;
  authState: AuthState;
  isAnonymous: boolean;
  isIdentified: boolean;
  isRegistered: boolean;
  isLoading: boolean;

  // Workspace data
  workspace: ProgressiveWorkspace | null;

  // Actions
  initializeAnonymous: (orgName: string) => Promise<void>;
  captureEmail: (email: string) => Promise<void>;
  completeRegistration: (data: RegistrationData) => Promise<void>;
  logout: () => Promise<void>;
}
```

**Usage Example:**
```tsx
function MyComponent() {
  const { 
    workspace, 
    isAnonymous, 
    captureEmail, 
    completeRegistration 
  } = useProgressiveAuth()

  const handleSaveWorkspace = async () => {
    if (isAnonymous) {
      await captureEmail('user@example.com')
    }
  }

  return (
    <div>
      {workspace ? (
        <p>Organization: {workspace.organization_name}</p>
      ) : (
        <p>Setting up workspace...</p>
      )}
    </div>
  )
}
```

---

### `useProgressiveData<T>(key: string, initialData: T)`
Hook for managing progressive data with localStorage persistence.

**Parameters:**
- `key`: Unique key for data storage
- `initialData`: Default value if no data exists

**Returns:**
```typescript
[
  data: T,
  setData: (newData: T) => void,
  loading: boolean,
  error: Error | null
]
```

**Usage Example:**
```tsx
function InventoryManager() {
  const [inventory, setInventory, loading] = useProgressiveData(
    'inventory_items',
    []
  )

  const addItem = (item: InventoryItem) => {
    setInventory([...inventory, item])
  }

  if (loading) return <div>Loading inventory...</div>

  return (
    <div>
      {inventory.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  )
}
```

---

## 📱 Component Reference

### `<ProgressiveAuthProvider>`
Root provider component that wraps your entire application.

**Props:**
```typescript
{
  children: React.ReactNode;
  config?: {
    workspaceExpiry?: number; // milliseconds
    autoSave?: boolean;
    enableAnalytics?: boolean;
  };
}
```

**Usage:**
```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ProgressiveAuthProvider
          config={{
            workspaceExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
            autoSave: true,
            enableAnalytics: true
          }}
        >
          {children}
        </ProgressiveAuthProvider>
      </body>
    </html>
  )
}
```

---

### `<ProgressiveBanner>`
Always-visible banner for workspace management and authentication progression.

**Props:**
```typescript
{
  position?: 'top' | 'bottom';
  theme?: 'light' | 'dark' | 'auto';
  showWorkspaceInfo?: boolean;
  customActions?: React.ReactNode;
}
```

**Usage:**
```tsx
function MyApp() {
  return (
    <div>
      <ProgressiveBanner 
        position="top"
        theme="auto"
        showWorkspaceInfo={true}
      />
      {/* Rest of your app */}
    </div>
  )
}
```

---

## 🛠️ Utility Functions

### `createProgressiveWorkspace(orgName: string)`
Programmatically create a new progressive workspace.

```typescript
import { createProgressiveWorkspace } from '@/lib/progressive-auth'

async function initializeWorkspace() {
  try {
    const workspace = await createProgressiveWorkspace('My Business')
    console.log('Workspace created:', workspace.workspace_id)
  } catch (error) {
    console.error('Failed to create workspace:', error)
  }
}
```

---

### `saveProgressiveData(key: string, data: any)`
Save data to current progressive workspace.

```typescript
import { saveProgressiveData } from '@/lib/progressive-auth'

async function saveCustomerData(customers: Customer[]) {
  try {
    await saveProgressiveData('customers', customers)
    console.log('Customer data saved successfully')
  } catch (error) {
    console.error('Failed to save customer data:', error)
  }
}
```

---

### `loadProgressiveData<T>(key: string, fallback: T): Promise<T>`
Load data from current progressive workspace.

```typescript
import { loadProgressiveData } from '@/lib/progressive-auth'

async function loadCustomers(): Promise<Customer[]> {
  try {
    const customers = await loadProgressiveData('customers', [])
    return customers
  } catch (error) {
    console.error('Failed to load customers:', error)
    return []
  }
}
```

---

## 🎯 TypeScript Interfaces

### Core Types
```typescript
interface ProgressiveWorkspace {
  id: string;
  type: 'anonymous' | 'identified' | 'registered';
  organization_id: string;
  organization_name: string;
  email?: string;
  data_status: 'sample' | 'real';
  created_at: string;
  last_active: string;
  expires_at?: string;
}

interface AuthState {
  workspace: ProgressiveWorkspace | null;
  status: 'initializing' | 'anonymous' | 'identified' | 'registered';
  loading: boolean;
  error: string | null;
}

interface RegistrationData {
  email: string;
  password: string;
  full_name: string;
  business_name?: string;
  business_type?: string;
}

interface ProgressiveUser {
  id: string;
  name: string;
  email: string;
  organizationId: string;
  organizationName: string;
  authState: 'anonymous' | 'identified' | 'registered';
}
```

### System-Specific Types
```typescript
// CRM Progressive
interface CRMProgressiveData {
  leads: Lead[];
  companies: Company[];
  deals: Deal[];
  activities: Activity[];
  settings: CRMSettings;
}

// Audit Progressive  
interface AuditProgressiveData {
  clients: AuditClient[];
  documents: DocumentRequisition[];
  engagements: Engagement[];
  workpapers: Workpaper[];
}

// Jewelry Progressive
interface JewelryProgressiveData {
  inventory: JewelryItem[];
  customers: JewelryCustomer[];
  transactions: JewelryTransaction[];
  analytics: JewelryAnalytics;
}
```

---

## 🔐 Security Considerations

### Anonymous User Security
```typescript
// Anonymous users have limited data access
const ANONYMOUS_LIMITS = {
  maxDataSize: 10 * 1024 * 1024, // 10MB
  maxWorkspaceAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  restrictedFeatures: ['export', 'collaboration', 'integrations']
}
```

### Data Encryption
```typescript
// Sensitive data is encrypted in localStorage
import { encryptData, decryptData } from '@/lib/encryption'

// Automatic encryption for sensitive fields
const ENCRYPTED_FIELDS = [
  'customer_ssn',
  'bank_account',
  'credit_card',
  'private_notes'
]
```

### Rate Limiting
```typescript
// API rate limits by user type
const RATE_LIMITS = {
  anonymous: {
    requests_per_minute: 30,
    data_saves_per_hour: 10
  },
  identified: {
    requests_per_minute: 60,
    data_saves_per_hour: 30
  },
  registered: {
    requests_per_minute: 300,
    data_saves_per_hour: 1000
  }
}
```

---

## 📊 Analytics Events

### Automatic Events
```typescript
// Tracked automatically by ProgressiveAuthProvider
interface ProgressiveAnalyticsEvents {
  'progressive_workspace_created': {
    workspace_id: string;
    organization_name: string;
    type: 'anonymous';
  };
  
  'progressive_email_captured': {
    workspace_id: string;
    time_to_capture_seconds: number;
    system_used: string;
  };
  
  'progressive_registration_completed': {
    workspace_id: string;
    time_to_register_seconds: number;
    systems_used: string[];
  };
  
  'progressive_data_saved': {
    workspace_id: string;
    data_type: string;
    data_size_bytes: number;
  };
}
```

### Custom Analytics
```typescript
import { trackProgressiveEvent } from '@/lib/progressive-analytics'

// Track custom business events
trackProgressiveEvent('crm_lead_created', {
  lead_source: 'website',
  lead_value: 5000,
  user_type: 'anonymous'
})

trackProgressiveEvent('jewelry_sale_completed', {
  sale_amount: 2500,
  payment_method: 'credit_card',
  customer_type: 'vip'
})
```

---

## 🚀 Performance Optimization

### Lazy Loading
```typescript
// Progressive systems are lazy-loaded
const CRMProgressive = lazy(() => 
  import('@/components/crm-progressive/CRMDashboard')
)

const AuditProgressive = lazy(() => 
  import('@/components/audit/AuditDashboard')
)
```

### Data Caching
```typescript
// React Query integration for progressive data
import { useQuery } from '@tanstack/react-query'

function useProgressiveQuery<T>(key: string, fetcher: () => Promise<T>) {
  return useQuery({
    queryKey: ['progressive', key],
    queryFn: fetcher,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  })
}
```

### Bundle Size Optimization
```typescript
// Code splitting by progressive system
const progressiveSystemImports = {
  'crm-progressive': () => import('@/systems/crm-progressive'),
  'audit-progressive': () => import('@/systems/audit-progressive'),
  'jewelry-progressive': () => import('@/systems/jewelry-progressive'),
}
```

---

## 🛡️ Error Handling

### API Error Responses
```typescript
interface ProgressiveAPIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

// Common error codes
const ERROR_CODES = {
  WORKSPACE_NOT_FOUND: 'WORKSPACE_NOT_FOUND',
  WORKSPACE_EXPIRED: 'WORKSPACE_EXPIRED',
  DATA_SIZE_EXCEEDED: 'DATA_SIZE_EXCEEDED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  INVALID_WORKSPACE_TYPE: 'INVALID_WORKSPACE_TYPE'
}
```

### Error Handling Example
```typescript
try {
  await captureEmail('user@example.com')
} catch (error) {
  if (error.code === 'EMAIL_ALREADY_EXISTS') {
    // Handle duplicate email
    showError('This email is already registered. Please sign in instead.')
  } else if (error.code === 'WORKSPACE_EXPIRED') {
    // Handle expired workspace
    showError('Your workspace has expired. Starting a new session...')
    await initializeAnonymous('My Business')
  } else {
    // Handle generic error
    showError('Something went wrong. Please try again.')
  }
}
```

---

## 🧪 Testing Utilities

### Test Helpers
```typescript
// Test utilities for progressive authentication
export function createMockWorkspace(
  type: 'anonymous' | 'identified' | 'registered' = 'anonymous'
): ProgressiveWorkspace {
  return {
    id: 'test-workspace-123',
    type,
    organization_id: 'test-org-456', 
    organization_name: 'Test Business',
    email: type !== 'anonymous' ? 'test@example.com' : undefined,
    data_status: 'sample',
    created_at: new Date().toISOString(),
    last_active: new Date().toISOString()
  }
}

export function MockProgressiveAuthProvider({ 
  children, 
  workspace = createMockWorkspace() 
}) {
  return (
    <ProgressiveAuthContext.Provider value={{
      workspace,
      isAnonymous: workspace.type === 'anonymous',
      isLoading: false,
      // ... other mock values
    }}>
      {children}
    </ProgressiveAuthContext.Provider>
  )
}
```

### Testing Progressive Components
```typescript
import { render, screen } from '@testing-library/react'
import { MockProgressiveAuthProvider, createMockWorkspace } from '@/test-utils'

describe('CRM Progressive Dashboard', () => {
  it('renders for anonymous users', () => {
    render(
      <MockProgressiveAuthProvider workspace={createMockWorkspace('anonymous')}>
        <CRMDashboard />
      </MockProgressiveAuthProvider>
    )
    
    expect(screen.getByText(/anonymous workspace/i)).toBeInTheDocument()
  })

  it('shows registration prompt for anonymous users', () => {
    render(
      <MockProgressiveAuthProvider workspace={createMockWorkspace('anonymous')}>
        <CRMDashboard />
      </MockProgressiveAuthProvider>
    )
    
    expect(screen.getByText(/save your work/i)).toBeInTheDocument()
  })
})
```

---

**🎯 Complete API Coverage**: This reference covers all progressive authentication APIs, hooks, components, and utilities needed to build and integrate with HERA's progressive systems.

*Use this reference when building new progressive systems or integrating with existing ones.*