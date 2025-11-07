# Testing Guide

**Complete reference for testing HERA Salon applications using Vitest, Playwright, and React Testing Library.**

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Pyramid](#testing-pyramid)
3. [Unit Testing with Vitest](#unit-testing-with-vitest)
4. [Component Testing](#component-testing)
5. [Integration Testing](#integration-testing)
6. [E2E Testing with Playwright](#e2e-testing-with-playwright)
7. [API Testing](#api-testing)
8. [Mobile Testing](#mobile-testing)
9. [Accessibility Testing](#accessibility-testing)
10. [Performance Testing](#performance-testing)
11. [Test Data Management](#test-data-management)
12. [Mocking & Stubbing](#mocking--stubbing)
13. [CI/CD Integration](#cicd-integration)
14. [Testing Best Practices](#testing-best-practices)

---

## Testing Philosophy

### Core Principles

**Test Behavior, Not Implementation:**
- Test what the user sees and does
- Avoid testing internal state or implementation details
- Focus on user stories and acceptance criteria

**Test Pyramid Strategy:**
- 70% Unit Tests - Fast, isolated, focused
- 20% Integration Tests - Component interactions
- 10% E2E Tests - Critical user journeys

**Continuous Testing:**
- Run tests automatically on every commit
- Fast feedback loop (< 2 minutes for unit tests)
- Pre-deployment gate (all tests must pass)

---

## Testing Pyramid

```
        /\
       /  \
      / E2E \         10% - Critical user journeys
     /--------\
    /          \
   / Integration \    20% - Component interactions
  /--------------\
 /                \
/   Unit Tests     \  70% - Business logic, utils, hooks
--------------------
```

### Test Coverage Targets

```typescript
export const COVERAGE_TARGETS = {
  statements: 80,    // 80% of statements covered
  branches: 75,      // 75% of branches covered
  functions: 80,     // 80% of functions covered
  lines: 80         // 80% of lines covered
}
```

---

## Unit Testing with Vitest

### Vitest Configuration

**`vitest.config.ts` - Complete setup:**

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/tests/e2e/**' // Use Playwright for E2E
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/',
        '**/.next/'
      ],
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/hooks': path.resolve(__dirname, './src/hooks')
    }
  }
})
```

### Test Setup File

**`tests/setup.ts` - Global test configuration:**

```typescript
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Clean up after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Mock window.matchMedia (for responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))
```

### Unit Test Examples

**Testing Pure Functions:**

```typescript
// tests/unit/lib/salon/availability.test.ts
import { describe, it, expect } from 'vitest'
import { checkSlotAvailability, calculateSlotScore } from '@/lib/salon/availability'

describe('Appointment Availability', () => {
  describe('checkSlotAvailability', () => {
    it('should return true for slot within working hours with no conflicts', () => {
      const slotStart = new Date('2025-09-01T10:00:00')
      const slotEnd = new Date('2025-09-01T11:00:00')
      const busyBlocks: Array<{ start: string; end: string }> = []
      const workingHours = { start: '09:00', end: '18:00' }

      expect(checkSlotAvailability(slotStart, slotEnd, busyBlocks, workingHours)).toBe(true)
    })

    it('should return false for slot outside working hours', () => {
      const slotStart = new Date('2025-09-01T08:00:00')
      const slotEnd = new Date('2025-09-01T09:00:00')
      const busyBlocks: Array<{ start: string; end: string }> = []
      const workingHours = { start: '09:00', end: '18:00' }

      expect(checkSlotAvailability(slotStart, slotEnd, busyBlocks, workingHours)).toBe(false)
    })

    it('should return false for slot overlapping with busy block', () => {
      const slotStart = new Date('2025-09-01T10:30:00')
      const slotEnd = new Date('2025-09-01T11:30:00')
      const busyBlocks = [
        { start: '2025-09-01T10:00:00Z', end: '2025-09-01T11:00:00Z' }
      ]
      const workingHours = { start: '09:00', end: '18:00' }

      expect(checkSlotAvailability(slotStart, slotEnd, busyBlocks, workingHours)).toBe(false)
    })
  })

  describe('calculateSlotScore', () => {
    it('should give higher score to morning slots when preferred', () => {
      const morningSlot = new Date('2025-09-01T10:00:00')
      const afternoonSlot = new Date('2025-09-01T14:00:00')
      const preferences = { preferMorning: true }
      const busyBlocks: Array<{ start: string; end: string; reason: string }> = []

      const morningScore = calculateSlotScore(morningSlot, preferences, busyBlocks)
      const afternoonScore = calculateSlotScore(afternoonSlot, preferences, busyBlocks)

      expect(morningScore).toBeGreaterThan(afternoonScore)
    })

    it('should clamp scores between 0 and 1', () => {
      const slot = new Date('2025-09-01T10:00:00')
      const preferences = { preferMorning: true, minimizeGaps: true }
      const busyBlocks: Array<{ start: string; end: string; reason: string }> = []

      const score = calculateSlotScore(slot, preferences, busyBlocks)

      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    })
  })
})
```

**Testing Utility Functions:**

```typescript
// tests/unit/lib/formatting.test.ts
import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, formatPhoneNumber } from '@/lib/formatting'

describe('Formatting Utilities', () => {
  describe('formatCurrency', () => {
    it('should format AED currency correctly', () => {
      expect(formatCurrency(1000, 'AED')).toBe('AED 1,000.00')
      expect(formatCurrency(1234.56, 'AED')).toBe('AED 1,234.56')
      expect(formatCurrency(0, 'AED')).toBe('AED 0.00')
    })

    it('should handle negative amounts', () => {
      expect(formatCurrency(-500, 'AED')).toBe('-AED 500.00')
    })

    it('should handle large numbers', () => {
      expect(formatCurrency(1000000, 'AED')).toBe('AED 1,000,000.00')
    })
  })

  describe('formatDate', () => {
    it('should format dates in DD/MM/YYYY format', () => {
      const date = new Date('2025-09-01T10:00:00')
      expect(formatDate(date)).toBe('01/09/2025')
    })

    it('should handle ISO string input', () => {
      expect(formatDate('2025-09-01T10:00:00Z')).toBe('01/09/2025')
    })
  })

  describe('formatPhoneNumber', () => {
    it('should format UAE phone numbers', () => {
      expect(formatPhoneNumber('0501234567')).toBe('+971 50 123 4567')
      expect(formatPhoneNumber('971501234567')).toBe('+971 50 123 4567')
    })

    it('should handle invalid input gracefully', () => {
      expect(formatPhoneNumber('')).toBe('')
      expect(formatPhoneNumber('abc')).toBe('abc')
    })
  })
})
```

### Running Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- availability.test.ts

# Run tests matching pattern
npm run test -- --grep "appointment"
```

---

## Component Testing

### React Testing Library Setup

**Testing React components with user interactions:**

```typescript
// tests/unit/components/CustomerCard.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CustomerCard } from '@/components/salon/customers/CustomerCard'

describe('CustomerCard', () => {
  const mockCustomer = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+971 50 123 4567',
    vip: true,
    loyalty_points: 150
  }

  it('should render customer information', () => {
    render(<CustomerCard customer={mockCustomer} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('+971 50 123 4567')).toBeInTheDocument()
  })

  it('should display VIP badge for VIP customers', () => {
    render(<CustomerCard customer={mockCustomer} />)

    expect(screen.getByText('VIP')).toBeInTheDocument()
  })

  it('should show loyalty points', () => {
    render(<CustomerCard customer={mockCustomer} />)

    expect(screen.getByText(/150 points/i)).toBeInTheDocument()
  })

  it('should call onClick handler when clicked', () => {
    const handleClick = vi.fn()
    render(<CustomerCard customer={mockCustomer} onClick={handleClick} />)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledWith(mockCustomer.id)
  })

  it('should show loading state', () => {
    render(<CustomerCard customer={mockCustomer} isLoading={true} />)

    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument()
  })

  it('should handle missing optional fields', () => {
    const minimalCustomer = {
      id: '2',
      name: 'Jane Doe',
      email: '',
      phone: '',
      vip: false,
      loyalty_points: 0
    }

    render(<CustomerCard customer={minimalCustomer} />)

    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.queryByText('VIP')).not.toBeInTheDocument()
  })
})
```

### Testing Hooks

```typescript
// tests/unit/hooks/useCustomers.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useHeraCustomers } from '@/hooks/useHeraCustomers'
import * as api from '@/lib/universal-api-v2-client'

// Mock API client
vi.mock('@/lib/universal-api-v2-client')

describe('useHeraCustomers', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  it('should fetch customers successfully', async () => {
    const mockCustomers = [
      { id: '1', name: 'Customer 1' },
      { id: '2', name: 'Customer 2' }
    ]

    vi.mocked(api.fetchCustomers).mockResolvedValue(mockCustomers)

    const { result } = renderHook(
      () => useHeraCustomers({ organizationId: 'org-1' }),
      { wrapper }
    )

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.customers).toEqual(mockCustomers)
    expect(result.current.error).toBeNull()
  })

  it('should handle fetch errors', async () => {
    const mockError = new Error('Failed to fetch')
    vi.mocked(api.fetchCustomers).mockRejectedValue(mockError)

    const { result } = renderHook(
      () => useHeraCustomers({ organizationId: 'org-1' }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.customers).toEqual([])
  })

  it('should create customer optimistically', async () => {
    const newCustomer = { name: 'New Customer', email: 'new@example.com' }

    const { result } = renderHook(
      () => useHeraCustomers({ organizationId: 'org-1' }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    result.current.createCustomer(newCustomer)

    // Should update immediately (optimistic)
    expect(result.current.isCreating).toBe(true)
  })
})
```

### Testing Modal Interactions

```typescript
// tests/unit/components/CustomerModal.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomerModal } from '@/components/salon/customers/CustomerModal'

describe('CustomerModal', () => {
  it('should render form fields', () => {
    render(
      <CustomerModal
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    )

    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Phone')).toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    const handleSubmit = vi.fn()
    render(
      <CustomerModal
        open={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />
    )

    const submitButton = screen.getByRole('button', { name: /submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
    })

    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('should submit valid data', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn()

    render(
      <CustomerModal
        open={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />
    )

    // Fill form
    await user.type(screen.getByLabelText('Name'), 'John Doe')
    await user.type(screen.getByLabelText('Email'), 'john@example.com')
    await user.type(screen.getByLabelText('Phone'), '0501234567')

    // Submit
    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '0501234567'
      })
    })
  })

  it('should close modal when cancel is clicked', async () => {
    const handleClose = vi.fn()
    render(
      <CustomerModal
        open={true}
        onClose={handleClose}
        onSubmit={vi.fn()}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(handleClose).toHaveBeenCalled()
  })
})
```

---

## Integration Testing

### Testing Component Integration

```typescript
// tests/integration/CustomerManagement.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CustomerManagementPage } from '@/app/salon/customers/page'
import * as api from '@/lib/universal-api-v2-client'

vi.mock('@/lib/universal-api-v2-client')

describe('Customer Management Integration', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    vi.mocked(api.fetchCustomers).mockResolvedValue([
      { id: '1', name: 'Customer 1', email: 'c1@example.com' },
      { id: '2', name: 'Customer 2', email: 'c2@example.com' }
    ])
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  it('should display customer list', async () => {
    render(<CustomerManagementPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Customer 1')).toBeInTheDocument()
      expect(screen.getByText('Customer 2')).toBeInTheDocument()
    })
  })

  it('should create new customer through full flow', async () => {
    const user = userEvent.setup()

    vi.mocked(api.createCustomer).mockResolvedValue({
      id: '3',
      name: 'New Customer',
      email: 'new@example.com'
    })

    render(<CustomerManagementPage />, { wrapper })

    // Wait for page load
    await waitFor(() => {
      expect(screen.getByText('Customer 1')).toBeInTheDocument()
    })

    // Click "Add Customer" button
    const addButton = screen.getByRole('button', { name: /add customer/i })
    await user.click(addButton)

    // Fill form in modal
    await user.type(screen.getByLabelText('Name'), 'New Customer')
    await user.type(screen.getByLabelText('Email'), 'new@example.com')

    // Submit
    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/customer created/i)).toBeInTheDocument()
    })

    // Should refetch and display new customer
    await waitFor(() => {
      expect(screen.getByText('New Customer')).toBeInTheDocument()
    })
  })

  it('should search customers', async () => {
    const user = userEvent.setup()
    render(<CustomerManagementPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Customer 1')).toBeInTheDocument()
    })

    // Type in search box
    const searchInput = screen.getByPlaceholderText(/search customers/i)
    await user.type(searchInput, 'Customer 1')

    // Should filter results
    await waitFor(() => {
      expect(screen.getByText('Customer 1')).toBeInTheDocument()
      expect(screen.queryByText('Customer 2')).not.toBeInTheDocument()
    })
  })

  it('should delete customer with confirmation', async () => {
    const user = userEvent.setup()

    vi.mocked(api.deleteCustomer).mockResolvedValue({ success: true })

    render(<CustomerManagementPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Customer 1')).toBeInTheDocument()
    })

    // Click delete button
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await user.click(deleteButtons[0])

    // Should show confirmation dialog
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument()

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    await user.click(confirmButton)

    // Should remove from list
    await waitFor(() => {
      expect(screen.queryByText('Customer 1')).not.toBeInTheDocument()
    })
  })
})
```

---

## E2E Testing with Playwright

### Playwright Configuration

**`playwright.config.ts` - Complete setup:**

```typescript
import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env') })

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/*.e2e.spec.ts', '**/*.spec.ts'],
  globalSetup: './tests/e2e/setup/global-setup.ts',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { outputFolder: 'tests/reports/html' }],
    ['list'],
    ['json', { outputFile: 'tests/reports/test-results.json' }],
    ['junit', { outputFile: 'tests/reports/junit.xml' }]
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 30000,

    // Authentication state
    storageState: 'tests/.auth/state.json',

    extraHTTPHeaders: {
      'x-organization-id': process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || 'demo-org-123',
      'x-test-environment': 'e2e'
    }
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },

    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    }
  ],

  webServer: {
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  }
})
```

### E2E Test Examples

**Dashboard E2E Tests:**

```typescript
// tests/e2e/salon/dashboard.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Salon Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/salon/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('should display dashboard with KPIs', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Dashboard')

    // Check KPI cards are visible
    await expect(page.getByText("Today's Appointments")).toBeVisible()
    await expect(page.getByText("Today's Revenue")).toBeVisible()
    await expect(page.getByText("Active Customers")).toBeVisible()
    await expect(page.getByText("Completed Services")).toBeVisible()
  })

  test('should navigate between time periods', async ({ page }) => {
    // Click "Last 7 Days" filter
    await page.getByRole('button', { name: /last 7 days/i }).click()

    // Wait for data to update
    await page.waitForLoadState('networkidle')

    // Should show updated data
    await expect(page.getByText(/last 7 days/i)).toBeVisible()
  })

  test('should show loading state then data', async ({ page }) => {
    // Should show skeleton loader initially
    const skeleton = page.locator('[data-testid="kpi-skeleton"]').first()
    if (await skeleton.isVisible()) {
      await expect(skeleton).toBeVisible()
    }

    // Wait for real data
    await page.waitForSelector('[data-testid="kpi-card"]', { timeout: 10000 })

    // Should display actual KPI values
    await expect(page.locator('[data-testid="kpi-card"]').first()).toBeVisible()
  })

  test('should navigate to appointments page', async ({ page }) => {
    await page.getByRole('link', { name: /appointments/i }).first().click()

    await page.waitForURL('**/appointments')
    expect(page.url()).toContain('/appointments')

    await expect(page.locator('h1')).toContainText('Appointments')
  })

  test('should display sidebar navigation', async ({ page }) => {
    await expect(page.getByText('Dashboard')).toBeVisible()
    await expect(page.getByText('Appointments')).toBeVisible()
    await expect(page.getByText('Customers')).toBeVisible()
    await expect(page.getByText('Point of Sale')).toBeVisible()
    await expect(page.getByText('Services')).toBeVisible()
    await expect(page.getByText('Products')).toBeVisible()
  })
})
```

**Customer CRUD E2E Tests:**

```typescript
// tests/e2e/salon/customers-crud.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Customer CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/salon/customers')
    await page.waitForLoadState('networkidle')
  })

  test('should create new customer', async ({ page }) => {
    // Click "Add Customer" button
    await page.getByRole('button', { name: /add customer/i }).click()

    // Fill form
    await page.getByLabel('Name').fill('Test Customer')
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Phone').fill('0501234567')

    // Submit
    await page.getByRole('button', { name: /submit/i }).click()

    // Wait for success message
    await expect(page.getByText(/customer created/i)).toBeVisible({ timeout: 10000 })

    // Should appear in list
    await expect(page.getByText('Test Customer')).toBeVisible()
  })

  test('should edit existing customer', async ({ page }) => {
    // Click first edit button
    await page.getByRole('button', { name: /edit/i }).first().click()

    // Update name
    const nameInput = page.getByLabel('Name')
    await nameInput.clear()
    await nameInput.fill('Updated Customer Name')

    // Submit
    await page.getByRole('button', { name: /save/i }).click()

    // Wait for success message
    await expect(page.getByText(/customer updated/i)).toBeVisible({ timeout: 10000 })

    // Should show updated name
    await expect(page.getByText('Updated Customer Name')).toBeVisible()
  })

  test('should search customers', async ({ page }) => {
    // Type in search box
    await page.getByPlaceholder(/search/i).fill('john')

    // Wait for filtered results
    await page.waitForTimeout(500) // Debounce

    // Should only show matching customers
    const customerCards = page.locator('[data-testid="customer-card"]')
    const count = await customerCards.count()

    // At least one result should contain "john"
    if (count > 0) {
      const firstCard = customerCards.first()
      await expect(firstCard).toContainText(/john/i)
    }
  })

  test('should delete customer with confirmation', async ({ page }) => {
    // Click first delete button
    await page.getByRole('button', { name: /delete/i }).first().click()

    // Confirmation dialog should appear
    await expect(page.getByText(/are you sure/i)).toBeVisible()

    // Confirm deletion
    await page.getByRole('button', { name: /confirm/i }).click()

    // Wait for success message
    await expect(page.getByText(/customer deleted/i)).toBeVisible({ timeout: 10000 })
  })

  test('should filter by VIP status', async ({ page }) => {
    // Click VIP filter toggle
    await page.getByRole('switch', { name: /vip only/i }).click()

    // Wait for filtered results
    await page.waitForLoadState('networkidle')

    // All visible customers should have VIP badge
    const vipBadges = page.locator('[data-testid="vip-badge"]')
    const customerCards = page.locator('[data-testid="customer-card"]')

    const badgeCount = await vipBadges.count()
    const cardCount = await customerCards.count()

    expect(badgeCount).toBe(cardCount)
  })
})
```

### Page Object Model (POM)

**Reusable page objects for cleaner tests:**

```typescript
// tests/e2e/pages/CustomerPage.ts
import { Page, Locator } from '@playwright/test'

export class CustomerPage {
  readonly page: Page
  readonly addCustomerButton: Locator
  readonly searchInput: Locator
  readonly customerCards: Locator
  readonly vipFilterToggle: Locator

  constructor(page: Page) {
    this.page = page
    this.addCustomerButton = page.getByRole('button', { name: /add customer/i })
    this.searchInput = page.getByPlaceholder(/search/i)
    this.customerCards = page.locator('[data-testid="customer-card"]')
    this.vipFilterToggle = page.getByRole('switch', { name: /vip only/i })
  }

  async goto() {
    await this.page.goto('/salon/customers')
    await this.page.waitForLoadState('networkidle')
  }

  async createCustomer(data: { name: string; email: string; phone: string }) {
    await this.addCustomerButton.click()

    await this.page.getByLabel('Name').fill(data.name)
    await this.page.getByLabel('Email').fill(data.email)
    await this.page.getByLabel('Phone').fill(data.phone)

    await this.page.getByRole('button', { name: /submit/i }).click()

    // Wait for success
    await this.page.waitForSelector('text=/customer created/i', { timeout: 10000 })
  }

  async searchCustomers(query: string) {
    await this.searchInput.fill(query)
    await this.page.waitForTimeout(500) // Debounce
  }

  async filterVIPOnly() {
    await this.vipFilterToggle.click()
    await this.page.waitForLoadState('networkidle')
  }

  async getCustomerCount(): Promise<number> {
    return await this.customerCards.count()
  }
}

// Usage in tests
test('should create customer using POM', async ({ page }) => {
  const customerPage = new CustomerPage(page)
  await customerPage.goto()

  await customerPage.createCustomer({
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '0501234567'
  })

  const count = await customerPage.getCustomerCount()
  expect(count).toBeGreaterThan(0)
})
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in headed mode (visible browser)
npm run test:e2e:headed

# Run specific test file
npm run test:e2e -- dashboard.spec.ts

# Run tests on specific browser
npm run test:e2e -- --project=chromium

# Run tests on mobile devices
npm run test:e2e:mobile

# Generate Playwright code (record interactions)
npm run test:e2e:codegen

# Show test report
npm run test:e2e:report
```

---

## API Testing

### Testing API Routes with Playwright

```typescript
// tests/api/customers.api.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Customers API', () => {
  let apiContext: any

  test.beforeAll(async ({ playwright }) => {
    apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'x-organization-id': 'test-org-123'
      }
    })
  })

  test.afterAll(async () => {
    await apiContext.dispose()
  })

  test('GET /api/v2/entities - should return customers', async () => {
    const response = await apiContext.get('/api/v2/entities', {
      params: {
        entity_type: 'CUSTOMER',
        organization_id: 'test-org-123'
      }
    })

    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body).toHaveProperty('data')
    expect(Array.isArray(body.data)).toBe(true)
  })

  test('POST /api/v2/entities - should create customer', async () => {
    const newCustomer = {
      entity_type: 'CUSTOMER',
      entity_name: 'API Test Customer',
      organization_id: 'test-org-123',
      smart_code: 'HERA.SALON.CUSTOMER.ENTITY.CUSTOMER.V1',
      dynamic_fields: {
        email: {
          value: 'api-test@example.com',
          type: 'text',
          smart_code: 'HERA.SALON.CUSTOMER.FIELD.EMAIL.V1'
        }
      }
    }

    const response = await apiContext.post('/api/v2/entities', {
      data: newCustomer
    })

    expect(response.status()).toBe(201)

    const body = await response.json()
    expect(body.data).toHaveProperty('id')
    expect(body.data.entity_name).toBe('API Test Customer')
  })

  test('PUT /api/v2/entities/:id - should update customer', async () => {
    // First create a customer
    const createResponse = await apiContext.post('/api/v2/entities', {
      data: {
        entity_type: 'CUSTOMER',
        entity_name: 'Update Test',
        organization_id: 'test-org-123',
        smart_code: 'HERA.SALON.CUSTOMER.ENTITY.CUSTOMER.V1'
      }
    })

    const { id } = await createResponse.json().then(r => r.data)

    // Update it
    const updateResponse = await apiContext.put(`/api/v2/entities/${id}`, {
      data: {
        entity_name: 'Updated Name',
        organization_id: 'test-org-123'
      }
    })

    expect(updateResponse.status()).toBe(200)

    const body = await updateResponse.json()
    expect(body.data.entity_name).toBe('Updated Name')
  })

  test('DELETE /api/v2/entities/:id - should delete customer', async () => {
    // First create a customer
    const createResponse = await apiContext.post('/api/v2/entities', {
      data: {
        entity_type: 'CUSTOMER',
        entity_name: 'Delete Test',
        organization_id: 'test-org-123',
        smart_code: 'HERA.SALON.CUSTOMER.ENTITY.CUSTOMER.V1'
      }
    })

    const { id } = await createResponse.json().then(r => r.data)

    // Delete it
    const deleteResponse = await apiContext.delete(`/api/v2/entities/${id}`, {
      params: { organization_id: 'test-org-123' }
    })

    expect(deleteResponse.status()).toBe(204)

    // Verify it's deleted
    const getResponse = await apiContext.get(`/api/v2/entities/${id}`, {
      params: { organization_id: 'test-org-123' }
    })

    expect(getResponse.status()).toBe(404)
  })

  test('should enforce organization isolation', async () => {
    // Try to access entity from different organization
    const response = await apiContext.get('/api/v2/entities', {
      params: {
        entity_type: 'CUSTOMER',
        organization_id: 'different-org-456'
      }
    })

    expect(response.status()).toBe(200)

    const body = await response.json()
    // Should not return data from test-org-123
    expect(body.data.length).toBe(0)
  })
})
```

---

## Mobile Testing

### Mobile-Specific Test Patterns

```typescript
// tests/e2e/mobile/salon-mobile.spec.ts
import { test, expect, devices } from '@playwright/test'

test.use(devices['iPhone 12'])

test.describe('Salon Mobile Experience', () => {
  test('should display mobile bottom navigation', async ({ page }) => {
    await page.goto('/salon/dashboard')

    // Desktop sidebar should be hidden
    const sidebar = page.locator('[data-testid="desktop-sidebar"]')
    await expect(sidebar).not.toBeVisible()

    // Mobile bottom nav should be visible
    const bottomNav = page.locator('[data-testid="mobile-bottom-nav"]')
    await expect(bottomNav).toBeVisible()

    // Check navigation items
    await expect(page.getByRole('link', { name: /home/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /appointments/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /pos/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /more/i })).toBeVisible()
  })

  test('should have touch-friendly tap targets', async ({ page }) => {
    await page.goto('/salon/customers')

    // Get first action button
    const actionButton = page.getByRole('button', { name: /add customer/i })

    // Check button size (minimum 44px for iOS)
    const box = await actionButton.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(44)
    expect(box?.width).toBeGreaterThanOrEqual(44)
  })

  test('should support swipe gestures on mobile', async ({ page }) => {
    await page.goto('/salon/appointments')

    // Get swipeable element
    const appointmentCard = page.locator('[data-testid="appointment-card"]').first()

    // Swipe left to reveal actions
    await appointmentCard.swipe('left')

    // Action buttons should appear
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible()
  })

  test('should display mobile header with hamburger menu', async ({ page }) => {
    await page.goto('/salon/dashboard')

    // Mobile header should be visible
    const mobileHeader = page.locator('[data-testid="mobile-header"]')
    await expect(mobileHeader).toBeVisible()

    // Hamburger menu button
    const menuButton = page.getByRole('button', { name: /menu/i })
    await expect(menuButton).toBeVisible()

    // Click to open menu
    await menuButton.click()

    // Navigation drawer should appear
    const drawer = page.locator('[data-testid="nav-drawer"]')
    await expect(drawer).toBeVisible()
  })

  test('should handle mobile viewport correctly', async ({ page }) => {
    await page.goto('/salon/dashboard')

    // Check viewport size
    const viewportSize = page.viewportSize()
    expect(viewportSize?.width).toBeLessThanOrEqual(768)

    // KPI cards should be in 2-column grid on mobile
    const kpiGrid = page.locator('[data-testid="kpi-grid"]')
    const computedStyle = await kpiGrid.evaluate(el =>
      window.getComputedStyle(el).gridTemplateColumns
    )

    // Should have 2 columns on mobile
    expect(computedStyle).toContain('2')
  })
})
```

---

## Accessibility Testing

### Axe Core Integration

```typescript
// tests/a11y/salon-accessibility.spec.ts
import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

test.describe('Salon Accessibility', () => {
  test('dashboard should have no accessibility violations', async ({ page }) => {
    await page.goto('/salon/dashboard')
    await injectAxe(page)

    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    })
  })

  test('customer form should be keyboard navigable', async ({ page }) => {
    await page.goto('/salon/customers')

    // Open modal
    await page.getByRole('button', { name: /add customer/i }).click()

    // Tab through form fields
    await page.keyboard.press('Tab')
    let focused = await page.evaluate(() => document.activeElement?.tagName)
    expect(focused).toBe('INPUT')

    await page.keyboard.press('Tab')
    focused = await page.evaluate(() => document.activeElement?.tagName)
    expect(focused).toBe('INPUT')

    // Should be able to submit with Enter
    await page.getByLabel('Name').fill('Test')
    await page.keyboard.press('Enter')
  })

  test('should support screen reader labels', async ({ page }) => {
    await page.goto('/salon/customers')

    // All interactive elements should have accessible names
    const addButton = page.getByRole('button', { name: /add customer/i })
    await expect(addButton).toHaveAccessibleName()

    const searchInput = page.getByRole('searchbox')
    await expect(searchInput).toHaveAccessibleName()
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/salon/dashboard')

    // Should have exactly one h1
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)

    // Headings should be in order (h1 > h2 > h3)
    const headings = await page.locator('h1, h2, h3').allTextContents()
    expect(headings.length).toBeGreaterThan(0)
  })

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/salon/dashboard')
    await injectAxe(page)

    await checkA11y(page, undefined, {
      rules: {
        'color-contrast': { enabled: true }
      }
    })
  })
})
```

---

## Performance Testing

### Lighthouse CI Configuration

**`.lighthouserc.json` - Performance budgets:**

```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/salon/dashboard",
        "http://localhost:3000/salon/appointments",
        "http://localhost:3000/salon/customers"
      ],
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop",
        "throttling": {
          "rttMs": 40,
          "throughputKbps": 10240,
          "cpuSlowdownMultiplier": 1
        }
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["warn", { "minScore": 0.95 }],
        "categories:seo": ["warn", { "minScore": 1.0 }],

        "first-contentful-paint": ["warn", { "maxNumericValue": 1500 }],
        "largest-contentful-paint": ["warn", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["warn", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["warn", { "maxNumericValue": 300 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### Running Performance Tests

```bash
# Run Lighthouse CI
npm run test:perf

# Run performance tests with Playwright
npm run test:e2e -- --grep @perf
```

---

## Test Data Management

### Test Fixtures

```typescript
// tests/fixtures/customers.ts
export const customerFixtures = {
  validCustomer: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+971 50 123 4567',
    vip: false,
    loyalty_points: 0
  },

  vipCustomer: {
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+971 50 234 5678',
    vip: true,
    loyalty_points: 500
  },

  customerWithoutEmail: {
    name: 'Bob Johnson',
    email: '',
    phone: '+971 50 345 6789',
    vip: false,
    loyalty_points: 0
  }
}

// Usage in tests
import { customerFixtures } from '@/tests/fixtures/customers'

test('should create VIP customer', async ({ page }) => {
  const customerPage = new CustomerPage(page)
  await customerPage.createCustomer(customerFixtures.vipCustomer)
})
```

### Database Seeding

```typescript
// tests/utils/seed.ts
import { apiV2 } from '@/lib/universal-api-v2-client'

export async function seedTestData(organizationId: string) {
  // Create test customers
  const customers = await Promise.all([
    apiV2.post('entities', {
      entity_type: 'CUSTOMER',
      entity_name: 'Test Customer 1',
      organization_id: organizationId,
      smart_code: 'HERA.SALON.CUSTOMER.ENTITY.CUSTOMER.V1'
    }),
    apiV2.post('entities', {
      entity_type: 'CUSTOMER',
      entity_name: 'Test Customer 2',
      organization_id: organizationId,
      smart_code: 'HERA.SALON.CUSTOMER.ENTITY.CUSTOMER.V1'
    })
  ])

  // Create test services
  const services = await Promise.all([
    apiV2.post('entities', {
      entity_type: 'SERVICE',
      entity_name: 'Haircut',
      organization_id: organizationId,
      smart_code: 'HERA.SALON.SERVICE.ENTITY.SERVICE.V1',
      dynamic_fields: {
        duration: { value: 60, type: 'number' },
        price: { value: 150, type: 'number' }
      }
    })
  ])

  return { customers, services }
}

export async function cleanupTestData(organizationId: string) {
  // Delete all test entities
  await apiV2.delete('entities', {
    organization_id: organizationId,
    entity_type: 'CUSTOMER',
    where: { entity_name: { $like: 'Test%' } }
  })
}
```

---

## Mocking & Stubbing

### MSW (Mock Service Worker)

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock customers API
  http.get('/api/v2/entities', ({ request }) => {
    const url = new URL(request.url)
    const entityType = url.searchParams.get('entity_type')

    if (entityType === 'CUSTOMER') {
      return HttpResponse.json({
        data: [
          { id: '1', entity_name: 'Mock Customer 1', email: 'mock1@example.com' },
          { id: '2', entity_name: 'Mock Customer 2', email: 'mock2@example.com' }
        ]
      })
    }
  }),

  // Mock create customer
  http.post('/api/v2/entities', async ({ request }) => {
    const body = await request.json()

    return HttpResponse.json({
      data: {
        id: 'new-id',
        ...body
      }
    }, { status: 201 })
  })
]

// tests/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)

// tests/setup.ts
import { server } from './mocks/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: tests/reports/
          retention-days: 30

  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Run Lighthouse CI
        run: npm run test:perf
```

---

## Testing Best Practices

### DO's and DON'Ts

```typescript
// ✅ DO - Test user behavior
test('should allow user to create customer', async ({ page }) => {
  await page.getByRole('button', { name: /add customer/i }).click()
  await page.getByLabel('Name').fill('John Doe')
  await page.getByRole('button', { name: /submit/i }).click()

  await expect(page.getByText('Customer created')).toBeVisible()
})

// ❌ DON'T - Test implementation details
test('should call createCustomer function', async () => {
  const spy = vi.spyOn(component, 'createCustomer')
  component.handleSubmit()
  expect(spy).toHaveBeenCalled()
})

// ✅ DO - Use semantic queries
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText('Email')
screen.getByText('Customer created')

// ❌ DON'T - Use fragile selectors
document.querySelector('.btn-primary')
document.getElementById('submit-btn')

// ✅ DO - Test accessibility
await expect(page.getByRole('button', { name: /submit/i })).toBeEnabled()
await expect(page.getByLabel('Name')).toHaveAccessibleName()

// ❌ DON'T - Ignore accessibility
await page.click('.submit-button')

// ✅ DO - Use Page Object Model for complex flows
const customerPage = new CustomerPage(page)
await customerPage.createCustomer({ name: 'John', email: 'john@example.com' })

// ❌ DON'T - Repeat complex interactions
await page.click('#add-button')
await page.fill('#name', 'John')
await page.fill('#email', 'john@example.com')
await page.click('#submit')
```

### Test Naming Conventions

```typescript
// ✅ GOOD - Descriptive test names
describe('Customer Management', () => {
  it('should display list of customers on page load', () => {})
  it('should create new customer when form is submitted', () => {})
  it('should show error message when email is invalid', () => {})
  it('should filter customers by VIP status when toggle is clicked', () => {})
})

// ❌ BAD - Vague test names
describe('Customers', () => {
  it('works', () => {})
  it('test 1', () => {})
  it('should work correctly', () => {})
})
```

---

## Testing Checklist

### Before Every PR

- [ ] ✅ All unit tests pass (`npm run test`)
- [ ] ✅ All E2E tests pass (`npm run test:e2e`)
- [ ] ✅ Test coverage >= 80%
- [ ] ✅ New features have tests
- [ ] ✅ Bug fixes have regression tests
- [ ] ✅ Accessibility tests pass
- [ ] ✅ Mobile tests pass
- [ ] ✅ Performance tests pass (Lighthouse > 90)
- [ ] ✅ No skipped or focused tests (`.only`, `.skip`)

---

## Related Documentation

- **Performance Guide**: `/docs/salon/technical/PERFORMANCE.md`
- **Mobile Layout**: `/docs/salon/technical/MOBILE-LAYOUT.md`
- **Shared Components**: `/docs/salon/technical/SHARED-COMPONENTS.md`
- **Hooks Reference**: `/docs/salon/technical/HOOKS.md`
- **API Routes**: `/docs/salon/technical/API-ROUTES.md` (upcoming)

---

**Test everything. Test often. Test with confidence.**
