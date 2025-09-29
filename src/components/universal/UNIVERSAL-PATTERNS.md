# Universal HERA Patterns & Best Practices

> **Based on lessons learned building the restaurant management system**  
> A comprehensive guide to avoid common pitfalls and ensure consistent, high-quality implementations.

## 🎯 **Overview**

This document captures the key learnings, mistakes, and solutions from building the HERA restaurant system. By following these patterns, future implementations will avoid the same issues and maintain consistency across the platform.

---

## 🔐 **Authentication & State Management**

### ❌ **Common Mistakes We Made**

1. **Excessive API calls** - Auth context was fetched on every navigation
2. **Race conditions** - Multiple auth checks happening simultaneously
3. **Poor loading states** - Brief login screens appeared during navigation
4. **No caching** - Same context fetched repeatedly
5. **Overly aggressive state changes** - Token refresh triggered full re-authentication

### ✅ **Best Practices Learned**

#### **Use Caching & Throttling**

```typescript
// ❌ Bad: Always fetch fresh
const loadContext = async () => {
  const context = await api.getHeraContext()
  setContext(context)
}

// ✅ Good: Cache with TTL
const loadContext = async () => {
  const now = Date.now()
  if (context && now - lastFetch < CACHE_DURATION) {
    console.log('Using cached context')
    return
  }
  // ... fetch logic
}
```

#### **Smart Auth State Handling**

```typescript
// ❌ Bad: Strict authentication check
const isAuthenticated = !!session && !!heraContext

// ✅ Good: Resilient during loading
const isAuthenticated = !!session && (!!heraContext || (isHeraLoading && lastFetch > 0))
```

#### **Differentiate Auth Events**

```typescript
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN') {
    await loadHeraContext(session.user)
  } else if (event === 'TOKEN_REFRESHED') {
    // ✅ Don't reload context on token refresh
    console.log('Token refreshed - keeping context')
  } else if (event === 'USER_UPDATED') {
    // ✅ Only refresh if cache expired
    if (!isCacheValid) {
      await refreshHeraContext()
    }
  }
})
```

---

## 🌐 **API Client Design**

### ❌ **Common Mistakes We Made**

1. **No retry logic** - Single failures caused complete breakdowns
2. **Poor error handling** - Generic error messages with no context
3. **No request deduplication** - Same requests fired multiple times
4. **Missing timeouts** - Hanging requests with no feedback
5. **Inconsistent response formats** - Different APIs returned different structures

### ✅ **Best Practices Learned**

#### **Implement Exponential Backoff**

```typescript
// ✅ Retry with exponential backoff
for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  try {
    return await makeRequest()
  } catch (error) {
    if (attempt === maxAttempts) throw error

    const delay = retryDelay * Math.pow(retryMultiplier, attempt - 1)
    await sleep(delay)
  }
}
```

#### **Request Deduplication**

```typescript
// ✅ Prevent duplicate requests
if (this.pendingRequests.has(cacheKey)) {
  return await this.pendingRequests.get(cacheKey)!
}

const requestPromise = this.executeRequest(url)
this.pendingRequests.set(cacheKey, requestPromise)
```

#### **Consistent Response Format**

```typescript
// ✅ Always return consistent format
interface APIResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  count?: number
}
```

---

## 📝 **Form Components & Modal Visibility**

### ❌ **Common Mistakes We Made**

1. **Shadcn/ui in modals** - Components had poor visibility in modal overlays
2. **Inconsistent styling** - Mixed component libraries caused styling conflicts
3. **Missing accessibility** - No proper labels, ARIA attributes
4. **Poor validation feedback** - Errors not clearly associated with fields
5. **No loading states** - Forms felt unresponsive during submission

### ✅ **Best Practices Learned**

#### **Always Use Native HTML in Modals**

```tsx
// ❌ Bad: Shadcn components in modals
<Label htmlFor="name">Name</Label>
<Input id="name" value={name} onChange={setName} />

// ✅ Good: Native HTML with explicit styling
<label htmlFor="name" className="block text-sm font-medium ink mb-1">
  Name *
</label>
<input
  id="name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ink"
/>
```

#### **Consistent Modal Structure**

```tsx
// ✅ Standard modal with proper contrast
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
  <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
    <div className="bg-white p-6 overflow-y-auto max-h-[90vh]">
      {/* Always explicit bg-white for visibility */}
    </div>
  </div>
</div>
```

#### **Form Validation Patterns**

```tsx
// ✅ Comprehensive form state management
const { values, errors, touched, setValue, validate } = useFormState({
  name: '',
  email: '',
  price: ''
})

const validationRules = {
  name: [FormValidation.required],
  email: [FormValidation.required, FormValidation.email],
  price: [FormValidation.required, FormValidation.number, FormValidation.positive]
}
```

---

## 🎨 **Loading States & Error Handling**

### ❌ **Common Mistakes We Made**

1. **Generic loading screens** - Same loader for all contexts
2. **No timeout handling** - Infinite loading with no escape
3. **Poor error boundaries** - App crashes instead of graceful degradation
4. **Missing offline states** - No network status awareness
5. **Confusing loading transitions** - Users unsure if app was working

### ✅ **Best Practices Learned**

#### **Context-Specific Loading States**

```tsx
// ✅ Different loading states for different contexts
if (isInitialLoading) {
  return <UniversalFullPageLoading title="Loading HERA..." />
}

if (isNavigationLoading) {
  return <UniversalInlineLoading size="sm" />
}

if (isDataLoading) {
  return <UniversalCardSkeleton count={3} />
}
```

#### **Timeout & Error Recovery**

```tsx
// ✅ Loading with timeout and recovery
<UniversalFullPageLoading
  title="Loading..."
  timeout={5000}
  onTimeout={() => {
    // Show recovery options
    setShowRecoveryOptions(true)
  }}
/>
```

#### **Error Boundaries Everywhere**

```tsx
// ✅ Wrap components in error boundaries
<UniversalErrorBoundary
  onError={(error, errorInfo) => {
    console.error('Component error:', error)
    // Send to error tracking service
  }}
  fallback={<ErrorFallback />}
>
  <YourComponent />
</UniversalErrorBoundary>
```

---

## 🗄️ **Database & Universal API Patterns**

### ❌ **Common Mistakes We Made**

1. **Missing foreign key constraints** - Data integrity issues
2. **Nullable required fields** - Runtime errors from unexpected nulls
3. **Inconsistent API responses** - Different endpoints returned different formats
4. **No input validation** - SQL injection and data corruption risks
5. **Poor error messages** - Generic database errors exposed to users

### ✅ **Best Practices Learned**

#### **Universal Entity Pattern**

```typescript
// ✅ Consistent entity creation
const createEntity = async (data: EntityInput) => {
  // Validate input
  const validation = validateEntityInput(data)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  // Create in core_entities
  const entity = await createCoreEntity(data)

  // Create dynamic properties
  if (data.properties) {
    await createDynamicProperties(entity.id, data.properties)
  }

  return { success: true, data: entity }
}
```

#### **Proper Error Handling**

```typescript
// ✅ Map database errors to user-friendly messages
const handleDatabaseError = (error: any) => {
  if (error.code === '23502') {
    return 'Required field is missing'
  } else if (error.code === '23503') {
    return 'Referenced item does not exist'
  } else if (error.code === '23505') {
    return 'Item already exists'
  }
  return 'Database operation failed'
}
```

---

## 🏗️ **Component Architecture**

### ❌ **Common Mistakes We Made**

1. **Tightly coupled components** - Hard to reuse across different contexts
2. **Props drilling** - Passing data through multiple levels
3. **Mixed concerns** - UI, business logic, and data fetching in same component
4. **No composition patterns** - Monolithic components that can't be customized
5. **Inconsistent patterns** - Each component implemented differently

### ✅ **Best Practices Learned**

#### **Composition Over Inheritance**

```tsx
// ✅ Composable components
<UniversalForm onSubmit={handleSubmit}>
  <UniversalFieldGroup title="Basic Information">
    <UniversalInput
      name="name"
      label="Name"
      value={values.name}
      onChange={value => setValue('name', value)}
      error={errors.name}
      required
    />
  </UniversalFieldGroup>

  <div className="flex gap-3">
    <UniversalButton type="submit" loading={isSubmitting}>
      Submit
    </UniversalButton>
    <UniversalButton variant="secondary" onClick={onCancel}>
      Cancel
    </UniversalButton>
  </div>
</UniversalForm>
```

#### **Separation of Concerns**

```tsx
// ✅ Separate data, logic, and presentation
const useMenuItems = () => {
  // Data fetching & state management
}

const MenuLogic = () => {
  // Business logic & event handlers
}

const MenuPresentation = ({ items, onEdit, onDelete }) => {
  // Pure UI rendering
}
```

---

## 📱 **Performance & Optimization**

### ❌ **Common Mistakes We Made**

1. **No memoization** - Unnecessary re-renders on every state change
2. **Large bundle sizes** - Importing entire libraries for small features
3. **No lazy loading** - All components loaded upfront
4. **Inefficient queries** - N+1 problems and overfetching
5. **No caching strategy** - Same data fetched repeatedly

### ✅ **Best Practices Learned**

#### **Smart Caching Strategy**

```typescript
// ✅ Multi-level caching
const cacheStrategy = {
  // Memory cache for immediate responses
  memory: new Map(),
  // Session storage for page reloads
  session: sessionStorage,
  // Local storage for persistence
  local: localStorage
}
```

#### **Optimistic Updates**

```tsx
// ✅ Immediate UI feedback
const updateItem = async (item: Item) => {
  // Update UI immediately
  setItems(prev => prev.map(i => (i.id === item.id ? item : i)))

  try {
    await api.updateItem(item)
  } catch (error) {
    // Revert on failure
    setItems(prev => prev.map(i => (i.id === item.id ? originalItem : i)))
    showError('Update failed')
  }
}
```

---

## 🛡️ **Security & Validation**

### ❌ **Common Mistakes We Made**

1. **Client-side only validation** - Easily bypassed by malicious users
2. **Exposed sensitive data** - Full user objects in client state
3. **No input sanitization** - XSS vulnerabilities
4. **Weak authorization** - Role checks only on frontend
5. **Logging sensitive data** - Credentials and tokens in console

### ✅ **Best Practices Learned**

#### **Defense in Depth**

```typescript
// ✅ Validate on both client and server
const validateInput = (data: any) => {
  // Client-side validation for UX
  const clientValidation = validateOnClient(data)

  // Always validate on server too
  const serverValidation = await validateOnServer(data)

  return serverValidation // Server validation is authoritative
}
```

#### **Minimal Data Exposure**

```typescript
// ✅ Only expose what's needed
const sanitizeUser = (user: FullUser): PublicUser => ({
  id: user.id,
  name: user.name,
  role: user.role
  // Never expose: password, tokens, internal IDs
})
```

---

## 📚 **Testing Strategies**

### ❌ **Common Mistakes We Made**

1. **No error case testing** - Only tested happy paths
2. **Brittle tests** - Tests broke on UI changes
3. **No integration testing** - Components tested in isolation
4. **Missing edge cases** - Null/undefined values not tested
5. **No performance testing** - Slow queries not caught

### ✅ **Best Practices Learned**

#### **Test Error Scenarios**

```typescript
// ✅ Test error cases
describe('Menu API', () => {
  it('handles network errors gracefully', async () => {
    mockAPI.get.mockRejectedValue(new Error('Network error'))

    const result = await loadMenuItems()

    expect(result.success).toBe(false)
    expect(result.error).toBe('Failed to load menu items')
  })
})
```

#### **Integration Testing**

```tsx
// ✅ Test complete user flows
test('user can create menu item', async () => {
  render(<MenuManager />)

  // Click add button
  fireEvent.click(screen.getByText('Add Menu Item'))

  // Fill form
  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'Pizza' }
  })

  // Submit and verify
  fireEvent.click(screen.getByText('Submit'))

  await waitFor(() => {
    expect(screen.getByText('Pizza')).toBeInTheDocument()
  })
})
```

---

## 🎯 **Key Takeaways**

### **Architecture Principles**

1. **Fail gracefully** - Always have fallbacks and error boundaries
2. **Cache aggressively** - Reduce API calls with smart caching
3. **Validate everywhere** - Client UX, server security
4. **Compose, don't inherit** - Build flexible, reusable components
5. **Monitor everything** - Logs, metrics, and user feedback

### **Development Workflow**

1. **Start with types** - Define interfaces before implementation
2. **Build error states first** - Handle failures before success
3. **Test edge cases** - Null, empty, large data sets
4. **Document patterns** - Capture learnings for future use
5. **Review security** - Audit every external input

### **User Experience**

1. **Loading states matter** - Users need feedback during waits
2. **Errors should be actionable** - Tell users what they can do
3. **Performance is a feature** - Optimize for perceived speed
4. **Accessibility is not optional** - Build for all users
5. **Mobile-first** - Design for smallest screens first

---

## 🚀 **Usage Examples**

### **Quick Start with Universal Components**

```tsx
import {
  UniversalAuthProvider,
  UniversalForm,
  UniversalInput,
  UniversalButton,
  UniversalErrorBoundary
} from '@/components/universal'

function MyApp() {
  return (
    <UniversalAuthProvider
      config={{
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        heraApiBaseUrl: '/api/v1'
      }}
    >
      <UniversalErrorBoundary>
        <MyComponent />
      </UniversalErrorBoundary>
    </UniversalAuthProvider>
  )
}
```

### **Universal API Client**

```tsx
import { createUniversalAPIClient } from '@/components/universal'

const api = createUniversalAPIClient({
  baseUrl: '/api/v1',
  retries: { maxRetries: 3 },
  cache: { ttl: 30000 },
  onError: error => console.error('API Error:', error)
})

// Usage
const { success, data, error } = await api.get('/entities', {
  entity_type: 'menu_item'
})
```

---

By following these patterns, future HERA implementations will be more robust, maintainable, and user-friendly. Each pattern was learned through real-world issues and has been battle-tested in the restaurant system.
