/**
 * Component Test Template
 *
 * Description: Template for testing React components using React Testing Library.
 * Focuses on testing user behavior and interactions, not implementation details.
 *
 * Usage:
 * ```bash
 * cp docs/salon/examples/tests/component-test.test.tsx tests/unit/components/MyComponent.test.tsx
 * # Customize for your component
 * ```
 *
 * Features:
 * - React Testing Library setup
 * - User interaction testing
 * - Accessibility testing
 * - Mock dependencies (API, hooks, context)
 * - Async operation testing
 *
 * Related Documentation:
 * - /docs/salon/technical/TESTING.md - Complete testing guide
 * - React Testing Library: https://testing-library.com/docs/react-testing-library/intro
 *
 * @example
 * // Test a CustomerCard component
 * describe('CustomerCard', () => {
 *   it('should display customer information', () => {
 *     render(<CustomerCard customer={mockCustomer} />)
 *     expect(screen.getByText('John Doe')).toBeInTheDocument()
 *   })
 * })
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { axe, toHaveNoViolations } from 'jest-axe'

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations)

// ─────────────────────────────────────────────────────────────────────────────
// Import Component Under Test
// TODO: Replace with your actual component import
// ─────────────────────────────────────────────────────────────────────────────
import { MyComponent } from '@/components/salon/[feature]/MyComponent'

// ─────────────────────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────────────────────

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn()
  }),
  usePathname: () => '/salon/test',
  useSearchParams: () => new URLSearchParams()
}))

// Mock authentication context
vi.mock('@/components/auth/HERAAuthProvider', () => ({
  useHERAAuth: () => ({
    user: {
      id: 'user-123',
      email: 'test@example.com'
    },
    organization: {
      id: 'org-123',
      organization_name: 'Test Salon'
    },
    isAuthenticated: true,
    contextLoading: false,
    sessionType: 'real'
  })
}))

// Mock API client
vi.mock('@/lib/universal-api-v2-client', () => ({
  getEntities: vi.fn(),
  upsertEntity: vi.fn(),
  deleteEntity: vi.fn()
}))

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  }
}))

// ─────────────────────────────────────────────────────────────────────────────
// Test Data (Fixtures)
// ─────────────────────────────────────────────────────────────────────────────
const mockItem = {
  id: 'item-123',
  entity_type: 'CUSTOMER',
  entity_name: 'John Doe',
  entity_code: 'CUST-001',
  smart_code: 'HERA.SALON.CUSTOMER.v1',
  organization_id: 'org-123',
  status: 'active',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  dynamic_data: {
    phone: '+1 555 0100',
    email: 'john@example.com',
    address: '123 Main St'
  }
}

const mockItems = [
  mockItem,
  {
    id: 'item-456',
    entity_name: 'Jane Smith',
    entity_code: 'CUST-002',
    dynamic_data: {
      phone: '+1 555 0200',
      email: 'jane@example.com'
    }
  }
]

// ─────────────────────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────────────────────

// Create a wrapper with React Query provider
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry in tests
        cacheTime: 0  // Disable cache in tests
      }
    }
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

// Render component with all providers
function renderWithProviders(ui: React.ReactElement, options = {}) {
  return render(ui, {
    wrapper: createWrapper(),
    ...options
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────────────────────

describe('MyComponent', () => {
  // Setup before each test
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
  })

  // Cleanup after each test
  afterEach(() => {
    // Additional cleanup if needed
  })

  // ───────────────────────────────────────────────────────────────────────────
  // RENDERING TESTS
  // Test that component renders correctly with different props
  // ───────────────────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('should render component with basic props', () => {
      renderWithProviders(<MyComponent item={mockItem} />)

      // Check that key elements are present
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('+1 555 0100')).toBeInTheDocument()
    })

    it('should render loading state', () => {
      renderWithProviders(<MyComponent isLoading={true} />)

      // Check for loading indicators
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      // Or check for skeleton loaders
      expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument()
    })

    it('should render error state', () => {
      const errorMessage = 'Failed to load data'
      renderWithProviders(<MyComponent error={errorMessage} />)

      // Check for error message
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
      // Check for retry button
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('should render empty state', () => {
      renderWithProviders(<MyComponent items={[]} />)

      // Check for empty state message
      expect(screen.getByText(/no items/i)).toBeInTheDocument()
      // Check for action button
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument()
    })

    it('should render list of items', () => {
      renderWithProviders(<MyComponent items={mockItems} />)

      // Check that all items are rendered
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // USER INTERACTION TESTS
  // Test user interactions like clicks, typing, form submission
  // ───────────────────────────────────────────────────────────────────────────

  describe('User Interactions', () => {
    it('should handle button click', async () => {
      const handleClick = vi.fn()
      renderWithProviders(<MyComponent onClick={handleClick} />)

      // Click the button
      const button = screen.getByRole('button', { name: /action/i })
      fireEvent.click(button)

      // Verify callback was called
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should handle item click', async () => {
      const handleItemClick = vi.fn()
      renderWithProviders(
        <MyComponent items={mockItems} onItemClick={handleItemClick} />
      )

      // Click on first item
      const firstItem = screen.getByText('John Doe')
      fireEvent.click(firstItem)

      // Verify callback was called with correct ID
      expect(handleItemClick).toHaveBeenCalledWith('item-123')
    })

    it('should handle form input', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MyComponent />)

      // Type in input field
      const input = screen.getByLabelText(/name/i)
      await user.type(input, 'John Doe')

      // Verify input value
      expect(input).toHaveValue('John Doe')
    })

    it('should handle form submission', async () => {
      const handleSubmit = vi.fn()
      const user = userEvent.setup()
      renderWithProviders(<MyComponent onSubmit={handleSubmit} />)

      // Fill form
      await user.type(screen.getByLabelText(/name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)

      // Verify submit was called with correct data
      expect(handleSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com'
      })
    })

    it('should handle search input with debounce', async () => {
      const handleSearch = vi.fn()
      const user = userEvent.setup()
      renderWithProviders(<MyComponent onSearch={handleSearch} />)

      // Type in search input
      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'John')

      // Wait for debounce (300ms default)
      await waitFor(() => {
        expect(handleSearch).toHaveBeenCalledWith('John')
      }, { timeout: 500 })
    })

    it('should handle delete with confirmation', async () => {
      const handleDelete = vi.fn()
      const user = userEvent.setup()

      // Mock window.confirm
      vi.spyOn(window, 'confirm').mockReturnValue(true)

      renderWithProviders(
        <MyComponent item={mockItem} onDelete={handleDelete} />
      )

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      // Verify confirmation was shown
      expect(window.confirm).toHaveBeenCalled()

      // Verify delete was called
      expect(handleDelete).toHaveBeenCalledWith('item-123')
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // ASYNC OPERATION TESTS
  // Test async operations like API calls, data loading
  // ───────────────────────────────────────────────────────────────────────────

  describe('Async Operations', () => {
    it('should fetch and display data on mount', async () => {
      // Mock API response
      const { getEntities } = await import('@/lib/universal-api-v2-client')
      vi.mocked(getEntities).mockResolvedValue({ data: mockItems })

      renderWithProviders(<MyComponent />)

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Verify API was called
      expect(getEntities).toHaveBeenCalledWith('', expect.objectContaining({
        p_organization_id: 'org-123',
        p_entity_type: 'CUSTOMER'
      }))
    })

    it('should handle create operation', async () => {
      const { upsertEntity } = await import('@/lib/universal-api-v2-client')
      const { toast } = await import('sonner')

      vi.mocked(upsertEntity).mockResolvedValue({
        success: true,
        data: { id: 'new-item-123' }
      })

      const user = userEvent.setup()
      renderWithProviders(<MyComponent />)

      // Fill and submit form
      await user.type(screen.getByLabelText(/name/i), 'New Item')
      await user.click(screen.getByRole('button', { name: /create/i }))

      // Wait for API call to complete
      await waitFor(() => {
        expect(upsertEntity).toHaveBeenCalled()
      })

      // Verify success toast was shown
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringContaining('created')
        )
      })
    })

    it('should handle API error gracefully', async () => {
      const { getEntities } = await import('@/lib/universal-api-v2-client')
      const { toast } = await import('sonner')

      vi.mocked(getEntities).mockRejectedValue(new Error('Network error'))

      renderWithProviders(<MyComponent />)

      // Wait for error to be handled
      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
      })

      // Verify error toast was shown
      expect(toast.error).toHaveBeenCalled()
    })

    it('should show loading state during async operation', async () => {
      const { upsertEntity } = await import('@/lib/universal-api-v2-client')

      // Delay API response
      let resolveCreate: any
      vi.mocked(upsertEntity).mockImplementation(
        () => new Promise(resolve => { resolveCreate = resolve })
      )

      const user = userEvent.setup()
      renderWithProviders(<MyComponent />)

      // Trigger async operation
      await user.click(screen.getByRole('button', { name: /create/i }))

      // Check loading state
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create/i })).toBeDisabled()

      // Resolve API call
      resolveCreate({ success: true })

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
      })
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // ACCESSIBILITY TESTS
  // Test that component is accessible
  // ───────────────────────────────────────────────────────────────────────────

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = renderWithProviders(<MyComponent item={mockItem} />)

      // Run axe accessibility tests
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MyComponent items={mockItems} />)

      // Tab through interactive elements
      await user.tab()
      expect(screen.getByRole('button', { name: /create/i })).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('link', { name: /john doe/i })).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('button', { name: /edit/i })).toHaveFocus()
    })

    it('should have proper ARIA labels', () => {
      renderWithProviders(<MyComponent />)

      // Check for ARIA labels
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create/i })).toHaveAttribute('aria-label')
      expect(screen.getByRole('region', { name: /item list/i })).toBeInTheDocument()
    })

    it('should announce status changes to screen readers', async () => {
      const user = userEvent.setup()
      renderWithProviders(<MyComponent />)

      // Trigger action
      await user.click(screen.getByRole('button', { name: /create/i }))

      // Wait for status announcement
      await waitFor(() => {
        const liveRegion = screen.getByRole('status')
        expect(liveRegion).toHaveTextContent(/created successfully/i)
      })
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // RESPONSIVE DESIGN TESTS
  // Test mobile and desktop layouts
  // ───────────────────────────────────────────────────────────────────────────

  describe('Responsive Design', () => {
    it('should render mobile layout on small screens', () => {
      // Mock window.matchMedia for mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(max-width: 768px)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn()
        }))
      })

      renderWithProviders(<MyComponent items={mockItems} />)

      // Check for mobile-specific elements
      expect(screen.getByTestId('mobile-card')).toBeInTheDocument()
      expect(screen.queryByTestId('desktop-table')).not.toBeInTheDocument()
    })

    it('should have touch-friendly targets on mobile', () => {
      renderWithProviders(<MyComponent />)

      // Check minimum touch target size (44px)
      const button = screen.getByRole('button', { name: /action/i })
      const styles = window.getComputedStyle(button)

      expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44)
      expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // EDGE CASES AND ERROR HANDLING
  // Test unusual scenarios and error conditions
  // ───────────────────────────────────────────────────────────────────────────

  describe('Edge Cases', () => {
    it('should handle missing data gracefully', () => {
      renderWithProviders(<MyComponent item={null} />)

      // Check for fallback content
      expect(screen.getByText(/no data available/i)).toBeInTheDocument()
    })

    it('should handle very long item names', () => {
      const longName = 'A'.repeat(200)
      renderWithProviders(<MyComponent item={{ ...mockItem, entity_name: longName }} />)

      // Check that text is truncated
      const nameElement = screen.getByText(longName, { exact: false })
      expect(nameElement).toHaveClass('truncate')
    })

    it('should handle rapid clicks (prevent double submission)', async () => {
      const handleSubmit = vi.fn()
      const user = userEvent.setup()
      renderWithProviders(<MyComponent onSubmit={handleSubmit} />)

      const submitButton = screen.getByRole('button', { name: /submit/i })

      // Click multiple times rapidly
      await user.click(submitButton)
      await user.click(submitButton)
      await user.click(submitButton)

      // Should only submit once
      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledTimes(1)
      })
    })

    it('should handle concurrent updates correctly', async () => {
      // Test optimistic update rollback on error
      const { upsertEntity } = await import('@/lib/universal-api-v2-client')
      vi.mocked(upsertEntity).mockRejectedValue(new Error('Update failed'))

      const user = userEvent.setup()
      renderWithProviders(<MyComponent item={mockItem} />)

      const originalName = screen.getByText('John Doe')
      expect(originalName).toBeInTheDocument()

      // Trigger update
      await user.click(screen.getByRole('button', { name: /edit/i }))
      await user.clear(screen.getByLabelText(/name/i))
      await user.type(screen.getByLabelText(/name/i), 'Jane Doe')
      await user.click(screen.getByRole('button', { name: /save/i }))

      // Should show optimistic update
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()

      // Wait for error and rollback
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })
  })
})

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TESTING BEST PRACTICES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. TEST USER BEHAVIOR, NOT IMPLEMENTATION
 *    ✅ Good: expect(screen.getByText('John Doe')).toBeInTheDocument()
 *    ❌ Bad: expect(component.state.name).toBe('John Doe')
 *
 * 2. USE ACCESSIBLE QUERIES (Priority Order)
 *    1. getByRole (button, textbox, etc.)
 *    2. getByLabelText (form inputs)
 *    3. getByPlaceholderText (inputs)
 *    4. getByText (content)
 *    5. getByTestId (last resort)
 *
 * 3. AVOID TESTING IMPLEMENTATION DETAILS
 *    ✅ Good: Test that form submits correctly
 *    ❌ Bad: Test that useState was called
 *
 * 4. USE ASYNC UTILITIES FOR ASYNC OPERATIONS
 *    - Use waitFor() for assertions on async changes
 *    - Use findBy queries (built-in waitFor)
 *    - Don't use act() directly (testing library handles it)
 *
 * 5. MOCK EXTERNAL DEPENDENCIES
 *    - Mock API calls
 *    - Mock router navigation
 *    - Mock authentication context
 *    - Don't mock the component under test
 *
 * 6. TEST EDGE CASES
 *    - Empty states
 *    - Error states
 *    - Loading states
 *    - Very long text
 *    - Rapid interactions
 *
 * 7. TEST ACCESSIBILITY
 *    - Use jest-axe for automated checks
 *    - Test keyboard navigation
 *    - Test screen reader announcements
 *    - Check ARIA labels
 *
 * 8. KEEP TESTS ISOLATED
 *    - Each test should be independent
 *    - Clean up after each test
 *    - Don't rely on test execution order
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */
